// Canal « web-push » : Web Push (RFC 8030) avec identification VAPID (RFC 8292) et chiffrement du contenu aes128gcm (RFC 8291),
// écrit avec node:crypto et fetch, sans dépendance. Couche PUBLIQUE secondaire : les abonnés qui ont accepté les notifications du lieu.
//
// Garde-fous :
//  - les clés VAPID viennent UNIQUEMENT de l'environnement (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT), jamais d'un fichier du dépôt ;
//  - un envoi réel exige NOTIF_REEL=oui DANS L'ENVIRONNEMENT ET l'option explicite `envoiReel: true` ; sinon rien ne part (dry-run) ;
//  - `fetchImpl` est injectable : les tests passent un faux fetch et ne touchent jamais au réseau.
import { createECDH, createCipheriv, createPrivateKey, hkdfSync, randomBytes, sign } from 'node:crypto';
import type { Canal, Destinataire, Notification, ResultatEnvoi } from '../types.ts';

export interface AbonnementPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface OptionsWebPush {
  env?: Record<string, string | undefined>;
  /** Doit être vrai ET NOTIF_REEL=oui pour qu'une requête parte. */
  envoiReel?: boolean;
  fetchImpl?: typeof fetch;
  trouverAbonnement: (destinataireId: string) => AbonnementPush | undefined;
  maintenant?: () => number;
}

const b64u = (b: Buffer): string => b.toString('base64url');
const deB64u = (s: string): Buffer => Buffer.from(s, 'base64url');

/** Jeton VAPID : JWT ES256 {aud, exp, sub}. */
export function jetonVapid(endpoint: string, sujet: string, clePublique: string, clePrivee: string, maintenant: number): string {
  const pub = deB64u(clePublique);
  const jwk = { kty: 'EC', crv: 'P-256', d: clePrivee, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) };
  const cle = createPrivateKey({ key: jwk, format: 'jwk' });
  const entete = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const charge = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(maintenant / 1000) + 12 * 3600, sub: sujet })));
  const signature = sign('sha256', Buffer.from(`${entete}.${charge}`), { key: cle, dsaEncoding: 'ieee-p1363' });
  return `${entete}.${charge}.${b64u(signature)}`;
}

/** Chiffre le contenu pour le navigateur (RFC 8291, aes128gcm). Renvoie le corps complet de la requête (en-tête de contenu + chiffré). */
export function chiffrerContenu(contenu: Buffer, abonnement: AbonnementPush, aleatoire: (n: number) => Buffer = randomBytes): Buffer {
  const clientPub = deB64u(abonnement.keys.p256dh);
  const auth = deB64u(abonnement.keys.auth);
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const serveurPub = ecdh.getPublicKey();
  const secret = ecdh.computeSecret(clientPub);
  const infoCle = Buffer.concat([Buffer.from('WebPush: info\0'), clientPub, serveurPub]);
  const ikm = Buffer.from(hkdfSync('sha256', secret, auth, infoCle, 32));
  const sel = aleatoire(16);
  const cek = Buffer.from(hkdfSync('sha256', ikm, sel, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, sel, Buffer.from('Content-Encoding: nonce\0'), 12));
  const chiffre = createCipheriv('aes-128-gcm', cek, nonce);
  const crypte = Buffer.concat([chiffre.update(Buffer.concat([contenu, Buffer.from([2])])), chiffre.final(), chiffre.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([sel, rs, Buffer.from([serveurPub.length]), serveurPub, crypte]);
}

export function creerCanalWebPush(options: OptionsWebPush): Canal {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    nom: 'web-push',
    async envoyer(n: Notification, d: Destinataire): Promise<ResultatEnvoi> {
      if (!(options.envoiReel === true && env.NOTIF_REEL === 'oui')) {
        return { ok: true, remis: false, detail: 'simulation : NOTIF_REEL=oui et envoiReel:true requis pour un envoi réel' };
      }
      const pub = env.VAPID_PUBLIC_KEY;
      const priv = env.VAPID_PRIVATE_KEY;
      const sujet = env.VAPID_SUBJECT;
      if (!pub || !priv || !sujet) return { ok: false, erreur: 'vapid_non_configure' };
      const abo = options.trouverAbonnement(d.id);
      if (!abo) return { ok: false, erreur: 'pas_d_abonnement' };
      let url: URL;
      try {
        url = new URL(abo.endpoint);
      } catch {
        return { ok: false, erreur: 'endpoint_invalide' };
      }
      if (url.protocol !== 'https:') return { ok: false, erreur: 'endpoint_non_https' };
      const contenu = Buffer.from(JSON.stringify({ id: n.id, titre: n.titre, corps: n.corps, consigne: n.consigne }));
      if (contenu.length > 3800) return { ok: false, erreur: 'contenu_trop_long' };
      try {
        const jeton = jetonVapid(abo.endpoint, sujet, pub, priv, (options.maintenant ?? Date.now)());
        const reponse = await fetchImpl(abo.endpoint, {
          method: 'POST',
          headers: {
            'content-encoding': 'aes128gcm',
            'content-type': 'application/octet-stream',
            ttl: String(n.consigne.expire_s),
            urgency: n.consigne.niveau_urgence === 'urgence' ? 'high' : 'normal',
            authorization: `vapid t=${jeton}, k=${pub}`,
          },
          body: new Uint8Array(chiffrerContenu(contenu, abo)),
        });
        return reponse.ok ? { ok: true, remis: true } : { ok: false, erreur: `http_${reponse.status}` };
      } catch {
        return { ok: false, erreur: 'reseau' };
      }
    },
  };
}
