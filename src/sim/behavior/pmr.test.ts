// Tests de la mobilité réduite : node --test. Modèle simplifié, non certifié.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { creerRng } from './rng.ts';
import { SCENE_UGC } from './scene-ugc.ts';
import { creerPopulation, creerSimulation } from './simuler.ts';
import { completerPmr, delaiAgent, peutEmprunter, tirerProfil, tirerVitessePmr, VITESSE_FAUTEUIL_POUSSE, vitesseAidant, vitesseAidee, VITESSES_PMR } from './pmr.ts';
import type { Intention, Mouvement, Personne, Plan } from './types.ts';

const PLAN: Plan = { mode: 'rester_ouvert', portes: [], phasage_salles: [], guidage: null, messages_par_zone: [], confinement: false };
/** Ferme les trois issues de plain-pied : il ne reste que l'escalator (interdit aux PMR) et l'accès métro (escalier : avec aide). */
const SANS_ISSUE_ACCESSIBLE: Plan['portes'] = ['principale', 'secours', 'ferronnerie'].map((id) => ({ id, ouverte: false }));
const FAUTEUILS = { fauteuil: 1, canne: 0, autre: 0 };

/** Mouvement de test qui enregistre les intentions et les sorties (ce que le comportement demande, sans changer le mouvement). */
function espion() {
  const base = creerMouvementSimple();
  let personnes: Personne[] = [];
  const sortiesPar: { id: number; issue_id: string }[] = [];
  const cibles: { id: number; cible: string }[] = [];
  let dernieres: Intention[] = [];
  const mouvement: Mouvement = {
    init(s, p) {
      personnes = p;
      base.init(s, p);
    },
    pas(dt, t, intentions, ouvertes) {
      for (const it of intentions) if (it.sortie_cible) cibles.push({ id: it.id, cible: it.sortie_cible });
      dernieres = intentions.map((x) => ({ ...x }));
      const r = base.pas(dt, t, intentions, ouvertes);
      sortiesPar.push(...r.sorties);
      return r;
    },
    restantes: () => base.restantes(),
  };
  return { mouvement, personnes: () => personnes, sortiesPar, cibles, dernieres: () => dernieres };
}

test('profils : tirage par inversion, vitesses centrées sur les valeurs lues et au-dessus du plancher', () => {
  const profils = completerPmr().profils;
  assert.equal(tirerProfil(0, profils), 'fauteuil');
  assert.equal(tirerProfil(0.99, profils), 'autre');
  const rng = creerRng(5);
  for (const p of ['fauteuil', 'canne', 'autre'] as const) {
    const xs = Array.from({ length: 4000 }, () => tirerVitessePmr(rng, p));
    const moy = xs.reduce((a, b) => a + b, 0) / xs.length;
    assert.ok(Math.abs(moy - VITESSES_PMR[p].moyenne) < 0.02, `${p} ${moy}`);
    assert.ok(xs.every((x) => x >= 0.3));
  }
});

test('accès : escalator interdit, escalier seulement aidé, plain-pied libre', () => {
  assert.equal(peutEmprunter('interdit', true), false);
  assert.equal(peutEmprunter('aide', false), false);
  assert.equal(peutEmprunter('aide', true), true);
  assert.equal(peutEmprunter(undefined, false), true);
  assert.equal(SCENE_UGC.issues.find((i) => i.id === 'escalators')!.acces_pmr, 'interdit');
});

test('l’aidant prend la vitesse de la personne aidée ; le fauteuil poussé va à 1,03 m/s ; plus d’agents, attente plus courte', () => {
  assert.equal(vitesseAidant(1.4, 0.7), 0.7);
  assert.equal(vitesseAidant(0.5, 0.7), 0.7);
  assert.equal(vitesseAidee('fauteuil', 0.67), VITESSE_FAUTEUIL_POUSSE);
  assert.equal(vitesseAidee('canne', 0.8), 0.8);
  assert.ok(delaiAgent(0.5, 4, completerPmr()) < delaiAgent(0.5, 1, completerPmr()));
});

test('une personne en fauteuil n’emprunte jamais l’issue escalators', () => {
  const e = espion();
  const sim = creerSimulation(SCENE_UGC, 11, { mouvement: e.mouvement, population_par_salle: { salle_01: 300 }, part_mobilite_reduite: 0.3, pmr: { profils: FAUTEUILS } });
  while (sim.t_s < 1800 && !sim.fini()) sim.pas(10, PLAN);
  const fauteuils = new Set(e.personnes().filter((p) => p.profil_pmr === 'fauteuil').map((p) => p.id));
  assert.ok(fauteuils.size > 30);
  assert.equal(e.cibles.filter((c) => fauteuils.has(c.id) && c.cible === 'escalators').length, 0);
  assert.equal(e.sortiesPar.filter((s) => fauteuils.has(s.id) && s.issue_id === 'escalators').length, 0);
  assert.ok(e.cibles.some((c) => !fauteuils.has(c.id) && c.cible === 'escalators'), 'les autres, eux, prennent l’escalator');
});

test('sans issue accessible : refuge, puis sortie après l’aide d’un agent (l’escalier du métro devient permis)', () => {
  const plan: Plan = { ...PLAN, portes: SANS_ISSUE_ACCESSIBLE, guidage: { issue_id: 'metro', personnel: 4 } };
  const sim = creerSimulation(SCENE_UGC, 3, { population_par_salle: { salle_01: 120 }, part_groupes: 0, part_mobilite_reduite: 0.3, pmr: { entraide: false } });
  let refugeMax = 0;
  let sortisAvantAide = 0;
  while (sim.t_s < 3000) {
    sim.pas(5, plan);
    const st = sim.journal().stats;
    refugeMax = Math.max(refugeMax, st.pmr_en_refuge);
    if (st.pmr_aides_agent === 0) sortisAvantAide = Math.max(sortisAvantAide, st.pmr_sortis);
  }
  const st = sim.journal().stats;
  assert.ok(st.pmr_total > 20);
  assert.ok(refugeMax > 0, 'des PMR attendent au refuge');
  assert.equal(sortisAvantAide, 0, 'aucune PMR ne sort avant d’avoir été aidée');
  assert.ok(st.pmr_aides_agent > 0 && st.aidants === st.pmr_aides_agent);
  assert.ok(st.pmr_sortis > 0.8 * st.pmr_total, `${st.pmr_sortis} / ${st.pmr_total}`);
  assert.ok(st.pmr_temps_moyen_s > 0);
});

test('sans agent ni proche la PMR reste au refuge ; avec entraide un proche du groupe vient la chercher et prend sa vitesse', () => {
  const plan: Plan = { ...PLAN, portes: SANS_ISSUE_ACCESSIBLE };
  const opts = { population_par_salle: { salle_01: 400 }, part_groupes: 0.85, part_mobilite_reduite: 0.15 };
  const seul = creerSimulation(SCENE_UGC, 9, { ...opts, pmr: { profils: FAUTEUILS, entraide: false } });
  while (seul.t_s < 1500) seul.pas(10, plan);
  assert.equal(seul.journal().stats.pmr_sortis, 0);
  assert.ok(seul.journal().stats.pmr_en_refuge > 0);

  const e = espion();
  const sim = creerSimulation(SCENE_UGC, 9, { ...opts, mouvement: e.mouvement, pmr: { profils: FAUTEUILS } });
  while (sim.t_s < 1500) sim.pas(10, plan);
  const st = sim.journal().stats;
  assert.ok(st.pmr_aides_voisin > 0 && st.aidants > 0);
  assert.ok(st.pmr_sortis > 0);
  // un proche de chaque PMR aidée marche à la vitesse (fauteuil poussé) de la personne aidée, plus vite que sa vitesse de groupe d'origine
  const ps = e.personnes();
  const v = new Map(e.dernieres().map((x) => [x.id, x.vitesse_voulue_m_s]));
  const aidees = ps.filter((p) => p.profil_pmr && v.get(p.id)! >= VITESSE_FAUTEUIL_POUSSE);
  assert.ok(aidees.length > 0);
  for (const p of aidees) {
    const proches = ps.filter((q) => q.groupe === p.groupe && q.groupe !== 0 && !q.mobilite_reduite);
    if (proches.length) assert.ok(proches.some((q) => v.get(q.id) === v.get(p.id)), `aidant de ${p.id}`);
  }
});

test('à graine égale, les non-PMR ont exactement les mêmes tirages qu’avant (le modèle PMR ne décale aucun flux)', () => {
  const ancien = creerPopulation(21, { pmr: { actif: false } });
  const nouveau = creerPopulation(21, {});
  assert.equal(ancien.length, nouveau.length);
  const groupeAvecPmr = new Set(nouveau.filter((p) => p.mobilite_reduite && p.groupe).map((p) => p.groupe));
  let comparees = 0;
  for (let i = 0; i < ancien.length; i++) {
    const a = ancien[i];
    const b = nouveau[i];
    // tout est identique sauf la vitesse et le profil, qui ne concernent que les PMR (et leur groupe, au rythme du plus lent)
    assert.deepEqual({ ...a, vitesse_m_s: 0, profil_pmr: undefined }, { ...b, vitesse_m_s: 0, profil_pmr: undefined }, `personne ${i}`);
    if (!b.mobilite_reduite && !groupeAvecPmr.has(b.groupe)) {
      assert.equal(a.vitesse_m_s, b.vitesse_m_s);
      comparees++;
    }
    if (b.mobilite_reduite) assert.ok(b.profil_pmr && !a.profil_pmr);
  }
  assert.ok(comparees > 2000);
  assert.ok(ancien.filter((p) => p.mobilite_reduite && !p.groupe).every((p) => p.vitesse_m_s === 0.6), 'ancien comportement : 0,6 m/s');
});
