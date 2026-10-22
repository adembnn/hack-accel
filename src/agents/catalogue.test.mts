// Tests du catalogue de décisions (46 leviers, 6 décideurs), des conflits et de l'événement `contrainte`.
// Aucun réseau : fetch est remplacé par une fonction qui échoue.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LEVIERS, CATALOGUE, appliquerActions, decisionsEnVigueur, etatInitial, leviersDe, verifierPlan } from './leviers.ts';
import type { Action, Decideur, EtatResume } from './types.ts';
import { ACTEURS_CATALOGUE, DECIDEURS, PORTES } from './types.ts';
import { lancerBoucle, clientsHeuristiques } from './boucle.ts';
import { FauxSimulateur, scenarioDeTest } from './fausse-sim.ts';
import { StockageMemoire } from './stockage.ts';
import { appliquerContrainte, detecterConflits, lirePerturbations, validerContrainte } from './evenements.ts';
import type { EvenementContrainte } from './evenements.ts';
import { ClientJev, SPECS_CATALOGUE, SPECS_JEV } from './jev.ts';
import type { RequeteJev, TransportJev } from './jev.ts';
import { RedacteurGabarit, demandeExplication, demandeOrdre, redigerVerifie } from './redacteur.ts';
import { lireReponse } from './questions.ts';

let appelsReseau = 0;
globalThis.fetch = (async () => { appelsReseau++; throw new Error('RÉSEAU INTERDIT DANS LES TESTS'); }) as typeof fetch;

const sc = scenarioDeTest();
const act = (decideur: Decideur, levier: string, valeur: unknown): Action => ({ decideur, levier, valeur });

test('46 leviers : 8 préfecture, 8 RATP, 10 sécurité, 9 directeur, 7 UGC, 4 BSPP, codes uniques, délai et source', () => {
  assert.equal(CATALOGUE.length, 46);
  const attendu: Record<Decideur, number> = { prefecture: 8, ratp: 8, securite_centre: 10, directeur: 9, ugc: 7, bspp: 4 };
  for (const d of ACTEURS_CATALOGUE) assert.equal(CATALOGUE.filter((l) => l.decideur === d).length, attendu[d], d);
  assert.equal(new Set(CATALOGUE.map((l) => l.code)).size, 46);
  for (const l of CATALOGUE) {
    assert.ok(l.delai_min[0] <= l.delai_min[1], l.code);
    assert.ok(l.delai_source && l.contrainte, l.code);
    assert.ok(['oui_non', 'choix', 'score', 'sous_ensemble', 'oui_non_par_cible'].includes(l.type));
  }
  for (const lv of LEVIERS.filter((x) => /^[PRSDUB]\d+$/.test(x.id))) {
    assert.match(lv.source, /catalogue-decisions-leviers\.md/);
    assert.deepEqual(appliquerActions(etatInitial(), [act(lv.decideur, lv.id, lv.exemple)], { scenario: sc }).refusees, [], lv.id);
  }
  assert.ok(leviersDe('ugc').length === 7 && leviersDe('bspp').length === 4);
});

test('leviers respectés : bornes, options, garde-fou alarme générale, mauvais décideur', () => {
  const refus = (a: Action) => appliquerActions(etatInitial(), [a], { scenario: sc }).refusees.length === 1;
  assert.ok(refus(act('securite_centre', 'S4', 'generale')), 'alarme générale interdite');
  assert.ok(!refus(act('securite_centre', 'S4', 'restreinte')));
  assert.ok(refus(act('securite_centre', 'S5', sc.effectif_securite + 1)), 'plus que l\'effectif');
  assert.ok(!refus(act('securite_centre', 'S5', sc.effectif_securite)));
  assert.ok(refus(act('prefecture', 'P8', 21)));
  assert.ok(refus(act('prefecture', 'P2', '21h')));
  assert.ok(refus(act('prefecture', 'S1', { cible: 'berger', oui: true })), 'levier du menu d\'un autre');
  assert.ok(refus(act('securite_centre', 'S1', { cible: 'porte_inconnue', oui: true })));
  assert.ok(refus(act('directeur', 'D3', ['berger', 'berger'])), 'doublon');
  assert.ok(refus(act('directeur', 'D6', 61)));
  assert.ok(refus(act('ratp', 'R3', '9')));
  assert.ok(refus(act('bspp', 'B4', -1)));
  assert.ok(refus(act('ugc', 'U1', 'tout_casser')));
  assert.ok(refus(act('ugc', 'U5', 'oui')), 'booléen attendu');
});

test('délais : la décision est enregistrée avec sa minute d\'effet et n\'est en vigueur qu\'ensuite', () => {
  const e0 = etatInitial();
  e0.hors_plan.minute_courante = 1170;
  const r = appliquerActions(e0, [act('directeur', 'D1', 'immediat'), act('ratp', 'R3', '4'), act('prefecture', 'P5', '22h')], { scenario: sc });
  assert.equal(r.acceptees.length, 3);
  assert.equal(r.etat.plan.mode, 'fermer', 'D1 est aussi le mode du Plan partagé');
  const cat = r.etat.hors_plan.catalogue as Record<string, { decide_minute: number; effectif_minute: number }>;
  assert.equal(cat.R3.decide_minute, 1170);
  assert.equal(cat.R3.effectif_minute, 1175, 'délai minimal 5 min');
  assert.equal(cat.D1.effectif_minute, 1180, 'délai minimal 10 min');
  assert.equal(cat.P5.effectif_minute, 1170, 'immédiat');
  assert.deepEqual(Object.keys(decisionsEnVigueur(r.etat, 1172)).sort(), ['P5']);
  assert.deepEqual(Object.keys(decisionsEnVigueur(r.etat, 1180)).sort(), ['D1', 'P5', 'R3']);
});

test('événement contrainte : validation du menu C1, B1, B3, B5, D1/D2, D5, F1 et de la sortie ouverte/fermée', () => {
  const ok: EvenementContrainte[] = [
    { type: 'contrainte', code: 'SORTIE', minute: 1170, cible: 'lescot', etat: 'fermee' },
    { type: 'contrainte', code: 'C1', minute: 1170, cible: 'chatelet' },
    { type: 'contrainte', code: 'B1', minute: 1170, cible: 'berger' },
    { type: 'contrainte', code: 'B3', minute: 1170, cible: 'escalator_lescot' },
    { type: 'contrainte', code: 'B5', minute: 1170, cible: 'ascenseur_nord' },
    { type: 'contrainte', code: 'D1', minute: 1170, cible: 'rue_berger' },
    { type: 'contrainte', code: 'D2', minute: 1170, cible: 'rue_rambuteau' },
    { type: 'contrainte', code: 'D5', minute: 1170, cible: 'niveau_-1', duree_min: 60 },
    { type: 'contrainte', code: 'F1', minute: 1170, valeur: 20 },
  ];
  for (const e of ok) assert.deepEqual(validerContrainte(e, sc), [], e.code);
  const ko = [
    { ...ok[0], etat: 'bof' }, { ...ok[2], cible: 'porte_fantome' }, { ...ok[5], cible: 'rue_de_la_paix' },
    { ...ok[7], duree_min: 0 }, { ...ok[7], duree_min: 999 }, { ...ok[8], valeur: -1 }, { ...ok[8], valeur: 61 },
    { ...ok[1], cible: undefined }, { ...ok[1], minute: 5 }, { ...ok[1], code: 'Z9' },
  ] as unknown as EvenementContrainte[];
  for (const e of ko) assert.ok(validerContrainte(e, sc).length > 0, JSON.stringify(e));
});

test('perturbation reçue : l\'état change, les décideurs voient le nouvel état et re-décident', async () => {
  const vus: { minute: number; perturbations: string[]; nouvelles: boolean }[] = [];
  const clients = clientsHeuristiques();
  clients.directeur = {
    decider: async (q) => {
      vus.push({ minute: q.minute, perturbations: q.entree.perturbations, nouvelles: q.entree.nouvelles_perturbations });
      // Après B1 sur Berger, le directeur essaie quand même de rouvrir la porte : refusé par le code.
      return q.entree.perturbations.includes('porte_bloquee:berger') ? { actions: [{ levier: 'porte', valeur: { porte: 'berger', etat: 'ouverte' } }] } : { actions: [] };
    },
  };
  const stockage = new StockageMemoire();
  const contraintes: EvenementContrainte[] = [
    { type: 'contrainte', code: 'B1', minute: 1163, cible: 'berger' },
    { type: 'contrainte', code: 'C1', minute: 1164, cible: 'chatelet' },
    { type: 'contrainte', code: 'F1', minute: 1165, valeur: 15 },
    { type: 'contrainte', code: 'B1', minute: 1166, cible: 'porte_fantome' }, // invalide : refusée, tracée
  ];
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: sc, clients, stockage, minutes: 8, contraintes });
  const avant = vus.find((v) => v.minute === 1162)!;
  assert.deepEqual(avant.perturbations, []);
  const a1163 = vus.find((v) => v.minute === 1163)!;
  assert.ok(a1163.nouvelles && a1163.perturbations.includes('porte_bloquee:berger'));
  const a1165 = vus.find((v) => v.minute === 1165)!;
  assert.ok(a1165.perturbations.includes('station_fermee:chatelet') && a1165.perturbations.includes('information_tardive'));
  assert.equal(vus.find((v) => v.minute === 1164)!.nouvelles, true);
  assert.equal(vus.find((v) => v.minute === 1167)!.nouvelles, false);
  const fin = j.entrees.at(-1)!;
  assert.equal(fin.plan.portes.berger, 'fermee', 'la porte bloquée reste fermée');
  const dir = await stockage.lister({ decideur: 'directeur', minute: 1164 });
  assert.ok(dir[0].actions_refusees.some((r) => r.raisons.some((x) => /bloquée/.test(x))), 'tentative de rouvrir refusée');
  const refusees = j.entrees.flatMap((e) => e.evenements?.contraintes ?? []).filter((c) => (c as { raisons?: string[] }).raisons);
  assert.equal(refusees.length, 1, 'la contrainte invalide est tracée, pas ignorée en silence');
  const p = lirePerturbations(appliquerContrainte(etatInitial(), contraintes[0]));
  assert.deepEqual(p.portes_bloquees, ['berger']);
  assert.ok(verifierPlan(fin.plan, sc, 1).length === 0);
});

test('SORTIE : le juré ferme puis rouvre une sortie', () => {
  let e = appliquerContrainte(etatInitial(), { type: 'contrainte', code: 'SORTIE', minute: 1170, cible: 'lescot', etat: 'fermee' });
  assert.equal(e.plan.portes.lescot, 'fermee');
  e = appliquerContrainte(e, { type: 'contrainte', code: 'SORTIE', minute: 1175, cible: 'lescot', etat: 'ouverte' });
  assert.equal(e.plan.portes.lescot, 'ouverte');
  assert.equal(PORTES.length, 10);
});

const resume = (p: Partial<EtatResume>): EtatResume => ({ minute: 1200, dans_le_centre: 0, sortis: 0, sortis_vers_zone_danger: 0, densite_max: 0, par_zone: {}, debit_portes: {}, ...p });

test('conflit 1 : évacuer vers un métro qui va fermer', () => {
  const e = etatInitial();
  const tard = detecterConflits(e, resume({ minute: 1300, dans_le_centre: 5000, debit_portes: { lescot: 60, louvre: 40 } }), sc);
  assert.equal(tard.length, 1);
  assert.equal(tard[0].code, 'conflit_metro_qui_ferme');
  assert.deepEqual(tard[0].details, { minutes_necessaires: 50, minutes_disponibles: 10, fermeture_stations_minute: 1320 });
  assert.equal(detecterConflits(e, resume({ minute: 1200, dans_le_centre: 5000, debit_portes: { lescot: 60, louvre: 40 } }), sc).length, 0, 'assez de temps');
});

test('conflit 2 : demande de fermeture (P6) contre confinement du directeur', () => {
  let r = appliquerActions(etatInitial(), [act('prefecture', 'P6', true)], { scenario: sc });
  assert.equal(detecterConflits(r.etat, resume({}), sc).length, 0, 'P6 seul : pas de conflit');
  r = appliquerActions(r.etat, [act('directeur', 'confinement', { actif: true, zones: ['niveau_-3'] })], { scenario: sc });
  const c = detecterConflits(r.etat, resume({}), sc);
  assert.deepEqual(c.map((x) => x.code), ['conflit_fermer_vs_confiner']);
  assert.match(c[0].resolution, /n'est pas obligatoire/);
});

test('conflit 3 : l\'UGC vide d\'un coup alors que le centre phase', () => {
  const ugc = resume({ par_zone: { ugc: { personnes: 3000, densite: 3 } } });
  let r = appliquerActions(etatInitial(), [act('ugc', 'U1', 'arreter')], { scenario: sc });
  const c = detecterConflits(r.etat, ugc, sc);
  assert.deepEqual(c.map((x) => x.code), ['conflit_pic_cinema']);
  assert.equal(c[0].details.personnes_cinema, 3000);
  r = appliquerActions(r.etat, [act('directeur', 'D6', 15)], { scenario: sc });
  assert.equal(detecterConflits(r.etat, ugc, sc).length, 0, 'décalage D6 : le pic est étalé');
});

test('les conflits se déclenchent dans la boucle, sont journalisés et visibles par les décideurs', async () => {
  const clients = clientsHeuristiques();
  const vusConflits: string[][] = [];
  clients.directeur = { decider: async (q) => { vusConflits.push(q.entree.conflits); return { actions: [] }; } };
  clients.prefecture = { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'P6', valeur: true }] } : { actions: [] }) };
  clients.securite_centre = { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'S8', valeur: true }, { levier: 'S1', valeur: { cible: 'lescot', oui: true } }] } : { actions: [] }) };
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: sc, clients, stockage: new StockageMemoire(), minutes: 4 });
  // S8 (confiner) + P6 (fermer) : conflit déclenché à la 1re minute, vu par les décideurs à la suivante.
  const premier = j.entrees[0].evenements!.conflits as { code: string }[];
  assert.ok(premier.some((c) => c.code === 'conflit_fermer_vs_confiner'));
  assert.deepEqual(vusConflits[0], []);
  assert.ok(vusConflits[1].includes('conflit_fermer_vs_confiner'));
});

test('questions Jev du catalogue : une par levier, typées, et leurs réponses passent par les bornes', async () => {
  const total = ACTEURS_CATALOGUE.reduce((s, d) => s + SPECS_CATALOGUE[d].length, 0);
  assert.equal(total, 46);
  for (const l of CATALOGUE) {
    const q = SPECS_CATALOGUE[l.decideur].find((s) => s.cle === l.code)!.question;
    const attendu = { oui_non: 'noul', choix: 'choice', score: 'score', sous_ensemble: 'choice', oui_non_par_cible: 'noul' }[l.type];
    assert.equal(q.type, attendu, l.code);
    if (q.type === 'choice') assert.ok(!('generale' in q.criteria), 'l\'alarme générale n\'est jamais proposée à Jev');
  }
  const vues: RequeteJev[] = [];
  const transport: TransportJev = {
    envoyer: async (r) => {
      vues.push(r);
      const answers: Record<string, never> = {} as never;
      for (const [cle, q] of Object.entries(r.questions)) {
        (answers as Record<string, unknown>)[cle] = q.type === 'noul' ? { noul: 0.95 }
          : q.type === 'choice' ? { choice: Object.keys(q.criteria)[Object.keys(q.criteria).length - 1], probabilities: {}, confidence: 0.9 }
          : { score: 4, probabilities: [], confidence: 0.9 };
      }
      return { model: r.model, answers };
    },
  };
  const cj = new ClientJev({ transport, catalogue: true });
  const clients = { prefecture: cj, ratp: cj, securite_centre: cj, directeur: new ClientJev({ transport, catalogue: true }) };
  const stockage = new StockageMemoire();
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: sc, clients, stockage, minutes: 2 });
  assert.equal(j.entrees.length, 2);
  const reqDirecteur = vues.find((v) => 'plan' in v.questions && 'D1' in v.questions)!;
  assert.deepEqual(Object.keys(reqDirecteur.questions).sort(), [...SPECS_JEV.directeur, ...SPECS_CATALOGUE.directeur].map((s) => s.cle).sort());
  const tout = await stockage.lister();
  const acceptees = tout.flatMap((t) => t.actions_acceptees);
  assert.ok(acceptees.some((a) => a.levier === 'D1' && a.valeur === 'immediat'));
  assert.ok(acceptees.some((a) => a.levier === 'P8' && a.valeur === 20), 'score maximum = borne du levier');
  const refus = tout.flatMap((t) => t.actions_refusees);
  assert.ok(refus.every((r) => r.raisons.length > 0));
  // Une réponse hors menu (levier d'un autre décideur) est écartée par la lecture.
  assert.deepEqual(lireReponse('ratp', { actions: [{ levier: 'P8', valeur: 3 }] }).actions, []);
});

test('le vérificateur de chiffres est inchangé : 100 % des chiffres retrouvés après perturbations et conflits', async () => {
  const contraintes: EvenementContrainte[] = [{ type: 'contrainte', code: 'B1', minute: 1162, cible: 'berger' }, { type: 'contrainte', code: 'F1', minute: 1163, valeur: 12 }];
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: sc, clients: clientsHeuristiques(), stockage: new StockageMemoire(), minutes: 6, contraintes });
  const g = new RedacteurGabarit();
  const expl = await redigerVerifie(g, demandeExplication(j), j, { repli: false });
  assert.equal(expl.rapport.taux, 1);
  for (const zone of Object.keys(j.entrees.at(-1)!.etat.par_zone)) assert.equal((await redigerVerifie(g, demandeOrdre(j, zone), j, { repli: false })).rapport.taux, 1);
  assert.deepEqual(DECIDEURS.length, 4);
});

test('zéro appel réseau', () => {
  assert.equal(appelsReseau, 0);
});
