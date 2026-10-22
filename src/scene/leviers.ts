// Leviers du juré sur le Forum : tout ce qu'on peut ouvrir ou fermer (portes, issues de secours, bouches de métro, ascenseurs)
// plus les zones posées (D1 manifestation, D2 troubles). Portage TypeScript de reports/maquettes/chatelet-3d/leviers.js
// (données et logique ; le dessin des épingles reste dans la vue 3D). Même format que la maquette Arena :
//   { code, id, nom, type, x, z, niveau, etat, source, effet }   (+ estime, cibles, largeur_m)
// Ids stables : porte-<k>, issue-<j>, bouche-<i>, ascenseur-<i> (rang décrit sur construireLeviers).
// Chaque changement émet l'événement `contrainte` (contrainte.ts), que la grille applique (Navigation.brancher),
// puis l'événement `levier` (détail { leviers, zones }). L'inverse marche aussi : une contrainte reçue met le levier à jour.
import type { BusContraintes, Contrainte, EtatContrainte } from './contrainte.ts';
import type { Navgrid } from './navgrid.ts';
import { Navigation } from './navgrid.ts';
import type { Scene } from './types.ts';

export const FORUM: readonly [number, number] = [-30, -20]; // centre du Forum (Canopée), repère local en mètres
export const RAYON_FORUM_M = 420;
export const RAYON_GRILLE_M = 12; // distance maximale entre une épingle et une cellule praticable
const LAT0 = 48.862, LON0 = 2.347;
const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KZ = 110540;

export type TypeLevier = 'porte' | 'issue' | 'bouche' | 'ascenseur';
export type EtatLevier = 'ouvert' | 'fermé' | 'filtré';
export type CodeZone = 'D1' | 'D2';
const RAYON_ZONE: Record<CodeZone, number> = { D1: 55, D2: 30 };

/** Un point de la scène que le levier commande : un par nœud OSM (la Porte Lescot en a trois). */
export interface Cible { id: string; x: number; z: number; niveau: number; largeur_m: number }

export interface Levier {
  code: 'B1' | 'B5' | 'C1';
  id: string;
  nom: string;
  type: TypeLevier;
  x: number;
  z: number;
  niveau: number;
  etat: EtatLevier;
  source: string;
  effet: string;
  /** true = position, niveau ou largeur non documentés dans OSM : valeur posée par nous. */
  estime: boolean;
  cibles: Cible[];
  largeur_m: number;
  /** true = une cellule praticable de la grille existe à moins de 12 m de l'épingle ; false = hors grille (ouest du niveau -1/-2 non documenté dans OSM) : fermer ce levier n'a alors aucun effet sur la grille. Absent si aucune grille fournie. */
  sur_grille?: boolean;
  agent?: boolean; // personnel posté (guidage)
  annonce?: boolean; // annonce vers cette sortie
}

export interface Zone { code: CodeZone; id: string; x: number; z: number; r: number }

/** Entrée de acces-forum.json : portes et issues de secours recherchées (reports/issues-forum-halles.md), coordonnées OSM. */
export interface AccesForum { nom: string; type: 'porte' | 'issue'; niveau: string | null; lat: number | null; lon: number | null; certitude: 'source' | 'estimé'; source: string }

/** Clés des décideurs (#10) -> nom de la porte, table d'Alexandre sur le ticket #7. */
export const CLES_PORTES: Record<string, string> = {
  lescot: 'Porte Lescot', berger: 'Porte Berger', rambuteau: 'Porte Rambuteau', pont_neuf: 'Porte du Pont Neuf',
  saint_eustache: 'Porte Saint-Eustache', jour: 'Porte du Jour', louvre: 'Porte du Louvre',
  marguerite_de_navarre: 'Porte Marguerite de Navarre', montorgueil: 'Rue Montorgueil',
};
/** Clé décideurs d'un nom affiché (« Porte du Louvre (niveau -3) » -> louvre), ou undefined. */
export function cleDePorte(nom: string): string | undefined {
  const n = nom.replace(/\s*\(.*\)\s*$/, '').replace(/\s+\d+$/, '');
  return Object.entries(CLES_PORTES).find(([, v]) => v === n)?.[0];
}

const xz = (lat: number, lon: number): [number, number] => [Math.round((lon - LON0) * KX * 10) / 10, Math.round((LAT0 - lat) * KZ * 10) / 10];
const proche = (x: number, z: number, r: number): boolean => Math.hypot(x - FORUM[0], z - FORUM[1]) < r;
const niveauDe = (s: string | null): number => { const m = /^\s*(-?\d)/.exec(s || '0'); return m ? parseInt(m[1], 10) : 0; };

/** « Sortie de secours rue Berger n°11 » -> « Issue rue Berger 11 » ; « Issue de secours (côté … Piscine) » -> « Issue côté piscine ». */
export function nomIssue(s: string | undefined): string {
  if (!s) return 'Issue de secours';
  let n = s.replace(/^(Issue|Sortie) de secours\s*/i, '').replace(/[«»]/g, '').replace(/n°\s*/, '').trim();
  const p = /^\((.*)\)$/.exec(n);
  if (p) n = p[1];
  n = n.replace(/côté Porte du Louvre \/ Piscine/i, 'côté piscine').replace(/^niveau (-?\d) \((.*)\)$/, '$2 niveau $1').replace(/près de l'accès /, '');
  return ('Issue ' + n).replace(/\s+/g, ' ');
}

/**
 * Construit la liste des leviers à partir de la scène (et de acces-forum.json pour les noms et les issues).
 * porte-<k> : un par (nom, niveau), nœuds OSM nommés « Porte … » / « Rue … » d'abord, puis portes de la recherche absentes d'OSM ;
 * issue-<j> : rang dans acces-forum.json (issues avec coordonnées) ; bouche-<i> et ascenseur-<i> : rang dans scene.metro / scene.ascenseurs.
 */
export function construireLeviers(scene: Scene, acces: AccesForum[], ng?: Navgrid): Levier[] {
  const L: Levier[] = [];
  const cible = (id: string, x: number, z: number, niveau: number, largeur_m: number): Cible => ({ id, x, z, niveau, largeur_m });

  const groupes = new Map<string, { nom: string; niveau: number; cibles: Cible[]; estime: boolean; source: string }>();
  for (const m of scene.metro) {
    if (!(m.n.startsWith('Porte') || m.n === CLES_PORTES.montorgueil) || !proche(m.x, m.z, RAYON_FORUM_M)) continue;
    const niveau = m.l[0] ?? 0, cle = `${m.n}|${niveau}`;
    const g = groupes.get(cle) ?? { nom: m.n, niveau, cibles: [], estime: false, source: 'OpenStreetMap (porte nommée du Forum, railway=subway_entrance)' };
    g.cibles.push(cible(m.id, m.x, m.z, niveau, m.largeur_m));
    g.estime ||= m.estime; // largeur par défaut posée par nous
    groupes.set(cle, g);
  }
  for (const a of acces) {
    if (a.type !== 'porte' || a.lat === null || a.lon === null || a.nom.startsWith('Sortie de métro')) continue;
    const nom = a.nom.replace(/\s*\(.*\)\s*$/, ''), niveau = niveauDe(a.niveau), cle = `${nom}|${niveau}`;
    if (groupes.has(cle)) continue;
    const [x, z] = xz(a.lat, a.lon);
    groupes.set(cle, { nom, niveau, cibles: [cible(`ACCES-${nom}-${niveau}`, x, z, niveau, 2.5)], estime: true, source: a.source });
  }
  const parNom = new Map<string, number>(); // « Porte du Louvre » existe aux niveaux 0 et -3
  for (const g of groupes.values()) parNom.set(g.nom, (parNom.get(g.nom) ?? 0) + 1);
  let k = 0;
  for (const g of groupes.values()) {
    const c = g.cibles[0];
    L.push({
      code: 'B1', id: `porte-${k++}`, nom: (parNom.get(g.nom) ?? 0) > 1 ? `${g.nom} (niveau ${g.niveau})` : g.nom, type: 'porte',
      x: c.x, z: c.z, niveau: g.niveau, etat: 'ouvert', source: g.source, estime: g.estime,
      effet: 'Sortie de la simulation : fermée, la foule repart vers une autre porte', cibles: g.cibles, largeur_m: Math.max(...g.cibles.map((q) => q.largeur_m)),
    });
  }

  let j = 0;
  for (const a of acces) {
    if (a.type !== 'issue' || a.lat === null || a.lon === null) continue;
    const id = `issue-${j++}`, [x, z] = xz(a.lat, a.lon), niveau = niveauDe(a.niveau);
    L.push({
      code: 'B1', id, nom: nomIssue(a.nom), type: 'issue', x, z, niveau, etat: 'ouvert', source: a.source || 'OpenStreetMap (entrance=emergency)',
      estime: a.certitude !== 'source' || !a.niveau?.trim(), effet: 'Sortie de secours de la simulation ; fermée, elle disparaît des choix',
      cibles: [cible(id, x, z, niveau, 1.2)], largeur_m: 1.2,
    });
  }

  scene.metro.forEach((m, i) => {
    if (!proche(m.x, m.z, RAYON_FORUM_M)) return;
    const niveau = m.l[0] ?? 0;
    L.push({
      code: 'C1', id: `bouche-${i}`, nom: `Métro ${m.n || 'accès'}`, type: 'bouche', x: m.x, z: m.z, niveau, etat: 'ouvert',
      source: 'OpenStreetMap (railway=subway_entrance)', estime: m.estime, cibles: [cible(m.id, m.x, m.z, niveau, m.largeur_m)], largeur_m: m.largeur_m,
      effet: 'Toutes fermées : stations du Forum fermées, les quais ne sont plus une sortie (19 oct., ~20h07)',
    });
  });

  scene.ascenseurs.forEach((a, i) => {
    const niveau = Math.min(...a.l), x = a.x ?? a.de.x, z = a.z ?? a.de.z;
    const lien = ng?.liens.find((q) => q.type === 'ascenseur' && a.id.startsWith(q.id)); // la contrainte vise le lien de la grille s'il existe
    L.push({
      code: 'B5', id: `ascenseur-${i}`, nom: 'Ascenseur ' + (a.n || `niveaux ${a.l.join(', ')}`), type: 'ascenseur', x, z, niveau, etat: 'ouvert',
      source: 'OpenStreetMap (highway=elevator)', estime: a.estime, largeur_m: a.largeur_m, cibles: [cible(lien?.id ?? a.id, x, z, niveau, a.largeur_m)],
      effet: 'Cabine de 13 personnes, ~0,6 pers./s. En panne : le lien disparaît de la simulation, les personnes à mobilité réduite de ce niveau attendent les secours',
    });
  });

  if (ng) {
    const nav = new Navigation(ng);
    for (const l of L) { l.sur_grille = nav.plusProche(l.niveau, l.x, l.z, RAYON_GRILLE_M) >= 0; if (!l.sur_grille) l.estime = true; }
  }

  // un nom unique par levier, pour pouvoir les citer à la voix (les doublons prennent un numéro)
  const cnt: Record<string, number> = {}, vu: Record<string, number> = {};
  for (const l of L) cnt[l.nom] = (cnt[l.nom] ?? 0) + 1;
  for (const l of L) if (cnt[l.nom] > 1) { vu[l.nom] = (vu[l.nom] ?? 0) + 1; l.nom = `${l.nom} ${vu[l.nom]}`; }
  return L;
}

const TYPE_CONTRAINTE = { porte: 'sortie', issue: 'sortie', bouche: 'bouche_metro', ascenseur: 'ascenseur' } as const;
const ETAT_CONTRAINTE: Record<EtatLevier, EtatContrainte> = { ouvert: 'ouverte', fermé: 'fermee', filtré: 'ouverte' };

/** Contraintes équivalentes à l'état d'un levier : une par cible (id = id du levier, suffixé #n s'il y a plusieurs cibles). */
export function contraintesDe(l: Levier): Contrainte[] {
  return l.cibles.map((c, n) => ({
    id: l.cibles.length > 1 ? `${l.id}#${n}` : l.id,
    type: TYPE_CONTRAINTE[l.type], niveau: c.niveau, x: c.x, y: c.z, largeur_m: c.largeur_m, etat: ETAT_CONTRAINTE[l.etat],
  }));
}

/** Contrainte d'une zone posée : D2 (troubles) bloque la zone ; D1 (manifestation) la ferme (la grille n'a pas de coût de passage). */
export function contrainteDeZone(z: Zone): Contrainte {
  return { id: z.id, type: 'barrage', niveau: 0, x: z.x, y: z.z, largeur_m: 2 * z.r, etat: z.code === 'D2' ? 'bloquee' : 'fermee' };
}

export interface DetailLevier { leviers: Levier[]; zones: Zone[] }
export type EcouteurLevier = (d: DetailLevier) => void;
/** Tout EventTarget (window dans le navigateur) : il reçoit aussi l'événement DOM `levier`. */
export interface CibleEvenement { dispatchEvent(e: Event): boolean }

/** État des leviers et des zones, relié au bus `contrainte`. */
export class Leviers {
  readonly leviers: Levier[];
  readonly zones: Zone[] = [];
  readonly #bus: BusContraintes;
  readonly #cible?: CibleEvenement;
  #ecouteurs: EcouteurLevier[] = [];
  #echo = false; // vrai pendant qu'on émet nous-mêmes une contrainte (évite de la ré-appliquer)
  #nz = 0;

  constructor(leviers: Levier[], bus: BusContraintes, cible?: CibleEvenement) {
    this.leviers = leviers;
    this.#bus = bus;
    this.#cible = cible;
    bus.sur('contrainte', (c) => this.#recevoir(c));
  }

  sur(nom: 'levier', f: EcouteurLevier): () => void {
    if (nom !== 'levier') throw new Error(`événement inconnu : ${nom}`);
    this.#ecouteurs.push(f);
    return () => { this.#ecouteurs = this.#ecouteurs.filter((e) => e !== f); };
  }

  get(id: string): Levier | undefined { return this.leviers.find((l) => l.id === id); }

  /** Bascule ouvert <-> fermé (« filtré » repasse en fermé). Renvoie le levier, ou undefined si l'id est inconnu. */
  toggleLever(id: string): Levier | undefined {
    const l = this.get(id);
    return l ? this.poser(id, l.etat === 'ouvert' ? 'fermé' : 'ouvert') : undefined;
  }

  /** Fixe l'état d'un levier, émet `contrainte` (une par cible) puis `levier`. */
  poser(id: string, etat: EtatLevier): Levier | undefined {
    const l = this.get(id);
    if (!l) return undefined;
    l.etat = etat;
    this.#emettre(contraintesDe(l));
    this.#notifier();
    return l;
  }

  /** Actions du menu commun : fermer, ouvrir, filtrer, agent (personnel posté), annonce (une seule à la fois). */
  levAction(id: string, act: 'fermer' | 'ouvrir' | 'filtrer' | 'agent' | 'annonce'): EtatLevier | null {
    const l = this.get(id);
    if (!l) return null;
    if (act === 'fermer') this.poser(id, 'fermé');
    else if (act === 'ouvrir') this.poser(id, 'ouvert');
    else if (act === 'filtrer') this.poser(id, l.etat === 'filtré' ? 'ouvert' : 'filtré');
    else if (act === 'agent') { l.agent = !l.agent; this.#notifier(); }
    else if (act === 'annonce') { for (const q of this.leviers) if (q !== l) q.annonce = false; l.annonce = !l.annonce; this.#notifier(); }
    else return null;
    return l.etat;
  }

  /** Pose une zone D1 / D2 au point (x, z). Émet `contrainte` (barrage) puis `levier`. */
  ajouterZone(code: CodeZone, x: number, z: number): Zone {
    const zone: Zone = { code, id: `zone-${++this.#nz}`, x, z, r: RAYON_ZONE[code] };
    this.zones.push(zone);
    this.#emettre([contrainteDeZone(zone)]);
    this.#notifier();
    return zone;
  }

  retirerZone(id: string): boolean {
    const i = this.zones.findIndex((z) => z.id === id);
    if (i < 0) return false;
    const [zone] = this.zones.splice(i, 1);
    this.#emettre([{ ...contrainteDeZone(zone), etat: 'ouverte' }]);
    this.#notifier();
    return true;
  }

  /** Raccourci C1 : ferme (ou rouvre) toutes les bouches de métro. */
  fermerBouches(fermer = true): void {
    for (const l of this.leviers) if (l.type === 'bouche') this.poser(l.id, fermer ? 'fermé' : 'ouvert');
  }

  /** « Tout rouvrir » : leviers ouverts, zones retirées. */
  toutRouvrir(): void {
    for (const l of this.leviers) if (l.etat !== 'ouvert') this.poser(l.id, 'ouvert');
    for (const z of [...this.zones]) this.retirerZone(z.id);
  }

  /** Une contrainte venue d'ailleurs (juré, agent) : le levier correspondant suit. */
  #recevoir(c: Contrainte): void {
    if (this.#echo) return;
    const l = this.get(c.id.split('#')[0]);
    if (!l) return;
    const etat: EtatLevier = c.etat === 'ouverte' ? 'ouvert' : 'fermé';
    if (etat === l.etat || (etat === 'ouvert' && l.etat === 'filtré')) return;
    l.etat = etat;
    this.#notifier();
  }

  #emettre(cs: Contrainte[]): void {
    this.#echo = true;
    try { for (const c of cs) this.#bus.emettre(c); } finally { this.#echo = false; }
  }

  #notifier(): void {
    const detail: DetailLevier = { leviers: this.leviers.map((l) => ({ ...l, cibles: l.cibles.map((c) => ({ ...c })) })), zones: this.zones.map((z) => ({ ...z })) };
    for (const f of this.#ecouteurs) f(detail);
    this.#cible?.dispatchEvent(new CustomEvent('levier', { detail }));
  }
}

/** Branche la grille sur le bus (raccourci de la vue et des tests). */
export function brancherGrille(ng: Navgrid, bus: BusContraintes): Navigation {
  const nav = new Navigation(ng);
  nav.brancher(bus);
  return nav;
}
