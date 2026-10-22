// Petit lieu inventé pour les tests : 2 niveaux de 40 x 20 m, 3 portes de rue, un escalator et un escalier.
// Le niveau 1 (altitude -2) n'a aucune sortie : il faut monter par un lien pour sortir.
import type { NavGrid, Scene } from './navgrid';

const W = 40;
const H = 20;

function emballer(grille: Uint8Array): string {
  const octets = new Uint8Array(Math.ceil(grille.length / 8));
  for (let i = 0; i < grille.length; i++) if (grille[i]) octets[i >> 3] |= 1 << (7 - (i & 7));
  return Buffer.from(octets).toString('base64');
}

function niveau(murs: (r: number, c: number) => boolean): Uint8Array {
  const u = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) u[r * W + c] = r === 0 || c === 0 || r === H - 1 || c === W - 1 || murs(r, c) ? 0 : 1;
  return u;
}

export function navgridSynthetique(): NavGrid {
  const n0 = niveau((r, c) => c === 20 && r >= 1 && r <= 13);
  const n1 = niveau((r, c) => (r >= 8 && r <= 11 && c >= 8 && c <= 11) || (c === 25 && r >= 1 && r <= 8));
  return {
    bbox: [0, 0, W, H],
    res: 1,
    w: W,
    h: H,
    levels: [0, -2],
    walk: [emballer(n0), emballer(n1)],
    reach: [emballer(n0), emballer(n1)],
    links: [
      { k: 'escalator', n: 'Escalator est', a: [1, 10, 35], b: [0, 10, 35], len: 8 },
      { k: 'escalier', n: 'Escalier ouest', a: [1, 3, 3], b: [0, 3, 3], len: 8 },
    ],
    exits: [
      { n: 'Porte Nord', type: 'rue', cell: [0, 1, 5] },
      { n: 'Rambuteau', type: 'rue', cell: [0, 18, 35] },
      { n: 'Porte Est', type: 'rue', cell: [0, 10, 38] },
    ],
  };
}

/** Une salle de cinéma sur le niveau -2, côté ouest. */
export function sceneSynthetique(): Scene {
  return { interieur: [{ n: 'UGC Ciné Cité', p: [2, 2, 18, 2, 18, 17, 2, 17, 2, 2] }] };
}
