// Hook « PreToolUse » (Bash, PowerShell, Edit, Write, MultiEdit, NotebookEdit) : bloque avant que ça arrive.
// 1) Commandes dangereuses : push forcé, lecture ou commit de .env, rm -rf, git clean.
// 2) Tout via les tickets : modifier du code (src/, app/, lib/, package.json…) exige d'être sur une branche lot/<nom>
//    qui a un ticket GitHub ouvert. Les fichiers du harnais (.claude/, tools/, docs/, kickoff/, demo/, *.md) restent libres.
// 3) Garde de lot : le ticket dit quels dossiers le lot a le droit de toucher ; en dehors, refus.
// Les lectures GitHub sont mises en cache 30 min dans journal/lot-<nom>.json. Si GitHub est injoignable, on laisse passer en prévenant.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const outil = input.tool_name || '';
const i = input.tool_input || {};
const refus = (msg) => { process.stderr.write(`Bloqué par le garde-fou : ${msg}\n`); process.exit(2); };
const run = (cmd) => execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true }).trim();

// 1) commandes
if (/^(Bash|PowerShell)$/.test(outil)) {
  const cmd = String(i.command || '');
  const regles = [
    [/git\s+push\s+.*(--force|-f\b)/, 'push forcé interdit : il écrase le travail d’un coéquipier.'],
    [/git\s+add\s+(\S+\s+)*\S*\.env(\.(?!example)[\w-]+)?(\s|$)/, 'le fichier .env contient les clés : il ne doit jamais être commité.'],
    [/(cat|type|Get-Content|gc|more|less|head|tail)\s+(\S+\s+)*\S*\.env(\.(?!example)[\w-]+)?(\s|$)/, 'lecture de .env bloquée : les clés ne doivent pas apparaître dans la conversation.'],
    [/rm\s+-rf?\s+(\/|~|\.|\*)(\s|$)/, 'suppression massive bloquée.'],
    [/Remove-Item\s+.*-Recurse.*\s(\.|\*|\/)(\s|$)/i, 'suppression massive bloquée.'],
    [/git\s+clean\s+-[a-z]*f/, 'git clean supprime des fichiers non sauvegardés : demande à l’humain.'],
    [/git\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, 'ça jette toutes les modifications non commitées : demande à l’humain.'],
  ];
  for (const [re, msg] of regles) if (re.test(cmd)) refus(msg);
  process.exit(0);
}

// 2) et 3) éditions de code
if (!/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(outil)) process.exit(0);
const brut = i.file_path || i.notebook_path || '';
if (!brut) process.exit(0);
const chemin = relative(dir, String(brut)).replace(/\\/g, '/');
if (chemin.startsWith('..')) process.exit(0); // hors dépôt : pas notre affaire
const estCode = /^(src|app|lib|packages|api|web|server|agents|prisma|migrations)\//.test(chemin) || /^(package\.json|package-lock\.json|tsconfig[^/]*\.json|Containerfile|Dockerfile|compose[^/]*\.ya?ml|vite\.config|next\.config|\.env\.example)/.test(chemin);
if (!estCode) process.exit(0);

let branche = '';
try { branche = run('git branch --show-current'); } catch {}
if (!/^lot\//.test(branche)) {
  refus(`tu modifies du code (${chemin}) sur la branche « ${branche || '?'} ». Tout passe par un ticket : prends un ticket GitHub (étiquette ready-for-agent), puis \`git switch -c lot/<nom-du-lot>\`, et mets l’étiquette in-progress.`);
}
const nom = branche.replace(/^lot\//, '');

// Ticket du lot, en cache 30 min.
const cacheDir = join(dir, 'journal');
const cache = join(cacheDir, `lot-${nom}.json`);
let ticket = null;
try { const c = JSON.parse(readFileSync(cache, 'utf8')); if (Date.now() - c.t < 30 * 60_000) ticket = c; } catch {}
if (!ticket) {
  try {
    const json = run(`gh issue list --state open --search "lot/${nom} in:body" --json number,body,title`);
    const liste = JSON.parse(json);
    ticket = { t: Date.now(), trouve: liste.length > 0, numero: liste[0]?.number, dossiers: [] };
    if (liste[0]) {
      const m = (liste[0].body || '').match(/\*\*Dossiers\*\*\s*:\s*([^\n]+)/i);
      if (m) ticket.dossiers = [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].replace(/\/$/, '')).filter((d) => !/^src\/<|<dossier>/.test(d));
    }
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cache, JSON.stringify(ticket));
  } catch (e) {
    process.stderr.write(`Garde-fou : GitHub injoignable (${String(e.message).split('\n')[0].slice(0, 80)}), je laisse passer sans vérifier le ticket.\n`);
    process.exit(0);
  }
}
if (!ticket.trouve) refus(`aucun ticket ouvert ne mentionne \`lot/${nom}\`. Crée le ticket d’abord (modèle « Lot » sur GitHub), avec « **Lot** : \`lot/${nom}\` » dans son corps.`);

// 3) garde de lot : dossiers autorisés
if (ticket.dossiers.length && /^(src|app|lib|packages|api|web|server|agents)\//.test(chemin)) {
  const ok = ticket.dossiers.some((d) => chemin === d || chemin.startsWith(d + '/'));
  if (!ok) refus(`le ticket #${ticket.numero} du lot « ${nom} » n’autorise que ${ticket.dossiers.map((d) => '`' + d + '/`').join(', ')} ; tu touches ${chemin}. Si c’est nécessaire, commente le ticket du lot concerné au lieu de modifier son code.`);
}
process.exit(0);
