// Garde-fous du module : le texte libre n'est JAMAIS exécuté ni interprété (c'est une donnée), il est nettoyé et tronqué ;
// les zones et portes doivent être connues ; une consigne qui enferme ou empêche de sortir est refusée.
import type { ActionDecision, ContexteIncident, Decision, Destinataire, Langue, NomCanal, Sorties } from './types.ts';

export const CORPS_MAX = 160;
export const TITRE_FR = 'Message du lieu';
export const TITRE_EN = 'Message from the venue';

export const ACTIONS: readonly ActionDecision[] = ['evacuer', 'confiner', 'informer'];
export const CONTEXTES: readonly ContexteIncident[] = ['incendie', 'securite', 'autre'];
export const CANAUX: readonly NomCanal[] = ['console', 'telephone-simule', 'web-push', 'wallet', 'sms'];

// Ce module n'est PAS une alerte d'État : ces mots (et leurs variantes) ne doivent jamais apparaître dans un message.
const INTERDITS =
  /alerte\s+officielle|official\s+alert|fr[\s-]?alert|cell\s*broadcast|alerte\s+(nationale|gouvernementale|pr[ée]fectorale)|government\s+alert|alarme\s+g[ée]n[ée]rale/i;

export class ErreurDecision extends Error {
  raisons: string[];
  constructor(raisons: string[]) {
    super(`Décision refusée : ${raisons.join(' ; ')}`);
    this.name = 'ErreurDecision';
    this.raisons = raisons;
  }
}

/** Coupe à `max` caractères, de préférence à la fin d'un mot, sans laisser de ponctuation pendante. */
export function tronquer(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max);
  const dernierEspace = coupe.lastIndexOf(' ');
  const base = dernierEspace > max * 0.6 ? coupe.slice(0, dernierEspace) : coupe;
  return base.replace(/[\s,;:(-]+$/, '').trimEnd();
}

/**
 * Nettoie un texte libre venu d'un décideur ou d'un utilisateur : retire caractères de contrôle, balises, liens, modèles `${…}`
 * et crochets de code ; adoucit les cris (majuscules de 4 lettres ou plus, points d'exclamation). Le résultat reste une chaîne inerte.
 */
export function nettoyerTexte(brut: unknown, max = CORPS_MAX): string {
  if (typeof brut !== 'string') return '';
  let t = brut.slice(0, 2000);
  // eslint-disable-next-line no-control-regex, no-irregular-whitespace
  t = t.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ');
  t = t.replace(/<[^>]*>?/g, ' ').replace(/[<>`{}[\]\\]/g, ' ');
  t = t.replace(/\$\s*\(/g, ' ').replace(/(https?:\/\/|www\.)\S+/gi, ' ');
  t = t.replace(/!+/g, '.');
  t = t.replace(/\p{Lu}{4,}/gu, (m) => m.charAt(0) + m.slice(1).toLowerCase());
  t = t.replace(/\s+/g, ' ').trim();
  return tronquer(t, max);
}

export function contientInterdit(texte: string): boolean {
  return INTERDITS.test(texte);
}

function suitesDeChiffres(texte: string): string[] {
  return texte.match(/\d+/g) ?? [];
}

/** Chiffres du texte qui ne viennent d'aucune des sources (données du lieu et du billet). Doit être vide. */
export function chiffresInventes(texte: string, sources: readonly string[]): string[] {
  const permis = new Set(sources.flatMap(suitesDeChiffres));
  return suitesDeChiffres(texte).filter((c) => !permis.has(c));
}

/** Vrai si le corps respecte la longueur, n'imite pas une alerte d'État et ne crie pas. */
export function estSur(corps: string): boolean {
  return corps.length <= CORPS_MAX && !contientInterdit(corps) && !/\p{Lu}{4,}/u.test(corps) && !corps.includes('!');
}

export function porteOuverte(decision: Decision, porte: string): boolean {
  return decision.portes?.[porte] !== 'fermee';
}

export interface Diagnostic {
  erreurs: string[];
  avertissements: string[];
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Vérifie la décision contre les données du lieu. Refuse (erreurs) : action ou contexte inconnu, zone ou porte inconnue,
 * toutes les portes fermées, zone sans sortie ouverte pendant une évacuation, consigne vers une porte fermée ou bloquée,
 * confinement en incendie. Les messages de zone qui contiennent un terme interdit sont écartés (avertissements).
 */
export function validerDecision(decision: Decision, sorties: Sorties): Diagnostic {
  const erreurs: string[] = [];
  const avertissements: string[] = [];
  if (!estObjet(decision)) return { erreurs: ['décision absente ou illisible'], avertissements };
  if (!ACTIONS.includes(decision.action)) erreurs.push(`action inconnue : ${String(decision.action).slice(0, 30)}`);
  const contexte = decision.contexte ?? 'autre';
  if (!CONTEXTES.includes(contexte)) erreurs.push(`contexte inconnu : ${String(contexte).slice(0, 30)}`);
  const portesConnues = new Set(sorties.portes);
  const portes = decision.portes ?? {};
  for (const [p, etat] of Object.entries(portes)) {
    if (!portesConnues.has(p)) erreurs.push(`porte inconnue : ${p.slice(0, 40)}`);
    if (etat !== 'ouverte' && etat !== 'fermee') erreurs.push(`état de porte invalide pour ${p.slice(0, 40)}`);
  }
  for (const [zone, c] of Object.entries(decision.consignes_par_zone ?? {})) {
    const nom = zone.slice(0, 40);
    if (!(zone in sorties.zones)) erreurs.push(`zone inconnue : ${nom}`);
    if (!c || !portesConnues.has(c.porte)) erreurs.push(`consigne de ${nom} : porte inconnue`);
    else if (portes[c.porte] === 'fermee') erreurs.push(`consigne de ${nom} : renvoie vers la porte fermée ${c.porte}`);
    else if (c.clarte === 'bloquee') erreurs.push(`consigne de ${nom} : renvoie vers la porte bloquée ${c.porte}`);
    if (c && c.clarte !== undefined && !['claire', 'encombree', 'bloquee'].includes(c.clarte)) erreurs.push(`clarté invalide pour ${nom}`);
  }
  for (const [zone, m] of Object.entries(decision.messages_par_zone ?? {})) {
    if (!(zone in sorties.zones)) erreurs.push(`zone inconnue (message) : ${zone.slice(0, 40)}`);
    else if (typeof m === 'string' && contientInterdit(m)) avertissements.push(`message de ${zone} écarté : terme interdit`);
  }
  for (const zone of decision.confinement?.zones ?? []) {
    if (!(zone in sorties.zones)) erreurs.push(`zone inconnue (confinement) : ${String(zone).slice(0, 40)}`);
  }

  const confine = decision.action === 'confiner' || decision.confinement?.actif === true;
  if (confine && contexte === 'incendie') erreurs.push('confinement refusé en incendie : il empêche de sortir');
  if (decision.action !== 'informer') {
    const toutes = sorties.portes;
    if (toutes.length > 0 && toutes.every((p) => portes[p] === 'fermee')) erreurs.push('toutes les portes sont fermées : la consigne empêcherait de sortir');
    if (decision.action === 'evacuer') {
      for (const [zone, z] of Object.entries(sorties.zones)) {
        if (!z.portes.some((p) => portes[p] !== 'fermee')) erreurs.push(`zone ${zone} sans sortie ouverte`);
      }
    }
  }
  return { erreurs, avertissements };
}

/** Lit un destinataire venu du réseau : refuse tout ce qui n'a pas la bonne forme (aucune valeur n'est exécutée). */
export function lireDestinataire(brut: unknown): Destinataire {
  if (!estObjet(brut)) throw new ErreurDecision(['destinataire illisible']);
  const chaine = (v: unknown, nom: string, max = 64): string => {
    if (typeof v !== 'string' || v === '' || v.length > max) throw new ErreurDecision([`destinataire.${nom} invalide`]);
    return v;
  };
  const id = chaine(brut.id, 'id');
  if (!/^[\w.:@-]+$/.test(id)) throw new ErreurDecision(['destinataire.id : caractères non permis']);
  const langue = brut.langue;
  if (langue !== 'fr' && langue !== 'en') throw new ErreurDecision([`destinataire ${id} : langue fr ou en attendue`]);
  const canal = brut.canal_prefere;
  if (!CANAUX.includes(canal as NomCanal)) throw new ErreurDecision([`destinataire ${id} : canal inconnu`]);
  let billet: Destinataire['billet'];
  if (brut.billet !== undefined) {
    if (!estObjet(brut.billet)) throw new ErreurDecision([`destinataire ${id} : billet illisible`]);
    billet = {
      salle: chaine(brut.billet.salle, 'billet.salle'),
      rang: chaine(brut.billet.rang, 'billet.rang', 8),
      place: chaine(brut.billet.place, 'billet.place', 8),
    };
  }
  return {
    id,
    billet,
    zone: chaine(brut.zone, 'zone'),
    niveau: chaine(brut.niveau, 'niveau', 8),
    pmr: brut.pmr === true,
    langue: langue as Langue,
    canal_prefere: canal as NomCanal,
  };
}
