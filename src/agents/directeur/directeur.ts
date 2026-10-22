// Directeur : le directeur donne en une phrase (voix ou texte) plusieurs ordres précis (groupes, sorties nommées,
// délais « dans 5 minutes », questions d'état). Deux interpréteurs : des RÈGLES déterministes (secours, sans clé) et
// Claude Sonnet 5.5 (sortie structurée, appel payant sous garde). Tout ordre passe par le même filtre de validation.
// Entrées : traiterOrdre(texte, contexte) (pure, règles), traiterOrdreAuto (async, Claude si autorisé), routeDirecteur (HTTP).
//
// Un seul fichier : le tsconfig du socle n'autorise pas encore les imports en « .ts » (allowImportingTsExtensions, ajouté par
// lot/decideurs). Une fois ce réglage fusionné, ce fichier se redécoupe sans changement de code (les sections ci-dessous).
import type { IncomingMessage, ServerResponse } from 'node:http';

// ===== Types et bornes ============================================================================
// Types du directeur : ordres donnés en une phrase (voix ou texte), contexte connu de la scène, résultat.
// Les états et types de contrainte reprennent src/scene/contrainte.ts (proto/jumeau-3d) ; les clés de portes reprennent
// PORTES de src/agents/types.ts (lot/decideurs). Ils sont recopiés ici pour ne pas dépendre d'un lot non fusionné.

export type TypeContrainte = 'porte' | 'sortie' | 'bouche_metro' | 'escalier' | 'escalator' | 'ascenseur' | 'barrage';
export type EtatContrainte = 'ouverte' | 'fermee' | 'bloquee';

// Le menu : rien d'autre ne peut sortir de ce module.
export const TYPES_ORDRE = ['zone_poser', 'zone_lever', 'levier', 'bouches_toutes', 'ascenseurs', 'escalators', 'evacuer', 'conseil', 'etat'] as const;
export type TypeOrdre = (typeof TYPES_ORDRE)[number];

export const ACTIONS_LEVIER = ['fermer', 'ouvrir', 'agent', 'annonce', 'filtrer'] as const;
export type ActionLevier = (typeof ACTIONS_LEVIER)[number];
export const CODES_ZONE = ['D1', 'D2'] as const; // D1 manifestation, D2 troubles (catalogue-contraintes.md)
export type CodeZone = (typeof CODES_ZONE)[number];

// Valeurs qui règlent le comportement : un seul endroit.
export const BORNES = { delai_max_s: 3600, ordres_max: 20, texte_max: 2000, corps_max: 200_000, claude_delai_ms: 12_000 } as const;

// Clés de portes du lot decideurs, indexées par le nom canonique de la porte de la scène.
export const CLES_PORTES: Readonly<Record<string, string>> = {
  'porte lescot': 'lescot', 'porte berger': 'berger', 'porte rambuteau': 'rambuteau', 'porte pont neuf': 'pont_neuf',
  'porte saint eustache': 'saint_eustache', 'porte jour': 'jour', 'porte louvre': 'louvre',
  'porte marguerite navarre': 'marguerite_de_navarre',
};

export interface Ordre {
  type: TypeOrdre;
  cible: string | null; // nom exact pris dans le contexte (lieu ou levier), null si l'ordre vise tout
  delai_s: number; // 0 = tout de suite
  params: Record<string, unknown>;
}

export interface LevierContexte { nom: string; id?: string; type?: TypeContrainte; etat?: string }
export interface Contexte {
  lieux: string[];
  leviers: (string | LevierContexte)[];
  etat?: string; // phrase d'état fournie par la simulation, lue telle quelle pour répondre aux questions d'état
}

export interface Resultat {
  ordres: Ordre[];
  reponse: string; // construite à partir des ordres validés, jamais copiée du texte d'un modèle
  refus?: boolean;
  incompris?: string[];
  questions?: string[];
}

// Ce qu'un interpréteur (règles ou Claude) propose avant validation.
export interface OrdreBrut {
  type: string;
  cible?: string | null;
  action?: string | null;
  code?: string | null;
  delai_s?: number | null;
}

// ===== Normalisation du texte =====================================================================
// Normalisation de la langue parlée et appariement de noms (« porte du Pont Neuf » = « Porte Pont-Neuf »).

const MOTS_VIDES = new Set(['le', 'la', 'les', 'l', 'du', 'de', 'des', 'd', 'un', 'une', 'au', 'aux']);

export function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`,;:.?!-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const singulier = (w: string): string => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

/** Forme de comparaison : sans accents, articles ni pluriels, « sortie de secours » ramenée à « issue ». */
export function canon(s: string): string {
  const t = normaliser(s).split(' ').filter((w) => w && !MOTS_VIDES.has(w)).map(singulier).join(' ');
  return t.replace(/\b(?:sortie|issue) secour\b/g, 'issue');
}

/** Position du groupe de mots `aiguille` dans `texte` (mots entiers), -1 s'il est absent. */
export function position(texte: string, aiguille: string): number {
  if (!aiguille) return -1;
  return (' ' + texte + ' ').indexOf(' ' + aiguille + ' ');
}

export const contient = (texte: string, re: string): boolean => new RegExp('\\b(?:' + re + ')').test(texte);

// ===== Contexte (lieux et leviers connus) =========================================================
// Le contexte (listes de noms envoyées par la scène) mis sous une forme cherchable.

export type Genre = 'porte' | 'issue' | 'metro' | 'ascenseur' | 'autre';
export interface Entite {
  nom: string;
  canon: string;
  base: string; // canon sans numéro final (« issue cote piscine » pour « issue cote piscine 2 »)
  numerote: boolean;
  genre: Genre;
  type: TypeContrainte;
  id?: string;
  etat?: string;
}
export interface Univers { lieux: Entite[]; leviers: Entite[]; etat?: string }

const GENRES: Record<string, [Genre, TypeContrainte]> = {
  porte: ['porte', 'porte'], issue: ['issue', 'sortie'], metro: ['metro', 'bouche_metro'], ascenseur: ['ascenseur', 'ascenseur'],
};

function entite(nom: string, extra: Partial<Pick<Entite, 'id' | 'etat'>> & { type?: TypeContrainte } = {}): Entite {
  const c = canon(nom);
  const [genre, type] = GENRES[c.split(' ')[0] ?? ''] ?? ['autre', 'barrage' as TypeContrainte];
  const numerote = /^.+ \d+$/.test(c);
  return { nom, canon: c, base: numerote ? c.replace(/ \d+$/, '') : c, numerote, genre, type: extra.type ?? type, id: extra.id, etat: extra.etat };
}

export function construireUnivers(ctx: Contexte): Univers {
  return {
    lieux: ctx.lieux.map((n) => entite(n)),
    leviers: ctx.leviers.map((l) => (typeof l === 'string' ? entite(l) : entite(l.nom, l))),
    etat: ctx.etat,
  };
}

/** Normalise un contexte reçu du réseau : tableaux bornés, chaînes seulement. Renvoie null s'il est inutilisable. */
export function lireContexte(brut: unknown): Contexte | null {
  if (typeof brut !== 'object' || brut === null) return null;
  const o = brut as Record<string, unknown>;
  if (!Array.isArray(o.lieux) || !Array.isArray(o.leviers) || o.lieux.length > 2000 || o.leviers.length > 2000) return null;
  const lieux = o.lieux.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200));
  const leviers = o.leviers.flatMap((x): (string | { nom: string; id?: string; etat?: string })[] => {
    if (typeof x === 'string') return [x.slice(0, 200)];
    if (typeof x === 'object' && x !== null && typeof (x as { nom?: unknown }).nom === 'string') {
      const l = x as { nom: string; id?: unknown; etat?: unknown };
      return [{ nom: l.nom.slice(0, 200), ...(typeof l.id === 'string' ? { id: l.id.slice(0, 100) } : {}), ...(typeof l.etat === 'string' ? { etat: l.etat.slice(0, 50) } : {}) }];
    }
    return [];
  });
  return { lieux, leviers, etat: typeof o.etat === 'string' ? o.etat.slice(0, 1000) : undefined };
}

export const trouver = (liste: Entite[], nom: string | null | undefined): Entite | null =>
  nom ? liste.find((e) => e.canon === canon(nom)) ?? null : null;

// ===== Validation, refus et réponse ===============================================================
// Le filtre commun aux deux interpréteurs : tout ordre passe ici, rien ne sort qui ne soit au menu,
// sur une cible connue, avec un délai borné. Puis la réponse est rédigée à partir des seuls ordres validés.

// Consignes de type attaque ou mise en danger du public : refusées en bloc, quel que soit l'interpréteur.
const MOTIFS_ATTAQUE =
  'attaqu|attentat|terroris|bombe|explosi|piege|gaz toxique|gazer|mettre le feu|incendier|tuer|blesser|massacr|fusill|tirer sur|poignard|couteau|arme[sz]? |prendre en otage|' +
  'enferm|coincer|nuire|faire du mal|bousculade|provoquer .*(panique|mouvement de foule|ecrasement)|empech\\w* .*sortir|sans (qu ils|qu elles) puissent sortir';
const MOTIF_TOUT_FERMER = 'ferm\\w* (?:toutes?|tous) (?:les )?(?:portes?|sorties?|issues?)';

export function estAttaque(texte: string): boolean {
  const b = normaliser(texte);
  return contient(b, MOTIFS_ATTAQUE) || contient(b, MOTIF_TOUT_FERMER);
}

const REFUS =
  'Je ne peux pas exécuter cette consigne : elle mettrait le public en danger. Je ne produis que des ordres de sécurité (fermer ou rouvrir une sortie, guider, évacuer).';
export const reponseRefus = (): string => REFUS;

export interface Validation { ordres: Ordre[]; rejets: string[]; refus: boolean }

const ETAT_DE: Partial<Record<ActionLevier, 'fermee' | 'ouverte'>> = { fermer: 'fermee', ouvrir: 'ouverte' };

export function validerOrdres(bruts: OrdreBrut[], u: Univers): Validation {
  const ordres: Ordre[] = [];
  const rejets: string[] = [];
  for (const b of bruts) {
    if (ordres.length >= BORNES.ordres_max) { rejets.push(`plus de ${BORNES.ordres_max} ordres : le reste est ignoré`); break; }
    const o = valider(b, u, rejets);
    if (o) ordres.push(o);
  }
  // Fermer en même temps toutes les portes et issues piégerait le public : refus, comme une consigne d'attaque.
  const sorties = u.leviers.filter((e) => e.genre === 'porte' || e.genre === 'issue');
  const fermees = new Set(ordres.filter((o) => o.type === 'levier' && o.params.action === 'fermer' && o.delai_s === 0).map((o) => o.cible));
  if (sorties.length >= 2 && sorties.every((e) => fermees.has(e.nom))) return { ordres: [], rejets: ['toutes les sorties fermées à la fois'], refus: true };
  return { ordres, rejets, refus: false };
}

function valider(b: OrdreBrut, u: Univers, rejets: string[]): Ordre | null {
  const type = b.type as TypeOrdre;
  if (!TYPES_ORDRE.includes(type)) { rejets.push(`type d'ordre hors menu : ${String(b.type)}`); return null; }
  const d = b.delai_s ?? 0;
  if (typeof d !== 'number' || !Number.isFinite(d) || d < 0 || d > BORNES.delai_max_s) {
    rejets.push(`délai hors bornes (0 à ${BORNES.delai_max_s} s) : ${String(b.delai_s)}`);
    return null;
  }
  const delai_s = Math.round(d);
  const fait = (cible: string | null, params: Record<string, unknown> = {}): Ordre => ({ type, cible, delai_s, params });
  const lieu = (): Entite | null | undefined => (b.cible ? trouver(u.lieux, b.cible) : undefined);
  const action = b.action ?? null;

  switch (type) {
    case 'zone_poser': {
      const l = lieu();
      const code = (b.code ?? 'D1') as CodeZone;
      if (!l) { rejets.push(`lieu inconnu : ${String(b.cible)}`); return null; }
      if (!CODES_ZONE.includes(code)) { rejets.push(`code de zone inconnu : ${String(b.code)}`); return null; }
      return fait(l.nom, { code });
    }
    case 'zone_lever': {
      const l = lieu();
      if (l === null) { rejets.push(`lieu inconnu : ${String(b.cible)}`); return null; }
      if (b.code && !CODES_ZONE.includes(b.code as CodeZone)) { rejets.push(`code de zone inconnu : ${b.code}`); return null; }
      return fait(l?.nom ?? null, { code: b.code ?? null });
    }
    case 'levier': {
      const e = trouver(u.leviers, b.cible);
      if (!e) { rejets.push(`levier inconnu : ${String(b.cible)}`); return null; }
      if (!ACTIONS_LEVIER.includes(action as ActionLevier)) { rejets.push(`action hors menu : ${String(action)}`); return null; }
      const a = action as ActionLevier;
      if (!ETAT_DE[a] && e.genre !== 'porte' && e.genre !== 'issue') { rejets.push(`${a} ne s'applique pas à ${e.nom}`); return null; }
      return fait(e.nom, {
        action: a, etat_cible: ETAT_DE[a] ?? null, type_contrainte: e.type,
        ...(e.id ? { id: e.id } : {}), ...(CLES_PORTES[e.canon] ? { cle_porte: CLES_PORTES[e.canon] } : {}),
      });
    }
    case 'bouches_toutes':
      if (action !== 'fermer' && action !== 'ouvrir') { rejets.push(`action hors menu : ${String(action)}`); return null; }
      return fait(null, { action, etat_cible: ETAT_DE[action], type_contrainte: 'bouche_metro' });
    case 'ascenseurs': {
      if (action !== 'fermer' && action !== 'ouvrir') { rejets.push(`action hors menu : ${String(action)}`); return null; }
      const l = b.cible ? trouver(u.lieux, b.cible) ?? trouver(u.leviers, b.cible) : undefined;
      if (l === null) { rejets.push(`lieu inconnu : ${String(b.cible)}`); return null; }
      return fait(l?.nom ?? null, { action, etat_cible: ETAT_DE[action], type_contrainte: 'ascenseur' });
    }
    case 'escalators':
      if (action !== 'arreter' && action !== 'remettre') { rejets.push(`action hors menu : ${String(action)}`); return null; }
      return fait(null, { action, etat_cible: action === 'arreter' ? 'fermee' : 'ouverte', type_contrainte: 'escalator' });
    case 'etat': {
      const e = b.cible ? trouver(u.leviers, b.cible) : undefined;
      if (e === null) { rejets.push(`levier inconnu : ${String(b.cible)}`); return null; }
      return fait(e?.nom ?? null, { sujet: e ? 'levier' : 'global' });
    }
    case 'evacuer':
    case 'conseil':
      return fait(null);
  }
}

export function formaterDelai(s: number): string {
  if (s < 60) return `${s} seconde${s > 1 ? 's' : ''}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (s < 3600 || r) return r ? `${m} min ${r} s` : `${m} minute${m > 1 ? 's' : ''}`;
  return s === 3600 ? '1 heure' : `${s / 3600} heures`;
}

/** Réponse à une question d'état : lue dans le contexte fourni par la simulation, jamais inventée. */
function direEtat(o: Ordre, u: Univers): string {
  if (o.cible) {
    const e = trouver(u.leviers, o.cible);
    return e?.etat ? `${o.cible} : ${e.etat}.` : `Je n'ai pas l'état de ${o.cible} dans les données reçues.`;
  }
  const avecEtat = u.leviers.filter((e) => e.etat);
  const fermes = avecEtat.filter((e) => /ferm|bloqu/.test(normaliser(e.etat ?? '')));
  const parts: string[] = [];
  if (u.etat) parts.push(`État : ${u.etat}.`);
  if (avecEtat.length) {
    parts.push(`${fermes.length} levier${fermes.length > 1 ? 's' : ''} fermé${fermes.length > 1 ? 's' : ''} sur ${avecEtat.length}${fermes.length ? ' : ' + fermes.map((e) => e.nom).join(', ') : ''}.`);
  }
  return parts.join(' ') || "Je n'ai pas d'état de la simulation à vous donner.";
}

const NOM_ZONE: Record<string, string> = { D1: 'manifestation', D2: 'troubles' };
const PHRASE_LEVIER: Record<ActionLevier, string> = {
  fermer: 'fermeture', ouvrir: 'réouverture', agent: 'agent posté, il guide le public vers cette sortie',
  annonce: 'annonce diffusée, sortir par ici', filtrer: 'filtrage, débit réduit',
};

export function rediger(ordres: Ordre[], u: Univers, incompris: string[], questions: string[]): string {
  const dans = (o: Ordre): string => (o.delai_s > 0 ? ` dans ${formaterDelai(o.delai_s)}` : '');
  const phrases = ordres.map((o): string => {
    const p = o.params;
    switch (o.type) {
      case 'zone_poser': return `${o.cible} : ${NOM_ZONE[String(p.code)]} signalée${dans(o)}.`;
      case 'zone_lever': return `${o.cible ?? 'Toutes les zones'} : zone levée${dans(o)}.`;
      case 'levier': return `${o.cible} : ${PHRASE_LEVIER[p.action as ActionLevier]}${dans(o)}.`;
      case 'bouches_toutes': return `Bouches de métro et RER : ${p.action === 'fermer' ? 'fermeture' : 'réouverture'}${dans(o)}.`;
      case 'ascenseurs':
        return `Ascenseurs${o.cible ? ' près de ' + o.cible : ''} : ${p.action === 'fermer' ? 'hors service, les personnes à mobilité réduite attendent les secours' : 'remis en service'}${dans(o)}.`;
      case 'escalators': return `Escalators : ${p.action === 'arreter' ? "arrêt, ils servent d'escaliers" : 'remise en marche'}${dans(o)}.`;
      case 'evacuer': return `Évacuation lancée${dans(o)}.`;
      case 'conseil': return 'Demande de conseil transmise au moteur de décision.';
      case 'etat': return direEtat(o, u);
    }
  });
  incompris.forEach((t) => phrases.push(`Je n'ai pas reconnu « ${t} ».`));
  phrases.push(...questions);
  return phrases.join(' ') || "Je n'ai pas compris l'ordre.";
}

// ===== Interpréteur par règles ====================================================================
// Interpréteur par règles : déterministe, sans clé, sans réseau. C'est le secours de l'interpréteur Claude
// et la référence des tests. Il ne produit que des ordres bruts : le filtre de valider.ts a le dernier mot.

export interface Interpretation { ordres: OrdreBrut[]; incompris: string[]; questions: string[] }

// --- délais : « dans 5 minutes », « dans un quart d'heure », « dans trente secondes » ---
const NOMBRES: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, quatrevingt: 80,
};
const UNITES: Record<string, number> = { s: 1, sec: 1, seconde: 1, secondes: 1, min: 60, mins: 60, minute: 60, minutes: 60, h: 3600, heure: 3600, heures: 3600 };
const DEBUT_DELAI = '(?:dans|d ici|apres|au bout de)';

function lireNombre(mots: string): number | null {
  if (/^\d+$/.test(mots)) return Number(mots);
  const m = mots.replace(/quatre vingt/g, 'quatrevingt').split(' ');
  if (!m.every((w) => w in NOMBRES)) return null;
  return m.reduce((s, w) => s + (NOMBRES[w] ?? 0), 0);
}

/** Extrait le délai (en secondes) d'une proposition normalisée, et renvoie la proposition sans lui. */
export function extraireDelai(brut: string): { delai: number | null; reste: string } {
  let m = new RegExp(`\\b${DEBUT_DELAI} (?:un )?quart d heure\\b`).exec(brut);
  if (m) return { delai: 900, reste: brut.replace(m[0], ' ') };
  m = new RegExp(`\\b${DEBUT_DELAI} (?:une )?demi heure\\b`).exec(brut);
  if (m) return { delai: 1800, reste: brut.replace(m[0], ' ') };
  m = new RegExp(`\\b${DEBUT_DELAI} ((?:\\d+|[a-z]+(?: [a-z]+){0,2}?)) ?(secondes?|sec|minutes?|mins?|heures?|h|s)\\b`).exec(brut);
  if (m) {
    const n = lireNombre(m[1] ?? '');
    const u = UNITES[m[2] ?? ''];
    const lettre = m[2] === 's' || m[2] === 'h';
    if (n !== null && u && !(lettre && !/^\d+$/.test(m[1] ?? ''))) return { delai: n * u, reste: brut.replace(m[0], ' ') };
  }
  m = /\b(?:tout de suite|immediatement|maintenant|sur le champ)\b/.exec(brut);
  if (m) return { delai: 0, reste: brut.replace(m[0], ' ') };
  return { delai: null, reste: brut };
}

// --- recherche des lieux et des leviers dans une proposition ---
const TYPES_VOIE = new Set(['rue', 'boulevard', 'place', 'allee', 'passage', 'square', 'avenue', 'quai', 'impasse', 'cour', 'cite', 'porte', 'sortie', 'entree', 'acces', 'galerie', 'village']);

/** Le lieu cité le plus tôt. `voie` : on préfère une rue à une porte (zones) ; sinon l'inverse (ascenseurs). */
function trouverLieu(k: string, lieux: Entite[], voie: boolean): Entite | null {
  const classes = lieux.flatMap((l) => {
    const i = position(k, l.canon);
    if (i >= 0) return [{ l, i, plein: 1, porte: l.genre === 'porte' ? 1 : 0 }];
    const mots = l.canon.split(' ');
    const court = mots.length > 1 && TYPES_VOIE.has(mots[0] ?? '') ? mots.slice(1).join(' ') : '';
    const j = court.length >= 4 ? position(k, court) : -1;
    return j >= 0 ? [{ l, i: j, plein: 0, porte: l.genre === 'porte' ? 1 : 0 }] : [];
  });
  classes.sort((a, b) => b.plein - a.plein || (voie ? a.porte - b.porte : b.porte - a.porte) || a.i - b.i || b.l.canon.length - a.l.canon.length);
  return classes[0]?.l ?? null;
}

/** Les leviers nommés : noms exacts d'abord, sinon toute la famille numérotée (« les trois issues côté piscine »). */
function trouverLeviers(k: string, leviers: Entite[], avecAscenseurs: boolean): Entite[] {
  const pool = leviers.filter((e) => avecAscenseurs || e.genre !== 'ascenseur');
  const exacts = pool.filter((e) => position(k, e.canon) >= 0);
  const gardes = exacts.filter((e) => !exacts.some((f) => f !== e && f.canon.length > e.canon.length && position(f.canon, e.canon) >= 0));
  const bases = new Set<string>();
  for (const e of pool) {
    if (e.numerote && e.genre !== 'ascenseur' && position(k, e.base) >= 0 && !gardes.some((g) => g.base === e.base)) bases.add(e.base);
  }
  return [...gardes, ...pool.filter((e) => e.numerote && bases.has(e.base))];
}

function verbeLevier(b: string): ActionLevier | null {
  if (contient(b, 'agent|steward|vigile|securite|guide|poste')) return 'agent';
  if (contient(b, 'annonce|diffus|sono|sort par|sortez par|sortir par|sortent par|dirige|orient')) return 'annonce';
  if (contient(b, 'rouvr|reouvr|ouvre|ouvrez|ouvrir|ouvert|debloqu|libere')) return 'ouvrir';
  if (contient(b, 'ferm|bloqu|condamn|barr')) return 'fermer';
  if (contient(b, 'filtr|regul|limit')) return 'filtrer';
  return null;
}

const MOT_ZONE_D1 = 'manif|cortege|rassemblement|attroupement';
const MOT_ZONE_D2 = 'trouble|casseur|affrontement|bagarre|degradation|violence';
const GROUPE_QUI_ARRIVE = /\b(?:groupe|supporters?|foule|manifestants?)\b.*\b(?:arriv|vient|viennent|approch|se dirige)/;
const FIN = 'arret|stop|retir|leve[rz]?|lever|termin|disperse|dispersee|enleve|supprim|fini|partie?s?|annule';

interface Clause { original: string; b: string; k: string; delai: number | null; verbe: ActionLevier | null; cibles: Entite[] }

// Les noms qui contiennent une virgule (« Issue nord, Rambuteau ») ne doivent pas être coupés en deux.
function proteger(texte: string, u: Univers): string {
  let t = texte;
  for (const e of [...u.leviers, ...u.lieux]) {
    if (/[,;:.]/.test(e.nom)) t = t.replace(new RegExp(e.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), e.nom.replace(/[,;:.]/g, ' '));
  }
  return t;
}

function decouper(texte: string): string[] {
  return texte.toLowerCase().split(/[,.;:?!\n]|\s+et\s+|\s+puis\s+|\s+mais\s+|\s+alors\s+|\s+ensuite\s+/).map((s) => s.trim()).filter(Boolean);
}

export function interpreterRegles(texte: string, u: Univers): Interpretation {
  const clauses: Clause[] = decouper(proteger(texte, u)).map((original) => {
    const { delai, reste } = extraireDelai(normaliser(original));
    const k = canon(reste);
    return { original, b: reste, k, delai, verbe: verbeLevier(reste), cibles: trouverLeviers(k, u.leviers, false) };
  });
  // Un levier cité sans verbe prend celui de la proposition « annonce » qui le précède, sinon de la suivante qui en a un.
  clauses.forEach((c, i) => {
    if (!c.cibles.length || c.verbe) return;
    const avant = clauses[i - 1];
    if (avant?.verbe && !avant.cibles.length) c.verbe = avant.verbe;
    else c.verbe = clauses.slice(i + 1).find((d) => d.verbe)?.verbe ?? null;
  });

  const ordres: OrdreBrut[] = [];
  const incompris: string[] = [];
  const questions: string[] = [];
  let conseil = false;
  let zoneEnAttente: CodeZone | null = null;
  let delaiReporte: number | null = null;

  for (const c of clauses) {
    const { b, k } = c;
    const avant = ordres.length;
    const delai = c.delai ?? delaiReporte ?? 0;
    const ajouter = (o: Omit<OrdreBrut, 'delai_s'>): void => { ordres.push({ ...o, delai_s: delai }); };
    const question = contient(b, 'que faire|quoi faire|qu est ce qu on fait|on fait quoi|comment on|recommand|conseil|meilleur|propos');
    if (question) conseil = true;
    const intention: CodeZone | null = zoneEnAttente;
    zoneEnAttente = null;

    if (contient(b, 'combien|situation|ou en est|ou en sommes|l etat|bilan|statut|point de') || (c.cibles.length === 1 && contient(b, 'est ce que|est elle|est il'))) {
      ajouter({ type: 'etat', cible: c.cibles.length === 1 ? c.cibles[0]?.nom ?? null : null });
    } else if (contient(b, FIN) && contient(b, MOT_ZONE_D1 + '|' + MOT_ZONE_D2 + '|zone')) {
      ajouter({ type: 'zone_lever', cible: trouverLieu(k, u.lieux, true)?.nom ?? null, code: contient(b, 'trouble|casseur') ? 'D2' : contient(b, MOT_ZONE_D1) ? 'D1' : null });
    } else if (contient(b, 'ascenseurs?')) {
      const ferme = !contient(b, 'rouvr|reouvr|remet|remarch|repar|fonctionne a nouveau|en service');
      const nommes = trouverLeviers(k, u.leviers, true).filter((e) => e.genre === 'ascenseur');
      if (nommes.length) nommes.forEach((e) => ajouter({ type: 'levier', cible: e.nom, action: ferme ? 'fermer' : 'ouvrir' }));
      else ajouter({ type: 'ascenseurs', action: ferme ? 'fermer' : 'ouvrir', cible: trouverLieu(k, u.lieux, false)?.nom ?? null });
    } else if (contient(b, 'escalators?|escaliers? mecaniques?')) {
      ajouter({ type: 'escalators', action: contient(b, 'rouvr|remet|redemar|remarch|repar|en marche') ? 'remettre' : 'arreter' });
    } else if (contient(b, MOT_ZONE_D1) || GROUPE_QUI_ARRIVE.test(b) || contient(b, MOT_ZONE_D2)) {
      const code = contient(b, MOT_ZONE_D2) ? 'D2' : 'D1';
      const lieu = trouverLieu(k, u.lieux, true);
      if (lieu) ajouter({ type: 'zone_poser', cible: lieu.nom, code });
      else zoneEnAttente = code;
    } else if (!c.cibles.length && contient(b, 'stations?|metro|rer|bouches?') && contient(b, 'ferm|coup|rouvr|reouvr|ouvr')) {
      ajouter({ type: 'bouches_toutes', action: contient(b, 'rouvr|reouvr|ouvr') ? 'ouvrir' : 'fermer' });
    } else if (c.cibles.length) {
      if (c.verbe) c.cibles.forEach((e) => ajouter({ type: 'levier', cible: e.nom, action: c.verbe }));
      else incompris.push(`${c.original} (action non précisée)`);
    } else if (intention) {
      // « Deux manifestations arrivent, une rue Berger et une autre rue Rambuteau » : les lieux suivent l'annonce.
      const lieu = trouverLieu(k, u.lieux, true);
      if (lieu) { ajouter({ type: 'zone_poser', cible: lieu.nom, code: intention }); zoneEnAttente = intention; }
    } else if (c.verbe && contient(b, 'porte|issue|sortie|ascenseur')) {
      incompris.push(c.original);
    }
    if (contient(b, 'evacu|faire sortir|vider') && !question) ajouter({ type: 'evacuer' });

    // Un délai seul (« dans cinq minutes ») s'applique à ce qui précède, ou à ce qui suit s'il n'y a rien avant.
    if (ordres.length === avant && c.delai !== null) {
      if (avant && ordres[avant - 1]?.delai_s === 0) ordres[avant - 1] = { ...ordres[avant - 1]!, delai_s: c.delai };
      else delaiReporte = c.delai;
    } else if (ordres.length > avant) delaiReporte = null;
  }
  if (zoneEnAttente) questions.push('Où se trouve la manifestation ? Dites par exemple « rue Berger ».');
  if (conseil) ordres.push({ type: 'conseil', delai_s: 0 });
  if (!ordres.length && !incompris.length && !questions.length) incompris.push(texte.trim());
  return { ordres, incompris, questions };
}

// ===== Interpréteur Claude (appel payant, sous garde) =============================================
// Interpréteur Claude Sonnet 5.5 : API Messages d'Anthropic en fetch, sans dépendance, sortie structurée par un outil à
// schéma JSON dont l'appel est forcé (tool_choice). Appel PAYANT, donc triple garde : MODE_PAYANT=oui dans l'environnement,
// autorisation explicite de l'appelant, et ANTHROPIC_API_KEY. La clé n'est lue que dans `env` (process.env par défaut),
// jamais écrite, jamais journalisée.

export const MODELE_CLAUDE = 'claude-sonnet-5-5';
export const URL_MESSAGES = 'https://api.anthropic.com/v1/messages';
export const NOM_OUTIL = 'ordres_directeur';

export class ErreurGardePayant extends Error {}

export interface OptionsClaude {
  autorisation: boolean; // vrai seulement si l'appelant a décidé d'accepter la dépense pour cet appel
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  delai_ms?: number;
}

/** Lève ErreurGardePayant si l'un des trois verrous manque ; sinon renvoie la clé. */
export function verifierGarde(opts: OptionsClaude): string {
  const env = opts.env ?? process.env;
  if (env.MODE_PAYANT !== 'oui') throw new ErreurGardePayant('appel payant refusé : MODE_PAYANT=oui absent');
  if (opts.autorisation !== true) throw new ErreurGardePayant("appel payant refusé : autorisation explicite absente");
  const cle = env.ANTHROPIC_API_KEY;
  if (!cle) throw new ErreurGardePayant('appel payant impossible : ANTHROPIC_API_KEY absente de l\'environnement');
  return cle;
}

export const SCHEMA_OUTIL = {
  type: 'object',
  properties: {
    actions: {
      type: 'array',
      maxItems: BORNES.ordres_max,
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: [...TYPES_ORDRE] },
          cible: { type: ['string', 'null'], description: 'nom exact pris dans la liste des lieux (zones) ou des leviers (portes, issues, bouches, ascenseurs)' },
          action: { type: ['string', 'null'], enum: [...ACTIONS_LEVIER, 'arreter', 'remettre', null] },
          code: { type: ['string', 'null'], enum: [...CODES_ZONE, null], description: 'D1 manifestation ou rassemblement, D2 troubles ou casseurs' },
          delai_s: { type: 'integer', minimum: 0, maximum: BORNES.delai_max_s, description: 'secondes avant exécution : « dans 5 minutes » = 300, tout de suite = 0' },
        },
        required: ['type', 'cible', 'action', 'code', 'delai_s'],
        additionalProperties: false,
      },
    },
    incompris: { type: 'array', items: { type: 'string' }, description: 'morceaux de la demande impossibles à rattacher à un nom connu' },
    refus: { type: 'boolean', description: 'vrai si la consigne vise à nuire au public ou à un lieu' },
  },
  required: ['actions', 'incompris', 'refus'],
  additionalProperties: false,
} as const;

const SYSTEME = `Tu traduis les ordres oraux du directeur du Forum des Halles, en cellule de crise, en ordres sur un jumeau numérique. Tu n'as que l'outil ${NOM_OUTIL}.
Une phrase peut contenir plusieurs ordres : une action par élément (deux manifestations = deux zone_poser ; trois portes fermées = trois levier).
Types :
- zone_poser : une manifestation (code D1) ou des troubles (code D2) à un lieu ; cible = nom exact de la liste des lieux.
- zone_lever : la manifestation ou les troubles sont finis ; cible = lieu si précisé, sinon null ; code si précisé.
- levier : agir sur un levier nommé ; cible = nom exact de la liste des leviers ; action = fermer, ouvrir, agent (poster un agent ou un guide-file), annonce (diriger le public vers cette sortie), filtrer.
- bouches_toutes : toutes les bouches de métro et RER ; action = fermer ou ouvrir.
- ascenseurs : action fermer (en panne) ou ouvrir ; cible = lieu si un endroit est cité, sinon null.
- escalators : action arreter ou remettre.
- evacuer : lancer l'évacuation. conseil : le directeur demande quoi faire. etat : question sur l'état (cible = levier si un seul est visé).
Délais : « dans 5 minutes » donne delai_s 300 ; sans délai, 0. Maximum ${BORNES.delai_max_s} s.
Les noms cités à l'oral sont approximatifs : choisis le nom exact le plus proche dans les listes. N'invente jamais un nom absent des listes : mets ce morceau dans incompris. Les champs inutiles valent null.
Si la consigne vise à nuire (attaque, piège, enfermer ou empêcher de sortir le public, fermer toutes les sorties), renvoie refus=true et aucune action.`;

export function construireRequete(texte: string, ctx: Contexte): Record<string, unknown> {
  const noms = ctx.leviers.map((l) => (typeof l === 'string' ? l : l.nom));
  return {
    model: MODELE_CLAUDE,
    max_tokens: 2000,
    system: SYSTEME,
    tools: [{ name: NOM_OUTIL, description: "Ordres du directeur, validés ensuite par le code.", input_schema: SCHEMA_OUTIL }],
    tool_choice: { type: 'tool', name: NOM_OUTIL },
    messages: [{
      role: 'user',
      content: `Lieux : ${ctx.lieux.join(' ; ')}\nLeviers : ${noms.join(' ; ')}\nÉtat : ${ctx.etat ?? 'inconnu'}\n\nOrdre du directeur : « ${texte.slice(0, BORNES.texte_max)} »`,
    }],
  };
}

export interface SortieClaude { ordres: OrdreBrut[]; incompris: string[]; refus: boolean }

/** Lit la réponse de l'API : le bloc tool_use de l'outil forcé. Tout autre forme est une erreur. */
export function lireReponseClaude(json: unknown): SortieClaude {
  const r = json as { stop_reason?: unknown; content?: unknown };
  if (r?.stop_reason === 'refusal') return { ordres: [], incompris: [], refus: true };
  const bloc = Array.isArray(r?.content)
    ? (r.content as { type?: string; name?: string; input?: unknown }[]).find((c) => c?.type === 'tool_use' && c.name === NOM_OUTIL)
    : undefined;
  const e = bloc?.input as { actions?: unknown; incompris?: unknown; refus?: unknown } | undefined;
  if (!e || !Array.isArray(e.actions)) throw new Error("réponse Claude illisible : pas d'appel de l'outil attendu");
  const ordres = e.actions.filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null).map((a): OrdreBrut => ({
    type: String(a.type),
    cible: typeof a.cible === 'string' ? a.cible : null,
    action: typeof a.action === 'string' ? a.action : null,
    code: typeof a.code === 'string' ? a.code : null,
    delai_s: typeof a.delai_s === 'number' ? a.delai_s : 0,
  }));
  const incompris = Array.isArray(e.incompris) ? e.incompris.filter((x): x is string => typeof x === 'string') : [];
  return { ordres, incompris, refus: e.refus === true };
}

export async function interpreterClaude(texte: string, ctx: Contexte, opts: OptionsClaude): Promise<SortieClaude> {
  const cle = verifierGarde(opts);
  const appel = opts.fetch ?? globalThis.fetch;
  const ctl = new AbortController();
  const minuterie = setTimeout(() => ctl.abort(), opts.delai_ms ?? BORNES.claude_delai_ms);
  try {
    const res = await appel(URL_MESSAGES, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': cle, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(construireRequete(texte, ctx)),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`API Anthropic : ${res.status}`);
    return lireReponseClaude(await res.json());
  } finally {
    clearTimeout(minuterie);
  }
}

// ===== Traitement d'un ordre ======================================================================
// Traitement d'un ordre : interpréteur (règles ou Claude), filtre de validation, réponse rédigée.

function conclure(i: Interpretation, u: Univers): Resultat {
  const v = validerOrdres(i.ordres, u);
  if (v.refus) return { ordres: [], reponse: reponseRefus(), refus: true, incompris: [], questions: [] };
  const incompris = [...i.incompris, ...v.rejets];
  return { ordres: v.ordres, reponse: rediger(v.ordres, u, incompris, i.questions), incompris, questions: i.questions };
}

/** Compréhension par règles : pure, déterministe, sans clé ni réseau. */
export function traiterOrdre(texte: string, contexte: Contexte): Resultat {
  const t = texte.slice(0, BORNES.texte_max);
  if (estAttaque(t)) return { ordres: [], reponse: reponseRefus(), refus: true, incompris: [], questions: [] };
  const u = construireUnivers(contexte);
  return conclure(interpreterRegles(t, u), u);
}

export interface OptionsTraitement extends Partial<OptionsClaude> {
  claude?: boolean; // l'appelant demande Claude ; sans les trois verrous de la garde, on reste aux règles
}
export type SourceOrdre = 'regles' | 'claude';
export interface ResultatSource extends Resultat { source: SourceOrdre; secours?: string }

/** Claude si demandé et autorisé, sinon (ou en cas d'échec) les règles. Les ordres de Claude passent le même filtre. */
export async function traiterOrdreAuto(texte: string, contexte: Contexte, opts: OptionsTraitement = {}): Promise<ResultatSource> {
  const t = texte.slice(0, BORNES.texte_max);
  if (estAttaque(t)) return { ...traiterOrdre(t, contexte), source: 'regles' };
  const opt: OptionsClaude = { autorisation: opts.autorisation === true && opts.claude === true, env: opts.env, fetch: opts.fetch, delai_ms: opts.delai_ms };
  let secours: string | undefined;
  if (opts.claude) {
    try {
      verifierGarde(opt);
      const s = await interpreterClaude(t, contexte, opt);
      const u = construireUnivers(contexte);
      if (s.refus) return { ordres: [], reponse: reponseRefus(), refus: true, incompris: [], questions: [], source: 'claude' };
      return { ...conclure({ ordres: s.ordres, incompris: s.incompris, questions: [] }, u), source: 'claude' };
    } catch (e) {
      secours = e instanceof Error ? e.message : 'Claude indisponible';
    }
  }
  return { ...traiterOrdre(t, contexte), source: 'regles', ...(secours ? { secours } : {}) };
}

// ===== Handler HTTP ===============================================================================
// Handler HTTP minimal, sans framework, que le serveur (src/server) monte sur /api/directeur :
//   POST /api/directeur  {texte, contexte, claude?} -> {ordres, reponse, refus?, incompris, questions, source, ms}
//   GET  /api/directeur/etat -> {claude_possible, modele}
// Le handler renvoie true s'il a répondu, false si le chemin n'est pas le sien (le serveur passe alors à la route suivante).
// Claude n'est utilisé que si le serveur l'autorise (options), que le client le demande (`claude: true`) et que la garde
// de claude.ts est satisfaite (MODE_PAYANT=oui + ANTHROPIC_API_KEY). Sinon : règles.


export interface OptionsRoute {
  autoriserClaude?: boolean; // décision du serveur, jamais du client
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
}

function envoyer(res: ServerResponse, code: number, corps: unknown): void {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corps));
}

async function lireCorps(req: IncomingMessage): Promise<string | null> {
  let n = 0;
  const morceaux: Buffer[] = [];
  for await (const m of req) {
    const b = Buffer.isBuffer(m) ? m : Buffer.from(m as string);
    n += b.length;
    if (n > BORNES.corps_max) return null;
    morceaux.push(b);
  }
  return Buffer.concat(morceaux).toString('utf8');
}

export function creerRouteDirecteur(opts: OptionsRoute = {}): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  return async function routeDirecteur(req, res) {
    const chemin = new URL(req.url ?? '/', 'http://x').pathname;
    if (chemin === '/api/directeur/etat' && req.method === 'GET') {
      const env = opts.env ?? process.env;
      envoyer(res, 200, { claude_possible: opts.autoriserClaude === true && env.MODE_PAYANT === 'oui' && !!env.ANTHROPIC_API_KEY, modele: MODELE_CLAUDE });
      return true;
    }
    if (chemin !== '/api/directeur') return false;
    if (req.method !== 'POST') { envoyer(res, 405, { erreur: 'POST attendu' }); return true; }
    const corps = await lireCorps(req);
    if (corps === null) { envoyer(res, 413, { erreur: 'corps trop gros' }); return true; }
    let donnees: { texte?: unknown; contexte?: unknown; claude?: unknown };
    try { donnees = JSON.parse(corps); } catch { envoyer(res, 400, { erreur: 'JSON invalide' }); return true; }
    const contexte = lireContexte(donnees?.contexte);
    if (typeof donnees?.texte !== 'string' || !donnees.texte.trim() || !contexte) {
      envoyer(res, 400, { erreur: 'texte (chaîne) et contexte {lieux[], leviers[]} requis' });
      return true;
    }
    const t0 = Date.now();
    const r = await traiterOrdreAuto(donnees.texte, contexte, {
      claude: donnees.claude === true && opts.autoriserClaude === true,
      autorisation: opts.autoriserClaude === true,
      env: opts.env,
      fetch: opts.fetch,
    });
    envoyer(res, 200, { ...r, ms: Date.now() - t0 });
    return true;
  };
}

/** Version par défaut : règles seulement (Claude non autorisé). */
export const routeDirecteur = creerRouteDirecteur();
