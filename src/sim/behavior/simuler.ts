// Moteur de comportement : à chaque seconde simulée, décide pour chaque personne (partir, où, avec qui, changer d'avis,
// hésiter devant une issue fermée, réagir aux messages), passe les intentions au Mouvement, note le run.
// Appel de couture avec le lot decideurs : simuler(plan, graine, duree_s). Modèle simplifié, non certifié.
import { calculerGrille, NIVEAU_DANGER, SEJOUR_DEHORS_MIN, SEUIL_ALERTE, SEUIL_ROUGE, type Mesures } from '../metrics/grille.ts';
import { multiplicateurDelai, tirerDelaiLogLogistique } from './depart.ts';
import { creerMouvementSimple } from './mouvement-simple.ts';
import { creerRng } from './rng.ts';
import { SCENE_UGC, ECHEANCES_UGC } from './scene-ugc.ts';
import { choisir, normaliserDistances, probaChangement, tirerSuivisme, type CandidatSortie } from './sortie.ts';
import type { EtatMinute, Intention, JournalRun, Mouvement, Personne, Plan, Scene } from './types.ts';

export interface OptionsSimulation {
  scene?: Scene;
  mouvement?: Mouvement;
  echeances?: { metro_s: number; couvre_feu_s: number };
  /** Nombre de personnes par salle (défaut 500 x 6 = 3 000, ordre de grandeur de l'incident du 19 oct.). */
  personnes_par_salle?: number;
  /** Part de personnes en groupe (défaut 70 %, étude citée par un article secondaire, rapport instantane-3 §4). */
  part_groupes?: number;
  /** Part de personnes à mobilité réduite (défaut 4 %, hypothèse à sourcer). */
  part_mobilite_reduite?: number;
}

export const SALLES = ['salle-1', 'salle-2', 'salle-3', 'salle-4', 'salle-5', 'salle-6'];
const PAS_S = 1;
const REEVALUATION_S = 15;

/** Population tirée UNIQUEMENT depuis la graine : identique pour tous les plans (comparaison à graines égales). */
export function creerPopulation(graine: number, opts: OptionsSimulation = {}): Personne[] {
  const rng = creerRng(graine);
  const parSalle = opts.personnes_par_salle ?? 500;
  const partGroupes = opts.part_groupes ?? 0.7;
  const partPmr = opts.part_mobilite_reduite ?? 0.04;
  const gens: Personne[] = [];
  let prochainGroupe = 1;
  for (const salle of SALLES) {
    let restant = parSalle;
    while (restant > 0) {
      const enGroupe = rng.next() < partGroupes / (3 - 2 * partGroupes); // taille moyenne 3 : part de PERSONNES en groupe = partGroupes
      const taille = enGroupe ? Math.min(restant, 2 + rng.entier(3)) : 1;
      const gid = enGroupe && taille > 1 ? prochainGroupe++ : 0;
      const membres: Personne[] = [];
      for (let k = 0; k < taille; k++) {
        const pmr = rng.next() < partPmr;
        membres.push({
          id: gens.length + k,
          salle,
          groupe: gid,
          mobilite_reduite: pmr,
          vitesse_m_s: pmr ? 0.6 : Math.min(1.6, Math.max(0.8, rng.normal(1.2, 0.2))),
          delai_s: tirerDelaiLogLogistique(rng),
          suivisme: tirerSuivisme(rng),
          connait_secours: rng.next() < 0.25,
          confiance: 0.5 + 0.5 * rng.next(),
        });
      }
      if (gid) {
        // groupe : le plus lent donne le rythme, on attend le dernier prêt
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

export function simuler(plan: Plan, graine: number, duree_s: number, opts: OptionsSimulation = {}): JournalRun {
  const scene = opts.scene ?? SCENE_UGC;
  const mouvement = opts.mouvement ?? creerMouvementSimple();
  const echeances = opts.echeances ?? ECHEANCES_UGC;
  const personnes = creerPopulation(graine, opts);
  const n = personnes.length;
  const rng = creerRng(graine ^ 0x9e3779b9); // flux de décisions, distinct de la population
  mouvement.init(scene, personnes);

  const issuesId = scene.issues.map((i) => i.id);
  const distEq = new Map(issuesId.map((id, k) => [id, normaliserDistances(scene.issues.map((i) => i.distance_m))[k]]));
  const debit = new Map(scene.issues.map((i) => [i.id, 1.3 * i.largeur_m]));
  const issue = new Map(scene.issues.map((i) => [i.id, i]));

  // --- instants de départ ---
  const ordonne = plan.mode !== 'rester_ouvert';
  const guide: boolean[] = [];
  const departT: number[] = [];
  const parSalle = new Map<string, number>();
  for (const p of personnes) parSalle.set(p.salle, (parSalle.get(p.salle) ?? 0) + 1);
  const messageDe = (salle: string, t: number) => {
    let m: Plan['messages_par_zone'][number] | undefined;
    for (const x of plan.messages_par_zone) if (x.zone === salle && x.a_partir_de_s <= t && (!m || x.a_partir_de_s >= m.a_partir_de_s)) m = x;
    return m;
  };
  for (const p of personnes) {
    const g = plan.guidage ? rng.next() < Math.min(1, (plan.guidage.personnel * 40) / (parSalle.get(p.salle) ?? 1)) : false;
    guide.push(g);
    const msgs = plan.messages_par_zone.filter((x) => x.zone === p.salle);
    const premier = msgs.length ? msgs.reduce((a, b) => (b.a_partir_de_s < a.a_partir_de_s ? b : a)) : undefined;
    const ordreT = (premier ? premier.a_partir_de_s : 0) + (plan.phasage_salles.find((x) => x.salle === p.salle)?.delai_s ?? 0);
    const clarte = premier ? premier.clarte : ordonne ? 0.6 : null;
    departT.push(ordreT + p.delai_s * multiplicateurDelai({ clarte, guide: g, ordonne }));
  }
  if (plan.confinement) for (let i = 0; i < n; i++) departT[i] = Infinity;

  // --- états ---
  type Phase = 'attente' | 'marche' | 'hesite' | 'dehors';
  const phase: Phase[] = personnes.map(() => 'attente');
  const cible: (string | null)[] = personnes.map(() => null);
  const reprise: number[] = personnes.map(() => 0); // fin d'hésitation ou prochaine tentative
  const memoireFermee: Set<string>[] = personnes.map(() => new Set());
  const aChange: boolean[] = personnes.map(() => false);
  const ciblant = new Map(issuesId.map((id) => [id, 0]));
  const rafale = new Map(issuesId.map((id) => [id, 0]));
  const intentions: Intention[] = personnes.map((p) => ({ id: p.id, sortie_cible: null, vitesse_voulue_m_s: p.vitesse_m_s, groupe: p.groupe, etat: 'attente' }));
  const groupeCible = new Map<number, string>(); // le premier du groupe qui décide donne la cible (cohésion)
  let changements = 0;
  let hesitations = 0;
  let tentatives_vaines = 0;

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

  const ouverte = (id: string, t: number): boolean => {
    let o = issue.get(id)!.ouverte;
    let tm = -1;
    for (const x of plan.portes) if (x.id === id && (x.a_partir_de_s ?? 0) <= t && (x.a_partir_de_s ?? 0) >= tm) { o = x.ouverte; tm = x.a_partir_de_s ?? 0; }
    return o;
  };

  const candidats = (i: number, t: number, ouv: Record<string, boolean>, exclure?: string | null): CandidatSortie[] => {
    const p = personnes[i];
    const msg = messageDe(p.salle, t);
    const totalCible = Math.max(1, [...ciblant.values()].reduce((a, b) => a + b, 0));
    const out: CandidatSortie[] = [];
    for (const id of issuesId) {
      if (id === exclure) continue;
      const fermee = !ouv[id];
      if (fermee && memoireFermee[i].has(id)) continue; // déjà vue fermée : exclue
      // fermée et annoncée par un message ou le personnel : exclue ; fermée mais seulement visible : poids « fumée » du logit
      if (fermee && (msg !== undefined || guide[i])) continue;
      const sait = fermee && issue.get(id)!.visible;
      let consigne = 0;
      if (msg && msg.issue_id === id) consigne += p.confiance * msg.clarte;
      if (guide[i] && plan.guidage?.issue_id === id) consigne += p.confiance;
      out.push({
        id,
        distance_eq: distEq.get(id)!,
        connue: issue.get(id)!.porte_entree || p.connait_secours,
        fermee_connue: sait,
        part_foule: (ciblant.get(id) ?? 0) / totalCible,
        consigne: Math.min(1, consigne),
        attente_min: (ciblant.get(id) ?? 0) / debit.get(id)! / 60,
      });
    }
    return out;
  };

  const minutes: EtatMinute[] = [];
  let densMax: Record<string, number> = {};
  let t90: number | null = null;
  let dehors = 0;
  let ouv: Record<string, boolean> = {};

  let t = 0;
  for (; t < duree_s; t += PAS_S) {
    ouv = Object.fromEntries(issuesId.map((id) => [id, ouverte(id, t)]));
    for (const id of issuesId) rafale.set(id, (rafale.get(id) ?? 0) * 0.97);

    for (let i = 0; i < n; i++) {
      const p = personnes[i];
      const it = intentions[i];
      if (phase[i] === 'dehors') continue;

      if (phase[i] === 'attente' && t >= departT[i] && t >= reprise[i]) {
        // décision de partir : choix de sortie ; en groupe, on suit la cible du premier qui a décidé
        let c: string | null = null;
        const gc = p.groupe ? groupeCible.get(p.groupe) : undefined;
        if (gc && ouv[gc] && !memoireFermee[i].has(gc)) c = gc;
        else {
          c = choisir(candidats(i, t, ouv), p.suivisme, rng);
          if (c && p.groupe) groupeCible.set(p.groupe, c);
        }
        if (c) {
          phase[i] = 'marche';
          cible[i] = c;
          ciblant.set(c, (ciblant.get(c) ?? 0) + 1);
        } else {
          reprise[i] = t + 10;
          tentatives_vaines++;
        }
      } else if (phase[i] === 'hesite' && t >= reprise[i]) {
        // nouveau choix en excluant les issues vues fermées
        const c = choisir(candidats(i, t, ouv), p.suivisme, rng);
        if (c) {
          phase[i] = 'marche';
          cible[i] = c;
          ciblant.set(c, (ciblant.get(c) ?? 0) + 1);
        } else {
          reprise[i] = t + 10;
          tentatives_vaines++;
        }
      } else if (phase[i] === 'marche' && cible[i] && !aChange[i] && (t + i) % REEVALUATION_S === 0) {
        // changement d'avis, une fois au plus par personne : seulement si une autre issue ouverte attend moins
        const cur = cible[i]!;
        const autres = candidats(i, t, ouv, cur).filter((c) => !c.fermee_connue);
        if (autres.length) {
          const attCur = (ciblant.get(cur) ?? 0) / debit.get(cur)! / 60;
          const meilleur = autres.reduce((a, b) => (b.attente_min < a.attente_min ? b : a));
          const des = attCur - meilleur.attente_min;
          if (des > 0 && rng.next() < probaChangement(des, rafale.get(meilleur.id) ?? 0)) {
            ciblant.set(cur, (ciblant.get(cur) ?? 0) - 1);
            ciblant.set(meilleur.id, (ciblant.get(meilleur.id) ?? 0) + 1);
            rafale.set(meilleur.id, (rafale.get(meilleur.id) ?? 0) + 0.1);
            cible[i] = meilleur.id;
            if (!aChange[i]) aChange[i] = true;
            changements++;
          }
        }
      }

      it.etat = phase[i] === 'marche' ? 'marche' : phase[i] === 'hesite' ? 'hesite' : 'attente';
      it.sortie_cible = phase[i] === 'marche' ? cible[i] : null;
    }

    const r = mouvement.pas(PAS_S, t, intentions, ouv);

    for (const id of r.devant_issue_fermee) {
      const c = cible[id];
      if (c) {
        ciblant.set(c, (ciblant.get(c) ?? 0) - 1);
        memoireFermee[id].add(c);
      }
      cible[id] = null;
      phase[id] = 'hesite';
      reprise[id] = t + 5 + 25 * rng.next(); // tau de 5 à 30 s : paramètre balayé, pas une mesure `[?]`
      hesitations++;
    }
    for (const s of r.sorties) {
      phase[s.id] = 'dehors';
      ciblant.set(s.issue_id, (ciblant.get(s.issue_id) ?? 0) - 1);
      cible[s.id] = null;
      mes.t_sortie_s[s.id] = t + PAS_S;
      dehors++;
      const is = issue.get(s.issue_id)!;
      const derriere = is.devient_cul_de_sac_a_s !== undefined && t >= is.devient_cul_de_sac_a_s ? 'cul_de_sac' : is.derriere;
      if (derriere === 'cul_de_sac') mes.culs_de_sac++;
      else {
        mes.danger_personnes_minutes += NIVEAU_DANGER[derriere] * SEJOUR_DEHORS_MIN;
        if (derriere === 'sur') mes.sorties_sures++;
      }
      if (t90 === null && dehors >= 0.9 * n) t90 = t + PAS_S;
    }
    for (const id of issuesId) {
      const rho = r.densite_par_zone[id] ?? 0;
      if (rho > SEUIL_ROUGE) mes.ecrasement_personnes_minutes += ((r.file_par_issue[id] ?? 0) * PAS_S) / 60;
      mes.pression_max = Math.max(mes.pression_max, r.pression_par_zone[id] ?? 0);
      densMax[id] = Math.max(densMax[id] ?? 0, rho);
    }
    if ((t + PAS_S) % 60 === 0) {
      minutes.push({
        t_s: t + PAS_S,
        personnes_dehors: dehors,
        personnes_restantes: n - dehors,
        densite_max_par_zone: densMax,
        sorties_saturees: issuesId.filter((id) => (r.densite_par_zone[id] ?? 0) >= SEUIL_ALERTE),
        t90_s: t90,
      });
      densMax = {};
    }
    if (dehors === n) {
      t += PAS_S;
      break;
    }
  }

  const grille = calculerGrille(mes);
  const personnesQuiOntChange = aChange.filter(Boolean).length;
  return {
    plan,
    graine,
    duree_s: t,
    minutes,
    grille,
    stats: {
      personnes: n,
      groupes: new Set(personnes.filter((p) => p.groupe).map((p) => p.groupe)).size,
      changements_avis: changements,
      personnes_ayant_change: personnesQuiOntChange,
      part_ayant_change: personnesQuiOntChange / n,
      hesitations_issue_fermee: hesitations,
      tentatives_sans_issue: tentatives_vaines,
      culs_de_sac: mes.culs_de_sac,
    },
  };
}
