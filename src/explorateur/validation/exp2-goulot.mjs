// Expérience 2 : une salle se vide par une porte de largeur variable ; débit spécifique J_s = flux / largeur.
// Références (valeurs du brief, à re-citer avec soin) : Seyfried et al. 2009 (Transportation Science 43), Kretz et al. 2006 (J. Stat. Mech. P10014),
// Liddle : ≈ 1,6 à 1,9 p/m/s ; valeur de dimensionnement ≈ 1,3 p/m/s (SFPE / Fruin).
import { navgrid, monde, observer, creerSonde } from './geometrie.mjs';

const DT = 0.1, SALLE = [12, 10], HALL = 6; // salle 12 × 10 m, puis un hall de 6 m derrière la porte

// res : taille de cellule en m. 1 = la grille de production (portes de 1, 2, 3 m seulement) ; 0,2 = grille fine (portes 0,8 à 2,4 m).
export async function job({ largeur, res = 1, N = 150, graine = 1, patches = [], dt = DT }) {
  const k = 1 / res, w = Math.round((SALLE[0] + HALL) * k) + Math.max(1, Math.ceil(0.6 * k)), h = Math.round(SALLE[1] * k);
  const colMur = Math.round(SALLE[0] * k), epMur = Math.max(1, Math.ceil(0.6 * k)), nPorte = Math.round(largeur * k), r0 = Math.round((h - nPorte) / 2);
  const grille = navgrid({
    w, h, res, marcheur: (l, r, c) => c < colMur || c >= colMur + epMur || (r >= r0 && r < r0 + nPorte),
    sorties: Array.from({ length: h }, (_, r) => ({ n: 'Porte', type: 'rue', cell: [0, r, w - 1] })),
  });
  const m = await monde(grille, graine, patches), sonde = creerSonde();
  const xPorte = (colMur + epMur / 2) * res, n = N;
  // aire de départ : toute la salle, tirage rejeté si trop proche d'un voisin déjà posé
  const posees = [];
  for (let i = 0; i < n; i++) {
    for (let essai = 0; essai < 400; essai++) {
      const x = 0.4 + m.rng() * (SALLE[0] - 0.8), z = 0.4 + m.rng() * (SALLE[1] - 0.8);
      if (posees.every((q) => Math.hypot(q[0] - x, q[1] - z) > 0.55)) { posees.push([x, z]); break; }
    }
  }
  const agents = posees.map(([x, z]) => m.ajouter({ x, z, t: 0 }));
  const franchi = new Map();
  for (let p = 0; p < 400 / dt; p++) {
    m.simStep(dt);
    for (const a of agents) if (!franchi.has(a) && a.x > xPorte) franchi.set(a, m.SIM.T);
    if (p % Math.round(0.3 / dt) === 0) observer(sonde, m, false);
    if (m.SIM.A.every((a) => a.out)) break;
  }
  const t = [...franchi.values()].sort((a, b) => a - b), nn = t.length;
  const i10 = Math.floor(nn * 0.1), i90 = Math.floor(nn * 0.9) - 1;
  const flux = nn > 10 && t[i90] > t[i10] ? (i90 - i10) / (t[i90] - t[i10]) : NaN;
  const dehors = m.SIM.A.filter((a) => a.out).length;
  return { ligne: { largeur: nPorte * res, res, N: n, sortis: nn, dehors, flux, Js: flux / (nPorte * res), duree: t[nn - 1] }, sonde };
}
