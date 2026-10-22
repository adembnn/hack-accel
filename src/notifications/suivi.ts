// Suivi des envois : file avec priorité et expiration, limite de débit, idempotence (une notification = un identifiant, jamais de doublon),
// accusés de réception, relance si pas d'accusé, taux de remise par zone. Le temps est injecté (`maintenant`) : tests déterministes.
import type { Canal, Destinataire, NiveauUrgence, NomCanal, Notification } from './types.ts';

export type Statut = 'en_file' | 'envoyee' | 'remise' | 'ackee' | 'expiree' | 'echec';

export interface Entree {
  notification: Notification;
  destinataire: Destinataire;
  statut: Statut;
  tentatives: number;
  dernier_envoi?: number;
  erreur?: string;
  ordre: number;
}

export interface OptionsSuivi {
  canaux: Partial<Record<NomCanal, Canal>>;
  /** Canal tenté si le canal préféré échoue. */
  canalRepli?: NomCanal;
  maintenant?: () => number;
  /** Relancer si pas d'accusé après ce délai (secondes). Défaut 30. */
  delaiRelanceS?: number;
  /** Nombre maximal de relances pour le public. Défaut 2. */
  maxRelances?: number;
  /** Nombre maximal de relances pour le personnel (accusé obligatoire). Défaut 10. */
  maxRelancesAgent?: number;
  /** Envois par seconde au plus. Défaut 200. */
  debitMaxParS?: number;
}

export interface TauxZone {
  destinataires: number;
  envoyees: number;
  remises: number;
  ackees: number;
  taux_remise: number;
  taux_ack: number;
}

const RANG: Record<NiveauUrgence, number> = { urgence: 0, important: 1, info: 2 };

export interface Suivi {
  soumettre(notifications: readonly Notification[], destinataires: readonly Destinataire[]): { acceptees: number; doublons: number };
  /** Envoie ce que le débit permet, par priorité, en laissant les expirées de côté. */
  traiter(): Promise<{ envoyees: number; expirees: number; restantes: number }>;
  /** Remet en file ce qui n'a pas reçu d'accusé dans le délai. */
  relancer(): number;
  accuser(notificationId: string): boolean;
  /** Ce qu'un téléphone ou la PWA lit (consigne en attente) ; marque comme remises les notifications lues. */
  lire(destinataireId: string): Notification[];
  entree(notificationId: string): Entree | undefined;
  sansAccuse(): string[];
  tauxParZone(): Record<string, TauxZone>;
}

export function creerSuivi(options: OptionsSuivi): Suivi {
  const maintenant = options.maintenant ?? Date.now;
  const delai = (options.delaiRelanceS ?? 30) * 1000;
  const maxRelances = options.maxRelances ?? 2;
  const maxRelancesAgent = options.maxRelancesAgent ?? 10;
  const debit = Math.max(1, options.debitMaxParS ?? 200);
  const entrees = new Map<string, Entree>();
  const parDestinataire = new Map<string, string[]>();
  let ordre = 0;
  let jetons = debit;
  let dernierRecharge = maintenant();

  const expiree = (e: Entree, t: number): boolean => t >= e.notification.emis_a + e.notification.consigne.expire_s * 1000;
  const relancesMax = (e: Entree): number => (e.destinataire.canal_prefere === 'agent' ? maxRelancesAgent : maxRelances);

  async function envoyer(e: Entree): Promise<void> {
    const t = maintenant();
    e.tentatives += 1;
    e.dernier_envoi = t;
    const noms: NomCanal[] = [e.destinataire.canal_prefere];
    if (options.canalRepli && options.canalRepli !== e.destinataire.canal_prefere) noms.push(options.canalRepli);
    for (const nom of noms) {
      const canal = options.canaux[nom];
      if (!canal) {
        e.erreur = `canal_absent:${nom}`;
        continue;
      }
      try {
        const r = await canal.envoyer(e.notification, e.destinataire);
        if (r.ok) {
          e.erreur = undefined;
          if (e.statut !== 'ackee') e.statut = r.remis ? 'remise' : 'envoyee';
          return;
        }
        e.erreur = r.erreur ?? 'echec';
      } catch {
        e.erreur = 'exception_canal';
      }
    }
    if (e.statut !== 'ackee') e.statut = 'echec';
  }

  return {
    soumettre(notifications, destinataires) {
      const parId = new Map(destinataires.map((d) => [d.id, d]));
      let acceptees = 0;
      let doublons = 0;
      for (const n of notifications) {
        const d = parId.get(n.destinataire_id);
        if (!d) continue;
        if (entrees.has(n.id)) {
          doublons += 1;
          continue;
        }
        entrees.set(n.id, { notification: n, destinataire: d, statut: 'en_file', tentatives: 0, ordre: ordre++ });
        const l = parDestinataire.get(d.id) ?? [];
        l.push(n.id);
        parDestinataire.set(d.id, l);
        acceptees += 1;
      }
      return { acceptees, doublons };
    },

    async traiter() {
      const t = maintenant();
      jetons = Math.min(debit, jetons + ((t - dernierRecharge) / 1000) * debit);
      dernierRecharge = t;
      const attente = [...entrees.values()].filter((e) => e.statut === 'en_file');
      let expirees = 0;
      const valides: Entree[] = [];
      for (const e of attente) {
        if (expiree(e, t)) {
          e.statut = 'expiree';
          expirees += 1;
        } else valides.push(e);
      }
      valides.sort((a, b) => RANG[a.notification.consigne.niveau_urgence] - RANG[b.notification.consigne.niveau_urgence] || a.notification.emis_a - b.notification.emis_a || a.ordre - b.ordre);
      const lot = valides.slice(0, Math.floor(jetons));
      jetons -= lot.length;
      await Promise.all(lot.map(envoyer));
      return { envoyees: lot.length, expirees, restantes: valides.length - lot.length };
    },

    relancer() {
      const t = maintenant();
      let n = 0;
      for (const e of entrees.values()) {
        if (e.statut !== 'envoyee' && e.statut !== 'remise' && e.statut !== 'echec') continue;
        if (e.notification.ack || expiree(e, t)) continue;
        if (e.dernier_envoi === undefined || t - e.dernier_envoi < delai) continue;
        if (e.tentatives - 1 >= relancesMax(e)) continue;
        e.statut = 'en_file';
        n += 1;
      }
      return n;
    },

    accuser(id) {
      const e = entrees.get(id);
      if (!e) return false;
      e.notification.ack = true;
      e.statut = 'ackee';
      return true;
    },

    lire(destinataireId) {
      const t = maintenant();
      const sortie: Notification[] = [];
      for (const id of parDestinataire.get(destinataireId) ?? []) {
        const e = entrees.get(id)!;
        if (e.statut === 'expiree' || expiree(e, t)) continue;
        if (e.statut === 'en_file' || e.statut === 'envoyee' || e.statut === 'echec') e.statut = 'remise';
        sortie.push(e.notification);
      }
      return sortie.sort((a, b) => RANG[a.consigne.niveau_urgence] - RANG[b.consigne.niveau_urgence] || b.emis_a - a.emis_a);
    },

    entree: (id) => entrees.get(id),

    sansAccuse() {
      return [...entrees.values()].filter((e) => e.statut !== 'ackee' && e.statut !== 'expiree').map((e) => e.notification.id);
    },

    tauxParZone() {
      const zones: Record<string, TauxZone> = {};
      for (const e of entrees.values()) {
        const z = (zones[e.destinataire.zone] ??= { destinataires: 0, envoyees: 0, remises: 0, ackees: 0, taux_remise: 0, taux_ack: 0 });
        z.destinataires += 1;
        if (e.statut === 'envoyee' || e.statut === 'remise' || e.statut === 'ackee') z.envoyees += 1;
        if (e.statut === 'remise' || e.statut === 'ackee') z.remises += 1;
        if (e.statut === 'ackee') z.ackees += 1;
      }
      for (const z of Object.values(zones)) {
        z.taux_remise = z.destinataires ? z.remises / z.destinataires : 0;
        z.taux_ack = z.destinataires ? z.ackees / z.destinataires : 0;
      }
      return zones;
    },
  };
}
