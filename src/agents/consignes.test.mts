// Tests de la consigne structurée par zone (Plan.consignes_par_zone), couture avec foule-decision. Aucun réseau.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { appliquerActions, etatInitial, verifierPlan, ZONE_CONSIGNE, clamp01, leviersDe } from './leviers.ts';
import type { Action, Decideur } from './types.ts';
import { DECIDEURS, PORTES, planInitial } from './types.ts';
import { lancerBoucle, clientsHeuristiques } from './boucle.ts';
import { FauxSimulateur, scenarioDeTest } from './fausse-sim.ts';
import { StockageMemoire } from './stockage.ts';
import { verifierChiffres } from './verificateur.ts';
import { demandeOrdre, redigerVerifie, RedacteurGabarit } from './redacteur.ts';
import { SPECS_NOYAU } from './decisions-typees.ts';

const sc = scenarioDeTest();
const consigne = (decideur: Decideur, valeur: unknown): Action => ({ decideur, levier: 'consigne_zone', valeur });
const refuse = (a: Action, etat = etatInitial()) => appliquerActions(etat, [a], { scenario: sc }).refusees.length === 1;

test('absence = pas de consigne : le plan initial n\'a aucune entrée', () => {
  assert.equal(planInitial().consignes_par_zone, undefined);
  assert.deepEqual(verifierPlan(planInitial(), sc), []);
});

test('les 4 décideurs ont le levier consigne_zone ; une consigne valide est enregistrée, texte conservé', () => {
  for (const d of DECIDEURS) assert.ok(leviersDe(d).some((l) => l.id === 'consigne_zone'), d);
  const r = appliquerActions(etatInitial(), [consigne('directeur', { zone: 'niveau_-2', porte: 'lescot', clarte: 0.75 }), consigne('securite_centre', { zone: 'salle_07', porte: 'louvre', clarte: 1 })], { scenario: sc });
  assert.deepEqual(r.refusees, []);
  assert.deepEqual(r.etat.plan.consignes_par_zone, { 'niveau_-2': { porte: 'lescot', clarte: 0.75 }, salle_07: { porte: 'louvre', clarte: 1 } });
  assert.deepEqual(r.etat.plan.messages_par_zone, {}, 'le texte reste dans messages_par_zone');
});

test('validation : zone de forme niveau_<n> ou salle_<kk>, porte connue, clarté nombre fini', () => {
  for (const z of ['niveau_0', 'niveau_-4', 'salle_01', 'salle_27']) assert.ok(ZONE_CONSIGNE.test(z), z);
  for (const z of ['ugc', 'niveau_', 'niveau_x', 'salle_', 'salle_1234', 'Niveau_1', 'niveau_1; DROP', '']) assert.ok(!ZONE_CONSIGNE.test(z), z);
  assert.ok(refuse(consigne('directeur', { zone: 'ugc', porte: 'lescot', clarte: 0.5 })), 'zone hors forme');
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'porte_fantome', clarte: 0.5 })), 'porte inconnue');
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'lescot', clarte: 'haute' })));
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'lescot', clarte: Number.NaN })));
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'lescot', clarte: Infinity })));
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'lescot' })), 'clarté absente');
  assert.ok(refuse(consigne('directeur', null)));
  assert.ok(refuse({ decideur: 'ugc', levier: 'consigne_zone', valeur: { zone: 'niveau_1', porte: 'lescot', clarte: 0.5 } }), 'UGC n\'a pas ce levier');
  for (const p of PORTES) assert.ok(!refuse(consigne('directeur', { zone: 'niveau_1', porte: p, clarte: 0.5 })), p);
});

test('bornes : la clarté est bornée à 0..1 en code', () => {
  assert.equal(clamp01(-3), 0);
  assert.equal(clamp01(7), 1);
  assert.equal(clamp01(0.4), 0.4);
  const r = appliquerActions(etatInitial(), [consigne('directeur', { zone: 'niveau_1', porte: 'lescot', clarte: 7 }), consigne('directeur', { zone: 'niveau_2', porte: 'lescot', clarte: -3 })], { scenario: sc });
  assert.equal(r.etat.plan.consignes_par_zone!.niveau_1.clarte, 1);
  assert.equal(r.etat.plan.consignes_par_zone!.niveau_2.clarte, 0);
  const faux = planInitial();
  faux.consignes_par_zone = { niveau_1: { porte: 'lescot', clarte: 2 }, ugc: { porte: 'lescot', clarte: 0.5 }, niveau_2: { porte: 'inconnue', clarte: 0.5 } };
  assert.equal(verifierPlan(faux, sc).length, 3, 'les invariants du plan attrapent un plan construit hors des leviers');
});

test('une consigne vers une porte fermée est refusée, et fermer la porte annule la consigne', () => {
  const e = appliquerActions(etatInitial(), [{ decideur: 'directeur', levier: 'porte', valeur: { porte: 'berger', etat: 'fermee' } }], { scenario: sc }).etat;
  assert.ok(refuse(consigne('directeur', { zone: 'niveau_1', porte: 'berger', clarte: 0.5 }), e));
  const avec = appliquerActions(etatInitial(), [consigne('directeur', { zone: 'niveau_1', porte: 'berger', clarte: 0.5 })], { scenario: sc }).etat;
  const ferme = appliquerActions(avec, [{ decideur: 'directeur', levier: 'porte', valeur: { porte: 'berger', etat: 'fermee' } }], { scenario: sc });
  assert.equal(ferme.refusees.length, 1, 'fermer la porte pointée par une consigne casse le plan : refusé');
});

test('message_zone peut porter la consigne structurée (porte + clarté) en plus du texte', () => {
  const ok = appliquerActions(etatInitial(), [{ decideur: 'securite_centre', levier: 'message_zone', valeur: { zone: 'niveau_-1', texte: 'Le centre ferme.', porte: 'lescot', clarte: 0.6 } }], { scenario: sc });
  assert.deepEqual(ok.refusees, []);
  assert.equal(ok.etat.plan.messages_par_zone['niveau_-1'], 'Le centre ferme.');
  assert.deepEqual(ok.etat.plan.consignes_par_zone, { 'niveau_-1': { porte: 'lescot', clarte: 0.6 } });
  assert.ok(refuse({ decideur: 'securite_centre', levier: 'message_zone', valeur: { zone: 'niveau_-1', texte: 'x', porte: 'nulle_part', clarte: 0.6 } }));
  const sans = appliquerActions(etatInitial(), [{ decideur: 'securite_centre', levier: 'message_zone', valeur: { zone: 'niveau_-1', texte: 'Le centre ferme.' } }], { scenario: sc });
  assert.equal(sans.etat.plan.consignes_par_zone, undefined, 'sans porte ni clarté : pas de consigne');
});

test('dans la boucle : la consigne est émise, journalisée dans le plan, et un message chiffré ne valide toujours rien', async () => {
  const clients = clientsHeuristiques();
  clients.directeur = { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'consigne_zone', valeur: { zone: 'niveau_0', porte: 'louvre', clarte: 0.9 } }] } : { actions: [] }) };
  clients.securite_centre = { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'message_zone', valeur: { zone: 'niveau_-1', porte: 'lescot', clarte: 0.8, texte: 'Sortie 4242 dans 17 minutes' } }] } : { actions: [] }) };
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: sc, clients, stockage: new StockageMemoire(), minutes: 4 });
  const plan = j.entrees.at(-1)!.plan;
  assert.deepEqual(plan.consignes_par_zone, { niveau_0: { porte: 'louvre', clarte: 0.9 }, 'niveau_-1': { porte: 'lescot', clarte: 0.8 } });
  assert.deepEqual(JSON.parse(JSON.stringify(j)).entrees.at(-1).plan.consignes_par_zone, plan.consignes_par_zone, 'présent dans le journal sérialisé');
  // Les nombres du texte libre ne valident rien, même s'ils sont dans le journal.
  assert.equal(verifierChiffres('4242 personnes, 17 minutes', j).ok, false);
  const ordre = await redigerVerifie(new RedacteurGabarit(), demandeOrdre(j, 'niveau_-1'), j, { repli: false });
  assert.ok(!/4242|17 minutes/.test(ordre.texte.texte));
  assert.equal(ordre.rapport.taux, 1);
});

test('la question Claude du guidage émet aussi la consigne pour une zone niveau_<n>', () => {
  const spec = SPECS_NOYAU.securite_centre.find((s) => s.cle === 'guidage')!;
  const n = { zone_critique: 'niveau_-2' } as Parameters<typeof spec.versActions>[1];
  const acts = spec.versActions(2, n, 20);
  assert.ok(acts.some((a) => a.levier === 'consigne_zone' && JSON.stringify(a.valeur) === JSON.stringify({ zone: 'niveau_-2', porte: 'lescot', clarte: 2 / 3 })));
  const hors = spec.versActions(2, { zone_critique: 'ugc' } as typeof n, 20);
  assert.ok(!hors.some((a) => a.levier === 'consigne_zone'), 'zone ugc : pas de consigne structurée');
});
