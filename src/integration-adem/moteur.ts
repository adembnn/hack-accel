// Moteur de référence d'Adem (reports/maquettes/chatelet-3d/sim.js) chargé dans Node SANS le modifier.
// sim.js est un script navigateur (globales SIM, simLoad, simStep...). On l'exécute dans un contexte `vm` avec :
//  - un Math.random à graine (le fichier d'origine tire sur Math.random : sans cela, aucune reproductibilité) ;
//  - un faux `fetch` qui renvoie navgrid.json, `atob`, `SCN` (scene.json), `pip` et `pairs` (copiés de index.html) ;
//  - un cache des champs de pentes (Dial) : sim.js les recalcule à chaque ouverture/fermeture d'une sortie (~centaines de ms).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DOSSIER_MAQUETTE = fileURLToPath(new URL('../../reports/maquettes/chatelet-3d/', import.meta.url));

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Portes nommées du lot decideurs -> groupe de sortie de sim.js (par nom). `canopee` et `parking_turbigo` : aucune sortie correspondante. */
export const GROUPE_DE_PORTE: Record<string, string> = {
  lescot: 'Porte Lescot', berger: 'Porte Berger', rambuteau: 'Porte Rambuteau', pont_neuf: 'Porte du Pont Neuf',
  saint_eustache: 'Porte Saint-Eustache', jour: 'Porte du Jour', louvre: 'Porte du Louvre', marguerite_de_navarre: 'Porte Marguerite de Navarre',
};

export function disponible(dossier = DOSSIER_MAQUETTE): boolean {
  return ['sim.js', 'navgrid.json', 'scene.json'].every((f) => existsSync(dossier + f));
}

export interface Personne { l: number; x: number; z: number; vx: number; vz: number; kind: string; v0: number; pre: number; bh: number; fam: number; t: number; next: number; hes: number; ride: unknown; out: boolean; dens: number; [k: string]: any }

export class MoteurAdem {
  readonly ctx: any;
  readonly SIM: any;
  readonly ms_chargement: number;
  readonly cacheChamps: Map<string, Float32Array> = new Map();
  #rngRef: { f: () => number } = { f: mulberry32(1) };
  champs_calcules = 0;
  champs_reutilises = 0;
  ms_champs = 0;
  #base: { groupes: { open: boolean; cells: any[]; zone: boolean }[] } | null = null;

  private constructor(api: any, ms: number) {
    this.ctx = api; this.SIM = api.SIM; this.ms_chargement = ms;
  }

  static async creer(dossier = DOSSIER_MAQUETTE): Promise<MoteurAdem> {
    const t0 = performance.now();
    const grille = JSON.parse(readFileSync(dossier + 'navgrid.json', 'utf8'));
    const scene = JSON.parse(readFileSync(dossier + 'scene.json', 'utf8'));
    const code = readFileSync(dossier + 'sim.js', 'utf8');
    // Pas de contexte `vm` : les accès aux globales y sont ~6 fois plus lents (mesuré : 20 ms contre ~3 ms par pas). sim.js est donc
    // enveloppé dans une fonction : ses déclarations deviennent locales (rapides) et rien ne fuit dans le global de Node.
    const rng = { f: mulberry32(1) };
    const Maths = Object.create(Math) as Math;
    (Maths as { random: () => number }).random = () => rng.f();
    const helpers = `function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;}
function pip(px,pz,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}`;
    const crochet = `
;const __simFieldOrigine = simField;
simField = function(k){ const c=__cle(k), hit=__cache.get(c);
  if(hit){ SIM.F[k].set(hit); __m.champs_reutilises++; return; }
  const t=performance.now(); __simFieldOrigine(k); __m.ms_champs += performance.now()-t; __m.champs_calcules++;
  if(__cache.size<60) __cache.set(c, SIM.F[k].slice()); };
return { SIM, simLoad, simStep, simSpawn, simAlert, simField: (k) => simField(k), ll };`;
    const fabrique = new Function('atob', 'fetch', 'SCN', 'performance', 'Math', '__cle', '__cache', '__m', `${helpers}
${code}
${crochet}`);
    const mRef: { m: MoteurAdem | null } = { m: null };
    const proxy = new Proxy({}, { get: (_t, p) => (mRef.m as any)[p], set: (_t, p, v) => { (mRef.m as any)[p] = v; return true; } });
    const cle = (k: number) => {
      const G = mRef.m!.SIM.groups[k];
      const liens = mRef.m!.SIM.g.links.map((l: any, i: number) => (l.open ? '' : i)).filter((v: any) => v !== '').join(',');
      return `${k}|${G.open}|${G.cells.map((e: any) => e.id).join(',')}|${liens}`;
    };
    const cache = new Map<string, Float32Array>();
    const api = fabrique((s: string) => atob(s), async () => ({ json: async () => grille }), scene, performance, Maths, cle, cache, proxy) as any;
    const m = new MoteurAdem(api, 0);
    mRef.m = m;
    (m as { cacheChamps: Map<string, Float32Array> }).cacheChamps = cache;
    m.#rngRef = rng;
    await api.simLoad();
    for (const l of m.SIM.g.links) { l.__k0 = l.k; l.__d0 = l.debit; }
    (m as { ms_chargement: number }).ms_chargement = performance.now() - t0;
    m.#base = { groupes: m.SIM.groups.map((G: any) => ({ open: G.open, cells: G.cells.slice(), zone: G.zone })) };
    return m;
  }

  zone0(k: number): boolean { return this.#base!.groupes[k].zone; }
  ll(med: number, b: number): number { return this.ctx.ll(med, b); }
  graine(n: number): void { this.#rngRef.f = mulberry32(n); }
  lancerChamp(k: number): void { this.ctx.simField(k); }
  champsTous(): void { this.SIM.groups.forEach((_: any, k: number) => this.lancerChamp(k)); }

  /** Remet l'état de base (toutes sorties ouvertes, aucun lien coupé, aucun agent ni annonce, zones d'origine). */
  remettreAZero(): void {
    const S = this.SIM;
    S.g.links.forEach((k: any) => { k.open = true; k.free = [0, 0]; });
    S.groups.forEach((G: any, i: number) => {
      const b = this.#base!.groupes[i];
      G.open = b.open; G.cells = b.cells.slice(); G.zone = b.zone; G.agent = false; G.annonce = false; G.filtre = false; G.nextFree = 0;
    });
    S.delay = 0;
    this.champsTous();
  }

  /** Tire `n` personnes (sim.js : 55 % cinéma, 20 % RER, reste clients) avec la graine donnée ; renvoie la copie de la population. */
  tirerPopulation(n: number, graine: number): Personne[] {
    this.graine(graine);
    this.remettreAZero();
    this.SIM.A = null; this.ctx.simSpawn(n);
    return this.SIM.A.map((a: Personne) => ({ ...a }));
  }

  /** Remet une population tirée plus tôt et passe en mode évacuation (simAlert) : chacun garde sa place et tire son délai de départ. */
  demarrer(population: Personne[], graine: number): void {
    this.remettreAZero();
    this.SIM.A = population.map((a) => ({ ...a, ride: null }));
    this.graine(graine);
    this.SIM.mode = 'calme'; this.ctx.simAlert();
    this.SIM.A.forEach((a: Personne) => { a.pre0 = a.pre; a.parti = false; });
  }

  /** Un pas de sim.js (simStep) ; la fonction est résolue une fois pour éviter de recompiler du code à chaque pas. */
  pas = (dt: number): void => { this.ctx.simStep(dt); };
  /** Mode du moteur : exposé pour les tests. */
  get temps(): number { return this.SIM.T; }
}
