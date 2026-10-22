// Vérifie un déploiement : node infra/verifier-deploiement.mjs <url> [--scene forum-des-halles]
// Le jeton d'écriture se lit dans la variable d'environnement WRITE_TOKEN (jamais en argument, jamais affiché).
// Étapes : /sante (200 + base ok), écriture d'un REX marqué test, relecture, écriture sur le tableau commun reçue en SSE.
// Sortie : une ligne par étape avec sa latence ; code 0 seulement si tout passe. Ne contient aucun secret.
import http from 'node:http';
import https from 'node:https';

const args = process.argv.slice(2);
const urlBrute = args.find((a) => !a.startsWith('--'));
const scene = args.includes('--scene') ? args[args.indexOf('--scene') + 1] : 'forum-des-halles';
if (!urlBrute) { console.error('usage : node infra/verifier-deploiement.mjs <url> [--scene id]'); process.exit(2); }
let base;
try { base = new URL(urlBrute); } catch { console.error('URL invalide'); process.exit(2); }
base.username = ''; base.password = ''; base.search = ''; base.hash = '';
const jeton = process.env.WRITE_TOKEN ?? '';
const client = base.protocol === 'https:' ? https : http;

function appel(methode, chemin, corps) {
  return new Promise((ok, ko) => {
    const debut = performance.now();
    const donnees = corps === undefined ? null : JSON.stringify(corps);
    const req = client.request(new URL(chemin, base), {
      method: methode, timeout: 15000,
      headers: { ...(donnees ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(donnees) } : {}),
        ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) },
    }, (res) => {
      let t = ''; res.on('data', (d) => (t += d));
      res.on('end', () => {
        let json = null; try { json = t ? JSON.parse(t) : null; } catch { /* page HTML ou texte */ }
        ok({ code: res.statusCode, json, ms: Math.round(performance.now() - debut) });
      });
    });
    req.on('timeout', () => req.destroy(new Error('délai dépassé (15 s)')));
    req.on('error', ko);
    if (donnees) req.write(donnees);
    req.end();
  });
}

let echecs = 0;
const ligne = (ok, nom, detail, ms) => {
  if (!ok) echecs++;
  console.log(`${ok ? 'OK    ' : 'ECHEC '} ${nom.padEnd(34)} ${ms !== undefined ? String(ms).padStart(5) + ' ms  ' : '          '}${detail}`);
};

console.log(`Vérification de ${base.origin}${jeton ? ' (jeton d\'écriture fourni)' : ' (sans jeton : écritures non testables)'}`);

try {
  const s = await appel('GET', '/sante');
  ligne(s.code === 200 && s.json?.ok === true, 'GET /sante', `HTTP ${s.code} ${s.json ? JSON.stringify(s.json) : ''}`, s.ms);
  if (s.code !== 200) { console.log('Arrêt : /sante ne répond pas 200 (base éteinte ? DATABASE_URL absente ? voir les journaux de l\'application).'); process.exit(1); }

  const page = await appel('GET', '/');
  ligne(page.code === 200, 'GET / (interface dist/)', `HTTP ${page.code}`, page.ms);

  if (!jeton) { console.log('WRITE_TOKEN absent : écriture, relecture et SSE non testés.'); process.exit(echecs ? 1 : 3); }

  const e = await appel('POST', '/enseignes', { id: 'verif-deploiement', sceneId: scene, nom: 'Vérification de déploiement (test)' });
  const e409 = e.code === 409;
  ligne(e.code === 201 || e409, 'POST /enseignes (enseigne de test)', `HTTP ${e.code}${e409 ? ' (déjà créée)' : ''}${e.code === 400 ? ` : la scène « ${scene} » n'existe pas (lancer charger-rex.mjs)` : ''}`, e.ms);

  const marque = `TEST ${new Date().toISOString()}`;
  const w = await appel('POST', '/rex', { enseigneId: 'verif-deploiement', dateIncident: new Date().toISOString().slice(0, 10),
    typeIncident: 'test-deploiement', description: `${marque} - à ignorer`, etiquettes: ['test'] });
  ligne(w.code === 201, 'POST /rex (REX marqué test)', `HTTP ${w.code}${w.json?.erreur ? ' ' + w.json.erreur : ''}`, w.ms);

  const r = await appel('GET', '/rex?enseigne=verif-deploiement');
  const trouve = Array.isArray(r.json) && r.json.some((x) => x.description.startsWith(marque));
  ligne(r.code === 200 && trouve, 'GET /rex (relecture de la ligne)', trouve ? 'ligne retrouvée en base' : `HTTP ${r.code}, ligne absente`, r.ms);

  // SSE : on ouvre le flux, on écrit sur le tableau commun, on mesure le délai de réception.
  const recu = await new Promise((ok) => {
    const debut = performance.now();
    let tampon = '';
    const sonde = `sonde-${Date.now()}`;
    const req = client.get(new URL('/api/tableau/flux', base), (res) => {
      res.on('data', (d) => {
        tampon += d;
        if (tampon.includes(sonde)) { req.destroy(); ok(Math.round(performance.now() - debut)); }
      });
      setTimeout(() => appel('POST', '/api/tableau', { auteur: 'verif-deploiement', genre: 'note', contenu: { sonde } }).catch(() => {}), 500);
    });
    req.on('error', () => ok(null));
    setTimeout(() => { req.destroy(); ok(null); }, 8000);
  });
  ligne(recu !== null, 'SSE tableau commun (écriture -> flux)', recu !== null ? 'événement reçu en direct' : 'rien reçu en 8 s (proxy qui coupe le flux ?)', recu ?? undefined);
} catch (e) {
  console.log(`ECHEC  erreur réseau : ${String(e.message || e.code).replace(/[a-z][a-z0-9+.-]*:\/\/\S*@/gi, '***@')}`);
  process.exit(1);
}
console.log(echecs ? `\n${echecs} étape(s) en échec.` : '\nTout est vert : le déploiement répond, écrit, relit et diffuse.');
process.exit(echecs ? 1 : 0);
