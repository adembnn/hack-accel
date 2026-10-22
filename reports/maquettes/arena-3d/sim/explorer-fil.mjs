// Fil de travail de l'explorateur : construit le monde une fois, puis joue un (plan, variante, graine) à chaque message et renvoie la note.
import { parentPort } from 'node:worker_threads';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildWorld, Sim, DT } from './arena-sim.js';

const scene = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'scene.json'), 'utf8'));
const world = buildWorld(scene);
const lev = Object.fromEntries(scene.leviers.map(l => [l.id, l]));
const AGENTS_RATP = 2, AGENTS_PAR_VAGUE = 6;

function jouer(plan, variante, graine, duree) {
  const sim = new Sim(world, { seed: graine, fill: 1 });
  // contraintes imposées : la police ferme la station de métro 12
  sim.apply(lev['C1-station-12'], true);
  const events = variante.evenements.map(e => ({ ...e, fait: false })).sort((a, b) => a.t - b.t);
  const discs = []; // zones de perturbation (pour compter les personnes envoyées vers elles)
  // leviers du directeur
  for (const id of plan.fermees) sim.apply(lev[id], true);
  if (plan.vagues > 1) { sim.holdSector('haute', 120 * (plan.vagues - 1)); if (plan.vagues > 2) sim.holdSector('basse', 0); }
  if (plan.t3b) sim.setTramHeadway(150);
  const teams = []; let k = 0;
  for (const g of plan.agents) {
    const G = sim.gates.find(x => x.lev === g.exit); if (!G) continue;
    const team = 'A' + (k++); teams.push([team, g.cible]);
    for (let i = 0; i < g.n; i++) { const o = (i - (g.n - 1) / 2) * 2; sim.addSteward({ x: G.facade[0] + G.dir[0] * 5 - G.dir[1] * o, z: G.facade[1] + G.dir[1] * 5 + G.dir[0] * o, level: 0, team }); }
  }
  const todo = [];
  for (const [team, cible] of teams) todo.push({ t: 30, f: () => sim.orderSteward(team, { type: 'redirect', target: cible, radius: 15 }) });
  plan.annonces.forEach(a => todo.push({ t: 20, f: () => sim.announce(a.zone, a.cible) }));
  if (plan.ratp) todo.push({ t: 45, f: () => sim.apply(lev['C1-metro-2'], false) });
  todo.sort((a, b) => a.t - b.t);
  const touched = new Set(); let dur4 = 0, dmax = 0;
  const steps = Math.round(duree / DT);
  for (let s = 0; s < steps; s++) {
    const T = s * DT;
    while (todo.length && todo[0].t <= T) todo.shift().f();
    for (const e of events) if (!e.fait && e.t <= T) {
      e.fait = true; const L = lev[e.levier]; if (!L) continue;
      const l = e.levier === 'D5-colis' ? { ...L, x: e.x, z: e.z } : e.levier === 'F1-annonce' ? { ...L, retard_min: e.retard_min } : L;
      sim.apply(l, true);
      if (/^D1|^D2/.test(e.levier)) discs.push({ x: L.x, z: L.z, r: 30 }); if (e.levier === 'D5-colis') discs.push({ x: l.x, z: l.z, r: 65 });
    }
    sim.step();
    if (s % 10 === 9) { // toutes les secondes
      if (sim.curDens > 4) dur4++; if (sim.curDens > dmax) dmax = sim.curDens;
      if (discs.length) for (let i = 0; i < sim.NP; i++) { if (sim.st[i] === 5 || sim.st[i] === 0 || sim.lv[i] !== 0 || touched.has(i)) continue; for (const d of discs) if (Math.hypot(sim.x[i] - d.x, sim.z[i] - d.z) < d.r) { touched.add(i); break; } }
    }
  }
  const agents = plan.agents.reduce((a, g) => a + g.n, 0) + (plan.ratp ? AGENTS_RATP : 0) + (plan.vagues - 1) * AGENTS_PAR_VAGUE;
  return { rouge: dur4 > 60, duree_rouge_s: dur4, non_sortis: sim.stats.inside, zone_danger: touched.size, t95_s: sim.t95 === null ? null : Math.round(sim.t95), agents, densite_max: +dmax.toFixed(1), dans_arena: sim.stats.inside };
}

parentPort.on('message', (m) => {
  try { parentPort.postMessage({ id: m.id, note: jouer(m.plan, m.variante, m.graine, m.duree) }); }
  catch (e) { parentPort.postMessage({ id: m.id, erreur: String(e && e.stack || e) }); }
});
