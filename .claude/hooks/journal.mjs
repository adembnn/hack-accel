// Hook « journal » : une ligne par événement dans journal/<date>-<machine>.jsonl.
// Branché sur PostToolUse (tous les outils, sous-agents compris), SubagentStart, SubagentStop et Stop.
// Il ne bloque jamais (code 0) et ne lit jamais .env en entier (seule la ligne PRENOM).
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { hostname } from 'node:os';
import { execSync } from 'node:child_process';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}

const evt = input.hook_event_name || 'Inconnu';
const now = new Date();
const jdir = join(dir, 'journal');
try { mkdirSync(jdir, { recursive: true }); } catch {}

const court = (s, n = 90) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function prenom() {
  try { const m = readFileSync(join(dir, '.env'), 'utf8').match(/^PRENOM=(.+)$/m); if (m) return m[1].trim(); } catch {}
  try { return execSync('git config user.name', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim(); } catch {}
  return 'inconnu';
}

// Lot = fichier .lot à la racine, sinon la branche git (lot/<nom> → <nom>).
function lot() {
  try { if (existsSync(join(dir, '.lot'))) return readFileSync(join(dir, '.lot'), 'utf8').trim(); } catch {}
  try { return execSync('git branch --show-current', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim().replace(/^lot\//, '') || 'main'; } catch { return '?'; }
}

// Nom lisible de la session = ses 60 premiers caractères de premier message, mis en cache dans journal/sessions.json.
function nomSession() {
  const id = String(input.session_id || '');
  const f = join(jdir, 'sessions.json');
  let cache = {};
  try { cache = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  if (cache[id]) return cache[id];
  let nom = '';
  try {
    const fd = openSync(input.transcript_path, 'r');
    const buf = Buffer.alloc(64 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
    for (const l of buf.toString('utf8', 0, n).split('\n')) {
      try {
        const o = JSON.parse(l);
        if (o.type !== 'user') continue;
        const c = o.message?.content;
        const txt = typeof c === 'string' ? c : (c || []).filter((x) => x.type === 'text').map((x) => x.text).join(' ');
        if (txt && !/^<(system-reminder|command-|local-command)/.test(txt.trim())) { nom = court(txt.replace(/^Background \(from the session[\s\S]*?\n\n/, ''), 60); break; }
      } catch {}
    }
  } catch {}
  if (!nom) return id.slice(0, 8);
  cache[id] = nom;
  try { writeFileSync(f, JSON.stringify(cache, null, 1)); } catch {}
  return nom;
}

// Chemin court : relatif au dépôt, sinon « scratchpad/<fichier> », sinon le nom du fichier.
function chemin(p) {
  if (!p) return '';
  const s = String(p).replace(/\\/g, '/');
  const r = relative(dir, s).replace(/\\/g, '/');
  if (r && !r.startsWith('..')) return r;
  if (/scratchpad/.test(s)) return 'scratchpad/' + basename(s);
  return basename(s);
}

function cible() {
  const t = input.tool_name || '';
  const i = input.tool_input || {};
  if (/^(Edit|Write|Read|NotebookEdit)$/.test(t)) return chemin(i.file_path || i.notebook_path);
  if (/^(Bash|PowerShell)$/.test(t)) return court(i.description || i.command);
  if (t === 'Agent') return court(i.description || i.prompt, 70);
  if (t === 'Skill') return i.skill;
  if (/^(Grep|Glob)$/.test(t)) return court(i.pattern, 60);
  if (/^(WebFetch|WebSearch)$/.test(t)) return court(i.url || i.query, 70);
  if (t === 'SendMessage') return `message → ${i.to}`;
  if (/^mcp__/.test(t)) return t.replace(/^mcp__[^_]+__/, '');
  return court(JSON.stringify(i), 70);
}

// Dernier message de Claude dans le transcript (point de fin de réponse).
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
  nomSession: nomSession(),
  agent: input.agent_id ? String(input.agent_id).slice(0, 8) : 'principal',
  lot: lot(),
  evt,
};
if (evt === 'PostToolUse') {
  ligne.outil = input.tool_name;
  ligne.cible = cible();
  // Lancement d'un sous-agent : on retient son nom (la mission) et son modèle, pour nommer ses lignes ensuite.
  if (input.tool_name === 'Agent') {
    const rep = typeof input.tool_response === 'string' ? input.tool_response : JSON.stringify(input.tool_response || '');
    const m = rep.match(/agentId:\s*([a-z0-9]+)/i);
    ligne.nomAgent = court(input.tool_input?.description || input.tool_input?.prompt, 70);
    ligne.modele = input.tool_input?.model || 'hérité';
    if (m) ligne.agentLance = m[1].slice(0, 8);
  }
}
if (evt === 'SubagentStart') ligne.cible = input.agent_type || 'sous-agent';
if (evt === 'SubagentStop') ligne.cible = court(input.last_assistant_message || '', 300);
if (evt === 'Stop') ligne.point = dernierMessage();

try { appendFileSync(join(jdir, `${now.toLocaleDateString('sv-SE')}-${hostname()}.jsonl`), JSON.stringify(ligne) + '\n'); } catch {}
process.exit(0);
