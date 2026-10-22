import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS5097 : Node exige l extension .ts ; le tsconfig du socle n autorise pas encore allowImportingTsExtensions
import { Chronologie, DetecteurAlertes, SEUILS, appliquerIntervention, densiteParCellule, graviteDensite, refuserProposition, validerProposition } from './alertes.ts';
import type { Contrainte } from './types.ts';
import type { EtatMonde, Personne } from './alertes.ts';

test('seuils : orange à 3 pers./m², rouge à 4 (décision d\'Adem)', () => {
  assert.equal(SEUILS.orange, 3);
  assert.equal(SEUILS.rouge, 4);
  assert.equal(graviteDensite(2.99), 'ok');
  assert.equal(graviteDensite(3), 'orange');
  assert.equal(graviteDensite(3.99), 'orange');
  assert.equal(graviteDensite(4), 'rouge');
  assert.equal(graviteDensite(6), 'rouge');
});

/** n personnes serrées dans la cellule (0,0) de 2 m × 2 m. */
const foule = (n: number, niveau = 0): Personne[] => Array.from({ length: n }, (_, i) => ({ x: 0.2 + (i % 4) * 0.5, y: 0.2 + Math.floor(i / 4) * 0.5, niveau }));

test('densité par cellule de 4 m² : 12 personnes = 3, 16 = 4', () => {
  const d12 = [...densiteParCellule(foule(12)).values()][0]!;
  assert.equal(d12.densite, 3);
  assert.equal(graviteDensite(d12.densite), 'orange');
  assert.equal([...densiteParCellule(foule(16)).values()][0]!.densite, 4);
  assert.equal(densiteParCellule([{ x: 0, y: 0, niveau: 0, sorti: true }]).size, 0);
});

const porte: Contrainte = { id: 'porte-rambuteau', type: 'sortie', niveau: 0, x: 20, y: 0, largeur_m: 3, etat: 'fermee' };
const monde = (T: number, n: number): EtatMonde => ({ T, personnes: foule(n), contraintes: [porte], zones: [], sortis: 0 });

test('bouchon : alerte seulement après 20 s au-dessus du seuil, orange puis rouge, propositions, résorption', () => {
  const det = new DetecteurAlertes();
  for (let T = 0; T < 20; T += 2) assert.equal(det.pas(monde(T, 12)).length, 0, `T=${T}`);
  const ev = det.pas(monde(20, 12));
  assert.equal(ev[0]!.type, 'orange');
  assert.match(ev[0]!.txt, /3,0 pers\.\/m²/);
  assert.ok(ev.some((e) => e.type === 'proposition'), 'propose d\'ouvrir la sortie fermée à 20 m');
  assert.equal(det.actives, 1);
  const ag = det.pas(monde(22, 16));
  assert.ok(ag.some((e) => e.type === 'rouge' && /Aggravation/.test(e.txt)));
  // la foule se disperse : fermeture après 2 détections sans le problème
  det.pas(monde(24, 2));
  const fin = det.pas(monde(26, 2));
  assert.ok(fin.some((e) => /Résorbé/.test(e.txt)));
  assert.equal(det.actives, 0);
  assert.ok(det.chrono.evenements.filter((e) => e.type === 'proposition').every((e) => e.etat === 'caduque'));
});

test('chronologie toujours triée par temps, même si les événements arrivent dans le désordre', () => {
  const c = new Chronologie();
  for (const T of [30, 10, 20, 10, 5]) c.ajouter({ type: 'info', T, txt: `t${T}` });
  const Ts = c.evenements.map((e) => e.T);
  assert.deepEqual(Ts, [...Ts].sort((a, b) => a - b));
  const ids10 = c.evenements.filter((e) => e.T === 10).map((e) => e.id);
  assert.deepEqual(ids10, [...ids10].sort((a, b) => a - b)); // stable à temps égal
});

test('valider une proposition renvoie une intervention différée et ouvre la contrainte ; refuser la ferme', () => {
  const det = new DetecteurAlertes();
  for (let T = 0; T <= 20; T += 2) det.pas(monde(T, 12));
  const props = det.chrono.evenements.filter((e) => e.type === 'proposition');
  assert.ok(props.length >= 1);
  const interv = validerProposition(det.chrono, props[0]!.id, 30)!;
  assert.deepEqual(interv.ouvrir, ['porte-rambuteau']);
  assert.equal(interv.effet_a, 30 + interv.delai_s);
  assert.equal(validerProposition(det.chrono, props[0]!.id, 31), null); // déjà traitée
  assert.equal(appliquerIntervention([porte], interv)[0]!.etat, 'ouverte');
  assert.equal(porte.etat, 'fermee');
  assert.ok(det.chrono.evenements.some((e) => e.type === 'decision'));
  assert.equal(refuserProposition(det.chrono, props[0]!.id), false);
});

test('zone D2 sur une porte : alerte rouge « porte bloquée de fait »', () => {
  const det = new DetecteurAlertes();
  const ev = det.pas({ T: 0, personnes: [], contraintes: [{ ...porte, etat: 'ouverte' }], zones: [{ id: 'z1', code: 'D2', x: 25, y: 0, rayon_m: 25 }], sortis: 0 });
  assert.equal(ev[0]!.type, 'rouge');
  assert.match(ev[0]!.txt, /Troubles devant porte-rambuteau/);
});

test('même entrée, même chronologie (déterminisme)', () => {
  const jouer = (): string => {
    const det = new DetecteurAlertes();
    for (let T = 0; T <= 30; T += 2) det.pas(monde(T, T < 20 ? 12 : 16));
    return JSON.stringify(det.chrono.evenements);
  };
  assert.equal(jouer(), jouer());
});
