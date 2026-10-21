// Fusionne le lot courant (branche lot/<nom>) dans main, seulement si tout est vert.
// Usage, depuis la branche du lot, arbre propre : node tools/fusionner.mjs
// Contrôles : ticket du lot trouvé, ses bloquants fermés, fichiers touchés dans les Dossiers du ticket, main à jour fusionné
// dans le lot (les conflits se règlent ici), vérification verte. Puis fusion --no-ff dans main, push (avec rattrapage si
// quelqu'un a poussé entre-temps), ticket : étiquette done + fermeture avec la sortie de vérification. Retour sur le lot.
import { execFileSync, execSync } from 'node:child_process';

const dir = process.cwd();
const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
const gh = (args, input) => execFileSync('gh', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe', input }).trim();
const stop = (msg) => { console.error(`Fusion refusée : ${msg}`); process.exit(1); };

const branche = git(['branch', '--show-current']);
if (!/^lot\//.test(branche)) stop(`tu es sur « ${branche} », pas sur une branche lot/<nom>.`);
const nom = branche.slice(4);
if (git(['status', '--porcelain'])) stop('des fichiers ne sont pas commités. Commite d’abord (un commit par lot terminé).');

// ticket du lot
let ticket = null, ouverts = [];
try {
  const liste = JSON.parse(gh(['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,body,title']));
  ouverts = liste.map((t) => t.number);
  ticket = liste.find((t) => (t.body || '').includes(`lot/${nom}`)) || null;
} catch (e) { console.log(`GitHub injoignable (${String(e.message).split('\n')[0].slice(0, 80)}) : fusion sans contrôle de ticket.`); }
if (ticket) {
  const bloqueurs = [...((ticket.body || '').split(/##\s*Bloqu[ée] par/i)[1] || '').matchAll(/#(\d+)/g)].map((m) => Number(m[1])).filter((n) => ouverts.includes(n));
  if (bloqueurs.length) stop(`le ticket #${ticket.number} attend encore ${bloqueurs.map((n) => '#' + n).join(', ')}.`);
  const m = (ticket.body || '').match(/\*\*Dossiers\*\*\s*:\s*([^\n]+)/i);
  const dossiers = m ? [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].replace(/\/$/, '')).filter((d) => !/<|>/.test(d)) : [];
  if (dossiers.length) {
    git(['fetch', '-q', 'origin']);
    const touches = git(['diff', '--name-only', 'origin/main...HEAD']).split('\n').filter(Boolean);
    const LIBRE = /^(\.claude|tools|docs|kickoff|reports|demo|journal|captures|\.github|\.githooks)\/|^[^/]+\.md$|^(\.gitignore|\.gitattributes|\.env\.example)$/;
    const hors = touches.filter((f) => !LIBRE.test(f) && !dossiers.some((d) => f === d || f.startsWith(d + '/')));
    if (hors.length) stop(`le lot touche des fichiers hors de ses Dossiers (${dossiers.join(', ')}) : ${hors.slice(0, 8).join(', ')}${hors.length > 8 ? '…' : ''}. Déplace-les ou mets à jour le ticket avec l’accord du lot concerné.`);
  }
  const total = ((ticket.body || '').match(/^- \[[ x]\]/gim) || []).length, coches = ((ticket.body || '').match(/^- \[x\]/gim) || []).length;
  if (total && coches < total) console.log(`Attention : ${coches} critère(s) coché(s) sur ${total} dans le ticket #${ticket.number}. La fusion continue, mais dis-le dans la PR.`);
}

git(['fetch', '-q', 'origin']);
try { git(['merge', '--no-edit', 'origin/main']); }
catch (e) { stop(`conflit en fusionnant main dans ${branche}. Règle-le ici, commite, relance.\n${String(e.stdout || '').split('\n').slice(-10).join('\n')}`); }

let verif = '';
try { verif = execSync('node tools/verif.mjs', { cwd: dir, encoding: 'utf8', stdio: 'pipe', shell: true }); if (/❌/.test(verif)) throw Object.assign(new Error('rouge'), { stdout: verif }); console.log(verif.trim()); }
catch (e) { stop(`vérification rouge sur ${branche}.\n${String(e.stdout || e.message).split('\n').slice(-15).join('\n')}`); }

git(['switch', '-q', 'main']);
try { git(['pull', '-q', '--ff-only', 'origin', 'main']); } catch { git(['switch', '-q', branche]); stop('main local a divergé de origin/main : remets main à jour à la main.'); }
try { git(['merge', '--no-ff', '--no-edit', '-m', `Fusion du lot ${nom}`, branche]); }
catch (e) { try { git(['merge', '--abort']); } catch {} git(['switch', '-q', branche]); stop(`conflit inattendu en fusionnant dans main.\n${String(e.stdout || '').split('\n').slice(-10).join('\n')}`); }
let pousse = false;
for (let essai = 0; essai < 3 && !pousse; essai++) {
  try { git(['push', '-q', 'origin', 'main']); pousse = true; }
  catch {
    // quelqu'un a poussé entre-temps : on reprend main, on refusionne, on repousse
    try { git(['fetch', '-q', 'origin']); git(['reset', '-q', '--hard', 'origin/main']); git(['merge', '--no-ff', '--no-edit', '-m', `Fusion du lot ${nom}`, branche]); }
    catch { try { git(['merge', '--abort']); } catch {} git(['reset', '-q', '--hard', 'origin/main']); git(['switch', '-q', branche]); stop('conflit avec ce qui vient d’être poussé sur main : refusionne main dans ton lot et relance.'); }
  }
}
if (!pousse) { git(['reset', '-q', '--hard', 'origin/main']); git(['switch', '-q', branche]); stop('impossible de pousser main après 3 essais.'); }
console.log(`✅ Lot « ${nom} » fusionné dans main et poussé.`);

if (ticket) {
  try {
    gh(['issue', 'edit', String(ticket.number), '--add-label', 'done', '--remove-label', 'in-progress']);
    gh(['issue', 'close', String(ticket.number), '--comment', `Fusionné dans main par tools/fusionner.mjs. Vérification :\n\`\`\`\n${verif.trim().slice(0, 600)}\n\`\`\``]);
    console.log(`Ticket #${ticket.number} fermé avec l’étiquette done.`);
  } catch (e) { console.log(`Ticket non mis à jour (${String(e.message).split('\n')[0].slice(0, 80)}) : fais-le à la main.`); }
} else console.log(`Aucun ticket ouvert ne mentionne lot/${nom} : rien fermé.`);
git(['switch', '-q', branche]);
