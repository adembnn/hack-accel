import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS5097 : Node exige l extension .ts ; le tsconfig du socle n autorise pas encore allowImportingTsExtensions
import { avancerCortege, creerCortege, cumulPolyligne, effetsCortege, individusAffichage, pointSurPolyligne, rayonCortege, routeSurRues } from './cortege.ts';
import type { Contrainte } from './types.ts';

const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];

test('pointSurPolyligne : position et cap le long de deux tronçons', () => {
  const c = cumulPolyligne(L);
  assert.deepEqual(c, [0, 100, 150]);
  const a = pointSurPolyligne(L, c, 40);
  assert.equal(a.x, 40); assert.equal(a.y, 0); assert.deepEqual(a.cap, { x: 1, y: 0 });
  const b = pointSurPolyligne(L, c, 120);
  assert.equal(b.x, 100); assert.equal(b.y, 20); assert.deepEqual(b.cap, { x: 0, y: 1 });
  assert.equal(pointSurPolyligne(L, c, 9999).y, 50); // borné à la fin
});

test('le cortège avance le long de la rue à 3 km/h puis s\'arrête à l\'arrivée', () => {
  const rues = [{ nom: 'Rue Test', pts: L }];
  let c = creerCortege({ id: 'c1', code: 'D1', depart: { x: 0, y: 0 }, arrivee: { x: 100, y: 50 }, rues });
  assert.ok(Math.abs(c.longueur_m - 150) < 1e-9);
  assert.equal(c.fini, false);
  c = avancerCortege(c, 60); // 60 s à 0,8333 m/s = 50 m
  assert.ok(Math.abs(c.x - 50) < 1e-6 && c.y === 0, `x=${c.x} y=${c.y}`);
  assert.equal(c.rue, 'Rue Test');
  c = avancerCortege(c, 60, 10); // accéléré x10
  assert.equal(c.fini, true);
  assert.deepEqual([c.x, c.y], [100, 50]);
  assert.equal(avancerCortege(c, 10), c);
});

test('Dijkstra : contourne par la rue et retombe en ligne droite sans rue', () => {
  const rues = [{ nom: 'A', pts: [{ x: 0, y: 0 }, { x: 50, y: 0 }] }, { nom: 'B', pts: [{ x: 50, y: 1 }, { x: 50, y: 40 }] }];
  const r = routeSurRues(rues, { x: 0, y: 0 }, { x: 50, y: 40 });
  assert.ok(r.length >= 3 && r[r.length - 1]!.y === 40);
  assert.equal(routeSurRues([], { x: 0, y: 0 }, { x: 9, y: 9 }).length, 2);
});

test('D2 bloque les portes proches, D1 les marque à éviter, et elles se libèrent quand le groupe s\'éloigne', () => {
  const k = (id: string, x: number): Contrainte => ({ id, type: 'porte', niveau: 0, x, y: 0, largeur_m: 2, etat: 'ouverte' });
  const base = [k('p1', 0), k('p2', 60), k('p3', 500)];
  const d2 = creerCortege({ id: 'd2', code: 'D2', effectif: 120, depart: { x: 0, y: 0 } });
  const e = effetsCortege([d2], base);
  assert.deepEqual(e.bloquees, ['p1', 'p2'].filter((id) => id === 'p1' || Math.hypot(60, 0) < d2.rayon_m + 10));
  assert.equal(e.contraintes.find((c) => c.id === 'p1')!.etat, 'bloquee');
  assert.equal(base[0]!.etat, 'ouverte'); // la base n'est pas modifiée
  const d1 = creerCortege({ id: 'd1', code: 'D1', effectif: 800, depart: { x: 0, y: 0 } });
  assert.ok(effetsCortege([d1], base).a_eviter.includes('p1'));
  assert.equal(effetsCortege([d1], base).contraintes.every((c) => c.etat === 'ouverte'), true);
  const loin = { ...d2, x: 1000, y: 1000 };
  assert.equal(effetsCortege([loin], base).bloquees.length, 0);
});

test('rayon et individus d\'affichage déterministes', () => {
  assert.ok(rayonCortege('D1', 800) >= 30 && rayonCortege('D2', 50) >= 25);
  const c = creerCortege({ id: 'x', depart: { x: 0, y: 0 } });
  assert.deepEqual(individusAffichage(c, 7), individusAffichage(c, 7));
  assert.notDeepEqual(individusAffichage(c, 7), individusAffichage(c, 8));
});
