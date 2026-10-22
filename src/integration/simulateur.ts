// Adaptateur 4 : simuler(plan, graine, durée) du lot foule-decision -> interface Simulateur/Grille du lot decideurs.
// Écarts de fond (voir LISEZMOI.md) :
//  - simuler() rejoue TOUT depuis t = 0 ; le lot decideurs avance minute par minute. L'adaptateur garde l'historique des plans,
//    traduit les changements en instants (a_partir_de_s) et ne relance une simulation complète que si l'historique diverge.
//  - les zones du lot decideurs (scenario.population) sont rattachées, dans l'ordre, aux 6 salles du lot foule-decision ;
//    la population totale est répartie à parts égales (le lot foule-decision ne sait pas tirer des salles inégales).
import { PORTES, planInitial, type EtatResume, type Grille as GrilleDecideurs, type Plan as PlanDecideurs, type Scenario, type Simulateur } from '../agents/types.ts';
import { simuler, type OptionsSimulation } from '../sim/behavior/simuler.ts';
import type { Intention, JournalRun, Mouvement, Personne, Plan as PlanSim, RetourMouvement, Scene } from '../sim/behavior/types.ts';
import { creerMouvementReel, moteurPartage, SALLES, type MoteurReel } from './mouvement.ts';

export interface InstantaneMinute {
  /** Minutes écoulées depuis l'annonce (1 = fin de la première minute). */
  minute_rel: number;
  restantes_par_salle: Record<string, number>;
  densite_par_salle: Record<string, number>;
  sorties_par_issue: Record<string, number>;
  pression_max: number;
  densite_max: number;
}

export interface ResultatRun {
  journal: JournalRun;
  minutes: InstantaneMinute[];
  plan_sim: PlanSim;
  cpu_mouvement_ms: number;
  duree_mur_ms: number;
}

export const NIVEAUX_FORUM = ['0', '-1', '-2', '-3', '-4'];

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Enregistre, minute par minute, ce que JournalRun ne garde pas (zones = salles, débits, pression). */
export function enregistrer(mv: Mouvement & { moteur?: MoteurReel }, scene: Scene, personnes_ref: { p: Personne[] }): { mv: Mouvement; minutes: InstantaneMinute[] } {
  const minutes: InstantaneMinute[] = [];
  let acc: Record<string, number> = {};
  let pression = 0;
  let densite = 0;
  const sorti = new Set<number>();
  const wrap: Mouvement = {
    init(s, ps) { personnes_ref.p = ps; sorti.clear(); minutes.length = 0; acc = {}; pression = 0; densite = 0; mv.init(s, ps); },
    pas(dt_s: number, t_s: number, intentions: Intention[], ouvertes: Record<string, boolean>): RetourMouvement {
      const r = mv.pas(dt_s, t_s, intentions, ouvertes);
      for (const s of r.sorties) { acc[s.issue_id] = (acc[s.issue_id] ?? 0) + 1; sorti.add(s.id); }
      for (const id of Object.keys(r.densite_par_zone)) { pression = Math.max(pression, r.pression_par_zone[id] ?? 0); densite = Math.max(densite, r.densite_par_zone[id] ?? 0); }
      if (Math.round(t_s + dt_s) % 60 === 0) {
        const rest: Record<string, number> = {}, dens: Record<string, number> = {};
        for (const p of personnes_ref.p) { rest[p.salle] = (rest[p.salle] ?? 0) + (sorti.has(p.id) ? 0 : 1); dens[p.salle] = dens[p.salle] ?? 0; }
        const m = mv as unknown as { moteur?: MoteurReel };
        if (m.moteur) {
          const sim = m.moteur.sim, cs = m.moteur.grille.cellSize;
          for (const p of personnes_ref.p) {
            if (sorti.has(p.id) || sim.state[p.id] !== 0) continue;
            dens[p.salle] = Math.max(dens[p.salle], sim.densityAt(sim.lvl[p.id], sim.x[p.id] / cs * cs, sim.y[p.id] / cs * cs));
          }
        }
        minutes.push({ minute_rel: Math.round((t_s + dt_s) / 60), restantes_par_salle: rest, densite_par_salle: dens, sorties_par_issue: { ...acc }, pression_max: pression, densite_max: densite });
        acc = {}; pression = 0; densite = 0;
      }
      return r;
    },
    restantes: () => mv.restantes(),
  };
  void scene;
  return { mv: wrap, minutes };
}

/** Traduit l'historique minute par minute du lot decideurs en Plan du lot foule-decision (instants en secondes depuis l'annonce). */
export function traduirePlan(historique: PlanDecideurs[], scenario: Scenario, zones: string[], issues: string[]): { plan: PlanSim; ecarts: string[] } {
  const ecarts: string[] = [];
  const dernier = historique[historique.length - 1] ?? planInitial();
  const portes: PlanSim['portes'] = [];
  const etat = new Map<string, boolean>();
  historique.forEach((pl, k) => {
    for (const [porte, e] of Object.entries(pl.portes)) {
      const ouverte = e !== 'fermee';
      if ((etat.get(porte) ?? true) !== ouverte) { portes.push({ id: porte, ouverte, a_partir_de_s: k * 60 }); etat.set(porte, ouverte); }
    }
  });
  const sansIssue = PORTES.filter((p) => !issues.includes(p) && (etat.get(p) ?? true) === false);
  if (sansIssue.length) ecarts.push(`portes fermées sans sortie réelle rattachée (sans effet) : ${sansIssue.join(', ')}`);
  const portesUtiles = portes.filter((p) => issues.includes(p.id));

  const phasage: PlanSim['phasage_salles'] = [];
  for (const ph of dernier.phasage_salles) {
    const k = zones.indexOf(ph.salle);
    if (k >= 0) phasage.push({ salle: SALLES[k], delai_s: Math.max(0, (ph.minute_depart - scenario.minute_annonce) * 60) });
    else ecarts.push(`phasage de « ${ph.salle} » ignoré : zone inconnue`);
  }

  let guidage: PlanSim['guidage'] = null;
  const total = dernier.guidage.reduce((s, g) => s + g.agents, 0);
  if (total > 0) {
    const meilleur = dernier.guidage.reduce((a, b) => (b.agents > a.agents ? b : a));
    const cible = issues.find((i) => sansAccent(meilleur.point).includes(i)) ?? null;
    if (!cible) ecarts.push(`point de guidage « ${meilleur.point} » sans issue correspondante : guidage compté mais sans consigne de direction`);
    guidage = { issue_id: cible ?? '', personnel: total };
    if (dernier.guidage.length > 1) ecarts.push('plusieurs points de guidage fusionnés en un seul (le lot foule-decision n\'en accepte qu\'un)');
  }

  const messages: PlanSim['messages_par_zone'] = [];
  const premiere = new Map<string, number>();
  historique.forEach((pl, k) => { for (const [z, txt] of Object.entries(pl.messages_par_zone)) if (!premiere.has(`${z}|${txt}`)) premiere.set(`${z}|${txt}`, k * 60); });
  const derniers = new Map<string, { txt: string; t: number }>();
  for (const [cle, t] of premiere) { const [z, txt] = cle.split('|'); const d = derniers.get(z); if (!d || t >= d.t) derniers.set(z, { txt, t }); }
  for (const [z, { txt, t }] of derniers) {
    const k = zones.indexOf(z);
    if (k < 0) { ecarts.push(`message pour « ${z} » ignoré : zone inconnue`); continue; }
    const texte = sansAccent(txt).replace(/_/g, ' ');
    const cible = issues.find((i) => texte.includes(i.replace(/_/g, ' '))) ?? null;
    // clarté 0,7 : valeur posée par l'adaptateur (le lot decideurs ne produit pas de clarté)
    messages.push({ zone: SALLES[k], issue_id: cible, clarte: 0.7, a_partir_de_s: t });
  }

  const confine = dernier.confinement.actif && zones.every((z) => dernier.confinement.zones.includes(z));
  if (dernier.confinement.actif && !confine) ecarts.push('confinement partiel ignoré : le lot foule-decision ne connaît que le confinement de tout le centre');
  return { plan: { mode: dernier.mode, portes: portesUtiles, phasage_salles: phasage, guidage, messages_par_zone: messages, confinement: confine }, ecarts };
}

export interface OptionsSimulateur {
  moteur?: MoteurReel;
  /** Horizon maximal des simulations complètes, en minutes. */
  horizon_min?: number;
  /** Surcharge de la population (personnes par salle) ; défaut = population totale du scénario / 6. */
  personnes_par_salle?: number;
  surRun?: (r: ResultatRun, raison: string) => void;
}

export class SimulateurIntegre implements Simulateur {
  #o: OptionsSimulateur;
  #moteur: MoteurReel;
  #sc: Scenario | null = null;
  #zones: string[] = [];
  #historique: PlanDecideurs[] = [];
  #run: ResultatRun | null = null;
  #runHist: string[] = [];
  #rel = 0;
  runs = 0;
  ecarts = new Set<string>();
  dernierRun(): ResultatRun | null { return this.#run; }
  get zones(): string[] { return this.#zones; }

  constructor(o: OptionsSimulateur = {}) { this.#o = o; this.#moteur = o.moteur ?? moteurPartage(); }

  grille(): GrilleDecideurs {
    return { niveaux: [...NIVEAUX_FORUM], portes: [...PORTES], zones: [...this.#zones], seuil_densite: 5 };
  }

  initialiser(scenario: Scenario): void {
    const zones = Object.keys(scenario.population);
    if (zones.length === 0 || zones.length > SALLES.length) throw new Error(`le lot foule-decision gère ${SALLES.length} salles : ${zones.length} zones données`);
    this.#sc = scenario; this.#zones = zones; this.#historique = []; this.#run = null; this.#runHist = []; this.#rel = 0; this.runs = 0; this.ecarts.clear();
  }

  /** Simulation complète (depuis t = 0) pour un historique de plans, horizon fixe. */
  lancer(historique: PlanDecideurs[], duree_min: number): ResultatRun {
    const sc = this.#sc!;
    const t0 = performance.now();
    const issues = this.#moteur.carte.issues.map((i) => i.id);
    const { plan, ecarts } = traduirePlan(historique, sc, this.#zones, issues);
    for (const e of ecarts) this.ecarts.add(e);
    const metro_s = (sc.stations_fermees_minute - sc.minute_annonce) * 60;
    const scene = this.#moteur.scene(metro_s);
    const total = Object.values(sc.population).reduce((s, n) => s + n, 0);
    const par_salle = this.#o.personnes_par_salle ?? Math.max(1, Math.round(total / SALLES.length));
    const reel = creerMouvementReel(this.#moteur, sc.graine);
    const ref = { p: [] as Personne[] };
    const { mv, minutes } = enregistrer(reel, scene, ref);
    const opts: OptionsSimulation = { scene, mouvement: mv, personnes_par_salle: par_salle, echeances: { metro_s, couvre_feu_s: (sc.couvre_feu_debut_minute - sc.minute_annonce) * 60 } };
    const journal = simuler(plan, sc.graine, duree_min * 60, opts);
    this.runs++;
    return { journal, minutes: [...minutes], plan_sim: plan, cpu_mouvement_ms: reel.cpu_ms(), duree_mur_ms: performance.now() - t0 };
  }

  avancer(plan: PlanDecideurs, minutes: number): EtatResume {
    const sc = this.#sc;
    if (!sc) throw new Error('initialiser() d\'abord');
    for (let k = 0; k < minutes; k++) {
      this.#historique.push(structuredClone(plan));
      this.#rel++;
      const cle = this.#historique.map((p) => JSON.stringify(p));
      const valide = this.#run && cle.every((c, i) => this.#runHist[i] === c || (i >= this.#runHist.length && this.#runHist.at(-1) === c));
      if (!valide) {
        // l'historique a divergé du run en cache (ou il n'y en a pas) : nouvelle simulation complète avec l'historique connu
        // + le plan courant maintenu jusqu'à la fin de l'horizon
        const dur = this.#o.horizon_min ?? 20;
        this.#run = this.lancer(this.#historique, dur);
        this.#o.surRun?.(this.#run, `plan modifié à la minute ${this.#rel}`);
        this.#runHist = cle;
      }
    }
    return this.etat();
  }

  etat(): EtatResume {
    const sc = this.#sc;
    if (!sc) throw new Error('initialiser() d\'abord');
    const rel = this.#rel;
    if (!this.#run || rel === 0) {
      const par_zone: EtatResume['par_zone'] = {};
      const total = Object.values(sc.population).reduce((s, n) => s + n, 0);
      for (const z of this.#zones) par_zone[z] = { personnes: Math.round(total / this.#zones.length), densite: 0 };
      return { minute: sc.minute_annonce, dans_le_centre: total, sortis: 0, sortis_vers_zone_danger: 0, densite_max: 0, par_zone, debit_portes: {} };
    }
    const inst = this.#run.minutes.find((m) => m.minute_rel === rel) ?? this.#run.minutes.at(-1)!;
    const journalMin = this.#run.journal.minutes.find((m) => m.t_s === inst.minute_rel * 60);
    const scene = this.#moteur.scene((sc.stations_fermees_minute - sc.minute_annonce) * 60);
    const issueParId = new Map(scene.issues.map((i) => [i.id, i]));
    // sortis vers zone de danger = cumul des sorties par une issue « interdite » + culs-de-sac du métro après sa fermeture
    let danger = 0;
    for (const m of this.#run.minutes.filter((x) => x.minute_rel <= inst.minute_rel)) {
      for (const [id, n] of Object.entries(m.sorties_par_issue)) {
        const is = issueParId.get(id);
        if (!is) continue;
        const cul = is.devient_cul_de_sac_a_s !== undefined && m.minute_rel * 60 > is.devient_cul_de_sac_a_s;
        if (is.derriere === 'interdite' || cul) danger += n;
      }
    }
    // sorties cumulées depuis le début : sorties_par_issue est déjà cumulé par minute (acc non remis à zéro entre minutes ? non : remis) -> somme
    const par_zone: EtatResume['par_zone'] = {};
    this.#zones.forEach((z, k) => {
      par_zone[z] = { personnes: inst.restantes_par_salle[SALLES[k]] ?? 0, densite: Math.round((inst.densite_par_salle[SALLES[k]] ?? 0) * 100) / 100 };
    });
    const dans = journalMin ? journalMin.personnes_restantes : Object.values(par_zone).reduce((s, z) => s + z.personnes, 0);
    const sortis = journalMin ? journalMin.personnes_dehors : 0;
    const debit: Record<string, number> = {};
    for (const [id, n] of Object.entries(inst.sorties_par_issue)) debit[id] = n;
    return {
      minute: sc.minute_annonce + inst.minute_rel,
      dans_le_centre: dans,
      sortis,
      sortis_vers_zone_danger: danger,
      densite_max: Math.round(inst.densite_max * 100) / 100,
      par_zone,
      debit_portes: debit,
      pression_max: Math.round(inst.pression_max * 1000) / 1000,
    };
  }
}
