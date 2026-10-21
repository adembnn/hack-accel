// Hook « Stop » : à chaque fin de réponse de Claude, avant qu'il puisse conclure.
// 1) Si du code a changé et n'est pas vérifié : lance node tools/verif.mjs. Rouge → code 2 (Claude doit corriger),
//    ligne « VerifRouge » dans le journal (l'état du build l'affiche). Vert → ligne « VerifVerte ».
// 2) Preuve : une réponse qui annonce « fini », « ça marche », « testé »… sans bloc de sortie de commande est renvoyée (code 2).
//    Finir la phrase par « ? » ne contourne pas la règle (faille de l'ancien preuve.py).
// 3) Un .env indexé pour commit → code 2.
// Une seule relance : si stop_hook_active est vrai, on laisse passer (pas de boucle infinie).
import { execSync } from 'node:child_process';
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { hostname } from 'node:os';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
if (input.stop_hook_active) process.exit(0);

const run = (cmd) => execSync(cmd, { cwd: dir, stdio: 'pipe', encoding: 'utf8', shell: true });
const refus = (msg) => { process.stderr.write(msg + '\n'); process.exit(2); };

function journal(evt, cible) {
  try {
    const d = join(dir, 'journal'); mkdirSync(d, { recursive: true });
    let lot = 'main';
    try { lot = run('git branch --show-current').trim().replace(/^lot\//, '') || 'main'; } catch {}
    appendFileSync(join(d, `${new Date().toLocaleDateString('sv-SE')}-${hostname()}.jsonl`), JSON.stringify({ t: new Date().toISOString(), machine: hostname(), session: String(input.session_id || '').slice(0, 8), agent: 'principal', lot, evt, cible }) + '\n');
  } catch {}
}

function dernierMessage() {
  try {
    const lignes = readFileSync(input.transcript_path, 'utf8').trim().split('\n');
    for (let k = lignes.length - 1; k >= 0; k--) {
      const l = JSON.parse(lignes[k]);
      if (l.type === 'assistant' && l.message?.content) {
        const txt = l.message.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
        if (txt.trim()) return txt;
      }
    }
  } catch {}
  return '';
}

// 3) .env indexé
try {
  const indexes = run('git diff --cached --name-only').trim().split('\n').filter(Boolean);
  if (indexes.some((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'))) refus('Un fichier .env est indexé pour commit : retire-le (git restore --staged .env). Il contient des clés.');
} catch {}

// 1) vérification si du code a changé
let changements = [];
try { changements = run('git status --porcelain').trim().split('\n').filter(Boolean); } catch {}
const codeTouche = changements.some((l) => /\s(src\/|app\/|lib\/|tools\/|package\.json|tsconfig|vite\.config|next\.config|Containerfile|Dockerfile|compose)/.test(l));
if (codeTouche && existsSync(join(dir, 'tools', 'verif.mjs'))) {
  try {
    const sortie = run('node tools/verif.mjs');
    if (/❌/.test(sortie)) throw Object.assign(new Error('rouge'), { stdout: sortie });
    journal('VerifVerte', sortie.trim().split('\n').slice(-3).join(' · '));
  } catch (e) {
    const log = `${e.stdout || ''}\n${e.stderr || ''}`.trim().split('\n').slice(-25).join('\n');
    journal('VerifRouge', log);
    refus(`La vérification est rouge : corrige avant de conclure, puis relance node tools/verif.mjs et colle sa sortie.\n${log}`);
  }
}

// 2) preuve
const msg = dernierMessage();
const pretend = /(?<!pas |non |n'est pas |jamais )\b(c'est fini|fini[es]?\b|termin[ée]s?\b|ça marche|ça fonctionne|test[ée]s?\b|vérifi[ée]s?\b|tout passe|est en place)/i;
const aPreuve = /```[\s\S]{20,}```/.test(msg) || /\b(sortie|output)\s*:/i.test(msg) && /\n\s{2,}\S/.test(msg);
if (msg && pretend.test(msg) && !aPreuve) {
  refus('Tu annonces un résultat (« fini », « ça marche », « testé »…) sans coller la sortie de la commande qui le prouve. Relance la commande de vérification et colle sa sortie dans un bloc ``` ; sinon écris « non vérifié ».');
}
process.exit(0);
