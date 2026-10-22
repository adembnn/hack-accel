// Le moteur de foule du Forum (reports/maquettes/chatelet-3d/sim.js) chargé sans navigateur, tel quel :
// on lui fournit navgrid.json, scene.json, atob et un hasard à graine, et on lit son état SIM.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ICI = dirname(fileURLToPath(import.meta.url));
export const DOSSIER_FORUM = join(ICI, '..', '..', 'reports', 'maquettes', 'chatelet-3d');

let cache = null;
function donnees() {
  if (cache) return cache;
  const lire = (f) => readFileSync(join(DOSSIER_FORUM, f), 'utf8');
  cache = { code: lire('sim.js'), navgrid: JSON.parse(lire('navgrid.json')), scene: JSON.parse(lire('scene.json')) };
  return cache;
}

// Hasard reproductible (mulberry32)
export function hasard(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const AIDES = `
function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;}
function pip(px,pz,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}
`;

// Un monde neuf : chaque run a son propre bac à sable, donc aucune fuite d'état entre deux runs.
export async function nouveauMonde(graine) {
  const d = donnees();
  const ctx = vm.createContext({
    SCN: d.scene,
    atob: (s) => Buffer.from(s, 'base64').toString('latin1'),
    fetch: async () => ({ json: async () => d.navgrid }),
    setTimeout, console,
    __rng: hasard(graine),
  });
  vm.runInContext(`Math.random=__rng;${AIDES}${d.code}\n;globalThis.__SIM=SIM;`, ctx, { filename: 'sim.js' });
  await vm.runInContext('simLoad()', ctx);
  const fn = (nom) => vm.runInContext(nom, ctx);
  return { ctx, SIM: ctx.__SIM, simSpawn: fn('simSpawn'), simAlert: fn('simAlert'), simStep: fn('simStep'), simField: fn('simField') };
}
