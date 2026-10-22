// Bench : 5 000 personnes sur 2 niveaux (100 x 60 m chacun), pas de 0,1 s. Lancer : node src/sim/motion/bench.ts
import { CrowdSim } from './crowd.ts';
import { buildTestBuilding } from './testgrid.ts';

const N = Number(process.argv[2] ?? 5000);
const STEPS = Number(process.argv[3] ?? 600);
const grid = buildTestBuilding({ width: 200, height: 120, doors: 8, doorWidthCells: 6, escalators: 3, stairs: 2 });
const sim = new CrowdSim(grid, { seed: 42, capacity: N + 16 });
sim.spawnRandom(N);
for (let k = 0; k < 20; k++) sim.step(); // échauffement JIT
const times: number[] = [];
for (let k = 0; k < STEPS; k++) {
  const t0 = performance.now();
  sim.step();
  times.push(performance.now() - t0);
}
const sorted = [...times].sort((a, b) => a - b);
const mean = times.reduce((a, b) => a + b, 0) / times.length;
const first100 = times.slice(0, 100).reduce((a, b) => a + b, 0) / 100;
const st = sim.stats();
console.log(`Bench ${N} personnes, ${grid.levels} niveaux, ${STEPS} pas de ${sim.dt} s (${process.version})`);
console.log(`  moyenne ${mean.toFixed(2)} ms/pas ; 100 premiers pas (tous présents) ${first100.toFixed(2)} ms ; p95 ${sorted[Math.floor(0.95 * sorted.length)].toFixed(2)} ms ; max ${sorted[sorted.length - 1].toFixed(2)} ms`);
console.log(`  état : ${st.alive} à pied, ${st.riding} sur escalator/escalier, ${st.exited} sortis ; densité max ${st.maxDensity.toFixed(2)} pers./m2, pression max ${st.maxPressure.toFixed(3)}`);
let bad = 0;
for (let i = 0; i < sim.n; i++) if (sim.state[i] === 0 && !sim.inWalkable(i)) bad++;
console.log(`  personnes hors cellule praticable : ${bad}`);
console.log(`  budget 8 ms/pas : ${first100 <= 8 ? 'ATTEINT' : 'NON ATTEINT'} (pas moyen avec les 5 000 présents)`);
