// Branchement de la boucle des décideurs (src/agents, backend « rules », sans réseau) sur le simulateur de comportement.
// Adaptateur : l'interface Simulateur des décideurs (minute par minute) est servie en REJOUANT simuler() depuis le début
// avec le plan courant tronqué à l'instant demandé. Approximation assumée : le plan courant est supposé appliqué depuis t = 0.
// Modèle simplifié, non certifié.
import { clientsHeuristiques, lancerBoucle } from '../agents/boucle.ts';
import { ClientJev, type TransportJev } from '../agents/jev.ts';
import type { ClientDecision, ReponseJev } from '../agents/questions.ts';
import type { Action, Decideur, EtatResume, Grille as GrilleAgents, Journal, Plan as PlanAgents, Scenario, Simulateur } from '../agents/types.ts';
import { NIVEAUX, PORTES, planInitial } from '../agents/types.ts';
import { StockageMemoire } from '../agents/stockage.ts';
import type { Lecon } from '../agents/rex.ts';
import { SALLES } from '../sim/behavior/simuler.ts';
import type { Plan } from '../sim/behavior/types.ts';
import { jouer, type ParamsModele } from './calibration.ts';
import type { ScenarioRex } from './rex-scenario.ts';

export const ZONE_SIM = 'ugc';

/** Plan des décideurs (vocabulaire du Forum) -> plan du simulateur (scène illustrative). Correspondances simplifiées, documentées ici :
 * - portes berger/rambuteau fermées -> issue « ferronnerie » (rue barrée) fermée ; porte lescot fermée -> accès métro fermé ;
 * - guidage : point contenant « rambuteau » -> sortie de secours ; « lescot » -> hall principal ; sinon escalators ; personnel = somme des agents ;
 * - un message non vide dans une zone -> message clair (0,8) pour toutes les salles, vers l'issue citée si le texte la nomme, sinon aucune ;
 * - mode fermer_par_etapes sans phasage explicite -> trois vagues espacées de 60 s ; confinement actif -> confinement. */
export function convertirPlan(p: PlanAgents): Plan {
  const portes: Plan['portes'] = [];
  if (p.portes.berger === 'fermee' || p.portes.rambuteau === 'fermee') portes.push({ id: 'ferronnerie', ouverte: false, a_partir_de_s: 0 });
  if (p.portes.lescot === 'fermee') portes.push({ id: 'metro', ouverte: false, a_partir_de_s: 0 });
  const total = p.guidage.reduce((s, g) => s + g.agents, 0);
  const premier = p.guidage[0];
  const issueGuidee = !premier ? null : /rambuteau/i.test(premier.point) ? 'secours' : /lescot/i.test(premier.point) ? 'principale' : 'escalators';
  const textes = Object.values(p.messages_par_zone).filter((t) => t.trim().length > 0);
  const issueMsg = (t: string): string | null => (/rambuteau/i.test(t) ? 'secours' : /lescot|principale/i.test(t) ? 'principale' : null);
  const messages: Plan['messages_par_zone'] = textes.length ? SALLES.map((zone) => ({ zone, issue_id: issueMsg(textes[0]), clarte: 0.8, a_partir_de_s: 0 })) : [];
  const phasage = p.mode === 'fermer_par_etapes' ? SALLES.map((salle, k) => ({ salle, delai_s: Math.floor(k / 2) * 60 })) : [];
  return { mode: p.mode, portes, phasage_salles: phasage, guidage: total > 0 && issueGuidee ? { issue_id: issueGuidee, personnel: total } : null, messages_par_zone: messages, confinement: p.confinement.actif };
}

/** Scénario au sens des décideurs, tiré du scénario REX (effectif selon le client). */
export function scenarioDecideurs(sc: ScenarioRex, graine: number): Scenario {
  return { graine, minute_annonce: 1160, stations_fermees_minute: 1320, couvre_feu_debut_minute: 1380, effectif_securite: 20, population: { [ZONE_SIM]: sc.options.personnes_par_salle! * SALLES.length } };
}

export class SimulateurComportement implements Simulateur {
  appels = 0;
  #sc: ScenarioRex;
  #params: ParamsModele;
  #scenario: Scenario | null = null;
  #ecoule_s = 0;
  #etat: EtatResume | null = null;
  constructor(sc: ScenarioRex, params: ParamsModele) { this.#sc = sc; this.#params = params; }

  grille(): GrilleAgents { return { niveaux: [...NIVEAUX], portes: [...PORTES], zones: [ZONE_SIM], seuil_densite: 5 }; }

  initialiser(scenario: Scenario): void {
    this.#scenario = scenario;
    this.#ecoule_s = 0;
    this.appels = 0;
    this.#etat = this.#resume(planInitial(), 0);
  }

  #resume(plan: PlanAgents, secondes: number): EtatResume {
    const sc = this.#scenario!;
    const n = this.#sc.options.personnes_par_salle! * SALLES.length;
    let dehors = 0, danger = 0, dens = 0;
    if (secondes > 0) {
      const run = jouer(this.#sc, convertirPlan(plan), sc.graine, this.#params, secondes);
      const der = run.minutes.at(-1);
      dehors = der?.personnes_dehors ?? 0;
      danger = run.stats.culs_de_sac ?? 0;
      dens = der ? Math.max(0, ...Object.values(der.densite_max_par_zone)) : 0;
    }
    return { minute: sc.minute_annonce + Math.floor(secondes / 60), dans_le_centre: n - dehors, sortis: dehors, sortis_vers_zone_danger: danger, densite_max: Math.round(dens * 100) / 100, par_zone: { [ZONE_SIM]: { personnes: n - dehors, densite: Math.round(dens * 100) / 100 } }, debit_portes: {} };
  }

  avancer(plan: PlanAgents, minutes: number): EtatResume {
    if (!this.#scenario) throw new Error('initialiser() d\'abord');
    this.appels++;
    this.#ecoule_s += minutes * 60;
    this.#etat = this.#resume(plan, this.#ecoule_s);
    return this.#etat;
  }

  etat(): EtatResume { if (!this.#etat) throw new Error('initialiser() d\'abord'); return this.#etat; }
}

/** Transport qui échoue toujours : ClientJev retombe alors sur ses règles déterministes (backend « rules », aucun réseau). */
const transportAbsent: TransportJev = { envoyer: async () => { throw new Error('backend rules : aucun appel réseau'); } };

export function clientsRegles(): Record<Decideur, ClientDecision> {
  const un = (): ClientDecision => new ClientJev({ transport: transportAbsent, effectif_securite: 20 });
  return { prefecture: un(), ratp: un(), securite_centre: un(), directeur: un() };
}

export interface LeconMemoire extends Lecon {
  /** Actions du menu des décideurs que la simulation a validées sur le REX source. Rejouées seulement si statut = validee_par_simulation. */
  actions_recommandees: Action[];
}

/** Décideur avec mémoire : ajoute, à chaque minute et APRÈS les règles (les règles redécident chaque minute, la leçon l'emporte), les actions des leçons VALIDÉES PAR SIMULATION et pertinentes. Les autres sont ignorées. */
export class ClientAvecMemoire implements ClientDecision {
  #base: ClientDecision;
  #decideur: Decideur;
  utilisees = new Set<string>();
  constructor(base: ClientDecision, decideur: Decideur) { this.#base = base; this.#decideur = decideur; }
  async decider(q: Parameters<ClientDecision['decider']>[0]): Promise<ReponseJev> {
    const r = await this.#base.decider(q);
    const ajouts: { levier: string; valeur: unknown }[] = [];
    const ids: string[] = [];
    for (const l of q.entree.lecons as LeconMemoire[]) {
      if (l.statut !== 'validee_par_simulation' || !l.actions_recommandees) continue;
      const siennes = l.actions_recommandees.filter((a) => a.decideur === this.#decideur);
      if (siennes.length) ids.push(l.id);
      for (const a of siennes) ajouts.push({ levier: a.levier, valeur: a.valeur });
    }
    for (const id of ids) this.utilisees.add(id);
    return { actions: [...r.actions, ...ajouts], justification: `${r.justification ?? ''}${ids.length ? ` Leçons validées citées : ${ids.join(', ')}.` : ''}`.slice(0, 400) };
  }
}

export function clientsAvecMemoire(): Record<Decideur, ClientAvecMemoire> {
  const b = clientsRegles();
  return { prefecture: new ClientAvecMemoire(b.prefecture, 'prefecture'), ratp: new ClientAvecMemoire(b.ratp, 'ratp'), securite_centre: new ClientAvecMemoire(b.securite_centre, 'securite_centre'), directeur: new ClientAvecMemoire(b.directeur, 'directeur') };
}

export interface ResultatDecideurs { plan: PlanAgents; plan_sim: Plan; journal: Journal; actions: Action[] }

/** Joue la boucle des décideurs (minutes simulées limitées) et rend le plan qu'ils ont choisi. */
export async function planChoisiParDecideurs(sc: ScenarioRex, params: ParamsModele, graine: number, o: { lecons?: Lecon[]; avecMemoire?: boolean; minutes?: number } = {}): Promise<ResultatDecideurs> {
  const stockage = new StockageMemoire();
  const clients: Record<Decideur, ClientDecision> = o.avecMemoire ? clientsAvecMemoire() : clientsRegles();
  const journal = await lancerBoucle({ simulateur: new SimulateurComportement(sc, params), scenario: scenarioDecideurs(sc, graine), clients, stockage, lecons: o.lecons ?? [], minutes: o.minutes ?? 4 });
  const plan = journal.entrees.at(-1)?.plan ?? planInitial();
  const actions = (await stockage.lister()).flatMap((e) => e.actions_acceptees);
  return { plan, plan_sim: convertirPlan(plan), journal, actions };
}

export { clientsHeuristiques };
