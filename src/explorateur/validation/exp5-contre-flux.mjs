// Expérience 5 : deux flux opposés dans un couloir en anneau (40 × 4 m), mélange aléatoire au départ ; formation de files ?
// Paramètre d'ordre (Yamori 1998 ; Helbing et al.) : pour chaque marcheur i, dans la bande |z − z_i| < 0,5 m, φ_i = ((n_mêmes − n_autres)/(n_mêmes + n_autres))²,
// Φ = moyenne des φ_i. Aléatoire : Φ ≈ 1/n (n = marcheurs par bande, ≈ 20) ; files parfaites : Φ = 1. On donne aussi Φ d'un tirage mélangé (hypothèse nulle).
// Références qualitatives : Helbing & Molnár 1995 (Phys. Rev. E 51) : les files émergent des forces sociales ; Zhang et al. 2012 (J. Stat. Mech. P02002) : files observées en expérience.
import { monde, observer, creerSonde } from './geometrie.mjs';
import { grilleCouloir } from './exp1-diagramme.mjs';

const L = 60, X0 = 10, X1 = 50, DT = 0.1;
const phi = (pts) => {
  let s = 0;
  for (const p of pts) {
    let a = 0, b = 0;
    for (const q of pts) if (Math.abs(q.z - p.z) < 0.5) { if (q.dir === p.dir) a++; else b++; }
    s += ((a - b) / (a + b)) ** 2;
  }
  return s / pts.length;
};

export async function job({ rho = 1, graine = 1, duree = 150, patches = [], dt = DT }) {
  const grille = grilleCouloir(L);
  // deuxième sortie à l'ouest (colonne 0 ; coordonnées déjà décalées du PAD de 2 cellules)
  grille.exits.push(...[0, 1, 2, 3].map((r) => ({ id: 10 + r, n: 'Ouest', type: 'rue', cell: [0, r + 2, 2] })));
  const m = await monde(grille, graine, patches, [X0, X1]), sonde = creerSonde();
  const iE = m.groupe('Est'), iO = m.groupe('Ouest');
  const N = Math.round(rho * (X1 - X0) * 4), pts = [];
  for (let i = 0; i < N; i++) {
    for (let e = 0; e < 300; e++) {
      const x = X0 + m.rng() * (X1 - X0), z = 0.3 + m.rng() * 3.4;
      if (pts.every((q) => Math.hypot(Math.min(Math.abs(q.x - x), X1 - X0 - Math.abs(q.x - x)), q.z - z) > 0.5)) {
        const dir = i % 2 ? 1 : -1;
        pts.push(m.ajouter({ x, z, t: dir > 0 ? iE : iO, dir, vx: 0.5 * dir })); break;
      }
    }
  }
  const serie = [];
  for (let p = 0; p < Math.round(duree / dt); p++) {
    m.simStep(dt);
    for (const a of m.SIM.A) { if (a.x >= X1) a.x -= X1 - X0; else if (a.x < X0) a.x += X1 - X0; a.out = false; }
    if (p % Math.round(0.3 / dt) === 0) observer(sonde, m, false);
    if (p % Math.round(5 / dt) === 0) serie.push([+(p * dt).toFixed(0), phi(pts)]);
  }
  const fin = phi(pts);
  // hypothèse nulle : mêmes positions, directions tirées au hasard
  let nulle = 0; const K = 20;
  for (let k = 0; k < K; k++) {
    const dirs = pts.map(() => (m.rng() < 0.5 ? 1 : -1));
    nulle += phi(pts.map((q, i) => ({ z: q.z, dir: dirs[i] })));
  }
  const moy = (f) => pts.reduce((s, a) => s + f(a), 0) / pts.length;
  const vit = moy((a) => Math.abs(a.vx)), vitMoyDir = Math.abs(moy((a) => a.vx * a.dir));
  // nombre de files : changements de direction dominante par pas de 0,25 m en z
  const bandes = []; for (let z = 0.3; z < 3.7; z += 0.25) { const s = pts.filter((a) => Math.abs(a.z - z) < 0.25).reduce((q, a) => q + a.dir, 0); bandes.push(Math.sign(s)); }
  const files = bandes.filter((s, i) => i && s && bandes[i - 1] && s !== bandes[i - 1]).length + 1;
  return { ligne: { N, phiFin: fin, phiNulle: nulle / K, serie, vit, vitMoyDir, files }, sonde };
}
