// Le vrai moteur du Forum (reports/maquettes/chatelet-3d/sim.js : grille 1 m sur 6 niveaux, logit de Lovreglio, forces sociales,
// escalators à débit limité) chargé tel quel dans un bac à sable Node (node:vm), sans navigateur, avec un hasard à graine.
// Sert à jouer « sans / avec notre solution » sur le vrai Forum. Modèle simplifié, non certifié. Voir MOTEUR-SIMJS.md.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { creerRng } from './rng.ts';
import type { Plan } from './types.ts';

export const DOSSIER_FORUM = join(import.meta.dirname, '..', '..', '..', 'reports', 'maquettes', 'chatelet-3d');

/** Table de correspondance : id d'issue de notre Plan -> noms de groupes de sortie de sim.js (SIM.groups[k].n). */
export type Correspondance = Record<string, string[]>;

// Noms relevés sur la vraie grille (voir MOTEUR-SIMJS.md). Un id de Plan qui est déjà un nom de groupe passe tel quel.
export const CORRESPONDANCE_DEFAUT: Correspondance = {
  principale: ['Porte Lescot'],
  secours: ['Issues de secours'],
  escalators: ['Porte Berger'],
  metro: ['Quais RER et métro'],
  ferronnerie: ['Porte Rambuteau'],
};

export interface OptionsSimJs {
  /** Nombre de personnes (3 200 par défaut, comme la maquette). */
  personnes?: number;
  /** Durée maximale simulée (s). */
  duree_s?: number;
  /** Pas de temps (s). */
  pas_s?: number;
  /** Annonce tardive : tout le monde démarre ce nombre de secondes plus tard (SIM.delay). */
  retard_alerte_s?: number;
  /** Éviter les sorties « zone » (manifestation, rue Berger/Rambuteau) : SIM.zoneOn, vrai dans la maquette. */
  eviter_zone?: boolean;
  correspondance?: Correspondance;
}

export interface ResultatSimJs {
  t_s: number;
  sortis: number;
  sortis_par_porte: Record<string, number>;
  sortis_zone_danger: number;
  /** Personnes-secondes passées au-dessus de 5 pers./m². */
  exposition_5ppm2_s: number;
  densite_max: number;
  t90_s: number | null;
  t95_s: number | null;
  non_sortis: number;
}

/** Un moteur chargé : un seul bac à sable, réinitialisé à chaque partie. */
export interface MoteurSimJs {
  /** Noms des groupes de sortie de sim.js (portes de rue, issues de secours, quais). */
  groupes: string[];
  jouer(plan: Plan, graine: number, options?: OptionsSimJs): ResultatSimJs;
}

/** Les fichiers générés (navgrid.json, scene.json) sont-ils présents dans ce dossier ? */
export const donneesPresentes = (dossier = DOSSIER_FORUM): boolean =>
  ['sim.js', 'navgrid.json', 'scene.json'].every((f) => existsSync(join(dossier, f)));

// Aides que la page définit ailleurs (index.html) et que sim.js suppose globales.
const AIDES = `
function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;}
function pip(px,pz,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}
`;

// Les types de sim.js (SIM est global à son script, pas à globalThis) : on n'en décrit que ce qu'on touche.
interface Groupe { n: string; open: boolean; agent?: boolean; annonce?: boolean; cells: unknown[] }
interface Sim {
  groups: Groupe[]; g: { links: { open: boolean; free: number[] }[] };
  T: number; out: number; outBy: Record<string, number>; zoneOut: number; expo: number; dmax: number;
  delay: number; zoneOn: boolean;
}
interface Fonctions { simLoad(): Promise<void>; simSpawn(n: number): void; simAlert(): void; simStep(dt: number): void; simField(k: number): void }

export async function chargerMoteurSimJs(dossier: string = DOSSIER_FORUM): Promise<MoteurSimJs> {
  if (!donneesPresentes(dossier)) throw new Error(`Données du Forum absentes dans ${dossier} : lancer ./recuperer-osm.sh puis python3 build_navgrid.py (voir LISEZMOI.md).`);
  const code = readFileSync(join(dossier, 'sim.js'), 'utf8');
  const navgrid: unknown = JSON.parse(readFileSync(join(dossier, 'navgrid.json'), 'utf8'));
  const scene: unknown = JSON.parse(readFileSync(join(dossier, 'scene.json'), 'utf8'));
  let hasard = creerRng(0);
  const ctx = vm.createContext({
    SCN: scene,
    atob: (s: string) => Buffer.from(s, 'base64').toString('latin1'),
    fetch: async () => ({ json: async () => navgrid }),
    setTimeout,
    // Math.random du bac à sable : notre générateur à graine (remplacé à chaque partie).
    __rnd: () => hasard.next(),
  });
  vm.runInContext(`Math.random=__rnd;${AIDES}${code}\n;globalThis.__SIM=SIM;globalThis.__F={simLoad,simSpawn,simAlert,simStep,simField};`, ctx, { filename: 'sim.js' });
  const sim = (ctx as { __SIM: Sim }).__SIM;
  const f = (ctx as { __F: Fonctions }).__F;
  await f.simLoad();

  const groupes = sim.groups.map((g) => g.n);
  const etatInitial = sim.g.links.map((k) => k.open);
  // Groupes dont le champ de distances est à jour pour « ouvert » : on ne recalcule que ce qui change (simField coûte cher).
  const ouvert = sim.groups.map(() => true);
  const ordonner = (k: number, o: boolean): void => { if (ouvert[k] === o) return; sim.groups[k].open = o; ouvert[k] = o; f.simField(k); };

  return {
    groupes,
    jouer(plan, graine, options = {}) {
      const { personnes = 3200, duree_s = 900, pas_s = 0.2, retard_alerte_s = 0, eviter_zone = true, correspondance = CORRESPONDANCE_DEFAUT } = options;
      hasard = creerRng(graine);
      const cibles = (id: string): number[] => {
        const noms = correspondance[id] ?? [id];
        const ks = noms.map((n) => groupes.indexOf(n)).filter((k) => k >= 0);
        if (!ks.length) throw new Error(`Issue « ${id} » sans groupe sim.js (groupes : ${groupes.join(', ')})`);
        return ks;
      };
      // Remise à zéro de ce que les parties précédentes ont pu toucher.
      sim.groups.forEach((g, k) => { g.agent = false; g.annonce = false; ordonner(k, true); });
      sim.g.links.forEach((k, i) => { k.open = etatInitial[i]; k.free = [0, 0]; });
      sim.delay = retard_alerte_s; sim.zoneOn = eviter_zone;

      // Portes : état à t = 0 tout de suite, changements ultérieurs en événements datés.
      const evenements: { t: number; ks: number[]; ouverte: boolean }[] = [];
      for (const p of plan.portes) {
        const e = { t: p.a_partir_de_s ?? 0, ks: cibles(p.id), ouverte: p.ouverte };
        if (e.t <= 0) e.ks.forEach((k) => ordonner(k, e.ouverte)); else evenements.push(e);
      }
      evenements.sort((a, b) => a.t - b.t);
      // Guidage : la porte visée attire à moins de 40 m (G.agent). Messages : G.annonce, daté ; clarté < 0,5 = consigne ignorée.
      if (plan.guidage && plan.guidage.personnel > 0) cibles(plan.guidage.issue_id).forEach((k) => { sim.groups[k].agent = true; });
      const annonces = plan.messages_par_zone
        .filter((m) => m.issue_id && m.clarte >= 0.5)
        .map((m) => ({ t: m.a_partir_de_s, ks: cibles(m.issue_id as string) }))
        .sort((a, b) => a.t - b.t);

      f.simSpawn(personnes);
      f.simAlert();
      const seuil90 = Math.ceil(0.9 * personnes), seuil95 = Math.ceil(0.95 * personnes);
      let t90: number | null = null, t95: number | null = null;
      while (sim.T < duree_s && sim.out < personnes) {
        while (evenements.length && evenements[0].t <= sim.T) { const e = evenements.shift()!; e.ks.forEach((k) => ordonner(k, e.ouverte)); }
        while (annonces.length && annonces[0].t <= sim.T) annonces.shift()!.ks.forEach((k) => { sim.groups[k].annonce = true; });
        f.simStep(pas_s);
        if (t90 === null && sim.out >= seuil90) t90 = sim.T;
        if (t95 === null && sim.out >= seuil95) t95 = sim.T;
      }
      return {
        t_s: sim.T, sortis: sim.out, sortis_par_porte: { ...sim.outBy }, sortis_zone_danger: sim.zoneOut,
        exposition_5ppm2_s: sim.expo, densite_max: sim.dmax, t90_s: t90, t95_s: t95, non_sortis: personnes - sim.out,
      };
    },
  };
}
