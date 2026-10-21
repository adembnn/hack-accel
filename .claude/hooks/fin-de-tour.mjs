// Hook « Stop » : à chaque fin de réponse de Claude, avant qu'il puisse conclure.
// 1) .env indexé pour commit → code 2 (toujours, même en relance).
// 2) Si du code a changé (arbre sale, ou commits depuis origin/main dans les 10 dernières minutes) : node tools/verif.mjs.
//    Rouge → code 2 à la première relance ; à la seconde (stop_hook_active) on laisse passer mais le rouge est dans le journal
//    et commenté sur le ticket, donc visible dans l'état du build. Vert → ligne « VerifVerte ».
// 3) Preuve : une réponse qui affirme un résultat (« c'est fini », « ça marche », « est testé »…) sans bloc ``` est renvoyée,
//    sauf si elle contient « non vérifié ». Pas de relance infinie : ignorée quand stop_hook_active.
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, appendFileSync, mkdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { hostname } from 'node:os';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const relance = Boolean(input.stop_hook_active);

const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
const refus = (msg) => { process.stderr.write(msg + '\n'); process.exit(2); };
const branche = (() => { try { return git(['branch', '--show-current']); } catch { return ''; } })();
const lot = branche.replace(/^lot\//, '') || 'main';

function journal(evt, cible) {
  try {
    const d = join(dir, 'journal'); mkdirSync(d, { recursive: true });
    appendFileSync(join(d, `${new Date().toLocaleDateString('sv-SE')}-${hostname()}.jsonl`), JSON.stringify({ t: new Date().toISOString(), machine: hostname(), session: String(input.session_id || '').slice(0, 8), agent: 'principal', lot, evt, cible }) + '\n');
  } catch {}
}

// Commentaire sur le ticket du lot, sans shell (corps multi-ligne sûr sur Windows et Unix).
function commenterTicket(texte) {
  try {
    if (!/^lot\//.test(branche)) return;
    const liste = JSON.parse(execFileSync('gh', ['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,body'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' }));
    const t = liste.find((x) => (x.body || '').includes(`lot/${lot}`));
    if (t) execFileSync('gh', ['issue', 'comment', String(t.number), '--body-file', '-'], { cwd: dir, input: texte, stdio: 'pipe' });
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

// 1) .env indexé
try {
  const indexes = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  if (indexes.some((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'))) refus('Un fichier .env est indexé pour commit : retire-le (git restore --staged .env). Il contient des clés.');
} catch {}

// 2) vérification
const CODE = /^(?!(\.claude|tools|docs|kickoff|reports|demo|journal|captures|\.github|\.githooks)\/)(?![^/]+\.md$)/;
let touches = [];
try { touches = git(['status', '--porcelain']).split('\n').filter(Boolean).map((l) => l.slice(3).trim()); } catch {}
if (!touches.length) {
  try {
    const dernier = Number(git(['log', '-1', '--format=%ct'])) * 1000;
    if (Date.now() - dernier < 10 * 60_000) touches = git(['diff', '--name-only', 'origin/main...HEAD']).split('\n').filter(Boolean);
  } catch {}
}
const codeTouche = touches.some((f) => CODE.test(f));
const marqueRouge = join(dir, 'journal', '.rouge');
if (codeTouche && existsSync(join(dir, 'tools', 'verif.mjs'))) {
  let sortie = '', rouge = false;
  try { sortie = execSync('node tools/verif.mjs', { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true }); rouge = /❌/.test(sortie); }
  catch (e) { sortie = `${e.stdout || ''}\n${e.stderr || ''}`; rouge = true; }
  const log = sortie.trim().split('\n').slice(-25).join('\n');
  if (rouge) {
    journal('VerifRouge', log);
    if (!existsSync(marqueRouge)) { commenterTicket(`🔴 vérification rouge (hook de fin de réponse) :\n\`\`\`\n${log.slice(-600)}\n\`\`\``); try { writeFileSync(marqueRouge, new Date().toISOString()); } catch {} }
    if (!relance) refus(`La vérification est rouge : corrige avant de conclure, puis relance node tools/verif.mjs et colle sa sortie.\n${log}`);
    process.stderr.write(`Toujours rouge après relance : dis-le à l’humain. Le rouge est dans l’état du build.\n${log}\n`);
  } else {
    journal('VerifVerte', log.split('\n').slice(-3).join(' · '));
    if (existsSync(marqueRouge)) { commenterTicket('🟢 vérification verte à nouveau (hook de fin de réponse).'); try { unlinkSync(marqueRouge); } catch {} }
  }
}

// 3) preuve
if (!relance) {
  const msg = dernierMessage();
  const sansCitations = msg.replace(/«[^»]*»/g, '').replace(/^>.*$/gm, '').replace(/```[\s\S]*?```/g, '');
  const affirme = /(?<![\p{L}'’])(c['’]est|est|sont|tout est|c['’]est bon,? )\s*(fini|finie|finis|terminé|terminée|terminés|testé|testée|testés|vérifié|vérifiée|vérifiés|en place|réglé|corrigé|déployé|fusionné|bon)(?![\p{L}])|(?<![\p{L}])(ça|cela|tout)\s+(marche|fonctionne|passe)(?![\p{L}])|(?<![\p{L}])(tests?|build|vérification|lint|typecheck)\s+(est|sont)\s+(verte?|vert|OK|bon)(?![\p{L}])|(?<![\p{L}])(tests?|build|vérification)\s+(passent|passe)(?![\p{L}])/iu;
  const nie = /(?<![\p{L}])(pas|non|jamais|ne|n['’])\s+[^.]{0,20}(fini|terminé|testé|vérifié|marche|fonctionne|passe)/iu;
  const aPreuve = /```[\s\S]{15,}```/.test(msg) || /non vérifié/i.test(msg);
  if (msg && affirme.test(sansCitations) && !nie.test(sansCitations) && !aPreuve) {
    refus('Tu affirmes un résultat (« c’est fini », « ça marche », « est testé »…) sans coller la sortie de la commande qui le prouve. Relance la commande de vérification et colle sa sortie dans un bloc ``` ; sinon écris « non vérifié ».');
  }
}
process.exit(0);
