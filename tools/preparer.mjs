// Prépare la machine d'un coéquipier, sans rien lui demander. Lancé par le hook de début de session (idempotent, rapide),
// ou à la main : node tools/preparer.mjs
// 1) crochets git du dépôt (.githooks) ; 2) .env créé depuis .env.example s'il manque ; 3) dépendances npm si package.json
// et pas de node_modules ; 4) vérifie gh (GitHub CLI) et git user.name, et dit quoi faire si ça manque. Jamais de valeur de .env affichée.
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd) => execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true }).trim();
const notes = [];

// 1) crochets git
try {
  if (run('git config core.hooksPath') !== '.githooks') { run('git config core.hooksPath .githooks'); notes.push('crochets git branchés (.githooks)'); }
} catch { try { run('git config core.hooksPath .githooks'); notes.push('crochets git branchés (.githooks)'); } catch {} }

// 2) .env
if (!existsSync(join(dir, '.env')) && existsSync(join(dir, '.env.example'))) {
  copyFileSync(join(dir, '.env.example'), join(dir, '.env'));
  notes.push('.env créé depuis .env.example : à remplir dans ton éditeur (jamais dans le chat)');
}

// 3) dépendances
if (existsSync(join(dir, 'package.json')) && !existsSync(join(dir, 'node_modules'))) {
  try { run('npm install --no-audit --no-fund --silent'); notes.push('dépendances npm installées'); }
  catch (e) { notes.push(`npm install a échoué : ${String(e.message).split('\n')[0].slice(0, 100)}`); }
}

// 4) identité et GitHub
try { if (!run('git config user.name')) notes.push('git ne connaît pas ton nom : git config --global user.name "Prénom" ; git config --global user.email "mail"'); }
catch { notes.push('git ne connaît pas ton nom : git config --global user.name "Prénom" ; git config --global user.email "mail"'); }
try { run('gh auth status'); } catch { notes.push('GitHub CLI non connecté : lance `gh auth login` (navigateur), sinon les tickets ne sont pas lus'); }
try { const v = Number(run('node -v').replace(/^v/, '').split('.')[0]); if (v < 20) notes.push(`Node ${v} trop ancien : il faut Node 20 ou plus`); } catch {}

if (notes.length) console.log('Préparation : ' + notes.join(' · '));
else console.log('Préparation : tout est en place.');
