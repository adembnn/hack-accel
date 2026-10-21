// Hook « SessionStart » : situe l'agent, sans compte à rebours. Un seul appel GitHub.
// Branche et lot, état git, frontière (tickets prêts dont les bloquants sont fermés), tickets en cours et à qui,
// tickets bloqués, nouveaux commentaires depuis la dernière session de cette machine.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const git = (args, timeout = 8000) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout }).trim();
const lignes = [];

let branche = '?', modifs = 0;
try { branche = git(['branch', '--show-current']); modifs = git(['status', '--porcelain']).split('\n').filter(Boolean).length; } catch {}
try { git(['fetch', '-q'], 6000); } catch {}
lignes.push(`Branche : ${branche}${/^lot\//.test(branche) ? ` (lot « ${branche.slice(4)} »)` : ' ; pas sur un lot : prends un ticket avant de toucher au code'} · ${modifs} fichier(s) modifié(s) non commité(s).`);
console.log(lignes.join('\n')); lignes.length = 0; // affiché tout de suite : si GitHub traîne, au moins ça sort

const jdir = join(dir, 'journal');
try { mkdirSync(jdir, { recursive: true }); } catch {}
const marque = join(jdir, 'derniere-session.txt');
let depuis = null;
try { depuis = readFileSync(marque, 'utf8').trim(); } catch {}
try { writeFileSync(marque, new Date().toISOString()); } catch {}

try {
  const tous = JSON.parse(execFileSync('gh', ['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,labels,assignees,body,comments'], { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 40000 }));
  const ouverts = new Set(tous.map((t) => t.number));
  const etiq = (t) => t.labels.map((l) => l.name);
  const bloquePar = (t) => [...((t.body || '').split(/##\s*Bloqu[ée] par/i)[1] || '').matchAll(/#(\d+)/g)].map((m) => Number(m[1])).filter((n) => ouverts.has(n));
  const qui = (t) => t.assignees.map((a) => a.login).join(', ') || 'personne';
  const prets = tous.filter((t) => etiq(t).includes('ready-for-agent') && !etiq(t).includes('in-progress') && !bloquePar(t).length);
  const attendent = tous.filter((t) => etiq(t).includes('ready-for-agent') && bloquePar(t).length);
  const enCours = tous.filter((t) => etiq(t).includes('in-progress'));
  const bloques = tous.filter((t) => etiq(t).includes('bloque'));
  lignes.push(`Frontière (prêts, rien ne les bloque) : ${prets.length ? prets.map((t) => `#${t.number} ${t.title}`).join(' · ') : 'aucun'}.`);
  if (attendent.length) lignes.push(`En attente d’un autre lot : ${attendent.map((t) => `#${t.number} (attend ${bloquePar(t).map((n) => '#' + n).join(', ')})`).join(' · ')}.`);
  lignes.push(`En cours : ${enCours.length ? enCours.map((t) => `#${t.number} ${t.title} (${qui(t)})`).join(' · ') : 'aucun'}.`);
  if (bloques.length) lignes.push(`Bloqués, attendent un humain : ${bloques.map((t) => `#${t.number} ${t.title}`).join(' · ')}.`);
  if (depuis) {
    const recents = [];
    for (const t of tous) for (const c of (t.comments || []).filter((c) => c.createdAt > depuis).slice(-2)) recents.push(`#${t.number} ${c.author?.login || '?'} : ${String(c.body).replace(/\s+/g, ' ').slice(0, 140)}`);
    if (recents.length) lignes.push(`Nouveaux commentaires depuis ta dernière session :\n  - ${recents.join('\n  - ')}`);
  }
} catch (e) {
  lignes.push(`GitHub injoignable (${String(e.message).split('\n')[0].slice(0, 80)}) : pas de liste de tickets. \`gh auth login\` si besoin.`);
}
lignes.push('Règles : un lot = un ticket = une branche lot/<nom> ; « fini » = la commande de vérification passe, sortie collée ; un besoin sur un autre lot = un commentaire sur son ticket, jamais une modification de son code. Sous-agents en Sonnet, toujours avec model nommé.');
console.log(lignes.join('\n'));
