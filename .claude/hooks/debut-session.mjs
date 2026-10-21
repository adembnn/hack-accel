// Hook « SessionStart » : situe l'agent sans compte à rebours. Branche et lot, état git, tickets prêts,
// tickets en cours (et à qui), nouveaux commentaires sur les tickets depuis la dernière session de cette machine.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd) => execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true }).trim();
const lignes = [];

let branche = '?', modifs = 0;
try { branche = run('git branch --show-current'); modifs = run('git status --porcelain').split('\n').filter(Boolean).length; } catch {}
try { run('git fetch -q'); } catch {}
lignes.push(`Branche : ${branche}${/^lot\//.test(branche) ? ` (lot « ${branche.slice(4)} »)` : ' — pas sur un lot : prends un ticket avant de toucher au code'} · ${modifs} fichier(s) modifié(s) non commité(s).`);

const jdir = join(dir, 'journal');
mkdirSync(jdir, { recursive: true });
const marque = join(jdir, 'derniere-session.txt');
let depuis = null;
try { depuis = readFileSync(marque, 'utf8').trim(); } catch {}
try { writeFileSync(marque, new Date().toISOString()); } catch {}

try {
  const prets = JSON.parse(run('gh issue list --state open --label ready-for-agent --json number,title --limit 20'));
  const enCours = JSON.parse(run('gh issue list --state open --label in-progress --json number,title,assignees --limit 20'));
  const bloques = JSON.parse(run('gh issue list --state open --label bloque --json number,title --limit 20'));
  lignes.push(`Tickets prêts (frontière) : ${prets.length ? prets.map((t) => `#${t.number} ${t.title}`).join(' · ') : 'aucun'}.`);
  lignes.push(`En cours : ${enCours.length ? enCours.map((t) => `#${t.number} ${t.title} (${t.assignees.map((a) => a.login).join(', ') || 'personne'})`).join(' · ') : 'aucun'}.`);
  if (bloques.length) lignes.push(`Bloqués, attendent un humain : ${bloques.map((t) => `#${t.number} ${t.title}`).join(' · ')}.`);
  if (depuis) {
    const recents = [];
    for (const t of [...prets, ...enCours, ...bloques]) {
      try {
        const cs = JSON.parse(run(`gh issue view ${t.number} --json comments -q .comments`)).filter((c) => c.createdAt > depuis);
        for (const c of cs.slice(-2)) recents.push(`#${t.number} ${c.author?.login || '?'} : ${String(c.body).replace(/\s+/g, ' ').slice(0, 140)}`);
      } catch {}
    }
    if (recents.length) lignes.push(`Nouveaux commentaires depuis ta dernière session :\n  - ${recents.join('\n  - ')}`);
  }
} catch (e) {
  lignes.push(`GitHub injoignable (${String(e.message).split('\n')[0].slice(0, 80)}) : pas de liste de tickets.`);
}
lignes.push('Règles : un lot = un ticket = une branche lot/<nom> ; « fini » = la commande de vérification passe, sortie collée ; un besoin sur un autre lot = un commentaire sur son ticket, jamais une modification de son code.');
console.log(lignes.join('\n'));
