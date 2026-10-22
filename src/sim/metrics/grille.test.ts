import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculerGrille, percentile, type Mesures } from './grille.ts';

const base = (o: Partial<Mesures> = {}): Mesures => ({
  n: 10,
  t_sortie_s: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  mobilite_reduite: [false, false, false, false, false, false, false, false, true, true],
  danger_personnes_minutes: 0,
  culs_de_sac: 0,
  sorties_sures: 10,
  ecrasement_personnes_minutes: 0,
  pression_max: 0,
  echeances: { metro_s: 7200, couvre_feu_s: 10800 },
  ...o,
});

test('percentile : t90 et t99 ; null si moins de 90 % sortis', () => {
  assert.equal(percentile(base().t_sortie_s, 0.9), 90);
  assert.equal(percentile([1, 2, Infinity, Infinity], 0.9), null);
});

test('non sortis à 22 h et 23 h, dont mobilité réduite', () => {
  const g = calculerGrille(base({ t_sortie_s: [10, 20, 30, 40, 50, 60, 70, 8000, 9000, Infinity] }));
  assert.equal(g.non_sortis_22h.valeur, 3);
  assert.equal(g.non_sortis_23h.valeur, 1);
  assert.equal(g.non_sortis_22h_mobilite_reduite.valeur, 2); // ids 8 et 9, tous deux à mobilité réduite
  assert.ok(g.non_sortis_22h.note < g.non_sortis_23h.note);
});

test('zone de danger : culs-de-sac et personnes-minutes pondérées baissent la note', () => {
  const propre = calculerGrille(base());
  const sale = calculerGrille(base({ danger_personnes_minutes: 100, culs_de_sac: 3 }));
  assert.ok(sale.zone_danger.note < propre.zone_danger.note);
  assert.ok(sale.total < propre.total);
});

test('écrasement : personnes-minutes au-dessus de 5 pers./m2 ; zéro = 100', () => {
  assert.equal(calculerGrille(base()).ecrasement.note, 100);
  const g = calculerGrille(base({ ecrasement_personnes_minutes: 100 }));
  assert.equal(g.ecrasement.valeur, 100);
  assert.equal(g.ecrasement.note, 50);
});

test('le non-sorti pèse plus que l’écrasement dans le total (ordre de la grille)', () => {
  const pasSortis = calculerGrille(base({ t_sortie_s: new Array(10).fill(Infinity), sorties_sures: 0 }));
  const ecrase = calculerGrille(base({ ecrasement_personnes_minutes: 1e6 }));
  assert.ok(pasSortis.total < ecrase.total);
  assert.match(pasSortis.avertissement, /non certifié/);
});
