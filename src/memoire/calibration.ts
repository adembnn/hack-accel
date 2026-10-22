// (2) CALIBRATION : on ajuste au plus deux paramètres BORNÉS du modèle de comportement pour que la durée simulée
// « comme ça s'est passé » (plan réellement appliqué) colle à la durée rapportée par le client. Sans durée rapportée : refus.
// Le modèle de comportement (src/sim/behavior) n'est pas modifié : les paramètres passent par le Mouvement injecté, qui
// ajuste les personnes juste après leur tirage (simuler appelle mouvement.init AVANT de lire delai_s).
// Modèle simplifié, non certifié.
import { creerMouvementSimple } from '../sim/behavior/mouvement-simple.ts';
import { simuler, type OptionsSimulation } from '../sim/behavior/simuler.ts';
import { POIDS } from '../sim/behavior/sortie.ts';
import type { JournalRun, Mouvement, Personne, Plan, Scene } from '../sim/behavior/types.ts';
import type { ScenarioRex } from './rex-scenario.ts';
import { moyenne, resume, type Resume } from './stats.ts';

/**
 * Bornes documentées (recherche/06-science-des-foules-et-calibrage.md : pré-mouvement en cinéma, moyennes de 30 à 44 s,
 * extrêmes de 11 à 224 s, mais issus d'exercices d'incendie ; une alerte d'ordre public peut être plus lente) :
 * - echelle_delai : multiplicateur des délais de pré-mouvement tirés (médiane de base 40,5 s) ; 0,5 à 3 = médiane de 20 à 120 s.
 * - suivisme_moyen : moyenne du coefficient de suivisme (base 0,076 ; sources : Lovreglio, préprint arXiv 2110.11577) ; 0 à 0,2.
 */
export const BORNES = { echelle_delai: [0.5, 3] as const, suivisme_moyen: [0, 0.2] as const };
export interface ParamsModele { echelle_delai: number; suivisme_moyen: number }
export const PARAMS_DEFAUT: ParamsModele = { echelle_delai: 1, suivisme_moyen: POIDS.suivisme_moyen };

const borner = (x: number, [lo, hi]: readonly [number, number]): number => Math.min(hi, Math.max(lo, x));

/** Mouvement qui applique les paramètres calibrés aux personnes tirées, puis délègue au mouvement simple. */
export function mouvementCalibre(params: ParamsModele): Mouvement {
  const p = { echelle_delai: borner(params.echelle_delai, BORNES.echelle_delai), suivisme_moyen: borner(params.suivisme_moyen, BORNES.suivisme_moyen) };
  const interne = creerMouvementSimple();
  return {
    init(scene: Scene, personnes: Personne[]) {
      for (const x of personnes) {
        x.delai_s *= p.echelle_delai; // les membres d'un groupe ont le même délai : le facteur commun le préserve
        x.suivisme += p.suivisme_moyen - POIDS.suivisme_moyen;
      }
      interne.init(scene, personnes);
    },
    pas: (...a) => interne.pas(...a),
    restantes: () => interne.restantes(),
  };
}

export function optionsSim(sc: ScenarioRex, params: ParamsModele): OptionsSimulation {
  return { ...sc.options, scene: sc.scene, mouvement: mouvementCalibre(params) };
}

export function jouer(sc: ScenarioRex, plan: Plan, graine: number, params: ParamsModele, duree_s = sc.duree_s): JournalRun {
  return simuler(plan, graine, duree_s, optionsSim(sc, params));
}

/** Durée simulée selon la définition du client. Si t90 n'est jamais atteint, la durée plafond est retenue (censure signalée par l'appelant). */
export function dureeSimulee(run: JournalRun, definition: 'complete' | 't90'): number {
  return definition === 't90' ? (run.grille.delai_t90_s ?? run.duree_s) : run.duree_s;
}

export interface RapportCalibration {
  statut: 'calibre' | 'calibre_partiel' | 'refusee';
  raison: string;
  params: ParamsModele;
  bornes: typeof BORNES;
  duree_rapportee_s: number | null;
  duree_definition: 'complete' | 't90';
  /** Durée simulée avec les paramètres par défaut (avant calibration), graines d'entraînement. */
  avant: Resume | null;
  /** Durée simulée calibrée, graines d'entraînement. */
  entrainement: Resume | null;
  /** Durée simulée calibrée sur des graines JAMAIS utilisées pour caler. */
  controle: Resume | null;
  /** Écart restant sur le contrôle : simulé - rapporté (s) et en % du rapporté. */
  ecart_restant_s: number | null;
  ecart_restant_pct: number | null;
  graines_entrainement: number[];
  graines_controle: number[];
  evaluations: number;
  limites: string[];
}

export interface OptionsCalibration { graines_entrainement?: number[]; graines_controle?: number[]; iterations?: number; tolerance_pct?: number }

const LIMITES_CALIBRATION = [
  'une seule durée rapportée contraint au mieux un paramètre : le second (suivisme) n\'est ajusté que si l\'écart dépasse la tolérance, et reste mal identifié',
  'la durée du client est « selon le client » et peut inclure des retards que le modèle ne représente pas (alerte, comptage, retour des familles)',
  'calibrer sur un seul incident ne prouve pas que les paramètres valent pour un autre lieu',
];

/** (2) Calibre echelle_delai par dichotomie (la durée croît avec le délai), puis, si l'écart reste > tolérance, suivisme_moyen par grille. */
export function calibrer(sc: ScenarioRex, o: OptionsCalibration = {}): RapportCalibration {
  const train = o.graines_entrainement ?? [1, 2, 3, 4, 5, 6, 7, 8];
  const controleG = o.graines_controle ?? [101, 102, 103, 104, 105, 106, 107, 108];
  const tol = o.tolerance_pct ?? 5;
  const base = {
    bornes: BORNES, duree_rapportee_s: sc.duree_rapportee_s, duree_definition: sc.duree_definition,
    graines_entrainement: train, graines_controle: controleG, limites: LIMITES_CALIBRATION,
  };
  if (sc.duree_rapportee_s === null) {
    return { ...base, statut: 'refusee', raison: 'REX sans durée rapportée : calibration NON FAITE (paramètres par défaut conservés)', params: { ...PARAMS_DEFAUT }, avant: null, entrainement: null, controle: null, ecart_restant_s: null, ecart_restant_pct: null, evaluations: 0 };
  }
  const cible = sc.duree_rapportee_s;
  let evaluations = 0;
  const durees = (params: ParamsModele, graines: number[]): number[] => graines.map((g) => { evaluations++; return dureeSimulee(jouer(sc, sc.plan_reel, g, params), sc.duree_definition); });
  const f = (params: ParamsModele) => moyenne(durees(params, train));

  const avant = resume(durees(PARAMS_DEFAUT, train));
  let params: ParamsModele = { ...PARAMS_DEFAUT };
  let [lo, hi] = BORNES.echelle_delai as readonly [number, number];
  const flo = f({ ...params, echelle_delai: lo });
  const fhi = f({ ...params, echelle_delai: hi });
  if (cible <= flo) params.echelle_delai = lo;
  else if (cible >= fhi) params.echelle_delai = hi;
  else {
    for (let k = 0; k < (o.iterations ?? 7); k++) {
      const mid = (lo + hi) / 2;
      if (f({ ...params, echelle_delai: mid }) < cible) lo = mid; else hi = mid;
    }
    params.echelle_delai = (lo + hi) / 2;
  }
  let courant = f(params);
  if (Math.abs(courant - cible) / cible > tol / 100) {
    for (const s of [0, 0.05, 0.1, 0.15, 0.2]) {
      const essai = { ...params, suivisme_moyen: s };
      const v = f(essai);
      if (Math.abs(v - cible) < Math.abs(courant - cible)) { params = essai; courant = v; }
    }
  }
  const entrainement = resume(durees(params, train));
  const controle = resume(durees(params, controleG));
  const ecart_s = controle.moyenne - cible;
  const ecart_pct = (100 * ecart_s) / cible;
  const aBord = params.echelle_delai <= BORNES.echelle_delai[0] + 1e-9 || params.echelle_delai >= BORNES.echelle_delai[1] - 1e-9;
  const bon = Math.abs(ecart_pct) <= 10 && !aBord;
  return {
    ...base, params, avant, entrainement, controle, evaluations,
    ecart_restant_s: ecart_s, ecart_restant_pct: ecart_pct,
    statut: bon ? 'calibre' : 'calibre_partiel',
    raison: bon
      ? `écart de contrôle ${ecart_pct.toFixed(1)} % (≤ 10 %), paramètres dans leurs bornes`
      : `écart de contrôle ${ecart_pct.toFixed(1)} %${aBord ? ' ; un paramètre est collé à sa borne : le modèle ne reproduit pas la durée rapportée' : ''}`,
  };
}
