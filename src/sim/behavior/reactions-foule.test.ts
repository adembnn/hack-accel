// Tests des réactions de toute la foule : node --test. Aucun appel LLM, aucun réseau. Modèle simplifié, non certifié.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAN_APRES, PLAN_AVANT } from '../../../bench/scenarios.ts';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { DISTRIBUTION_LITTERATURE } from './reactions/distribution-litterature.ts';
import { creerReactions, distributionLlm, frequencesMeneur, frequencesSituation, modelesDeLaSource, tirerDans } from './reactions/foule.ts';
import { creerRng } from './rng.ts';
import { SCENE_UGC } from './scene-ugc.ts';
import { creerSimulation, simuler } from './simuler.ts';
import type { Intention, Mouvement, Personne, Scene } from './types.ts';
import { MODELES } from './reactions/modeles.ts';

const PETITE = { personnes_par_salle: 60 };

test('option désactivée ou absente : résultats identiques à graine égale', () => {
  for (const plan of [PLAN_AVANT, PLAN_APRES]) {
    for (const graine of [3, 4]) {
      const sans = simuler(plan, graine, 14400, PETITE);
      const off = simuler(plan, graine, 14400, { ...PETITE, reactions: { actif: false, source: 'litterature' } });
      assert.deepEqual(off, sans);
      assert.equal(off.reactions, undefined);
    }
  }
});

test('option activée : le journal contient les comptes par moment, la part touchée et la part de meneurs', () => {
  const j = simuler(PLAN_AVANT, 3, 14400, { ...PETITE, reactions: { actif: true, source: 'litterature', nb_meneurs: 5 } });
  assert.ok(j.reactions);
  assert.equal(j.reactions.nb_meneurs, 5);
  assert.equal(j.stats.reactions_nb_meneurs, 5);
  assert.ok(Math.abs(j.reactions.part_meneurs - 5 / 360) < 1e-9);
  const annonces = Object.values(j.reactions.comptes.annonce).reduce((a, b) => a + b, 0);
  assert.equal(annonces, 360, 'toute la foule réagit à l’annonce, pas seulement ceux reliés à un agent');
  assert.ok(j.reactions.part_touchee_influence >= 0 && j.reactions.part_touchee_influence <= 1);
  assert.equal(j.stats.reactions_total, Object.entries(j.reactions.comptes).filter(([m]) => m !== 'influence').reduce((a, [, c]) => a + Object.values(c).reduce((x, y) => x + y, 0), 0));
});

test('fréquences tirées ≈ répartition : tirage dans la table, source littérature et LLM', () => {
  const rng = creerRng(11);
  const N = 30000;
  const freq = DISTRIBUTION_LITTERATURE.annonce_sans_menace;
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  const n: Record<string, number> = {};
  for (let k = 0; k < N; k++) {
    const r = tirerDans(freq, rng.next());
    n[r] = (n[r] ?? 0) + 1;
  }
  for (const [r, f] of Object.entries(freq)) assert.ok(Math.abs((n[r] ?? 0) / N - f / total) < 0.012, `${r} : ${(n[r] ?? 0) / N} contre ${f / total}`);

  // personnes ordinaires de la source llm, via le moteur : issue_bloquee = 90 % s_informer, 10 % choisir_seul
  const rx = creerReactions(5, 20000, { actif: true, source: 'llm', nb_meneurs: 0 });
  const c: Record<string, number> = {};
  for (let i = 0; i < 20000; i++) {
    const r = rx.tirer(i, 'issue_bloquee', 'issue_bloquee');
    c[r] = (c[r] ?? 0) + 1;
  }
  assert.ok(Math.abs(c.s_informer / 20000 - 0.9) < 0.01);
  assert.ok(Math.abs(c.choisir_seul / 20000 - 0.1) < 0.01);
  assert.equal(rx.comptes.issue_bloquee.s_informer, c.s_informer);
});

test('chaque fréquence de la littérature est reliée à une source [lu] ou étiquetée hypothèse', () => {
  for (const f of Object.values(DISTRIBUTION_LITTERATURE)) for (const v of Object.values(f)) assert.ok(v > 0);
  // panique de masse rare, entraide fréquente, ~90 % suivent un agent qui guide
  assert.ok(DISTRIBUTION_LITTERATURE.agent_qui_guide.suivre_consigne >= 0.9);
  for (const f of Object.values(DISTRIBUTION_LITTERATURE)) assert.ok((f.fuite_precipitee ?? 0) <= 0.05 && (f.bousculer ?? 0) <= 0.05);
  assert.ok(DISTRIBUTION_LITTERATURE.voisin_qui_tombe.aider >= 0.5);
});

test('source llm:chinois lit la bonne colonne (famille), llm:<id> lit celle du modèle, source inconnue refusée', () => {
  const d = distributionLlm();
  assert.deepEqual(frequencesSituation('llm:chinois', 'issue_bloquee'), d.par_famille_situation.chinois.issue_bloquee);
  assert.deepEqual(frequencesSituation('llm:americain', 'file_longue'), d.par_famille_situation.americain.file_longue);
  assert.notDeepEqual(frequencesSituation('llm:chinois', 'file_longue'), frequencesSituation('llm:americain', 'file_longue'));
  assert.deepEqual(frequencesSituation('llm', 'rumeur'), d.par_situation.rumeur);
  assert.deepEqual(frequencesSituation('llm:z-ai/glm-4.5-air', 'rumeur'), d.par_modele['z-ai/glm-4.5-air']);
  assert.deepEqual(modelesDeLaSource('llm:chinois').sort(), MODELES.filter((m) => m.origine === 'chinois').map((m) => m.id).sort());
  assert.throws(() => modelesDeLaSource('llm:martien'), /inconnue/);
  assert.throws(() => simuler(PLAN_AVANT, 1, 10, { ...PETITE, reactions: { actif: true, source: 'nimporte' } }), /inconnue/);
  // tirage de la foule avec la famille chinoise : fréquences de la colonne chinoise (issue_bloquee : 87,5 % s_informer)
  const rx = creerReactions(2, 20000, { actif: true, source: 'llm:chinois', nb_meneurs: 0 });
  let k = 0;
  for (let i = 0; i < 20000; i++) if (rx.tirer(i, 'issue_bloquee', 'issue_bloquee') === 's_informer') k++;
  assert.ok(Math.abs(k / 20000 - d.par_famille_situation.chinois.issue_bloquee.s_informer) < 0.012);
});

test('les meneurs sont nb_meneurs personnes distinctes, chacune avec un modèle de la famille demandée', () => {
  const rx = creerReactions(9, 3000, { actif: true, source: 'llm:europeen', nb_meneurs: 20 });
  assert.equal(rx.meneurs.size, 20);
  const europeens = new Set(MODELES.filter((m) => m.origine === 'europeen').map((m) => m.id));
  for (const m of rx.meneurs.values()) assert.ok(m !== null && europeens.has(m));
  assert.equal(creerReactions(9, 3000, { actif: true, source: 'litterature' }).meneurs.size, 20, 'défaut : 20 meneurs');
  assert.deepEqual(frequencesMeneur('mistralai/mistral-large-2512'), { s_informer: 1 });
  // le même tirage à graine égale
  assert.deepEqual([...creerReactions(9, 3000, { actif: true, source: 'llm:europeen' }).meneurs], [...creerReactions(9, 3000, { actif: true, source: 'llm:europeen' }).meneurs]);
});

test('un ordre se propage aux voisins de la salle, et pas au-delà (ni toute la salle, ni la foule)', () => {
  // un seul meneur qui donne un ordre à l'annonce ; tous les autres tirent « s'informer » seul (aucune réaction contagieuse)
  const opts = { personnes_par_salle: 500, reactions: { actif: true, source: 'llm:mistralai/mistral-large-2512', nb_meneurs: 1, reaction_meneurs: 'donner_un_ordre' } };
  const j = simuler(PLAN_AVANT, 7, 30, opts);
  const touchees = Math.round(j.reactions!.part_touchee_influence * j.stats.personnes);
  assert.ok(touchees > 0, 'au moins un voisin adopte');
  assert.ok(touchees < 150, `${touchees} touchées : l’ordre ne doit pas atteindre toute la salle de 500`);
  assert.equal(j.reactions!.comptes.influence.donner_un_ordre, touchees);
  assert.equal(Math.round(j.reactions!.part_touchee_par_meneurs * j.stats.personnes), touchees);
  // sans meneur : personne n'est touché
  const aucun = simuler(PLAN_AVANT, 7, 30, { ...opts, reactions: { ...opts.reactions, nb_meneurs: 0 } });
  assert.equal(aucun.reactions!.part_touchee_influence, 0);
});

test('malaise : la personne s’arrête (vitesse nulle), est aidée par un voisin, puis sort', () => {
  const interne = creerMouvementSimple();
  let arretees = 0;
  const mouvement: Mouvement = {
    init: (s: Scene, p: Personne[]) => interne.init(s, p),
    restantes: () => interne.restantes(),
    pas: (dt: number, t: number, intentions: Intention[], ouvertes: Record<string, boolean>) => {
      for (const it of intentions) if (it.etat === 'marche' && it.vitesse_voulue_m_s === 0) arretees++;
      return interne.pas(dt, t, intentions, ouvertes);
    },
  };
  const j = simuler(PLAN_AVANT, 5, 14400, { personnes_par_salle: 100, mouvement, reactions: { actif: true, source: 'litterature', nb_meneurs: 0, p_malaise: 1 } });
  assert.ok(j.reactions!.malaises > 20, `${j.reactions!.malaises} malaises`);
  assert.ok(arretees > 0, 'la personne en malaise ne bouge plus');
  assert.equal(j.reactions!.aides_malaise_voisin + j.reactions!.aides_malaise_secours, j.reactions!.malaises);
  assert.ok(j.reactions!.aides_malaise_voisin > 0, 'un voisin aide');
  assert.equal(j.grille.non_sortis_23h.valeur, 0, 'après l’aide, tout le monde sort');
  assert.ok(j.reactions!.comptes.voisin_qui_tombe.aider > 0);
  // arrêt puis sortie : plus lent que sans malaise
  const sans = simuler(PLAN_AVANT, 5, 14400, { personnes_par_salle: 100 });
  assert.ok((j.grille.delai_t99_s ?? 0) > (sans.grille.delai_t99_s ?? 0));
});

test('bousculer et fuite précipitée réduisent le débit de la porte (mult_debit_porte)', () => {
  const scene: Scene = { nom: 't', surface_salle_m2: 600, issues: [{ id: 'a', nom: 'a', distance_m: 0, largeur_m: 1, surface_approche_m2: 100, porte_entree: true, visible: true, ouverte: true, derriere: 'sur', zone: 'z' }] };
  const sorties = (mult: number | undefined) => {
    const m = creerMouvementSimple();
    const gens: Personne[] = Array.from({ length: 40 }, (_, id) => ({ id, salle: 's', groupe: 0, mobilite_reduite: false, vitesse_m_s: 1.2, delai_s: 0, suivisme: 0, connait_secours: true, confiance: 1 }));
    m.init(scene, gens);
    const it = (id: number): Intention => ({ id, sortie_cible: 'a', vitesse_voulue_m_s: 1.2, groupe: 0, etat: 'marche', ...(mult ? { mult_debit_porte: mult } : {}) });
    let k = 0;
    for (let t = 0; t < 10; t++) k += m.pas(1, t, gens.map((g) => it(g.id)), { a: true }).sorties.length;
    return k;
  };
  const normal = sorties(undefined);
  assert.ok(normal >= 12 && normal <= 14, `${normal}`);
  assert.ok(sorties(0.5) <= normal * 0.6);
});

test('pas à pas : creerSimulation avec réactions donne le même journal que simuler', () => {
  const o = { ...PETITE, reactions: { actif: true, source: 'llm', nb_meneurs: 3 } };
  const sim = creerSimulation(SCENE_UGC, 8, o);
  while (sim.t_s < 600 && !sim.fini()) sim.pas(1, PLAN_AVANT);
  const direct = simuler(PLAN_AVANT, 8, 600, o);
  assert.deepEqual(sim.journal().reactions, direct.reactions);
});
