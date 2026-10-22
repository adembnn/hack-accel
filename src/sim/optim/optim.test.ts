import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fluxMax, type ArcEntree } from './maxflow.ts';
import { bornePhysique, comparerFermeture, type GrapheForum } from './borne.ts';

// Réseau classique à 6 nœuds (s=0, t=5), flot maximal 23 connu à la main.
const RESEAU: ArcEntree[] = [
  [0, 1, 16], [0, 2, 13], [1, 2, 10], [2, 1, 4], [1, 3, 12],
  [3, 2, 9], [2, 4, 14], [4, 3, 7], [3, 5, 20], [4, 5, 4],
].map(([de, vers, capacite]) => ({ de, vers, capacite }));

test('flot maximal et coupe minimale connus à la main', () => {
  const r = fluxMax(6, RESEAU, 0, 5);
  assert.equal(r.valeur, 23);
  // Dualité : la capacité de la coupe égale la valeur du flot.
  const coupe = r.indices_coupe.reduce((s, k) => s + RESEAU[k].capacite, 0);
  assert.equal(coupe, 23);
  assert.deepEqual(r.indices_coupe.map((k) => [RESEAU[k].de, RESEAU[k].vers]).sort(), [[1, 3], [4, 3], [4, 5]].sort());
});

test('conservation du flot : entrant = sortant hors source et puits, et flux <= capacité', () => {
  const r = fluxMax(6, RESEAU, 0, 5);
  for (let v = 1; v <= 4; v++) {
    const entrant = RESEAU.reduce((s, a, k) => s + (a.vers === v ? r.flux[k] : 0), 0);
    const sortant = RESEAU.reduce((s, a, k) => s + (a.de === v ? r.flux[k] : 0), 0);
    assert.ok(Math.abs(entrant - sortant) < 1e-9, `nœud ${v}`);
  }
  RESEAU.forEach((a, k) => assert.ok(r.flux[k] >= -1e-9 && r.flux[k] <= a.capacite + 1e-9));
  const sortantSource = RESEAU.reduce((s, a, k) => s + (a.de === 0 ? r.flux[k] : 0), 0);
  assert.ok(Math.abs(sortantSource - r.valeur) < 1e-9);
});

// Petit lieu : une zone A, deux portes S1 et S2, chacune reliée à A par un passage de 1 pers./s.
const PETIT: GrapheForum = {
  nodes: [
    { id: 'A', kind: 'zone', name: 'Zone A', level: 0 },
    { id: 'S1', kind: 'sortie', name: 'Porte 1', level: 0 },
    { id: 'S2', kind: 'sortie', name: 'Porte 2', level: 0 },
  ],
  edges: [
    { a: 'A', b: 'S1', kind: 'couloir', time_s: 10, capacity_ps: 1 },
    { a: 'A', b: 'S2', kind: 'couloir', time_s: 10, capacity_ps: 1 },
  ],
};

test('réseau étendu dans le temps : 2 personnes, 1 passage de 1 par pas et 1 pas de durée => 2 pas', () => {
  const g: GrapheForum = { nodes: PETIT.nodes.slice(0, 2), edges: [{ a: 'A', b: 'S1', kind: 'couloir', time_s: 10, capacity_ps: 0.1 }] };
  const b = bornePhysique(g, 2, [], { source: 'A' });
  assert.equal(b.t_min_s, 20); // 2 pas de 10 s : la 1re personne arrive au pas 1, la 2e au pas 2
  assert.equal(bornePhysique(g, 1, [], { source: 'A' }).t_min_s, 10);
});

test('fermer une sortie réduit la capacité et allonge le temps', () => {
  const c = comparerFermeture(PETIT, 100, ['S2'], { source: 'A' });
  assert.equal(c.avant.capacite_totale_pers_h, 7200); // 2 passages de 1 pers./s
  assert.equal(c.apres.capacite_totale_pers_h, 3600);
  assert.ok(Math.abs(c.perte_capacite_pct - 50) < 1e-9);
  assert.ok(c.t_min_supplement_s > 0);
  assert.equal(c.apres.capacite_par_issue_pers_h['S2'], undefined);
  assert.deepEqual(c.avant.goulot.map((m) => m.type), ['passage', 'passage']);
});

test('graphe du Forum : la porte du Louvre est sur le goulot, la fermer coûte de la capacité', () => {
  const g = JSON.parse(readFileSync(new URL('./donnees/forum-graph.json', import.meta.url), 'utf8')) as GrapheForum;
  const c = comparerFermeture(g, 3000, ['S_Porte_du_Louvre']);
  assert.ok(c.avant.capacite_totale_pers_h > 0);
  assert.ok(c.perte_capacite_pct > 0);
  assert.ok(c.apres.t_min_s >= c.avant.t_min_s);
  // Le total (partage des couloirs) ne dépasse jamais la somme des portes prises une à une.
  const somme = Object.values(c.avant.capacite_par_issue_pers_h).reduce((s, x) => s + x, 0);
  assert.ok(c.avant.capacite_totale_pers_h <= somme + 1e-6);
  // La capacité du goulot (coupe minimale) égale la capacité totale.
  assert.ok(Math.abs(c.avant.goulot.reduce((s, m) => s + m.capacite_pers_h, 0) - c.avant.capacite_totale_pers_h) < 1e-6);
});
