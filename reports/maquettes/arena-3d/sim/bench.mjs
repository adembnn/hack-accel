// Banc d'essai du moteur de foule : `node sim/bench.mjs` (depuis reports/maquettes/arena-3d/, scene.json produit par recuperer-osm.sh).
// Scénario « métro 12 fermé par la police » : graine 22102026, coup de sifflet T=0, métro fermé à T=120 s.
//   (a) aucune réaction ; (b) à T=150 s, 12 agents de l'équipe Parvis redirigent vers tramEst et la fréquence passe à 180 s.
// Code de sortie 1 si un contrôle échoue : personne dans un mur, personne absorbé par une bouche fermée, tout le monde sorti à T=1800.
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildWorld, Sim, TARGETS, DT } from './arena-sim.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const scenePath = path.join(here, '..', 'scene.json');
if (!fs.existsSync(scenePath)) { console.error('scene.json introuvable : lancer `sh recuperer-osm.sh` dans reports/maquettes/arena-3d/'); process.exit(1); }
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
const LEV_STATION = { code: 'C1', id: 'C1-station-12', nom: 'Station Porte de la Chapelle (ligne 12, toute la station)', type: 'station', x: -110, z: 205, niveau: 0, etat: 'ouvert' };
const SEED = 22102026, T_END = 1800, T_CLOSE = 120, T_REACT = 150;
let failures = 0;
const check = (ok, msg) => { console.log((ok ? 'OK    ' : 'ECHEC ') + msg); if (!ok) failures++; };
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const wallHits = sim => { // personnes dont le centre est dans une cellule mur
  let n = 0;
  for (let i = 0; i < sim.N; i++) {
    const st = sim.st[i]; if (st === 0 || st === 4 || st === 5) continue;
    const cx = Math.floor(sim.x[i] + 200), cz = Math.floor(sim.z[i] + 130);
    if (cx < 0 || cz < 0 || cx >= 460 || cz >= 400 || sim.eng.solid[sim.lv[i] * 184000 + cz * 460 + cx]) n++;
  }
  return n;
};
const maxDiff = (a, b) => { let d = 0; for (let c = 0; c < a.length; c++) { if (a[c] === b[c]) continue; if (a[c] === Infinity || b[c] === Infinity) return Infinity; d = Math.max(d, Math.abs(a[c] - b[c])); } return d; };

console.log('== Construction du monde ==');
const tw = performance.now();
const world = buildWorld(scene);
console.log(`monde : ${Math.round(performance.now() - tw)} ms au total (géométrie ${world.info.geometryMs} ms, distances aux murs ${world.info.distanceMs} ms, 6 cartes de pentes ${world.info.fieldMs.join('/')} ms) ; ${world.info.seats} places-maille, ${world.info.places} places estimées`);
console.log(`bouches de métro retenues (< 300 m) : ${world.sinks.filter(s => s.kind === 'metro').map(s => s.name).join(' ; ')}`);

// ---------- Recalcul incrémental : mesure et comparaison avec un recalcul complet ----------
console.log('\n== Recalcul des champs touchés (mesure) ==');
{
  const sim = new Sim(world, { seed: SEED });
  const ref = sim.eng.f.map(a => a.slice());
  const recs = [
    sim.setGate('Porte Parvis Centre', false), sim.setGate('Porte Parvis Centre', true),
    sim.setVomitoire(3, false), sim.setBarrage('bd Ney est', true), sim.setMetroEntrance(0, false), sim.setMetroStation(false),
    (sim.addDangerZone({ level: 0, x: 0, z: 90, r: 12 }), sim.lastRecalc),
  ];
  for (const r of recs) console.log(`  ${r.what.padEnd(34)} ${String(r.ms).padStart(6)} ms  champs recalculés : ${r.fields.length}/6  cellules invalidées : ${Object.values(r.invalidatedByField).reduce((a, b) => a + b, 0)}`);
  let worst = 0;
  const tmp = sim.eng.clone();
  TARGETS.forEach((_, t) => {
    const t0 = performance.now(); tmp.fullCompute(t); const dt = performance.now() - t0;
    const d = maxDiff(sim.eng.f[t], tmp.f[t]); worst = Math.max(worst, d);
    console.log(`  champ ${TARGETS[t].padEnd(10)} recalcul complet ${f1(dt)} ms ; écart incrémental / complet = ${d}`);
  });
  check(worst < 1e-6, `recalcul incrémental identique au recalcul complet après 7 changements (écart max ${worst})`);
  // retour à l'état initial : tout rouvrir doit redonner les champs d'origine
  sim.setGate('Porte Parvis Centre', true); sim.setVomitoire(3, true); sim.setBarrage('bd Ney est', false); sim.setMetroStation(true); sim.removeDangerZone(1);
  const back = Math.max(...TARGETS.map((_, t) => maxDiff(sim.eng.f[t], ref[t])));
  check(back < 1e-6, `tout rouvrir redonne les cartes d'origine (écart max ${back})`);
}

// ---------- Scénario ----------
function run(label, react) {
  console.log(`\n== Run (${label}) ==`);
  const sim = new Sim(world, { seed: SEED });
  console.log(`population : ${sim.NP} personnes (${world.info.places} places estimées, remplissage ${f1(100 * sim.NP / world.info.places)} %)`);
  // 12 agents de l'équipe Parvis, posés à 18 m devant les portes (estimé), actifs seulement quand on leur ordonne
  for (let k = 0; k < 12; k++) sim.addSteward({ x: -55 + 10 * k, z: 72, level: 0, team: 'Parvis' });
  const res = { label, inside: {}, recalc: [], pref: null, quay: { maxWait: [0, 0], wait15: [0, 0], integral: 0, lastBoard: 0 } };
  let violWall = 0, tStep = 0, nStep = 0, tPeak = 0, peakWindow = [];
  const quays = sim.sinks.filter(s => s.kind === 'tram');
  const steps = Math.round(T_END / DT);
  for (let s = 0; s < steps; s++) {
    const T = s * DT; // temps avant le pas
    if (Math.abs(T - T_CLOSE) < 1e-9) { sim.apply(LEV_STATION); res.recalc.push(sim.lastRecalc); }
    if (react && Math.abs(T - T_REACT) < 1e-9) {
      sim.orderSteward('Parvis', { type: 'redirect', target: 'tramEst', radius: 15 });
      sim.setTramHeadway(180);
    }
    const t0 = performance.now(); sim.step(); const ms = performance.now() - t0;
    tStep += ms; nStep++; peakWindow.push(ms); if (peakWindow.length === 100) { const m = peakWindow.reduce((a, b) => a + b, 0) / 100; if (m > tPeak) tPeak = m; peakWindow = []; }
    violWall += wallHits(sim);
    quays.forEach((q, k) => { res.quay.maxWait[k] = Math.max(res.quay.maxWait[k], q.wait.length); res.quay.integral += q.wait.length * DT; });
    const k = s + 1;
    if (k === 1100) { // juste avant la fermeture du métro : cible visée par ceux qui marchent
      const c = new Array(6).fill(0); let n = 0;
      for (let i = 0; i < sim.NP; i++) if (sim.st[i] === 1 && sim.tgt[i] >= 0) { c[sim.tgt[i]]++; n++; }
      res.pref = c.map(v => Math.round(100 * v / n));
    }
    if (k === 3000) res.inside.i5 = sim.snapshot().counters.inside;
    if (k === 6000) res.inside.i10 = sim.snapshot().counters.inside;
    if (k === 9000) { res.inside.i15 = sim.snapshot().counters.inside; quays.forEach((q, j) => { res.quay.wait15[j] = q.wait.length; }); }
  }
  res.quay.lastBoard = Math.max(...quays.map(q => q.lastTrain));
  const snap = sim.snapshot(), c = snap.counters;
  res.sim = sim; res.snap = snap;
  res.ms = { mean: tStep / nStep, peak: tPeak };
  res.viol = {
    wall: violWall, flag: sim.violations || 0, inside: c.inside, alive: sim.total - sim.nOut,
    metroAfter: sim.absorbLog.filter(a => /^Métro/.test(a.sink) && a.t > T_CLOSE + DT).length,
  };
  return res;
}

const runs = [run('a : aucune réaction', false), run('b : agents Parvis -> tramEst + fréquence 180 s', true)];

// ---------- Tableau ----------
console.log('\n== Résultats (graine ' + SEED + ') ==');
const row = (name, fn) => console.log(name.padEnd(50) + runs.map(r => String(fn(r)).padStart(26)).join(''));
console.log(''.padEnd(50) + ['(a) aucune réaction', '(b) Parvis -> tramEst'].map(s => s.padStart(26)).join(''));
row('cible visée à T=110 s (% metro/trO/trE/sud/est/nord)', r => r.pref.join('/'));
row('dans l\'Arena à 5 min', r => r.inside.i5);
row('dans l\'Arena à 10 min', r => r.inside.i10);
row('dans l\'Arena à 15 min', r => r.inside.i15);
row('temps pour 95 % sortis de l\'Arena (s)', r => r.sim.t95 === null ? 'jamais' : f1(r.sim.t95));
row('densité max (pers./m², moyenne 0,5 s)', r => f1(r.sim.dmax));
row('lieu de la densité max', r => { const a = r.sim.dmaxAt; return a ? `niv.${a.level} (${a.x};${a.z}) t=${a.t}` : '-'; });
row('personnes·s au-dessus de 4 pers./m²', r => Math.round(r.sim.exposure));
for (const t of TARGETS) row('absorbés par ' + t + ' (à T=1800)', r => r.snap.counters.byTarget[t]);
row('encore dehors, en attente (quais) à T=1800', r => r.viol.alive);
row('file max au quai tramOuest / tramEst', r => r.quay.maxWait.join(' / '));
row('file au quai à 15 min tramOuest / tramEst', r => r.quay.wait15.join(' / '));
row('personnes·s d\'attente aux quais', r => Math.round(r.quay.integral));
row('dernière rame (s)', r => f1(r.quay.lastBoard));
row('ms par pas (moyenne / pire fenêtre de 100)', r => `${f1(r.ms.mean)} / ${f1(r.ms.peak)}`);
row('recalcul du champ métro à la fermeture (ms)', r => r.recalc[0] ? r.recalc[0].ms : '-');
console.log('\nalertes levées (run b, 12 premières) :');
for (const a of runs[1].sim.alertLog.slice(0, 12)) console.log('  t=' + a.t + ' ' + a.type + ' ' + a.where + ' valeur=' + a.value);
const types = ['densite>4', 'densite>5', 'lien_sature', 'porte_fermee_file'];
console.log('alertes par type (a / b) : ' + types.map(t => `${t} ${runs[0].sim.alertLog.filter(a => a.type === t).length}/${runs[1].sim.alertLog.filter(a => a.type === t).length}`).join(' ; '));

// ---------- Contrôle de la fermeture d'une seule bouche (les deux runs ci-dessus ferment tout avant la première arrivée) ----------
console.log('\n== Run (c) : bouche 0 fermée à T=200 s, bouche 1 reste ouverte, 600 s ==');
const rc = (() => {
  const sim = new Sim(world, { seed: SEED });
  let hits = 0;
  for (let s = 0; s < 6000; s++) {
    if (s === 2000) sim.apply({ code: 'C1', id: 'C1-metro-1', type: 'metro', x: sim.sinks[0].x, z: sim.sinks[0].z });
    sim.step(); hits += wallHits(sim);
  }
  const per = n => sim.absorbLog.filter(a => a.sink === sim.sinks[n].name);
  return { sim, hits, before0: per(0).filter(a => a.t <= 200.05).length, after0: per(0).filter(a => a.t > 200.05).length, all1: per(1).length, closedFlag: sim.violations || 0 };
})();
console.log(`  bouche 0 (${rc.sim.sinks[0].name}) : ${rc.before0} absorbés avant T=200, ${rc.after0} après ; bouche 1 (${rc.sim.sinks[1].name}) : ${rc.all1} absorbés ; recalcul ${rc.sim.lastRecalc.ms} ms`);
check(rc.after0 === 0 && rc.closedFlag === 0, '(c) personne absorbé par la bouche fermée après sa fermeture');
check(rc.before0 > 0 && rc.all1 > 0, '(c) la fermeture a un sens : la bouche 0 avait absorbé du monde avant, la bouche 1 en absorbe encore');
check(rc.hits === 0, '(c) 0 personne dans un mur');

// ---------- API temps réel : essais rapides ----------
console.log('\n== API temps réel (essais courts) ==');
{
  // agent qui ferme une porte
  const sim = new Sim(world, { seed: SEED });
  const id = sim.addSteward({ x: -5, z: 70, level: 0, team: 'T' });
  sim.orderSteward(id, { type: 'close', element: 'Porte Parvis Centre' });
  let tClose = null; const gate = sim.gates.find(g => g.name === 'Porte Parvis Centre'); let hits = 0;
  for (let s = 0; s < 1500 && tClose === null; s++) { sim.step(); hits += wallHits(sim); if (!gate.open) tClose = sim.T; }
  console.log(`  agent -> close(Porte Parvis Centre) : porte fermée à T=${tClose === null ? 'jamais' : f1(tClose)} s (radio 5-15 s + marche), recalcul ${sim.lastRecalc ? sim.lastRecalc.ms : '-'} ms`);
  check(tClose !== null && tClose < 100, 'un agent envoyé fermer une porte la ferme après marche réelle');
  check(hits === 0, 'fermeture pendant la marche : 0 personne dans un mur');
}
{
  // retenir une tribune + annonce sono
  const sim = new Sim(world, { seed: SEED });
  const n = sim.holdSector('haute', 200);
  for (let s = 0; s < 1500; s++) { if (s === 800) sim.announce('tout', 'tramEst'); sim.step(); }
  let haut = 0, moved = 0; for (let i = 0; i < sim.NP; i++) if (sim.tier[i] === 2) { haut++; if (sim.st[i] !== 0) moved++; }
  check(moved === 0 || sim.T < 200, `holdSector('haute', 200) : ${n} personnes retenues, ${moved}/${haut} partis avant T=150`);
  for (let s = 0; s < 1000; s++) sim.step();
  const c = new Array(6).fill(0); let tot = 0;
  for (let i = 0; i < sim.NP; i++) if ((sim.st[i] === 1 || sim.st[i] === 3) && sim.tgt[i] >= 0) { c[sim.tgt[i]]++; tot++; }
  const share = c[2] / tot;
  console.log(`  announce('tout', 'tramEst') à T=80 : à T=230, ${Math.round(100 * share)} % visent tramEst (80 % d'obéissance estimée ; hors annonce : 12 %)`);
  check(share > 0.4, 'l\'annonce redirige la majorité vers tramEst');
  for (let s = 0; s < 1700; s++) sim.step();
  let anyHaut = 0; for (let i = 0; i < sim.NP; i++) if (sim.tier[i] === 2 && sim.st[i] === 0) anyHaut++;
  check(anyHaut === 0, 'la tribune retenue est bien partie après T=200 (tous levés à T=400)');
}
{
  // zone de danger et fermeture des 3 portes du parvis : alertes
  const sim = new Sim(world, { seed: SEED });
  const f0 = sim.eng.f.map(a => a.slice());
  const zid = sim.addDangerZone({ level: 0, x: -5, z: 90, r: 14 });
  const cz = Math.floor(90 + 130) * 460 + Math.floor(-5 + 200);
  const rise = sim.eng.f[1][cz] > f0[1][cz];
  const rz = sim.removeDangerZone(zid);
  const back = Math.max(...TARGETS.map((_, t) => maxDiff(sim.eng.f[t], f0[t])));
  console.log(`  zone de danger : pose ${sim.recalcLog[0].ms} ms, retrait ${rz.ms} ms, coût dans la zone ${rise ? 'augmenté' : 'inchangé'}`);
  check(rise && back < 1e-6, 'zone de danger : le coût monte dans la zone et le retrait redonne les cartes d\'origine');
  for (let s = 0; s < 2200; s++) {
    if (s === 1500) for (const g of ['Porte Parvis Ouest', 'Porte Parvis Centre', 'Porte Parvis Est']) sim.setGate(g, false);
    sim.step();
  }
  const kinds = new Set(sim.alertLog.map(a => a.type));
  console.log('  3 portes du hall fermées à T=150 : alertes levées = ' + [...kinds].join(', ') + ' ; dehors/dedans ' + sim.snapshot().counters.inside + ' dedans');
  check(kinds.has('porte_fermee_file') || kinds.has('lien_sature'), 'portes fermées avec file : une alerte est levée');
}

console.log('\n== apply(levier) : un levier de chaque code ==');
{
  const sim = new Sim(world, { seed: SEED }); const f0 = sim.eng.f.map(a => a.slice());
  const levs = [
    { code: 'C1', id: 'C1-tram-1', type: 'tram', x: -165.4, z: 146.9 }, { code: 'C1', id: 'C1-metro-2', type: 'metro', x: -95.8, z: 228.3 },
    { code: 'B1', id: 'B1-entree', type: 'issue', x: -4, z: 54, largeur: 20 }, { code: 'B1', id: 'B1-vomitoire-1', type: 'vomitoire', x: -16, z: -33 },
    { code: 'B3', id: 'B3-escalator-1', type: 'escalator', x: -5, z: 46 }, { code: 'B5', id: 'B5-ascenseur-1', type: 'ascenseur', x: 0, z: 0 },
    { code: 'D1', id: 'D1-zone-1', type: 'zone', x: 5, z: 86, poly: [-60, 58, 70, 58, 70, 115, -60, 115] }, { code: 'D5', id: 'D5-colis', type: 'point', x: 100, z: 100, rayon: 50, duree_min: 1 },
    { code: 'F1', id: 'F1-annonce', type: 'parametre', retard_min: 2 },
  ];
  for (const l of levs) { const r = sim.apply(l); console.log(`  ${l.code} ${l.id.padEnd(16)} appliqué=${r.applied} ${r.recalcMs ? r.recalcMs + ' ms ' : ''}${r.detail}`); }
  for (let s = 0; s < 650; s++) sim.step();
  check(sim.zones.length === 1, 'D5 : la zone fermée est levée automatiquement après duree_min (1 min)');
  for (const l of [...levs].reverse()) sim.apply(l, false);
  const back = Math.max(...TARGETS.map((_, t) => maxDiff(sim.eng.f[t], f0[t])));
  check(back < 1e-6 && sim.infoDelay === 0, `lever tous les leviers redonne les cartes d'origine (écart ${back})`);
}

console.log('\n== Contrôles automatiques ==');
for (const r of runs) {
  const L = r.label.slice(0, 1);
  check(r.viol.wall === 0, `(${L}) 0 personne dans un mur (${r.viol.wall} observations sur ${T_END / DT} pas)`);
  check(r.viol.metroAfter === 0 && r.viol.flag === 0, `(${L}) personne absorbé par une bouche fermée après T=${T_CLOSE} s (${r.viol.metroAfter} cas)`);
  check(r.viol.inside === 0, `(${L}) tout le monde sorti de l'Arena à T=${T_END} s (${r.viol.inside} encore dedans)`);
  const sum = Object.values(r.snap.counters.byTarget).reduce((a, b) => a + b, 0);
  check(sum + r.viol.alive === r.sim.total, `(${L}) conservation : ${sum} absorbés + ${r.viol.alive} dehors en attente = ${r.sim.total}`);
}
const d = Math.abs(runs[0].snap.counters.byTarget.tramEst - runs[1].snap.counters.byTarget.tramEst);
check(d > 0, `le run (b) diffère du run (a) (tramEst : ${runs[0].snap.counters.byTarget.tramEst} contre ${runs[1].snap.counters.byTarget.tramEst})`);
check(Math.max(runs[0].ms.peak, runs[1].ms.peak) < 15, `moins de 15 ms par pas à 7 000 personnes (pire fenêtre ${f1(Math.max(runs[0].ms.peak, runs[1].ms.peak))} ms)`);
console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent');
process.exit(failures ? 1 : 0);
