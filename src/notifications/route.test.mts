// Serveur HTTP local éphémère (127.0.0.1). Aucun envoi réel : seuls le bus du téléphone simulé et un transport d'agent factice servent.
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { AGENTS_EXEMPLE, DECISION_EVACUATION_EXEMPLE, SORTIES_EXEMPLE, populationExemple } from './exemple.ts';
import { creerRoute, creerService, type Service } from './route.ts';
import type { Notification } from './types.ts';

let serveur: Server;
let base = '';
let service: Service;
const appelsAgent: string[] = [];

before(async () => {
  service = creerService({ sorties: SORTIES_EXEMPLE, population: populationExemple(40), agents: AGENTS_EXEMPLE });
  const route = creerRoute(service);
  serveur = createServer((req, res) => void route(req, res));
  await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((ok) => serveur.close(() => ok())));

const post = (chemin: string, corps: unknown) => fetch(base + chemin, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps) });

test('POST /api/notifier : aperçu par défaut (dry_run), rien n\'est envoyé', async () => {
  const res = await post('/api/notifier', { decision: DECISION_EVACUATION_EXEMPLE });
  assert.equal(res.status, 200);
  const j = (await res.json()) as { dry_run: boolean; notifications: number; missions: number; apercu: Notification[]; couverture: { agents_manquants: number } };
  assert.equal(j.dry_run, true);
  assert.equal(j.notifications, 40);
  assert.equal(j.missions, 5);
  assert.equal(j.apercu.length, 5);
  assert.equal(j.couverture.agents_manquants, 3);
  const lecture = (await (await fetch(`${base}/api/notifications?destinataire=p1`)).json()) as { notifications: unknown[] };
  assert.equal(lecture.notifications.length, 0);
});

test('envoi (dry_run:false) puis GET /api/notifications, POST /api/ack et GET /api/missions', async () => {
  const recues: string[] = [];
  service.bus.abonner('p1', (e) => recues.push(e.notification.id));
  const res = await post('/api/notifier', { decision: DECISION_EVACUATION_EXEMPLE, dry_run: false });
  const j = (await res.json()) as { dry_run: boolean; acceptees: number; doublons: number; envoyees: number };
  assert.equal(j.dry_run, false);
  assert.equal(j.acceptees, 45);
  assert.equal(j.envoyees, 45);
  assert.equal(recues.length, 1);
  // même décision rejouée : aucun doublon envoyé
  const encore = (await (await post('/api/notifier', { decision: DECISION_EVACUATION_EXEMPLE, dry_run: false })).json()) as { acceptees: number; doublons: number };
  assert.deepEqual([encore.acceptees, encore.doublons], [0, 45]);
  assert.equal(recues.length, 1);

  const lu = (await (await fetch(`${base}/api/notifications?destinataire=p1`)).json()) as { notifications: Notification[] };
  assert.equal(lu.notifications.length, 1);
  assert.match(lu.notifications[0]!.titre, /Message/);
  const ack = await post('/api/ack', { id: lu.notifications[0]!.id });
  assert.equal(ack.status, 200);
  assert.equal(service.suivi.entree(lu.notifications[0]!.id)!.statut, 'ackee');
  assert.equal((await post('/api/ack', { id: 'inconnu' })).status, 404);

  const m = (await (await fetch(`${base}/api/missions?agent=porte-lescot-1`)).json()) as { missions: { porte_a_garder: unknown }[]; fiches_imprimables: string[] };
  assert.equal(m.missions.length, 1);
  assert.match(m.fiches_imprimables[0]!, /Au mégaphone/);
  const mid = (service.missions.get('porte-lescot-1') ?? [])[0]!.id;
  assert.equal((await post('/api/ack', { id: mid })).status, 200);
  assert.equal(appelsAgent.length, 0);
});

test('refus : décision qui enferme (422), JSON invalide (400), méthode (405), chemin (404), paramètre manquant (400)', async () => {
  const toutes = Object.fromEntries(SORTIES_EXEMPLE.portes.map((p) => [p, 'fermee']));
  const r1 = await post('/api/notifier', { decision: { ...DECISION_EVACUATION_EXEMPLE, portes: toutes } });
  assert.equal(r1.status, 422);
  assert.match(((await r1.json()) as { raisons: string[] }).raisons.join(), /empêcherait de sortir/);
  const r2 = await fetch(`${base}/api/notifier`, { method: 'POST', body: '{pas du json' });
  assert.equal(r2.status, 400);
  assert.equal((await fetch(`${base}/api/notifier`)).status, 405);
  assert.equal((await fetch(`${base}/api/inconnu`)).status, 404);
  assert.equal((await fetch(`${base}/api/notifications`)).status, 400);
  const r3 = await post('/api/notifier', { decision: DECISION_EVACUATION_EXEMPLE, population: [{ id: 'a b', zone: 'cinema' }] });
  assert.equal(r3.status, 400);
});
