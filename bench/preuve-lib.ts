// Preuve multi-situations : « sans » (consigne du 19 oct.) contre « avec » (notre meilleur plan) sur des dizaines de situations.
// Une situation = un lieu du problème (issue touchée) × une perturbation du catalogue (reports/catalogue-contraintes.md :
// B1 issue bloquée, B3 escalator arrêté, C1 bouche de métro fermée, D1/D2 troubles devant une issue, F1 annonce tardive)
// × un préréglage de départ. Mêmes graines, mêmes personnes pour les deux plans. Sans dépendance, sans appel LLM.
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : scène illustrative, mouvement de test (voir bench/LISEZMOI.md).
import { existsSync, readFileSync } from 'node:fs';
import { creerMouvementSimple } from '../src/sim/behavior/mouvement-simple.ts';
import { PRESET_CENTRAL, PRESET_LENT } from '../src/sim/behavior/depart.ts';
import { SCENE_UGC } from '../src/sim/behavior/scene-ugc.ts';
import { simuler, type OptionsSimulation } from '../src/sim/behavior/simuler.ts';
import { AVERTISSEMENT, type Issue, type JournalRun, type Mouvement, type Plan, type Scene } from '../src/sim/behavior/types.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';
import { comparer, ligneCsv, nb, PLAFOND, resumer, sousIncertitudeModele, verdict, type Sens, type Verdict } from './stats.ts';

export const DUREE_S = 14400;
export const GRAINES_DEPART = 101;
export const ISSUES = SCENE_UGC.issues.map((i) => i.id);

// ---------- Situations ----------

export interface Situation {
  id: string;
  libelle: string;
  /** Issue(s) où se passe le problème, ou « aucun ». */
  lieu: string;
  /** Codes du catalogue des contraintes. */
  codes: string[];
  /** Issues physiquement fermées dès le début (aucune sortie possible par elles). */
  bloquees: string[];
  /** Changements de la scène par issue (escalator arrêté : largeur réduite ; troubles devant l'issue : derrière « interdite »). */
  scene?: Record<string, Partial<Pick<Issue, 'largeur_m' | 'derriere'>>>;
  /** F1 : retard (s) de toutes les annonces. */
  retard_annonce_s?: number;
  options?: Pick<OptionsSimulation, 'depart' | 'part_mobilite_reduite'>;
}

const S = (s: Situation): Situation => s;
export const SITUATIONS: Situation[] = [
  S({ id: 'base', libelle: 'Aucune perturbation', lieu: 'aucun', codes: [], bloquees: [] }),
  S({ id: 'B1-principale', libelle: 'Issue principale bloquée', lieu: 'principale', codes: ['B1'], bloquees: ['principale'] }),
  S({ id: 'B1-secours', libelle: 'Sortie de secours bloquée', lieu: 'secours', codes: ['B1'], bloquees: ['secours'] }),
  S({ id: 'B1-escalators', libelle: 'Escalators bloqués', lieu: 'escalators', codes: ['B1'], bloquees: ['escalators'] }),
  S({ id: 'C1-metro', libelle: 'Bouche de métro fermée dès le début', lieu: 'metro', codes: ['C1'], bloquees: ['metro'] }),
  S({ id: 'B1-ferronnerie', libelle: 'Sortie Ferronnerie bloquée', lieu: 'ferronnerie', codes: ['B1'], bloquees: ['ferronnerie'] }),
  S({ id: 'B3-escalators', libelle: 'Escalators arrêtés (débit divisé par 2)', lieu: 'escalators', codes: ['B3'], bloquees: [], scene: { escalators: { largeur_m: 0.8 } } }),
  S({ id: 'D1-secours', libelle: 'Manifestation devant la sortie de secours', lieu: 'secours', codes: ['D1'], bloquees: [], scene: { secours: { derriere: 'interdite' } } }),
  S({ id: 'D2-principale', libelle: 'Troubles devant l’issue principale', lieu: 'principale', codes: ['D2'], bloquees: [], scene: { principale: { derriere: 'interdite' } } }),
  S({ id: 'D2-escalators', libelle: 'Troubles en haut des escalators', lieu: 'escalators', codes: ['D2'], bloquees: [], scene: { escalators: { derriere: 'interdite' } } }),
  S({ id: 'F1-annonce-tardive', libelle: 'Annonce 10 min trop tard', lieu: 'aucun', codes: ['F1'], bloquees: [], retard_annonce_s: 600 }),
  S({ id: 'depart-central', libelle: 'Départ lent : couvre-feu sans menace visible', lieu: 'aucun', codes: [], bloquees: [], options: { depart: PRESET_CENTRAL } }),
  S({ id: 'depart-lent', libelle: 'Départ très lent, 15 % ne partent pas', lieu: 'aucun', codes: [], bloquees: [], options: { depart: PRESET_LENT } }),
  S({ id: 'pmr-elevee', libelle: '10 % de personnes à mobilité réduite', lieu: 'aucun', codes: [], bloquees: [], options: { part_mobilite_reduite: 0.1 } }),
  S({ id: 'C1+B1-principale', libelle: 'Métro fermé et issue principale bloquée', lieu: 'metro+principale', codes: ['C1', 'B1'], bloquees: ['metro', 'principale'] }),
  S({ id: 'B1-principale+secours', libelle: 'Principale et secours bloquées', lieu: 'principale+secours', codes: ['B1'], bloquees: ['principale', 'secours'] }),
  S({ id: 'B1-secours+B3', libelle: 'Secours bloquée et escalators arrêtés', lieu: 'secours+escalators', codes: ['B1', 'B3'], bloquees: ['secours'], scene: { escalators: { largeur_m: 0.8 } } }),
  S({ id: 'C1+B3', libelle: 'Métro fermé et escalators arrêtés', lieu: 'metro+escalators', codes: ['C1', 'B3'], bloquees: ['metro'], scene: { escalators: { largeur_m: 0.8 } } }),
  S({ id: 'D2+F1', libelle: 'Troubles devant la principale et annonce tardive', lieu: 'principale', codes: ['D2', 'F1'], bloquees: [], scene: { principale: { derriere: 'interdite' } }, retard_annonce_s: 600 }),
  S({ id: 'C1+F1+depart-lent', libelle: 'Métro fermé, annonce tardive, départ très lent', lieu: 'metro', codes: ['C1', 'F1'], bloquees: ['metro'], retard_annonce_s: 600, options: { depart: PRESET_LENT } }),
  S({ id: 'B1-trois-issues', libelle: 'Trois issues bloquées (restent Ferronnerie et métro)', lieu: 'principale+secours+escalators', codes: ['B1'], bloquees: ['principale', 'secours', 'escalators'] }),
  S({ id: 'D1+B1-secours', libelle: 'Troubles devant la principale, secours bloquée', lieu: 'principale+secours', codes: ['D1', 'B1'], bloquees: ['secours'], scene: { principale: { derriere: 'interdite' } } }),
];

/** Plan réellement joué dans la situation : le plan de base, plus les issues bloquées (fermées à 0 s, en dernier donc prioritaires) et le retard des annonces. */
export function planPourSituation(plan: Plan, sit: Situation): Plan {
  const retard = sit.retard_annonce_s ?? 0;
  return {
    ...plan,
    portes: [...plan.portes, ...sit.bloquees.map((id) => ({ id, ouverte: false, a_partir_de_s: 0 }))],
    messages_par_zone: plan.messages_par_zone.map((m) => ({ ...m, a_partir_de_s: m.a_partir_de_s + retard })),
  };
}

export function scenePourSituation(sit: Situation): Scene {
  if (!sit.scene) return SCENE_UGC;
  return { ...SCENE_UGC, issues: SCENE_UGC.issues.map((i) => ({ ...i, ...(sit.scene![i.id] ?? {}) })) };
}

/** Vérifie qu'un plan est jouable dans la scène ; renvoie la liste des problèmes (vide = valide). */
export function problemesPlan(plan: Plan, scene: Scene = SCENE_UGC): string[] {
  const ids = new Set(scene.issues.map((i) => i.id));
  const pb: string[] = [];
  if (!Array.isArray(plan.phasage_salles) || !Array.isArray(plan.messages_par_zone) || !Array.isArray(plan.portes)) return ['portes, phasage_salles ou messages_par_zone manquant'];
  if (!['rester_ouvert', 'fermer_par_etapes', 'fermer'].includes(plan.mode)) pb.push(`mode inconnu : ${plan.mode}`);
  for (const p of plan.portes) if (!ids.has(p.id)) pb.push(`porte inconnue : ${p.id}`);
  for (const m of plan.messages_par_zone) if (m.issue_id !== null && !ids.has(m.issue_id)) pb.push(`message vers une issue inconnue : ${m.issue_id}`);
  if (plan.guidage && !ids.has(plan.guidage.issue_id)) pb.push(`guidage vers une issue inconnue : ${plan.guidage.issue_id}`);
  return pb;
}

// ---------- Plan « avec » ----------

export interface PlanAvec {
  plan: Plan;
  /** « explorateur » (meilleur plan de #24) ou « PLAN_APRES » (plan type décideurs). */
  source: string;
  raison: string;
}

/** Meilleur plan de l'explorateur (#24) s'il existe et a le bon format, sinon PLAN_APRES. Le format vient d'un autre lot : `classement[0].plan`. */
export function choisirPlanAvec(fichier: URL | string = new URL('../src/explorateur/resultats.json', import.meta.url)): PlanAvec {
  const repli = (raison: string): PlanAvec => ({ plan: PLAN_APRES, source: 'PLAN_APRES', raison });
  if (!existsSync(fichier)) return repli('src/explorateur/resultats.json absent');
  try {
    const plan = (JSON.parse(readFileSync(fichier, 'utf8')) as { classement?: { plan?: Plan }[] }).classement?.[0]?.plan;
    if (!plan) return repli('resultats.json sans classement[0].plan');
    const pb = problemesPlan(plan);
    if (pb.length) return repli(`plan de l’explorateur incompatible (${pb[0]})`);
    return { plan, source: 'explorateur', raison: 'meilleur plan de src/explorateur/resultats.json (classement[0])' };
  } catch (e) {
    return repli(`resultats.json illisible (${(e as Error).message})`);
  }
}

export { PLAN_AVANT, PLAN_APRES };

// ---------- Moteur ----------

export interface Mesure {
  journal: JournalRun;
  /** Sortis par issue. */
  sorties: Record<string, number>;
}
export interface Moteur {
  nom: string;
  jouer(plan: Plan, graine: number, sit: Situation): Mesure;
}

/** Mouvement de test enveloppé : compte les sorties par issue (le journal ne les expose pas). */
function mouvementCompteur(): { mouvement: Mouvement; sorties: Record<string, number> } {
  const interne = creerMouvementSimple();
  const sorties: Record<string, number> = Object.fromEntries(ISSUES.map((id) => [id, 0]));
  const mouvement: Mouvement = {
    init: (scene, personnes) => interne.init(scene, personnes),
    restantes: () => interne.restantes(),
    pas: (dt, t, intentions, ouvertes) => {
      const r = interne.pas(dt, t, intentions, ouvertes);
      for (const s of r.sorties) sorties[s.issue_id] = (sorties[s.issue_id] ?? 0) + 1;
      return r;
    },
  };
  return { mouvement, sorties };
}

/**
 * POINT D'ENTRÉE DU MOTEUR : `test` = mouvement de test de src/sim/behavior. `simjs` (moteur sim.js) sera câblé par un autre
 * sous-agent : il devra rendre un `Moteur` dont `jouer` renvoie le journal (même forme que `simuler()`) et les sorties par issue.
 */
export function creerMoteur(nom: string): Moteur {
  if (nom === 'simjs') throw new Error('Le moteur simjs n’est pas encore branché : utiliser --moteur=test.');
  if (nom !== 'test') throw new Error(`--moteur doit valoir test ou simjs (reçu : ${nom})`);
  return {
    nom: 'test',
    jouer(plan, graine, sit) {
      const { mouvement, sorties } = mouvementCompteur();
      const journal = simuler(planPourSituation(plan, sit), graine, DUREE_S, { ...sit.options, scene: scenePourSituation(sit), mouvement });
      return { journal, sorties };
    },
  };
}

// ---------- Agrégation ----------

export interface Critere {
  nom: string;
  sens: Sens;
  lire: (m: Mesure) => number | null;
}
export const CRITERES: Critere[] = [
  { nom: 'non_sortis_22h', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.non_sortis_22h.valeur },
  { nom: 'zone_danger', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.zone_danger.valeur },
  { nom: 't90', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.delai_t90_s },
  { nom: 't99', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.delai_t99_s },
  { nom: 'ecrasement', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.ecrasement.valeur },
  { nom: 'pmr_non_sortis', sens: 'moins_est_mieux', lire: (m) => m.journal.grille.non_sortis_22h_mobilite_reduite.valeur },
];
export const REACTIONS = ['hesitations_issue_fermee', 'part_ayant_change', 'tentatives_sans_issue', 'culs_de_sac'] as const;

export interface ResultatCritere {
  nom: string;
  sans: number;
  avec: number;
  /** Écart relatif (avec − sans) / |sans| en %, NaN si « sans » vaut 0. Négatif = amélioration (tous nos critères : moins est mieux). */
  ecart_pct: number;
  ic_bas_pct: number;
  ic_haut_pct: number;
  verdict: Verdict;
  sous_incertitude_modele: boolean | null;
}
export interface ResultatSituation {
  situation: Situation;
  n_graines: number;
  criteres: ResultatCritere[];
  reactions: { sans: Record<string, number>; avec: Record<string, number> };
  sorties_par_issue: { sans: Record<string, number>; avec: Record<string, number> };
}

const moy = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const moyParCle = (liste: Record<string, number>[], cles: readonly string[]) => Object.fromEntries(cles.map((k) => [k, moy(liste.map((x) => x[k] ?? 0))]));

export function agreger(sit: Situation, sans: Mesure[], avec: Mesure[]): ResultatSituation {
  const criteres = CRITERES.map((c): ResultatCritere => {
    const a = sans.map(c.lire);
    const b = avec.map(c.lire);
    const cmp = comparer(a, b);
    const ma = resumer(a.filter((x): x is number => x !== null)).moy;
    const mb = resumer(b.filter((x): x is number => x !== null)).moy;
    const ech = Number.isFinite(cmp.diff_relative_pct) ? cmp.diff_relative_pct : NaN;
    const enPct = (x: number) => (ma === 0 || cmp.d.plafond ? NaN : (100 * x) / Math.abs(ma));
    return {
      nom: c.nom, sans: ma, avec: mb, ecart_pct: ech,
      ic_bas_pct: enPct(cmp.d.bas), ic_haut_pct: enPct(cmp.d.haut),
      verdict: verdict(cmp, c.sens, ma),
      sous_incertitude_modele: Number.isFinite(ech) ? sousIncertitudeModele(ech) : null,
    };
  });
  return {
    situation: sit,
    n_graines: sans.length,
    criteres,
    reactions: {
      sans: moyParCle(sans.map((m) => m.journal.stats), REACTIONS),
      avec: moyParCle(avec.map((m) => m.journal.stats), REACTIONS),
    },
    sorties_par_issue: { sans: moyParCle(sans.map((m) => m.sorties), ISSUES), avec: moyParCle(avec.map((m) => m.sorties), ISSUES) },
  };
}

export function lancer(moteur: Moteur, situations: Situation[], graines: number[], planSans: Plan, planAvec: Plan): ResultatSituation[] {
  return situations.map((sit) => agreger(sit, graines.map((g) => moteur.jouer(planSans, g, sit)), graines.map((g) => moteur.jouer(planAvec, g, sit))));
}

// ---------- Résumé pour le jury ----------

const mediane = (xs: number[]): number => {
  const s = xs.filter(Number.isFinite).sort((p, q) => p - q);
  if (!s.length) return NaN;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const crit = (r: ResultatSituation, nom: string) => r.criteres.find((c) => c.nom === nom)!;
const arrondi = (x: number) => Math.round(x * 10) / 10;

export interface ResumeCritere {
  mediane_ecart_pct: number | null;
  n_definies: number;
  meilleure_dans: number;
  pire_dans: number;
  indistinct_dans: number;
  sous_incertitude_modele_dans: number;
}

export function resumerPreuve(res: ResultatSituation[]) {
  const par_critere: Record<string, ResumeCritere> = {};
  for (const c of CRITERES) {
    const lignes = res.map((r) => crit(r, c.nom));
    const definies = lignes.filter((l) => Number.isFinite(l.ecart_pct));
    const med = mediane(definies.map((l) => l.ecart_pct));
    par_critere[c.nom] = {
      mediane_ecart_pct: Number.isFinite(med) ? arrondi(med) : null,
      n_definies: definies.length,
      meilleure_dans: lignes.filter((l) => l.verdict === 'mieux').length,
      pire_dans: lignes.filter((l) => l.verdict === 'pire').length,
      indistinct_dans: lignes.filter((l) => l.verdict !== 'mieux' && l.verdict !== 'pire').length,
      sous_incertitude_modele_dans: definies.filter((l) => l.sous_incertitude_modele).length,
    };
  }
  // Critère vedette : les non-sortis à 22 h s'ils sont définis (« sans » > 0) dans au moins la moitié des situations, sinon la zone de danger.
  const vedette = par_critere.non_sortis_22h.n_definies * 2 >= res.length ? 'non_sortis_22h' : 'zone_danger';
  const libelle = vedette === 'non_sortis_22h' ? 'le nombre de personnes non sorties à 22 h' : 'l’exposition en zone de danger (personnes-minutes pondérées)';
  const v = par_critere[vedette];
  const t90 = par_critere.t90.mediane_ecart_pct;
  const sens90 = t90 === null ? 't90 non défini' : t90 > 0 ? `elle allonge t90 de ${Math.abs(t90)} %` : t90 < 0 ? `elle raccourcit t90 de ${Math.abs(t90)} %` : 'elle ne change pas t90';
  const red = v.mediane_ecart_pct;
  const verbe = red === null ? 'ne change pas' : red <= 0 ? 'réduit' : 'augmente';
  const ligne_jury = `Sur ${res.length} situations, notre solution ${verbe} ${libelle} de ${red === null ? 'n/a' : Math.abs(red)} % en médiane (meilleure dans ${v.meilleure_dans}/${res.length} situations) ; ${sens90}.`;
  return { critere_vedette: vedette, ligne_jury, par_critere };
}

// ---------- CSV ----------

const COLS_ISSUES = ISSUES.flatMap((id) => [`sorties_${id}_sans`, `sorties_${id}_avec`]);
const COLS_REACTIONS = REACTIONS.flatMap((k) => [`${k}_sans`, `${k}_avec`]);
const COLS_CRITERES = CRITERES.flatMap((c) => ['sans', 'avec', 'ecart_pct', 'ic95_bas_pct', 'ic95_haut_pct', 'verdict', 'sous_incertitude_modele'].map((k) => `${c.nom}_${k}`));
export const ENTETE_CSV = ['situation', 'libelle', 'lieu', 'codes', 'issues_bloquees', 'n_graines', ...COLS_CRITERES, ...COLS_REACTIONS, ...COLS_ISSUES, 'plan_avec', 'moteur', 'avertissement'];

export function lignesCsv(res: ResultatSituation[], meta: { plan_avec: string; moteur: string }): string[] {
  const lignes = [ligneCsv(ENTETE_CSV)];
  for (const r of res) {
    const s = r.situation;
    lignes.push(ligneCsv([
      s.id, s.libelle, s.lieu, s.codes.join(' '), s.bloquees.join(' '), r.n_graines,
      ...r.criteres.flatMap((c) => [nb(c.sans), nb(c.avec), nb(c.ecart_pct), nb(c.ic_bas_pct), nb(c.ic_haut_pct), c.verdict === 'plafond' ? PLAFOND : c.verdict,
        c.sous_incertitude_modele === null ? '' : c.sous_incertitude_modele ? 'vrai' : 'faux']),
      ...REACTIONS.flatMap((k) => [nb(r.reactions.sans[k]), nb(r.reactions.avec[k])]),
      ...ISSUES.flatMap((id) => [nb(r.sorties_par_issue.sans[id]), nb(r.sorties_par_issue.avec[id])]),
      meta.plan_avec, meta.moteur, AVERTISSEMENT,
    ]));
  }
  return lignes;
}
