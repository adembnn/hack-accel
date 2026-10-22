// e2e socle : lance le vrai serveur (processus Node) sur un port libre et vérifie /sante et la page d'accueil.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

let serveur;
let base;

function portLibre() {
  return new Promise((ok) => {
    const s = createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => ok(port));
    });
  });
}

before(async () => {
  const port = await portLibre();
  base = `http://127.0.0.1:${port}`;
  serveur = spawn(process.execPath, ['src/app/serveur.mjs'], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'pipe',
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`${base}/sante`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('le serveur ne répond pas');
});

after(() => serveur?.kill());

test('GET /sante répond 200', async () => {
  const r = await fetch(`${base}/sante`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).statut, 'ok');
});

test('GET / sert la page Refuge (après npm run build)', async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Refuge/);
});
