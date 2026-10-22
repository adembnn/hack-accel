// Tests des leviers (lot jumeau-3d) : node --test src/scene/*.test.mts. Aucun réseau, aucune clé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lireNavgrid, Navigation } from './navgrid.ts';
import { BusContraintes, validerContrainte } from './contrainte.ts';
import type { Contrainte } from './contrainte.ts';
import type { Scene } from './types.ts';
import { construireLeviers, contraintesDe, cleDePorte, CLES_PORTES, Leviers, nomIssue } from './leviers.ts';
import type { AccesForum, DetailLevier } from './leviers.ts';

const dossier = import.meta.dirname;
const scene: Scene = JSON.parse(readFileSync(resolve(dossier, 'scene.json'), 'utf8'));
const acces: AccesForum[] = JSON.parse(readFileSync(resolve(dossier, 'acces-forum.json'), 'utf8'));
const ng = lireNavgrid(readFileSync(resolve(dossier, 'navgrid.json'), 'utf8'));
const nav = new Navigation(ng);
const leviers = construireLeviers(scene, acces, ng);
const par = (t: string) => leviers.filter((l) => l.type === t);

test('ids stables et au format commun {code,id,nom,type,x,z,niveau,etat,source,effet}', () => {
  assert.deepEqual(leviers.map((l) => l.id), construireLeviers(scene, acces, ng).map((l) => l.id), 'deux constructions donnent les mêmes ids');
  assert.equal(new Set(leviers.map((l) => l.id)).size, leviers.length);
  assert.equal(new Set(leviers.map((l) => l.nom)).size, leviers.length, 'noms affichés uniques (citables à la voix)');
  for (const l of leviers) {
    assert.match(l.id, /^(porte|issue|bouche|ascenseur)-\d+$/);
    assert.ok(l.id.startsWith(l.type + '-'));
    for (const c of ['code', 'nom', 'source', 'effet'] as const) assert.ok(l[c].length > 0, `${l.id}.${c}`);
    assert.ok(Number.isFinite(l.x) && Number.isFinite(l.z) && Number.isInteger(l.niveau));
    assert.equal(l.etat, 'ouvert');
    assert.equal(typeof l.estime, 'boolean');
    assert.ok(l.cibles.length >= 1);
  }
  assert.deepEqual(par('porte').map((l) => l.id), par('porte').map((_, k) => `porte-${k}`));
  assert.deepEqual(par('issue').map((l) => l.id), par('issue').map((_, j) => `issue-${j}`));
  // valeurs figées : une régression de l'ordre casserait les tickets #9 et #10
  assert.ok(par('porte').some((l) => l.nom === 'Porte Lescot'));
  assert.equal(par('porte').find((l) => l.nom === 'Porte du Louvre (niveau -3)')?.niveau, -3);
  assert.ok(par('porte').length >= 8 && par('issue').length === 10 && par('bouche').length > 10 && par('ascenseur').length === scene.ascenseurs.length);
  const b = par('bouche')[0];
  assert.equal(b.id, `bouche-${scene.metro.findIndex((m) => m.id === b.cibles[0].id)}`, 'bouche-<i> = rang dans scene.metro');
});

test('noms affichés et clés des décideurs (table du ticket #7)', () => {
  assert.equal(nomIssue('Sortie de secours rue Berger n°11'), 'Issue rue Berger 11');
  assert.equal(nomIssue('Issue de secours (côté Porte du Louvre / Piscine)'), 'Issue côté piscine');
  for (const [cle, nom] of Object.entries(CLES_PORTES)) {
    assert.ok(par('porte').some((l) => cleDePorte(l.nom) === cle), `la clé ${cle} (${nom}) a un levier porte`);
  }
});

test('honnêteté : les valeurs non documentées restent estime:true', () => {
  assert.ok(par('porte').every((l) => l.estime), 'largeur des portes posée par défaut (2,5 m) : estimée');
  assert.ok(par('issue').some((l) => l.estime), 'issues sans niveau ou de certitude estimée');
  assert.ok(par('bouche').every((l) => l.estime === scene.metro.find((m) => m.id === l.cibles[0].id)!.estime), 'estime recopié de la scène');
});

test('portes sur la grille : toutes à moins de 12 m d une cellule praticable ; les issues hors grille sont signalées et estimées', () => {
  for (const l of par('porte')) {
    assert.ok(nav.plusProche(l.niveau, l.x, l.z, 12) >= 0, `${l.id} (${l.nom}, niveau ${l.niveau}) hors grille`);
    assert.equal(l.sur_grille, true);
  }
  for (const l of par('issue')) {
    assert.equal(l.sur_grille, nav.plusProche(l.niveau, l.x, l.z, 12) >= 0, `${l.id} sur_grille cohérent`);
    if (!l.sur_grille) assert.ok(l.estime, `${l.id} hors grille doit être estime`);
  }
  const hors = par('issue').filter((l) => !l.sur_grille).map((l) => l.nom);
  // limite connue : l ouest des niveaux -1 et -2 (UGC) est quasi absent d OSM, la grille n y a pas de couloir
  assert.deepEqual(hors, ['Issue côté piscine 1', 'Issue côté piscine 2', 'Issue côté piscine 3', 'Issue ouest niveau -2']);
});

test('aller-retour levier -> contrainte : le format est valide, la grille réagit, rouvrir rétablit', () => {
  const bus = new BusContraintes();
  const n = new Navigation(ng);
  n.brancher(bus);
  const L = new Leviers(construireLeviers(scene, acces, ng), bus);
  const depart = ng.sorties.find((s) => s.genre === 'rue')!;
  const avant = n.accessibles(depart.niveau, depart.x, depart.y);
  const vus: DetailLevier[] = [];
  L.sur('levier', (d) => vus.push(d));

  const l = L.toggleLever('porte-0')!;
  assert.equal(l.etat, 'fermé');
  assert.equal(bus.journal.length, l.cibles.length, 'une contrainte par nœud OSM');
  for (const c of bus.journal) { assert.deepEqual(validerContrainte(c), []); assert.equal(c.etat, 'fermee'); assert.equal(c.type, 'sortie'); }
  assert.equal(vus.length, 1);
  assert.equal(vus[0].leviers.find((q) => q.id === 'porte-0')!.etat, 'fermé');

  L.toggleLever('porte-0');
  assert.equal(L.get('porte-0')!.etat, 'ouvert');
  assert.equal(n.accessibles(depart.niveau, depart.x, depart.y).cellules_visitees, avant.cellules_visitees, 'rouvrir rétablit la grille');
  assert.equal(L.toggleLever('inconnu'), undefined);
});

test('fermer un levier bloque réellement des cellules de la grille', () => {
  const bus = new BusContraintes();
  const n = new Navigation(ng);
  n.brancher(bus);
  const L = new Leviers(construireLeviers(scene, acces, ng), bus);
  const cible = L.get('porte-0')!.cibles[0];
  const k = n.plusProche(cible.niveau, cible.x, cible.z, 12);
  assert.ok(k >= 0 && n.praticable(cible.niveau, k));
  const avant = n.plusProche(cible.niveau, cible.x, cible.z, 1);
  L.toggleLever('porte-0');
  const apres = n.plusProche(cible.niveau, cible.x, cible.z, 1);
  assert.ok(avant < 0 || apres < 0 || apres !== avant, 'la cellule sous la porte n est plus praticable');
  assert.equal(n.praticable(cible.niveau, n.indice(cible.niveau, cible.x, cible.z)), false, 'cellule de la porte fermée bloquée');
});

test('aller-retour contrainte -> levier : une contrainte venue d ailleurs met le levier à jour, sans écho', () => {
  const bus = new BusContraintes();
  const L = new Leviers(construireLeviers(scene, acces, ng), bus);
  const b = L.leviers.find((q) => q.type === 'bouche')!;
  const c: Contrainte = contraintesDe({ ...b, etat: 'fermé' })[0];
  bus.emettre(c);
  assert.equal(L.get(b.id)!.etat, 'fermé');
  assert.equal(bus.journal.length, 1, 'le levier ne ré-émet pas la contrainte reçue');
  bus.emettre({ ...c, etat: 'ouverte' });
  assert.equal(L.get(b.id)!.etat, 'ouvert');
  const p = L.get('porte-0')!;
  assert.ok(p.cibles.length > 1, 'Porte Lescot : trois nœuds OSM');
  bus.emettre({ ...contraintesDe(p)[1], etat: 'bloquee' });
  assert.equal(p.etat, 'fermé', 'l id porte-0#1 retrouve porte-0');
});

test('événement DOM `levier`, ascenseur sur le lien de la grille, C1 et zones D1/D2', () => {
  const bus = new BusContraintes();
  const cible = new EventTarget();
  const recus: CustomEvent[] = [];
  cible.addEventListener('levier', (e) => recus.push(e as CustomEvent));
  const L = new Leviers(construireLeviers(scene, acces, ng), bus, cible);

  const asc = L.leviers.find((l) => l.type === 'ascenseur' && ng.liens.some((q) => q.id === l.cibles[0].id));
  assert.ok(asc, 'un ascenseur est relié à un lien de la grille');
  L.levAction(asc.id, 'fermer');
  assert.equal(bus.journal.at(-1)!.type, 'ascenseur');
  assert.equal(bus.journal.at(-1)!.id, asc.id);

  L.fermerBouches();
  assert.ok(L.leviers.filter((l) => l.type === 'bouche').every((l) => l.etat === 'fermé'), 'C1 : toutes les bouches fermées');
  const d1 = L.ajouterZone('D1', 0, 0), d2 = L.ajouterZone('D2', 100, 100);
  assert.deepEqual([d1.id, d2.id], ['zone-1', 'zone-2']);
  assert.equal(bus.journal.at(-1)!.etat, 'bloquee');
  assert.ok(recus.length >= 4 && recus.at(-1)!.detail.zones.length === 2);
  L.toutRouvrir();
  assert.ok(L.leviers.every((l) => l.etat === 'ouvert') && L.zones.length === 0);

  L.levAction('porte-1', 'annonce');
  L.levAction('porte-2', 'annonce');
  assert.deepEqual(L.leviers.filter((l) => l.annonce).map((l) => l.id), ['porte-2'], 'une seule annonce à la fois');
  assert.equal(L.levAction('porte-1', 'filtrer'), 'filtré');
});

test('scene.json : nom_porte (clés des décideurs) sur les sorties, conforme à la table du ticket #7', () => {
  const cle = (id: string) => scene.sorties.find((s) => s.id === id)?.nom_porte;
  assert.equal(cle('S-M-1713195678'), 'lescot');
  assert.equal(cle('S-M-9554596028'), 'lescot');
  assert.equal(cle('S-M-3753296381'), 'berger');
  assert.equal(cle('S-M-5954227359'), 'pont_neuf');
  assert.equal(cle('S-M-5913737144'), 'jour');
  assert.equal(cle('S-M-9545578222'), 'louvre');
  assert.equal(cle('S-M-5321652780'), 'montorgueil');
  for (const s of scene.sorties) if (s.nom_porte) assert.ok(s.nom_porte in CLES_PORTES, s.nom_porte);
});
