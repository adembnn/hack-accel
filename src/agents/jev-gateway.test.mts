// Tests de la passerelle Jev (Vercel AI Gateway) : fetch SIMULÉ partout, zéro appel réel, aucune vraie clé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { TransportJevGateway, TransportRegles, ErreurJevGateway, URL_GATEWAY, MODELE_GATEWAY, backendDepuisEnv, creerClientsDecision } from './jev-gateway.ts';
import { ClientJev, MODELE_JEV } from './jev.ts';
import type { RequeteJev } from './jev.ts';
import { lancerBoucle } from './boucle.ts';
import { FauxSimulateur, scenarioDeTest } from './fausse-sim.ts';
import { StockageMemoire } from './stockage.ts';

let appelsReels = 0;
const fetchReel = globalThis.fetch;
globalThis.fetch = (async () => { appelsReels++; throw new Error('RÉSEAU RÉEL INTERDIT'); }) as typeof fetch;

const ENV = { AI_GATEWAY_API_KEY: 'cle-factice-de-test' };
const REQ: RequeteJev = {
  model: MODELE_JEV,
  state: { densite: 'critique', tendance: 'monte' },
  questions: {
    plan: { type: 'choice', instructions: 'Quelle décision ?', criteria: { rester_ouvert: 'a', fermer_par_etapes: 'b', fermer: 'c' } },
    confinement: { type: 'noul', instructions: 'Confiner ?' },
  },
};
const REPONSE = {
  model: 'typesafe-ai/jev-1.14.0',
  answers: {
    plan: { type: 'choice', choice: 'fermer', probabilities: { rester_ouvert: 0.05, fermer_par_etapes: 0.1, fermer: 0.85 }, confidence: 0.85 },
    confinement: { type: 'noul', noul: 0.2 },
  },
  usage: { input_tokens: 275, output_tokens: 20 },
  provider_metadata: { gateway: { cost: '0.00001155' } },
};
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } });

test('requête : URL, en-têtes et corps exacts attendus par la passerelle', async () => {
  const vus: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => { vus.push({ url, init }); return json(REPONSE); }) as unknown as typeof fetch;
  const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: f });
  await t.envoyer(REQ);
  assert.equal(vus.length, 1);
  assert.equal(vus[0].url, 'https://ai-gateway.vercel.sh/typesafe/v1/systemone');
  assert.equal(URL_GATEWAY, vus[0].url);
  assert.equal(vus[0].init.method, 'POST');
  const h = vus[0].init.headers as Record<string, string>;
  assert.equal(h.authorization, 'Bearer cle-factice-de-test');
  assert.equal(h['content-type'], 'application/json');
  assert.ok(vus[0].init.signal, 'délai (timeout) armé');
  const corps = JSON.parse(vus[0].init.body as string);
  assert.deepEqual(Object.keys(corps).sort(), ['model', 'questions', 'state']);
  assert.equal(corps.model, 'typesafe-ai/jev-1.14.0');
  assert.equal(MODELE_GATEWAY, 'typesafe-ai/jev-1.14.0');
  assert.deepEqual(corps.state, REQ.state);
  assert.equal(corps.questions.confinement.type, 'noul', 'noul reste noul (pas boolean)');
  assert.ok(!JSON.stringify(corps).includes('boolean'));
  assert.deepEqual(corps.questions.plan.criteria, REQ.questions.plan.type === 'choice' ? REQ.questions.plan.criteria : {});
});

test('réponse : answers conservés, modèle figé du cache, jetons comptés, provider_metadata écarté', async () => {
  const f = (async () => json(REPONSE)) as unknown as typeof fetch;
  const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: f });
  const r = await t.envoyer(REQ);
  assert.equal(r.model, MODELE_JEV);
  assert.deepEqual(r.answers, REPONSE.answers);
  assert.equal('provider_metadata' in r, false);
  assert.equal(t.jetons_entree, 275);
  assert.equal(t.jetons_sortie, 20);
  assert.equal(t.appels, 1);
});

test('refus : sans autorisation, sans clé, et au-delà du plafond d\'appels', async () => {
  assert.throws(() => new TransportJevGateway({ autorise_payant: false, env: ENV }), /non autorisé/);
  assert.throws(() => new TransportJevGateway({ autorise_payant: true, env: {} }), /AI_GATEWAY_API_KEY absente/);
  const f = (async () => json(REPONSE)) as unknown as typeof fetch;
  const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: f, plafond_appels: 2 });
  await t.envoyer(REQ); await t.envoyer(REQ);
  await assert.rejects(t.envoyer(REQ), /plafond de 2/);
  assert.equal(t.appels, 2);
});

test('erreurs 401, 429, 500 et délai dépassé : exceptions typées', async () => {
  for (const [statut, motif] of [[401, /401/], [429, /429/], [500, /500/]] as const) {
    const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: (async () => json({ message: 'x', error_type: 'e' }, statut)) as unknown as typeof fetch });
    await assert.rejects(t.envoyer(REQ), (e: unknown) => e instanceof ErreurJevGateway && e.statut === statut && motif.test(e.message));
  }
  // Délai : un fetch qui ne répond jamais est coupé par le signal.
  const lent = ((_u: string, init: RequestInit) => new Promise((_res, rej) => { init.signal?.addEventListener('abort', () => rej(init.signal?.reason)); })) as unknown as typeof fetch;
  const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: lent, timeout_ms: 30 });
  await assert.rejects(t.envoyer(REQ), /délai de 30 ms/);
  const casse = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: (async () => json({ pas: 'de answers' })) as unknown as typeof fetch });
  await assert.rejects(casse.envoyer(REQ), /sans answers/);
});

test('401, 429 et délai en pleine boucle : repli sur les règles, la boucle va au bout', async () => {
  const scenarios: [string, typeof fetch][] = [
    ['401', (async () => json({ message: 'non' }, 401)) as unknown as typeof fetch],
    ['429', (async () => json({ message: 'trop' }, 429)) as unknown as typeof fetch],
    ['délai', ((_u: string, init: RequestInit) => new Promise((_res, rej) => { init.signal?.addEventListener('abort', () => rej(init.signal?.reason)); })) as unknown as typeof fetch],
  ];
  for (const [nom, f] of scenarios) {
    const raisons: string[] = [];
    const t = new TransportJevGateway({ autorise_payant: true, env: ENV, fetchImpl: f, timeout_ms: 20 });
    const cj = new ClientJev({ transport: t, surRepli: (_d, r) => raisons.push(r) });
    const clients = { prefecture: cj, ratp: cj, securite_centre: cj, directeur: cj };
    const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients, stockage: new StockageMemoire(), minutes: 3 });
    assert.equal(j.entrees.length, 3, nom);
    assert.ok(cj.replis >= 3, `${nom} : repli sur règles`);
    assert.ok(raisons[0].length > 0);
    assert.ok(j.entrees.every((e) => ['rester_ouvert', 'fermer_par_etapes', 'fermer'].includes(e.plan.mode)));
  }
});

test('sélecteur DECIDER_BACKEND : rules par défaut, valeur inconnue refusée, jev-* exige l\'autorisation', async () => {
  assert.equal(backendDepuisEnv({}), 'rules');
  assert.equal(backendDepuisEnv({ DECIDER_BACKEND: 'jev-gateway' }), 'jev-gateway');
  assert.throws(() => backendDepuisEnv({ DECIDER_BACKEND: 'gpt' }), /inconnu/);
  const r = creerClientsDecision({ env: {} });
  assert.equal(r.backend, 'rules');
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: r, stockage: new StockageMemoire(), minutes: 3 });
  assert.equal(j.entrees.length, 3);
  assert.throws(() => creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'jev-gateway' } }), /non autorisé/);
  assert.throws(() => creerClientsDecision({ env: { DECIDER_BACKEND: 'jev-gateway' }, autorise_payant: true }), /AI_GATEWAY_API_KEY absente/);
  assert.throws(() => creerClientsDecision({ env: { DECIDER_BACKEND: 'jev-direct' }, autorise_payant: true }), /TYPESAFE_API_KEY absente/);
  const tr = new TransportRegles();
  const rep = await tr.envoyer({ model: 'x', state: { role: 'directeur', densite: 'critique', tendance: 'monte', zone_critique: 'ugc', restant: 'beaucoup', stations: 'ouvertes_longtemps', sortis_vers_danger: 'aucun' }, questions: {} });
  assert.deepEqual((rep.answers.plan as { choice: string }).choice, 'fermer');
});

test('sélecteur jev-gateway : le cache de rejeu passe avant l\'appel payant', async () => {
  let appels = 0;
  const f = (async () => { appels++; return json(REPONSE); }) as unknown as typeof fetch;
  const dossier = mkdtempSync(join(tmpdir(), 'gw-'));
  const cache = join(dossier, 'jev.json');
  writeFileSync(cache, '{}');
  const run = async () => {
    const c = creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'jev-gateway' }, autorise_payant: true, cache, fetchImpl: f });
    return lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: c, stockage: new StockageMemoire(), minutes: 2 });
  };
  await run();
  const premier = appels;
  assert.ok(premier >= 1 && premier <= 8, 'au plus une requête par décideur et par minute');
  const dejaVu = appels;
  await run();
  assert.equal(appels, dejaVu, 'deuxième passage : tout vient du cache, aucun appel');
});

test('zéro appel réseau réel', () => {
  assert.equal(appelsReels, 0);
  assert.notEqual(globalThis.fetch, fetchReel);
});
