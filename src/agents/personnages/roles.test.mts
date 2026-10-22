import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROLES, ROLE_INCONNU, resoudreRole } from './roles.ts';
import { ACTIONS, FAMILLES } from './types.ts';

test('une trentaine de personnages à rôle, identifiants uniques', () => {
  assert.ok(ROLES.length >= 28 && ROLES.length <= 32, `nombre de rôles : ${ROLES.length}`);
  assert.equal(new Set(ROLES.map((r) => r.id)).size, ROLES.length);
});

test('chaque rôle a une famille, des actions du menu, des limites et une perception', () => {
  for (const r of ROLES) {
    assert.ok(FAMILLES.includes(r.famille), r.id);
    assert.ok(r.actions.length > 0 && r.actions.every((a) => ACTIONS.includes(a)), r.id);
    assert.ok(r.actions.includes('attendre'), `${r.id} doit pouvoir attendre`);
    assert.ok(r.limites.length > 0 && r.voit.length > 0, r.id);
  }
});

test('toutes les familles demandées sont représentées', () => {
  for (const f of FAMILLES) assert.ok(ROLES.some((r) => r.famille === f), f);
});

test('les limites tiennent : seuls les rôles d’autorité ouvrent ou bloquent', () => {
  for (const r of ROLES.filter((x) => x.famille === 'individu')) {
    assert.ok(!r.actions.includes('ouvrir') && !r.actions.includes('bloquer'), r.id);
  }
  assert.ok(!resoudreRole('police-brigadier').actions.includes('ouvrir'));
});

test('résolution : identifiant exact, puis famille, puis rôle minimal', () => {
  assert.equal(resoudreRole('ssiap-porte-berger').id, 'ssiap-porte-berger');
  assert.equal(resoudreRole('police').famille, 'police');
  assert.equal(resoudreRole('inconnu-total'), ROLE_INCONNU);
  assert.deepEqual(ROLE_INCONNU.actions, ['deplacer', 'appeler_pc', 'attendre']);
});

test('les rôles de la maquette d’Adem sont reconnus', () => {
  for (const r of ['securite', 'pompier', 'directeur', 'chef_de_poste', 'ratp', 'police', 'meneur', 'panique', 'parent', 'filme', 'pmr']) {
    assert.notEqual(resoudreRole(r), ROLE_INCONNU, r);
  }
});
