// Adaptateur 3 : CrowdSim (lot foule-mouvement, src/sim/motion) -> interface `Mouvement` du lot foule-decision.
// Le moteur (grille + champs de potentiel, très coûteux à calculer) est construit UNE fois puis réinitialisé entre deux runs.
// Écarts : voir LISEZMOI.md (issue fermée détectée à l'arrivée, réinitialisation par accès aux champs privés de CrowdSim,
// densité mesurée autour des sorties, personnes en attente = vitesse désirée nulle).
import { CrowdSim } from '../sim/motion/crowd.ts';
import type { Field } from '../sim/motion/field.ts';
import type { Intention, Mouvement, Personne, RetourMouvement, Scene } from '../sim/behavior/types.ts';
import { chargerNavgrid, chargerScene, GrilleIntegree } from './grille.ts';
import { construireCarte, construireScene, type CarteIssues } from './issues.ts';

export const SALLES = ['salle-1', 'salle-2', 'salle-3', 'salle-4', 'salle-5', 'salle-6'];
const DT_MOTION = 0.25;

/** Champs privés de CrowdSim dont l'adaptateur a besoin (accès par transtypage : on ne modifie pas le lot). */
interface Interne {
  goals: number[][];
  fields: Field[];
  walk: Uint8Array;
  tokens: Float64Array;
  linkUse: Int32Array;
  stepNo: number;
  overSec: number;
  maxDens: number;
  maxPress: number;
  rand: () => number;
  refreshRouting(): void;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MoteurReel {
  readonly grille: GrilleIntegree;
  readonly carte: CarteIssues;
  readonly sim: CrowdSim;
  readonly idx = new Map<string, number>(); // id d'issue -> indice de groupe de but
  readonly ms_construction: number;
  /** Cellules de départ candidates par salle (niveaux -3 et -4, connexes aux sorties). */
  readonly zonesDepart: { niveau: number; x: number; y: number }[][] = [];
  readonly distances_m: Record<string, number> = {};
  readonly echantillons = new Map<string, { level: number; xm: number; ym: number }[]>();
  #in: Interne;

  constructor(cap = 4000) {
    const t0 = performance.now();
    const ng = chargerNavgrid();
    this.grille = new GrilleIntegree(ng);
    this.carte = construireCarte(this.grille, chargerScene());
    // But 0 = première issue ; les autres groupes sont poussés directement dans `goals` puis UN SEUL recalcul des champs.
    this.grille.exits.push(...this.carte.issues[0].cellules);
    this.sim = new CrowdSim(this.grille, { seed: 1, capacity: cap, dt: DT_MOTION, densityEvery: 50 });
    this.#in = this.sim as unknown as Interne;
    const W = this.grille.width, per = W * this.grille.height;
    this.carte.issues.forEach((is, k) => {
      this.idx.set(is.id, k);
      if (k > 0) this.#in.goals.push(is.cellules.map((c) => c.level * per + c.y * W + c.x));
    });
    this.#in.refreshRouting();
    this.choisirZonesDepart();
    this.echantillonner();
    this.ms_construction = performance.now() - t0;
  }

  private choisirZonesDepart(): void {
    const g = this.grille, per = g.width * g.height, pot0 = this.#in.fields[0].pot;
    const cand: { niveau: number; x: number; y: number }[] = [];
    for (const niveau of [3, 4]) {
      for (let y = 2; y < g.height - 2; y += 2) for (let x = 2; x < g.width - 2; x += 2) {
        let ok = true;
        for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (!g.isWalkable(niveau, x + dx, y + dy)) { ok = false; break; }
        if (ok && Number.isFinite(pot0[niveau * per + y * g.width + x])) cand.push({ niveau, x, y });
      }
    }
    if (cand.length < SALLES.length * 20) throw new Error(`pas assez de cellules de départ connexes (${cand.length})`);
    cand.sort((a, b) => g.centre(a as never).xm - g.centre(b as never).xm || a.y - b.y);
    const taille = Math.floor(cand.length / SALLES.length);
    for (let k = 0; k < SALLES.length; k++) this.zonesDepart.push(cand.slice(k * taille, (k + 1) * taille));
    // distance moyenne (potentiel en mètres pondérés) du centre de chaque salle à chaque issue
    for (const is of this.carte.issues) {
      const f = this.#in.fields[this.idx.get(is.id)!].pot;
      let s = 0, n = 0;
      for (const z of this.zonesDepart) {
        const c = z[Math.floor(z.length / 2)];
        const p = f[c.niveau * per + c.y * g.width + c.x];
        if (Number.isFinite(p)) { s += p; n++; }
      }
      this.distances_m[is.id] = n ? Math.round(s / n) : 0;
    }
  }

  private echantillonner(): void {
    const cs = this.grille.cellSize;
    for (const is of this.carte.issues) {
      const pts: { level: number; xm: number; ym: number }[] = [];
      for (const c of is.cellules) for (const [dx, dy] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [6, 0], [-6, 0], [0, 6], [0, -6]]) {
        pts.push({ level: c.level, xm: (c.x + dx) * cs, ym: (c.y + dy) * cs });
      }
      this.echantillons.set(is.id, pts);
    }
  }

  scene(metro_ferme_s: number): Scene {
    return construireScene(this.carte, this.distances_m, metro_ferme_s);
  }

  /** Remet CrowdSim à zéro sans recalculer les champs (accès aux champs privés). */
  reinit(graine: number): void {
    const s = this.sim, i = this.#in;
    s.n = 0; s.time = 0; s.exited = 0;
    i.stepNo = 0; i.overSec = 0; i.maxDens = 0; i.maxPress = 0;
    i.tokens.fill(0); i.linkUse.fill(0);
    i.rand = mulberry32(graine ^ 0x5bd1e995);
    for (const d of s.density) d.fill(0);
    for (const p of s.pressure) p.fill(0);
  }

  placer(personnes: Personne[], graine: number): void {
    this.reinit(graine);
    const rnd = mulberry32(graine ^ 0x1234567);
    const cs = this.grille.cellSize;
    for (const p of personnes) {
      const k = Math.max(0, SALLES.indexOf(p.salle));
      const zone = this.zonesDepart[k];
      const c = zone[Math.floor(rnd() * zone.length)];
      this.sim.addAgent(c.niveau, (c.x + 0.2 + 0.6 * rnd()) * cs, (c.y + 0.2 + 0.6 * rnd()) * cs, { goal: 0, v0: 0 });
    }
  }

  potentiel(goal: number): Float64Array { return this.#in.fields[goal].pot; }
}

let moteur: MoteurReel | null = null;
export function moteurPartage(): MoteurReel { return (moteur ??= new MoteurReel()); }

export interface TraceMouvement {
  /** Personnes restantes par salle, sorties par issue au dernier pas, durée CPU du dernier pas. */
  restantes_par_salle: Record<string, number>;
  sorties_pas: Record<string, number>;
  pas_ms: number;
}

export interface MouvementReel extends Mouvement {
  trace(): TraceMouvement;
  readonly moteur: MoteurReel;
  /** Temps CPU cumulé passé dans CrowdSim.step (ms). */
  cpu_ms(): number;
}

export function creerMouvementReel(m: MoteurReel = moteurPartage(), graine = 1): MouvementReel {
  let issueIds: string[] = [];
  let personnes: Personne[] = [];
  let sorti: boolean[] = [];
  let restantes = 0;
  let cible: number[] = [];
  let derniere: TraceMouvement = { restantes_par_salle: {}, sorties_pas: {}, pas_ms: 0 };
  let cpu = 0;
  const sim = m.sim;
  const nbSalle = new Map<string, number>();
  const parGoal = new Map<number, string>();

  return {
    moteur: m,
    init(scene: Scene, ps: Personne[]) {
      issueIds = scene.issues.map((i) => i.id);
      parGoal.clear();
      for (const id of issueIds) {
        if (!m.idx.has(id)) throw new Error(`issue « ${id} » sans groupe de but dans le moteur`);
        parGoal.set(m.idx.get(id)!, id);
      }
      personnes = ps;
      m.placer(ps, graine);
      sorti = ps.map(() => false);
      cible = ps.map(() => 0);
      restantes = ps.length;
      nbSalle.clear();
      for (const p of ps) nbSalle.set(p.salle, (nbSalle.get(p.salle) ?? 0) + 1);
      cpu = 0;
    },
    pas(dt_s, _t, intentions: Intention[], ouvertes): RetourMouvement {
      for (const it of intentions) {
        const i = it.id;
        if (sorti[i]) continue;
        if (it.etat === 'marche' && it.sortie_cible) {
          const g = m.idx.get(it.sortie_cible)!;
          sim.goal[i] = g; cible[i] = g;
          sim.v0[i] = Math.min(1.8, Math.max(0.3, it.vitesse_voulue_m_s));
        } else sim.v0[i] = 0; // attente, hésitation : immobile (écart : reste compté dans la densité)
      }
      const t0 = performance.now();
      const n = Math.max(1, Math.round(dt_s / DT_MOTION));
      for (let k = 0; k < n; k++) sim.step();
      const ms = performance.now() - t0;
      cpu += ms;

      const sorties: RetourMouvement['sorties'] = [];
      const fermee: number[] = [];
      const parIssue: Record<string, number> = {};
      for (let i = 0; i < personnes.length; i++) {
        if (sorti[i] || sim.state[i] !== 2) continue;
        const id = parGoal.get(sim.goal[i])!;
        if (ouvertes[id] === false) {
          // arrivée devant une issue fermée : on la remet en marche sur place ; le comportement la fera hésiter puis rechoisir
          sim.state[i] = 0; sim.exited--; sim.exitT[i] = -1; sim.v0[i] = 0;
          fermee.push(i);
        } else {
          sorti[i] = true; restantes--;
          sorties.push({ id: i, issue_id: id });
          parIssue[id] = (parIssue[id] ?? 0) + 1;
        }
      }
      // densité, pression et file autour de chaque issue
      const dens: Record<string, number> = {}, pres: Record<string, number> = {}, file: Record<string, number> = {};
      for (const id of issueIds) {
        let d = 0, p = 0;
        for (const q of m.echantillons.get(id)!) {
          d = Math.max(d, sim.densityAt(q.level, q.xm, q.ym));
          p = Math.max(p, sim.pressureAt(q.level, q.xm, q.ym));
        }
        dens[id] = d; pres[id] = p; file[id] = 0;
      }
      const cs = m.grille.cellSize, W = m.grille.width, per = W * m.grille.height;
      for (let i = 0; i < personnes.length; i++) {
        if (sorti[i] || sim.state[i] !== 0 || sim.v0[i] === 0) continue;
        const pot = m.potentiel(cible[i]);
        const node = sim.lvl[i] * per + Math.floor(sim.y[i] / cs) * W + Math.floor(sim.x[i] / cs);
        if (pot[node] < 25) file[parGoal.get(cible[i])!]++;
      }
      const rest: Record<string, number> = {};
      for (const [s, c] of nbSalle) rest[s] = c;
      for (let i = 0; i < personnes.length; i++) if (sorti[i]) rest[personnes[i].salle]--;
      derniere = { restantes_par_salle: rest, sorties_pas: parIssue, pas_ms: ms };
      return { densite_par_zone: dens, pression_par_zone: pres, file_par_issue: file, sorties, devant_issue_fermee: fermee };
    },
    restantes: () => restantes,
    trace: () => derniere,
    cpu_ms: () => cpu,
  };
}
