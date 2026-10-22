// Canal « agent » : envoi des fiches mission au personnel (canal principal). Accusé de réception OBLIGATOIRE : le suivi relance
// l'agent tant qu'il n'a pas accusé. Selon l'équipement :
//   telephone  → fiche complète sur l'application de l'agent (transport « app » injecté) ;
//   oreillette / talkie → texte court lisible à voix haute (transport « voix » injecté : synthèse vocale ou relais radio du PC) ;
// repli : si le transport principal échoue, on tente l'autre ; si tout échoue (hors réseau), la fiche reste imprimable
// (`ficheImprimable`) pour être remise en main propre par le chef de sécurité. Aucun envoi réel ici : les transports sont injectés.
import { zoneDe } from '../missions.ts';
import type { Agent, Canal, Destinataire, Mission, Notification, ResultatEnvoi, Sorties } from '../types.ts';
import { tronquer } from '../validation.ts';

export const TITRE_MISSION = 'Mission du lieu';

export type Transport = (charge: { agent: Agent; mission: Mission; notification: Notification; texte: string }) => Promise<ResultatEnvoi>;

const URGENCE = { 1: 'urgence', 2: 'important', 3: 'info' } as const;

/** Convertit une mission en notification + destinataire, pour passer par la même file, les mêmes accusés et les mêmes relances. */
export function missionEnNotification(m: Mission, a: Agent, sorties: Sorties, expire_s = 3600): { notification: Notification; destinataire: Destinataire } {
  return {
    destinataire: {
      id: a.id,
      zone: zoneDe(a, sorties) ?? a.poste.porte ?? 'poste',
      niveau: a.poste.niveau,
      pmr: false,
      langue: 'fr',
      canal_prefere: 'agent',
    },
    notification: {
      id: m.id,
      destinataire_id: a.id,
      titre: TITRE_MISSION,
      corps: tronquer(m.texte_radio, 160),
      consigne: {
        porte: m.porte_a_garder?.porte ?? 'poste',
        chemin: [m.se_tenir],
        etape_suivante: m.phrase_megaphone,
        niveau_urgence: URGENCE[m.priorite],
        expire_s,
      },
      emis_a: m.emis_a,
    },
  };
}

/** Fiche en texte brut, sans mise en forme, imprimable ou dictable : le mode dégradé hors réseau. */
export function ficheImprimable(m: Mission): string {
  const h = `${String(Math.floor(m.heure_effet_min / 60)).padStart(2, '0')}h${String(m.heure_effet_min % 60).padStart(2, '0')}`;
  return [
    `Fiche mission ${m.agent_id} (${m.role}) - priorité ${m.priorite} - effet à ${h}`,
    `Poste : ${m.se_tenir}`,
    m.porte_a_garder ? `Porte à garder : ${m.porte_a_garder.porte}, ${m.porte_a_garder.etat === 'fermee' ? 'fermée' : 'ouverte'}` : '',
    ...m.dirige.map((d) => `Diriger ${d.zone} : ${d.vers}`),
    `Au mégaphone : ${m.phrase_megaphone}`,
    `Personnes à mobilité réduite : ${m.role_pmr}`,
    `Relève : ${m.releve}`,
    m.appeler.length ? `Appeler : ${m.appeler.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface OptionsCanalAgent {
  transportApp?: Transport;
  transportVoix?: Transport;
}

export interface CanalAgent extends Canal {
  /** À appeler avant l'envoi : associe notifications, missions et agents. */
  enregistrer(missions: readonly Mission[], agents: readonly Agent[]): void;
  /** Fiches des agents qu'aucun transport n'a pu joindre : à imprimer et remettre en main propre. */
  fichesAImprimer(): string[];
}

export function creerCanalAgent(options: OptionsCanalAgent = {}): CanalAgent {
  const missions = new Map<string, Mission>();
  const agents = new Map<string, Agent>();
  const horsReseau = new Set<string>();
  return {
    nom: 'agent',
    enregistrer(ms, as) {
      for (const m of ms) missions.set(m.id, m);
      for (const a of as) agents.set(a.id, a);
    },
    fichesAImprimer: () => [...horsReseau].map((id) => missions.get(id)).filter((m): m is Mission => !!m).map(ficheImprimable),
    async envoyer(notification, destinataire) {
      const mission = missions.get(notification.id);
      const agent = agents.get(destinataire.id);
      if (!mission || !agent) return { ok: false, erreur: 'mission_inconnue' };
      const vocal = agent.equipement !== 'telephone';
      const essais: [Transport | undefined, string][] = vocal
        ? [[options.transportVoix, mission.texte_radio], [options.transportApp, mission.texte_radio]]
        : [[options.transportApp, ficheImprimable(mission)], [options.transportVoix, mission.texte_radio]];
      for (const [transport, texte] of essais) {
        if (!transport) continue;
        try {
          const r = await transport({ agent, mission, notification, texte });
          if (r.ok) {
            horsReseau.delete(mission.id);
            return r;
          }
        } catch {
          // on tente le transport de repli
        }
      }
      horsReseau.add(mission.id);
      return { ok: false, erreur: 'hors_reseau', detail: 'fiche à imprimer et remettre en main propre' };
    },
  };
}
