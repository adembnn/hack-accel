// Hook « PreToolUse » (Bash, PowerShell, Edit, Write, MultiEdit, NotebookEdit, Agent) : bloque avant que ça arrive.
// 1) Commandes dangereuses : push forcé (sauf --force-with-lease), lecture ou commit de .env, rm -rf, git clean, --no-verify, hooksPath.
// 2) Tout via les tickets : modifier du code exige une branche lot/<nom> avec un ticket ouvert. Liste blanche inversée :
//    seuls les fichiers du harnais (.claude/, tools/, docs/, kickoff/, reports/, demo/, journal/, captures/, .github/, .githooks/, *.md à la racine)
//    sont libres ; tout le reste est du code. Vaut aussi pour le code écrit par Bash (>, >>, tee, cp, mv, sed -i, Set-Content, Out-File).
//    La branche est lue à la racine git du fichier touché (les sous-agents travaillent dans des worktrees).
// 3) Garde de lot : le ticket dit quels dossiers le lot peut toucher ; en dehors, refus.
// 4) Sous-agents : l'outil Agent doit nommer son modèle, sonnet ou haiku, jamais opus ni hérité.
// Cache 30 min du ticket trouvé dans journal/lot-<nom>.json ; un ticket absent n'est jamais mis en cache. GitHub injoignable → on laisse passer en prévenant.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const outil = input.tool_name || '';
const i = input.tool_input || {};
const refus = (msg) => { process.stderr.write(`Bloqué par le garde-fou : ${msg}\n`); process.exit(2); };
const git = (args, cwd = dir) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
const gh = (args) => execFileSync('gh', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();

const LIBRE = /^(\.claude|tools|docs|kickoff|reports|demo|journal|captures|\.github|\.githooks)\/|^[^/]+\.md$|^(\.gitignore|\.gitattributes|\.env\.example|lots\.json|LICENSE)$/;
const estCode = (chemin) => !LIBRE.test(chemin);

// 4) sous-agents
if (outil === 'Agent') {
  const m = String(i.model || '').toLowerCase();
  if (!m) refus('un sous-agent doit nommer son modèle : ajoute model: "sonnet" (ou "haiku" pour le mécanique). Jamais d’héritage.');
  if (/opus|fable/.test(m)) refus('pas d’Opus en sous-agent : seule la session principale est en Opus. Mets model: "sonnet".');
  process.exit(0);
}

// 1) commandes
if (/^(Bash|PowerShell)$/.test(outil)) {
  const cmd = String(i.command || '');
  // On ne regarde que les positions de commande (début, ou après ; & |), pas le texte cité.
  const segments = cmd.split(/(?:^|[;&|]+)\s*/).map((s) => s.trim()).filter(Boolean);
  const regles = [
    [/^git\s+push\b.*\s(--force(?!-with-lease)|-f)(\s|$)/, 'push forcé interdit : il écrase le travail d’un coéquipier (--force-with-lease reste permis).'],
    [/^git\s+push\b.*\s\+\S/, 'push forcé (+ref) interdit.'],
    [/^git\s+push\b.*--delete\s+\S*main/, 'suppression de main interdite.'],
    [/^git\s+(commit|push)\b.*--no-verify/, 'les crochets git ne se contournent pas (--no-verify).'],
    [/^git\s+config\b.*core\.hooksPath/, 'les crochets git ne se débranchent pas.'],
    [/^git\s+add\b.*(\s|\/)\.env(\.(?!example)[\w-]+)?(\s|$)/, 'le fichier .env contient les clés : il ne doit jamais être commité.'],
    [/^(cat|type|more|less|head|tail|grep|rg|sed|awk|Get-Content|gc|Select-String|findstr|strings|xxd|bat)\b.*(\s|\/)\.env(\.(?!example)[\w-]+)?(\s|$)/, 'lecture de .env bloquée : les clés ne doivent pas apparaître dans la conversation.'],
    [/^node\s+-e\b.*\.env(?!\.example)/, 'lecture de .env par script bloquée.'],
    [/^(echo|printf|cat)\b.*>>?\s*\.env(?!\.example)/, 'on n’écrit pas dans .env depuis le chat : l’humain le remplit dans son éditeur.'],
    [/^rm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(--\s+)?(\/|~|\.\/?\*?|\*)(\s|$)/, 'suppression massive bloquée.'],
    [/^Remove-Item\b.*-Recurse.*\s(\.|\*|\/|\.\\\*)(\s|$)/i, 'suppression massive bloquée.'],
    [/^git\s+clean\b.*-[a-zA-Z]*f/, 'git clean supprime des fichiers non sauvegardés : demande à l’humain.'],
    [/^git\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, 'ça jette toutes les modifications non commitées : demande à l’humain.'],
    [/^git\s+reset\s+--hard/, 'git reset --hard jette du travail : demande à l’humain.'],
  ];
  for (const seg of segments) for (const [re, msg] of regles) if (re.test(seg)) refus(msg);
  // code écrit par la commande ?
  // La cible doit suivre immédiatement l'opérateur (pas le texte d'un heredoc).
  const ecrit = cmd.match(/(?:>>?|\btee\b|\bcp\b|\bmv\b|\bsed\s+-i\S*|Set-Content|Out-File|Add-Content)\s+(?:-\w+\s+)*["']?([\w./\\-]+\.(?:ts|tsx|js|mjs|cjs|jsx|py|sql|json|ya?ml|toml|html|css|svelte|vue|prisma))\b/);
  if (ecrit) verifierCode(ecrit[1]);
  process.exit(0);
}

// 2) et 3) éditions
if (!/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(outil)) process.exit(0);
const brut = i.file_path || i.notebook_path || '';
if (!brut) process.exit(0);
verifierCode(String(brut));
process.exit(0);

function verifierCode(cheminBrut) {
  const abs = resolve(dir, cheminBrut);
  let base = dirname(abs);
  while (!existsSync(base) && dirname(base) !== base) base = dirname(base); // le dossier n'existe peut-être pas encore : on remonte
  let racine = dir;
  try { racine = git(['rev-parse', '--show-toplevel'], base); } catch { return; } // hors de tout dépôt git : pas notre affaire
  const chemin = relative(racine, abs).replace(/\\/g, '/');
  if (chemin.startsWith('..')) return;
  if (!estCode(chemin)) {
    if (/^(\.claude\/hooks|\.githooks)\/|^tools\/(verif|fusionner)\.mjs$/.test(chemin) && !/^(Adem|adembnn)$/i.test(prenom())) {
      refus(`${chemin} fait partie des verrous du harnais : on ne modifie pas sa propre vérification. Commente un ticket ou demande à Adem.`);
    }
    return;
  }
  let branche = '';
  try { branche = git(['branch', '--show-current'], racine); } catch {}
  if (!/^lot\//.test(branche)) refus(`tu modifies du code (${chemin}) sur la branche « ${branche || '?'} ». Tout passe par un ticket : prends un ticket GitHub (étiquette ready-for-agent), puis \`git switch -c lot/<nom-du-lot>\`, et mets l’étiquette in-progress.`);
  const nom = branche.slice(4);

  const cacheDir = join(dir, 'journal');
  const cache = join(cacheDir, `lot-${nom}.json`);
  let ticket = null;
  try { const c = JSON.parse(readFileSync(cache, 'utf8')); if (Date.now() - c.t < 30 * 60_000) ticket = c; } catch {}
  if (!ticket) {
    let liste;
    try { liste = JSON.parse(gh(['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,body,title'])); }
    catch (e) { process.stderr.write(`Garde-fou : GitHub injoignable (${String(e.message).split('\n')[0].slice(0, 80)}), je laisse passer sans vérifier le ticket.\n`); return; }
    const t = liste.find((x) => new RegExp(`lot/${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(x.body || ''));
    if (!t) refus(`aucun ticket ouvert ne contient \`lot/${nom}\`. Crée le ticket d’abord (modèle « Lot »), avec « **Lot** : \`lot/${nom}\` » dans son corps, étiquette ready-for-agent puis in-progress.`);
    const m = (t.body || '').match(/\*\*Dossiers\*\*\s*:\s*([^\n]+)/i);
    const dossiers = m ? [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].replace(/\/$/, '')).filter((d) => !/<|>/.test(d)) : [];
    ticket = { t: Date.now(), numero: t.number, dossiers };
    try { mkdirSync(cacheDir, { recursive: true }); writeFileSync(cache, JSON.stringify(ticket)); } catch {}
  }
  if (ticket.dossiers.length) {
    const ok = ticket.dossiers.some((d) => chemin === d || chemin.startsWith(d + '/'));
    if (!ok) refus(`le ticket #${ticket.numero} du lot « ${nom} » n’autorise que ${ticket.dossiers.map((d) => '`' + d + '/`').join(', ')} ; tu touches ${chemin}. Si c’est nécessaire, commente le ticket du lot concerné au lieu de modifier son code.`);
  }
}

function prenom() {
  try { return git(['config', 'user.name']); } catch { return ''; }
}
