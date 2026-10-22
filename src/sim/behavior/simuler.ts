// Moteur de comportement : à chaque seconde simulée, décide pour chaque personne (partir, où, avec qui, changer d'avis,
// hésiter devant une issue fermée, réagir aux messages), passe les intentions au Mouvement, note le run.
// Deux entrées : `creerSimulation(scene, graine, opts)` (pilotable pas à pas, le plan peut changer entre deux pas : couture
// avec les décideurs) et `simuler(plan, graine, duree_s)` (un simple appel de la première, couture de Titouan, ticket #9).
// Chaque personne a ses propres flux aléatoires (voir rng.ts) : deux plans joués avec la même graine voient les mêmes
// personnes, les mêmes délais et les mêmes tirages. Modèle simplifié, non certifié.
import { calculerGrille, NIVEAU_DANGER, SEJOUR_DEHORS_MIN, SEUIL_ALERTE, SEUIL_ROUGE, type Mesures } from '../metrics/grille.ts';
import { multiplicateurDelai, tirerDelaiLogLogistique } from './depart.ts';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { CANAL, creerRngPersonne, type Rng } from './rng.ts';
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
  /** Part de personnes à mobilité réduite (défaut 4 %, hypothèse à sourcer). */
  part_mobilite_reduite?: number;
  /** Choix de sortie : θ, suivisme (dont la variante « surpris »), forme du coût, correction des portes voisines. */
  choix?: Partial<ParamsChoix>;
  /** Changement d'avis : constante, coefficients de Haghani, période, déclencheur de vitesse. */
  changement?: Partial<ParamsChangement>;
  /** Durée de l'hésitation devant une issue fermée, tirée entre ces bornes (s). HYPOTHÈSE BALAYÉE, aucune mesure (maths-3 §3). */
  hesitation_s?: [number, number];
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
  const partPmr = opts.part_mobilite_reduite ?? 0.04;
  const choix = completerChoix(opts.choix);
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
        const delai = tirerDelaiLogLogistique(r);
        const suivisme = tirerSuivisme(r, choix);
        const uSecours = r.next();
        const uConfiance = r.next();
        const pmr = uPmr < partPmr;
        membres.push({
          id,
          salle,
          groupe: gid,
          mobilite_reduite: pmr,
          vitesse_m_s: pmr ? 0.6 : Math.min(1.6, Math.max(0.8, vitesse)),
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
  const n = personnes.length;
  mouvement.init(scene, personnes);

  const issuesId = scene.issues.map((i) => i.id);
  const debit = new Map(scene.issues.map((i) => [i.id, 1.3 * i.largeur_m])); // SFPE, 1,3 pers/s par mètre [lu]
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
  type Phase = 'attente' | 'marche' | 'hesite' | 'dehors';
  const phase: Phase[] = personnes.map(() => 'attente');
  const cible: (string | null)[] = personnes.map(() => null);
  const reprise: number[] = personnes.map(() => 0); // fin d'hésitation ou prochaine tentative
  const memoireFermee: Set<string>[] = personnes.map(() => new Set());
  const aChange: boolean[] = personnes.map(() => false);
  const guide: boolean[] = personnes.map(() => false);
  const departT: number[] = personnes.map(() => Infinity);
  const debutMarche: number[] = personnes.map(() => 0);
  const resteInitial: number[] = personnes.map(() => 0); // distance estimée à parcourir au début de la marche (m)
  const prochaineRevision: number[] = personnes.map((p) => (chgP.periode_s - (p.id % chgP.periode_s)) % chgP.periode_s);
  const ciblant = new Map(issuesId.map((id) => [id, 0]));
  const derniereSortie = new Map(issuesId.map((id) => [id, -Infinity]));
  const sortiesT = new Map<string, number[]>(issuesId.map((id) => [id, []]));
  const intentions: Intention[] = personnes.map((p) => ({ id: p.id, sortie_cible: null, vitesse_voulue_m_s: p.vitesse_m_s, groupe: p.groupe, etat: 'attente' }));
  const groupeCible = new Map<number, string>(); // le premier du groupe qui décide donne la cible (cohésion)
  let changements = 0;
  let hesitations = 0;
  let tentatives_vaines = 0;
  let sortisDanger = 0;

  const mes: Mesures = {
    n,
    t_sortie_s: new Array(n).fill(Infinity),
    mobilite_reduite: personnes.map((p) => p.mobilite_reduite),
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
      const ordreT = (premier ? premier.a_partir_de_s : 0) + (nouveau.phasage_salles.find((x) => x.salle === p.salle)?.delai_s ?? 0);
      const clarte = premier ? premier.clarte : ordonne ? 0.6 : null;
      departT[i] = ordreT + p.delai_s * multiplicateurDelai({ clarte, guide: guide[i], ordonne });
    }
  };

  const ouverte = (id: string, tt: number): boolean => {
    let o = issue.get(id)!.ouverte;
    let tm = -1;
    for (const x of plan!.portes) if (x.id === id && (x.a_partir_de_s ?? 0) <= tt && (x.a_partir_de_s ?? 0) >= tm) { o = x.ouverte; tm = x.a_partir_de_s ?? 0; }
    return o;
  };

  const attenteMin = (id: string, en_plus: number) => ((ciblant.get(id) ?? 0) + en_plus) / debit.get(id)! / 60;
  /** Marche restante estimée (m) de la personne vers son issue visée (ligne droite à vitesse voulue, comme le mouvement de test). */
  const resteM = (i: number, tt: number) => Math.max(0, resteInitial[i] - personnes[i].vitesse_m_s * (tt - debutMarche[i]));
  const viser = (i: number, id: string, tt: number) => {
    phase[i] = 'marche';
    cible[i] = id;
    ciblant.set(id, (ciblant.get(id) ?? 0) + 1);
    debutMarche[i] = tt;
    resteInitial[i] = issue.get(id)!.distance_m;
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
      // fermée et annoncée par un message ou le personnel : exclue ; fermée mais seulement visible : poids « fumée » du logit
      if (fermee && (msg !== undefined || guide[i])) continue;
      const sait = fermee && issue.get(id)!.visible;
      let consigne = 0; // le poids du message est une HYPOTHÈSE (aucune mesure « message par zone », maths-3 §4.3)
      if (msg && msg.issue_id === id) consigne += p.confiance * msg.clarte;
      if (guide[i] && plan!.guidage?.issue_id === id) consigne += p.confiance;
      out.push({
        id,
        marche_min: issue.get(id)!.distance_m / (p.vitesse_m_s * 60),
        connue: issue.get(id)!.porte_entree || p.connait_secours,
        fermee_connue: sait,
        part_foule: (ciblant.get(id) ?? 0) / totalCible,
        consigne: Math.min(1, consigne),
        attente_min: attenteMin(id, 1), // (n + 1) / débit : la personne elle-même compte
        n_voisines: voisines.get(id),
      });
    }
    return out;
  };

  /** Une étape de h secondes (h <= 1). */
  const sousPas = (h: number) => {
    const ouv: Record<string, boolean> = Object.fromEntries(issuesId.map((id) => [id, ouverte(id, t)]));

    for (let i = 0; i < n; i++) {
      const p = personnes[i];
      const it = intentions[i];
      if (phase[i] === 'dehors') continue;
      const revision = t >= prochaineRevision[i];
      if (revision) prochaineRevision[i] += chgP.periode_s;

      if (phase[i] === 'attente' && t >= departT[i] && t >= reprise[i]) {
        // décision de partir : choix de sortie ; en groupe, on suit la cible du premier qui a décidé
        let c: string | null = null;
        const gc = p.groupe ? groupeCible.get(p.groupe) : undefined;
        if (gc && ouv[gc] && !memoireFermee[i].has(gc)) c = gc;
        else {
          c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
          if (c && p.groupe) groupeCible.set(p.groupe, c);
        }
        if (c) viser(i, c, t);
        else {
          reprise[i] = t + 10;
          tentatives_vaines++;
        }
      } else if (phase[i] === 'hesite' && t >= reprise[i]) {
        // nouveau choix en excluant les issues vues fermées
        const c = choisir(candidats(i, t, ouv), p.suivisme, fluxChoix(i), choixP);
        if (c) viser(i, c, t);
        else {
          reprise[i] = t + 10;
          tentatives_vaines++;
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

      it.etat = phase[i] === 'marche' ? 'marche' : phase[i] === 'hesite' ? 'hesite' : 'attente';
      it.sortie_cible = phase[i] === 'marche' ? cible[i] : null;
    }

    const r = mouvement.pas(h, t, intentions, ouv);
    retour = r;

    for (const id of r.devant_issue_fermee) {
      const c = cible[id];
      if (c) {
        ciblant.set(c, (ciblant.get(c) ?? 0) - 1);
        memoireFermee[id].add(c);
      }
      cible[id] = null;
      phase[id] = 'hesite';
      reprise[id] = t + hesMin + (hesMax - hesMin) * fluxHesitation(id).next(); // hypothèse balayée, aucune mesure
      hesitations++;
    }
    for (const s of r.sorties) {
      phase[s.id] = 'dehors';
      ciblant.set(s.issue_id, (ciblant.get(s.issue_id) ?? 0) - 1);
      cible[s.id] = null;
      mes.t_sortie_s[s.id] = t + h;
      derniereSortie.set(s.issue_id, t + h);
      sortiesT.get(s.issue_id)!.push(t + h);
      restantParSalle.set(personnes[s.id].salle, (restantParSalle.get(personnes[s.id].salle) ?? 1) - 1);
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
    if (t >= prochaineMinute - 1e-9) {
      minutes.push({
        t_s: prochaineMinute,
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
      const personnesQuiOntChange = aChange.filter(Boolean).length;
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
          tentatives_sans_issue: tentatives_vaines,
          culs_de_sac: mes.culs_de_sac,
        },
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
