// Lit journal/*.jsonl de cette machine et poste dans Discord (webhook de .env) :
//  - tout de suite : sous-agent lancé, sous-agent terminé (avec son résumé), point de fin de réponse, vérification rouge ;
//  - toutes les 60 s, seulement si quelque chose a bougé : un résumé par agent (lot, dernière action, nombre d'actions, silence).
// Lancement : node tools/journal-push.mjs        (boucle)
//             node tools/journal-push.mjs --une-fois   (un passage, pour tester)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hostname } from 'node:os';

const dir = process.cwd();
const uneFois = process.argv.includes('--une-fois');
const PERIODE = 60_000;
const SILENCE = 10 * 60_000;

// .env lu à la main : seules deux variables, jamais affichées.
function env() {
  const r = {};
  try {
    for (const l of readFileSync(join(dir, '.env'), 'utf8').split('\n')) {
      const m = l.match(/^([A-Z_]+)=(.*)$/);
      if (m) r[m[1]] = m[2].trim();
    }
  } catch {}
  return r;
}
const { DISCORD_WEBHOOK_URL: webhook, PRENOM: prenom = 'inconnu' } = env();
if (!webhook) { console.error('DISCORD_WEBHOOK_URL manquant dans .env (voir .env.example).'); process.exit(1); }

async function poster(texte) {
  try {
    const r = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: texte.slice(0, 1900), username: `${prenom} · agents` }) });
    if (!r.ok) console.error('Discord a refusé :', r.status, await r.text());
  } catch (e) { console.error('Discord injoignable :', e.message); }
}

const fichiers = () => { const d = join(dir, 'journal'); if (!existsSync(d)) return []; return readdirSync(d).filter((f) => f.endsWith(`-${hostname()}.jsonl`)).map((f) => join(d, f)); };
const lus = new Map(); // fichier → nombre de lignes déjà traitées
const agents = new Map(); // clé agent → état
let bouge = false;

const h = (iso) => new Date(iso).toTimeString().slice(0, 5);
const depuis = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'à l’instant' : `${m} min`; };

function traiter(l) {
  const cle = `${l.session}/${l.agent}`;
  const a = agents.get(cle) || { lot: l.lot, agent: l.agent, debut: l.t, actions: 0, derniere: '', t: l.t, fini: false };
  a.t = l.t; a.lot = l.lot;
  const immediats = [];
  if (l.evt === 'PostToolUse') { a.actions++; a.derniere = `${l.outil} ${l.cible || ''}`.trim(); }
  if (l.evt === 'SubagentStart') { a.debut = l.t; immediats.push(`▶️ **${prenom}** lance un sous-agent (${l.cible}) sur le lot \`${l.lot}\``); }
  if (l.evt === 'SubagentStop') { a.fini = true; immediats.push(`✅ **${prenom}** · sous-agent terminé sur \`${l.lot}\` :\n> ${l.cible}`); }
  if (l.evt === 'Stop' && l.point) immediats.push(`🗒️ **${prenom}** · point sur \`${l.lot}\` :\n> ${l.point.replace(/\n/g, '\n> ')}`);
  if (l.evt === 'VerifRouge') immediats.push(`🔴 **${prenom}** · vérification rouge sur \`${l.lot}\` :\n\`\`\`\n${(l.cible || '').slice(0, 800)}\n\`\`\``);
  agents.set(cle, a); bouge = true;
  return immediats;
}

async function passage() {
  const immediats = [];
  for (const f of fichiers()) {
    const lignes = readFileSync(f, 'utf8').split('\n').filter(Boolean);
    const deja = lus.get(f) ?? (uneFois ? Math.max(0, lignes.length - 30) : lignes.length - lignesNouvellesAuDemarrage(lignes));
    for (const s of lignes.slice(deja)) { try { immediats.push(...traiter(JSON.parse(s))); } catch {} }
    lus.set(f, lignes.length);
  }
  for (const m of immediats) await poster(m);
  if (!bouge) return;
  bouge = false;
  const vivants = [...agents.values()].filter((a) => !a.fini && Date.now() - new Date(a.t) < 2 * 3600_000);
  if (!vivants.length) return;
  const lignes = vivants.map((a) => {
    const silence = Date.now() - new Date(a.t) > SILENCE ? ' ⚠️ silencieux' : '';
    return `• \`${a.lot}\` ${a.agent} · ${a.actions} actions · dernière : ${a.derniere || '—'} (${depuis(a.t)})${silence}`;
  });
  await poster(`📡 **${prenom}** · ${h(new Date().toISOString())} · ${vivants.length} agent(s)\n${lignes.join('\n')}`);
}
// Au démarrage en boucle, on reprend les lignes des 10 dernières minutes, pas tout l'historique.
function lignesNouvellesAuDemarrage(lignes) {
  let n = 0;
  for (let k = lignes.length - 1; k >= 0; k--) { try { if (Date.now() - new Date(JSON.parse(lignes[k]).t) > SILENCE) break; } catch {} n++; }
  return n;
}

if (uneFois) { await passage(); console.log('Passage unique terminé.'); process.exit(0); }
console.log(`Journal → Discord toutes les ${PERIODE / 1000} s (machine ${hostname()}, ${prenom}). Ctrl+C pour arrêter.`);
await passage();
setInterval(passage, PERIODE);
