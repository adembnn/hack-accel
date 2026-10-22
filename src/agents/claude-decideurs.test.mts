// Tests du transport Claude Haiku (décideurs) : fetch SIMULÉ partout, zéro appel réel, aucune vraie clé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  TransportClaudeHaiku, TransportRegles, ErreurClaude, URL_MESSAGES, NOM_OUTIL, backendDepuisEnv, creerClientsDecision,
  modeleDecideurs, outilDe, reponsesDepuisOutil, schemaQuestion,
} from './claude-decideurs.ts';
import { ClientTypee, MODELE_DECIDEURS, SPECS_CATALOGUE, SPECS_NOYAU } from './decisions-typees.ts';
import type { QuestionTypee, RequeteTypee } from './decisions-typees.ts';
import { lancerBoucle } from './boucle.ts';
import { FauxSimulateur, scenarioDeTest } from './fausse-sim.ts';
import { StockageMemoire } from './stockage.ts';

let appelsReels = 0;
globalThis.fetch = (async () => { appelsReels++; throw new Error('RÉSEAU RÉEL INTERDIT'); }) as typeof fetch;

const ENV = { ANTHROPIC_API_KEY: 'cle-factice-de-test', MODE_PAYANT: 'oui' };
const Q: Record<string, QuestionTypee> = {
  plan: { type: 'choice', instructions: 'Quelle décision ?', criteria: { rester_ouvert: 'a', fermer_par_etapes: 'b', fermer: 'c' } },
  confinement: { type: 'noul', instructions: 'Confiner ?' },
  guidage: { type: 'score', instructions: 'Quel guidage ?', criteria: ['aucun', 'faible', 'moyen', 'fort'] },
};
const REQ: RequeteTypee = { model: 'claude-haiku-5-5', state: { densite: 'critique', tendance: 'monte' }, questions: Q };
const OUTIL_OK = { plan: { choix: 'fermer', confiance: 0.9 }, confinement: { oui: true, confiance: 0.8 }, guidage: { niveau: 3, confiance: 0.7 } };
const reponseApi = (input: unknown, usage = { input_tokens: 412, output_tokens: 57 }) =>
  new Response(JSON.stringify({ id: 'msg_x', type: 'message', role: 'assistant', content: [{ type: 'text', text: 'ok' }, { type: 'tool_use', id: 'toolu_1', name: NOM_OUTIL, input }], stop_reason: 'tool_use', usage }), { status: 200, headers: { 'content-type': 'application/json' } });
const erreur = (status: number) => new Response(JSON.stringify({ type: 'error', error: { type: 'x', message: 'y' } }), { status });
const lent = ((_u: string, init: RequestInit) => new Promise((_res, rej) => { init.signal?.addEventListener('abort', () => rej(init.signal?.reason)); })) as unknown as typeof fetch;

test('requête : URL, en-têtes et corps exacts de l\'API Messages, outil forcé', async () => {
  const vus: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => { vus.push({ url, init }); return reponseApi(OUTIL_OK); }) as unknown as typeof fetch;
  await new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: f }).envoyer(REQ);
  assert.equal(vus.length, 1);
  assert.equal(vus[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(URL_MESSAGES, vus[0].url);
  assert.equal(vus[0].init.method, 'POST');
  const h = vus[0].init.headers as Record<string, string>;
  assert.deepEqual(Object.keys(h).sort(), ['anthropic-version', 'content-type', 'x-api-key']);
  assert.equal(h['x-api-key'], 'cle-factice-de-test');
  assert.equal(h['anthropic-version'], '2023-06-01');
  assert.ok(vus[0].init.signal, 'délai armé');
  const corps = JSON.parse(vus[0].init.body as string);
  assert.deepEqual(Object.keys(corps).sort(), ['max_tokens', 'messages', 'model', 'system', 'temperature', 'tool_choice', 'tools']);
  assert.equal(corps.model, 'claude-haiku-5-5');
  assert.equal(corps.temperature, 0);
  assert.deepEqual(corps.tool_choice, { type: 'tool', name: 'repondre' });
  assert.equal(corps.tools.length, 1);
  assert.equal(corps.messages.length, 1);
  assert.equal(corps.messages[0].role, 'user');
  assert.match(corps.messages[0].content, /"densite":"critique"/);
  const schema = corps.tools[0].input_schema;
  assert.deepEqual(schema.required, ['plan', 'confinement', 'guidage']);
  assert.deepEqual(schema.properties.plan.properties.choix.enum, ['rester_ouvert', 'fermer_par_etapes', 'fermer']);
  assert.equal(schema.properties.confinement.properties.oui.type, 'boolean');
  assert.deepEqual([schema.properties.guidage.properties.niveau.minimum, schema.properties.guidage.properties.niveau.maximum], [0, 3]);
  assert.equal(schema.properties.plan.properties.confiance.maximum, 1);
  assert.equal(schema.additionalProperties, false);
});

test('réponse : tool_use parsé et converti en probabilités, jetons comptés', async () => {
  const f = (async () => reponseApi(OUTIL_OK)) as unknown as typeof fetch;
  const t = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: f });
  const r = await t.envoyer(REQ);
  assert.equal(r.model, 'claude-haiku-5-5');
  const plan = r.answers.plan as { choice: string; confidence: number; probabilities: Record<string, number> };
  assert.equal(plan.choice, 'fermer');
  assert.equal(plan.confidence, 0.9);
  assert.ok(Math.abs(plan.probabilities.rester_ouvert - 0.05) < 1e-9);
  assert.ok(Math.abs((r.answers.confinement as { noul: number }).noul - 0.9) < 1e-9, 'oui avec confiance 0,8 → 0,9');
  const probas = (r.answers.guidage as { probabilities: number[] }).probabilities;
  assert.ok(Math.abs(probas.reduce((s, x) => s + x, 0) - 1) < 1e-9, 'probabilités normalisées');
  assert.equal((r.answers.guidage as { score: number }).score, 3);
  assert.equal(t.jetons_entree, 412);
  assert.equal(t.jetons_sortie, 57);
  assert.equal(t.appels, 1);
});

test('réponse invalide ou hors menu : omise, jamais devinée', () => {
  const r = reponsesDepuisOutil(Q, { plan: { choix: 'tout_brûler', confiance: 0.9 }, confinement: { oui: 'peut-être', confiance: 0.9 }, guidage: { niveau: 9, confiance: 0.5 } });
  assert.deepEqual(r, {});
  assert.deepEqual(reponsesDepuisOutil(Q, { plan: { choix: 'fermer', confiance: 1.5 } }), {});
  assert.deepEqual(reponsesDepuisOutil(Q, 'pas un objet'), {});
  assert.deepEqual(Object.keys(reponsesDepuisOutil(Q, { confinement: { oui: false, confiance: 1 } })), ['confinement']);
  assert.equal((reponsesDepuisOutil(Q, { confinement: { oui: false, confiance: 1 } }).confinement as { noul: number }).noul, 0);
});

test('schémas dérivés de SPECS_NOYAU et SPECS_CATALOGUE : un schéma valide par question, alarme générale absente', () => {
  let n = 0;
  for (const specs of [...Object.values(SPECS_NOYAU), ...Object.values(SPECS_CATALOGUE)]) {
    for (const s of specs) {
      const sch = schemaQuestion(s.question) as { type: string; required: string[]; properties: Record<string, { enum?: string[]; type?: string }> };
      assert.equal(sch.type, 'object', s.cle);
      assert.ok(sch.required.includes('confiance'), s.cle);
      if (s.question.type === 'choice') assert.deepEqual(sch.properties.choix.enum, Object.keys(s.question.criteria));
      if (s.cle === 'S4') assert.ok(!sch.properties.choix.enum?.includes('generale'));
      n++;
    }
  }
  assert.ok(n >= 46 + 6);
  const outil = outilDe(Object.fromEntries(SPECS_CATALOGUE.directeur.map((s) => [s.cle, s.question])));
  assert.equal(outil.name, 'repondre');
  assert.equal(Object.keys(outil.input_schema.properties as object).length, 9);
});

test('erreurs 401, 429, 529, 500, délai et réponse sans outil : exceptions typées', async () => {
  for (const [statut, motif] of [[401, /401/], [429, /429/], [529, /529/], [500, /500/]] as const) {
    const t = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: (async () => erreur(statut)) as unknown as typeof fetch });
    await assert.rejects(t.envoyer(REQ), (e: unknown) => e instanceof ErreurClaude && e.statut === statut && motif.test(e.message));
  }
  const t = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: lent, timeout_ms: 30 });
  await assert.rejects(t.envoyer(REQ), /délai de 30 ms/);
  const sansOutil = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: (async () => new Response(JSON.stringify({ content: [{ type: 'text', text: 'bonjour' }] }), { status: 200 })) as unknown as typeof fetch });
  await assert.rejects(sansOutil.envoyer(REQ), /sans appel de l'outil/);
});

test('garde : autorisation, clé et MODE_PAYANT exigés ; plafond d\'appels', async () => {
  assert.throws(() => new TransportClaudeHaiku({ autorise_payant: false, env: ENV }), /non autorisé/);
  assert.throws(() => new TransportClaudeHaiku({ autorise_payant: true, env: { MODE_PAYANT: 'oui' } }), /ANTHROPIC_API_KEY absente/);
  assert.throws(() => new TransportClaudeHaiku({ autorise_payant: true, env: { ANTHROPIC_API_KEY: 'k' } }), /MODE_PAYANT/);
  const t = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: (async () => reponseApi(OUTIL_OK)) as unknown as typeof fetch, plafond_appels: 2 });
  await t.envoyer(REQ); await t.envoyer(REQ);
  await assert.rejects(t.envoyer(REQ), /plafond de 2/);
  assert.equal(t.appels, 2);
});

test('401, 429 et délai en pleine boucle : repli sur les règles, la boucle va au bout', async () => {
  const cas: [string, typeof fetch][] = [['401', (async () => erreur(401)) as unknown as typeof fetch], ['429', (async () => erreur(429)) as unknown as typeof fetch], ['délai', lent]];
  for (const [nom, f] of cas) {
    const raisons: string[] = [];
    const t = new TransportClaudeHaiku({ autorise_payant: true, env: ENV, fetchImpl: f, timeout_ms: 20 });
    const cj = new ClientTypee({ transport: t, surRepli: (_d, r) => raisons.push(r) });
    const clients = { prefecture: cj, ratp: cj, securite_centre: cj, directeur: cj };
    const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients, stockage: new StockageMemoire(), minutes: 3 });
    assert.equal(j.entrees.length, 3, nom);
    assert.ok(cj.replis >= 3, `${nom} : repli sur règles`);
    assert.ok(j.entrees.every((e) => ['rester_ouvert', 'fermer_par_etapes', 'fermer'].includes(e.plan.mode)));
  }
});

test('boucle avec Claude simulé : les décideurs agissent dans leur menu à partir du tool_use', async () => {
  const f = (async (_u: string, init: RequestInit) => {
    const corps = JSON.parse(init.body as string);
    const props = corps.tools[0].input_schema.properties as Record<string, { properties: Record<string, unknown> }>;
    const input: Record<string, unknown> = {};
    for (const [cle, p] of Object.entries(props)) {
      if ('oui' in p.properties) input[cle] = { oui: true, confiance: 1 };
      else if ('choix' in p.properties) input[cle] = { choix: (p.properties.choix as { enum: string[] }).enum.at(-1), confiance: 0.9 };
      else input[cle] = { niveau: 2, confiance: 0.9 };
    }
    return reponseApi(input);
  }) as unknown as typeof fetch;
  const c = creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'claude' }, autorise_payant: true, fetchImpl: f });
  const st = new StockageMemoire();
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: c, stockage: st, minutes: 2 });
  assert.equal(j.entrees.length, 2);
  assert.equal(j.entrees[0].plan.mode, 'fermer');
  const acceptees = (await st.lister()).flatMap((x) => x.actions_acceptees);
  assert.ok(acceptees.some((a) => a.levier === 'mode' && a.valeur === 'fermer'));
});

test('sélecteur DECIDER_BACKEND : rules par défaut, valeur inconnue (jev, gpt) refusée, claude exige garde et clé', async () => {
  assert.equal(backendDepuisEnv({}), 'rules');
  assert.equal(backendDepuisEnv({ DECIDER_BACKEND: 'claude' }), 'claude');
  for (const b of ['jev-gateway', 'jev-direct', 'gpt']) assert.throws(() => backendDepuisEnv({ DECIDER_BACKEND: b }), /inconnu/);
  const r = creerClientsDecision({ env: {} });
  assert.equal(r.backend, 'rules');
  assert.equal(r.modele, 'claude-haiku-5-5');
  const j = await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: r, stockage: new StockageMemoire(), minutes: 3 });
  assert.equal(j.entrees.length, 3);
  assert.throws(() => creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'claude' } }), /non autorisé/);
  assert.throws(() => creerClientsDecision({ env: { DECIDER_BACKEND: 'claude', MODE_PAYANT: 'oui' }, autorise_payant: true }), /ANTHROPIC_API_KEY absente/);
  assert.throws(() => creerClientsDecision({ env: { DECIDER_BACKEND: 'claude', ANTHROPIC_API_KEY: 'k' }, autorise_payant: true }), /MODE_PAYANT/);
  const rep = await new TransportRegles().envoyer({ model: 'x', state: { role: 'directeur', densite: 'critique', tendance: 'monte', zone_critique: 'ugc', restant: 'beaucoup', stations: 'ouvertes_longtemps', sortis_vers_danger: 'aucun' }, questions: {} });
  assert.equal((rep.answers.plan as { choice: string }).choice, 'fermer');
});

test('MODELE_DECIDEURS : version du modèle configurable par l\'environnement, transmise à l\'API', async () => {
  assert.equal(modeleDecideurs({}), MODELE_DECIDEURS);
  assert.equal(modeleDecideurs({ MODELE_DECIDEURS: 'claude-haiku-5-6' }), 'claude-haiku-5-6');
  const modeles: string[] = [];
  const f = (async (_u: string, init: RequestInit) => { modeles.push(JSON.parse(init.body as string).model); return reponseApi({}); }) as unknown as typeof fetch;
  const c = creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'claude', MODELE_DECIDEURS: 'claude-haiku-5-6' }, autorise_payant: true, fetchImpl: f });
  assert.equal(c.modele, 'claude-haiku-5-6');
  await lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: c, stockage: new StockageMemoire(), minutes: 1 });
  assert.ok(modeles.length >= 1 && modeles.every((m) => m === 'claude-haiku-5-6'));
});

test('le cache de rejeu scellé passe avant l\'appel payant', async () => {
  let appels = 0;
  const f = (async () => { appels++; return reponseApi(OUTIL_OK); }) as unknown as typeof fetch;
  const dossier = mkdtempSync(join(tmpdir(), 'cl-'));
  const cache = join(dossier, 'c.json');
  writeFileSync(cache, '{}');
  const run = async () => lancerBoucle({
    simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), stockage: new StockageMemoire(), minutes: 2,
    clients: creerClientsDecision({ env: { ...ENV, DECIDER_BACKEND: 'claude' }, autorise_payant: true, cache, fetchImpl: f }),
  });
  await run();
  const premier = appels;
  assert.ok(premier >= 1 && premier <= 8);
  await run();
  assert.equal(appels, premier, 'deuxième passage : tout vient du cache');
});

test('zéro appel réseau réel', () => {
  assert.equal(appelsReels, 0);
});
