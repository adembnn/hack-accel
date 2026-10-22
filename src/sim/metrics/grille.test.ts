import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculerGrille, ligneRouge, LIBELLE_PRESSION, percentile, PRESSION_EST_PROXY, SEUIL_PRESSION_HELBING, type Mesures } from './grille.ts';

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

test('exemple du rapport : 180 personnes-minutes d’écrasement = note 35,7', () => {
  const g = calculerGrille(base({ ecrasement_personnes_minutes: 180 }));
  assert.ok(Math.abs(g.ecrasement.note - 100 / 2.8) < 1e-9);
});

test('la pression proxy ne fait pas basculer la ligne rouge ni ne pèse dans le total', () => {
  const sans = base();
  const proxy = base({ pression_max: 1.2 }); // 60 fois le seuil de Helbing
  assert.equal(ligneRouge(proxy), false);
  assert.equal(calculerGrille(proxy).total, calculerGrille(sans).total);
  assert.equal(calculerGrille(proxy).pression_helbing_max, 1.2); // valeur gardée pour l'affichage
  assert.equal(SEUIL_PRESSION_HELBING, 0.02);
  assert.match(LIBELLE_PRESSION, /proxy/);
  assert.equal(PRESSION_EST_PROXY, true);
});

test('la ligne rouge bascule sur l’écrasement', () => {
  assert.equal(ligneRouge(base({ ecrasement_personnes_minutes: 0.5 })), true);
});

test('le non-sorti pèse plus que l’écrasement dans le total (ordre de la grille)', () => {
  const pasSortis = calculerGrille(base({ t_sortie_s: new Array(10).fill(Infinity), sorties_sures: 0 }));
  const ecrase = calculerGrille(base({ ecrasement_personnes_minutes: 1e6 }));
  assert.ok(pasSortis.total < ecrase.total);
  assert.match(pasSortis.avertissement, /non certifié/);
});

test('PMR sortis ou à l’abri en espace d’attente sécurisé à 22 h : l’abri compte comme sécurisé, mais pas dans le total', () => {
  const pasSorties = { t_sortie_s: [10, 20, 30, 40, 50, 60, 70, 80, 9000, Infinity] }; // les personnes 8 et 9 sont PMR
  const sansAbri = calculerGrille(base(pasSorties));
  assert.equal(sansAbri.pmr_sortis_ou_abri_22h!.valeur, 2);
  assert.equal(sansAbri.pmr_sortis_ou_abri_22h!.valeur, sansAbri.non_sortis_22h_mobilite_reduite.valeur);
  const debut = new Array(10).fill(600);
  const tousAbrites = calculerGrille(base({ ...pasSorties, pmr_abri_debut_s: debut, pmr_abri_fin_s: new Array(10).fill(Infinity) }));
  assert.equal(tousAbrites.pmr_sortis_ou_abri_22h!.valeur, 0);
  assert.equal(tousAbrites.pmr_sortis_ou_abri_22h!.note, 100);
  const reparti = calculerGrille(base({ ...pasSorties, pmr_abri_debut_s: debut, pmr_abri_fin_s: [...new Array(8).fill(Infinity), 6000, Infinity] })); // la personne 8 a quitté l'abri avant 22 h sans être sortie
  assert.equal(reparti.pmr_sortis_ou_abri_22h!.valeur, 1);
  assert.equal(tousAbrites.non_sortis_22h_mobilite_reduite.valeur, 2); // l'ancien critère ne change pas
  assert.equal(tousAbrites.total, sansAbri.total);
});
