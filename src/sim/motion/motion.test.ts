import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CrowdSim } from './crowd.ts';
import { buildDoorRoom, buildTestBuilding } from './testgrid.ts';

function doorFlow(width: number, seed: number): number {
  const s = new CrowdSim(buildDoorRoom(width), { seed });
  s.spawnRandom(200, { region: { x0: 1, y0: 1, x1: 23, y1: 18 } });
  for (let k = 0; k < 6000 && s.exited < 200; k++) s.step();
  assert.equal(s.exited, 200, 'tout le monde doit sortir');
  const t = Array.from(s.exitT.subarray(0, 200)).sort((a, b) => a - b);
  return (180 - 20) / (t[180] - t[20]) / width; // régime établi : personnes 20 à 180
}

test('débit de porte entre 1,2 et 1,8 pers./m/s (largeurs 1,0 / 1,5 / 2,0 m, 3 graines)', () => {
  for (const w of [1.0, 1.5, 2.0]) for (const seed of [1, 2, 3]) {
    const q = doorFlow(w, seed);
    console.log(`  largeur ${w} m graine ${seed} : ${q.toFixed(2)} pers./m/s`);
    assert.ok(q >= 1.2 && q <= 1.8, `débit ${q.toFixed(2)} hors de [1,2 ; 1,8]`);
  }
});

test('0 traversée de mur : 800 personnes, portes fermées puis rouvertes, chaque pas contrôlé', () => {
  const s = new CrowdSim(buildTestBuilding(), { seed: 5, capacity: 1000 });
  s.spawnRandom(800);
  let violations = 0;
  for (let k = 0; k < 3500 && s.stats().alive + s.stats().riding > 0; k++) {
    if (k === 100) s.setDoorOpen('porte0', false);
    if (k === 400) s.setDoorOpen('porte0', true);
    s.step();
    for (let i = 0; i < s.n; i++) if (s.state[i] === 0 && !s.inWalkable(i)) violations++;
  }
  assert.equal(violations, 0);
  assert.ok(s.exited === 800, `seulement ${s.exited} sortis sur 800`);
});

test('porte fermée : personne ne passe ; réouverture : le flux reprend', () => {
  const s = new CrowdSim(buildDoorRoom(1.5), { seed: 2 });
  s.spawnRandom(60, { region: { x0: 1, y0: 1, x1: 23, y1: 18 } });
  s.setDoorOpen('porte', false);
  for (let k = 0; k < 600; k++) s.step();
  assert.equal(s.exited, 0);
  assert.equal(s.stats().stuck, 60); // plus aucun chemin vers la sortie
  s.setDoorOpen('porte', true);
  for (let k = 0; k < 1500 && s.exited < 60; k++) s.step();
  assert.equal(s.exited, 60);
});

test('escalator : débit limité, arrêté il écoule moins vite', () => {
  const run = (running: boolean): number => {
    const g = buildTestBuilding({ escalators: 1, stairs: 0, doors: 2 });
    const s = new CrowdSim(g, { seed: 7, capacity: 700 });
    s.setLinkEnabled('ascenseur', false);
    s.setEscalatorRunning('escalator0', running);
    s.spawnRandom(500, { levels: [1] });
    for (let k = 0; k < 600; k++) s.step(); // 60 s
    return s.linkUsage('escalator0');
  };
  const marche = run(true), arrete = run(false);
  console.log(`  escalator en marche : ${marche} passages en 60 s ; arrêté : ${arrete}`);
  assert.ok(marche > 40 && marche <= 1.3 * 60 + 8, `passages en marche ${marche}`); // débit nominal 1,3 pers./s
  assert.ok(arrete < marche * 0.9);
});

test('ascenseurs interdits en évacuation, autorisés sinon', () => {
  const run = (evac: boolean): number => {
    // seul lien : l\'ascenseur (escalators et escaliers supprimés)
    const g = buildTestBuilding({ escalators: 0, stairs: 0 });
    const s = new CrowdSim(g, { seed: 9, capacity: 100, evacuation: evac });
    s.spawnRandom(40, { levels: [1] });
    for (let k = 0; k < 1200; k++) s.step();
    return s.linkUsage('ascenseur');
  };
  assert.equal(run(true), 0);
  assert.ok(run(false) > 0);
});

test('densité et pression : 40 personnes dans 12 m2 devant une porte fermée', () => {
  const s = new CrowdSim(buildDoorRoom(1.0), { seed: 4, capacity: 100, densityEvery: 1 });
  s.setDoorOpen('porte', false);
  s.spawnRandom(40, { region: { x0: 18, y0: 6, x1: 23, y1: 13 } });
  for (let k = 0; k < 300; k++) s.step();
  const st = s.stats();
  console.log(`  densité max ${st.maxDensity.toFixed(2)} pers./m2, pression max ${st.maxPressure.toFixed(3)}, ${st.personSecondsOver5.toFixed(1)} pers.s > 5/m2`);
  assert.ok(st.maxDensity > 2.5);
  assert.ok(s.densityAt(0, 11, 5) > 0);
  assert.ok(s.pressureAt(0, 11, 5) >= 0);
});

test('déterminisme : mêmes graines, mêmes positions', () => {
  const mk = (): CrowdSim => { const s = new CrowdSim(buildTestBuilding(), { seed: 11, capacity: 300 }); s.spawnRandom(200); for (let k = 0; k < 200; k++) s.step(); return s; };
  const a = mk(), b = mk();
  assert.deepEqual(Array.from(a.x.subarray(0, 200)), Array.from(b.x.subarray(0, 200)));
});
