// Expérience 1 : diagramme fondamental (vitesse et débit en fonction de la densité) sur un couloir en anneau (grille de 60 m, anneau de 40 m entre x = 10 et x = 50).
// Référence : Weidmann (1993), v(ρ) = v0 (1 − exp(−γ (1/ρ − 1/ρmax))), v0 = 1,34 m/s, γ = 1,913 /m², ρmax = 5,4 p/m².
import { navgrid, monde, observer, creerSonde } from './geometrie.mjs';

export const weidmann = (rho) => 1.34 * (1 - Math.exp(-1.913 * (1 / rho - 1 / 5.4)));
const L = 60, W = 4, X0 = 10, X1 = 50, FEN = [20, 40], DT = 0.1; // anneau de 40 m ; sorties à 10 m de la couture
export const DENSITES = [0.5, 1, 1.5, 2, 3, 4, 5];

export const grilleCouloir = (l = L) => navgrid({
  w: l, h: W, marcheur: () => true,
  sorties: [0, 1, 2, 3].map((r) => ({ n: 'Est', type: 'rue', cell: [0, r, l - 1] })),
});

// Anneau : un marcheur qui dépasse X1 est replacé en X0 (même z, même vitesse) ; voisinage périodique (voir geometrie.mjs).
// La densité est celle de la largeur nominale (4 m) : les centres ne peuvent occuper que 3,52 m (rayon 0,24 m de chaque côté).
export async function job({ rho, graine = 1, patches = [], chauffe = 25, mesure = 40, dt = DT }) {
  const m = await monde(grilleCouloir(), graine, patches, [X0, X1]);
  const sonde = creerSonde();
  const N = Math.round(rho * (X1 - X0) * W);
  const ny = Math.max(1, Math.min(7, Math.round(Math.sqrt((N * 3.4) / (X1 - X0))))), nx = Math.ceil(N / ny);
  for (let i = 0; i < N; i++) {
    const rg = i % ny, col = Math.floor(i / ny);
    const x = X0 + (((col + 0.5 + (rg % 2) * 0.5) * (X1 - X0)) / nx) % (X1 - X0);
    m.ajouter({ x, z: 0.3 + ((rg + 0.5) * 3.4) / ny + (m.rng() - 0.5) * 0.04, t: 0, vx: 0.8 });
  }
  let sv = 0, nech = 0, srho = 0;
  const aire = (FEN[1] - FEN[0]) * W, nPas = Math.round((chauffe + mesure) / dt);
  for (let p = 0; p < nPas; p++) {
    m.simStep(dt);
    for (const a of m.SIM.A) if (a.x >= X1) { a.x -= X1 - X0; a.out = false; }
    if (p % Math.round(0.3 / dt) === 0) observer(sonde, m, p % Math.round(1.5 / dt) === 0);
    if (p * dt >= chauffe) {
      let n = 0, v = 0;
      for (const a of m.SIM.A) if (a.x >= FEN[0] && a.x < FEN[1]) { n++; v += a.vx; }
      sv += v / aire; srho += n / aire; nech++;
    }
  }
  const rhoMes = srho / nech, J = sv / nech;
  return { ligne: { rho: rhoMes, rhoVoulue: rho, N, v: J / rhoMes, J, vW: weidmann(rhoMes), JW: rhoMes * weidmann(rhoMes) }, sonde };
}
// Tolérance sur la vitesse : ±20 % de la valeur de Weidmann, ou ±0,15 m/s si c'est plus large (la dispersion des données est de cet ordre).
export const tolV = (vW) => Math.max(0.2 * vW, 0.15);
