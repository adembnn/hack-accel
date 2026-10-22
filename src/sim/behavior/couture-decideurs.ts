// Couture avec le lot decideurs (#10) : convertit leur Plan (minutes du jour, portes nommées, consignes par zone) vers le format
// interne du comportement (secondes depuis l'annonce, issues de la scène), et expose la simulation pas à pas sous l'interface
// `Simulateur` de #10. Le temps est converti ICI et nulle part ailleurs : 1160 + 3 min = 180 s depuis l'annonce.
// Aucun appel LLM : une consigne ne se lit que dans le champ structuré `consignes_par_zone`. Modèle simplifié, non certifié.
import { SEUIL_ROUGE } from '../metrics/grille.ts';
import { SCENE_UGC } from './scene-ugc.ts';
import { creerSimulation, SALLES, type OptionsSimulation } from './simuler.ts';
import { NIVEAUX, PORTES } from './couture-types.ts';
import type { EtatResume, Grille, Plan, Scenario, Simulateur } from './couture-types.ts';
import type { JournalRun, Plan as PlanInterne, Scene, Simulation } from './types.ts';

/**
 * Porte nommée de #10 -> issue de la scène. HYPOTHÈSES : la scène actuelle (`scene-ugc.ts`) est illustrative et n'a pas les
 * portes du Forum ; chaque ligne est à remplacer par la table de `scene.json` du lot jumeau-3d (#7). Une porte absente de la
 * table n'a pas d'équivalent dans la scène : la fermer est sans effet et le nom est listé dans `hors_plan`.
 */
export const PORTE_VERS_ISSUE: Record<string, string> = {
  lescot: 'principale', // hypothèse, à remplacer par scene.json de #7 : porte d'entrée du cinéma = hall principal
  berger: 'ferronnerie', // hypothèse, à remplacer par scene.json de #7 : PORTES_VERS_PERIMETRE, seule issue de la scène qui débouche en périmètre
  rambuteau: 'secours', // hypothèse, à remplacer par scene.json de #7 : la scène appelle « secours » la sortie rue Rambuteau (issue distincte de berger)
  pont_neuf: 'metro', // hypothèse, à remplacer par scene.json de #7 : côté Châtelet, accès métro et RER
  canopee: 'escalators', // hypothèse, à remplacer par scene.json de #7 : Canopée = niveau 0, escalators vers la Place Carrée
};

/** Ce que la scène n'a pas pu appliquer : noms inconnus, ou connus mais sans équivalent. Jamais d'exception pour un nom. */
export interface HorsPlan {
  portes: string[];
  zones: string[];
  points: string[];
}

export interface PlanConverti {
  plan: PlanInterne;
  hors_plan: HorsPlan;
}

const SECONDES_PAR_MINUTE = 60;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Convertit un Plan de #10 vers le Plan interne.
 * - `portes` : seules les portes fermées comptent (l'état de la scène est « ouvert »), dès l'instant où le plan s'applique.
 * - `phasage_salles` : minute du jour -> secondes depuis l'annonce (jamais négatif).
 * - `guidage` : la scène n'accepte qu'un seul point de guidage ; on garde celui qui a le plus d'agents, les autres vont dans `hors_plan.points`.
 * - `consignes_par_zone` -> messages par salle ; `messages_par_zone` (texte) est ignoré : pas d'analyse de texte.
 * - `confinement` : actif sans zones = tout le monde ; sinon seulement les salles nommées.
 * `debut_consigne_s` donne l'instant d'arrivée de chaque consigne (par zone) ; absent = 0.
 */
export function convertirPlan(plan: Plan, scenario: Scenario, debut_consigne_s: Record<string, number> = {}): PlanConverti {
  const hors = { portes: new Set<string>(), zones: new Set<string>(), points: new Set<string>() };
  const salles = new Set(SALLES);

  const fermees = new Set<string>();
  for (const [nom, etat] of Object.entries(plan.portes)) {
    if (!PORTES.includes(nom)) hors.portes.add(nom);
    else if (etat === 'fermee') {
      const issue = PORTE_VERS_ISSUE[nom];
      if (issue) fermees.add(issue);
      else hors.portes.add(nom);
    }
  }

  const phasage_salles: PlanInterne['phasage_salles'] = [];
  for (const { salle, minute_depart } of plan.phasage_salles) {
    if (salles.has(salle)) phasage_salles.push({ salle, delai_s: Math.max(0, (minute_depart - scenario.minute_annonce) * SECONDES_PAR_MINUTE) });
    else hors.zones.add(salle);
  }

  let guidage: PlanInterne['guidage'] = null;
  let pointGarde = '';
  for (const { point, agents } of plan.guidage) {
    const issue = PORTE_VERS_ISSUE[point];
    if (!issue || agents <= 0) hors.points.add(point);
    else if (!guidage || agents > guidage.personnel) {
      if (guidage) hors.points.add(pointGarde);
      guidage = { issue_id: issue, personnel: agents };
      pointGarde = point;
    } else hors.points.add(point);
  }

  const messages_par_zone: PlanInterne['messages_par_zone'] = [];
  for (const [zone, { porte, clarte }] of Object.entries(plan.consignes_par_zone ?? {})) {
    const issue_id = PORTE_VERS_ISSUE[porte];
    if (!salles.has(zone)) hors.zones.add(zone);
    else if (!issue_id) hors.portes.add(porte);
    else messages_par_zone.push({ zone, issue_id, clarte: clamp01(clarte), a_partir_de_s: debut_consigne_s[zone] ?? 0 });
  }

  const { actif, zones } = plan.confinement;
  const confinees = zones.filter((z) => salles.has(z));
  for (const z of zones) if (!salles.has(z)) hors.zones.add(z);

  return {
    plan: {
      mode: plan.mode,
      portes: [...fermees].map((id) => ({ id, ouverte: false, a_partir_de_s: 0 })),
      phasage_salles,
      guidage,
      messages_par_zone,
      confinement: actif && (zones.length === 0 || confinees.length > 0),
      ...(confinees.length ? { confinement_salles: confinees } : {}),
    },
    hors_plan: { portes: [...hors.portes], zones: [...hors.zones], points: [...hors.points] },
  };
}

/** `Simulateur` de #10 branché sur le comportement : une minute simulée = 60 pas d'une seconde. */
export class SimulateurFouleDecision implements Simulateur {
  /** Noms du dernier plan ou du dernier scénario que la scène n'a pas pu appliquer (mis à jour à chaque `avancer` / `initialiser`). */
  hors_plan: HorsPlan = { portes: [], zones: [], points: [] };
  hors_scenario: string[] = [];

  #scene: Scene;
  #options: OptionsSimulation;
  #sim: Simulation | null = null;
  #scenario: Scenario | null = null;
  #minute = 0;
  #planVu: string | null = null;
  #planInterne: PlanInterne | null = null;
  #consignes = new Map<string, { cle: string; depuis_s: number }>();

  constructor(scene: Scene = SCENE_UGC, options: OptionsSimulation = {}) {
    this.#scene = scene;
    this.#options = options;
  }

  grille(): Grille {
    // seules les salles reçoivent consignes, phasage et confinement : on n'annonce que les zones que le plan peut viser
    return { niveaux: [...NIVEAUX], portes: [...PORTES], zones: [...SALLES], seuil_densite: SEUIL_ROUGE };
  }

  initialiser(scenario: Scenario): void {
    const pop = scenario.population;
    this.hors_scenario = Object.keys(pop).filter((z) => !SALLES.includes(z));
    // population fournie pour au moins une salle : elle remplace le défaut (salle absente = vide) ; sinon défaut de la simulation
    const population_par_salle = SALLES.some((s) => (pop[s] ?? 0) > 0) ? Object.fromEntries(SALLES.map((s) => [s, Math.max(0, Math.round(pop[s] ?? 0))])) : undefined;
    const enSecondes = (minute: number) => (minute - scenario.minute_annonce) * SECONDES_PAR_MINUTE;
    this.#sim = creerSimulation(this.#scene, scenario.graine, {
      ...this.#options,
      ...(population_par_salle ? { population_par_salle } : {}),
      echeances: { metro_s: enSecondes(scenario.stations_fermees_minute), couvre_feu_s: enSecondes(scenario.couvre_feu_debut_minute) },
    });
    this.#scenario = scenario;
    this.#minute = scenario.minute_annonce;
    this.#planVu = null;
    this.#planInterne = null;
    this.#consignes.clear();
    this.hors_plan = { portes: [], zones: [], points: [] };
  }

  /** `minutes` entières. Un plan identique au précédent garde le même objet interne (rien n'est recalculé). */
  avancer(plan: Plan, minutes: number): EtatResume {
    const sim = this.#simulation();
    const cle = JSON.stringify(plan);
    if (cle !== this.#planVu) {
      // une consigne garde la date de la PREMIÈRE consigne reçue par sa zone, même si son contenu change ensuite : le départ
      // se compte depuis la première alerte, une mise à jour de porte ne remet pas l'horloge de départ à zéro
      const vues = new Map<string, { cle: string; depuis_s: number }>();
      for (const [zone, c] of Object.entries(plan.consignes_par_zone ?? {})) {
        const k = `${c.porte}|${c.clarte}`;
        const avant = this.#consignes.get(zone);
        vues.set(zone, { cle: k, depuis_s: avant ? avant.depuis_s : sim.t_s });
      }
      this.#consignes = vues;
      const conv = convertirPlan(plan, this.#scenario!, Object.fromEntries([...vues].map(([z, v]) => [z, v.depuis_s])));
      this.#planInterne = conv.plan;
      this.hors_plan = conv.hors_plan;
      this.#planVu = cle;
    }
    for (let k = 0; k < Math.floor(minutes); k++) {
      sim.pas(SECONDES_PAR_MINUTE, this.#planInterne!);
      this.#minute++;
    }
    return this.etat();
  }

  etat(): EtatResume {
    const e = this.#simulation().etatResume();
    // débit par porte nommée : le débit de l'issue, partagé à parts égales entre les portes qui y mènent (hypothèse, comme PORTE_VERS_ISSUE)
    const parIssue = new Map<string, number>();
    for (const issue of Object.values(PORTE_VERS_ISSUE)) parIssue.set(issue, (parIssue.get(issue) ?? 0) + 1);
    const debit_portes = Object.fromEntries(PORTES.map((p) => [p, PORTE_VERS_ISSUE[p] ? (e.debit_portes[PORTE_VERS_ISSUE[p]] ?? 0) / parIssue.get(PORTE_VERS_ISSUE[p])! : 0]));
    return {
      minute: this.#minute,
      dans_le_centre: e.dans_le_centre,
      sortis: e.sortis,
      sortis_vers_zone_danger: e.sortis_vers_zone_danger,
      densite_max: e.densite_max,
      par_zone: e.par_zone,
      debit_portes,
      pression_max: e.pression_max, // proxy du mouvement de test, pas une mesure
    };
  }

  /** Journal et grille propres au comportement (critères d'Adem, #15), pour qui veut les notes du simulateur. */
  journal(): JournalRun {
    return this.#simulation().journal();
  }

  #simulation(): Simulation {
    if (!this.#sim) throw new Error('SimulateurFouleDecision : appeler initialiser(scenario) avant avancer() ou etat()');
    return this.#sim;
  }
}
