// Expérience 3 : débit et temps de trajet sur un lien vertical (escalier ou escalator) avec une file de 120 personnes au pied.
// Références : escalier ≈ 0,5 à 0,7 m/s le long de la pente (Fruin 1971 ; Weidmann 1993 ; valeurs du brief) ;
// escalator : débit pratique ≈ 1,0 à 1,4 p/s (Al-Sharif 1996 ; Kinsey ; valeurs du brief), vitesse nominale 0,75 m/s.
import { navgrid, monde, observer, creerSonde } from './geometrie.mjs';

const DT = 0.1, LEN = 7; // 7 m le long de la pente (≈ 3,5 m de dénivelé à 30°)

export async function job({ type, N = 120, graine = 1, patches = [], dt = DT }) {
  // niveau 0 : cols 0..19 ; niveau 1 : cols 14..45 (sortie en col 45). Lien en (2,17) → (2,17) d'un niveau à l'autre.
  const grille = navgrid({
    w: 46, h: 5, levels: [0, -4],
    marcheur: (l, r, c) => (l === 0 ? c <= 19 : c >= 14),
    liens: [{ k: type, a: [0, 2, 17], b: [1, 2, 17], len: LEN }],
    sorties: [0, 1, 2, 3, 4].map((r) => ({ n: 'Sortie', type: 'rue', cell: [1, r, 45] })),
  });
  const m = await monde(grille, graine, patches), sonde = creerSonde();
  const agents = [];
  for (let i = 0; i < N; i++) agents.push(m.ajouter({ l: 0, x: 3 + (i % 24) * 0.6 + m.rng() * 0.1, z: 0.4 + Math.floor(i / 24) * 0.9 + m.rng() * 0.1, t: 0 }));
  const debut = new Map(), fin = new Map(); let tSortie = null;
  const lien = m.SIM.g.links[0];
  for (let p = 0; p < 600 / dt; p++) {
    m.simStep(dt);
    for (const a of agents) {
      if (a.ride && !debut.has(a)) debut.set(a, m.SIM.T);
      if (debut.has(a) && !a.ride && !fin.has(a)) fin.set(a, m.SIM.T);
    }
    if (p % Math.round(0.3 / dt) === 0) observer(sonde, m, false);
    if (agents.every((a) => a.out)) { tSortie = m.SIM.T; break; }
  }
  const d = [...debut.values()].sort((a, b) => a - b);
  const dur = agents.filter((a) => fin.has(a)).map((a) => fin.get(a) - debut.get(a));
  const i10 = Math.floor(d.length * 0.1), i90 = Math.floor(d.length * 0.9) - 1;
  const debit = (i90 - i10) / (d[i90] - d[i10]);
  const trajet = dur.reduce((s, x) => s + x, 0) / dur.length;
  return { ligne: { type, N, montes: d.length, debit, debitParam: lien.debit, trajet, vPente: LEN / trajet, tSortie }, sonde };
}
