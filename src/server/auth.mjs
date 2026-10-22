// Jeton d'écriture (audit F3). Toute écriture HTTP exige l'en-tête `Authorization: Bearer <WRITE_TOKEN>`.
// - WRITE_TOKEN défini : jeton exigé, comparaison à temps constant.
// - WRITE_TOKEN absent : écritures REFUSÉES, sauf ALLOW_OPEN_WRITES=1 (développement local seulement).
// Le jeton se lit dans l'environnement à chaque requête (jamais dans un fichier lu par ce lot, jamais journalisé).
import { timingSafeEqual, createHash } from 'node:crypto';

const empreinte = (t) => createHash('sha256').update(String(t)).digest();

/** Renvoie null si l'écriture est permise, sinon { code, message }. */
export function verifierEcriture(req, env = process.env) {
  const attendu = env.WRITE_TOKEN;
  if (!attendu) {
    if (env.ALLOW_OPEN_WRITES === '1') return null;
    return { code: 401, message: 'écriture refusée : WRITE_TOKEN non configuré (ALLOW_OPEN_WRITES=1 pour le développement local)' };
  }
  const entete = req.headers.authorization ?? '';
  const m = /^Bearer (.+)$/.exec(entete);
  if (!m) return { code: 401, message: 'jeton d\'écriture requis (Authorization: Bearer ...)' };
  if (!timingSafeEqual(empreinte(m[1]), empreinte(attendu))) return { code: 401, message: 'jeton d\'écriture invalide' };
  return null;
}
