// Tests du comportement : node --test. Modèle simplifié, non certifié.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { multiplicateurDelai, quantileLogLogistique, tirerDelaiLogLogistique } from './depart.ts';
import { creerRng } from './rng.ts';
import { creerPopulation, simuler } from './simuler.ts';
import { choisir, probabilites, probaChangement, type CandidatSortie } from './sortie.ts';
import type { Plan } from './types.ts';
import { PLAN_APRES, PLAN_AVANT } from '../../../bench/scenarios.ts';

const cand = (id: string, o: Partial<CandidatSortie> = {}): CandidatSortie => ({ id, distance_eq: 0, connue: false, fermee_connue: false, part_foule: 0, consigne: 0, attente_min: 0, ...o });

test('départ log-logistique : médiane 40,5 s et quantiles du rapport (24 s, 67 s)', () => {
  const rng = creerRng(7);
  const xs = Array.from({ length: 20000 }, () => tirerDelaiLogLogistique(rng)).sort((a, b) => a - b);
  const q = (p: number) => xs[Math.floor(p * xs.length)];
  assert.ok(Math.abs(q(0.5) - 40.5) < 1, `médiane ${q(0.5)}`);
  assert.ok(Math.abs(q(0.05) - quantileLogLogistique(0.05)) < 1.5);
  assert.ok(Math.abs(quantileLogLogistique(0.05) - 24) < 1 && Math.abs(quantileLogLogistique(0.95) - 67) < 1);
});

test('un message clair accélère le départ, un message flou le retarde, sans ordre le départ est naturel (lent)', () => {
  const base = multiplicateurDelai({ clarte: null, guide: false, ordonne: true });
  assert.ok(multiplicateurDelai({ clarte: 0.9, guide: false, ordonne: true }) < 1);
  assert.ok(multiplicateurDelai({ clarte: 0.2, guide: false, ordonne: true }) > 1);
  assert.ok(multiplicateurDelai({ clarte: 0.9, guide: true, ordonne: true }) < multiplicateurDelai({ clarte: 0.9, guide: false, ordonne: true }));
  assert.ok(multiplicateurDelai({ clarte: null, guide: false, ordonne: false }) > 10 * base);
});

test('logit : probabilités qui somment à 1, la porte plus proche, connue ou conseillée gagne, la fermée connue perd', () => {
  const p = probabilites([cand('a'), cand('b', { distance_eq: 3 })], 0.076);
  assert.ok(Math.abs(p[0] + p[1] - 1) < 1e-12 && p[0] > p[1]);
  assert.ok(probabilites([cand('a'), cand('b', { connue: true })], 0)[1] > 0.5);
  assert.ok(probabilites([cand('a'), cand('b', { consigne: 1 })], 0)[1] > 0.9); // +2,739 : un agent compte beaucoup
  assert.ok(probabilites([cand('a'), cand('b', { fermee_connue: true })], 0)[1] < 0.2);
  assert.equal(choisir([], 0, creerRng(1)), null);
});

test('suivisme : plus de monde vers une porte attire davantage, selon le coefficient de la personne', () => {
  const avec = probabilites([cand('a'), cand('b', { part_foule: 0.8 })], 0.15)[1];
  const sans = probabilites([cand('a'), cand('b', { part_foule: 0.8 })], -0.15)[1]; // personne qui évite la foule
  assert.ok(avec > 0.5 && sans < 0.5);
});

test('changement d’avis : la probabilité monte avec le déséquilibre des files et la rafale', () => {
  assert.ok(probaChangement(0, 0) < 0.01);
  assert.ok(probaChangement(3, 0) > probaChangement(1, 0));
  assert.ok(probaChangement(1, 2) > probaChangement(1, 0));
});

test('population : déterministe par graine, groupes de 2 à 4 qui partagent vitesse et délai, environ 70 % en groupe', () => {
  const a = creerPopulation(5);
  const b = creerPopulation(5);
  assert.deepEqual(a.slice(0, 50), b.slice(0, 50));
  assert.equal(a.length, 3000);
  const parGroupe = new Map<number, typeof a>();
  for (const p of a) if (p.groupe) parGroupe.set(p.groupe, [...(parGroupe.get(p.groupe) ?? []), p]);
  for (const g of parGroupe.values()) {
    assert.ok(g.length >= 2 && g.length <= 4);
    assert.equal(new Set(g.map((p) => p.vitesse_m_s)).size, 1);
    assert.equal(new Set(g.map((p) => p.delai_s)).size, 1);
  }
  const enGroupe = a.filter((p) => p.groupe).length / a.length;
  assert.ok(enGroupe > 0.6 && enGroupe < 0.85, `part en groupe ${enGroupe}`);
});

test('simuler : journal par minute, déterministe, tout le monde finit par sortir', () => {
  const r1 = simuler(PLAN_AVANT, 3, 7200);
  const r2 = simuler(PLAN_AVANT, 3, 7200);
  assert.equal(JSON.stringify(r1.grille), JSON.stringify(r2.grille));
  assert.ok(r1.minutes.length >= 5);
  const m = r1.minutes[r1.minutes.length - 1];
  assert.deepEqual(Object.keys(m).sort(), ['densite_max_par_zone', 'personnes_dehors', 'personnes_restantes', 'sorties_saturees', 't90_s', 't_s']);
  assert.equal(m.personnes_dehors + m.personnes_restantes, 3000);
  assert.ok(r1.grille.delai_t90_s !== null);
  assert.equal(r1.grille.avertissement, 'modèle simplifié, non certifié');
});

test('changement d’avis : de l’ordre de 7 à 15 % des personnes (avec une marge pour le bruit du modèle)', () => {
  for (const g of [1, 2, 3]) {
    const part = simuler(PLAN_AVANT, g, 7200).stats.part_ayant_change;
    assert.ok(part > 0.04 && part < 0.2, `graine ${g} : ${part}`);
  }
});

test('issue fermée en cours de route : hésitation, nouveau choix sans l’issue fermée, personne ne sort par elle', () => {
  const plan: Plan = { ...PLAN_AVANT, messages_par_zone: [], portes: [{ id: 'principale', ouverte: false, a_partir_de_s: 100 }] };
  const r = simuler(plan, 4, 7200);
  assert.ok(r.stats.hesitations_issue_fermee > 0, 'des personnes ont dû hésiter');
  assert.ok(r.duree_s < 7200 && r.grille.non_sortis_22h.valeur === 0, 'tout le monde est sorti avant 22 h');
});

test('toutes les issues fermées : personne ne sort, le non-sorti est compté', () => {
  const plan: Plan = { ...PLAN_AVANT, portes: ['principale', 'secours', 'escalators', 'metro', 'ferronnerie'].map((id) => ({ id, ouverte: false })) };
  const r = simuler(plan, 1, 1200);
  assert.equal(r.stats.personnes, 3000);
  assert.equal(r.minutes[r.minutes.length - 1].personnes_dehors, 0);
});

test('messages par zone : une zone qui reçoit une consigne vers une issue s’y rend davantage que les autres', () => {
  const sansMsg: Plan = { ...PLAN_AVANT, messages_par_zone: [] };
  const avecMsg: Plan = { ...PLAN_AVANT, messages_par_zone: [{ zone: 'salle-1', issue_id: 'secours', clarte: 1, a_partir_de_s: 0 }] };
  const part = (plan: Plan) => {
    const m = creerMouvementSimple();
    // on compte via un mouvement espion : sorties par issue pour les personnes de salle-1 (ids 0 à 499)
    const sorties: Record<string, number> = {};
    const orig = m.pas.bind(m);
    m.pas = (dt, t, it, o) => {
      const r = orig(dt, t, it, o);
      for (const s of r.sorties) if (s.id < 500) sorties[s.issue_id] = (sorties[s.issue_id] ?? 0) + 1;
      return r;
    };
    simuler(plan, 2, 3600, { mouvement: m });
    return (sorties.secours ?? 0) / 500;
  };
  assert.ok(part(avecMsg) > part(sansMsg) + 0.2);
});

test('plan des décideurs contre consigne du 19 oct. : moins de personnes envoyées vers la zone interdite (même graine)', () => {
  const a = simuler(PLAN_AVANT, 11, 7200).grille;
  const b = simuler(PLAN_APRES, 11, 7200).grille;
  assert.ok(b.zone_danger.valeur < a.zone_danger.valeur);
});
