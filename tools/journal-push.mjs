// Lit journal/*.jsonl de cette machine et poste dans Discord (webhook de .env).
//  Tout de suite : sous-agent lancé, sous-agent terminé, point de fin de réponse, vérification rouge.
//  Toutes les 60 s, seulement si quelque chose a bougé : un résumé par session, avec ses sous-agents vivants.
// Lancement : node tools/journal-push.mjs            (boucle)
//             node tools/journal-push.mjs --une-fois  (un passage sur les 10 dernières minutes, pour tester)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { hostname } from 'node:os';

const dir = process.cwd();
const uneFois = process.argv.includes('--une-fois');
const PERIODE = 60_000;
const SILENCE = 10 * 60_000;   // sans action depuis 10 min → « silencieux »
const OUBLI = 30 * 60_000;     // sans action depuis 30 min → n'apparaît plus

function env() {
  const r = {};
  try { for (const l of readFileSync(join(dir, '.env'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) r[m[1]] = m[2].trim(); } } catch {}
  return r;
}
const { DISCORD_WEBHOOK_URL: webhook, PRENOM: prenom = 'inconnu' } = env();
if (!webhook) { console.error('DISCORD_WEBHOOK_URL manquant dans .env (voir .env.example).'); process.exit(1); }

async function poster(texte) {
  try {
    const r = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: texte.slice(0, 1900), username: prenom }) });
    if (!r.ok) console.error('Discord a refusé :', r.status, await r.text());
  } catch (e) { console.error('Discord injoignable :', e.message); }
}

const fichiers = () => { const d = join(dir, 'journal'); if (!existsSync(d)) return []; return readdirSync(d).filter((f) => f.endsWith(`-${hostname()}.jsonl`)).map((f) => join(d, f)); };
const lus = new Map();       // fichier → lignes déjà traitées
const sessions = new Map();  // id → { nom, lot, t, actions, derniere, agents: Map(id → agent) }
const noms = new Map();      // id de sous-agent → { nom, modele }
let bouge = false;

const mins = (iso) => Math.round((Date.now() - new Date(iso)) / 60000);
const depuis = (iso) => { const m = mins(iso); return m < 1 ? 'à l’instant' : `il y a ${m} min`; };
const duree = (a, b) => { const m = Math.round((new Date(b) - new Date(a)) / 60000); return m < 1 ? '< 1 min' : `${m} min`; };
const nomAgent = (id) => noms.get(id)?.nom || `sous-agent ${id}`;
const modele = (id) => noms.get(id)?.modele ? ` (${noms.get(id).modele})` : '';

function traiter(l) {
  const s = sessions.get(l.session) || { nom: l.nomSession || l.session, lot: l.lot, t: l.t, actions: 0, derniere: '', agents: new Map() };
  s.nom = l.nomSession || s.nom; s.lot = l.lot; s.t = l.t;
  const immediats = [];
  const tete = `**${prenom} · ${s.nom}** \`${s.lot}\``;

  if (l.evt === 'PostToolUse' && l.outil === 'Agent' && l.agentLance) noms.set(l.agentLance, { nom: l.nomAgent, modele: l.modele });

  if (l.agent === 'principal') {
    if (l.evt === 'PostToolUse') { s.actions++; s.derniere = `${l.outil} ${l.cible || ''}`.trim(); }
    if (l.evt === 'Stop' && l.point) immediats.push(`🗒️ ${tete}\n> ${l.point.slice(0, 300).replace(/\n/g, '\n> ')}`);
    if (l.evt === 'VerifRouge') immediats.push(`🔴 ${tete} · vérification rouge\n\`\`\`\n${(l.cible || '').slice(0, 800)}\n\`\`\``);
  } else {
    const a = s.agents.get(l.agent) || { debut: l.t, t: l.t, actions: 0, derniere: '', fini: false };
    a.t = l.t;
    if (l.evt === 'SubagentStart') { a.debut = l.t; immediats.push(`▶️ ${tete} lance « ${nomAgent(l.agent)} »${modele(l.agent)}`); }
    if (l.evt === 'PostToolUse') { a.actions++; a.derniere = `${l.outil} ${l.cible || ''}`.trim(); }
    if (l.evt === 'SubagentStop') { a.fini = true; immediats.push(`✅ ${tete} · « ${nomAgent(l.agent)} » terminé en ${duree(a.debut, l.t)}, ${a.actions} actions\n> ${(l.cible || '').slice(0, 200)}`); }
    s.agents.set(l.agent, a);
  }
  sessions.set(l.session, s); bouge = true;
  return immediats;
}

function lignesRecentes(lignes) {
  let n = 0;
  for (let k = lignes.length - 1; k >= 0; k--) { try { if (Date.now() - new Date(JSON.parse(lignes[k]).t) > SILENCE) break; } catch {} n++; }
  return n;
}

async function passage() {
  const immediats = [];
  for (const f of fichiers()) {
    const lignes = readFileSync(f, 'utf8').split('\n').filter(Boolean);
    const deja = lus.get(f) ?? lignes.length - lignesRecentes(lignes);
    for (const s of lignes.slice(deja)) { try { immediats.push(...traiter(JSON.parse(s))); } catch {} }
    lus.set(f, lignes.length);
  }
  for (const m of immediats) await poster(m);
  if (!bouge) return;
  bouge = false;
  const blocs = [];
  for (const s of sessions.values()) {
    if (Date.now() - new Date(s.t) > OUBLI) continue;
    const vivants = [...s.agents.entries()].filter(([, a]) => !a.fini && Date.now() - new Date(a.t) < OUBLI);
    if (!vivants.length && s.actions === 0) continue;
    const silence = (t) => (Date.now() - new Date(t) > SILENCE ? ' ⚠️ silencieux' : '');
    const lignes = [`**${s.nom}** \`${s.lot}\` · ${s.actions} actions · ${s.derniere || '—'} (${depuis(s.t)})${vivants.length ? '' : silence(s.t)}`];
    for (const [id, a] of vivants) lignes.push(`    ↳ ${nomAgent(id)}${modele(id)} · ${a.actions} actions · ${a.derniere || 'démarre'} (${depuis(a.t)})${silence(a.t)}`);
    blocs.push(lignes.join('\n'));
  }
  if (blocs.length) await poster(`📡 **${prenom}** · ${new Date().toTimeString().slice(0, 5)}\n${blocs.join('\n')}`);
}

if (uneFois) { await passage(); console.log('Passage unique terminé.'); process.exit(0); }
console.log(`Journal → Discord toutes les ${PERIODE / 1000} s (machine ${hostname()}, ${prenom}). Ctrl+C pour arrêter.`);
await passage();
setInterval(passage, PERIODE);
