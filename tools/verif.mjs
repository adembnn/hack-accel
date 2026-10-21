// Vérification du projet : lance, dans l'ordre, les scripts npm qui existent parmi lint, typecheck, test, build
// (ou un seul script « verifier » s'il existe). Sortie courte. Code 1 si l'un échoue.
// Sans package.json : dit qu'il n'y a pas encore de projet et sort en 0.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pkgPath = join(dir, 'package.json');
if (!existsSync(pkgPath)) { console.log('Pas de package.json : pas encore de projet à vérifier.'); process.exit(0); }
const scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts || {};
const etapes = scripts.verifier ? ['verifier'] : ['lint', 'typecheck', 'test', 'build'].filter((s) => scripts[s]);
if (!etapes.length) { console.log('Aucun script lint/typecheck/test/build/verifier dans package.json : rien à vérifier.'); process.exit(0); }

let ok = true;
for (const s of etapes) {
  const debut = Date.now();
  try {
    execSync(`npm run ${s} --silent`, { cwd: dir, stdio: 'pipe', encoding: 'utf8', shell: true, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
    console.log(`✅ ${s} (${((Date.now() - debut) / 1000).toFixed(1)} s)`);
  } catch (e) {
    ok = false;
    const log = `${e.stdout || ''}\n${e.stderr || ''}`.trim().split('\n').slice(-25).join('\n');
    console.log(`❌ ${s} a échoué :\n${log}`);
    break; // inutile de continuer : on corrige d'abord
  }
}
process.exit(ok ? 0 : 1);
