// Bench du lot « maquette-sols » : charge sim.js et sols.js tels quels (comme la page), place 3 200 personnes, 30 s de calme puis 120 s d'évacuation,
// et compte les défauts de réalisme. Code de sortie 0 seulement si tous les compteurs sont à 0.
// Usage : node bench-sols.mjs [nombre de personnes]    (navgrid.json et scene.json doivent exister : python3 build_navgrid.py)
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const N = +(process.argv[2] || 3200);
const read = f => fs.readFileSync(path.join(HERE, f), 'utf8');
const sb = { console, Math, atob: s => Buffer.from(s, 'base64').toString('binary'), setTimeout, Float32Array, Uint8Array, Map, Set, Object, Array, JSON, Number, Date, Error, Promise, module: undefined };
sb.fetch = async f => ({ json: async () => JSON.parse(read(f)) });
vm.createContext(sb);
const run = (code, name) => vm.runInContext(code, sb, { filename: name });
// données et utilitaires de la page (mêmes définitions que index.html)
sb.SCN = JSON.parse(read('scene.json'));
run(`function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;}
function pip(px,pz,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}
const ETAGE=6;let spread=1.0;const alt=l=>l<0?l*ETAGE*spread:l*4;`, 'page');
run(read('sim.js'), 'sim.js'); run(read('sols.js'), 'sols.js');
await run('simLoad()', 'load'); run('solsDecode(SIM.g)', 'sols');
run('SIM.on=false;simSpawn(' + N + ');SIM.mode="calme";', 'spawn');

// ---- mesures (exécutées dans le contexte de la page) ----
run(`
const BENCH={exFacade:[],exBoutique:[],maxSansSol:0,sumSansSol:0,maxBoutique:0,sumBoutique:0,facade:0,escAxe:0,escN:0,mobilier:0,exSansSol:[],rideMax:0};
// sol réellement dessiné : rectangles de solsFloors (mêmes que le maillage), indexés par ligne
const DR=SIM.g.levels.map((L,l)=>{const rows=[];for(const k of [1,2,3,4,5])for(const o of solsRects(l,k))for(let r=o.r0;r<=o.r1;r++)(rows[r]=rows[r]||[]).push(o);return rows;});
function drawnY(l,x,z){const g=SIM.g,c=(x-g.bbox[0])/g.res,r=Math.floor((z-g.bbox[1])/g.res);const rr=DR[l][r];if(!rr)return NaN;for(const o of rr)if(c>=o.c0&&c<o.c1+1)return solsY(g.levels[l],alt);return NaN;}
function checkpoint(label){let sans=0,n=0;const ex=[];SIM.A.forEach((a,i)=>{if(a.out||a.ride)return;n++;const y=alt(SIM.g.levels[a.l]);const fy=drawnY(a.l,a.x,a.z);
  if(!(Math.abs(fy-y)<=0.15)){sans++;if(ex.length<4)ex.push({i,niv:SIM.g.levels[a.l],x:+a.x.toFixed(1),z:+a.z.toFixed(1)});}});
  BENCH.maxSansSol=Math.max(BENCH.maxSansSol,sans);BENCH.sumSansSol+=sans;if(ex.length&&BENCH.exSansSol.length<8)BENCH.exSansSol.push(...ex);return {label,n,sans};}
// cases praticables sans sol dessiné
function casesSansSol(){const g=SIM.g;let bad=0,tot=0;for(let l=0;l<SIM.L;l++)for(let r=0;r<g.h;r++)for(let c=0;c<g.w;c++){if(!SIM.walk[l*SIM.N+r*g.w+c])continue;tot++;
  if(!Number.isFinite(drawnY(l,g.bbox[0]+(c+.5)*g.res,g.bbox[1]+(r+.5)*g.res)))bad++;}return {tot,bad};}

// boutiques (hors cinéma UGC) : polygones, ouvertures, arêtes de façade indexées
const UGCP=SCN.interieur.filter(o=>(o.n||'').trim()==='UGC').map(o=>pairs(o.p));
const ROOMS=[],EDGES=new Map(),EK=(l,x,z)=>l*1e8+Math.floor(x/8+100)*1000+Math.floor(z/8+100);
SCN.interieur.forEach((o,ri)=>{if(o.k!=='room'||!o.l.length)return;const pts=pairs(o.p);if(pts.length<3||Math.max(...pts.map(p=>Math.abs(p[0])))>2000)return;
  const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length,cz=pts.reduce((s,p)=>s+p[1],0)/pts.length;if(UGCP.some(u=>pip(cx,cz,u))||(o.n||'').trim()==='UGC')return;
  lvlsOf(o.l).forEach(L=>{const l=SIM.g.levels.indexOf(L);const opens=(SIM.g.ouvertures||[]).filter(q=>q.room===ri&&q.l===L);const R={ri,l,pts,opens,closed:!opens.length,x0:Math.min(...pts.map(p=>p[0])),x1:Math.max(...pts.map(p=>p[0])),z0:Math.min(...pts.map(p=>p[1])),z1:Math.max(...pts.map(p=>p[1]))};ROOMS.push(R);
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4)+1;for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;const key=EK(l,x,z);let L2=EDGES.get(key);if(!L2)EDGES.set(key,L2=[]);if(!L2.some(e=>e.a===a))L2.push({a,b,R});}}});});
function segX(p,q,a,b){const d1x=q[0]-p[0],d1z=q[1]-p[1],d2x=b[0]-a[0],d2z=b[1]-a[1],den=d1x*d2z-d1z*d2x;if(Math.abs(den)<1e-12)return null;const t=((a[0]-p[0])*d2z-(a[1]-p[1])*d2x)/den,u=((a[0]-p[0])*d1z-(a[1]-p[1])*d1x)/den;return(t>=0&&t<=1&&u>=0&&u<=1)?[p[0]+d1x*t,p[1]+d1z*t]:null;}
const PREV=new Map();
function trackStep(){SIM.A.forEach((a,i)=>{if(a.out||a.ride){PREV.delete(i);return;}const pr=PREV.get(i);const cur=[a.x,a.z];
  if(pr&&pr.l===a.l){const seen=new Set();for(const pp of [pr.p,cur]){const L2=EDGES.get(EK(a.l,pp[0],pp[1]));if(!L2)continue;for(const e of L2){if(seen.has(e.a))continue;seen.add(e.a);const x=segX(pr.p,cur,e.a,e.b);if(!x)continue;
    if(e.R.opens.some(q=>Math.hypot(q.x-x[0],q.z-x[1])<=2.1))continue;BENCH.facade++;if(BENCH.exFacade.length<4)BENCH.exFacade.push({i,ri:e.R.ri,niv:SIM.g.levels[a.l],x:+x[0].toFixed(1),z:+x[1].toFixed(1)});}}}
  PREV.set(i,{l:a.l,p:cur});});}
function boutiquesFermees(){let n=0;SIM.A.forEach((a,i)=>{if(a.out||a.ride)return;for(const R of ROOMS){if(R.l!==a.l||!R.closed)continue;if(a.x<R.x0||a.x>R.x1||a.z<R.z0||a.z>R.z1)continue;if(pip(a.x,a.z,R.pts)){n++;if(BENCH.exBoutique.length<4)BENCH.exBoutique.push({i,niv:SIM.g.levels[a.l],x:+a.x.toFixed(1),z:+a.z.toFixed(1)});break;}}});BENCH.maxBoutique=Math.max(BENCH.maxBoutique,n);BENCH.sumBoutique+=n;}
`, 'bench-defs');
const T0 = Date.now(); const rows = [];
const step = (secs, label) => { const n = Math.round(secs / 0.1); for (let i = 0; i < n; i++) { run('simStep(.1);trackStep()', 's'); if (i % 50 === 49) { run('boutiquesFermees()', 'bf'); rows.push(run(`checkpoint("${label} "+SIM.T.toFixed(0)+" s")`, 'cp')); } } };
step(30, 'calme');
run('simAlert()', 'alert');
step(120, 'évac');
const cs = run('casesSansSol()', 'cs'); const B = run('BENCH', 'B');
console.log('personnes :', N, '· temps de calcul', ((Date.now() - T0) / 1000).toFixed(0), 's');
for (const r of rows.filter((_, i) => i % 3 === 0)) console.log(' ', r.label.padEnd(12), 'actifs', String(r.n).padStart(5), 'sans sol dessiné', r.sans);
const out = [
  ['personnes sans sol dessiné (±0,15 m) — max sur les points de mesure', B.maxSansSol],
  ['cases praticables sans sol dessiné', cs.bad + ' / ' + cs.tot, cs.bad],
  ['personnes dans une boutique fermée — max sur les points de mesure', B.maxBoutique],
  ['franchissements de façade de boutique (hors ouverture)', B.facade],
];
let ok = true;
for (const [label, v, n] of out) { const val = n ?? v; console.log((val === 0 ? 'OK  ' : 'ECHEC'), label.padEnd(72), v); if (val !== 0) ok = false; }
if (B.exFacade.length) console.log('exemples façade :', JSON.stringify(B.exFacade));
if (B.exBoutique.length) console.log('exemples boutique fermée :', JSON.stringify(B.exBoutique));
if (B.exSansSol.length) console.log('exemples sans sol :', JSON.stringify(B.exSansSol.slice(0, 6)));
console.log(ok ? 'RESULTAT : tout est à 0' : 'RESULTAT : des compteurs ne sont pas à 0');
process.exit(ok ? 0 : 1);
