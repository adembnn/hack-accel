// Fusionne le lot courant (branche lot/<nom>) dans main, seulement si la vérification est verte.
// Usage, depuis la branche du lot, arbre propre : node tools/fusionner.mjs
// Étapes : main à jour fusionné dans le lot (les conflits se règlent ici, pas sur main) → vérification → bascule sur main →
// fusion --no-ff → push → ticket du lot : étiquette done, fermeture avec un commentaire → retour sur le lot.
import { execSync } from 'node:child_process';

const dir = process.cwd();
const run = (cmd, opts = {}) => execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true, ...opts }).trim();
const stop = (msg) => { console.error(`Fusion refusée : ${msg}`); process.exit(1); };

const branche = run('git branch --show-current');
if (!/^lot\//.test(branche)) stop(`tu es sur « ${branche} », pas sur une branche lot/<nom>.`);
const nom = branche.slice(4);
if (run('git status --porcelain')) stop('des fichiers ne sont pas commités. Commite d’abord (un commit par lot terminé).');

run('git fetch -q origin');
try { run('git merge --no-edit origin/main'); }
catch (e) { stop(`conflit en fusionnant main dans ${branche}. Règle-le ici, commite, relance.\n${String(e.stdout || '').split('\n').slice(-10).join('\n')}`); }

let verif = '';
try { verif = run('node tools/verif.mjs'); if (/❌/.test(verif)) throw Object.assign(new Error('rouge'), { stdout: verif }); console.log(verif); }
catch (e) { stop(`vérification rouge sur ${branche}.\n${String(e.stdout || e.message).split('\n').slice(-15).join('\n')}`); }

run('git switch -q main');
run('git pull -q --ff-only origin main');
try { run(`git merge --no-ff --no-edit -m "Fusion du lot ${nom}" ${branche}`); }
catch (e) { run('git merge --abort'); run(`git switch -q ${branche}`); stop(`conflit inattendu en fusionnant dans main.\n${String(e.stdout || '').split('\n').slice(-10).join('\n')}`); }
run('git push -q origin main');
console.log(`✅ Lot « ${nom} » fusionné dans main et poussé.`);

try {
  const n = run(`gh issue list --state open --search "lot/${nom} in:body" --json number -q ".[0].number"`);
  if (n) {
    run(`gh issue edit ${n} --add-label done --remove-label in-progress`);
    run(`gh issue close ${n} --comment "Fusionné dans main par tools/fusionner.mjs. Vérification :\n\`\`\`\n${verif.replace(/"/g, "'").slice(0, 600)}\n\`\`\`"`);
    console.log(`Ticket #${n} fermé avec l’étiquette done.`);
  } else console.log(`Aucun ticket ouvert ne mentionne lot/${nom} : rien fermé.`);
} catch (e) { console.log(`Ticket non mis à jour (${String(e.message).split('\n')[0].slice(0, 80)}) : fais-le à la main.`); }
run(`git switch -q ${branche}`);
