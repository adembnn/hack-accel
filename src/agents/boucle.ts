// Boucle décider → simuler → noter, à chaque minute simulée. Écrite contre des interfaces injectées :
// Simulateur (lots #8/#9), ClientDecision (Jev en production), StockageTableau (PostgreSQL du lot aiven).
import type { Action, Decideur, DecideurJeu, EntreeJournal, EntreeTableau, EtatResume, Grille, Journal, Note, Scenario, Simulateur, StockageTableau } from './types.ts';
import { ORDRE_DE_JEU } from './types.ts';
import { appliquerActions, etatInitial, type EtatDecisions } from './leviers.ts';
import { assainirLecons, leconsPertinentes, peutChangerUnLevier, type Lecon } from './rex.ts';
import { appliquerContrainte, detecterConflits, lirePerturbations, motsPerturbations, validerContrainte, type EvenementConflit, type EvenementContrainte } from './evenements.ts';
import { construireQuestion, lireReponse, type ClientDecision } from './questions.ts';

// Note d'un état. Écrasement = personnes-minutes au-dessus du seuil (5 pers./m², décision d'Adem #15), cumulées par la boucle.
export function noter(etat: EtatResume, grille: Grille, ecrasement_cumule = 0): Note {
  return {
    minute: etat.minute,
    ligne_rouge: etat.densite_max >= grille.seuil_densite,
    non_sortis: etat.dans_le_centre,
    sortis_vers_zone_danger: etat.sortis_vers_zone_danger,
    densite_max: etat.densite_max,
    ecrasement_personnes_minutes: ecrasement_cumule,
    ...(etat.pression_max !== undefined ? { pression_max: etat.pression_max } : {}),
  };
}

// Personnes-minutes au-dessus du seuil pour UNE minute simulée.
export function ecrasementMinute(etat: EtatResume, grille: Grille): number {
  return Object.values(etat.par_zone).reduce((s, z) => s + (z.densite > grille.seuil_densite ? z.personnes : 0), 0);
}

// Ordre de grille (Adem, #15) : < 0 si a est meilleure que b : non-sortis, puis zone de danger, puis écrasement.
export function comparerNotes(a: Note, b: Note): number {
  return a.non_sortis - b.non_sortis || a.sortis_vers_zone_danger - b.sortis_vers_zone_danger || a.ecrasement_personnes_minutes - b.ecrasement_personnes_minutes;
}

export function synthesePlan(plan: import('./types.ts').Plan, zones: string[]): EntreeJournal['synthese'] {
  const etats = Object.values(plan.portes);
  const parZone: Record<string, number> = {};
  for (const z of zones) parZone[z] = plan.guidage.filter((g) => g.point.includes(z)).reduce((s, g) => s + g.agents, 0);
  return { portes_fermees: etats.filter((e) => e === 'fermee').length, portes_ouvertes: etats.filter((e) => e === 'ouverte').length, agents_places: plan.guidage.reduce((s, g) => s + g.agents, 0), agents_par_zone: parZone };
}

function manquant(d: Decideur): never {
  throw new Error(`aucun client de décision fourni pour ${d}`);
}

export interface OptionsBoucle {
  simulateur: Simulateur;
  scenario: Scenario;
  clients: Partial<Record<Decideur, ClientDecision>>;
  stockage: StockageTableau;
  // Perturbations posées par le juré (événement `contrainte`) : appliquées à leur minute, puis vues par les décideurs.
  contraintes?: EvenementContrainte[];
  acteurs?: readonly Decideur[];   // défaut : les 4 décideurs du jeu
  lecons?: Lecon[];           // leçons du REX, relues avant chaque décision
  minutes: number;            // durée maximale en minutes simulées
  surMinute?: (entree: EntreeJournal) => void;
}

export async function lancerBoucle(o: OptionsBoucle): Promise<Journal> {
  o.simulateur.initialiser(o.scenario);
  const grille = o.simulateur.grille();
  let decisions: EtatDecisions = etatInitial();
  let etat = o.simulateur.etat();
  let derniere: Note | null = null;
  let ecrasement = 0;
  // Leçons du REX : texte de tiers tronqué, consignes déguisées et contradictoires écartées une fois pour toutes.
  const assainies = assainirLecons(o.lecons ?? []);
  let conflitsPrecedents: EvenementConflit[] = [];
  const attente = [...(o.contraintes ?? [])].sort((x, y) => x.minute - y.minute);
  const journal: Journal = { scenario: structuredClone(o.scenario), entrees: [] };

  for (let i = 0; i < o.minutes; i++) {
    const minute = etat.minute;
    const decisionsMinute: EntreeTableau[] = [];
    const vues: { decideur: Decideur; actions: Action[] }[] = [];
    decisions = { ...decisions, hors_plan: { ...decisions.hors_plan, minute_courante: minute } };
    // Réception des perturbations dues : événement `contrainte` → état → les décideurs re-décident sur le nouvel état.
    const appliquees: EvenementContrainte[] = [];
    const refuseesContraintes: { evenement: EvenementContrainte; raisons: string[] }[] = [];
    while (attente.length && attente[0].minute <= minute) {
      const evt = attente.shift() as EvenementContrainte;
      const raisons = validerContrainte(evt, o.scenario);
      if (raisons.length) { refuseesContraintes.push({ evenement: evt, raisons }); continue; }
      decisions = appliquerContrainte(decisions, evt);
      appliquees.push(evt);
    }
    const mots = motsPerturbations(lirePerturbations(decisions));
    for (const d of (o.acteurs ?? ORDRE_DE_JEU)) {
      const lecons = leconsPertinentes(assainies.gardees, Object.entries(etat.par_zone).filter(([, z]) => z.personnes > 0).map(([z]) => z));
      const question = construireQuestion({ decideur: d, lecons, minute, etat, derniere_note: derniere, plan_courant: decisions.plan, decisions_des_autres: vues, lecons_validees: lecons.filter(peutChangerUnLevier).map((l) => l.id), perturbations: mots, conflits: conflitsPrecedents.map((c) => c.code), nouvelles_perturbations: appliquees.length > 0 });
      let actions: Action[] = [];
      const refusees: EntreeTableau['actions_refusees'] = [];
      try {
        const lue = lireReponse(d, await (o.clients[d] ?? manquant(d)).decider(question));
        actions = lue.actions;
        for (const e of lue.erreurs) refusees.push({ action: { decideur: d, levier: '?', valeur: null }, raisons: [e] });
      } catch (err) {
        refusees.push({ action: { decideur: d, levier: '?', valeur: null }, raisons: [`client de décision en échec : ${(err as Error).message}`] });
      }
      const res = appliquerActions(decisions, actions, { scenario: o.scenario });
      decisions = res.etat;
      refusees.push(...res.refusees);
      const entree: EntreeTableau = { minute, decideur: d, actions_acceptees: res.acceptees, actions_refusees: refusees, lecons_utilisees: lecons.map((l) => l.id) };
      await o.stockage.ajouter(entree);
      decisionsMinute.push(entree);
      vues.push({ decideur: d, actions: res.acceptees });
    }
    conflitsPrecedents = detecterConflits(decisions, etat, o.scenario);
    const evenementsMinute = { contraintes: [...appliquees, ...refuseesContraintes], conflits: conflitsPrecedents };
    etat = o.simulateur.avancer(decisions.plan, 1);
    ecrasement += ecrasementMinute(etat, grille);
    derniere = noter(etat, grille, ecrasement);
    const ligne: EntreeJournal = { minute: etat.minute, plan: structuredClone(decisions.plan), hors_plan: structuredClone(decisions.hors_plan), synthese: synthesePlan(decisions.plan, Object.keys(etat.par_zone)), etat, note: derniere, evenements: evenementsMinute, decisions: decisionsMinute };
    journal.entrees.push(ligne);
    o.surMinute?.(ligne);
    if (etat.dans_le_centre === 0) break;
  }
  return journal;
}

// Décideur déterministe de secours / de test : joue une consigne simple, toujours dans le menu.
export function clientsHeuristiques(): Record<DecideurJeu, ClientDecision> {
  return {
    prefecture: { decider: async (q) => (q.minute === q.entree.etat.minute && q.entree.derniere_note === null ? { actions: [{ levier: 'demande_fermeture_stations', valeur: true }] } : { actions: [] }) },
    ratp: { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'heure_fermeture_stations', valeur: 1320 }, { levier: 'correspondances', valeur: true }] } : { actions: [] }) },
    securite_centre: { decider: async (q) => (q.entree.derniere_note === null ? { actions: [{ levier: 'guidage', valeur: { point: 'porte_lescot', agents: 5 } }, { levier: 'message_zone', valeur: { zone: 'niveau_-1', porte: 'lescot', clarte: 0.8, texte: 'Le centre ferme. Rejoignez la sortie Lescot.' } }] } : { actions: [] }) },
    directeur: {
      decider: async (q) => {
        if (q.entree.derniere_note === null) return { actions: [{ levier: 'mode', valeur: 'fermer_par_etapes' }, { levier: 'porte', valeur: { porte: 'berger', etat: 'fermee' } }, { levier: 'porte', valeur: { porte: 'rambuteau', etat: 'fermee' } }] };
        return { actions: [] };
      },
    },
  };
}
