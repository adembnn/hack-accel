// Hook « journal » : une ligne par événement dans journal/<date>-<machine>.jsonl.
// Branché sur PostToolUse (tous les outils, sous-agents compris), SubagentStart, SubagentStop et Stop.
// Il ne bloque jamais (code 0) et ne lit jamais .env.
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { hostname } from 'node:os';
import { execSync } from 'node:child_process';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}

const evt = input.hook_event_name || 'Inconnu';
const now = new Date();

// Prénom : variable PRENOM du .env (lue sans afficher le reste), sinon git user.name.
function prenom() {
  try {
    const env = readFileSync(join(dir, '.env'), 'utf8');
    const m = env.match(/^PRENOM=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  try { return execSync('git config user.name', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim(); } catch {}
  return 'inconnu';
}

// Lot = fichier .lot à la racine, sinon la branche git (lot/<nom> → <nom>).
function lot() {
  try { if (existsSync(join(dir, '.lot'))) return readFileSync(join(dir, '.lot'), 'utf8').trim(); } catch {}
  try {
    const b = execSync('git branch --show-current', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
    return b.replace(/^lot\//, '') || 'main';
  } catch { return '?'; }
}

const court = (s, n = 90) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const rel = (p) => { try { return relative(dir, String(p)).replace(/\\/g, '/'); } catch { return String(p); } };

// Décrit l'action en une ligne lisible selon l'outil.
function cible() {
  const t = input.tool_name || '';
  const i = input.tool_input || {};
  if (/^(Edit|Write|Read|NotebookEdit)$/.test(t)) return rel(i.file_path || i.notebook_path);
  if (/^(Bash|PowerShell)$/.test(t)) return court(i.description || i.command);
  if (t === 'Agent') return `${i.model || 'modèle hérité'} · ${court(i.description || i.prompt, 70)}`;
  if (t === 'Skill') return i.skill;
  if (/^(Grep|Glob)$/.test(t)) return court(i.pattern, 60);
  if (/^(WebFetch|WebSearch)$/.test(t)) return court(i.url || i.query, 70);
  if (t === 'SendMessage') return `→ ${i.to}`;
  return court(JSON.stringify(i), 70);
}

// Dernier message de Claude dans le transcript (pour le point de fin de réponse).
function dernierMessage() {
  try {
    const lignes = readFileSync(input.transcript_path, 'utf8').trim().split('\n');
    for (let k = lignes.length - 1; k >= 0; k--) {
      const l = JSON.parse(lignes[k]);
      if (l.type === 'assistant' && l.message?.content) {
        const txt = l.message.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
        if (txt.trim()) return court(txt, 400);
      }
    }
  } catch {}
  return '';
}

const ligne = {
  t: now.toISOString(),
  machine: hostname(),
  qui: prenom(),
  session: String(input.session_id || '').slice(0, 8),
  agent: input.agent_id ? `${input.agent_type || 'agent'}:${String(input.agent_id).slice(0, 6)}` : 'principal',
  lot: lot(),
  evt,
};
if (evt === 'PostToolUse') { ligne.outil = input.tool_name; ligne.cible = cible(); }
if (evt === 'SubagentStart') ligne.cible = input.agent_type || 'sous-agent';
if (evt === 'SubagentStop') ligne.cible = court(input.last_assistant_message || input.agent_type, 300);
if (evt === 'Stop') ligne.point = dernierMessage();

try {
  const d = join(dir, 'journal');
  mkdirSync(d, { recursive: true });
  const f = join(d, `${now.toLocaleDateString('sv-SE')}-${hostname()}.jsonl`);
  appendFileSync(f, JSON.stringify(ligne) + '\n');
} catch {}
process.exit(0);
