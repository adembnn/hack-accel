// Serveur Node de production : sert dist/ et répond sur /sante. Lit PORT (Aiven Runtime), 8080 par défaut.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.map': 'application/json',
};
const dist = resolve(fileURLToPath(new URL('../../dist', import.meta.url)));

export function creerServeur() {
  return createServer(async (req, res) => {
    let chemin;
    try {
      chemin = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (chemin === '/sante') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ statut: 'ok', service: 'refuge' }));
      return;
    }
    const fichier = join(dist, normalize(chemin === '/' ? '/index.html' : chemin));
    if (fichier !== dist && !fichier.startsWith(dist + sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const corps = await readFile(fichier);
      res.writeHead(200, { 'content-type': TYPES[extname(fichier)] ?? 'application/octet-stream' });
      res.end(corps);
    } catch {
      try {
        const index = await readFile(join(dist, 'index.html'));
        res.writeHead(200, { 'content-type': TYPES['.html'] });
        res.end(index);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('introuvable');
      }
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  creerServeur().listen(port, '0.0.0.0', () => console.log(`Refuge écoute sur le port ${port}`));
}
