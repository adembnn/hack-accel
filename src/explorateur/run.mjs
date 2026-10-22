// Un run : un plan du directeur, une variante des contraintes imposées, une graine. Rend la note du run.
import { nouveauMonde } from './moteur.mjs';
import { IMPOSEES, EFFETS, zonesActives } from './scenario.mjs';
import { hasard } from './hasard.mjs';
import { agentsDuPlan } from './plans.mjs';

// La bouche RATP gardée ouverte passe par le filtre du moteur (1,3 pers./s, codé dans sim.js).
const PAS = 0.1, ECART_VAGUE_S = 120, DEBIT_MONTEE = 2.0;
// Ligne rouge : seuil rouge d'Adem (4 pers./m², Still, guides britanniques) tenu plus d'une minute sur un même m².
export const SEUIL_DENSITE = 4, LIGNE_ROUGE_S = 60;

// Les issues de secours forment un seul groupe dans le moteur : on les sépare pour que le directeur choisisse lesquelles ouvrir.
function separerIssues(m) {
  const S = m.SIM, k = S.groups.findIndex((G) => G.type === 'secours');
  if (k < 0) return;
  const G = S.groups[k], seules = G.cells.map((c, i) => ({ n: `Issue de secours ${i + 1}`, type: 'secours', cells: [c], open: true, zone: false }));
  S.groups.splice(k, 1, ...seules);
  S.F = S.groups.map(() => new Float32Array(S.N * S.L));
}
const recalculer = (m) => m.SIM.groups.forEach((_, k) => m.simField(k));

export function sortiesDuMonde(m) { return m.SIM.groups.filter((G) => G.type !== 'train').map((G) => G.n); }

export async function preparerMonde(graine) { const m = await nouveauMonde(graine); separerIssues(m); return m; }

export async function jouer(plan, variante, graine, { imposees = IMPOSEES, trace = false } = {}) {
  const m = await preparerMonde(graine), S = m.SIM, g = S.g;
  const posG = S.groups.map((G) => G.cells.map((e) => [g.bbox[0] + (e.cell[2] + 0.5) * g.res, g.bbox[1] + (e.cell[1] + 0.5) * g.res]));
  const parNom = (n) => S.groups.find((G) => G.n === n);
  // contraintes imposées
  S.groups.forEach((G) => { G.zone = false; });
  const train = S.groups.find((G) => G.type === 'train');
  if (train) train.open = !imposees.stations_fermees;
  recalculer(m);
  m.simSpawn(imposees.population); m.simAlert();
  // Piégés : sans aucun chemin vers une sortie une fois les stations fermées, même avec toutes les portes ouvertes
  // (voyageurs sur les quais, et des zones du niveau -2 reliées seulement par les quais dans la carte OSM).
  // Ils sont comptés à part : seul un plan qui obtient une bouche de la RATP peut les sortir.
  for (const a of S.A) { const i = a.l * S.N + ((a.z - g.bbox[1]) / g.res | 0) * g.w + ((a.x - g.bbox[0]) / g.res | 0); a.piege = !S.F.some((F, q) => S.groups[q].open && F[i] < 1e9); }
  // perturbations fixes de la variante (le directeur ne peut pas les annuler)
  const evs = variante ? variante.evenements : [], imposeFerme = new Set(), lents = [], paniques = [], ponctuels = [];
  const sorties = S.groups.map((G, i) => i).filter((i) => S.groups[i].type !== 'train');
  const posAgent = (r) => { const a = S.A[(r() * S.A.length) | 0]; return { l: a.l, x: a.x, z: a.z }; };
  for (const e of evs) {
    const r = hasard(e.graine || 1);
    if (e.type === 'issues') { const libres = sorties.filter((i) => !imposeFerme.has(i)); for (let j = 0; j < e.n && libres.length; j++) { const i = libres.splice((r() * libres.length) | 0, 1)[0]; imposeFerme.add(i); S.groups[i].open = false; } }
    else if (e.type === 'escalators') g.links.forEach((k) => { if (k.k === 'escalator' && r() < e.part) { k.k = 'escalier'; k.debit = EFFETS.escalator_arrete_debit; } });
    else if (e.type === 'ascenseurs') g.links.forEach((k) => { if (k.k === 'ascenseur' && r() < e.part) k.open = false; });
    else if (e.type === 'profil') S.A.forEach((a) => { if (r() >= e.part) return; if (e.profil === 'pmr') a.v0 *= EFFETS.pmr_v0; else { a.v0 *= EFFETS.agites_v0; a.bh *= EFFETS.agites_suivisme; } });
    else if (e.type === 'tardive') S.delay = (S.delay || 0) + e.retard_s;
    else if (e.type === 'lent') lents.push({ ...e, ...posAgent(r) });
    else if (e.type === 'panique') paniques.push({ ...e, ...posAgent(r), fait: false });
    else if (e.type === 'rumeur' || e.type === 'contradictoire') ponctuels.push({ ...e, r, fait: false });
  }
  S.A.forEach((a) => { a.v0b = a.v0; });
  // plan du directeur
  if (train && plan.ratp) { train.open = true; train.filtre = true; }
  const fermeParPlan = new Set([...plan.fermees, ...[...imposeFerme].map((i) => S.groups[i].n)]);
  for (const n of plan.fermees) { const G = parNom(n); if (G) G.open = false; }
  for (const n of plan.agents) { const G = parNom(n); if (G) G.agent = true; }
  for (const n of plan.annonces) { const G = parNom(n); if (G) G.annonce = true; }
  if (plan.escalators === 'montee') g.links.forEach((k) => { if (k.k === 'escalator') k.debit = DEBIT_MONTEE; });
  recalculer(m);
  if (plan.vagues > 1) { let i = 0; for (const a of S.A) if (a.kind === 'cine') a.pre += ECART_VAGUE_S * (i++ % plan.vagues); }

  const N = S.A.length, celluleS = new Map(), nPieges = S.A.filter((a) => a.piege).length, nLibres = N - nPieges;
  const sortisLibres = () => S.A.reduce((s, a) => s + (a.out && !a.piege ? 1 : 0), 0);
  let t95 = null, pic = 0, k = 0, bloquees = new Set(), dernierOut = 0, dernierT = 0;
  // Arrêt anticipé : tout le monde est parti de sa place, et plus personne ne sort depuis 90 s (le reste est coincé).
  const departMax = S.A.reduce((m2, a) => Math.max(m2, a.pre), 0) + (S.delay || 0);
  const suivi = [];
  const manif = () => {
    const Z = zonesActives(variante, S.T), nouv = new Set();
    // panique (A5) : pendant 60 s, les sorties à moins de 60 m du point font peur, et les gens proches repartent plus vite
    for (const p of paniques) if (S.T >= p.debut_s && S.T < p.debut_s + 60) {
      Z.push({ x: p.x, z: p.z, rayon_evite: 60, rayon_bloque: 0, ev: p });
      if (!p.fait) { p.fait = true; for (const a of S.A) if (!a.out && a.l === p.l && Math.hypot(a.x - p.x, a.z - p.z) < p.rayon) { a.v0b *= EFFETS.panique_v0; a.next = 0; } }
    }
    // rumeur (A6) : une part de la foule part vers une sortie au hasard pendant une minute ; annonce contradictoire (F4)
    for (const p of ponctuels) if (!p.fait && S.T >= p.debut_s) {
      p.fait = true;
      const ouvertes = sorties.filter((i) => S.groups[i].open);
      if (p.type === 'rumeur') { for (const a of S.A) if (!a.out && p.r() < p.part && ouvertes.length) { a.t = ouvertes[(p.r() * ouvertes.length) | 0]; a.next = S.T + 60; } }
      else { const cible = ouvertes.filter((i) => S.groups[i].zone); const i = (cible.length ? cible : ouvertes)[(p.r() * (cible.length || ouvertes.length)) | 0]; if (i !== undefined) S.groups[i].annonce = true; }
    }
    // zones lentes (B6 éclairage, B9 sol glissant)
    for (const a of S.A) {
      if (a.out) continue; let f = 1;
      for (const z of lents) if (S.T >= z.debut_s && a.l === z.l && Math.hypot(a.x - z.x, a.z - z.z) < z.rayon) f *= z.effet;
      a.v0 = a.v0b * f;
    }
    S.groups.forEach((G, i) => {
      if (G.type === 'train') return;
      G.zone = false;
      for (const z of Z) {
        const d = Math.min(...posG[i].map(([x, y]) => Math.hypot(x - z.x, y - z.z)));
        if (d < z.rayon_evite) G.zone = true;
        if (d < z.rayon_bloque) nouv.add(i);
      }
    });
    const c = Z.map((z) => [Math.round(z.x), Math.round(z.z)]);
    const change = [...nouv].some((i) => !bloquees.has(i)) || [...bloquees].some((i) => !nouv.has(i));
    if (change) {
      S.groups.forEach((G, i) => { if (G.type !== 'train' && !fermeParPlan.has(G.n)) G.open = !nouv.has(i); });
      bloquees = nouv; recalculer(m);
    }
    return c;
  };
  // Tension par sortie : chaque seconde, la file (personnes à moins de 20 m de leur sortie, quasi à l'arrêt).
  const nG = S.groups.length, fileMax = new Array(nG).fill(0), momentMax = new Array(nG).fill(0), delest = new Array(nG).fill(null);
  const sortisAvant = new Array(nG).fill(0), debitMax = new Array(nG).fill(0), hist = [], fileLien = {}, lienMax = {};
  const relever = () => {
    const file = new Array(nG).fill(0), cellules = Array.from({ length: nG }, () => []);
    for (const a of S.A) {
      if (a.out || a.ride || a.t < 0 || S.T < a.pre + (S.delay || 0)) continue;
      const i = ((a.z - g.bbox[1]) / g.res | 0) * g.w + ((a.x - g.bbox[0]) / g.res | 0) + a.l * S.N, d = S.F[a.t][i];
      if (Math.hypot(a.vx, a.vz) >= 0.4) continue;
      if (d < 20) { file[a.t]++; if (cellules[a.t].length < 300) cellules[a.t].push(i); continue; }
      // sinon : en attente au pied d'un escalator, d'un escalier ou d'un ascenseur ?
      for (const o of [0, 1, -1, g.w, -g.w]) { const ls = S.linkAt.get(i + o); if (ls) { fileLien[ls[0]] = (fileLien[ls[0]] || 0) + 1; break; } }
    }
    for (const li in fileLien) if (fileLien[li] > (lienMax[li]?.file || 0)) lienMax[li] = { file: fileLien[li], a_s: Math.round(S.T) };
    for (const li in fileLien) delete fileLien[li];
    for (let j = 0; j < nG; j++) if (file[j] >= fileMax[j] + 10 || (file[j] > fileMax[j] && !delest[j])) {
      fileMax[j] = file[j]; momentMax[j] = Math.round(S.T);
      // Sorties qui peuvent la soulager à cet instant : ouvertes, hors zone de la manif, peu chargées ; détour médian en mètres.
      delest[j] = S.groups.map((G, q) => {
        if (q === j || !G.open || G.zone || file[q] >= 10) return null;
        const dd = cellules[j].map((c) => S.F[q][c] - S.F[j][c]).filter((x) => x < 1e8).sort((x, y) => x - y);
        return dd.length ? { sortie: G.n, detour_m: Math.round(dd[dd.length >> 1]), file: file[q] } : null;
      }).filter((x) => x && x.detour_m < 200).sort((x, y) => x.detour_m - y.detour_m).slice(0, 3);
    }
    if (k % 300 === 0) { // débit sur 30 s
      S.groups.forEach((G, j) => { const s = S.outBy[G.n] || 0; debitMax[j] = Math.max(debitMax[j], (s - sortisAvant[j]) / 30); sortisAvant[j] = s; });
      if (trace) hist.push({ T: Math.round(S.T), file: [...file] });
    }
  };
  while (S.T < imposees.duree_s - 1e-9) {
    if (k % 10 === 0) { const c = manif(); if (trace) suivi.push({ T: Math.round(S.T), sortis: S.out, zones: c }); }
    if (k % 10 === 0) relever();
    m.simStep(PAS); k++;
    if (k % 5 === 0) {
      const D = new Map();
      for (const a of S.A) { if (a.out || a.ride) continue; const key = a.l * 1e6 + (Math.floor(a.x) + 400) * 1000 + (Math.floor(a.z) + 400); D.set(key, (D.get(key) || 0) + 1); }
      for (const [key, v] of D) { if (v > pic) pic = v; if (v > SEUIL_DENSITE) celluleS.set(key, (celluleS.get(key) || 0) + PAS * 5); }
    }
    if (S.out !== dernierOut) { dernierOut = S.out; dernierT = S.T; if (t95 === null && sortisLibres() >= 0.95 * nLibres) t95 = Math.round(S.T); }
    if (S.out === N || (S.T > departMax + 30 && S.T - dernierT > 90)) break;
  }
  let pire = 0; for (const v of celluleS.values()) if (v > pire) pire = v;
  // En tension : au moins 30 personnes en file (H), ou une attente estimée de plus d'une minute au débit observé.
  const tension = S.groups.map((G, j) => {
    const attente = debitMax[j] > 0 ? Math.round(fileMax[j] / debitMax[j]) : (fileMax[j] ? 999 : 0);
    return { sortie: G.n, file_max: fileMax[j], a_s: momentMax[j], debit_max: +debitMax[j].toFixed(2), attente_s: attente, delestage: delest[j] || [] };
  }).filter((t) => t.file_max >= 30 || (t.file_max >= 10 && t.attente_s > 60)).sort((a, b) => b.file_max - a.file_max);
  // Goulots verticaux : au moins 30 personnes en attente au pied d'un même escalator, escalier ou ascenseur.
  const NOMS = { escalator: 'Escalator', escalier: 'Escalier', ascenseur: 'Ascenseur' };
  const goulots = Object.entries(lienMax).filter(([, v]) => v.file >= 30).map(([li, v]) => {
    const L = g.links[li], [l, r, c] = L.a;
    return { lien: `${NOMS[L.k] || L.k}${L.n ? ' ' + L.n : ''} (niveaux ${g.levels[L.a[0]]} ↔ ${g.levels[L.b[0]]})`, x: Math.round(g.bbox[0] + (c + 0.5) * g.res), z: Math.round(g.bbox[1] + (r + 0.5) * g.res), niveau: g.levels[l], file_max: v.file, a_s: v.a_s };
  }).sort((a, b) => b.file_max - a.file_max);
  return {
    plan: plan.id, variante: variante?.id ?? null, graine,
    rouge: pire > LIGNE_ROUGE_S, ecrasement_s: Math.round(pire), densite_max: pic,
    non_sortis: nLibres - sortisLibres(), pieges: nPieges, pieges_restants: S.A.filter((a) => a.piege && !a.out).length, zone_danger: S.zoneOut, t95_s: t95, agents: agentsDuPlan(plan),
    par_sortie: { ...S.outBy }, tension, goulots, ...(trace ? { suivi, files: hist } : {}),
  };
}

// Ordre de classement (grill du 22 oct. + ticket #15) : ligne rouge, non sortis (parmi ceux qui ont un chemin),
// zone de danger, piégés restants, temps, agents.
// Des paliers évitent qu'un écart de bruit (3 personnes, 4 s) décide seul : 1 % de la foule, 10 personnes, 10 s.
export function cleNote(n, population = IMPOSEES.population) {
  return [n.rouge ? 1 : 0, Math.round(n.non_sortis / (population * 0.01)), Math.round(n.zone_danger / 10), Math.round((n.pieges_restants ?? 0) / 10), Math.round((n.t95_s ?? 9999) / 10), n.agents];
}
export function comparer(a, b) { const x = cleNote(a), y = cleNote(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }
export function pireNote(notes) { return notes.reduce((p, n) => (comparer(n, p) > 0 ? n : p)); }
