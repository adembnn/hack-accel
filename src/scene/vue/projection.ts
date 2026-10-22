// Logique pure de la vue 3D (testable sans WebGL) : altitudes des niveaux, caméras, position et projection des épingles de leviers.
import type { Levier } from '../leviers.ts';
import { FORUM } from '../leviers.ts';

export const ETAGE_M = 6;
/** Altitude d'un niveau : le sous-sol est écarté (écart > 1) pour voir les étages, la surface compte 4 m par niveau. */
export const altitude = (niveau: number, ecart: number): number => (niveau < 0 ? niveau * ETAGE_M * ecart : niveau * 4);

export function paires(p: number[]): [number, number][] {
  const a: [number, number][] = [];
  for (let i = 0; i + 1 < p.length; i += 2) a.push([p[i], p[i + 1]]);
  if (a.length > 1 && a[0][0] === a[a.length - 1][0] && a[0][1] === a[a.length - 1][1]) a.pop();
  return a;
}

export type NomCamera = 'orbit' | 'top' | 'cut' | 'forum';
export function camera(nom: NomCamera): { position: [number, number, number]; cible: [number, number, number] } {
  const [fx, fz] = FORUM;
  switch (nom) {
    case 'top': return { position: [fx, 720, fz + 1], cible: [fx, 0, fz] };
    case 'cut': return { position: [fx, -40, fz + 430], cible: [fx, -40, fz] };
    case 'forum': return { position: [fx + 110, 90, fz + 150], cible: [fx, -20, fz] };
    default: return { position: [fx + 170, 170, fz + 230], cible: [fx, -10, fz] };
  }
}

/** Hauteur de l'épingle au-dessus de son niveau (m) : les bouches et les ascenseurs sont plus bas/hauts pour rester lisibles. */
export const HAUTEUR_EPINGLE: Record<Levier['type'], number> = { porte: 14, issue: 14, bouche: 10, ascenseur: 14 };

export function positionEpingle(l: Pick<Levier, 'x' | 'z' | 'niveau' | 'type'>, ecart: number): { x: number; y: number; z: number; base: number } {
  // maquette : portes et ascenseurs suivent l'altitude de leur niveau ; les autres épingles restent à la surface
  const y0 = l.type === 'ascenseur' || l.type === 'porte' ? altitude(l.niveau, ecart) : Math.max(altitude(l.niveau, ecart), 0);
  return { x: l.x, y: y0 + HAUTEUR_EPINGLE[l.type], z: l.z, base: y0 };
}

/** Une épingle est visible si on regarde « tous » les niveaux, ou si son niveau est celui choisi, ou (sous terre) si c'est une porte/un ascenseur. */
export function epingleVisible(l: Pick<Levier, 'niveau' | 'type'>, niveauChoisi: 'all' | number): boolean {
  if (niveauChoisi === 'all') return true;
  if (l.niveau === niveauChoisi) return true;
  return niveauChoisi < 0 ? l.type === 'ascenseur' || l.type === 'porte' : l.niveau >= 0;
}

/** Projette un point monde sur l'écran avec une matrice vue-projection 4x4 (colonne par colonne, comme three.js). */
export function projeterEcran(vp: ArrayLike<number>, p: { x: number; y: number; z: number }, largeur: number, hauteur: number): { x: number; y: number; visible: boolean } {
  const cx = vp[0] * p.x + vp[4] * p.y + vp[8] * p.z + vp[12];
  const cy = vp[1] * p.x + vp[5] * p.y + vp[9] * p.z + vp[13];
  const cw = vp[3] * p.x + vp[7] * p.y + vp[11] * p.z + vp[15];
  if (cw <= 0) return { x: NaN, y: NaN, visible: false };
  const nx = cx / cw, ny = cy / cw;
  return { x: (nx * 0.5 + 0.5) * largeur, y: (1 - (ny * 0.5 + 0.5)) * hauteur, visible: Math.abs(nx) <= 1 && Math.abs(ny) <= 1 };
}

/** Épingle sous le pointeur (la plus proche dans un rayon en pixels), pour le clic. */
export function epingleSousCurseur(
  epingles: { id: string; ecran: { x: number; y: number; visible: boolean } }[], px: number, py: number, rayon = 18,
): string | null {
  let best: string | null = null, bd = rayon;
  for (const e of epingles) {
    if (!e.ecran.visible) continue;
    const d = Math.hypot(e.ecran.x - px, e.ecran.y - py);
    if (d <= bd) { bd = d; best = e.id; }
  }
  return best;
}

/** Les N rues les plus longues près du Forum (une étiquette par nom), pour se repérer. */
export function nomsDeRues(rues: { k: string; n: string; p: number[] }[], rayon = 380, max = 22): { n: string; x: number; z: number }[] {
  const ok = new Set(['primary', 'secondary', 'tertiary', 'pedestrian', 'residential', 'living_street', 'unclassified']);
  const best = new Map<string, { L: number; x: number; z: number }>();
  for (const r of rues) {
    if (!r.n || !ok.has(r.k)) continue;
    const pts = paires(r.p);
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (Math.hypot(mx - FORUM[0], mz - FORUM[1]) >= rayon) continue;
      const cur = best.get(r.n);
      if (!cur || L > cur.L) best.set(r.n, { L, x: mx, z: mz });
    }
  }
  return [...best.entries()].sort((a, b) => b[1].L - a[1].L).slice(0, max).map(([n, v]) => ({ n, x: v.x, z: v.z }));
}
