import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapMoyenne, champCsv, comparer, convergence, ligneCsv, quantileStudent, resumer, sousIncertitudeModele, verdict } from './stats.ts';

test('CSV : un champ avec virgule est entre guillemets, le nombre de colonnes reste juste', () => {
  assert.equal(champCsv('modèle simplifié, non certifié'), '"modèle simplifié, non certifié"');
  assert.equal(champCsv('a"b'), '"a""b"');
  const l = ligneCsv(['t90', 12.5, 'modèle simplifié, non certifié', 'fin']);
  assert.equal(l, 't90,12.5,"modèle simplifié, non certifié",fin');
  assert.equal(l.match(/"[^"]*"|[^,]+/g)!.length, 4);
});

test('Student : quantiles exacts selon les degrés de liberté', () => {
  assert.equal(quantileStudent(19).toFixed(3), '2.093');
  assert.equal(quantileStudent(99).toFixed(3), '1.984');
  assert.equal(quantileStudent(18).toFixed(3), '2.101');
  assert.equal(quantileStudent(1).toFixed(3), '12.706');
  assert.equal(quantileStudent(19, 0.9975).toFixed(2), '3.17');
});

test('IC 95 % de Student : 20 valeurs, demi-largeur = 2,093 × s / √20', () => {
  const xs = Array.from({ length: 20 }, (_, i) => 100 + i);
  const r = resumer(xs);
  const demi = (2.093 * r.sd) / Math.sqrt(20);
  assert.ok(Math.abs(r.haut - r.moy - demi) < 0.01);
  assert.equal(r.plafond, false);
});

test('différence appariée : IC, différence relative, d_z, verdict', () => {
  const avant = [100, 102, 98, 101, 99, 100, 103, 97, 100, 100];
  const apres = avant.map((x, i) => x - 20 + (i % 3)); // environ −19 : mieux si moins est mieux
  const c = comparer(avant, apres);
  assert.equal(c.n, 10);
  assert.ok(Math.abs(c.d.moy - -19.1) < 0.05);
  assert.ok(c.d.haut < 0 && c.d.bas < c.d.moy);
  assert.ok(Math.abs(c.diff_relative_pct - -19.1) < 0.2);
  assert.ok(c.d_z < -10);
  assert.ok(c.boot_bas < c.d.moy && c.boot_haut > c.d.moy);
  assert.equal(verdict(c, 'moins_est_mieux', 100), 'mieux');
  assert.equal(verdict(c, 'plus_est_mieux', 100), 'pire');
  assert.equal(sousIncertitudeModele(c.diff_relative_pct), true); // −19 % est sous 30 %
  assert.equal(sousIncertitudeModele(59), false);
});

test('une valeur manquante retire la paire (ddl = paires − 1)', () => {
  const c = comparer([1, 2, null, 4], [2, 3, 3, 6]);
  assert.equal(c.n, 3);
});

test('bootstrap : même graine, même intervalle', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(bootstrapMoyenne(xs), bootstrapMoyenne(xs));
});

test('variance nulle : verdict « plafond », pas un intervalle [0 ; 0]', () => {
  const zeros = new Array(20).fill(0);
  const c = comparer(zeros, zeros);
  assert.equal(c.d.plafond, true);
  assert.equal(verdict(c, 'moins_est_mieux', 0), 'plafond');
  assert.equal(resumer([3, 3, 3]).plafond, true);
});

test('convergence : série stable converge, série qui dérive non', () => {
  const stable = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 ? 1 : -1));
  assert.equal(convergence(stable).converge, true);
  const derive = Array.from({ length: 60 }, (_, i) => i * i);
  assert.equal(convergence(derive).converge, false);
  assert.equal(convergence(new Array(30).fill(0)).converge, true);
});
