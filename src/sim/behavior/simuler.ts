// Moteur de comportement : à chaque seconde simulée, décide pour chaque personne (partir, où, avec qui, changer d'avis,
// hésiter devant une issue fermée, réagir aux messages), passe les intentions au Mouvement, note le run.
// Deux entrées : `creerSimulation(scene, graine, opts)` (pilotable pas à pas, le plan peut changer entre deux pas : couture
// avec les décideurs) et `simuler(plan, graine, duree_s)` (un simple appel de la première, couture de Titouan, ticket #9).
// Chaque personne a ses propres flux aléatoires (voir rng.ts) : deux plans joués avec la même graine voient les mêmes
// personnes, les mêmes délais et les mêmes tirages. Modèle simplifié, non certifié.
import { calculerGrille, NIVEAU_DANGER, SEJOUR_DEHORS_MIN, SEUIL_ALERTE, SEUIL_ROUGE, type Mesures } from '../metrics/grille.ts';
import { CONTEXTE_SANS_MENACE_MAX, medianePreset, multiplicateurDelai, nePartPas, PRESET_PLANCHER, tirerDelaiLogLogistique, type PreregageDepart } from './depart.ts';
import { creerMouvementSimple, DEBIT_PAR_METRE, distanceVers } from './mouvement-simple.ts';
import { CANAL, creerRngPersonne, type Rng } from './rng.ts';
import {
  CANAL_AIDE,
  CANAL_PMR,
  completerPmr,
  delaiAgent,
  delaiVoisin,
  peutEmprunter,
  tirerProfil,
  tirerVitessePmr,
  vitesseAidant,
  vitesseAidee,
  type OptionsPmr,
} from './pmr.ts';
import { reaction } from './reactions/catalogue.ts';
import { CONTAGIEUSES, creerReactions, type Moment, type OptionsReactions } from './reactions/foule.ts';
import { appliquerInfluence, BONUS_MAX, type Personne as PersonneVoisine } from './reactions/influence.ts';
import { SCENE_UGC, ECHEANCES_UGC } from './scene-ugc.ts';
import {
  choisir,
  completerChangement,
  completerChoix,
  coutMinutes,
  probaChangement,
  tirerSuivisme,
  type CandidatSortie,
  type ParamsChangement,
  type ParamsChoix,
} from './sortie.ts';
import type { EtatMinute, EtatResume, Intention, JournalRun, Mouvement, Personne, Plan, Scene, Simulation } from './types.ts';

export interface OptionsSimulation {
  scene?: Scene;
  mouvement?: Mouvement;
  echeances?: { metro_s: number; couvre_feu_s: number };
  /** Nombre de personnes par salle (défaut 500 x 6 = 3 000, ordre de grandeur de l'incident du 19 oct.). */
  personnes_par_salle?: number;
  /** Personnes par salle (clé = `salle_<kk>`), qui remplace `personnes_par_salle` ; une salle absente reste vide. Vient du scénario de #10. */
  population_par_salle?: Record<string, number>;
  /**
   * Part de PERSONNES en groupe (défaut 0,7). Source : Moussaïd et al. 2010, PLoS ONE, rue commerçante de Toulouse :
   * 55 % un jour de semaine, 70 % un samedi [lu] ; aucune mesure pour un soir de cinéma (le samedi est le proxy). À balayer 0,55 / 0,7 / 0,85.
   */
  part_groupes?: number;
  /** Part de personnes à mobilité réduite (défaut 4 %, hypothèse : fourchette de 4 % à 8 % dans reports/maths-6-mobilite-reduite.md). */
  part_mobilite_reduite?: number;
  /**
   * Mobilité réduite (pmr.ts) : profils (fauteuil, canne, autre) avec leur vitesse, issues interdites ou à aide, attente en espace
   * d'attente sécurisé (état `refuge`) puis aide d'un agent de guidage ou d'un proche du même groupe. `{ actif: false }` rend l'ancien
   * comportement (PMR à 0,6 m/s, mêmes issues que tout le monde).
   */
  pmr?: OptionsPmr;
  /** Choix de sortie : θ, suivisme (dont la variante « surpris »), forme du coût, correction des portes voisines. */
  choix?: Partial<ParamsChoix>;
  /** Changement d'avis : constante, coefficients de Haghani, période, déclencheur de vitesse. */
  changement?: Partial<ParamsChangement>;
  /** Durée de l'hésitation devant une issue fermée, tirée entre ces bornes (s). HYPOTHÈSE BALAYÉE, aucune mesure (maths-3 §3). */
  hesitation_s?: [number, number];
  /**
   * Préréglage du temps de départ (depart.ts) : PRESET_PLANCHER par défaut (exercice incendie, Forssberg 2019 [lu]) ;
   * PRESET_CENTRAL ou PRESET_LENT pour le couvre-feu sans menace visible (hypothèses encadrées, maths-2).
   */
  depart?: PreregageDepart;
  /**
   * Réactions de TOUTE la foule (reactions/foule.ts) : à l'annonce, devant une issue fermée sans avoir été prévenu, dans une file
   * de plus de 2 min, quand un voisin fait un malaise, quand un voisin donne un ordre ou répand une info, chaque personne tire
   * une des 15 réactions du catalogue dans une répartition (littérature ou LLM) et en subit l'effet chiffré. Désactivé par
   * défaut : sans cette option (ou `actif: false`), les résultats à graine égale sont identiques à ceux d'avant.
   */
  reactions?: OptionsReactions;
}

/** Les six salles du cinéma, nommées comme au glossaire : salle_<kk> sur deux chiffres. */
export const SALLES = Array.from({ length: 6 }, (_, k) => `salle_${String(k + 1).padStart(2, '0')}`);
const PAS_S = 1;
/** Fenêtre du débit observé des portes (s). */
const FENETRE_DEBIT_S = 60;
/** Taille maximale d'un groupe tiré (au-delà, la queue de la loi est ramenée à 6 : pas de rassemblement de dizaines). Hypothèse. */
export const TAILLE_GROUPE_MAX = 6;

/** λ de la loi de Poisson tronquée à zéro, tel que la part de personnes seules vaut e^-λ = 1 - part_en_groupe (maths-3 §1.2, calcul). */
export function lambdaGroupes(part_en_groupe: number): number {
  return -Math.log(1 - Math.min(Math.max(part_en_groupe, 0), 0.99));
}

/**
 * Taille d'une unité (1 = personne seule) : loi de Poisson tronquée à zéro, comme Moussaïd et al. 2010 [lu] (les paires
 * dominent, puis trios et quatuors). Tirage par inversion, une seule valeur aléatoire consommée.
 */
export function tirerTailleGroupe(rng: Rng, lambda: number, max = TAILLE_GROUPE_MAX): number {
  if (lambda <= 0) return 1;
  const u = rng.next();
  let p = (lambda * Math.exp(-lambda)) / (1 - Math.exp(-lambda)); // P(taille = 1)
  let cumul = p;
  let k = 1;
  while (u >= cumul && k < max) {
    k++;
    p *= lambda / k;
    cumul += p;
  }
  return k;
}

/** Population tirée UNIQUEMENT depuis la graine : identique pour tous les plans (comparaison à graines égales). */
export function creerPopulation(graine: number, opts: OptionsSimulation = {}): Personne[] {
  const rngGroupes = creerRngPersonne(graine, -1, CANAL.groupes);
  const parSalleDefaut = opts.personnes_par_salle ?? 500;
  const lambda = lambdaGroupes(opts.part_groupes ?? 0.7);
  const pmrP = completerPmr(opts.pmr);
  const partPmr = pmrP.part ?? opts.part_mobilite_reduite ?? 0.04;
  const choix = completerChoix(opts.choix);
  const preset = opts.depart ?? PRESET_PLANCHER;
  const gens: Personne[] = [];
  let prochainGroupe = 1;
  for (const salle of SALLES) {
    let restant = opts.population_par_salle ? (opts.population_par_salle[salle] ?? 0) : parSalleDefaut;
    while (restant > 0) {
      const taille = Math.min(restant, tirerTailleGroupe(rngGroupes, lambda));
      const gid = taille > 1 ? prochainGroupe++ : 0;
      const membres: Personne[] = [];
      for (let k = 0; k < taille; k++) {
        const id = gens.length + k;
        // un flux par personne ; tous les tirages sont faits dans le même ordre, quelles que soient les options
        const r = creerRngPersonne(graine, id, CANAL.traits);
        const uPmr = r.next();
        const vitesse = r.normal(1.2, 0.2);
        // « reste ? » sur son propre flux : le plancher (p_reste = 0) garde exactement les mêmes tirages qu'avant
        const reste = nePartPas(creerRngPersonne(graine, id, CANAL.reste).next(), preset.p_reste);
        const tire = tirerDelaiLogLogistique(r, medianePreset(preset), preset.forme);
        const delai = reste ? Infinity : tire;
        const suivisme = tirerSuivisme(r, choix);
        const uSecours = r.next();
        const uConfiance = r.next();
        const pmr = uPmr < partPmr;
        // profil et vitesse des PMR sur leur propre flux : aucun tirage des autres personnes n'est décalé
        let profil: Personne['profil_pmr'];
        let vitessePmr = 0.6;
        if (pmr && pmrP.actif) {
          const rp = creerRngPersonne(graine, id, CANAL_PMR);
          profil = tirerProfil(rp.next(), pmrP.profils);
          vitessePmr = tirerVitessePmr(rp, profil);
        }
        membres.push({
          id,
          salle,
          groupe: gid,
          mobilite_reduite: pmr,
          ...(profil ? { profil_pmr: profil } : {}),
          vitesse_m_s: pmr ? vitessePmr : Math.min(1.6, Math.max(0.8, vitesse)),
          delai_s: delai,
          suivisme,
          connait_secours: uSecours < 0.25,
          confiance: 0.5 + 0.5 * uConfiance,
        });
      }
      if (gid) {
        // groupe : le plus lent donne le rythme (Moussaïd 2010 [lu], écart de 0 à 0,08 m/s), on attend le dernier prêt (Bode 2015 [lu])
        const v = Math.min(...membres.map((m) => m.vitesse_m_s));
        const d = Math.max(...membres.map((m) => m.delai_s));
        for (const m of membres) {
          m.vitesse_m_s = v;
          m.delai_s = d;
        }
      }
      gens.push(...membres);
      restant -= taille;
    }
  }
  return gens;
}

/** Plan neutre, utilisé seulement pour remplir le journal d'une simulation qui n'a encore avancé d'aucun pas. */
const PLAN_NEUTRE: Plan = { mode: 'rester_ouvert', portes: [], phasage_salles: [], guidage: null, messages_par_zone: [], confinement: false };

/**
 * Crée une simulation pilotable pas à pas. Le plan est donné à chaque appel de `pas` : s'il change (autre objet), il
 * s'applique à partir de cet instant (portes, messages, guidage, et nouveaux instants de départ de ceux qui n'ont pas encore
 * quitté leur place). Les personnes déjà en route gardent leur issue visée, sauf si elle ferme.
 */
export function creerSimulation(scene: Scene, graine: number, opts: OptionsSimulation = {}): Simulation {
  const mouvement = opts.mouvement ?? creerMouvementSimple();
  const echeances = opts.echeances ?? ECHEANCES_UGC;
  const choixP = completerChoix(opts.choix);
  const chgP = completerChangement(opts.changement);
  const [hesMin, hesMax] = opts.hesitation_s ?? [5, 30];
  const personnes = creerPopulation(graine, opts);
  const pmrP = completerPmr(opts.pmr);
  const n = personnes.length;
  const rx = opts.reactions?.actif ? creerReactions(graine, n, opts.reactions) : null;
  mouvement.init(scene, personnes);

  const issuesId = scene.issues.map((i) => i.id);
  const debit = new Map(scene.issues.map((i) => [i.id, DEBIT_PAR_METRE * i.largeur_m])); // même débit que le mouvement (SFPE [lu])
  const issue = new Map(scene.issues.map((i) => [i.id, i]));
  const nbSalles = SALLES.length;

  // portes voisines (option IIA) : 1 + somme des ressemblances ; avec positions exp(-d/d0), sinon 1 pour une même zone
  const voisines = new Map<string, number>();
  for (const a of scene.issues) {
    let somme = 1;
    for (const b of scene.issues) {
      if (a === b) continue;
      if (a.position && b.position) somme += Math.exp(-Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) / choixP.rayon_iia_m);
      else if (a.zone === b.zone) somme += 1;
    }
    voisines.set(a.id, somme);
  }

  // un flux aléatoire par personne et par usage (créé à la demande)
  const flux = (canal: number) => {
    const a: (Rng | undefined)[] = new Array(n);
    return (i: number): Rng => (a[i] ??= creerRngPersonne(graine, i, canal));
  };
  const fluxChoix = flux(CANAL.choix);
  const fluxHesitation = flux(CANAL.hesitation);
  const fluxChangement = flux(CANAL.changement);
  const uGuidage = personnes.map((p) => creerRngPersonne(graine, p.id, CANAL.guidage).next());

  const parSalle = new Map<string, number>(SALLES.map((s) => [s, 0]));
  for (const p of personnes) parSalle.set(p.salle, (parSalle.get(p.salle) ?? 0) + 1);
  const restantParSalle = new Map(parSalle);

  // --- états ---
  type Phase = 'attente' | 'marche' | 'hesite' | 'refuge' | 'dehors';
  const phase: Phase[] = personnes.map(() => 'attente');
  const cible: (string | null)[] = personnes.map(() => null);
  const reprise: number[] = personnes.map(() => 0); // fin d'hésitation ou prochaine tentative
  const memoireFermee: Set<string>[] = personnes.map(() => new Set());
  const aChange: boolean[] = personnes.map(() => false);
  const guide: boolean[] = personnes.map(() => false);
  const departT: number[] = personnes.map(() => Infinity);
  const debutMarche: number[] = personnes.map(() => 0);
  const resteInitial: number[] = personnes.map(() => 0); // distance estimée à parcourir au début de la marche (m)
  const aQuitteSalle: boolean[] = personnes.map(() => false);
  const prochaineRevision: number[] = personnes.map((p) => (chgP.periode_s - (p.id % chgP.periode_s)) % chgP.periode_s);
  const ciblant = new Map(issuesId.map((id) => [id, 0]));
  const derniereSortie = new Map(issuesId.map((id) => [id, -Infinity]));
  const sortiesT = new Map<string, number[]>(issuesId.map((id) => [id, []]));
  const intentions: Intention[] = personnes.map((p) => ({ id: p.id, sortie_cible: null, vitesse_voulue_m_s: p.vitesse_m_s, groupe: p.groupe, etat: 'attente' }));
  // --- mobilité réduite (pmr.ts) ---
  const vit = personnes.map((p) => p.vitesse_m_s); // vitesse courante : change quand une PMR est aidée (et pour son aidant)
  const estPmr = personnes.map((p) => pmrP.actif && p.profil_pmr !== undefined);
  const aidee: boolean[] = personnes.map(() => false);
  const aideT: number[] = personnes.map(() => Infinity); // instant prévu de l'aide, tant que la personne est au refuge
  const aideSource: ('agent' | 'voisin' | null)[] = personnes.map(() => null);
  const abriDebut: number[] = personnes.map(() => Infinity);
  const abriFin: number[] = personnes.map(() => Infinity);
  const aidantsDistincts = new Set<number>();
  let aidesAgent = 0;
  let aidesVoisin = 0;
  const fluxAide = new Map<number, [number, number]>(); // deux tirages par PMR, faits une seule fois : agent puis proche
  const membresGroupe = new Map<number, number[]>();
  for (const p of personnes) if (p.groupe) membresGroupe.set(p.groupe, [...(membresGroupe.get(p.groupe) ?? []), p.id]);
  const groupeCible = new Map<number, string>(); // le premier du groupe qui décide donne la cible (cohésion)
  let changements = 0;
  let demiTours = 0; // personnes distinctes qui ont fait demi-tour : nouvelle visée après une hésitation devant une issue fermée
  const aFaitDemiTour: boolean[] = personnes.map(() => false);
  let hesitations = 0;
  let tentatives_vaines = 0;
  let sortisDanger = 0;

  const mes: Mesures = {
    n,
    t_sortie_s: new Array(n).fill(Infinity),
    mobilite_reduite: personnes.map((p) => p.mobilite_reduite),
    pmr_abri_debut_s: abriDebut,
    pmr_abri_fin_s: abriFin,
    danger_personnes_minutes: 0,
    culs_de_sac: 0,
    sorties_sures: 0,
    ecrasement_personnes_minutes: 0,
    pression_max: 0,
    echeances,
  };

  const minutes: EtatMinute[] = [];
  let densMax: Record<string, number> = {};
  let densMaxRun = 0;
  let t90: number | null = null;
  let dehors = 0;
  let t = 0;
  let prochaineMinute = 60;
  let plan: Plan | null = null;
  let retour: { densite_par_zone: Record<string, number>; pression_par_zone: Record<string, number>; file_par_issue: Record<string, number> } = {
    densite_par_zone: {},
    pression_par_zone: {},
    file_par_issue: {},
  };

  // --- plan : départs, guidage ---
  const messageDe = (salle: string, tt: number) => {
    let m: Plan['messages_par_zone'][number] | undefined;
    for (const x of plan!.messages_par_zone) if (x.zone === salle && x.a_partir_de_s <= tt && (!m || x.a_partir_de_s >= m.a_partir_de_s)) m = x;
    return m;
  };
  const appliquerPlan = (nouveau: Plan) => {
    plan = nouveau;
    const ordonne = nouveau.mode !== 'rester_ouvert';
    for (const p of personnes) {
      const i = p.id;
      if (phase[i] === 'dehors') continue;
      guide[i] = nouveau.guidage ? uGuidage[i] < Math.min(1, (nouveau.guidage.personnel * 40) / (parSalle.get(p.salle) ?? 1)) : false;
      if (phase[i] !== 'attente') continue;
      if (nouveau.confinement && (!nouveau.confinement_salles?.length || nouveau.confinement_salles.includes(p.salle))) {
        departT[i] = Infinity;
        continue;
      }
      const msgs = nouveau.messages_par_zone.filter((x) => x.zone === p.salle);
      const premier = msgs.length ? msgs.reduce((a, b) => (b.a_partir_de_s < a.a_partir_de_s ? b : a)) : undefined;
      const ordreT_ = (premier ? premier.a_partir_de_s : 0) + (nouveau.phasage_salles.find((x) => x.salle === p.salle)?.delai_s ?? 0);
      const clarte = premier ? premier.clarte : ordonne ? 0.6 : null;
      const mult = multiplicateurDelai({ clarte, guide: guide[i], ordonne });
      if (rx) {
        ordreT[i] = ordreT_;
        multBase[i] = mult;
      }
      departT[i] = ordreT_ + p.delai_s * mult * (rx ? rxDelai[i] : 1);
    }
    if (rx) annoncer(t);
  };

  const ouverte = (id: string, tt: number): boolean => {
    let o = issue.get(id)!.ouverte;
    let tm = -1;
    for (const x of plan!.portes) if (x.id === id && (x.a_partir_de_s ?? 0) <= tt && (x.a_partir_de_s ?? 0) >= tm) { o = x.ouverte; tm = x.a_partir_de_s ?? 0; }
    return o;
  };

  const attenteMin = (id: string, en_plus: number) => ((ciblant.get(id) ?? 0) + en_plus) / debit.get(id)! / 60;
  /** Marche restante estimée (m) de la personne vers son issue visée (ligne droite à vitesse voulue, comme le mouvement de test). */
  const resteM = (i: number, tt: number) => Math.max(0, resteInitial[i] - vit[i] * (tt - debutMarche[i]));
  const viser = (i: number, id: string, tt: number) => {
    phase[i] = 'marche';
    cible[i] = id;
    ciblant.set(id, (ciblant.get(id) ?? 0) + 1);
    debutMarche[i] = tt;
    if (rx && !malaiseProg[i] && malaiseApres[i] !== undefined) {
      malaiseProg[i] = true;
      malaiseT[i] = tt + malaiseApres[i]!;
    }
    // même distance que le mouvement : toute la distance au premier départ, détour ensuite
    resteInitial[i] = distanceVers(issue.get(id)!, !aQuitteSalle[i]);
    if (!aQuitteSalle[i]) {
      aQuitteSalle[i] = true;
      const s = personnes[i].salle;
      restantParSalle.set(s, (restantParSalle.get(s) ?? 1) - 1); // a quitté sa salle : compté désormais dans la zone de son issue
    }
  };

  const candidats = (i: number, tt: number, ouv: Record<string, boolean>, exclure?: string | null): CandidatSortie[] => {
    const p = personnes[i];
    const msg = messageDe(p.salle, tt);
    const totalCible = Math.max(1, [...ciblant.values()].reduce((a, b) => a + b, 0));
    const out: CandidatSortie[] = [];
    for (const id of issuesId) {
      if (id === exclure) continue;
      const fermee = !ouv[id];
      if (fermee && memoireFermee[i].has(id)) continue; // déjà vue fermée : exclue
      if (estPmr[i] && !peutEmprunter(issue.get(id)!.acces_pmr, aidee[i])) continue; // escalator, ou escalier sans aide
      // fermée et annoncée par un message ou le personnel : exclue ; fermée mais seulement visible : poids « fumée » du logit
      if (fermee && (msg !== undefined || guide[i])) continue;
      const sait = fermee && issue.get(id)!.visible;
      let consigne = 0; // le poids du message est une HYPOTHÈSE (aucune mesure « message par zone », maths-3 §4.3)
      if (msg && msg.issue_id === id && !(rx && rxIgnore[i])) consigne += p.confiance * msg.clarte;
      if (guide[i] && plan!.guidage?.issue_id === id && !(rx && rxIgnore[i])) consigne += p.confiance;
      out.push({
        id,
        marche_min: issue.get(id)!.distance_m / (vit[i] * 60),
        connue: issue.get(id)!.porte_entree || p.connait_secours,
        fermee_connue: sait,
        part_foule: (ciblant.get(id) ?? 0) / totalCible,
        consigne: Math.min(1, consigne),
        attente_min: attenteMin(id, 1), // (n + 1) / débit : la personne elle-même compte
        n_voisines: voisines.get(id),
        ...(rx ? { bonus: (rxBonus[i]?.get(id) ?? 0) + rxSuitFoule[i] * ((ciblant.get(id) ?? 0) / totalCible) } : {}),
      });
    }
    return out;
  };

  // --- refuge et aide (mobilité réduite) ---
  /** Un proche du même groupe, pas PMR, encore dans le centre (candidat à l'entraide). */
  const voisinDispo = (i: number): number | null => {
    if (!pmrP.entraide || !personnes[i].groupe) return null;
    for (const j of membresGroupe.get(personnes[i].groupe) ?? []) if (j !== i && !estPmr[j] && phase[j] !== 'dehors') return j;
    return null;
  };
  /** Instant de la première aide possible (agent de guidage du plan, ou proche) ; Infinity s'il n'y en a pas. */
  const planifierAide = (i: number, tt: number) => {
    let u = fluxAide.get(i);
    if (!u) {
      const r = creerRngPersonne(graine, i, CANAL_AIDE);
      u = [r.next(), r.next()];
      fluxAide.set(i, u);
    }
    const personnel = plan?.guidage?.personnel ?? 0;
    const tAgent = personnel > 0 ? tt + delaiAgent(u[0], personnel, pmrP) : Infinity;
    // le proche aide une fois qu'il est lui-même parti de sa place (hypothèse : il ne s'occupe de l'autre qu'après son départ)
    const j = voisinDispo(i);
    const tVoisin = j !== null ? Math.max(tt, departT[j]) + delaiVoisin(u[1], pmrP) : Infinity;
    aideT[i] = Math.min(tAgent, tVoisin);
    aideSource[i] = aideT[i] === Infinity ? null : tVoisin <= tAgent ? 'voisin' : 'agent';
  };
  const entrerRefuge = (i: number, tt: number) => {
    phase[i] = 'refuge';
    cible[i] = null;
    if (abriDebut[i] === Infinity) abriDebut[i] = tt;
    abriFin[i] = Infinity;
    planifierAide(i, tt);
    reprise[i] = tt + 10; // nouvel essai (issue accessible rouverte, plan qui change)
  };
  /** L'aide arrive : la personne devient « aidée » (escaliers permis, fauteuil poussé) et son aidant marche à sa vitesse. */
  const recevoirAide = (i: number): boolean => {
    let aidant: number | null = null;
    if (aideSource[i] === 'voisin') {
      aidant = voisinDispo(i);
      if (aidant === null) return false; // le proche est sorti entre-temps : on replanifie
      aidantsDistincts.add(aidant);
      aidesVoisin++;
    } else {
      aidesAgent++;
    }
    aidee[i] = true;
    vit[i] = vitesseAidee(personnes[i].profil_pmr!, vit[i]);
    if (aidant !== null) vit[aidant] = vitesseAidant(vit[aidant], vit[i]);
    aideT[i] = Infinity;
    return true;
  };

  // --- réactions de la foule (reactions/foule.ts) ; tout est inerte quand `rx` est null ---
  const zeros = () => personnes.map(() => 0);
  const uns = () => personnes.map(() => 1);
  const rxDelai = uns(); // produit des multiplicateurs de délai (annonce, influence)
  const rxVit = uns(); // produit des multiplicateurs de vitesse voulus
  const rxVitAp = uns(); // part déjà appliquée à vit[]
  const rxDebit = uns(); // multiplicateur de débit de la porte franchie
  const rxBonus: (Map<string, number> | undefined)[] = new Array(n);
  const rxIgnore: boolean[] = personnes.map(() => false); // ignore message et guidage (choisir seul, suivre la foule)
  const rxSuitFoule = zeros(); // bonus multiplié par la part de la foule vers la porte
  const ordreT = zeros();
  const multBase = uns();
  const annonceFaite: boolean[] = personnes.map(() => false);
  const fileFaite: boolean[] = personnes.map(() => false);
  const malaiseApres = personnes.map((p) => (rx && !p.mobilite_reduite ? rx.malaiseApres(p.id) : undefined));
  const malaiseT: number[] = personnes.map(() => Infinity);
  const malaiseProg: boolean[] = personnes.map(() => false);
  const malade: boolean[] = personnes.map(() => false);
  const malaiseFin: number[] = personnes.map(() => Infinity);
  const vitAvant = zeros();
  let malaises = 0;
  let aidesMalaiseVoisin = 0;
  let aidesMalaiseSecours = 0;
  let changementsFile = 0;
  const issueEntree = scene.issues.find((is) => is.porte_entree)?.id ?? null;
  const COTE_SALLE = Math.sqrt(scene.surface_salle_m2 / Math.max(1, nbSalles));
  /** Délai du secours (agent) pour un malaise sans aide d'un voisin (s). HYPOTHÈSE, aucune mesure. */
  const SECOURS_MALAISE_S = 180;
  const borneVit = (x: number) => Math.min(1.6, Math.max(0.4, x));

  const syncVit = (i: number) => {
    if (estPmr[i] || malade[i]) return;
    const f = rxVit[i] / rxVitAp[i];
    if (f !== 1) {
      vit[i] *= f;
      rxVitAp[i] = rxVit[i];
    }
  };
  const ajouterBonus = (i: number, id: string | null, b: number) => {
    if (!id || b <= 0) return;
    const m = (rxBonus[i] ??= new Map());
    m.set(id, Math.min(BONUS_MAX, (m.get(id) ?? 0) + b));
  };
  /** Issue conseillée à la personne : message de sa salle, sinon guidage du plan. */
  const issueConseillee = (i: number, tt: number): string | null => messageDe(personnes[i].salle, tt)?.issue_id ?? plan?.guidage?.issue_id ?? null;

  /** Effet d'une réaction sur la personne elle-même (hors influence). Renvoie le multiplicateur de délai à appliquer par l'appelant. */
  const appliquerReaction = (i: number, id: string, moment: Moment, tt: number): number => {
    if (id === 'suivre_consigne' && moment === 'annonce') return 1; // l'ancien comportement obéit déjà à la consigne : rien à ajouter
    const r = reaction(id);
    const e = r.effet;
    // seules les réactions de mouvement changent la vitesse de marche ; les attentes (s'informer, se figer...) passent par le délai
    if (e.mult_vitesse > 0 && (r.famille === 'urgence' || r.famille === 'entraide') && !estPmr[i]) {
      rxVit[i] = borneVit(rxVit[i] * e.mult_vitesse);
      syncVit(i);
    }
    if (e.mult_debit_porte < 1) rxDebit[i] = Math.min(rxDebit[i], e.mult_debit_porte);
    if (id === 'choisir_seul') {
      ajouterBonus(i, issueEntree, e.bonus_issue); // « souvent celle par laquelle on est entré » (catalogue)
      rxIgnore[i] = true;
    } else if (id === 'suivre_la_foule') {
      rxIgnore[i] = true;
      rxSuitFoule[i] = Math.max(rxSuitFoule[i], e.bonus_issue);
    } else if (e.bonus_issue > 0) {
      ajouterBonus(i, id === 'donner_un_ordre' ? (cible[i] ?? issueConseillee(i, tt) ?? issueEntree) : issueConseillee(i, tt), e.bonus_issue);
    }
    return e.mult_delai;
  };

  /** Voisins de la personne i dans le rayon (m) : même salle avant le départ, même issue visée en marche (ou même salle si rayon_zone = 'salle'). */
  const voisinsDe = (i: number, rayon: number): PersonneVoisine[] => {
    const r = rx!;
    const avant = phase[i] === 'attente' || !cible[i];
    const salle = avant || r.options.rayon_zone === 'salle';
    const cote = salle ? COTE_SALLE : Math.sqrt(issue.get(cible[i]!)!.surface_approche_m2);
    const [ui, vi] = r.position(i);
    const out: PersonneVoisine[] = [];
    for (let j = 0; j < n; j++) {
      if (j === i || phase[j] === 'dehors') continue;
      if (salle) {
        if (personnes[j].salle !== personnes[i].salle) continue;
        if (avant ? aQuitteSalle[j] : phase[j] !== 'marche') continue;
      } else if (phase[j] !== 'marche' || cible[j] !== cible[i]) continue;
      const [uj, vj] = r.position(j);
      if (Math.hypot((uj - ui) * cote, (vj - vi) * cote) > rayon) continue;
      out.push({ id: String(j), x: uj * cote, y: vj * cote, confiance: personnes[j].confiance });
    }
    return out;
  };
  const recalerDepart = (j: number, tt: number) => {
    if (phase[j] === 'attente' && Number.isFinite(departT[j])) departT[j] = Math.max(tt, ordreT[j] + personnes[j].delai_s * multBase[j] * rxDelai[j]);
  };
  /** Une réaction contagieuse de la personne i se propage à ses voisins (appliquerInfluence) ; adoption aléatoire bornée par les poids publiés. */
  const propager = (i: number, id: string, moment: Moment, tt: number) => {
    const r = rx!;
    if (!CONTAGIEUSES.has(id)) return;
    const c = reaction(id).effet.contagion;
    if (!c) return;
    const [ui, vi] = r.position(i);
    const cote = phase[i] === 'attente' || !cible[i] || r.options.rayon_zone === 'salle' ? COTE_SALLE : Math.sqrt(issue.get(cible[i]!)!.surface_approche_m2);
    const cite = id === 'donner_un_ordre' || id === 'propager_une_info' ? (cible[i] ?? issueConseillee(i, tt) ?? issueEntree) : null;
    const effets = appliquerInfluence(
      { id: String(i), x: ui * cote, y: vi * cote, reaction: id, issue: cite, intensite: r.estMeneur(i) ? 1 : 0.6 },
      voisinsDe(i, c.rayon_m),
      r.fluxInfluence(i, moment),
    );
    for (const ev of effets) {
      const j = Number(ev.id);
      r.touchees.add(j);
      if (r.estMeneur(i)) r.touchees_par_meneur.add(j);
      r.comptes.influence[id] = (r.comptes.influence[id] ?? 0) + 1;
      rxDelai[j] = Math.min(30, Math.max(0.3, rxDelai[j] * ev.mult_delai));
      recalerDepart(j, tt);
      if (!estPmr[j]) {
        rxVit[j] = borneVit(rxVit[j] * ev.mult_vitesse);
        syncVit(j);
      }
      if (ev.issue) ajouterBonus(j, ev.issue, ev.bonus_issue);
    }
  };
  /** À l'annonce : situation de la personne (agent qui guide, message clair, annonce sans menace, rumeur) puis réaction tirée. Une seule fois par personne. */
  const annoncer = (tt: number) => {
    const r = rx!;
    const ordonne = plan!.mode !== 'rester_ouvert';
    const sources: [number, string][] = [];
    for (const p of personnes) {
      const i = p.id;
      if (annonceFaite[i] || phase[i] !== 'attente' || !Number.isFinite(departT[i])) continue;
      annonceFaite[i] = true;
      const msgs = plan!.messages_par_zone.filter((x) => x.zone === p.salle);
      const premier = msgs.length ? msgs.reduce((a, b) => (b.a_partir_de_s < a.a_partir_de_s ? b : a)) : undefined;
      const situation = guide[i] ? 'agent_qui_guide' : premier ? (premier.clarte >= 0.7 ? 'message_clair' : 'annonce_sans_menace') : ordonne ? 'annonce_sans_menace' : 'rumeur';
      const id = r.tirer(i, 'annonce', situation);
      rxDelai[i] *= appliquerReaction(i, id, 'annonce', tt);
      if (CONTAGIEUSES.has(id)) sources.push([i, id]);
    }
    for (const [i, id] of sources) propager(i, id, 'annonce', tt);
    for (const p of personnes) recalerDepart(p.id, tt);
  };
  /** Une file de plus de 2 min devant la personne : réaction tirée ; certaines réactions la font reconsidérer sa porte (avec leur bonus). */
  const fileLongue = (i: number, ouv: Record<string, boolean>, tt: number) => {
    const r = rx!;
    fileFaite[i] = true;
    const cur = cible[i]!;
    const id = r.tirer(i, 'file_longue', 'file_longue');
    appliquerReaction(i, id, 'file_longue', tt);
    if (id === 'choisir_seul' || id === 'suivre_la_foule' || id === 'suivre_consigne') {
      const c = choisir(candidats(i, tt, ouv), personnes[i].suivisme, fluxChoix(i), choixP);
      if (c && c !== cur) {
        ciblant.set(cur, (ciblant.get(cur) ?? 0) - 1);
        viser(i, c, tt);
        changementsFile++;
      }
    }
    propager(i, id, 'file_longue', tt);
  };
  /** Malaise de la personne i : elle s'arrête ; ses voisins proches tirent « voisin qui tombe » ; le premier qui aide la remet en route. */
  const tomber = (i: number, tt: number) => {
    const r = rx!;
    malaiseT[i] = Infinity;
    malade[i] = true;
    vitAvant[i] = vit[i];
    vit[i] = 0;
    rxDebit[i] = Math.min(rxDebit[i], reaction('malaise').effet.mult_debit_porte);
    r.comptes.malaise.malaise = (r.comptes.malaise.malaise ?? 0) + 1;
    malaises++;
    const u = r.fluxInfluence(i, 'malaise');
    let aidant = -1;
    for (const v of voisinsDe(i, reaction('malaise').effet.contagion!.rayon_m)) {
      const j = Number(v.id);
      const id = r.tirer(j, 'voisin_qui_tombe', 'voisin_qui_tombe');
      if (id === 'aider') {
        if (aidant < 0 && !estPmr[j]) {
          aidant = j;
          rxVit[j] = borneVit(rxVit[j] * reaction('aider').effet.mult_vitesse); // il ralentit pour accompagner
          syncVit(j);
        }
      } else {
        appliquerReaction(j, id, 'voisin_qui_tombe', tt);
        propager(j, id, 'voisin_qui_tombe', tt);
      }
    }
    // aide d'un voisin : 10 à 30 s (hypothèse) ; sinon le secours arrive après SECOURS_MALAISE_S (hypothèse)
    malaiseFin[i] = tt + (aidant >= 0 ? 10 + 20 * u.next() : SECOURS_MALAISE_S);
    if (aidant >= 0) aidesMalaiseVoisin++;
    else aidesMalaiseSecours++;
  };

  /** Une étape de h secondes (h <= 1). */
  const sousPas = (h: number) => {
    const ouv: Record<string, boolean> = Object.fromEntries(issuesId.map((id) => [id, ouverte(id, t)]));

    for (let i = 0; i < n; i++) {
      const p = personnes[i];
      const it = intentions[i];
      if (phase[i] === 'dehors') continue;
      if (rx) {
        if (malade[i] && t >= malaiseFin[i]) {
          // aidée (ou secourue) : la personne repart plus lentement (vitesse x 0,7 = comportement coopératif, catalogue « aider »)
          malade[i] = false;
          malaiseFin[i] = Infinity;
          vit[i] = vitAvant[i] * reaction('aider').effet.mult_vitesse;
          syncVit(i);
        }
        if (phase[i] === 'marche' && malaiseT[i] <= t) {
          if (resteM(i, t) > 0) tomber(i, t);
          else malaiseT[i] = Infinity; // déjà dans la file : pas de malaise simulé
        }
      }
      const revision = t >= prochaineRevision[i];
      if (revision) prochaineRevision[i] += chgP.periode_s;

      if (phase[i] === 'attente' && t >= departT[i] && t >= reprise[i]) {
        // décision de partir : choix de sortie ; en groupe, on suit la cible du premier qui a décidé
        let c: string | null = null;
        const gc = p.groupe ? groupeCible.get(p.groupe) : undefined;
        if (gc && ouv[gc] && !memoireFermee[i].has(gc) && (!estPmr[i] || peutEmprunter(issue.get(gc)!.acces_pmr, aidee[i]))) c = gc;
        else {
          c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
          if (c && p.groupe) groupeCible.set(p.groupe, c);
        }
        if (c) viser(i, c, t);
        else if (estPmr[i]) entrerRefuge(i, t); // aucune issue utilisable : attente en espace d'attente sécurisé
        else {
          reprise[i] = t + 10;
          tentatives_vaines++;
        }
      } else if (phase[i] === 'hesite' && t >= reprise[i]) {
        // nouveau choix en excluant les issues vues fermées
        const c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
        if (c) {
          viser(i, c, t);
          if (!aFaitDemiTour[i]) {
            aFaitDemiTour[i] = true;
            demiTours++;
          }
        }
        else if (estPmr[i]) entrerRefuge(i, t);
        else {
          reprise[i] = t + 10;
          tentatives_vaines++;
        }
      } else if (phase[i] === 'refuge') {
        // l'aide arrive (agent ou proche), puis la personne choisit une issue, escaliers permis ; sinon, tous les 10 s, elle
        // regarde si une issue utilisable s'est ouverte, et replanifie l'aide si le plan a changé (guidage ajouté)
        if (t >= aideT[i] && recevoirAide(i)) {
          abriFin[i] = t;
          const c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
          if (c) viser(i, c, t);
          else entrerRefuge(i, t); // même aidée, rien d'ouvert : retour en attente
        } else if (t >= reprise[i]) {
          reprise[i] = t + 10;
          if (aideT[i] === Infinity || aideSource[i] === 'voisin') planifierAide(i, t);
          const c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
          if (c) {
            abriFin[i] = t;
            viser(i, c, t);
          }
        }
      } else if (phase[i] === 'marche' && cible[i] && !aChange[i] && revision) {
        // changement d'avis (Haghani et Sarvi 2019), une fois au plus par personne (garde-fou contre le va-et-vient)
        const cur = cible[i]!;
        const reste = resteM(i, t);
        // déclencheur mesuré (Liao 2017), en option : arrivée en file derrière d'autres = vitesse tombée sous la moitié
        const ralenti = reste <= 0 && (retour.file_par_issue[cur] ?? 0) > 1;
        const autres = candidats(i, t, ouv, cur).filter((c) => !c.fermee_connue);
        if ((!chgP.declencheur_vitesse || ralenti) && autres.length) {
          const coutCur = coutMinutes(reste / (p.vitesse_m_s * 60), attenteMin(cur, 0), choixP); // je compte déjà dans la file de cur
          const cout = (c: CandidatSortie) => coutMinutes(c.marche_min, c.attente_min, choixP);
          const meilleur = autres.reduce((a, b) => (cout(b) < cout(a) ? b : a));
          const ratio = coutCur > 0 ? (coutCur - cout(meilleur)) / coutCur : 0;
          if (ratio > 0) {
            const visible = issue.get(meilleur.id)!.visible || meilleur.connue;
            const social = t - (derniereSortie.get(meilleur.id) ?? -Infinity) <= chgP.fenetre_social_s;
            if (fluxChangement(i).next() < probaChangement(ratio, visible, social, chgP)) {
              ciblant.set(cur, (ciblant.get(cur) ?? 0) - 1);
              viser(i, meilleur.id, t);
              aChange[i] = true;
              changements++;
            }
          }
        }
      }

      // file de plus de 2 min devant la personne (attente estimée au débit de l'issue), une seule fois par personne
      if (rx && revision && !fileFaite[i] && phase[i] === 'marche' && cible[i] && resteM(i, t) <= 0 && (retour.file_par_issue[cible[i]!] ?? 0) / debit.get(cible[i]!)! / 60 > 2) fileLongue(i, ouv, t);

      it.etat = phase[i] === 'marche' ? 'marche' : phase[i] === 'hesite' ? 'hesite' : phase[i] === 'refuge' ? 'refuge' : 'attente';
      it.sortie_cible = phase[i] === 'marche' ? cible[i] : null;
      it.vitesse_voulue_m_s = vit[i];
      if (rx) it.mult_debit_porte = rxDebit[i];
    }

    const r = mouvement.pas(h, t, intentions, ouv);
    retour = r;

    for (const id of r.devant_issue_fermee) {
      const c = cible[id];
      if (c) {
        ciblant.set(c, (ciblant.get(c) ?? 0) - 1);
        memoireFermee[id].add(c);
      }
      // issue fermée sans avoir été prévenu (les prévenus l'excluent d'emblée) : réaction tirée, qui allonge ou raccourcit l'hésitation
      let multHes = 1;
      if (rx && c) {
        const rid = rx.tirer(id, 'issue_bloquee', 'issue_bloquee');
        multHes = Math.min(appliquerReaction(id, rid, 'issue_bloquee', t), CONTEXTE_SANS_MENACE_MAX); // plafond : hypothèse
        propager(id, rid, 'issue_bloquee', t);
      }
      cible[id] = null;
      phase[id] = 'hesite';
      const uHes = fluxHesitation(id).next();
      reprise[id] = rx ? t + (hesMin + (hesMax - hesMin) * uHes) * multHes : t + hesMin + (hesMax - hesMin) * uHes; // hypothèse balayée, aucune mesure
      hesitations++;
    }
    for (const s of r.sorties) {
      phase[s.id] = 'dehors';
      ciblant.set(s.issue_id, (ciblant.get(s.issue_id) ?? 0) - 1);
      cible[s.id] = null;
      mes.t_sortie_s[s.id] = t + h;
      derniereSortie.set(s.issue_id, t + h);
      sortiesT.get(s.issue_id)!.push(t + h);
      dehors++;
      const is = issue.get(s.issue_id)!;
      const derriere = is.devient_cul_de_sac_a_s !== undefined && t >= is.devient_cul_de_sac_a_s ? 'cul_de_sac' : is.derriere;
      if (derriere === 'cul_de_sac') mes.culs_de_sac++;
      else {
        mes.danger_personnes_minutes += NIVEAU_DANGER[derriere] * SEJOUR_DEHORS_MIN;
        if (derriere === 'sur') mes.sorties_sures++;
      }
      if (derriere === 'cul_de_sac' || derriere === 'interdite') sortisDanger++;
      if (t90 === null && dehors >= 0.9 * n) t90 = t + h;
    }
    for (const id of issuesId) {
      const rho = r.densite_par_zone[id] ?? 0;
      if (rho > SEUIL_ROUGE) mes.ecrasement_personnes_minutes += ((r.file_par_issue[id] ?? 0) * h) / 60;
      mes.pression_max = Math.max(mes.pression_max, r.pression_par_zone[id] ?? 0);
      densMax[id] = Math.max(densMax[id] ?? 0, rho);
      densMaxRun = Math.max(densMaxRun, rho);
    }
    t += h;
    const fin = dehors === n && t < prochaineMinute - 1e-9; // tout le monde est sorti avant la fin de la minute : on écrit l'état final
    if (t >= prochaineMinute - 1e-9 || fin) {
      minutes.push({
        t_s: fin ? t : prochaineMinute,
        personnes_dehors: dehors,
        personnes_restantes: n - dehors,
        densite_max_par_zone: densMax,
        sorties_saturees: issuesId.filter((id) => (r.densite_par_zone[id] ?? 0) >= SEUIL_ALERTE),
        t90_s: t90,
      });
      densMax = {};
      prochaineMinute += 60;
    }
  };

  return {
    personnes,
    get t_s() {
      return t;
    },
    fini: () => dehors === n,

    pas(dt_s, nouveauPlan) {
      if (nouveauPlan !== plan) appliquerPlan(nouveauPlan);
      let restant = dt_s;
      while (restant > 1e-9 && dehors < n) {
        const h = Math.min(PAS_S, restant);
        sousPas(h);
        restant -= h;
      }
    },

    etatResume(): EtatResume {
      const par_zone: EtatResume['par_zone'] = {};
      const surfaceSalle = scene.surface_salle_m2 / Math.max(1, nbSalles);
      for (const [salle, k] of restantParSalle) par_zone[salle] = { personnes: k, densite: k / surfaceSalle };
      for (const is of scene.issues) {
        const z = (par_zone[is.zone] ??= { personnes: 0, densite: 0 });
        z.personnes += ciblant.get(is.id) ?? 0;
        z.densite = Math.max(z.densite, retour.densite_par_zone[is.id] ?? 0);
      }
      const debit_portes: Record<string, number> = {};
      for (const id of issuesId) {
        const ts = sortiesT.get(id)!;
        let k = 0;
        for (let j = ts.length - 1; j >= 0 && ts[j] > t - FENETRE_DEBIT_S; j--) k++;
        debit_portes[id] = t > 0 ? k / Math.min(FENETRE_DEBIT_S, t) : 0;
      }
      return {
        t_s: t,
        dans_le_centre: n - dehors,
        sortis: dehors,
        sortis_vers_zone_danger: sortisDanger,
        densite_max: Math.max(0, ...issuesId.map((id) => retour.densite_par_zone[id] ?? 0)),
        par_zone,
        debit_portes,
        pression_max: Math.max(0, ...issuesId.map((id) => retour.pression_par_zone[id] ?? 0)),
        densite_max_depuis_debut: densMaxRun,
        pression_max_depuis_debut: mes.pression_max,
      };
    },

    journal(): JournalRun {
      const detailReactions = (): NonNullable<JournalRun['reactions']> => ({
        source: rx!.options.source,
        comptes: Object.fromEntries(Object.entries(rx!.comptes).map(([m, c]) => [m, { ...c }])),
        nb_meneurs: rx!.meneurs.size,
        part_meneurs: rx!.meneurs.size / n,
        part_touchee_influence: rx!.touchees.size / n,
        part_touchee_par_meneurs: rx!.touchees_par_meneur.size / n,
        malaises,
        aides_malaise_voisin: aidesMalaiseVoisin,
        aides_malaise_secours: aidesMalaiseSecours,
        changements_file: changementsFile,
      });
      /** Version à plat de detailReactions, pour `stats` (Record<string, number>) : reactions_<moment>_<réaction>. */
      const statsReactions = (): Record<string, number> => {
        const d = detailReactions();
        const out: Record<string, number> = {
          // tirages de réactions (l'adoption d'une réaction d'un voisin, moment « influence », est comptée à part)
          reactions_total: Object.entries(d.comptes).reduce((a, [m, c]) => (m === 'influence' ? a : a + Object.values(c).reduce((x, y) => x + y, 0)), 0),
          reactions_adoptions_influence: Object.values(d.comptes.influence).reduce((x, y) => x + y, 0),
          reactions_nb_meneurs: d.nb_meneurs,
          reactions_part_meneurs: d.part_meneurs,
          reactions_part_touchee_influence: d.part_touchee_influence,
          reactions_part_touchee_par_meneurs: d.part_touchee_par_meneurs,
          reactions_malaises: d.malaises,
          reactions_aides_malaise_voisin: d.aides_malaise_voisin,
          reactions_aides_malaise_secours: d.aides_malaise_secours,
          reactions_changements_file: d.changements_file,
        };
        for (const [m, c] of Object.entries(d.comptes)) for (const [r, k] of Object.entries(c)) if (k) out[`reactions_${m}_${r}`] = k;
        return out;
      };
      const personnesQuiOntChange = aChange.filter(Boolean).length;
      const pmrIds = personnes.filter((p) => p.mobilite_reduite).map((p) => p.id);
      const pmrSortis = pmrIds.filter((i) => Number.isFinite(mes.t_sortie_s[i]));
      return {
        plan: plan ?? PLAN_NEUTRE,
        graine,
        duree_s: t,
        minutes: [...minutes],
        grille: calculerGrille(mes),
        stats: {
          personnes: n,
          groupes: new Set(personnes.filter((p) => p.groupe).map((p) => p.groupe)).size,
          part_en_groupe: personnes.filter((p) => p.groupe).length / n,
          changements_avis: changements,
          personnes_ayant_change: personnesQuiOntChange,
          part_ayant_change: personnesQuiOntChange / n,
          hesitations_issue_fermee: hesitations,
          demi_tours: demiTours,
          tentatives_sans_issue: tentatives_vaines,
          culs_de_sac: mes.culs_de_sac,
          // mobilité réduite : temps moyen = instant de sortie moyen des PMR déjà sortis (0 si aucun) ; aidants = proches distincts + aides d'agents
          pmr_total: pmrIds.length,
          pmr_sortis: pmrSortis.length,
          pmr_en_refuge: pmrIds.filter((i) => phase[i] === 'refuge').length,
          pmr_temps_moyen_s: pmrSortis.length ? pmrSortis.reduce((a, i) => a + mes.t_sortie_s[i], 0) / pmrSortis.length : 0,
          pmr_aides_agent: aidesAgent,
          pmr_aides_voisin: aidesVoisin,
          aidants: aidantsDistincts.size + aidesAgent,
          ...(rx ? statsReactions() : {}),
        },
        ...(rx ? { reactions: detailReactions() } : {}),
      };
    },
  };
}

/** Joue un plan fixe jusqu'à la fin des sorties ou à duree_s. Résultat identique à piloter `creerSimulation` pas à pas de 1 s. */
export function simuler(plan: Plan, graine: number, duree_s: number, opts: OptionsSimulation = {}): JournalRun {
  const sim = creerSimulation(opts.scene ?? SCENE_UGC, graine, opts);
  while (sim.t_s < duree_s && !sim.fini()) sim.pas(PAS_S, plan);
  return { ...sim.journal(), plan };
}
