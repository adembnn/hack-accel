// Petit serveur HTTP sans framework (Aiven Runtime). Port : PORT (défaut 8080).
// Routes :
//   GET  /sante                       200 si la base répond, 503 sinon
//   POST /api/decisions               enregistre une décision      GET /api/decisions?run=<uuid>
//   POST /api/memoire                 enregistre un cas passé      GET /api/memoire/similaires?scene=..&etiquettes=a,b
//   POST /api/tableau                 écrit sur le tableau commun  GET /api/tableau?apres=<id>&run=<uuid>
//   GET  /api/tableau/flux            SSE : chaque nouvelle ligne du tableau commun arrive en direct
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import * as db from './db.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(res, code, corps) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(corps));
}

async function lireCorps(req) {
  let texte = '';
  for await (const morceau of req) {
    texte += morceau;
    if (texte.length > 1_000_000) throw Object.assign(new Error('corps trop gros'), { code: 413 });
  }
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

/** Crée le serveur (sans l'écouter) : utile aux tests. */
export async function creerServeur(pool) {
  const clients = new Set(); // connexions SSE ouvertes
  const arreterEcoute = await db.ecouterTableau(pool, async (id) => {
    if (clients.size === 0) return;
    const lignes = await db.lireTableau(pool, { apresId: id - 1, limite: 1 });
    for (const ligne of lignes) {
      for (const c of clients) {
        if (!c.run || c.run === ligne.run_id) c.res.write(`id: ${ligne.id}\nevent: tableau\ndata: ${JSON.stringify(ligne)}\n\n`);
      }
    }
  });

  const serveur = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    const chemin = url.pathname;
    try {
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
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        res.write(': connecté\n\n');
        // Reprise : Last-Event-ID (reconnexion automatique du navigateur) ou ?apres=
        const reprise = Number(req.headers['last-event-id'] ?? url.searchParams.get('apres') ?? 0) || 0;
        const client = { res, run };
        clients.add(client);
        const manquantes = await db.lireTableau(pool, { runId: run, apresId: reprise });
        for (const l of manquantes) res.write(`id: ${l.id}\nevent: tableau\ndata: ${JSON.stringify(l)}\n\n`);
        const battement = setInterval(() => res.write(': ping\n\n'), 15000);
        req.on('close', () => { clearInterval(battement); clients.delete(client); });
        return;
      }

      json(res, 404, { erreur: 'route inconnue' });
    } catch (e) {
      if (e.code && Number.isInteger(e.code) && e.code < 500) return json(res, e.code, { erreur: e.message });
      console.error(e);
      json(res, 500, { erreur: 'erreur serveur' });
    }
  });

  serveur.on('close', () => {
    for (const c of clients) c.res.end();
    arreterEcoute();
  });
  return serveur;
}

// Lancement direct : `node src/server/serveur.mjs`
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const pool = db.ouvrir();
  await db.migrer(pool);
  const serveur = await creerServeur(pool);
  const port = Number(process.env.PORT ?? 8080);
  serveur.listen(port, '0.0.0.0', () => console.log(`Serveur à l'écoute sur le port ${port}`));
  const arret = () => serveur.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', arret);
  process.on('SIGINT', arret);
}
