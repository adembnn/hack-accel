// Petit serveur HTTP sans framework (Aiven Runtime). Port : PORT (défaut 8080).
// Routes :
//   GET  /sante                       200 si la base répond, 503 sinon
//   POST /api/decisions               enregistre une décision      GET /api/decisions?run=<uuid>
//   POST /api/memoire                 enregistre un cas passé      GET /api/memoire/similaires?scene=..&etiquettes=a,b
//   POST /api/tableau                 écrit sur le tableau commun  GET /api/tableau?apres=<id>&run=<uuid>
//   GET  /api/tableau/flux            SSE : chaque nouvelle ligne du tableau commun arrive en direct
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as db from './db.mjs';
import { creerFlux } from './sse.mjs';
import { validerRex, masquer, LIMITES } from './valider.mjs';
import { verifierEcriture } from './auth.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(res, code, corps) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(corps));
}

async function lireCorps(req) {
  let texte = '';
  let vu = 0;
  for await (const morceau of req) {
    vu += morceau.length;
    if (vu > 1_000_000) { req.destroy(); break; }        // flux sans fin : on coupe
    if (vu <= LIMITES.corps) texte += morceau;           // au-delà de la limite on jette, sans mémoriser
  }
  if (vu > LIMITES.corps) throw Object.assign(new Error('corps trop gros'), { code: 413 });
  try { return texte ? JSON.parse(texte) : {}; }
  catch { throw Object.assign(new Error('JSON invalide'), { code: 400 }); }
}

function exiger(corps, ...champs) {
  for (const c of champs) {
    if (corps[c] === undefined || corps[c] === null || corps[c] === '') {
      throw Object.assign(new Error(`champ manquant : ${c}`), { code: 400 });
    }
  }
}

function runValide(valeur) {
  if (valeur && !UUID.test(valeur)) throw Object.assign(new Error('identifiant de run invalide'), { code: 400 });
  return valeur || null;
}

const DIST = resolve(fileURLToPath(new URL('../../dist', import.meta.url)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.map': 'application/json' };

/** Sert un fichier de dist/ (refus de sortir du dossier). Renvoie false si absent. */
async function servirStatique(res, chemin) {
  let rel;
  try { rel = decodeURIComponent(chemin); } catch { return false; }
  const fichier = join(DIST, normalize(rel === '/' ? '/index.html' : rel));
  if (fichier !== DIST && !fichier.startsWith(DIST + sep)) return false;
  try {
    const corps = await readFile(fichier);
    res.writeHead(200, { 'content-type': TYPES[extname(fichier)] ?? 'application/octet-stream' });
    res.end(corps);
    return true;
  } catch { return false; }
}

/** Crée le serveur (sans l'écouter) : utile aux tests. */
/**
 * Point d'extension : `routesExtra` = fonctions `async (req, res, url, ctx) => boolean` essayées avant le 404 (true = traité).
 * Prévu pour routeDirecteur (proto/directeur) et routeAgents (proto/personnages) : ce lot ne les importe pas encore.
 * Les POST passent déjà par le jeton d'écriture (WRITE_TOKEN) avant d'atteindre ces routes ; ctx = { pool, json, lireCorps }.
 */
export async function creerServeur(pool, { routesExtra = [] } = {}) {
  const flux = creerFlux({ tampon: 200, maxClients: 100, maxBacklogOctets: 64 * 1024 });
  const numerote = (l) => ({ ...l, id: Number(l.id) });
  /** Lit en base TOUT ce qui suit `apres`, par pages de 200 (plafond 5000 lignes par reprise). */
  async function lireDepuis(run, apres) {
    const toutes = [];
    let curseur = apres;
    while (toutes.length < 5000) {
      const page = (await db.lireTableau(pool, { runId: run, apresId: curseur, limite: 200 })).map(numerote);
      toutes.push(...page);
      if (page.length < 200) break;
      curseur = page[page.length - 1].id;
    }
    return toutes;
  }
  const arreterEcoute = await db.ecouterTableau(pool, async (id) => {
    try {
      const lignes = await db.lireTableau(pool, { apresId: id - 1, limite: 1 });
      for (const ligne of lignes) flux.publier(numerote(ligne));
    } catch (e) { console.error('écoute du tableau :', masquer(e.message)); }
  }, {
    // Après une coupure de l'écoute, les NOTIFY manqués sont rattrapés depuis la base.
    surReconnexion: async () => { for (const l of await lireDepuis(null, Math.max(0, flux.plusGrandId() - 20))) flux.publier(l); },
    delaiInitialMs: Number(process.env.ECOUTE_DELAI_INITIAL_MS ?? 500),
  });
  const dureeMaxFlux = () => Number(process.env.SSE_DUREE_MAX_MS ?? 600000);   // 10 min : le navigateur se reconnecte seul

  const serveur = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    const chemin = url.pathname.replace(/^\/(rex|lecons|enseignes)(?=\/|$)/, '/api/$1'); // /rex vaut /api/rex
    try {
      // Audit F3 : toute écriture exige le jeton (voir auth.mjs).
      if (req.method === 'POST') {
        const refus = verifierEcriture(req);
        if (refus) { req.resume(); return json(res, refus.code, { erreur: refus.message }); }
      }
      if (req.method === 'GET' && chemin === '/sante') {
        try { await db.sante(pool); return json(res, 200, { ok: true, base: 'ok' }); }
        catch { return json(res, 503, { ok: false, base: 'indisponible' }); }
      }

      if (chemin === '/api/decisions') {
        if (req.method === 'POST') {
          const c = await lireCorps(req);
          exiger(c, 'runId', 'minuteSimulee', 'decideur', 'levier');
          runValide(c.runId);
          return json(res, 201, await db.enregistrerDecision(pool, c));
        }
        if (req.method === 'GET') {
          const run = runValide(url.searchParams.get('run'));
          if (!run) return json(res, 400, { erreur: 'paramètre run requis' });
          return json(res, 200, await db.lireDecisions(pool, run));
        }
      }

      if (chemin === '/api/memoire' && req.method === 'POST') {
        const c = await lireCorps(req);
        exiger(c, 'sceneId', 'resume');
        return json(res, 201, await db.enregistrerMemoire(pool, c));
      }
      if (chemin === '/api/memoire/similaires' && req.method === 'GET') {
        const scene = url.searchParams.get('scene');
        const etiquettes = (url.searchParams.get('etiquettes') ?? '').split(',').filter(Boolean);
        if (!scene || etiquettes.length === 0) return json(res, 400, { erreur: 'scene et etiquettes requis' });
        const limite = Math.min(Number(url.searchParams.get('limite') ?? 5) || 5, 50);
        return json(res, 200, await db.casSimilaires(pool, { sceneId: scene, etiquettes, limite }));
      }

      if (chemin === '/api/enseignes' && req.method === 'POST') {
        const c = await lireCorps(req);
        exiger(c, 'id', 'sceneId', 'nom');
        if (![c.id, c.sceneId, c.nom, c.zone ?? ''].every((v) => typeof v === 'string' && v.length <= 200)) {
          return json(res, 422, { erreur: 'champs texte invalides' });
        }
        const e = await db.enregistrerEnseigne(pool, c);
        return e ? json(res, 201, e) : json(res, 409, { erreur: "identifiant d'enseigne déjà pris" });
      }
      if (chemin === '/api/rex') {
        if (req.method === 'POST') {
          const c = await lireCorps(req);
          // A1, A2, A10 : validation stricte puis marquage des textes louches, avant toute écriture.
          const r = await db.enregistrerRexEnseigne(pool, validerRex(c), { plafond: LIMITES.rexParEnseigne });
          if (r.plafond) return json(res, 429, { erreur: `plafond de ${LIMITES.rexParEnseigne} REX par enseigne atteint` });
          return r.doublon ? json(res, 200, { doublon: true, id: r.rex?.id }) : json(res, 201, r.rex);
        }
        if (req.method === 'GET') {
          return json(res, 200, await db.lireRex(pool, {
            enseigneId: url.searchParams.get('enseigne'), sceneId: url.searchParams.get('scene') }));
        }
      }
      if (chemin === '/api/lecons/statut' && req.method === 'POST') {
        const c = await lireCorps(req);
        exiger(c, 'id', 'statut');
        runValide(c.runId);
        return json(res, 200, await db.changerStatutLecon(pool, { id: c.id, statut: c.statut, runId: c.runId ?? null }));
      }
      if (chemin === '/api/lecons') {
        if (req.method === 'POST') {
          const c = await lireCorps(req);
          exiger(c, 'sceneId', 'texte');
          if (typeof c.texte !== 'string' || c.texte.length > LIMITES.texte) return json(res, 422, { erreur: 'texte invalide ou trop long' });
          // A3 : une leçon naît toujours non vérifiée ; le statut ne se choisit pas à l'écriture.
          // La provenance et l'auteur sont posés par le serveur ; ce que déclare le client est rangé à part, sans pouvoir écraser.
          const auteur = typeof c.auteur === 'string' && c.auteur.length <= 80 && c.auteur !== 'corpus-public' ? c.auteur : 'analyste';
          const declaree = c.provenance && typeof c.provenance === 'object' && JSON.stringify(c.provenance).length <= 500 ? c.provenance : undefined;
          return json(res, 201, await db.enregistrerLecon(pool, {
            sceneId: c.sceneId, texte: c.texte, etiquettes: c.etiquettes, confiance: c.confiance, rexIds: c.rexIds,
            auteur, provenance: declaree ? { declaree } : {},
          }));
        }
        if (req.method === 'GET') {
          const scene = url.searchParams.get('scene');
          if (!scene) return json(res, 400, { erreur: 'paramètre scene requis' });
          const etiquettes = (url.searchParams.get('etiquettes') ?? '').split(',').filter(Boolean);
          return json(res, 200, await db.lireLecons(pool, { sceneId: scene, etiquettes }));
        }
      }

      if (chemin === '/api/tableau') {
        if (req.method === 'POST') {
          const c = await lireCorps(req);
          exiger(c, 'auteur', 'genre');
          runValide(c.runId);
          return json(res, 201, await db.ecrireTableau(pool, c));
        }
        if (req.method === 'GET') {
          return json(res, 200, await db.lireTableau(pool, {
            runId: runValide(url.searchParams.get('run')),
            apresId: Number(url.searchParams.get('apres') ?? 0) || 0,
          }));
        }
      }

      if (chemin === '/api/tableau/flux' && req.method === 'GET') {
        const run = runValide(url.searchParams.get('run'));
        if (flux.nbClients() >= 100) return json(res, 503, { erreur: 'trop de connexions au flux' });
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        res.write(': connecté\n\n');
        // Reprise : Last-Event-ID (reconnexion automatique du navigateur) ou ?apres=
        const reprise = Number(req.headers['last-event-id'] ?? url.searchParams.get('apres') ?? 0) || 0;
        const client = {
          run,
          adresse: req.socket.remoteAddress,
          ecrire: (t) => res.write(t),
          arriere: () => res.writableLength,
          fermer: () => res.end(),
        };
        // Lecture en base d'abord (toutes les pages), abonnement ensuite (synchrone) : rien de perdu ni de doublé entre les deux.
        // On relit 20 id sous la reprise : un id plus petit validé plus tard que le dernier reçu ne se perd pas
        // (le client dédoublonne par id).
        const depart = Math.max(0, reprise - 20);
        const manquantes = await lireDepuis(run, depart);
        let desabonner;
        try { desabonner = flux.abonner(client); }
        catch { res.end(); return; }
        flux.rattraper(client, [...manquantes, ...flux.depuis(depart)].sort((a, b) => a.id - b.id));
        const battement = setInterval(() => { res.write(': ping\n\n'); if (client.arriere() > 64 * 1024) res.end(); }, 15000);
        const duree = setTimeout(() => res.end(), dureeMaxFlux());   // délai maximal : libère les emplacements dormants
        req.on('close', () => { clearInterval(battement); clearTimeout(duree); desabonner(); });
        return;
      }

      for (const route of routesExtra) if (await route(req, res, url, { pool, json, lireCorps })) return;

      // Hors API : l'interface Vite construite (dist/), pour qu'un seul processus serve tout sur le port Runtime.
      if (req.method === 'GET' && !chemin.startsWith('/api/') && await servirStatique(res, chemin)) return;

      json(res, 404, { erreur: 'route inconnue' });
    } catch (e) {
      if (e.code && Number.isInteger(e.code) && e.code < 500) return json(res, e.code, { erreur: e.message });
      // Erreurs de saisie PostgreSQL : clé étrangère absente, contrainte CHECK, texte mal formé
      if (['23503', '23514', '22P02', '22007'].includes(e.code)) return json(res, 400, { erreur: 'donnée refusée par la base' });
      // A17 : jamais d'objet d'erreur brut dans les journaux (il peut contenir l'URL de connexion) ; message masqué.
      console.error('erreur serveur', req.method, chemin, e.code ?? '', masquer(e.message));
      json(res, 500, { erreur: 'erreur serveur' });
    }
  });

  serveur.on('close', () => {
    flux.fermerTout();
    arreterEcoute();
  });
  return serveur;
}

// Lancement direct : `node src/server/serveur.mjs`
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let pool, serveur;
  try {
    pool = db.ouvrir();
    await db.migrer(pool);
    serveur = await creerServeur(pool);
  } catch (e) {
    // Jamais d'objet d'erreur brut : il peut contenir l'URL de connexion.
    console.error('démarrage impossible :', masquer(e.message));
    process.exit(1);
  }
  const port = Number(process.env.PORT ?? 8080);
  serveur.listen(port, '0.0.0.0', () => console.log(`Serveur à l'écoute sur le port ${port}`));
  const arret = () => serveur.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', arret);
  process.on('SIGINT', arret);
}
