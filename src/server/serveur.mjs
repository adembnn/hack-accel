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
import { creerFlux } from './sse.mjs';
import { validerRex, masquer, LIMITES } from './valider.mjs';

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

/** Crée le serveur (sans l'écouter) : utile aux tests. */
export async function creerServeur(pool) {
  const flux = creerFlux({ tampon: 200, maxClients: 100, maxBacklogOctets: 64 * 1024 });
  const numerote = (l) => ({ ...l, id: Number(l.id) });
  const arreterEcoute = await db.ecouterTableau(pool, async (id) => {
    try {
      const lignes = await db.lireTableau(pool, { apresId: id - 1, limite: 1 });
      for (const ligne of lignes) flux.publier(numerote(ligne));
    } catch (e) { console.error('écoute du tableau :', masquer(e.message)); }
  });

  const serveur = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    const chemin = url.pathname.replace(/^\/(rex|lecons|enseignes)(?=\/|$)/, '/api/$1'); // /rex vaut /api/rex
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

      if (chemin === '/api/enseignes' && req.method === 'POST') {
        const c = await lireCorps(req);
        exiger(c, 'id', 'sceneId', 'nom');
        return json(res, 201, await db.enregistrerEnseigne(pool, c));
      }
      if (chemin === '/api/rex') {
        if (req.method === 'POST') {
          const c = await lireCorps(req);
          // A1, A2, A10 : validation stricte puis marquage des textes louches, avant toute écriture.
          const rex = await db.enregistrerRex(pool, validerRex(c));
          return json(res, rex ? 201 : 200, rex ?? { doublon: true });
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
          return json(res, 201, await db.enregistrerLecon(pool, { ...c, statut: undefined, runValidation: undefined }));
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
          ecrire: (t) => res.write(t),
          arriere: () => res.writableLength,
          fermer: () => res.end(),
        };
        // Lecture en base d'abord, abonnement ensuite (synchrone) : aucun événement perdu ni doublé entre les deux.
        const manquantes = (await db.lireTableau(pool, { runId: run, apresId: reprise })).map(numerote);
        let desabonner;
        try { desabonner = flux.abonner(client, reprise); }
        catch { res.end(); return; }
        flux.rattraper(client, [...manquantes, ...flux.depuis(reprise)].sort((a, b) => a.id - b.id));
        const battement = setInterval(() => res.write(': ping\n\n'), 15000);
        req.on('close', () => { clearInterval(battement); desabonner(); });
        return;
      }

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
  const pool = db.ouvrir();
  await db.migrer(pool);
  const serveur = await creerServeur(pool);
  const port = Number(process.env.PORT ?? 8080);
  serveur.listen(port, '0.0.0.0', () => console.log(`Serveur à l'écoute sur le port ${port}`));
  const arret = () => serveur.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', arret);
  process.on('SIGINT', arret);
}
