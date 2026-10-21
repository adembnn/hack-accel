// Joue le parcours de démo (demo/parcours.json) dans un navigateur automatique (Playwright) et dépose
// une capture par étape dans captures/, plus captures/rapport.json (erreurs console, durée par étape).
// Usage : node tools/capture.mjs            (URL de demo/parcours.json)
//         node tools/capture.mjs --url http://localhost:3000 --demo   (--demo ajoute ?demo=1 : graine fixe, IA en cache)
// Sans Playwright : explique quoi installer, ne plante pas. Les agents (testeur-parcours, jury-simule) regardent ensuite les images.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.cwd();
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
let parcours;
try { parcours = JSON.parse(readFileSync(join(dir, 'demo', 'parcours.json'), 'utf8')); }
catch { console.log('demo/parcours.json manquant ou invalide : écris le parcours (modèle fourni) avant de capturer.'); process.exit(0); }
if (!parcours.etapes?.length) { console.log('demo/parcours.json n’a aucune étape : remplis-le à partir de demo/SCRIPT.md.'); process.exit(0); }

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('Playwright absent. Installe-le une fois : npm i -D playwright && npx playwright install chromium'); process.exit(0); }

const base = (opt('--url') || parcours.url || 'http://localhost:3000').replace(/\/$/, '');
const demo = args.includes('--demo') ? '?demo=1' : '';
const out = join(dir, 'captures');
mkdirSync(out, { recursive: true });
const rapport = { base, debut: new Date().toISOString(), etapes: [], erreurs: [] };

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') rapport.erreurs.push({ etape: rapport.etapes.length, texte: m.text().slice(0, 300) }); });
page.on('pageerror', (e) => rapport.erreurs.push({ etape: rapport.etapes.length, texte: String(e.message).slice(0, 300) }));

for (const [k, e] of parcours.etapes.entries()) {
  const n = e.n ?? k + 1;
  const debut = Date.now();
  const r = { n, nom: e.nom, ok: true };
  try {
    for (const a of e.actions || []) {
      if (a.goto) await page.goto(base + a.goto + demo, { waitUntil: 'networkidle', timeout: a.timeout || 20000 });
      if (a.click) await page.click(a.click, { timeout: a.timeout || 10000 });
      if (a.fill) await page.fill(a.fill.selector, a.fill.texte, { timeout: a.timeout || 10000 });
      if (a.attendre) await page.waitForSelector(a.attendre, { timeout: a.timeout || 30000 });
      if (a.pause) await page.waitForTimeout(a.pause);
      if (a.api) { const rep = await page.request.fetch(base + a.api); r.api = { statut: rep.status(), corps: (await rep.text()).slice(0, 200) }; }
    }
    const fichier = join(out, `${String(n).padStart(2, '0')}-${(e.nom || 'etape').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
    await page.screenshot({ path: fichier, fullPage: false });
    r.capture = fichier;
  } catch (err) { r.ok = false; r.erreur = String(err.message).split('\n')[0].slice(0, 200); }
  r.ms = Date.now() - debut;
  rapport.etapes.push(r);
  console.log(`${r.ok ? '✅' : '❌'} étape ${n} ${e.nom || ''} (${r.ms} ms)${r.erreur ? ' : ' + r.erreur : ''}`);
}
await navigateur.close();
rapport.fin = new Date().toISOString();
writeFileSync(join(out, 'rapport.json'), JSON.stringify(rapport, null, 1));
console.log(`${rapport.erreurs.length} erreur(s) console · rapport : captures/rapport.json`);
process.exit(rapport.etapes.every((e) => e.ok) && !rapport.erreurs.length ? 0 : 1);
