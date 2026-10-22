import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  debitWeidmann,
  densiteLocale,
  ecrasementDuPas,
  pressionHelbing,
  R_DENSITE_M,
  vitesseLocale,
  vitesseWeidmann,
  type Point,
  type Vitesse,
} from './pression.ts';

const proche = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b} (±${tol})`);

/** Foule uniforme : une personne tous les `pas` mètres sur un carré de côté `cote`. */
function reseau(cote: number, pas: number): Point[] {
  const pts: Point[] = [];
  for (let x = 0; x < cote; x += pas) for (let y = 0; y < cote; y += pas) pts.push({ x, y });
  return pts;
}

test('densité : une personne seule, au centre = 1/(πR²)', () => {
  const [rho] = densiteLocale([{ x: 3, y: 4 }]);
  proche(rho, 1 / (Math.PI * R_DENSITE_M ** 2), 1e-12);
});

test('densité : exemple du rapport (5 personnes, point (0,0)) = 0,86 pers./m2', () => {
  const pos: Point[] = [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
  const vit: Vitesse[] = [{ vx: 0.1, vy: 0 }, { vx: 0, vy: 0.1 }, { vx: 0.2, vy: 0 }, { vx: -0.1, vy: 0 }, { vx: 0.5, vy: 0 }];
  const [rho] = densiteLocale(pos, [{ x: 0, y: 0 }]);
  proche(rho, 0.86, 0.01);
  const [v] = vitesseLocale(pos, vit, [{ x: 0, y: 0 }]);
  proche(v.vx, 0.093, 0.002);
  proche(v.vy, 0.029, 0.002);
});

test('densité : foule uniforme à 4 pers./m2 (pas de 0,5 m) = 4 au milieu', () => {
  const pos = reseau(20, 0.5);
  const rho = densiteLocale(pos, [{ x: 10.25, y: 10.25 }, { x: 10, y: 10 }]);
  proche(rho[0], 4, 0.05);
  proche(rho[1], 4, 0.05);
});

test('densité : le hachage spatial donne le même résultat que le calcul direct', () => {
  const pos = reseau(10, 0.7).map((p, i) => ({ x: p.x + (i % 3) * 0.1, y: p.y }));
  const rho = densiteLocale(pos);
  const direct = pos.map((c) => pos.reduce((s, p) => s + Math.exp(-((p.x - c.x) ** 2 + (p.y - c.y) ** 2)) / Math.PI, 0));
  rho.forEach((r, i) => proche(r, direct[i], 2e-3 * direct[i])); // l'écart vient seulement de la coupure à 3 R
});

test('pression nulle si toutes les vitesses sont égales (et si personne)', () => {
  const pos = reseau(10, 0.5);
  proche(pressionHelbing(pos, pos.map(() => ({ vx: 0.3, vy: -0.2 }))), 0, 1e-12); // arrondi flottant près
  assert.equal(pressionHelbing([], []), 0);
});

test('pression positive quand les vitesses diffèrent, et croît avec leur dispersion', () => {
  const pos = reseau(10, 0.5);
  const agite = (a: number): Vitesse[] => pos.map((p) => ({ vx: a * Math.sin(p.x), vy: a * Math.cos(p.y) }));
  const p1 = pressionHelbing(pos, agite(0.1));
  const p2 = pressionHelbing(pos, agite(0.2));
  assert.ok(p1 > 0);
  proche(p2 / p1, 4, 0.01); // la variance est quadratique en vitesse
});

test('Weidmann : v(1,75) ≈ 0,70 m/s ; v(4) ≈ 0,16 ; nulle à ρmax ; v0 à vide', () => {
  proche(vitesseWeidmann(1.75), 0.7, 0.01);
  proche(vitesseWeidmann(4), 0.16, 0.01);
  assert.equal(vitesseWeidmann(5.4), 0);
  assert.equal(vitesseWeidmann(8), 0);
  assert.equal(vitesseWeidmann(0), 1.34);
});

test('Weidmann : débit maximal ≈ 1,22 pers./m/s vers 1,75 pers./m2', () => {
  let meilleur = { rho: 0, j: 0 };
  for (let rho = 0.05; rho < 5.4; rho += 0.01) {
    const j = debitWeidmann(rho);
    if (j > meilleur.j) meilleur = { rho, j };
  }
  proche(meilleur.j, 1.22, 0.01);
  proche(meilleur.rho, 1.75, 0.1);
});

test('écrasement : 120 personnes pendant 90 s = 180 personnes-minutes', () => {
  const dense = new Array(120).fill(6);
  let total = 0;
  for (let t = 0; t < 90; t++) total += ecrasementDuPas(dense, 1);
  proche(total, 180, 1e-9);
  assert.equal(ecrasementDuPas([5, 4.9, 5.1], 60), 1); // strictement au-dessus de 5 : une seule personne, une minute
});
