// Tests du comportement : node --test. Modèle simplifié, non certifié.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { multiplicateurDelai, PRESET_CENTRAL, PRESET_LENT, PRESET_PLANCHER, quantileLogLogistique, tirerDelaiLogLogistique } from './depart.ts';
import { creerRng, creerRngPersonne } from './rng.ts';
import { creerPopulation, creerSimulation, lambdaGroupes, simuler, tirerTailleGroupe } from './simuler.ts';
import { SCENE_UGC } from './scene-ugc.ts';
import { choisir, PARAMS_CHOIX, probabilites, probaChangement, SUIVISME_SURPRIS, type CandidatSortie } from './sortie.ts';
import type { Plan } from './types.ts';
import { PLAN_APRES, PLAN_AVANT } from '../../../bench/scenarios.ts';

const cand = (id: string, o: Partial<CandidatSortie> = {}): CandidatSortie => ({ id, marche_min: 0, connue: false, fermee_connue: false, part_foule: 0, consigne: 0, attente_min: 0, ...o });
const neutre = { ...PARAMS_CHOIX, suivisme_moyen: 0, suivisme_ecart: 0 };

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

test('logit : probabilités qui somment à 1, la porte connue ou conseillée gagne, la fermée connue perd', () => {
  const p = probabilites([cand('a'), cand('b', { marche_min: 2 }), cand('c', { attente_min: 1 })], 0.076);
  assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.ok(probabilites([cand('a'), cand('b', { connue: true })], 0)[1] > 0.5);
  assert.ok(probabilites([cand('a'), cand('b', { consigne: 1 })], 0)[1] > 0.9); // +2,739 : un agent compte beaucoup
  assert.ok(probabilites([cand('a'), cand('b', { fermee_connue: true })], 0)[1] < 0.2);
  assert.equal(choisir([], 0, creerRng(1)), null);
});

test('logit en temps de marche : un trajet ou une file plus longs baissent la probabilité, θ amplifie l’effet', () => {
  const proba = (marche_min: number, attente_min = 0, theta = 0.9) =>
    probabilites([cand('a'), cand('b', { marche_min, attente_min })], 0, { ...neutre, theta_par_minute: theta })[1];
  assert.ok(proba(0.5) > proba(1) && proba(1) > proba(2));
  assert.ok(proba(0, 1) > proba(0, 3));
  assert.ok(Math.abs(proba(0, 0) - 0.5) < 1e-12);
  assert.ok(proba(2, 0, 3) < proba(2, 0, 0.9) && proba(2, 0, 0.9) < proba(2, 0, 0.3));
  // 100 m à 1,3 m/s (78 m/min) : pénalité de -0,9 x 1,28 = -1,15, comme la plage de la VR (-1,13)
  const p = proba(100 / 78);
  assert.ok(Math.abs(Math.log(p / (1 - p)) + 1.15) < 0.01);
  // variante « max » : la marche et l’attente ne s’additionnent pas
  const max = probabilites([cand('a'), cand('b', { marche_min: 1, attente_min: 1 })], 0, { ...neutre, cout_file: 'max' })[1];
  assert.ok(max > proba(1, 1));
});

test('logit : la correction des portes voisines (IIA) fait peser deux portes accolées comme une seule ; désactivée par défaut', () => {
  const sans = probabilites([cand('a'), cand('b'), cand('c')], 0, neutre);
  assert.ok(Math.abs(sans[0] - 1 / 3) < 1e-12);
  const avec = probabilites([cand('a', { n_voisines: 1 }), cand('b', { n_voisines: 2 }), cand('c', { n_voisines: 2 })], 0, { ...neutre, correction_iia: true });
  assert.ok(Math.abs(avec[0] - 0.5) < 1e-12 && Math.abs(avec[1] - 0.25) < 1e-12);
});

test('suivisme : plus de monde vers une porte attire davantage, selon le coefficient de la personne', () => {
  const avec = probabilites([cand('a'), cand('b', { part_foule: 0.8 })], 0.15)[1];
  const sans = probabilites([cand('a'), cand('b', { part_foule: 0.8 })], -0.15)[1]; // personne qui évite la foule
  assert.ok(avec > 0.5 && sans < 0.5);
});

test('changement d’avis (Haghani et Sarvi 2019) : la probabilité monte avec le ratio de congestion, la visibilité et l’influence sociale', () => {
  assert.ok(probaChangement(0, false, false) < 0.01);
  assert.ok(probaChangement(0.6, false, false) > probaChangement(0.2, false, false));
  assert.ok(probaChangement(0.3, true, false) > probaChangement(0.3, false, false));
  assert.ok(probaChangement(0.3, false, true) > probaChangement(0.3, false, false));
  // coefficients du papier : 3,5 par unité de ratio, 0,8 et 0,8
  const logit = (p: number) => Math.log(p / (1 - p));
  assert.ok(Math.abs(logit(probaChangement(1, true, true)) - logit(probaChangement(0, false, false)) - (3.5 + 0.8 + 0.8)) < 1e-9);
});

test('population : déterministe par graine, groupes qui partagent vitesse et délai, environ 70 % en groupe', () => {
  const a = creerPopulation(5);
  const b = creerPopulation(5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 3000);
  const parGroupe = new Map<number, typeof a>();
  for (const p of a) if (p.groupe) parGroupe.set(p.groupe, [...(parGroupe.get(p.groupe) ?? []), p]);
  for (const g of parGroupe.values()) {
    assert.ok(g.length >= 2 && g.length <= 6);
    assert.equal(new Set(g.map((p) => p.vitesse_m_s)).size, 1);
    assert.equal(new Set(g.map((p) => p.delai_s)).size, 1);
  }
  const enGroupe = a.filter((p) => p.groupe).length / a.length;
  assert.ok(enGroupe > 0.65 && enGroupe < 0.75, `part en groupe ${enGroupe}`);
});

test('tailles de groupe : Poisson tronquée à zéro, les paires dominent, la part de personnes seules vaut e^-λ = 1 - part en groupe', () => {
  assert.ok(Math.abs(lambdaGroupes(0.7) - 1.204) < 0.001);
  for (const part of [0.55, 0.7, 0.85]) {
    const rng = creerRng(11);
    const lambda = lambdaGroupes(part);
    const tailles = Array.from({ length: 100000 }, () => tirerTailleGroupe(rng, lambda));
    const compte = (k: number) => tailles.filter((x) => x === k).length;
    assert.ok(compte(2) > compte(3) && compte(3) > compte(4) && compte(4) > compte(5), `part ${part}`);
    assert.ok(Math.min(...tailles) === 1 && Math.max(...tailles) <= 6);
    const seules = compte(1) / tailles.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(seules - Math.exp(-lambda)) < 0.01, `part ${part} : seules ${seules} contre ${Math.exp(-lambda)}`);
  }
  // dans la population : parmi les groupes (taille >= 2), les paires sont majoritaires
  const tailles = new Map<number, number>();
  for (const x of creerPopulation(9)) if (x.groupe) tailles.set(x.groupe, (tailles.get(x.groupe) ?? 0) + 1);
  const paires = [...tailles.values()].filter((k) => k === 2).length;
  assert.ok(paires > 0.5 * tailles.size, `${paires} paires sur ${tailles.size} groupes`);
});

test('la part en groupe est un réglage : on retrouve 55 % et 85 %', () => {
  const part = (x: number) => creerPopulation(5, { part_groupes: x }).filter((p) => p.groupe).length / 3000;
  assert.ok(Math.abs(part(0.55) - 0.55) < 0.05 && Math.abs(part(0.85) - 0.85) < 0.05);
});

test('nombres aléatoires communs : deux plans différents, même graine = mêmes personnes, mêmes délais, mêmes flux par personne', () => {
  const sa = creerSimulation(SCENE_UGC, 21);
  const sb = creerSimulation(SCENE_UGC, 21);
  sa.pas(1, PLAN_AVANT);
  sb.pas(1, PLAN_APRES);
  assert.deepEqual(sa.personnes, sb.personnes); // population, vitesses et délais tirés
  assert.deepEqual(sa.personnes.map((p) => p.delai_s), creerPopulation(21).map((p) => p.delai_s));
  // le flux d'une personne ne dépend que de (graine, id, canal) : les décisions des autres ne le décalent pas
  assert.equal(creerRngPersonne(21, 7, 2).next(), creerRngPersonne(21, 7, 2).next());
  assert.notEqual(creerRngPersonne(21, 7, 2).next(), creerRngPersonne(21, 8, 2).next());
  assert.notEqual(creerRngPersonne(21, 7, 2).next(), creerRngPersonne(21, 7, 3).next());
  assert.notEqual(creerRngPersonne(21, 7, 2).next(), creerRngPersonne(22, 7, 2).next());
});

test('variante « surpris » : le suivisme moyen de la population passe de 0,076 à 0,233', () => {
  const moy = (opts = {}) => {
    const p = creerPopulation(3, opts);
    return p.reduce((a, b) => a + b.suivisme, 0) / p.length;
  };
  assert.ok(Math.abs(moy() - 0.076) < 0.01);
  assert.ok(Math.abs(moy({ choix: { suivisme_moyen: SUIVISME_SURPRIS } }) - SUIVISME_SURPRIS) < 0.01);
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

test('changement d’avis : 3 à 12 % des personnes changent au moins une fois (0-7,5 % en laboratoire, 7-15 % en VR), pour les deux plans', () => {
  const parts: number[] = [];
  for (const g of [1, 2, 3]) {
    for (const plan of [PLAN_AVANT, PLAN_APRES]) {
      const part = simuler(plan, g, 7200).stats.part_ayant_change;
      parts.push(part);
      assert.ok(part > 0.03 && part < 0.12, `graine ${g} : ${part}`);
    }
  }
  console.log(`ℹ part ayant changé d’avis (3 graines x 2 plans) : de ${(100 * Math.min(...parts)).toFixed(1)} % à ${(100 * Math.max(...parts)).toFixed(1)} %`);
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
  const avecMsg: Plan = { ...PLAN_AVANT, messages_par_zone: [{ zone: 'salle_01', issue_id: 'secours', clarte: 1, a_partir_de_s: 0 }] };
  const part = (plan: Plan) => {
    const m = creerMouvementSimple();
    // on compte via un mouvement espion : sorties par issue pour les personnes de salle_01 (ids 0 à 499)
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

test('creerSimulation pas à pas donne le même résultat que simuler, à graine égale', () => {
  const direct = simuler(PLAN_APRES, 3, 3600);
  const sim = creerSimulation(SCENE_UGC, 3);
  for (let k = 0; k < 60; k++) sim.pas(60, PLAN_APRES);
  assert.equal(JSON.stringify({ ...sim.journal(), plan: PLAN_APRES }), JSON.stringify(direct));
  // pas de 7 s ou de 1 s : même trajectoire (sous-pas d'au plus 1 s)
  const a = creerSimulation(SCENE_UGC, 3);
  const b = creerSimulation(SCENE_UGC, 3);
  for (let k = 0; k < 20; k++) a.pas(7, PLAN_APRES);
  for (let k = 0; k < 140; k++) b.pas(1, PLAN_APRES);
  assert.equal(JSON.stringify(a.etatResume()), JSON.stringify(b.etatResume()));
});

test('état résumé : temps, dedans, sortis, zones, débit des portes, pression', () => {
  const sim = creerSimulation(SCENE_UGC, 4);
  sim.pas(30, PLAN_AVANT);
  const e0 = sim.etatResume();
  assert.equal(e0.t_s, 30);
  assert.equal(e0.dans_le_centre + e0.sortis, 3000);
  sim.pas(150, PLAN_AVANT);
  const e = sim.etatResume();
  assert.ok(e.sortis > 0 && e.dans_le_centre < 3000 && e.t_s === 180);
  assert.deepEqual(Object.keys(e).sort(), ['dans_le_centre', 'debit_portes', 'densite_max', 'densite_max_depuis_debut', 'par_zone', 'pression_max', 'pression_max_depuis_debut', 'sortis', 'sortis_vers_zone_danger', 't_s']);
  assert.ok(e0.par_zone['salle_01'].personnes > 0, 'à 30 s, la salle n’est pas encore vide');
  assert.ok(e.par_zone['niveau_-1'] !== undefined);
  assert.equal(Object.keys(e.debit_portes).length, 5);
  assert.ok(Object.values(e.debit_portes).some((d) => d > 0));
  assert.ok(e.densite_max_depuis_debut >= e.densite_max);
});

test('un plan changé en cours de route est pris en compte : porte fermée, confinement levé', () => {
  const sim = creerSimulation(SCENE_UGC, 5);
  sim.pas(200, PLAN_AVANT);
  assert.ok(sim.etatResume().debit_portes.principale > 0, 'le hall débite avant le changement');
  sim.pas(65, { ...PLAN_AVANT, portes: [{ id: 'principale', ouverte: false, a_partir_de_s: 0 }] });
  const e = sim.etatResume();
  assert.equal(e.debit_portes.principale, 0, 'le hall fermé par le nouveau plan ne débite plus');
  assert.ok(e.debit_portes.metro + e.debit_portes.escalators + e.debit_portes.secours > 0, 'les autres portes continuent');
  // confinement : personne ne part ; puis le plan qui le lève libère les départs
  const c = creerSimulation(SCENE_UGC, 6);
  const conf: Plan = { ...PLAN_AVANT, confinement: true };
  c.pas(1500, conf);
  assert.equal(c.etatResume().sortis, 0);
  c.pas(900, PLAN_AVANT);
  assert.ok(c.etatResume().sortis > 0);
});

test('options exposées : θ, part en groupe, constante du changement d’avis, hésitation, suivisme changent bien le résultat', () => {
  const base = simuler(PLAN_AVANT, 2, 7200);
  assert.notEqual(simuler(PLAN_AVANT, 2, 7200, { choix: { theta_par_minute: 3 } }).grille.total, simuler(PLAN_AVANT, 2, 7200, { choix: { theta_par_minute: 0.3 } }).grille.total);
  assert.ok(simuler(PLAN_AVANT, 2, 7200, { part_groupes: 0.55 }).stats.part_en_groupe < base.stats.part_en_groupe);
  assert.ok(simuler(PLAN_AVANT, 2, 7200, { changement: { constante: -3 } }).stats.part_ayant_change > base.stats.part_ayant_change);
  assert.ok(simuler(PLAN_AVANT, 2, 7200, { changement: { constante: -9 } }).stats.part_ayant_change < base.stats.part_ayant_change);
  const ferme: Plan = { ...PLAN_AVANT, messages_par_zone: [], portes: [{ id: 'principale', ouverte: false, a_partir_de_s: 100 }] };
  const court = simuler(ferme, 4, 7200, { hesitation_s: [1, 2] });
  const long = simuler(ferme, 4, 7200, { hesitation_s: [200, 300] });
  assert.ok(long.grille.delai_t99_s! > court.grille.delai_t99_s!, `t99 ${long.grille.delai_t99_s} contre ${court.grille.delai_t99_s}`);
  assert.notEqual(simuler(PLAN_AVANT, 2, 7200, { choix: { suivisme_moyen: SUIVISME_SURPRIS } }).grille.total, base.grille.total);
  // déclencheur de vitesse (Liao 2017) : moins de personnes reconsidèrent que la révision de tous ceux qui marchent
  assert.ok(simuler(PLAN_AVANT, 2, 7200, { changement: { declencheur_vitesse: true } }).stats.part_ayant_change <= base.stats.part_ayant_change);
});

test('revue : préréglages de départ branchés (central plus lent que plancher, lent laisse des gens dedans)', () => {
  const med = (o: Parameters<typeof creerPopulation>[1]) => {
    const d = creerPopulation(3, o).map((p) => p.delai_s).filter(Number.isFinite).sort((a, b) => a - b);
    return d[Math.floor(d.length / 2)];
  };
  assert.ok(med({ depart: PRESET_CENTRAL }) > med({}) * 1.3, 'central : médiane plus longue que le plancher');
  const plancher = creerPopulation(3, {}).map((p) => p.delai_s);
  const avecDefaut = creerPopulation(3, { depart: PRESET_PLANCHER }).map((p) => p.delai_s);
  assert.deepEqual(avecDefaut, plancher, 'le plancher garde exactement les mêmes tirages');
  const restent = creerPopulation(3, { depart: PRESET_LENT }).filter((p) => !Number.isFinite(p.delai_s)).length;
  assert.ok(restent > 0, 'lent : certaines personnes (et leur groupe) ne partent pas');
});

test('revue : par_zone ne compte pas deux fois, et la dernière minute partielle est écrite', () => {
  const sim = creerSimulation(SCENE_UGC, 4, {});
  for (let k = 0; k < 4; k++) {
    sim.pas(60, PLAN_APRES);
    const e = sim.etatResume();
    const somme = Object.values(e.par_zone).reduce((a, z) => a + z.personnes, 0);
    assert.ok(somme <= e.dans_le_centre, `somme des zones ${somme} > dans le centre ${e.dans_le_centre}`);
  }
  const j = simuler(PLAN_AVANT, 4, 3600);
  const derniere = j.minutes[j.minutes.length - 1];
  assert.equal(derniere.personnes_restantes, 0, 'le journal se termine sur l’état final');
});
