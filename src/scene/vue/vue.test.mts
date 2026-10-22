// Tests de la logique pure de la vue et du raccord MotionGrid : node --test src/scene/vue/vue.test.mts (sans WebGL, sans réseau).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lireNavgrid } from '../navgrid.ts';
import { versMotionGrid, cellule } from '../motiongrid.ts';
import { altitude, camera, epingleSousCurseur, epingleVisible, nomsDeRues, paires, positionEpingle, projeterEcran } from './projection.ts';
import type { Scene } from '../types.ts';

const dossier = resolve(import.meta.dirname, '..');
const ng = lireNavgrid(readFileSync(resolve(dossier, 'navgrid.json'), 'utf8'));
const scene: Scene = JSON.parse(readFileSync(resolve(dossier, 'scene.json'), 'utf8'));

test('versMotionGrid : niveaux réels, dimensions propres à chaque niveau, tableaux partagés, mètres', () => {
  const mg = versMotionGrid(ng);
  assert.equal(mg.cellSize, 0.5);
  assert.deepEqual(mg.levels.map((n) => n.niveau), [0, -1, -2, -3, -4, -5]);
  const rue = mg.levels[0], sous = mg.levels[1];
  assert.ok(rue.width * rue.height > sous.width * sous.height, 'la grille de rue n’est pas recopiée sur les niveaux souterrains');
  assert.notEqual(rue.width, sous.width);
  for (const [i, n] of mg.levels.entries()) {
    assert.ok(n.walkable instanceof Uint8Array && n.walkable === ng.niveaux[i].data, 'tableau partagé, non copié');
    assert.equal(n.walkable.length, n.width * n.height);
    assert.equal(n.originX, ng.niveaux[i].x0);
  }
  assert.equal(mg.exits.length, ng.sorties.length);
  assert.equal(mg.links.length, ng.liens.length);
  const s = ng.sorties[0], e = mg.exits[0];
  assert.deepEqual([e.x, e.z, e.level, e.kind], [s.x, s.y, s.niveau, s.genre]);
  assert.ok(mg.links.some((l) => l.estimated) && mg.links.every((l) => l.from.level !== l.to.level));
});

test('cellule : un point en mètres retombe sur une cellule praticable, hors grille = null', () => {
  const mg = versMotionGrid(ng), p = ng.portes.find((q) => q.niveau === 0)!;
  const c = cellule(mg.levels[0], mg.cellSize, p.x, p.y)!;
  assert.ok(c && mg.levels[0].walkable[c.index] > 0);
  assert.equal(cellule(mg.levels[0], mg.cellSize, 1e6, 0), null);
});

test('altitudes, caméras et visibilité des niveaux', () => {
  assert.equal(altitude(0, 2.2), 0);
  assert.equal(altitude(-2, 2), -24);
  assert.equal(altitude(1, 2), 4);
  for (const n of ['orbit', 'top', 'cut', 'forum'] as const) assert.equal(camera(n).position.length, 3);
  assert.ok(camera('top').position[1] > camera('orbit').position[1] && camera('cut').position[1] < 0);
  assert.equal(epingleVisible({ niveau: -3, type: 'issue' }, 'all'), true);
  assert.equal(epingleVisible({ niveau: -1, type: 'issue' }, -3), false);
  assert.equal(epingleVisible({ niveau: -1, type: 'porte' }, -3), true, 'portes et ascenseurs restent visibles sous terre');
  assert.equal(epingleVisible({ niveau: 0, type: 'bouche' }, 0), true);
  assert.deepEqual(paires([0, 0, 1, 1, 0, 0]), [[0, 0], [1, 1]], 'anneau fermé : dernier point dédoublé retiré');
});

// Caméra fictive : vue du dessus orthographique 100 m x 100 m centrée en (0,0), x -> droite, z -> bas de l'écran (colonne par colonne).
const vp = [0.02, 0, 0, 0, 0, 0, 0, 0, 0, -0.02, 0, 0, 0, 0, 0, 1];
test('projection leviers -> écran : centre, bords, hors champ, derrière la caméra', () => {
  const c = projeterEcran(vp, { x: 0, y: 10, z: 0 }, 800, 600);
  assert.deepEqual([c.x, c.y, c.visible], [400, 300, true]);
  const bord = projeterEcran(vp, { x: 25, y: 0, z: 25 }, 800, 600);
  assert.deepEqual([bord.x, bord.y, bord.visible], [600, 450, true]);
  assert.equal(projeterEcran(vp, { x: 500, y: 0, z: 0 }, 800, 600).visible, false);
  assert.equal(projeterEcran([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1], { x: 0, y: 0, z: 0 }, 800, 600).visible, false, 'w <= 0');
});

test('épingle sous le curseur : la plus proche dans le rayon, invisibles ignorées', () => {
  const l = { id: 'porte-0', ecran: { x: 100, y: 100, visible: true } }, m = { id: 'bouche-3', ecran: { x: 110, y: 100, visible: true } };
  assert.equal(epingleSousCurseur([l, m], 108, 100), 'bouche-3');
  assert.equal(epingleSousCurseur([l, m], 300, 300), null);
  assert.equal(epingleSousCurseur([{ ...l, ecran: { ...l.ecran, visible: false } }], 100, 100), null);
});

test('position des épingles : portes et ascenseurs suivent leur niveau, les autres restent à la surface ; noms de rues', () => {
  const p = positionEpingle({ x: 1, z: 2, niveau: -3, type: 'porte' }, 2);
  assert.deepEqual([p.x, p.z, p.base, p.y], [1, 2, -36, -36 + 14]);
  assert.equal(positionEpingle({ x: 1, z: 2, niveau: -3, type: 'issue' }, 2).base, 0);
  const noms = nomsDeRues(scene.rues);
  assert.ok(noms.length >= 10 && noms.length <= 22 && new Set(noms.map((n) => n.n)).size === noms.length);
});
