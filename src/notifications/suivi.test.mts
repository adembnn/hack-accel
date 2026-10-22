// Tests du suivi : accusés, relance, idempotence, débit, priorité, expiration, taux par zone. Temps simulé, aucun réseau.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerCanalConsole } from './canaux/console.ts';
import { creerBusTelephone, creerCanalTelephoneSimule } from './canaux/telephone-simule.ts';
import { DECISION_EVACUATION_EXEMPLE, SORTIES_EXEMPLE, populationExemple } from './exemple.ts';
import { preparerNotifications } from './dispatcher.ts';
import { creerSuivi } from './suivi.ts';
import type { Canal, Notification } from './types.ts';

function monde(n = 10, options: Partial<Parameters<typeof creerSuivi>[0]> = {}) {
  let t = 1_000_000;
  const envois: string[] = [];
  const bus = creerBusTelephone();
  const base = creerCanalTelephoneSimule(bus);
  const canal: Canal = { nom: 'telephone-simule', envoyer: async (x, d) => (envois.push(x.id), base.envoyer(x, d)) };
  const pop = populationExemple(n);
  const notifs = preparerNotifications(DECISION_EVACUATION_EXEMPLE, pop, SORTIES_EXEMPLE, { maintenant: () => t });
  const suivi = creerSuivi({ canaux: { 'telephone-simule': canal }, maintenant: () => t, delaiRelanceS: 30, ...options });
  return { suivi, pop, notifs, envois, bus, avancer: (s: number) => (t += s * 1000), maintenant: () => t };
}

test('idempotence : soumettre deux fois la même décision ne renvoie rien', async () => {
  const m = monde(5);
  assert.deepEqual(m.suivi.soumettre(m.notifs, m.pop), { acceptees: 5, doublons: 0 });
  await m.suivi.traiter();
  assert.deepEqual(m.suivi.soumettre(m.notifs, m.pop), { acceptees: 0, doublons: 5 });
  await m.suivi.traiter();
  assert.equal(m.envois.length, 5);
});

test('accusé de réception et relance : pas d\'accusé après 30 s → relance ; accusé → plus de relance ; plafond de relances', async () => {
  const m = monde(3, { maxRelances: 2 });
  m.suivi.soumettre(m.notifs, m.pop);
  await m.suivi.traiter();
  assert.equal(m.suivi.relancer(), 0);
  m.avancer(31);
  m.suivi.accuser(m.notifs[0]!.id);
  assert.equal(m.suivi.relancer(), 2);
  await m.suivi.traiter();
  assert.equal(m.envois.length, 5);
  m.avancer(31);
  assert.equal(m.suivi.relancer(), 2);
  await m.suivi.traiter();
  m.avancer(31);
  assert.equal(m.suivi.relancer(), 0, 'plafond de 2 relances atteint');
  assert.equal(m.notifs[0]!.ack, true);
  assert.deepEqual(m.suivi.sansAccuse().sort(), [m.notifs[1]!.id, m.notifs[2]!.id].sort());
});

test('le bus du téléphone simulé reçoit la notification et peut accuser', async () => {
  const m = monde(2);
  const recues: Notification[] = [];
  m.bus.abonner('p1', (e) => recues.push(e.notification));
  m.bus.surAccuse((id) => void m.suivi.accuser(id));
  m.suivi.soumettre(m.notifs, m.pop);
  await m.suivi.traiter();
  assert.equal(recues.length, 1);
  assert.equal(recues[0]!.destinataire_id, 'p1');
  m.bus.accuser(recues[0]!.id);
  assert.equal(m.suivi.entree(recues[0]!.id)!.statut, 'ackee');
  assert.equal(m.bus.historique('p1').length, 1);
});

test('limite de débit : au plus N envois par seconde, le reste attend', async () => {
  const m = monde(100, { debitMaxParS: 30 });
  m.suivi.soumettre(m.notifs, m.pop);
  assert.deepEqual(await m.suivi.traiter(), { envoyees: 30, expirees: 0, restantes: 70 });
  assert.equal((await m.suivi.traiter()).envoyees, 0);
  m.avancer(1);
  assert.equal((await m.suivi.traiter()).envoyees, 30);
  m.avancer(10);
  assert.equal((await m.suivi.traiter()).envoyees, 30);
});

test('priorité : l\'urgence part avant l\'information ; expiration : une notification périmée n\'est pas envoyée', async () => {
  const m = monde(3, { debitMaxParS: 1 });
  const [a, b, c] = m.notifs as [Notification, Notification, Notification];
  a.consigne.niveau_urgence = 'info';
  b.consigne.niveau_urgence = 'urgence';
  c.consigne.niveau_urgence = 'important';
  c.consigne.expire_s = 5;
  m.suivi.soumettre(m.notifs, m.pop);
  await m.suivi.traiter();
  assert.deepEqual(m.envois, [b.id]);
  m.avancer(6);
  const r = await m.suivi.traiter();
  assert.equal(r.expirees, 1);
  assert.deepEqual(m.envois, [b.id, a.id]);
  assert.equal(m.suivi.entree(c.id)!.statut, 'expiree');
  assert.equal(m.suivi.lire('p2').length, 0);
});

test('taux de remise par zone', async () => {
  const m = monde(30);
  m.suivi.soumettre(m.notifs, m.pop);
  await m.suivi.traiter();
  for (const n of m.notifs.filter((x, i) => i % 3 === 2 && x)) m.suivi.accuser(n.id);
  const z = m.suivi.tauxParZone();
  assert.equal(z.cinema!.destinataires, 20);
  assert.equal(z.galerie!.destinataires, 10);
  assert.equal(z.cinema!.taux_remise, 1);
  assert.equal(z.galerie!.taux_ack, 1);
  assert.equal(z.cinema!.taux_ack, 0);
});

test('canal en échec : repli, puis relance possible', async () => {
  const echec: Canal = { nom: 'telephone-simule', envoyer: async () => ({ ok: false, erreur: 'hors_ligne' }) };
  const lignes: string[] = [];
  const m = monde(1, { canaux: { 'telephone-simule': echec, console: creerCanalConsole((l) => lignes.push(l)) }, canalRepli: 'console' });
  m.suivi.soumettre(m.notifs, m.pop);
  await m.suivi.traiter();
  assert.equal(lignes.length, 1);
  assert.match(lignes[0]!, /Message from the venue/);
  assert.equal(m.suivi.entree(m.notifs[0]!.id)!.statut, 'remise');
});

test('lecture par le téléphone (GET) : la consigne en attente est marquée remise', async () => {
  const m = monde(2);
  m.suivi.soumettre(m.notifs, m.pop);
  const lues = m.suivi.lire('p0');
  assert.equal(lues.length, 1);
  assert.equal(m.suivi.entree(lues[0]!.id)!.statut, 'remise');
  assert.equal(m.suivi.lire('inconnu').length, 0);
});
