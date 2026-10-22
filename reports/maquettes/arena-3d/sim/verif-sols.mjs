// Contrôle headless des sols : `node sim/verif-sols.mjs [secondes]` depuis reports/maquettes/arena-3d/.
// Joue une évacuation complète avec le vrai scene.json et compte, à chaque seconde simulée :
//  - dehors : personnes dessinées à un niveau > 0 hors de l'emprise de l'Arena ;
//  - sol    : personnes dont le y dessiné ne correspond à aucun sol réel (world.floorY si le moteur l'expose, sinon ALT) ;
//  - chevauchement : paires de personnes à moins de 0,46 m (même niveau, personnes non assises) ;
//  - mur    : personnes dans une cellule mur.
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildWorld, Sim, DT } from './arena-sim.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(fs.readFileSync(path.join(here, '..', 'scene.json'), 'utf8'));
const world = buildWorld(scene);
const B = world.bounds, NCL = B.GW * B.GH;
const TEND = +(process.argv[2] || 900);
const sim = new Sim(world, { seed: 22102026, fill: 1 });
const arena = scene.batiments.find(b => b.n === 'Adidas Arena').p;
const inPoly = (x, z) => { let c = false; for (let i = 0, j = arena.length / 2 - 1; i < arena.length / 2; j = i++) { const xi = arena[2 * i], zi = arena[2 * i + 1], xj = arena[2 * j], zj = arena[2 * j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const ALT = [0, 4, 8];
const drawY = (i) => world.drawPose ? world.drawPose(sim, i).y : ((sim.st[i] === 0 || sim.lv[i] > 0) && sim.sy[i] ? sim.sy[i] : ALT[sim.lv[i]]);
const floorOK = (i, y) => {
  if (sim.st[i] === 4) { const c = sim.rideDown[i], a = world.floorY(sim.lv[i], sim.x[i], sim.z[i]), b = world.floorY(Math.floor(c / NCL), B.X0 + ((c % NCL) % B.GW) + 0.5, B.Z0 + Math.floor((c % NCL) / B.GW) + 0.5); return y >= Math.min(a, b) - 0.01 && y <= Math.max(a, b) + 0.01; }
  const f = world.floorY(sim.lv[i], sim.x[i], sim.z[i]);
  return Math.abs(f - y) < (sim.st[i] === 0 ? 0.6 : 0.35); // assis : marche de leur propre rang (la cellule peut appartenir à la tribune voisine)
};
const chevK = {}, chevAt = [];
let dehors = 0, sol = 0, chev = 0, mur = 0, obs = 0, maxdehors = 0;
const steps = Math.round(TEND / DT);
for (let s = 0; s < steps; s++) {
  sim.step();
  if (s % 10) continue;
  const act = [];
  for (let i = 0; i < sim.NP; i++) {
    const st = sim.st[i]; if (st === 5) continue; obs++;
    const l = sim.lv[i], x = sim.x[i], z = sim.z[i];
    if (l > 0 && !inPoly(x, z)) dehors++;
    const y = drawY(i);
    if (!floorOK(i, y)) sol++;
    if (st === 0 || st === 4) continue;
    const cx = Math.floor(x - B.X0), cz = Math.floor(z - B.Z0);
    if (sim.eng.solid[l * NCL + cz * B.GW + cx]) mur++;
    act.push(i);
  }
  const buckets = new Map();
  for (const i of act) { const k = sim.lv[i] + ':' + Math.floor(sim.x[i] / 0.5) + ':' + Math.floor(sim.z[i] / 0.5); (buckets.get(k) || buckets.set(k, []).get(k)).push(i); }
  for (const i of act) {
    const bx = Math.floor(sim.x[i] / 0.5), bz = Math.floor(sim.z[i] / 0.5);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const j of buckets.get(sim.lv[i] + ':' + (bx + a) + ':' + (bz + b)) || []) if (j > i && Math.hypot(sim.x[i] - sim.x[j], sim.z[i] - sim.z[j]) < 0.46) { chev++; const k = (sim.st[i] === 3 || sim.st[j] === 3) ? 'file' : 'marche'; chevK[k] = (chevK[k] || 0) + 1; if (k === 'marche' && chevAt.length < 8) chevAt.push([+(sim.T).toFixed(0), sim.lv[i], +sim.x[i].toFixed(1), +sim.z[i].toFixed(1)]); }
  }
}
console.log(`T=${TEND}s, ${sim.NP} personnes, ${obs} observations (1 par seconde simulée)`);
console.log(`dehors a niveau>0 : ${dehors}\nsol incorrect      : ${sol}\nchevauchements<0,46: ${chev}\ndans un mur        : ${mur}`);
console.log('détail chevauchements', JSON.stringify(chevK), JSON.stringify(chevAt));
process.exit(dehors + sol + mur === 0 ? 0 : 1);
