// Serveur HTTP local éphémère (127.0.0.1) : aucun appel vers l'API Anthropic, le cerveau est sans clé donc en secours par règles.
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
import { creerCerveau } from './cerveau.ts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
import { lot } from './outils-test.mts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
import { creerRoute } from './route.ts';

let serveur: Server;
let base = '';
let appelsReseau = 0;

before(async () => {
  const jamais = (() => {
    appelsReseau += 1;
    throw new Error('appel réseau interdit en test');
  }) as unknown as typeof fetch;
  const route = creerRoute(creerCerveau({ env: {}, fetchImpl: jamais }));
  serveur = createServer((req, res) => void route(req, res));
  await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}/api/agents`;
});
after(() => new Promise<void>((ok) => serveur.close(() => ok())));

test('POST /api/agents : {decisions:[{id, action, cible, message, raison}]}', async () => {
  const res = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(lot(30)) });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  assert.equal(res.headers.get('x-cerveau-source'), 'regles');
  const corps = (await res.json()) as { decisions: Record<string, unknown>[] };
  assert.deepEqual(Object.keys(corps), ['decisions']);
  assert.equal(corps.decisions.length, 30);
  for (const d of corps.decisions) assert.deepEqual(Object.keys(d).sort(), ['action', 'cible', 'id', 'message', 'raison']);
  assert.equal(appelsReseau, 0);
});

test('méthode autre que POST : 405', async () => {
  const res = await fetch(base);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'POST');
});

test('requêtes invalides : 400', async () => {
  const envoyer = (corps: string) => fetch(base, { method: 'POST', body: corps });
  const a = (id: string, role: unknown) => ({ id, role, perception: {} });
  assert.equal((await envoyer('{pas du json')).status, 400);
  assert.equal((await envoyer(JSON.stringify({ agents: [a('a', 'x')] }))).status, 400);
  assert.equal((await envoyer(JSON.stringify({ T: 1, agents: [] }))).status, 400);
  assert.equal((await envoyer(JSON.stringify({ T: 1, agents: [a('a', 'x'), a('a', 'x')] }))).status, 400);
  assert.equal((await envoyer(JSON.stringify({ T: 1, agents: [a('a', 7)] }))).status, 400);
});

test('corps trop volumineux : 413', async () => {
  const res = await fetch(base, { method: 'POST', body: 'x'.repeat(300 * 1024) });
  assert.equal(res.status, 413);
});
