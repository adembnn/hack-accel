// Tests de la chaîne d'intégration. Lancer : npm run test:integration  (node --test, aucun réseau, aucune clé).
// Configuration réduite (60 personnes, 3 minutes) : le coût d'un pas de CrowdSim dépend de la surface de la grille, pas du nombre de personnes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planInitial, PORTES } from '../agents/types.ts';
import { lancerChaine } from './chaine.ts';
import { moteurPartage } from './mouvement.ts';
import { traduirePlan } from './simulateur.ts';

let appelsReseau = 0;
globalThis.fetch = (async () => { appelsReseau++; throw new Error('RÉSEAU INTERDIT DANS LES TESTS'); }) as typeof fetch;

const scenario = { graine: 1, minute_annonce: 1160, stations_fermees_minute: 1320, couvre_feu_debut_minute: 1380, effectif_securite: 20, population: { ugc: 10, niveau_0: 10 } };

test('scene.json et navgrid.json du lot jumeau-3d produisent une grille de mouvement et des issues réelles', () => {
  const m = moteurPartage();
  assert.equal(m.grille.levels, 5);
  assert.ok(m.grille.links.length > 50, 'liens verticaux convertis');
  const ids = m.carte.issues.map((i) => i.id);
  assert.ok(ids.includes('metro') && ids.length >= 5, `issues : ${ids.join(', ')}`);
  for (const i of m.carte.issues) assert.ok(i.cellules.length > 0 && Number.isFinite(m.distances_m[i.id]) && m.distances_m[i.id] > 0, `issue ${i.id} atteignable`);
  assert.ok(m.zonesDepart.every((z) => z.length > 20), 'chaque salle a des cellules de départ connexes aux sorties');
});

test('traduction du plan des décideurs vers le plan du lot foule-decision : instants, portes, phasage, guidage', () => {
  const p0 = planInitial();
  const p1 = structuredClone(p0);
  p1.portes.rambuteau = 'fermee';
  p1.portes.lescot = 'fermee'; // sans sortie réelle : ignorée et signalée
  p1.phasage_salles = [{ salle: 'ugc', minute_depart: 1190 }];
  p1.guidage = [{ point: 'porte_canopee', agents: 6 }];
  p1.messages_par_zone = { ugc: 'Rejoignez la sortie du Louvre' };
  const { plan, ecarts } = traduirePlan([p0, p0, p1], scenario, ['ugc', 'niveau_0'], ['rambuteau', 'louvre', 'canopee', 'metro']);
  assert.deepEqual(plan.portes, [{ id: 'rambuteau', ouverte: false, a_partir_de_s: 120 }]);
  assert.deepEqual(plan.phasage_salles, [{ salle: 'salle-1', delai_s: 1800 }]);
  assert.deepEqual(plan.guidage, { issue_id: 'canopee', personnel: 6 });
  assert.equal(plan.messages_par_zone[0].issue_id, 'louvre');
  assert.equal(plan.messages_par_zone[0].a_partir_de_s, 120);
  assert.ok(ecarts.some((e) => e.includes('lescot')), 'porte sans sortie signalée');
  assert.ok(PORTES.includes('lescot'));
});

test('chaîne complète : scène -> mouvement -> simuler -> décideurs (rules) -> plan, explication vérifiée, ordres de service', { timeout: 600_000 }, async () => {
  const rejeu = join(mkdtempSync(join(tmpdir(), 'integration-')), 'rejeu.json');
  const r = await lancerChaine({ graine: 3, personnes_par_salle: 10, horizon_min: 3, rejeu_textes: rejeu });
  assert.equal(appelsReseau, 0, 'aucun appel réseau');
  assert.equal(r.config.backend_decision, 'rules');
  assert.equal(r.config.personnes, 60);
  assert.equal(r.avant.stats.personnes, 60);
  assert.equal(r.apres.stats.personnes, 60);
  assert.ok(r.performance.simulations_completes >= 2, 'run avant + au moins un run de la boucle');
  assert.ok(r.leviers_choisis.length > 0, 'des leviers ont été choisis');
  assert.ok(r.decisions_citees.some((d) => d.lecons_citees.length > 0), 'des décisions citent des leçons du REX');
  assert.ok(r.explication && r.explication.chiffres_verifies, 'explication : chaque chiffre se retrouve dans le journal');
  assert.equal(r.explication?.origine, 'rejeu');
  assert.equal(r.ordres_de_service.length, 6);
  assert.ok(r.ordres_de_service.every((o) => o.chiffres_verifies));
  assert.match(r.avertissement, /non certifié/);
  assert.ok(r.apres.note_totale >= 0 && r.avant.note_totale >= 0);
  assert.ok(r.etat_final.par_zone.ugc !== undefined);
});
