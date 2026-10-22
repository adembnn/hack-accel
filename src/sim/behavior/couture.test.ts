// Tests de la couture avec le lot decideurs (#10) : node --test. Modèle simplifié, non certifié.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convertirPlan, PORTE_VERS_ISSUE, SimulateurFouleDecision } from './couture-decideurs.ts';
import { NIVEAUX, PORTES, type Plan, type Scenario } from './couture-types.ts';
import { creerSimulation, SALLES, simuler } from './simuler.ts';
import { SCENE_UGC } from './scene-ugc.ts';

const SCENARIO: Scenario = {
  graine: 7,
  minute_annonce: 1160,
  stations_fermees_minute: 1320,
  couvre_feu_debut_minute: 1380,
  effectif_securite: 20,
  population: {},
};
const portesOuvertes = () => Object.fromEntries(PORTES.map((p) => [p, 'ouverte' as const]));
const planDecideurs = (o: Partial<Plan> = {}): Plan => ({
  mode: 'fermer_par_etapes',
  portes: portesOuvertes(),
  phasage_salles: [],
  guidage: [],
  messages_par_zone: {},
  confinement: { actif: false, zones: [] },
  ...o,
});
const MOTIF_ZONE = /^(niveau_-?\d+|salle_\d{2})$/;

test('temps : 1160 + 3 min = 180 s depuis l’annonce, jamais négatif', () => {
  const { plan } = convertirPlan(planDecideurs({ phasage_salles: [{ salle: 'salle_02', minute_depart: 1163 }, { salle: 'salle_03', minute_depart: 1100 }] }), SCENARIO);
  assert.deepEqual(plan.phasage_salles, [{ salle: 'salle_02', delai_s: 180 }, { salle: 'salle_03', delai_s: 0 }]);
});

test('portes, zones et points inconnus (ou sans équivalent dans la scène) : listés dans hors_plan, jamais d’exception', () => {
  const { plan, hors_plan } = convertirPlan(
    planDecideurs({
      portes: { ...portesOuvertes(), xyz: 'fermee', louvre: 'fermee', berger: 'fermee' },
      phasage_salles: [{ salle: 'ugc_07', minute_depart: 1165 }],
      guidage: [{ point: 'escalier_3', agents: 4 }, { point: 'lescot', agents: 6 }, { point: 'canopee', agents: 2 }],
      consignes_par_zone: { 'niveau_-2': { porte: 'lescot', clarte: 1 }, salle_01: { porte: 'inconnue', clarte: 1 } },
    }),
    SCENARIO,
  );
  assert.deepEqual(plan.portes, [{ id: 'ferronnerie', ouverte: false, a_partir_de_s: 0 }]); // berger fermée ; xyz et louvre sans effet
  assert.deepEqual(plan.guidage, { issue_id: 'principale', personnel: 6 }); // un seul point : celui qui a le plus d'agents
  assert.deepEqual(plan.messages_par_zone, []);
  assert.deepEqual([...hors_plan.portes].sort(), ['inconnue', 'louvre', 'xyz']);
  assert.deepEqual([...hors_plan.zones].sort(), ['niveau_-2', 'ugc_07']);
  assert.deepEqual([...hors_plan.points].sort(), ['canopee', 'escalier_3']);
});

test('consigne structurée : porte -> issue, clarté bornée ; le texte seul ne donne aucune consigne', () => {
  const avec = convertirPlan(planDecideurs({ consignes_par_zone: { salle_01: { porte: 'lescot', clarte: 1.7 }, salle_02: { porte: 'pont_neuf', clarte: 0.4 } } }), SCENARIO, { salle_02: 180 });
  assert.deepEqual(avec.plan.messages_par_zone, [
    { zone: 'salle_01', issue_id: 'principale', clarte: 1, a_partir_de_s: 0 },
    { zone: 'salle_02', issue_id: 'metro', clarte: 0.4, a_partir_de_s: 180 },
  ]);
  const texte = convertirPlan(planDecideurs({ messages_par_zone: { salle_01: 'Sortez par la porte Lescot' } }), SCENARIO);
  assert.deepEqual(texte.plan.messages_par_zone, []);
});

test('confinement : actif sans zone = tout le monde ; avec zones = les salles nommées, le reste est listé', () => {
  assert.equal(convertirPlan(planDecideurs({ confinement: { actif: true, zones: [] } }), SCENARIO).plan.confinement, true);
  assert.equal(convertirPlan(planDecideurs({ confinement: { actif: false, zones: ['salle_01'] } }), SCENARIO).plan.confinement, false);
  const c = convertirPlan(planDecideurs({ confinement: { actif: true, zones: ['salle_01', 'niveau_-2'] } }), SCENARIO);
  assert.equal(c.plan.confinement, true);
  assert.deepEqual(c.plan.confinement_salles, ['salle_01']);
  assert.deepEqual(c.hors_plan.zones, ['niveau_-2']);
  assert.equal(convertirPlan(planDecideurs({ confinement: { actif: true, zones: ['niveau_-2'] } }), SCENARIO).plan.confinement, false);
});

test('avancer minute par minute = simuler d’un bloc (même graine, même plan)', () => {
  const plan = planDecideurs({
    phasage_salles: [{ salle: 'salle_03', minute_depart: 1161 }],
    portes: { ...portesOuvertes(), berger: 'fermee' },
    consignes_par_zone: { salle_01: { porte: 'lescot', clarte: 0.9 }, salle_02: { porte: 'pont_neuf', clarte: 0.9 } },
    guidage: [{ point: 'lescot', agents: 4 }],
  });
  const minutes = 12;
  const s = new SimulateurFouleDecision();
  s.initialiser(SCENARIO);
  for (let k = 0; k < minutes; k++) s.avancer(plan, 1);
  const bloc = simuler(convertirPlan(plan, SCENARIO).plan, SCENARIO.graine, minutes * 60, { echeances: { metro_s: 9600, couvre_feu_s: 13200 } });
  const a = s.journal();
  assert.equal(a.duree_s, bloc.duree_s);
  assert.deepEqual(a.minutes, bloc.minutes);
  assert.deepEqual(a.grille, bloc.grille);
  assert.deepEqual(a.stats, bloc.stats);
  // et un seul appel de 12 minutes donne le même état qu’une minute à la fois
  const d = new SimulateurFouleDecision();
  d.initialiser(SCENARIO);
  assert.deepEqual(d.avancer(plan, minutes), s.etat());
});

test('un plan qui change entre deux avancer est pris en compte (porte fermée, consigne datée de son arrivée)', () => {
  const s = new SimulateurFouleDecision();
  s.initialiser(SCENARIO);
  const p1 = planDecideurs({ mode: 'fermer' });
  const e5 = s.avancer(p1, 5);
  assert.ok(e5.debit_portes.lescot > 0, 'le hall débite avant le changement');
  const p2 = planDecideurs({ mode: 'fermer', portes: { ...portesOuvertes(), lescot: 'fermee' }, consignes_par_zone: { salle_01: { porte: 'pont_neuf', clarte: 0.8 } } });
  const e7 = s.avancer(p2, 2);
  assert.equal(e7.debit_portes.lescot, 0, 'le hall fermé ne débite plus');
  assert.ok(e7.debit_portes.pont_neuf + e7.debit_portes.canopee > 0, 'les autres portes continuent');
  assert.equal(e7.minute, 1167);
  assert.deepEqual(s.journal().plan.messages_par_zone, [{ zone: 'salle_01', issue_id: 'metro', clarte: 0.8, a_partir_de_s: 300 }]);
  assert.deepEqual(s.hors_plan, { portes: [], zones: [], points: [] });
  // une autre modification du plan ne redate pas la consigne inchangée
  s.avancer({ ...p2, portes: { ...p2.portes, berger: 'fermee' } }, 1);
  assert.equal(s.journal().plan.messages_par_zone[0].a_partir_de_s, 300);
});

test('etat() a toutes les clés de l’EtatResume de #10, minute du jour, une entrée par porte', () => {
  const s = new SimulateurFouleDecision();
  s.initialiser(SCENARIO);
  assert.equal(s.etat().minute, 1160);
  const e = s.avancer(planDecideurs(), 4);
  assert.deepEqual(Object.keys(e).sort(), ['dans_le_centre', 'debit_portes', 'densite_max', 'minute', 'par_zone', 'pression_max', 'sortis', 'sortis_vers_zone_danger']);
  assert.equal(e.minute, 1164);
  assert.equal(e.dans_le_centre + e.sortis, 3000);
  assert.deepEqual(Object.keys(e.debit_portes).sort(), [...PORTES].sort());
  for (const z of Object.values(e.par_zone)) assert.deepEqual(Object.keys(z).sort(), ['densite', 'personnes']);
  // le débit d'une issue est partagé entre les portes qui y mènent : berger + rambuteau -> ferronnerie
  assert.equal(PORTE_VERS_ISSUE.berger, PORTE_VERS_ISSUE.rambuteau);
  assert.equal(e.debit_portes.berger, e.debit_portes.rambuteau);
});

test('noms de zones conformes au glossaire (niveau_<n>, salle_<kk>) dans la grille, la scène et l’état', () => {
  const s = new SimulateurFouleDecision();
  const g = s.grille();
  assert.deepEqual(g.niveaux, [...NIVEAUX]);
  assert.deepEqual(g.portes, [...PORTES]);
  assert.equal(g.seuil_densite, 5);
  assert.ok(g.zones.length > SALLES.length);
  for (const z of g.zones) assert.match(z, MOTIF_ZONE);
  for (const i of SCENE_UGC.issues) assert.match(i.zone, MOTIF_ZONE);
  s.initialiser(SCENARIO);
  const e = s.avancer(planDecideurs(), 3);
  for (const z of Object.keys(e.par_zone)) assert.match(z, MOTIF_ZONE);
  assert.ok(SALLES.includes('salle_01') && SALLES.includes('salle_06'));
});

test('scénario : population par zone, échéances du métro et du couvre-feu depuis les minutes du jour', () => {
  const s = new SimulateurFouleDecision();
  s.initialiser({ ...SCENARIO, population: { salle_01: 100, salle_02: 50, 'niveau_-2': 30 } });
  assert.deepEqual(s.hors_scenario, ['niveau_-2']);
  const e = s.avancer(planDecideurs(), 1);
  assert.equal(e.dans_le_centre + e.sortis, 150);
  assert.equal(e.par_zone.salle_03.personnes, 0);
  // métro fermé 1 minute après l'annonce : personne n'est sorti à temps, tout le monde compte comme non sorti « à 22 h »
  const t = new SimulateurFouleDecision();
  t.initialiser({ ...SCENARIO, stations_fermees_minute: 1161 });
  t.avancer(planDecideurs(), 3);
  assert.equal(t.journal().grille.non_sortis_22h.valeur, 3000);
  // et la graine fixe les personnes : même graine = mêmes sorties
  const u = new SimulateurFouleDecision();
  u.initialiser(SCENARIO);
  const v = new SimulateurFouleDecision();
  v.initialiser(SCENARIO);
  assert.deepEqual(u.avancer(planDecideurs(), 6), v.avancer(planDecideurs(), 6));
  assert.equal(creerSimulation(SCENE_UGC, 7).personnes.length, 3000);
});

test('avancer avant initialiser : erreur claire', () => {
  assert.throws(() => new SimulateurFouleDecision().avancer(planDecideurs(), 1), /initialiser/);
});
