// Tests des canaux. Web Push : chiffrement vérifié en le déchiffrant côté « navigateur » avec une paire de clés locale ;
// le fetch est factice, aucune requête réelle ne part, aucune vraie clé n'est utilisée.
import assert from 'node:assert/strict';
import { createDecipheriv, createECDH, hkdfSync, randomBytes, createPublicKey, verify } from 'node:crypto';
import { test } from 'node:test';
import { creerCanalSms } from './canaux/sms.ts';
import { champsPassPourMessage, creerCanalWalletStub } from './canaux/wallet-pass.ts';
import { creerCanalWebPush, type AbonnementPush } from './canaux/web-push.ts';
import { DECISION_EVACUATION_EXEMPLE, SORTIES_EXEMPLE, populationExemple } from './exemple.ts';
import { preparerNotifications } from './dispatcher.ts';

const pop = populationExemple(2);
const notif = preparerNotifications(DECISION_EVACUATION_EXEMPLE, pop, SORTIES_EXEMPLE, { maintenant: () => 1_700_000_000_000 });

// Clés de TEST générées à la volée (jamais de clé réelle).
const vapid = createECDH('prime256v1');
vapid.generateKeys();
const ENV = {
  VAPID_PUBLIC_KEY: vapid.getPublicKey().toString('base64url'),
  VAPID_PRIVATE_KEY: vapid.getPrivateKey().toString('base64url'),
  VAPID_SUBJECT: 'mailto:test@example.test',
  NOTIF_REEL: 'oui',
};
const navigateur = createECDH('prime256v1');
navigateur.generateKeys();
const authSecret = randomBytes(16);
const abonnement: AbonnementPush = { endpoint: 'https://push.example.test/abc', keys: { p256dh: navigateur.getPublicKey().toString('base64url'), auth: authSecret.toString('base64url') } };

function dechiffrer(corps: Buffer): string {
  const sel = corps.subarray(0, 16);
  const idlen = corps[20]!;
  const serveurPub = corps.subarray(21, 21 + idlen);
  const crypte = corps.subarray(21 + idlen);
  const secret = navigateur.computeSecret(serveurPub);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), navigateur.getPublicKey(), serveurPub]);
  const ikm = Buffer.from(hkdfSync('sha256', secret, authSecret, info, 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, sel, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, sel, Buffer.from('Content-Encoding: nonce\0'), 12));
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(crypte.subarray(crypte.length - 16));
  const clair = Buffer.concat([d.update(crypte.subarray(0, crypte.length - 16)), d.final()]);
  assert.equal(clair[clair.length - 1], 2);
  return clair.subarray(0, clair.length - 1).toString('utf8');
}

test('web-push : garde-fou, rien ne part sans NOTIF_REEL=oui ET envoiReel:true', async () => {
  let appels = 0;
  const fetchImpl = (async () => (appels++, new Response(null, { status: 201 }))) as typeof fetch;
  const sansEnv = creerCanalWebPush({ env: {}, envoiReel: true, fetchImpl, trouverAbonnement: () => abonnement });
  const sansOption = creerCanalWebPush({ env: ENV, fetchImpl, trouverAbonnement: () => abonnement });
  for (const c of [sansEnv, sansOption]) {
    const r = await c.envoyer(notif[0]!, pop[0]!);
    assert.equal(r.ok, true);
    assert.equal(r.remis, false);
    assert.match(r.detail ?? '', /simulation/);
  }
  assert.equal(appels, 0);
});

test('web-push : requête VAPID chiffrée, déchiffrable par l\'abonné, en HTTPS seulement', async () => {
  const requetes: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => (requetes.push({ url, init }), new Response(null, { status: 201 }))) as unknown as typeof fetch;
  const canal = creerCanalWebPush({ env: ENV, envoiReel: true, fetchImpl, trouverAbonnement: () => abonnement, maintenant: () => 1_700_000_000_000 });
  const r = await canal.envoyer(notif[0]!, pop[0]!);
  assert.deepEqual(r, { ok: true, remis: true });
  const { url, init } = requetes[0]!;
  assert.equal(url, abonnement.endpoint);
  const h = init.headers as Record<string, string>;
  assert.equal(h['content-encoding'], 'aes128gcm');
  assert.equal(h.urgency, 'high');
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=(.+)$/.exec(h.authorization!)!;
  assert.equal(m[4], ENV.VAPID_PUBLIC_KEY);
  const charge = JSON.parse(Buffer.from(m[2]!, 'base64url').toString()) as { aud: string; sub: string };
  assert.equal(charge.aud, 'https://push.example.test');
  const pub = vapid.getPublicKey();
  const cle = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33, 65).toString('base64url') }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: cle, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3]!, 'base64url')));
  const contenu = JSON.parse(dechiffrer(Buffer.from(init.body as Uint8Array))) as { corps: string; titre: string };
  assert.equal(contenu.corps, notif[0]!.corps);
  assert.equal(contenu.titre, notif[0]!.titre);

  const http = creerCanalWebPush({ env: ENV, envoiReel: true, fetchImpl, trouverAbonnement: () => ({ ...abonnement, endpoint: 'http://x.test/a' }) });
  assert.equal((await http.envoyer(notif[0]!, pop[0]!)).erreur, 'endpoint_non_https');
  const sansCle = creerCanalWebPush({ env: { NOTIF_REEL: 'oui' }, envoiReel: true, fetchImpl, trouverAbonnement: () => abonnement });
  assert.equal((await sansCle.envoyer(notif[0]!, pop[0]!)).erreur, 'vapid_non_configure');
  assert.equal(requetes.length, 1);
});

test('stubs wallet et sms : rien ne part, opt-in exigé, format de pass documenté', async () => {
  const w = await creerCanalWalletStub().envoyer(notif[0]!, pop[0]!);
  assert.equal(w.ok, false);
  assert.equal(w.erreur, 'non_configure');
  const champs = champsPassPourMessage(notif[0]!, pop[0]!) as { backFields: { changeMessage: string; value: string }[] };
  assert.equal(champs.backFields[0]!.changeMessage, '%@');
  assert.equal(champs.backFields[0]!.value, notif[0]!.corps);
  const sansOptIn = creerCanalSms({ numeroOptIn: () => undefined });
  assert.equal((await sansOptIn.envoyer(notif[0]!, pop[0]!)).erreur, 'pas_d_opt_in');
  const sansFournisseur = creerCanalSms({ numeroOptIn: () => '+33000000000' });
  assert.equal((await sansFournisseur.envoyer(notif[0]!, pop[0]!)).erreur, 'non_configure');
  const envoyes: string[] = [];
  const avec = creerCanalSms({ numeroOptIn: () => '+33000000000', fournisseur: { envoyer: async (_n, t) => (envoyes.push(t), { ok: true }) } });
  assert.equal((await avec.envoyer(notif[1]!, pop[1]!)).ok, true);
  assert.match(envoyes[0]!, /^Message/);
});
