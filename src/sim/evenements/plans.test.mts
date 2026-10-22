import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS5097 : Node exige l extension .ts ; le tsconfig du socle n autorise pas encore allowImportingTsExtensions
import { comparerPlans, plansParDefaut, planDepuisDecideurs, rejouerPlan, verdict } from './plans.ts';
import type { ActionPlan, LignePlan, SimulateurRejouable } from './plans.ts';

// Simulateur jouet : des personnes sortent par deux portes ; une porte fermée ne débite plus ; l'aléa vient du rng injecté.
interface Jouet { restants: number; sortis: number; ouverte: Record<string, boolean>; guide: Record<string, boolean>; expo: number }
const sim: SimulateurRejouable<Jouet> = {
  cloner: (e) => ({ ...e, ouverte: { ...e.ouverte }, guide: { ...e.guide } }),
  appliquer: (e, a: ActionPlan) => {
    const n = sim.cloner(e);
    if (a.type === 'fermer') n.ouverte[a.cible] = false;
    if (a.type === 'agent') n.guide[a.cible] = true;
    return n;
  },
  avancer: (e, dt, rng) => {
    const n = sim.cloner(e);
    for (const p of Object.keys(n.ouverte)) {
      if (!n.ouverte[p]) continue;
      const debit = (n.guide[p] ? 1.5 : 1) * (0.8 + rng() * 0.4) * dt;
      const sort = Math.min(n.restants, debit);
      n.restants -= sort; n.sortis += sort;
    }
    n.expo += n.restants > 100 ? dt * (n.restants - 100) : 0;
    return n;
  },
  mesurer: (e) => ({ nonSortis: Math.round(e.restants), zone: 0, expo: e.expo, sortis: Math.round(e.sortis) }),
};
const depart: Jouet = { restants: 800, sortis: 0, ouverte: { berger: true, lescot: true }, guide: {}, expo: 0 };

test('rejeu : même graine, résultat identique ; graine différente, résultat différent ; départ jamais modifié', () => {
  const plan = { id: 'B', titre: 't', actions: [{ t: 120, type: 'agent', cible: 'berger', txt: 'g' } as ActionPlan] };
  const a = rejouerPlan(sim, depart, plan, 42, 300), b = rejouerPlan(sim, depart, plan, 42, 300), c = rejouerPlan(sim, depart, plan, 43, 300);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.m10, c.m10);
  assert.deepEqual(depart, { restants: 800, sortis: 0, ouverte: { berger: true, lescot: true }, guide: {}, expo: 0 });
});

test('comparaison de 3 plans : rejeu identique à graine égale, meilleur plan recommandé', () => {
  const plans = plansParDefaut({ parCouverture: ['berger', 'lescot'], parDemande: ['berger'], zone: [], autres: [] });
  assert.deepEqual(plans.map((p) => p.id), ['A', 'B', 'C']);
  const r1 = comparerPlans(sim, depart, plans, 20261022, 800, 150), r2 = comparerPlans(sim, depart, plans, 20261022, 800, 150);
  assert.deepEqual(r1, r2);
  assert.equal(r1.lignes.length, 3);
  const A = r1.lignes[0]!, B = r1.lignes[1]!;
  assert.ok(B.n10 < A.n10, `B (${B.n10}) doit faire mieux que A (${A.n10})`);
  assert.equal(r1.recommande.id, 'B');
  assert.match(r1.resume, /À valider par le chef de poste/);
});

test('verdict : écart sous le bruit = égalité, on garde le plan qui change le moins', () => {
  const l = (id: string, n10: number, nb: number): LignePlan => ({ id, titre: id, actions: Array(nb).fill('x'), ignore: [], n5: 0, n10, zone: 0, expo5: 0, expo10: 0 });
  const v = verdict([l('A', 100, 0), l('B', 95, 2)], 800); // 5 < max(10, 8)
  assert.equal(v.best.id, 'A');
  assert.match(v.raison, /Aucun écart/);
  assert.equal(verdict([l('A', 300, 0), l('B', 100, 2)], 800).best.id, 'B');
});

test('un Plan du lot décideurs devient des actions rejouables', () => {
  const p = planDepuisDecideurs('D', 'Décideurs', {
    mode: 'fermer_par_etapes', portes: { berger: 'fermee', lescot: 'ouverte' }, phasage_salles: [{ salle: 'ugc_07', minute_depart: 1160 }],
    guidage: [{ point: 'lescot', agents: 2 }], messages_par_zone: { z: 'm' }, confinement: { actif: false, zones: [] },
  });
  assert.deepEqual(p.actions.map((a) => a.type), ['fermer', 'agent', 'annonce']);
  assert.deepEqual(p.ignore, ['vagues de salles non rejouées ici']);
});
