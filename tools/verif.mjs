// Vérification du projet. Lance, dans l'ordre, les scripts npm qui existent parmi lint, typecheck, test, build
// (ou le seul script « verifier » s'il existe), puis les commandes propres au lot déclarées dans son ticket
// (ligne **Vérification**, lues par tools/lot.mjs avec cache). Code 1 si l'une échoue.
// Sans package.json : « pas encore de projet », code 0. Avec un package.json sans aucun script : code 1 (une vérification vide n'est pas verte).
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { trouverTicket } from './lot.mjs';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pkgPath = join(dir, 'package.json');
if (!existsSync(pkgPath)) { console.log('Pas de package.json : pas encore de projet à vérifier.'); process.exit(0); }
const scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts || {};
const etapes = scripts.verifier ? [['verifier', 'npm run verifier --silent']] : ['lint', 'typecheck', 'test', 'build'].filter((s) => scripts[s]).map((s) => [s, `npm run ${s} --silent`]);
if (!etapes.length) { console.log('❌ package.json sans script lint/typecheck/test/build/verifier : une vérification vide n’est pas verte. Ajoute au moins un script.'); process.exit(1); }

try {
  const branche = execFileSync('git', ['branch', '--show-current'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
  if (/^lot\//.test(branche)) {
    const ticket = trouverTicket(branche.slice(4), dir);
    for (const [k, cmd] of (ticket?.verification || []).entries()) etapes.push([`lot ${branche.slice(4)}${k ? ' ' + (k + 1) : ''}`, cmd]);
  }
} catch {}

let ok = true;
for (const [nom, cmd] of etapes) {
  const debut = Date.now();
  try {
    execSync(cmd, { cwd: dir, stdio: 'pipe', encoding: 'utf8', shell: true, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
    console.log(`✅ ${nom} (${((Date.now() - debut) / 1000).toFixed(1)} s)`);
  } catch (e) {
    ok = false;
    const log = `${e.stdout || ''}\n${e.stderr || ''}`.trim().split('\n').slice(-25).join('\n');
    console.log(`❌ ${nom} a échoué :\n${log}`);
    break;
  }
}
process.exit(ok ? 0 : 1);
