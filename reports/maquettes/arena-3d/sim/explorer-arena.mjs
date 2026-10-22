// Explorateur de l'Adidas Arena : joue des centaines de runs du moteur (arena-sim.js) en parallèle (worker_threads) et classe les plans
// du directeur sur leur PIRE variante. Même méthode que src/explorateur (Forum des Halles) : contraintes imposées / leviers du directeur,
// plans par règles puis mutations, chaque plan contre plusieurs variantes, élagage exact des plans qui ne peuvent plus entrer dans le haut du classement.
// Usage (depuis reports/maquettes/arena-3d/) : node sim/explorer-arena.mjs [--fils 8] [--plans 30] [--mutants 4] [--variantes 6] [--duree 600]
// Sortie : plans-arena.json (généré, jamais commité).
import { Worker } from 'node:worker_threads';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url)), ARENA = join(ICI, '..');

// ---------- Contraintes imposées : le directeur ne les règle pas ----------
export const IMPOSEES = {
  nom: "Fin de match, ~6 800 spectateurs : la police ferme les accès du métro 12 (Porte de la Chapelle) avant le coup de sifflet final ; troubles et incidents autour de la salle",
  station_fermee: true, duree_s: 600, population: 'remplissage 100 % des places du plan NP2F (6 819 places)',
};
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// Variantes : chacune cumule plusieurs perturbations du catalogue (D1 cortège de supporters, D5 colis suspect, B1 issue condamnée, B3 escalator arrêté, F1 information tardive)
export function variantes(n = 6, graine = 2210) {
  const V = [];
  const ZONES = [['D1-zone-1', 'cortège de supporters sur le parvis Alice Milliat'], ['D1-zone-2', 'cortège de supporters sur le bd Ney est'], ['D1-zone-3', 'cortège de supporters av. de la Porte de la Chapelle'], ['D1-zone-4', 'cortège de supporters sous le périphérique']];
  const COLIS = [['entrée', -47.8, 55.1], ['issue 5, parvis', 0.1, 55], ['issue 6, parvis', 24.9, 55], ['issue 1, rue de la Chapelle', -63, -12]];
  for (let v = 0; v < n; v++) {
    const r = rng(graine + v * 101), pick = (a) => a[(r() * a.length) | 0], ev = [];
    const z = pick(ZONES); ev.push({ t: Math.round(r() * 120), levier: z[0], nom: z[1] });
    const c = pick(COLIS); ev.push({ t: Math.round(r() * 200), levier: 'D5-colis', x: c[1], z: c[2], nom: 'colis suspect près de ' + c[0] });
    const issue = 1 + ((r() * 9) | 0); ev.push({ t: 0, levier: 'B1-issue-' + issue, nom: 'issue de secours ' + issue + ' condamnée' });
    if (r() < 0.8) ev.push({ t: 0, levier: 'B3-escalator-' + (1 + ((r() * 2) | 0)), nom: 'escalator arrêté' });
    if (r() < 0.6) { const z2 = pick(ZONES.filter(q => q[0] !== z[0])); ev.push({ t: Math.round(60 + r() * 200), levier: z2[0], nom: z2[1] }); }
    ev.push({ t: 0, levier: 'F1-annonce', retard_min: pick([1, 2, 3]), nom: "information retardée de" });
    ev.forEach(e => { if (e.levier === 'F1-annonce') e.nom += ' ' + e.retard_min + ' min'; });
    V.push({ id: 'V' + (v + 1), evenements: ev, nom: ev.map(e => e.nom).join(' ; ') });
  }
  return V;
}

// ---------- Plans du directeur ----------
export const CONSIGNE = { id: 'consigne', nom: 'Consigne actuelle : tout ouvert, aucun guidage', fermees: [], agents: [], annonces: [], vagues: 1, ratp: false, t3b: false };
const EXITS = ['B1-entree', ...Array.from({ length: 9 }, (_, i) => 'B1-issue-' + (i + 1)), ...Array.from({ length: 4 }, (_, i) => 'B1-vomitoire-' + (i + 1))];
const COTES = { aucun: [], ouest: ['B1-issue-1', 'B1-issue-2', 'B1-issue-3'], est: ['B1-issue-7', 'B1-issue-8'], parvis: ['B1-issue-4', 'B1-issue-5', 'B1-issue-6'], vomi_nord: ['B1-vomitoire-1', 'B1-vomitoire-2'] };
const CIBLES = { aucune: [], tram_est: [['tramEst', 'B1-issue-6'], ['tramEst', 'B1-issue-5']], nord: [['pied_nord', 'B1-issue-1'], ['pied_nord', 'B1-issue-2']], sud: [['pied_sud', 'B1-entree'], ['pied_sud', 'B1-issue-4']], tram_ouest: [['tramOuest', 'B1-issue-3'], ['tramOuest', 'B1-issue-2']] };
export const AGENTS_PAR_SORTIE = 4, AGENTS_RATP = 2, AGENTS_PAR_VAGUE = 6;
export const agentsDuPlan = (p) => p.agents.reduce((a, g) => a + g.n, 0) + (p.ratp ? AGENTS_RATP : 0) + (p.vagues - 1) * AGENTS_PAR_VAGUE;
const uniq = (a) => [...new Set(a)];
export const cle = (p) => JSON.stringify([[...p.fermees].sort(), p.agents.map(g => [g.exit, g.cible, g.n]).sort(), p.annonces.map(a => [a.zone, a.cible]).sort(), p.vagues, p.ratp, p.t3b]);
function normaliser(p) {
  const f = uniq(p.fermees.filter(e => EXITS.includes(e)));
  if (f.length >= EXITS.length - 3) f.length = EXITS.length - 4; // on ne ferme pas presque tout
  return { ...p, fermees: f, agents: p.agents.filter(g => !f.includes(g.exit)).slice(0, 12), annonces: uniq(p.annonces.map(a => JSON.stringify(a))).map(a => JSON.parse(a)).slice(0, 4) };
}
export function plansParRegles(n = 30, graine = 7) {
  const r = rng(graine), tous = [];
  for (const cote of Object.keys(COTES)) for (const cible of Object.keys(CIBLES)) for (const moyen of ['annonce', 'agents', 'les_deux']) for (const vagues of [1, 2]) for (const ratp of [false, true]) for (const t3b of [false, true]) {
    if (cible === 'aucune' && moyen !== 'annonce') continue;
    const c = CIBLES[cible];
    tous.push(normaliser({ id: '', nom: '', fermees: COTES[cote], agents: moyen === 'annonce' ? [] : c.map(([t, e]) => ({ exit: e, cible: t, n: AGENTS_PAR_SORTIE })), annonces: moyen === 'agents' ? [] : c.slice(0, 1).map(([t]) => ({ zone: 'tout', cible: t })), vagues, ratp, t3b }));
  }
  for (let i = tous.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [tous[i], tous[j]] = [tous[j], tous[i]]; }
  const vus = new Set([cle(CONSIGNE)]), out = [];
  for (const p of tous) { if (out.length >= n) break; const k = cle(p); if (vus.has(k)) continue; vus.add(k); out.push({ ...p, id: 'R' + (out.length + 1) }); }
  return out;
}
export function muter(p, n, graine) {
  const r = rng(graine), pick = (a) => a[(r() * a.length) | 0], out = [], vus = new Set([cle(p)]);
  for (let essai = 0; out.length < n && essai < n * 30; essai++) {
    const q = { ...p, fermees: [...p.fermees], agents: p.agents.map(g => ({ ...g })), annonces: p.annonces.map(a => ({ ...a })) };
    const geste = pick(['ouvrir', 'fermer', 'agent+', 'agent-', 'deplacer', 'annonce', 'vagues', 'ratp', 't3b', 'cible']);
    const libres = EXITS.filter(s => !q.fermees.includes(s) && /entree|issue/.test(s)), cibles = ['tramEst', 'tramOuest', 'pied_nord', 'pied_sud', 'pied_est'];
    if (geste === 'ouvrir' && q.fermees.length) q.fermees.splice((r() * q.fermees.length) | 0, 1);
    else if (geste === 'fermer') q.fermees.push(pick(EXITS.filter(s => !q.fermees.includes(s))));
    else if (geste === 'agent+') q.agents.push({ exit: pick(libres), cible: pick(cibles), n: AGENTS_PAR_SORTIE });
    else if (geste === 'agent-' && q.agents.length) q.agents.splice((r() * q.agents.length) | 0, 1);
    else if (geste === 'deplacer' && q.agents.length) q.agents[(r() * q.agents.length) | 0].exit = pick(libres);
    else if (geste === 'cible' && q.agents.length) q.agents[(r() * q.agents.length) | 0].cible = pick(cibles);
    else if (geste === 'annonce') { const zone = pick(['tout', 'galerie', 'tribune_haute', 'tribune_basse', 'parvis']), c = pick(cibles); q.annonces = q.annonces.some(a => a.zone === zone && a.cible === c) ? q.annonces.filter(a => !(a.zone === zone && a.cible === c)) : [...q.annonces, { zone, cible: c }]; }
    else if (geste === 'vagues') q.vagues = 1 + (q.vagues % 3);
    else if (geste === 'ratp') q.ratp = !q.ratp;
    else if (geste === 't3b') q.t3b = !q.t3b;
    else continue;
    const m = normaliser(q), k = cle(m); if (vus.has(k)) continue; vus.add(k);
    out.push({ ...m, id: `${p.id}.${out.length + 1}`, parent: p.id, geste });
  }
  return out;
}
// Texte des ordres, en français, pour la régie
const NOM_EXIT = (id) => id === 'B1-entree' ? "l'entrée publique" : id.startsWith('B1-issue') ? "l'issue de secours " + id.split('-')[2] : 'le vomitoire ' + id.split('-')[2];
const NOM_CIBLE = { tramEst: 'le tram T3b est (Colette Besson)', tramOuest: 'le tram T3b ouest (Porte de la Chapelle)', pied_nord: 'la sortie à pied vers le nord', pied_sud: 'la sortie à pied vers le sud', pied_est: 'la sortie à pied vers l’est', metro12: 'le métro 12' };
const NOM_ZONE = { tout: 'toute la salle', galerie: 'la galerie des balcons', tribune_haute: 'les balcons', tribune_basse: 'les tribunes basses', parvis: 'le parvis' };
export function ordres(p) {
  const o = [];
  if (p.fermees.length) o.push('Fermer ' + p.fermees.map(NOM_EXIT).join(', '));
  const gr = {}; p.agents.forEach(g => { (gr[g.exit + '>' + g.cible] = gr[g.exit + '>' + g.cible] || { ...g, n: 0 }).n += g.n; });
  Object.values(gr).forEach(g => o.push(`${g.n} agents à ${NOM_EXIT(g.exit)} : orienter vers ${NOM_CIBLE[g.cible] || g.cible}`));
  p.annonces.forEach(a => o.push(`Annonce pour ${NOM_ZONE[a.zone] || a.zone} : se diriger vers ${NOM_CIBLE[a.cible] || a.cible}`));
  if (p.vagues > 1) o.push(`Vider la salle en ${p.vagues} vagues : tribunes basses d'abord, balcons ${p.vagues === 2 ? '2' : '2 puis 4'} min plus tard`);
  if (p.ratp) o.push('Demander à la RATP de rouvrir une bouche du métro 12, filtrée');
  if (p.t3b) o.push('Demander un tram T3b supplémentaire (rames toutes les 150 s au lieu de 240 s)');
  return o.length ? o : ['Tout ouvert, aucun guidage'];
}
export function nomPlan(p) {
  const parts = [];
  if (p.fermees.length) parts.push('Fermer ' + p.fermees.slice(0, 2).map(NOM_EXIT).join(' et ') + (p.fermees.length > 2 ? ` +${p.fermees.length - 2}` : ''));
  const cib = uniq([...p.annonces.map(a => a.cible), ...p.agents.map(a => a.cible)]);
  if (cib.length) parts.push('guider vers ' + cib.slice(0, 2).map(c => (NOM_CIBLE[c] || c).replace(/ \(.*\)/, '')).join(' et '));
  if (p.vagues > 1) parts.push(p.vagues + ' vagues'); if (p.ratp) parts.push('RATP'); if (p.t3b) parts.push('T3b renforcé');
  return parts.slice(0, 3).join(' · ') || 'Garder la consigne';
}

// ---------- Notes ----------
// clé de comparaison, du plus grave au moins grave : ligne rouge (> 4 pers./m² pendant plus de 60 s), non-sortis à 10 min, personnes envoyées vers la perturbation, temps pour 95 % sortis, agents
const cleNote = (n) => [n.rouge ? 1 : 0, n.non_sortis, n.zone_danger, n.t95_s ?? 99999, n.agents];
export function comparer(a, b) { const x = cleNote(a), y = cleNote(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }
export const pireNote = (notes) => notes.reduce((p, n) => (comparer(n, p) > 0 ? n : p));

export function pool(nFils) {
  const fils = Array.from({ length: nFils }, () => new Worker(join(ICI, 'explorer-fil.mjs')));
  const libres = [...fils], file = [], attente = new Map(); let id = 0;
  const lancer = () => { while (libres.length && file.length) { const w = libres.pop(), j = file.shift(); w.postMessage(j.msg); } };
  fils.forEach((w) => w.on('message', (r) => { const j = attente.get(r.id); attente.delete(r.id); libres.push(w); lancer(); if (r.erreur) j.rej(new Error(r.erreur)); else j.res(r.note); }));
  return { run: (plan, variante, graine, duree) => new Promise((res, rej) => { const msg = { id: ++id, plan, variante, graine, duree }; attente.set(msg.id, { res, rej }); file.push({ msg }); lancer(); }), fermer: () => Promise.all(fils.map(w => w.terminate())) };
}

export async function explorer(o = {}) {
  const t0 = Date.now(), V = variantes(o.variantes ?? 6), graine = (i) => 1000 + i, duree = o.duree ?? 600;
  const P = pool(o.fils ?? 8);
  let runs = 0, ordre = V.map((_, i) => i); const garde = o.meilleurs ?? 5, finis = [];
  const compter = (n) => { runs++; if (o.bavard && runs % 10 === 0) console.log(`  ${runs} runs (${Math.round((Date.now() - t0) / 1000)} s)`); return n; };
  const seuil = () => (finis.length >= garde ? [...finis].sort(comparer)[garde - 1] : null);
  const evaluer = async (plans, etape, { complet = false } = {}) => Promise.all(plans.map(async (plan) => {
    const notes = [];
    if (complet) notes.push(...await Promise.all(V.map((v, i) => P.run(plan, v, graine(i), duree).then(compter))));
    else for (const i of ordre) {
      notes.push(compter(await P.run(plan, V[i], graine(i), duree)));
      const s = seuil(); if (s && comparer(pireNote(notes), s) > 0) return { plan, etape, pire: pireNote(notes), variantes: notes, elague: true };
    }
    const pire = pireNote(notes); finis.push(pire); return { plan, etape, pire, variantes: notes, elague: false };
  }));
  try {
    const base = await evaluer([CONSIGNE], 'référence', { complet: true });
    ordre = base[0].variantes.map((n, i) => [n, i]).sort((x, y) => comparer(y[0], x[0])).map(x => x[1]);
    const temps1 = await evaluer(plansParRegles(o.plans ?? 30), 'règles');
    const tri = (a) => [...a].sort((x, y) => comparer(x.pire, y.pire));
    const meilleurs = tri(temps1.filter(r => !r.elague)).slice(0, garde);
    const vus = new Set([CONSIGNE, ...temps1.map(r => r.plan)].map(cle));
    const mutants = meilleurs.flatMap((r, i) => muter(r.plan, o.mutants ?? 4, 77 + i)).filter(p => { const k = cle(p); if (vus.has(k)) return false; vus.add(k); return true; });
    const temps2 = await evaluer(mutants, 'mutation');
    const tous = [...base, ...temps1, ...temps2], classement = [...tri(tous.filter(r => !r.elague)), ...tri(tous.filter(r => r.elague))];
    return { imposees: IMPOSEES, variantes: V, ordre_variantes: ordre.map(i => V[i].id), plans_essayes: tous.length, plans_elagues: tous.filter(r => r.elague).length, runs, duree_s: Math.round((Date.now() - t0) / 1000), fils: o.fils ?? 8, reference: base[0], rang_reference: classement.findIndex(r => r.plan.id === CONSIGNE.id) + 1, classement };
  } finally { await P.fermer(); }
}

// ---------- Mise en forme pour la régie : référence + 3 meilleurs plans, avec écarts par rapport à la consigne ----------
export function versVue(r) {
  const ref = r.reference.pire, fiche = (x) => ({ id: x.plan.id, nom: nomPlan(x.plan), ordres: ordres(x.plan), agents: agentsDuPlan(x.plan), plan: x.plan, pire: x.pire, variantes: x.variantes.map(n => ({ rouge: n.rouge, non_sortis: n.non_sortis, zone_danger: n.zone_danger, t95_s: n.t95_s, densite_max: n.densite_max })) });
  const dif = (n) => ({ non_sortis: n.non_sortis - ref.non_sortis, zone_danger: n.zone_danger - ref.zone_danger, t95_s: (n.t95_s ?? 9999) - (ref.t95_s ?? 9999), agents: n.agents - ref.agents, densite_max: +(n.densite_max - ref.densite_max).toFixed(1) });
  return {
    genere: new Date().toISOString(), imposees: r.imposees, variantes: r.variantes.map(v => ({ id: v.id, nom: v.nom })), runs: r.runs, duree_s: r.duree_s, fils: r.fils, plans_essayes: r.plans_essayes, rang_reference: r.rang_reference,
    reference: { ...fiche(r.reference), nom: CONSIGNE.nom },
    meilleurs: r.classement.filter(x => !x.elague && x.plan.id !== CONSIGNE.id).slice(0, 3).map(x => ({ ...fiche(x), delta: dif(x.pire) })),
  };
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await explorer({ plans: arg('plans', 30), mutants: arg('mutants', 4), meilleurs: arg('meilleurs', 5), variantes: arg('variantes', 6), fils: arg('fils', 8), duree: arg('duree', 600), bavard: true });
  const vue = versVue(r);
  writeFileSync(join(ARENA, 'plans-arena.json'), JSON.stringify(vue, null, 1));
  writeFileSync(join(ICI, 'resultats-explorateur.json'), JSON.stringify(r));
  const ligne = (x) => { const p = x.pire; return `${String(x.plan.id).padEnd(10)} rouge ${p.rouge ? 'OUI' : 'non'}  non sortis ${String(p.non_sortis).padStart(4)}  vers la perturbation ${String(p.zone_danger).padStart(4)}  t95 ${String(p.t95_s ?? '—').padStart(4)} s  agents ${String(p.agents).padStart(3)}  densité max ${p.densite_max}`; };
  console.log(`\n${r.plans_essayes} plans essayés (${r.plans_elagues} élagués avant la fin), ${r.runs} runs en ${r.duree_s} s sur ${r.fils} fils. Référence classée ${r.rang_reference}e sur ${r.classement.length}.`);
  console.log('Référence (consigne) :', ligne(r.reference));
  console.log('Trois meilleurs :'); vue.meilleurs.forEach((x) => console.log('  ' + ligne(x) + '\n    ' + x.nom + '\n    ' + x.ordres.join(' ; ')));
}
