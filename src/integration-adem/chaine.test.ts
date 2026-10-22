// Tests de l'intégration avec sim.js d'Adem. Lancer : npm run test:integration-adem (node:test, aucun réseau, aucune clé).
// Prérequis : navgrid.json et scene.json dans reports/maquettes/chatelet-3d/ (gitignorés) ; sinon les tests sont sautés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { planInitial } from '../agents/types.ts';
import type { EvenementContrainte } from '../agents/evenements.ts';
import { lancerChaine } from './chaine.ts';
import { disponible, MoteurAdem } from './moteur.ts';
import { populationReelle, SimulateurAdem } from './simulateur.ts';

let appelsReseau = 0;
globalThis.fetch = (async () => { appelsReseau++; throw new Error('RÉSEAU INTERDIT DANS LES TESTS'); }) as typeof fetch;
const saute = disponible() ? false : 'navgrid.json / scene.json absents (voir LISEZMOI.md)';
const scenarioDe = (population: Record<string, number>) => ({ graine: 3, minute_annonce: 1160, stations_fermees_minute: 1320, couvre_feu_debut_minute: 1380, effectif_securite: 20, population });

test('sim.js d\'Adem n\'est pas modifié par l\'intégration', { skip: saute }, () => {
  const diff = execFileSync('git', ['diff', '--stat', 'origin/main', '--', 'reports/maquettes/chatelet-3d/sim.js', 'reports/maquettes/chatelet-3d/leviers.js', 'reports/maquettes/chatelet-3d/build_navgrid.py'], { encoding: 'utf8' });
  assert.equal(diff.trim(), '');
});

test('le moteur se charge dans Node, tire une population reproductible et reste déterministe à graine égale', { skip: saute, timeout: 120_000 }, async () => {
  const M = await MoteurAdem.creer();
  assert.equal(M.SIM.L, 6);
  assert.ok(M.SIM.groups.length >= 10);
  const a = populationReelle(M, 200, 5), b = populationReelle(M, 200, 5);
  assert.deepEqual(a, b);
  assert.equal(Object.values(a).reduce((s, n) => s + n, 0), 200);
  const mesure = (): number[] => {
    const sim = new SimulateurAdem({ moteur: M });
    sim.initialiser(scenarioDe(a));
    return [sim.avancer(planInitial(), 1).sortis, sim.avancer(planInitial(), 1).sortis];
  };
  assert.deepEqual(mesure(), mesure());
});

test('une porte fermée par le plan ou une perturbation B1 ne reçoit plus de sorties ; stations fermées (C1) vident les quais', { skip: saute, timeout: 300_000 }, async () => {
  const M = await MoteurAdem.creer();
  const pop = populationReelle(M, 600, 9);
  const parPorte = (plan: ReturnType<typeof planInitial>, contraintes: EvenementContrainte[] = []) => {
    const sim = new SimulateurAdem({ moteur: M, contraintes });
    sim.initialiser(scenarioDe(pop));
    const tot: Record<string, number> = {};
    for (let i = 0; i < 4; i++) { sim.avancer(plan, 1); for (const [p, n] of Object.entries(sim.minutes.at(-1)!.sortis_par_porte)) tot[p] = (tot[p] ?? 0) + n; }
    return tot;
  };
  const base = parPorte(planInitial());
  const cible = Object.entries(base).filter(([p]) => p !== 'Quais RER et métro').sort((x, y) => y[1] - x[1])[0][0];
  const plan = planInitial(); plan.portes[cible] = 'fermee';
  assert.equal(parPorte(plan)[cible] ?? 0, 0, 'plan : porte fermée');
  const b1 = parPorte(planInitial(), [{ type: 'contrainte', code: 'B1', minute: 1160, cible }]);
  assert.equal(b1[cible] ?? 0, 0, 'B1 : porte bloquée');
  const c1 = parPorte(planInitial(), [{ type: 'contrainte', code: 'C1', minute: 1160, cible: 'chatelet' }]);
  assert.equal(c1['Quais RER et métro'] ?? 0, 0, 'C1 : plus de sorties par les quais');
  assert.ok((base['Quais RER et métro'] ?? 0) > 0, 'sans C1 les quais servent de sortie');
});

test('chaîne complète : sim.js -> décideurs (rules) -> plan, explication vérifiée, ordres de service, source simulation', { skip: saute, timeout: 300_000 }, async () => {
  const rejeu = join(mkdtempSync(join(tmpdir(), 'integration-adem-')), 'rejeu.json');
  const r = await lancerChaine({ graine: 3, personnes: 300, horizon_min: 4, rejeu_textes: rejeu });
  assert.equal(appelsReseau, 0, 'aucun appel réseau');
  assert.equal(r.source, 'simulation');
  assert.match(r.avertissement, /modèle simplifié, non certifié/);
  assert.equal(r.config.backend_decision, 'rules');
  assert.equal(r.config.personnes, 300);
  assert.ok(r.avant.sortis_fin > 0 && r.apres.sortis_fin > 0, 'des personnes sortent');
  assert.ok(r.leviers_choisis.length > 0, 'des leviers ont été choisis');
  assert.ok(r.explication?.chiffres_verifies, 'explication : chaque chiffre se retrouve dans le journal');
  assert.equal(r.ordres_de_service.length, 6);
  assert.ok(r.ordres_de_service.every((o) => o.chiffres_verifies));
  assert.ok(r.temps_reel.apres.ms_par_pas_moyen > 0 && r.temps_reel.apres.ms_par_pas_moyen < 50);
});
