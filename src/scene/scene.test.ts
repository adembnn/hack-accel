// Tests du lot jumeau-3d (prototype) : node --test src/scene/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { lireNavgrid, Navigation, composantes, serialiserNavgrid, NIVEAUX } from './navgrid.ts';
import { BusContraintes, validerContrainte } from './contrainte.ts';
import type { Contrainte } from './contrainte.ts';
import type { Scene } from './types.ts';
import { genererScene, produireNavgrid } from './generer.ts';

const dossier = import.meta.dirname;
const scene: Scene = JSON.parse(readFileSync(resolve(dossier, 'scene.json'), 'utf8'));
const ng = lireNavgrid(readFileSync(resolve(dossier, 'navgrid.json'), 'utf8'));
const depart = ng.sorties.find((s) => s.genre === 'rue')!;

test('scene.json : niveaux 0 à -5, rues, bâtiments, sources citées', () => {
  assert.deepEqual(scene.niveaux.map((n) => n.niveau), [0, -1, -2, -3, -4, -5]);
  assert.ok(scene.batiments.length > 1000, 'bâtiments BD TOPO');
  assert.ok(scene.rues.length > 1000, 'rues OSM dans ~1 km');
  assert.ok(scene.sources.some((s) => s.includes('OpenStreetMap')) && scene.sources.some((s) => s.includes('IGN')));
  assert.equal(scene.niveaux[0].estime, false);
  for (const n of scene.niveaux.slice(1)) assert.ok(n.raison.length > 10, `niveau ${n.niveau} sans raison`);
  assert.ok(scene.niveaux.some((n) => n.estime), 'au moins un niveau intérieur doit être marqué estime:true (honnêteté)');
});

test('portes et liens : largeur, état, identifiants uniques, valeurs par défaut marquées estime', () => {
  const tous = [...scene.portes, ...scene.metro, ...scene.escalators, ...scene.escaliers, ...scene.ascenseurs];
  assert.equal(new Set(tous.map((o) => o.id)).size, tous.length, 'identifiants uniques');
  for (const o of tous) {
    assert.ok(o.largeur_m > 0, `${o.id} largeur`);
    assert.ok(['ouverte', 'fermee', 'bloquee'].includes(o.etat), `${o.id} état`);
  }
  assert.ok(tous.some((o) => o.estime), 'des valeurs estimées existent et sont marquées');
  assert.ok(scene.escalators.length > 20 && scene.escaliers.length > 20 && scene.ascenseurs.length >= 1);
});

test('grille 0,5 m : une seule composante connexe par niveau', () => {
  assert.equal(ng.cellule_m, 0.5);
  assert.deepEqual(ng.niveaux.map((n) => n.niveau), [...NIVEAUX]);
  for (const n of ng.niveaux) {
    assert.ok(n.data.some((v) => v > 0), `niveau ${n.niveau} vide`);
    assert.equal(composantes(n), 1, `niveau ${n.niveau} : grille non connexe`);
  }
});

test('tous les niveaux sont atteignables depuis la rue par les liens verticaux', () => {
  const a = new Navigation(ng).accessibles(depart.niveau, depart.x, depart.y);
  for (const n of NIVEAUX) assert.ok((a.par_niveau[n] ?? 0) > 0, `niveau ${n} inatteignable depuis la rue`);
  const total = ng.niveaux.reduce((s, n) => s + n.data.filter((v) => v > 0).length, 0);
  // les rares cellules non visitées sont celles de portes déjà fermées dans OSM (access=no/private)
  assert.ok(a.cellules_visitees >= total * 0.999, `la grille doit former un seul réseau (${a.cellules_visitees}/${total})`);
});

test('portes, sorties et extrémités des liens sont sur une cellule praticable', () => {
  const nav = new Navigation(ng);
  assert.ok(ng.portes.length > 100 && ng.sorties.length > 20);
  for (const p of ng.portes) assert.ok(nav.niveau(p.niveau).data[nav.indice(p.niveau, p.x, p.y)] > 0, `porte ${p.id} hors grille`);
  for (const s of ng.sorties) assert.ok(nav.niveau(s.niveau).data[nav.indice(s.niveau, s.x, s.y)] > 0, `sortie ${s.id} hors grille`);
  for (const l of ng.liens) {
    assert.notEqual(l.de.niveau, l.vers.niveau);
    assert.ok(nav.niveau(l.de.niveau).data[nav.indice(l.de.niveau, l.de.x, l.de.y)] > 0, `${l.id} départ`);
    assert.ok(nav.niveau(l.vers.niveau).data[nav.indice(l.vers.niveau, l.vers.x, l.vers.y)] > 0, `${l.id} arrivée`);
  }
  assert.ok(ng.liens.some((l) => l.estime), 'les liens estimés restent marqués');
});

test('événement contrainte : fermer une sortie la coupe, la rouvrir la rétablit', () => {
  const nav = new Navigation(ng);
  const bus = new BusContraintes();
  nav.brancher(bus);
  const avant = nav.accessibles(depart.niveau, depart.x, depart.y);
  const cible = ng.sorties.find((s) => s.id !== depart.id && s.genre === 'rue' && avant.sorties_atteintes.includes(s.id))!;
  const porte = ng.portes.find((p) => p.id === cible.id)!;
  const c: Contrainte = { id: porte.id, type: 'sortie', niveau: porte.niveau, x: porte.x, y: porte.y, largeur_m: porte.largeur_m, etat: 'fermee' };
  bus.emettre(c);
  const ferme = nav.accessibles(depart.niveau, depart.x, depart.y);
  assert.ok(ferme.sorties_coupees.includes(cible.id), 'la sortie fermée doit être coupée');
  assert.ok(ferme.sorties_atteintes.length < avant.sorties_atteintes.length);
  bus.emettre({ ...c, etat: 'ouverte' });
  const rouvert = nav.accessibles(depart.niveau, depart.x, depart.y);
  assert.equal(rouvert.sorties_atteintes.length, avant.sorties_atteintes.length);
  assert.equal(bus.journal.length, 2);
});

test('événement contrainte : bloquer les liens vers le bas coupe des niveaux ; un barrage libre est accepté', () => {
  const nav = new Navigation(ng);
  const profonds = ng.liens.filter((l) => Math.min(l.de.niveau, l.vers.niveau) <= -4);
  assert.ok(profonds.length >= 1);
  const avant = nav.accessibles(depart.niveau, depart.x, depart.y);
  for (const l of profonds) nav.appliquer({ id: l.id, type: l.type, niveau: l.de.niveau, x: l.de.x, y: l.de.y, largeur_m: l.largeur_m, etat: 'bloquee' });
  const apres = nav.accessibles(depart.niveau, depart.x, depart.y);
  assert.ok(apres.cellules_visitees < avant.cellules_visitees, 'des cellules doivent devenir inaccessibles');
  assert.equal(apres.par_niveau[-4] ?? 0, 0, 'le niveau -4 est coupé quand tous ses liens sont bloqués');
  nav.appliquer({ id: 'barrage-1', type: 'barrage', niveau: 0, x: depart.x, y: depart.y, largeur_m: 4, etat: 'bloquee' });
});

test('validation du format de la contrainte (proposition de Titouan, ticket #7)', () => {
  const ok = { id: 'P-1', type: 'porte', niveau: -1, x: 1, y: 2, largeur_m: 1.2, etat: 'ouverte' };
  assert.deepEqual(validerContrainte(ok), []);
  assert.ok(validerContrainte({ ...ok, etat: 'cassee' }).length > 0);
  assert.ok(validerContrainte({ ...ok, type: 'volcan' }).length > 0);
  assert.ok(validerContrainte({ ...ok, largeur_m: 0 }).length > 0);
  assert.throws(() => new BusContraintes().emettre({ ...ok, niveau: 1.5 } as Contrainte));
});

test('appels de dessin ≤ 800 : non mesurable sans WebGL', { skip: 'mesure faite dans le navigateur (renderer.info.render.calls), voir le rapport du lot' }, () => {});

const donnees = process.env.REFUGE_DATA ?? resolve(dossier, '../../../../refuge-data/data');
test('reproductibilité : regénérer depuis les données donne exactement navgrid.json', { skip: existsSync(resolve(donnees, 'osm/voies.json')) ? false : 'données téléchargées absentes' }, () => {
  const h = (s: string): string => createHash('sha256').update(s).digest('hex');
  const ng2 = produireNavgrid(genererScene(donnees));
  assert.equal(h(serialiserNavgrid(ng2)), h(serialiserNavgrid(ng)));
});
