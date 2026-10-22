// Adaptateur : interface Simulateur/Grille du lot decideurs (src/agents/types.ts) -> moteur sim.js d'Adem (voir moteur.ts).
// Contrairement à CrowdSim, sim.js avance minute par minute SANS rejouer depuis t = 0 : avancer(plan, 1) = 600 pas de 0,1 s.
// Ce que le moteur ne sait pas faire est listé dans `ECARTS` et dans LISEZMOI.md.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PORTES, planInitial, type EtatResume, type Grille, type Plan, type Scenario, type Simulateur } from '../agents/types.ts';
import type { EvenementContrainte } from '../agents/evenements.ts';
import { GROUPE_DE_PORTE, mulberry32, type MoteurAdem, type Personne } from './moteur.ts';

export const NIVEAUX_FORUM = ['0', '-1', '-2', '-3', '-4'];
export const ZONES_ADEM = ['ugc', 'niveau_0', 'niveau_-1', 'niveau_-2', 'niveau_-3', 'niveau_-4'];
export const PAS_S = 0.1;
const PORTE_DE_ZONE: Record<string, string[]> = { rue_berger: ['berger'], rue_rambuteau: ['rambuteau'] };
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ID_DE_GROUPE = Object.fromEntries(Object.entries(GROUPE_DE_PORTE).map(([id, nom]) => [nom, id]));

/** Zone des décideurs d'une personne : le cinéma, sinon le niveau OSM (le -5 est rangé avec le -4). */
export function zoneDe(M: MoteurAdem, a: Personne): string {
  if (a.kind === 'cine') return 'ugc';
  const lv = Math.max(-4, M.SIM.g.levels[a.l]);
  return `niveau_${lv}`;
}

/** Effectifs réels par zone pour n personnes tirées avec cette graine (sert à bâtir le Scenario de la boucle). */
export function populationReelle(M: MoteurAdem, n: number, graine: number): Record<string, number> {
  const pop = M.tirerPopulation(n, graine);
  const r: Record<string, number> = Object.fromEntries(ZONES_ADEM.map((z) => [z, 0]));
  for (const a of pop) r[zoneDe(M, a)]++;
  return r;
}

export interface MinuteMesuree {
  minute: number; sortis: number; restantes: number; densite_max: number; sortis_par_porte: Record<string, number>;
  ms: number; pas: number; ms_par_pas: number;
}

export interface OptionsSimulateurAdem {
  moteur: MoteurAdem;
  /** Perturbations posées par le juré (les mêmes que celles passées à lancerBoucle) : le Simulateur ne reçoit que le plan, il lit sa propre copie. */
  contraintes?: EvenementContrainte[];
  /** Fraction de la population tirée (défaut : somme de scenario.population). */
  population?: Personne[];
}

export class SimulateurAdem implements Simulateur {
  #o: OptionsSimulateurAdem;
  #M: MoteurAdem;
  #sc: Scenario | null = null;
  #zones: string[] = [];
  #minute = 0;           // minute absolue du jour au début de la minute à jouer
  #total = 0;
  #seuil90 = 0;
  #hors: Record<string, unknown> = {};
  #etat: EtatResume | null = null;
  #appliquees = new Set<string>();
  #lieesAnnonce = new Set<string>();
  t90_s: number | null = null;
  minutes: MinuteMesuree[] = [];
  ecarts = new Set<string>();
  ms_total = 0;
  pas_total = 0;
  densites: Record<string, number> = {};

  constructor(o: OptionsSimulateurAdem) { this.#o = o; this.#M = o.moteur; }

  grille(): Grille { return { niveaux: [...NIVEAUX_FORUM], portes: [...PORTES], zones: [...this.#zones], seuil_densite: 5 }; }

  /** Les décideurs appellent surMinute(entree) : on y lit hors_plan (effet à la minute suivante : un décalage d'une minute, noté en écart). */
  observerHorsPlan(h: Record<string, unknown>): void { this.#hors = h; }

  initialiser(scenario: Scenario): void {
    const M = this.#M;
    this.#sc = scenario;
    this.#zones = Object.keys(scenario.population);
    this.#total = Object.values(scenario.population).reduce((s, n) => s + n, 0);
    const pop = this.#o.population ?? M.tirerPopulation(this.#total, scenario.graine);
    M.demarrer(pop, scenario.graine + 1);
    M.SIM.A.forEach((a: any, i: number) => { a.zone = zoneDe(M, pop[i]); });
    const inconnues = new Set<string>(M.SIM.A.map((a: any) => a.zone).filter((z: string) => !this.#zones.includes(z)));
    if (inconnues.size) this.ecarts.add(`personnes rangées dans des zones absentes du scénario (non comptées par zone) : ${[...inconnues].join(', ')}`);
    this.#minute = scenario.minute_annonce;
    this.#seuil90 = Math.ceil(0.9 * M.SIM.A.length);
    this.t90_s = null; this.minutes = []; this.ms_total = 0; this.pas_total = 0; this.#appliquees.clear(); this.#lieesAnnonce.clear();
    this.#hors = {}; this.#etat = null; this.densites = {};
    this.#etat = this.#mesurer(0, {});
  }

  etat(): EtatResume { if (!this.#etat) throw new Error('initialiser() d\'abord'); return this.#etat; }

  #groupe(porte: string): { G: any; k: number } | null {
    const nom = GROUPE_DE_PORTE[porte];
    const k = nom ? this.#M.SIM.groups.findIndex((G: any) => G.n === nom) : -1;
    return k >= 0 ? { G: this.#M.SIM.groups[k], k } : null;
  }

  /** Cellules (x,z) des sorties d'une porte, pour résoudre « escalator / ascenseur près de la porte X ». */
  #pointsDePorte(porte: string): [number, number][] {
    const g = this.#groupe(porte), S = this.#M.SIM;
    return g ? g.G.cells.map((e: any) => [S.g.bbox[0] + (e.cell[2] + .5) * S.g.res, S.g.bbox[1] + (e.cell[1] + .5) * S.g.res]) : [];
  }

  /** Liens (escalators ou ascenseurs) visés par une cible : « tous », indice, nom, ou porte (liens à moins de 40 m de la porte). */
  #liensVises(type: 'escalator' | 'ascenseur', cible: string): number[] {
    const S = this.#M.SIM, g = S.g;
    const ids: number[] = g.links.map((l: any, i: number) => (l.k === type ? i : -1)).filter((i: number) => i >= 0);
    const c = sansAccent(cible).replace(/_/g, ' ');
    if (['tous', 'toutes', 'all', '*', type, `${type}s`].includes(c)) return ids;
    if (/^\d+$/.test(c)) return ids.filter((i) => type === 'ascenseur' ? g.links[i].asc === Number(c) : i === Number(c));
    const nommes = ids.filter((i) => g.links[i].n && sansAccent(g.links[i].n).includes(c));
    if (nommes.length) return nommes;
    const porte = Object.keys(GROUPE_DE_PORTE).find((p) => c.includes(p.replace(/_/g, ' ')) || p.replace(/_/g, ' ').includes(c));
    if (porte) {
      const pts = this.#pointsDePorte(porte);
      return ids.filter((i) => { const l = g.links[i]; const x = g.bbox[0] + (l.a[2] + .5) * g.res, z = g.bbox[1] + (l.a[1] + .5) * g.res; return pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < 40); });
    }
    return [];
  }

  /** État voulu à la minute `m` (plan + perturbations + hors-plan) appliqué à sim.js ; ne recalcule les champs que si nécessaire. */
  #appliquer(plan: Plan, m: number): void {
    const M = this.#M, S = M.SIM, sc = this.#sc!;
    const ferme = new Set<string>(PORTES.filter((p) => plan.portes[p] === 'fermee'));
    const evite = new Set<string>();
    let stations = m >= Math.min(sc.stations_fermees_minute, Number(this.#hors.heure_fermeture_stations ?? Infinity));
    const escalatorsArretes: string[] = this.#hors.escalators === 'arret' ? ['tous'] : [];
    if (this.#hors.escalators === 'sens_unique_sortie') this.ecarts.add('escalators « sens unique sortie » : sim.js n\'a pas de sens d\'escalator, sans effet');
    const ascPanne: string[] = [];
    let retard = 0;
    for (const e of (this.#o.contraintes ?? [])) {
      if (e.minute > m) continue;
      const cible = e.cible ?? '';
      switch (e.code) {
        case 'SORTIE': if (e.etat === 'fermee') ferme.add(cible); else ferme.delete(cible); break;
        case 'B1': ferme.add(cible); break;
        case 'C1': stations = true; if (cible && cible !== 'tous') this.ecarts.add(`C1 « ${cible} » : sim.js ne ferme que l'ensemble des quais (toutes les stations du Forum d'un coup)`); break;
        case 'B3': escalatorsArretes.push(cible || 'tous'); break;
        case 'B5': ascPanne.push(cible || 'tous'); break;
        case 'D2': for (const p of PORTE_DE_ZONE[cible] ?? []) ferme.add(p); break;
        case 'D1': for (const p of PORTE_DE_ZONE[cible] ?? []) evite.add(p); break;
        case 'D5': if (e.minute + (e.duree_min ?? 0) > m) { const ps = PORTE_DE_ZONE[cible]; if (ps) ps.forEach((p) => ferme.add(p)); else this.ecarts.add(`D5 « ${cible} » : zone fermée non portée par une porte, sim.js ne sait pas interdire une zone intérieure`); } break;
        case 'F1': retard = Math.max(retard, e.valeur ?? 0); break;
      }
    }
    for (const p of ferme) if (!this.#groupe(p)) this.ecarts.add(`porte « ${p} » sans sortie dans sim.js (canopee, parking_turbigo) : fermeture sans effet`);
    // guidage et renforts : un agent posté à la porte (sim.js : bonus de choix à moins de 40 m, nombre d'agents non pris en compte)
    const agents = new Set<string>();
    for (const g of plan.guidage) if (g.agents > 0) { const id = PORTES.find((p) => sansAccent(g.point).includes(p)); if (id) agents.add(id); else this.ecarts.add(`guidage « ${g.point} » : pas une porte de sim.js, ignoré`); }
    const renforts = (this.#hors.renforts_portes ?? {}) as Record<string, number>;
    for (const [p, n] of Object.entries(renforts)) if (n > 0) agents.add(p);
    // annonces : sim.js a +1 sur le choix de la sortie annoncée (globalement, pas par zone)
    const annonces = new Set<string>();
    const textes = Object.entries(plan.messages_par_zone);
    for (const [, txt] of textes) { const t = sansAccent(txt).replace(/_/g, ' '); const id = PORTES.find((p) => t.includes(p.replace(/_/g, ' '))); if (id) annonces.add(id); }
    const signature = () => (S.g.links as any[]).map((l) => `${l.k}${l.debit}${l.open ? 1 : 0}`).join('');
    const avantLiens = signature();
    // retour à l'état d'origine, puis application : escalator arrêté = marché comme un escalier (0,55 m/s, 2 pers./s) ; ascenseur en panne = lien supprimé
    for (const l of S.g.links as any[]) { l.k = l.__k0; l.debit = l.__d0; l.open = true; }
    for (const c of escalatorsArretes) {
      const ids = this.#liensVises('escalator', c);
      if (!ids.length) this.ecarts.add(`B3 « ${c} » : aucun escalator identifié par ce nom ou cette porte (les escalators d'OSM n'ont pas de nom) : ignoré`);
      for (const i of ids) { const l = S.g.links[i]; l.k = 'escalier'; l.debit = 2.0; }
    }
    for (const c of ascPanne) {
      const ids = this.#liensVises('ascenseur', c);
      if (!ids.length) this.ecarts.add(`B5 « ${c} » : aucun ascenseur identifié : ignoré`);
      for (const i of ids) S.g.links[i].open = false;
    }
    const changeLiens = signature() !== avantLiens;
    const aRecalculer = new Set<number>();
    S.groups.forEach((G: any, k: number) => {
      if (G.type === 'rue') {
        const id = ID_DE_GROUPE[G.n];
        const ouvert = !(id && ferme.has(id));
        if (G.open !== ouvert) { G.open = ouvert; aRecalculer.add(k); }
        G.zone = M.zone0(k) || (!!id && evite.has(id));
        G.agent = !!id && agents.has(id);
        G.annonce = !!id && annonces.has(id);
      } else if (G.type === 'train') {
        const ouvert = !stations;
        if (G.open !== ouvert) { G.open = ouvert; aRecalculer.add(k); }
      }
    });
    if (changeLiens) S.groups.forEach((_: any, k: number) => aRecalculer.add(k));
    for (const k of aRecalculer) M.lancerChamp(k);
    if (retard * 60 !== S.delay && retard > 0) S.delay = retard * 60;
    this.#personnes(plan, m);
  }

  /** Phasage, confinement et annonces par zone, appliqués aux personnes qui n'ont pas encore commencé à partir. */
  #personnes(plan: Plan, m: number): void {
    const S = this.#M.SIM, sc = this.#sc!;
    const hold: Record<string, number> = {};
    for (const ph of plan.phasage_salles) hold[ph.salle] = Math.max(0, (ph.minute_depart - sc.minute_annonce) * 60);
    const confines = new Set(plan.confinement.actif ? plan.confinement.zones : []);
    const msgZones = new Set(Object.keys(plan.messages_par_zone));
    for (const a of S.A as any[]) {
      if (a.out) continue;
      if (!a.parti && S.T >= a.pre + S.delay) a.parti = true;
      if (a.parti) continue;
      const z = a.zone as string;
      if (msgZones.has(z) && !a.annonce_vue && /\S/.test(plan.messages_par_zone[z])) { a.annonce_vue = true; a.pre0 = Math.min(a.pre0, S.T - S.delay + this.#M.ll(10, 3)); }
      a.pre = confines.has(z) ? 1e9 : Math.max(a.pre0, hold[z] ?? 0);
    }
    void m;
  }

  #mesurer(ms: number, sortis_par_porte: Record<string, number>): EtatResume {
    const S = this.#M.SIM;
    const vivants = (S.A as any[]).filter((a) => !a.out);
    const parZone: EtatResume['par_zone'] = {};
    for (const z of this.#zones) parZone[z] = { personnes: 0, densite: Math.round((this.densites[z] ?? 0) * 100) / 100 };
    for (const a of vivants) if (parZone[a.zone]) parZone[a.zone].personnes++;
    const dmax = Math.max(0, ...Object.values(parZone).map((z) => z.densite));
    void ms;
    return {
      minute: this.#minute, dans_le_centre: vivants.length, sortis: S.out, sortis_vers_zone_danger: S.zoneOut,
      densite_max: dmax, par_zone: parZone, debit_portes: sortis_par_porte,
    };
  }

  /** Densité (personnes par m², cellule de 1 m comme sim.js) maximale vue par zone, échantillonnée. */
  #echantillon(max: Record<string, number>): void {
    const D = new Map<number, number>();
    const S = this.#M.SIM;
    for (const a of S.A as any[]) { if (a.out || a.ride) continue; const k = a.l * 1e6 + (Math.floor(a.x) + 400) * 1000 + (Math.floor(a.z) + 400); D.set(k, (D.get(k) ?? 0) + 1); }
    for (const a of S.A as any[]) { if (a.out || a.ride) continue; const k = a.l * 1e6 + (Math.floor(a.x) + 400) * 1000 + (Math.floor(a.z) + 400); const d = D.get(k) ?? 0; if (d > (max[a.zone] ?? 0)) max[a.zone] = d; }
  }

  avancer(plan: Plan, minutes: number): EtatResume {
    if (!this.#sc) throw new Error('initialiser() d\'abord');
    const M = this.#M, S = M.SIM;
    for (let k = 0; k < minutes; k++) {
      const t0 = performance.now();
      this.#appliquer(plan, this.#minute);
      const avant = { ...S.outBy } as Record<string, number>;
      const maxZone: Record<string, number> = {};
      const pas = Math.round(60 / PAS_S);
      for (let i = 0; i < pas; i++) {
        M.pas(PAS_S);
        if (this.t90_s === null && S.out >= this.#seuil90) this.t90_s = S.T;
        if (i % 50 === 49) this.#echantillon(maxZone);
      }
      this.densites = maxZone;
      const sorties: Record<string, number> = {};
      for (const [nom, n] of Object.entries(S.outBy as Record<string, number>)) {
        const d = n - (avant[nom] ?? 0);
        if (d > 0) sorties[ID_DE_GROUPE[nom] ?? nom] = d;
      }
      this.#minute++;
      this.#etat = this.#mesurer(0, sorties);
      const ms = performance.now() - t0;
      this.ms_total += ms; this.pas_total += pas;
      this.minutes.push({ minute: this.#minute, sortis: S.out, restantes: this.#etat.dans_le_centre, densite_max: this.#etat.densite_max, sortis_par_porte: sorties, ms: Math.round(ms), pas, ms_par_pas: Math.round((ms / pas) * 1000) / 1000 });
    }
    return this.etat();
  }

  /** Plan initial seul, utile pour les tests (aucune décision). */
  static planNul(): Plan { return planInitial(); }
}

void mulberry32;
