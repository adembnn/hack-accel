import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agents, lot, PERCEPTION_CHARGEE } from './outils-test.mts';
import { decideLotParRegles, decideParRegles } from './regles.ts';
import { resoudreRole } from './roles.ts';
import { validerDecision } from './valider.ts';

test('30 personnages décidés par règles en moins de 50 ms', () => {
  const l = lot(30);
  decideLotParRegles(l); // échauffement du moteur, hors mesure
  const debut = performance.now();
  const decisions = decideLotParRegles(l);
  const ms = performance.now() - debut;
  assert.equal(decisions.length, 30);
  assert.ok(ms < 50, `${ms.toFixed(2)} ms`);
});

test('toute décision par règles est valide pour son rôle (action permise, cible connue)', () => {
  const perceptions = [
    PERCEPTION_CHARGEE,
    { ...PERCEPTION_CHARGEE, densite: 4.8 },
    { ...PERCEPTION_CHARGEE, densite: 0.5, alarme: false },
    { ...PERCEPTION_CHARGEE, danger: 'zone-colis', cibles: ['zone-colis'] },
    { ...PERCEPTION_CHARGEE, blesses: 2 },
    { ...PERCEPTION_CHARGEE, consigne_pc: { action: 'guider', cible: 'porte-berger' } },
    {},
  ];
  for (const p of perceptions) {
    for (const a of agents(30, p)) {
      const d = decideParRegles(a);
      const v = validerDecision(d, a, resoudreRole(a.role));
      assert.ok(v.ok, `${a.role} : ${v.ok ? '' : v.motif} ${JSON.stringify(d)}`);
    }
  }
});

test('déterministe : mêmes entrées, mêmes sorties', () => {
  assert.deepEqual(decideLotParRegles(lot(30)), decideLotParRegles(lot(30)));
});

test('un agent SSIAP détourne le flux vers l’issue la moins chargée quand la zone est rouge', () => {
  const a = { id: 'x', role: 'ssiap-porte-lescot', perception: { ...PERCEPTION_CHARGEE, densite: 4.5 } };
  const d = decideParRegles(a);
  assert.equal(d.action, 'guider');
  assert.equal(d.cible, 'porte-berger');
});

test('le bloqueur barre, l’ouvreur prévient le PC, le touriste s’éloigne', () => {
  const p = { ...PERCEPTION_CHARGEE, danger: 'zone-colis', cibles: ['zone-colis'] };
  assert.equal(decideParRegles({ id: 'a', role: 'police-barrage-manif', perception: p }).action, 'bloquer');
  assert.equal(decideParRegles({ id: 'b', role: 'individu-touriste', perception: p }).action, 'deplacer');
  assert.equal(decideParRegles({ id: 'c', role: 'cinema-ouvreur-1', perception: p }).action, 'appeler_pc');
});

test('la consigne du PC passe avant, mais pas hors des droits du rôle ni vers une cible inconnue', () => {
  const p = { ...PERCEPTION_CHARGEE, consigne_pc: { action: 'ouvrir', cible: 'porte-rambuteau' } };
  assert.equal(decideParRegles({ id: 'a', role: 'pompiers-equipier-1', perception: p }).action, 'ouvrir');
  assert.notEqual(decideParRegles({ id: 'b', role: 'police-brigadier', perception: p }).action, 'ouvrir');
  const inconnue = { ...PERCEPTION_CHARGEE, consigne_pc: { action: 'ouvrir', cible: 'porte-fantome' } };
  assert.notEqual(decideParRegles({ id: 'c', role: 'pompiers-equipier-1', perception: inconnue }).cible, 'porte-fantome');
});

test('le PC déverrouille une issue fermée sans danger quand la zone est chargée', () => {
  const d = decideParRegles({ id: 'pc', role: 'pc-chef-poste', perception: PERCEPTION_CHARGEE });
  assert.equal(d.action, 'ouvrir');
  assert.equal(d.cible, 'porte-rambuteau');
});
