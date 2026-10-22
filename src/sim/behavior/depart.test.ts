// Tests du départ (délai de pré-mouvement) : node --test.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  facteurClarte, FORME_MIN, medianePreset, multiplicateurDelai, nePartPas, PRESET_CENTRAL, PRESET_LENT, PRESET_PLANCHER,
  quantileLogLogistique, tirerDelaiLogLogistique, tirerDelaiPreset,
} from './depart.ts';
import { creerRng } from './rng.ts';

test('quantiles de la loi : 5 % = 24,4 s, 50 % = 40,5 s, 95 % = 67,3 s (maths 2 §2)', () => {
  assert.ok(Math.abs(quantileLogLogistique(0.05) - 24.4) < 0.1);
  assert.equal(quantileLogLogistique(0.5), 40.5);
  assert.ok(Math.abs(quantileLogLogistique(0.95) - 67.3) < 0.1);
});

test('le tirage suit la loi : médiane et quantiles empiriques proches', () => {
  const rng = creerRng(7);
  const xs = Array.from({ length: 20000 }, () => tirerDelaiLogLogistique(rng)).sort((a, b) => a - b);
  const q = (p: number) => xs[Math.floor(p * xs.length)];
  for (const p of [0.05, 0.5, 0.95]) assert.ok(Math.abs(q(p) - quantileLogLogistique(p)) < 1.5, `p=${p}`);
});

test('facteur de clarté continu : extrémités 1,3 et 0,75, pas de saut entre 0,49 et 0,51', () => {
  assert.ok(Math.abs(facteurClarte(0) - 1.3) < 1e-12 && Math.abs(facteurClarte(1) - 0.75) < 1e-12);
  const a = facteurClarte(0.49), b = facteurClarte(0.51);
  assert.ok(Math.abs(a - b) / a < 0.03, `${a} contre ${b}`);
  for (let c = 0; c < 0.99; c += 0.01) assert.ok(facteurClarte(c + 0.01) < facteurClarte(c)); // décroît sans à-coup
});

test('multiplicateur : guidage x0,8, contexte multiplie, sans ordre = hypothèse x30', () => {
  assert.equal(multiplicateurDelai({ clarte: null, guide: false, ordonne: true }), 1);
  assert.ok(Math.abs(multiplicateurDelai({ clarte: null, guide: true, ordonne: true }) - 0.8) < 1e-12);
  assert.ok(Math.abs(multiplicateurDelai({ clarte: 0.5, guide: false, ordonne: true, contexte: 1.5 }) - 1.5 * facteurClarte(0.5)) < 1e-12);
  assert.equal(multiplicateurDelai({ clarte: null, guide: false, ordonne: false }), 30);
});

test('préréglages : médianes ~40, 61 et 101 s, formes 5,8 / 4,0 / 2,5, p_reste 0 / 0 / 15 %', () => {
  assert.equal(medianePreset(PRESET_PLANCHER), 40.5);
  assert.ok(Math.abs(medianePreset(PRESET_CENTRAL) - 61) < 0.5);
  assert.ok(Math.abs(medianePreset(PRESET_LENT) - 101) < 0.5);
  assert.deepEqual([PRESET_PLANCHER.forme, PRESET_CENTRAL.forme, PRESET_LENT.forme], [5.8, 4.0, 2.5]);
  assert.deepEqual([PRESET_PLANCHER.p_reste, PRESET_CENTRAL.p_reste, PRESET_LENT.p_reste], [0, 0, 0.15]);
  // central : 95e centile ~127 s (maths 2 §4)
  const m = medianePreset(PRESET_CENTRAL);
  assert.ok(Math.abs(quantileLogLogistique(0.95, m, PRESET_CENTRAL.forme) - 127) < 2);
});

test('garde : forme < 2,5 refusée, 2,5 acceptée', () => {
  const rng = creerRng(1);
  assert.throws(() => tirerDelaiLogLogistique(rng, 40.5, 2.4), RangeError);
  assert.throws(() => quantileLogLogistique(0.5, 40.5, 1.5), RangeError);
  assert.doesNotThrow(() => quantileLogLogistique(0.5, 40.5, FORME_MIN));
});

test('p_reste : fonction pure, 0 par défaut ; la part tirée suit p_reste et ceux-là valent Infinity', () => {
  assert.equal(nePartPas(0, 0), false);
  assert.equal(nePartPas(0.04, 0.05), true);
  assert.equal(nePartPas(0.05, 0.05), false);
  const rng = creerRng(3);
  const xs = Array.from({ length: 20000 }, () => tirerDelaiPreset(rng, PRESET_LENT));
  const part = xs.filter((x) => x === Infinity).length / xs.length;
  assert.ok(Math.abs(part - 0.15) < 0.015, `part ${part}`);
  const rng2 = creerRng(3);
  assert.ok(Array.from({ length: 2000 }, () => tirerDelaiPreset(rng2, PRESET_PLANCHER)).every(Number.isFinite));
});
