// Cortèges et groupes en mouvement, porté de reports/maquettes/chatelet-3d/cortege.js (sans DOM, sans THREE).
// Un groupe = une zone D1 (manifestation) ou D2 (troubles) qui SE DÉPLACE le long des rues.
//   D1 : les portes à moins de rayon + 25 m sont « à éviter » ; D2 : celles à moins de rayon + 10 m sont bloquées.
//   Quand le groupe s'éloigne, elles redeviennent normales (les effets sont recalculés depuis l'état de base).
// Vitesse par défaut 3 km/h (ordre de grandeur d'un cortège dense : ESTIMÉ, non sourcé). Effectif de 50 à 5 000.
// Rayon physique estimé à 1,5 pers./m² ; zone d'influence = rayon physique + marge.
import type { Contrainte, Point } from './types.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS5097 : Node exige l extension .ts ; le tsconfig du socle n autorise pas encore allowImportingTsExtensions
import { mulberry32 } from './types.ts';

export type CodeGroupe = 'D1' | 'D2';
export interface Rue { nom: string; pts: Point[] }
export interface Troncon extends Point { nom: string }

export interface Cortege {
  id: string;
  code: CodeGroupe;
  nom: string;
  effectif: number;
  rayon_m: number;
  vitesse_ms: number;
  trajet: Troncon[];
  cumul: number[];
  longueur_m: number;
  s: number; // abscisse curviligne parcourue (m)
  x: number;
  y: number;
  cap: Point; // vecteur unitaire de direction
  rue: string;
  fini: boolean;
}

export interface ParamsCortege {
  id: string;
  code?: CodeGroupe;
  nom?: string;
  effectif?: number;
  vitesse_kmh?: number;
  depart: Point;
  arrivee?: Point;
  rues?: Rue[];
}

export const MARGE_D1_M = 25;
export const MARGE_D2_M = 10;
const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

// ---------- polyligne ----------
export function cumulPolyligne(pts: Point[]): number[] {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1]! + dist(pts[i]!, pts[i - 1]!));
  return c;
}

/** Point à l'abscisse curviligne s (bornée à [0, longueur]), cap unitaire et indice du tronçon d'arrivée. */
export function pointSurPolyligne(pts: Point[], cumul: number[], s: number): { x: number; y: number; cap: Point; i: number } {
  if (pts.length === 0) throw new Error('polyligne vide');
  const L = cumul[cumul.length - 1]!;
  const ss = Math.max(0, Math.min(s, L));
  if (pts.length === 1 || L === 0) return { x: pts[0]!.x, y: pts[0]!.y, cap: { x: 1, y: 0 }, i: 0 };
  let i = 1;
  while (i < pts.length - 1 && cumul[i]! < ss) i++;
  const a = pts[i - 1]!, b = pts[i]!;
  const sl = cumul[i]! - cumul[i - 1]! || 1;
  const t = (ss - cumul[i - 1]!) / sl;
  const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1;
  return { x: a.x + dx * t, y: a.y + dy * t, cap: { x: dx / m, y: dy / m }, i };
}

// ---------- graphe des rues : sommets des polylignes, jonction à ≤ 3 m ----------
interface Graphe { X: number[]; Y: number[]; adj: { v: number; w: number; nom: string }[][] }
export function construireGraphe(rues: Rue[], jonction_m = 3): Graphe {
  const X: number[] = [], Y: number[] = [], adj: Graphe['adj'] = [];
  const lien = (a: number, b: number, nom: string): void => {
    if (a === b) return;
    const w = Math.hypot(X[a]! - X[b]!, Y[a]! - Y[b]!);
    adj[a]!.push({ v: b, w, nom });
    adj[b]!.push({ v: a, w, nom });
  };
  for (const r of rues) {
    if (r.pts.length < 2) continue;
    let prev = -1;
    for (const p of r.pts) {
      const i = X.length;
      X.push(p.x); Y.push(p.y); adj.push([]);
      if (prev >= 0) lien(prev, i, r.nom);
      prev = i;
    }
  }
  for (let i = 0; i < X.length; i++) {
    for (let j = i + 1; j < X.length; j++) {
      if (Math.hypot(X[i]! - X[j]!, Y[i]! - Y[j]!) <= jonction_m) lien(i, j, '');
    }
  }
  return { X, Y, adj };
}

function sommetProche(g: Graphe, p: Point): { i: number; d: number } {
  let best = -1, bd = Infinity;
  for (let j = 0; j < g.X.length; j++) {
    const d = Math.hypot(g.X[j]! - p.x, g.Y[j]! - p.y);
    if (d < bd) { bd = d; best = j; }
  }
  return { i: best, d: bd };
}

/** Plus court chemin sur les rues (Dijkstra). Ligne droite si pas de chemin ou départ/arrivée à plus de 80 m d'une rue. */
export function routeSurRues(rues: Rue[], dep: Point, arr?: Point): Troncon[] {
  const d0: Troncon = { x: dep.x, y: dep.y, nom: '' };
  if (!arr) return [d0];
  const droit = (): Troncon[] => [d0, { x: arr.x, y: arr.y, nom: '' }];
  const g = construireGraphe(rues);
  const a = sommetProche(g, dep), b = sommetProche(g, arr);
  if (a.i < 0 || b.i < 0 || a.d > 80 || b.d > 80) return droit();
  const n = g.X.length;
  const D = new Array<number>(n).fill(Infinity), P = new Array<number>(n).fill(-1), PN = new Array<string>(n).fill('');
  const fait = new Array<boolean>(n).fill(false);
  D[a.i] = 0;
  for (;;) { // sélection linéaire en O(n²) : suffisant pour quelques milliers de sommets
    let u = -1, m = Infinity;
    for (let k = 0; k < n; k++) if (!fait[k] && D[k]! < m) { m = D[k]!; u = k; }
    if (u < 0 || u === b.i) break;
    fait[u] = true;
    for (const e of g.adj[u]!) {
      const nd = m + e.w;
      if (nd < D[e.v]!) { D[e.v] = nd; P[e.v] = u; PN[e.v] = e.nom; }
    }
  }
  if (!Number.isFinite(D[b.i]!)) return droit();
  const ch: Troncon[] = [];
  for (let u = b.i; u >= 0; u = P[u]!) ch.push({ x: g.X[u]!, y: g.Y[u]!, nom: PN[u] ?? '' });
  ch.reverse();
  const pts: Troncon[] = [d0, ...ch, { x: arr.x, y: arr.y, nom: '' }];
  for (let i = 1; i < pts.length; i++) if (!pts[i]!.nom) pts[i]!.nom = (i > 1 ? pts[i - 1]!.nom : '') || pts[2]?.nom || '';
  const out: Troncon[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) if (dist(pts[i]!, out[out.length - 1]!) > 0.05) out.push(pts[i]!);
  return out;
}

// ---------- cycle de vie ----------
/** Rayon d'influence : rayon physique à 1,5 pers./m² + marge (D1 : +22 m, min 30 ; D2 : +12 m, min 25). */
export function rayonCortege(code: CodeGroupe, effectif: number): number {
  const rp = Math.sqrt(effectif / (1.5 * Math.PI));
  return code === 'D1' ? Math.max(30, rp + 22) : Math.max(25, rp + 12);
}

export function creerCortege(p: ParamsCortege): Cortege {
  const code: CodeGroupe = p.code === 'D2' ? 'D2' : 'D1';
  const effectif = Math.max(50, Math.min(5000, Math.round(p.effectif ?? (code === 'D1' ? 800 : 120))));
  const trajet = routeSurRues(p.rues ?? [], p.depart, p.arrivee);
  const cumul = cumulPolyligne(trajet);
  const longueur_m = cumul[cumul.length - 1]!;
  const c: Cortege = {
    id: p.id, code, nom: p.nom ?? (code === 'D1' ? 'Cortège' : 'Troubles'), effectif,
    rayon_m: rayonCortege(code, effectif), vitesse_ms: Math.max(0.3, p.vitesse_kmh ?? 3) / 3.6,
    trajet, cumul, longueur_m, s: 0, x: p.depart.x, y: p.depart.y, cap: { x: 1, y: 0 }, rue: '', fini: !p.arrivee || longueur_m < 0.5,
  };
  return placer(c, 0);
}

function placer(c: Cortege, s: number): Cortege {
  const q = pointSurPolyligne(c.trajet, c.cumul, s);
  const nom = c.trajet[q.i]?.nom || c.rue;
  return { ...c, s: Math.min(s, c.longueur_m), x: q.x, y: q.y, cap: q.cap, rue: nom };
}

/** Avance le cortège de dt secondes (× echelle : accélérateur de démonstration). Pure : renvoie un nouvel objet. */
export function avancerCortege(c: Cortege, dt_s: number, echelle = 1): Cortege {
  if (c.fini) return c;
  const s = c.s + c.vitesse_ms * dt_s * echelle;
  const fini = s >= c.longueur_m;
  return { ...placer(c, fini ? c.longueur_m : s), fini };
}

// ---------- effets sur les contraintes ----------
export interface EffetsCortege {
  /** Contraintes recalculées : celles touchées par un D2 passent à « bloquee » (les autres gardent leur état de base). */
  contraintes: Contrainte[];
  /** Ids des portes/sorties dans la zone d'un D1 : à éviter (conseil de routage, pas un état de la contrainte). */
  a_eviter: string[];
  /** Ids bloqués de fait par un D2. */
  bloquees: string[];
}
const TYPES_TOUCHES: ReadonlySet<string> = new Set(['porte', 'sortie']);

export function effetsCortege(cortèges: readonly Cortege[], base: readonly Contrainte[]): EffetsCortege {
  const a_eviter = new Set<string>(), bloquees = new Set<string>();
  for (const k of base) {
    if (!TYPES_TOUCHES.has(k.type) || k.niveau !== 0) continue;
    for (const c of cortèges) {
      const d = dist(c, k);
      if (c.code === 'D2' && d < c.rayon_m + MARGE_D2_M) bloquees.add(k.id);
      else if (c.code === 'D1' && d < c.rayon_m + MARGE_D1_M) a_eviter.add(k.id);
    }
  }
  const contraintes = base.map((k) => (bloquees.has(k.id) && k.etat === 'ouverte' ? { ...k, etat: 'bloquee' as const } : { ...k }));
  return { contraintes, a_eviter: [...a_eviter].sort(), bloquees: [...bloquees].sort() };
}

/** Individus d'affichage (24 à 220), déterministes pour une graine. Repère local au cortège, avant rotation par le cap. */
export function individusAffichage(c: Cortege, graine: number): { dx: number; dy: number; phase: number }[] {
  const rng = mulberry32(graine);
  const nb = Math.max(24, Math.min(220, Math.round(Math.sqrt(c.effectif) * 4.5)));
  const rp = Math.sqrt(c.effectif / (1.5 * Math.PI));
  const Lh = Math.max(5, Math.min(55, c.effectif / (1.5 * 8) / 2)), Wh = Math.min(4, Math.max(2, rp * 0.5));
  const out: { dx: number; dy: number; phase: number }[] = [];
  for (let i = 0; i < nb; i++) out.push({ dx: (rng() * 2 - 1) * Lh, dy: (rng() * 2 - 1) * Wh, phase: rng() * Math.PI * 2 });
  return out;
}

/** Interface d'affichage à implémenter côté 3D ou carte. Aucune logique ici. */
export interface AfficheurCortege {
  afficher(cortèges: readonly Cortege[], effets: EffetsCortege): void;
}

/** Texte d'étiquette : « Cortège · 800 pers. · rue X ». */
export function etiquetteCortege(c: Cortege): string {
  return `${c.nom} · ${c.effectif} pers. · ${c.rue || 'rue'}${c.fini ? ' (arrivé)' : ''}`;
}
