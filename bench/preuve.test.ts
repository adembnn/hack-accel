import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  choisirPlanAvec, comparerReactions, creerMoteur, ENTETE_CSV, ISSUES, lancer, lignesCsv, PLAN_APRES, PLAN_AVANT, planPourSituation, problemesPlan,
  resumerPreuve, scenePourSituation, SITUATIONS, SITUATIONS_SURPRISE,
} from './preuve-lib.ts';

const GRAINES = [101, 102];
const choisir = (...ids: string[]) => SITUATIONS.filter((s) => ids.includes(s.id));

test('la liste des situations est assez longue, sans doublon, et chaque situation produit des plans valides', () => {
  assert.ok(SITUATIONS.length >= 12);
  assert.equal(new Set(SITUATIONS.map((s) => s.id)).size, SITUATIONS.length);
  for (const sit of SITUATIONS) {
    for (const plan of [PLAN_AVANT, PLAN_APRES]) {
      assert.deepEqual(problemesPlan(planPourSituation(plan, sit), scenePourSituation(sit)), [], `${sit.id} : plan invalide`);
    }
    for (const id of sit.bloquees) assert.ok(ISSUES.includes(id), `${sit.id} : issue inconnue ${id}`);
  }
});

test('une situation « issue bloquée » ferme bien l’issue : aucune sortie par elle, pour les deux plans', () => {
  const [sit] = choisir('B1-secours');
  const res = lancer(creerMoteur('test'), [sit], GRAINES, PLAN_AVANT, PLAN_APRES)[0];
  assert.equal(res.sorties_par_issue.sans.secours, 0);
  assert.equal(res.sorties_par_issue.avec.secours, 0);
  assert.ok(res.sorties_par_issue.sans.principale > 0, 'la charge se reporte sur les autres issues');
});

test('le résumé a les clés attendues et la ligne pour le jury annonce le bon nombre de situations', () => {
  const sits = choisir('base', 'C1-metro', 'F1-annonce-tardive');
  const res = lancer(creerMoteur('test'), sits, GRAINES, PLAN_AVANT, PLAN_APRES);
  const r = resumerPreuve(res);
  assert.deepEqual(Object.keys(r).sort(), ['critere_vedette', 'ligne_jury', 'par_critere']);
  for (const c of ['non_sortis_22h', 'zone_danger', 't90', 't99', 'ecrasement', 'pmr_non_sortis']) {
    assert.deepEqual(Object.keys(r.par_critere[c]).sort(), ['indistinct_dans', 'mediane_ecart_pct', 'meilleure_dans', 'n_definies', 'pire_dans', 'sous_incertitude_modele_dans']);
  }
  assert.match(r.ligne_jury, /^Sur 3 situations, notre solution .* en médiane \(meilleure dans \d\/3 situations\) ; .*t90/);
});

test('CSV : même nombre de colonnes sur toutes les lignes', () => {
  const res = lancer(creerMoteur('test'), choisir('base', 'B1-principale'), GRAINES, PLAN_AVANT, PLAN_APRES);
  const lignes = lignesCsv(res, { plan_avec: 'PLAN_APRES', moteur: 'test' });
  assert.equal(lignes.length, 3);
  // compte les champs en ignorant les virgules entre guillemets
  const nbCols = (l: string) => l.replace(/"(?:[^"]|"")*"/g, 'x').split(',').length;
  const n = ENTETE_CSV.length;
  for (const l of lignes) assert.equal(nbCols(l), n);
});

test('le plan « avec » retombe sur PLAN_APRES si le fichier de l’explorateur manque ou est incompatible', () => {
  assert.equal(choisirPlanAvec('/inexistant/resultats.json').source, 'PLAN_APRES');
  const dossier = mkdtempSync(join(tmpdir(), 'preuve-'));
  const mauvais = join(dossier, 'mauvais.json');
  writeFileSync(mauvais, JSON.stringify({ classement: [{ plan: { mode: 'fermer', portes: [{ id: 'nulle-part', ouverte: false }], phasage_salles: [], messages_par_zone: [], guidage: null, confinement: false } }] }));
  const r = choisirPlanAvec(mauvais);
  assert.equal(r.source, 'PLAN_APRES');
  assert.match(r.raison, /incompatible/);
  const bon = join(dossier, 'bon.json');
  writeFileSync(bon, JSON.stringify({ classement: [{ plan: PLAN_APRES }] }));
  assert.equal(choisirPlanAvec(bon).source, 'explorateur');
});

test('le moteur simjs n’est pas encore branché et le dit', () => {
  assert.throws(() => creerMoteur('simjs'), /pas encore branché/);
});

test('blocage surprise : l’issue ferme à 120 s sans message ni guidage vers elle, des gens hésitent, et les deux foules (sans / avec réactions) sont comparées', () => {
  assert.equal(SITUATIONS_SURPRISE.length, 2);
  for (const sit of SITUATIONS_SURPRISE) {
    for (const plan of [PLAN_AVANT, PLAN_APRES]) {
      const jouee = planPourSituation(plan, sit);
      assert.deepEqual(problemesPlan(jouee, scenePourSituation(sit)), []);
      const cible = sit.ferme_en_cours![0].id;
      assert.ok(jouee.portes.some((p) => p.id === cible && !p.ouverte && p.a_partir_de_s === 120));
      assert.ok(jouee.messages_par_zone.every((m) => m.issue_id !== cible), 'aucun message vers l’issue qui ferme');
      assert.notEqual(jouee.guidage?.issue_id, cible);
    }
  }
  const [sit] = SITUATIONS_SURPRISE;
  const lignes = comparerReactions(sit, PLAN_AVANT, [101, 102], [
    { id: 'sans' },
    { id: 'litterature', reactions: { actif: true, source: 'litterature' } },
    { id: 'llm:chinois', reactions: { actif: true, source: 'llm:chinois' } },
  ]);
  assert.equal(lignes.length, 3);
  for (const l of lignes) assert.ok(l.hesitations > 0, `${l.variante} : des gens hésitent devant l’issue fermée`);
  assert.equal(lignes[0].reactions_tirees, 0);
  assert.ok(lignes[1].reactions_tirees > 3000, 'avec réactions, toute la foule tire (au moins l’annonce)');
  assert.ok(lignes[2].reactions_tirees > 3000);
});

test('--reactions : le moteur accepte une source de réactions et la foule réagit', () => {
  const [sit] = choisir('B1-secours');
  const m = creerMoteur('test', { actif: true, source: 'litterature' }).jouer(PLAN_AVANT, 101, sit);
  assert.ok((m.journal.stats.reactions_total ?? 0) > 3000);
  assert.equal(creerMoteur('test').jouer(PLAN_AVANT, 101, sit).journal.stats.reactions_total, undefined);
});
