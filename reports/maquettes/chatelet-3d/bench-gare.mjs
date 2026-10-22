// Vérification du lot « foule de la gare » : node reports/maquettes/chatelet-3d/bench-gare.mjs
// Charge sim.js dans Node (sans navigateur), puis simule 10 min en mode calme et 5 min d'évacuation, trois fois :
//   A. toutes les lignes ouvertes ; B. stations fermées (C1, toutes les lignes) ; C. RER A seul fermé après 5 min de calme.
// Affiche : trains arrivés par quai et par ligne, voyageurs débarqués/embarqués, personnes dans un mur,
// chevauchements < 30 cm, coût par pas de 0,1 s (temps processeur, médiane par blocs de 50 pas), personnes sans chemin.
// Code de sortie 0 seulement si tout passe. Variables facultatives : SEED, CALME et EVAC (nombre de pas, pour un essai rapide).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const SEED=+process.env.SEED||12345,CALME=+process.env.CALME||6000,EVAC=+process.env.EVAC||3000;
let rs=SEED;const rnd=()=>{rs|=0;rs=rs+0x6D2B79F5|0;let t=Math.imul(rs^rs>>>15,1|rs);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const scene=JSON.parse(fs.readFileSync(path.join(dir,'scene.json'),'utf8'));
// pip et pairs viennent de index.html (mêmes définitions) ; fetch lit les fichiers du dossier
const ctx=vm.createContext({console,atob:globalThis.atob,performance,setTimeout,window:{},__rnd:rnd,
 fetch:async f=>({json:async()=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}),
 SCN:{interieur:scene.interieur},
 pairs:p=>{const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;},
 pip:(px,pz,pts)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}});
vm.runInContext('Math.random=__rnd',ctx);
const S=vm.runInContext(fs.readFileSync(path.join(dir,'sim.js'),'utf8')+'\n;({SIM,simLoad,simSpawn,simStep,simAlert,simField,walkable,freeAt,gSansRoute,simCell})',ctx,{filename:'sim.js'});
const {SIM}=S;
const t0=performance.now();await S.simLoad();
console.log(`Chargement : ${((performance.now()-t0)/1000).toFixed(1)} s, grille ${SIM.g.w}x${SIM.g.h}, ${SIM.lignes.length} lignes, ${SIM.quais.length} quais :`);
SIM.lignes.forEach(L=>console.log(`  ${L.nom.padEnd(9)} intervalle ${L.h} s par sens · ${L.pax} descendants par rame · quais : ${SIM.quais.filter(q=>q.L===L).map(q=>q.nom.split(' · ')[1]+' ('+q.doors.length+' cases de portes, '+q.spots.length+' places)').join(', ')} · ${L.src}`));
console.log(`Machine : ${os.cpus().length} cœurs, charge moyenne ${os.loadavg().map(x=>x.toFixed(1)).join(' / ')} (une charge > ${os.cpus().length} gonfle les ms mesurées)`);
const api=ctx.window.lignes;
if(!api||typeof api.liste!=='function')throw new Error('window.lignes absent');

function checks(){ // personnes dans un mur, collées au mur, chevauchements < 30 cm
 let mur=0,collé=0,ov=0;const grid=new Map();
 for(const a of SIM.A){if(a.out||a.ride)continue;if(!S.walkable(a.l,a.x,a.z))mur++;else if(!S.freeAt(a.l,a.x,a.z))collé++;
  const k=a.l*1e7+Math.floor(a.x+500)*1000+Math.floor(a.z+500);let L=grid.get(k);if(!L)grid.set(k,L=[]);L.push(a);}
 for(const [k,L] of grid){const l=Math.floor(k/1e7),r=k-l*1e7,cx=Math.floor(r/1000),cz=r%1000;
  for(const dx of[0,1])for(const dz of[-1,0,1]){if(dx===0&&dz<0)continue;const M=dx===0&&dz===0?L:grid.get(l*1e7+(cx+dx)*1000+cz+dz);if(!M)continue;
   for(let i=0;i<L.length;i++)for(let j=M===L?i+1:0;j<M.length;j++){if(Math.hypot(L[i].x-M[j].x,L[i].z-M[j].z)<.30)ov++;}}}
 return{mur,collé,ov};}
function sansChemin(){ // personnes présentes sans porte de rue ouverte : (a) sortent par les quais (évacuation RATP) (b) aucun chemin du tout
 let ratp=0,aucun=0;const ex=[];
 for(const a of SIM.A){if(a.out||a.ride)continue;const i=S.simCell(a);if(i<0)continue;if(S.gSansRoute(i)){if(SIM.groups.some((G,k)=>G.type==='train'&&G.cells.length&&SIM.F[k][i]<1e9))ratp++;else{aucun++;if(ex.length<3)ex.push(`niv ${SIM.g.levels[a.l]} (${a.x.toFixed(0)}, ${a.z.toFixed(0)})`);}}}
 return{ratp,aucun,ex};}
const snap=()=>JSON.parse(JSON.stringify(SIM.gare));
function diff(b,a){const o={q:a.q.map((q,i)=>({n:q.n,ligne:q.ligne,arr:q.arr-b.q[i].arr,desc:q.desc-b.q[i].desc,emb:q.emb-b.q[i].emb,ratp:q.ratp-b.q[i].ratp,xfer:q.xfer-b.q[i].xfer,entr:q.entr-b.q[i].entr}))};
 ['rue','entr','refus','ratp','sans'].forEach(k=>o[k]=a[k]-b[k]);return o;}
function parLigne(d){const m=new Map();d.q.forEach(q=>{const t=m.get(q.ligne)||{ligne:q.ligne,arr:0,desc:0,emb:0,ratp:0,xfer:0,entr:0};['arr','desc','emb','ratp','xfer','entr'].forEach(k=>t[k]+=q[k]);m.set(q.ligne,t);});return[...m.values()];}
function table(title,d){console.log(`  ${title}`);
 console.log('    ligne      trains  descendus  montés  correspondances  entrés (rue)  évac. RATP');
 const L=parLigne(d);const row=(n,q)=>console.log('    '+n.padEnd(10)+String(q.arr).padStart(6)+String(q.desc).padStart(11)+String(q.emb).padStart(8)+String(q.xfer).padStart(17)+String(q.entr).padStart(14)+String(q.ratp).padStart(12));
 L.forEach(q=>row(q.ligne,q));const T={};['arr','desc','emb','xfer','entr','ratp'].forEach(k=>T[k]=L.reduce((t,q)=>t+q[k],0));row('TOTAL',T);
 console.log(`    sortis par une porte de rue : ${d.rue} · refus faute d'agent libre : ${d.refus} · voyageurs sans chemin retirés : ${d.sans}`);return L;}
const bad=[];const fail=m=>{bad.push(m);console.log('  ÉCHEC : '+m);};
const liensVus=new WeakSet(),departs=new Map(); // départs sur chaque lien vertical (par sens), pour contrôler l'espacement 1/débit
const vitesse=k=>k.k==='escalator'?.75:k.k==='ascenseur'?1.3:.55;
function noterLiens(){for(const a of SIM.A){const r=a.ride;if(!r||liensVus.has(r))continue;liensVus.add(r);const k=SIM.g.links[r.li];const sens=r.to===k.b?0:1;const key=r.li+'|'+sens;let L=departs.get(key);if(!L)departs.set(key,L=[]);L.push(r.t1-k.len/vitesse(k));}}
function espacement(){let pire=1e9,n=0,mauvais=0,paires=0;for(const [key,L] of departs){const k=SIM.g.links[+key.split('|')[0]];L.sort((a,b)=>a-b);for(let i=1;i<L.length;i++){paires++;const g=L[i]-L[i-1];pire=Math.min(pire,g*k.debit);if(g<1/k.debit-1e-6){mauvais++;}}n+=L.length;}return{n,paires,mauvais,pire};}
function phase(steps){const ms=[];let mur=0,collé=0,ov=0;
 for(let s=1;s<=steps;s++){const c0=process.cpuUsage();S.simStep(.1);const c1=process.cpuUsage(c0);noterLiens();ms.push((c1.user+c1.system)/1000);
  if(s%50===0){const c=checks();mur=Math.max(mur,c.mur);collé=Math.max(collé,c.collé);ov=Math.max(ov,c.ov);}}
 // coût : moyenne, et médiane des moyennes par blocs de 50 pas (critère : la machine de test est partagée, les pointes isolées ne comptent pas)
 const blocs=[];for(let i=0;i+50<=ms.length;i+=50)blocs.push(ms.slice(i,i+50).reduce((a,b)=>a+b,0)/50);blocs.sort((a,b)=>a-b);
 const med=blocs.length?blocs[blocs.length>>1]:0;ms.sort((a,b)=>a-b);
 return{mean:ms.reduce((a,b)=>a+b,0)/ms.length,med,p99:ms[Math.floor(ms.length*.99)],max:ms[ms.length-1],mur,collé,ov};}
function reportLiens(nom){const e=espacement();console.log(`  ${nom} : ${e.n} trajets sur liens verticaux, ${e.paires} paires consécutives, espacement minimal ${e.pire===1e9?'n/a':e.pire.toFixed(2)} × (1/débit) ; trop rapprochés : ${e.mauvais}`);if(e.mauvais>0)fail(`${nom} : ${e.mauvais} passagers d'un même lien trop rapprochés (< 1/débit)`);departs.clear();}
function report(nom,r){console.log(`  ${nom} : ${r.med.toFixed(2)} ms par pas (médiane des blocs de 50 pas, temps processeur ; moyenne ${r.mean.toFixed(2)}, p99 ${r.p99.toFixed(2)}, max ${r.max.toFixed(2)}) · dans un mur : ${r.mur} · collés au mur : ${r.collé} · chevauchements < 30 cm (pire contrôle, toutes les 5 s) : ${r.ov}`);
 if(r.mur>0)fail(`${nom} : ${r.mur} personne(s) dans un mur`);if(r.ov>0)fail(`${nom} : ${r.ov} chevauchement(s) < 30 cm`);if(r.med>8)fail(`${nom} : ${r.med.toFixed(2)} ms par pas > 8`);}
const tot=(L,k,f)=>L.filter(f||(()=>true)).reduce((t,q)=>t+q[k],0);

function start(){rs=SEED;SIM.groups.forEach(G=>{if(G.type!=='train'){G.open=true;}});SIM.lignes.forEach(L=>{L.G.open=true;S.simField(SIM.groups.indexOf(L.G));});
 SIM.delay=0;S.simSpawn(3200);SIM.mode='calme';SIM.on=true;
 console.log(`Agents : ${SIM.A.length} (${SIM.A.filter(a=>!a.out).length} présents au départ, ${SIM.free.length} en réserve) ; au départ ${SIM.A.filter(a=>a.st==='wait').length} attendent sur un quai`);}
function alerte(fermee){reportLiens('Liens verticaux (calme)');const sc=sansChemin();
 S.simAlert();const sc2=sansChemin();
 console.log(`À l'alerte (${fermee}) : ${SIM.A.filter(a=>!a.out).length} personnes présentes ; sans porte de rue accessible : ${sc2.ratp+sc2.aucun} (sortent par un quai, évacuation RATP : ${sc2.ratp} ; sans aucun chemin : ${sc2.aucun}${sc2.ex.length?' ex. '+sc2.ex.join(', '):''})`);
 if(sc2.aucun>0)fail(`${sc2.aucun} personne(s) sans aucun chemin à l'alerte`);}
function fin(g1){reportLiens('Liens verticaux (évacuation)');const g2=snap();const L=table('Évacuation (5 min)',diff(g1,g2));const sc=sansChemin();
 console.log(`  Fin d'évacuation : sortis ${SIM.out}, restants ${SIM.A.filter(a=>!a.out).length}, sans porte de rue ${sc.ratp+sc.aucun} (par un quai ${sc.ratp}, aucun chemin ${sc.aucun})`);
 if(sc.aucun>0)fail(`${sc.aucun} personne(s) sans aucun chemin en fin d'évacuation`);
 console.log('  Sorties principales : '+Object.entries(SIM.outBy).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+v).join(', '));return L;}

// ---------- A. toutes les lignes ouvertes ----------
console.log('\n=== A. Calme 10 min puis évacuation 5 min, toutes les lignes OUVERTES ===');start();
let g0=snap();let r=phase(CALME);let gc=snap();
console.log(`Mode calme : à la fin ${SIM.A.filter(a=>a.st==='wait').length} attendent sur un quai, ${SIM.A.filter(a=>!a.out&&a.st&&a.st!=='wait').length} voyageurs en déplacement, ${SIM.free.length} agents libres`);
let L=table('Calme (10 min)',diff(g0,gc));report('Calme',r);
L.forEach(l=>{if(l.arr===0)fail(`${l.ligne} : aucun train en calme`);if(l.desc===0)fail(`${l.ligne} : aucun débarqué en calme`);if(l.emb===0)fail(`${l.ligne} : aucun embarqué en calme`);});
alerte('toutes lignes ouvertes');let g1=snap();r=phase(EVAC);report('Évacuation',r);L=fin(g1);
if(tot(L,'arr')<=0)fail('aucun train en évacuation lignes ouvertes');if(tot(L,'emb')<=0)fail('aucun voyageur monté en évacuation lignes ouvertes');

// ---------- B. stations fermées (C1, toutes les lignes) ----------
console.log('\n=== B. Calme 10 min puis évacuation 5 min, stations FERMÉES (C1 : toutes les lignes) ===');start();
g0=snap();r=phase(CALME);gc=snap();L=table('Calme (10 min)',diff(g0,gc));report('Calme',r);
SIM.trainG.open=false; // comme leviers.js : le groupe « toutes lignes » ferme chaque ligne
if(SIM.lignes.some(l=>l.G.open))fail('fermer le groupe « toutes lignes » n\'a pas fermé toutes les lignes');
alerte('stations fermées, C1');g1=snap();r=phase(EVAC);report('Évacuation',r);L=fin(g1);
if(tot(L,'arr')!==0)fail('des trains sont arrivés station fermée');if(tot(L,'desc')!==0)fail('des voyageurs sont descendus station fermée');if(tot(L,'emb')!==0)fail('des voyageurs sont montés station fermée');
if(tot(L,'ratp')<=0)console.log('  (aucune évacuation RATP nécessaire)');

// ---------- C. RER A seul fermé ----------
console.log('\n=== C. Calme 5 min, FERMETURE DU RER A SEUL, calme 5 min, évacuation 5 min ===');start();
g0=snap();r=phase(CALME/2);let ga=snap();report('Calme avant fermeture',r);
console.log('  window.lignes.liste() avant : '+api.liste().map(l=>`${l.ligne}${l.open?'':' (fermée)'} ${l.voyageurs}`).join(' · '));
if(!api.fermer('RER A'))fail('window.lignes.fermer(\'RER A\') a échoué');
const ouv=api.liste();if(ouv.find(l=>l.ligne==='RER A').open)fail('RER A encore ouverte après fermer()');if(ouv.filter(l=>l.ligne!=='RER A'&&!l.open).length)fail('une autre ligne s\'est fermée');
r=phase(CALME/2);let gb=snap();report('Calme après fermeture',r);L=table('Calme, 5 min après fermeture du RER A',diff(ga,gb));
const ra=L.find(l=>l.ligne==='RER A');if(ra.arr||ra.desc||ra.emb)fail('RER A fermé mais des trains / voyageurs encore à ses quais en calme');
L.filter(l=>l.ligne!=='RER A').forEach(l=>{if(l.arr===0)fail(`${l.ligne} : plus aucun train après la fermeture du RER A seul`);});
console.log('  window.lignes.liste() après : '+api.liste().map(l=>`${l.ligne}${l.open?'':' (fermée)'} ${l.voyageurs}`).join(' · '));
alerte('RER A fermé, autres lignes ouvertes');g1=snap();r=phase(EVAC);report('Évacuation',r);L=fin(g1);
const ra2=L.find(l=>l.ligne==='RER A');if(ra2.arr||ra2.desc||ra2.emb)fail('RER A fermé mais des trains / voyageurs à ses quais en évacuation');
L.filter(l=>l.ligne!=='RER A').forEach(l=>{if(l.arr===0)fail(`${l.ligne} : plus aucun train en évacuation avec le RER A seul fermé`);});
if(tot(L,'emb',l=>l.ligne!=='RER A')<=0)fail('les autres lignes n\'emportent personne en évacuation');
api.ouvrir('RER A');if(!api.liste().find(l=>l.ligne==='RER A').open)fail('ouvrir() n\'a pas rouvert le RER A');

console.log(bad.length?`\nRÉSULTAT : ÉCHEC (${bad.length})`:'\nRÉSULTAT : OK, tous les contrôles passent');
process.exit(bad.length?1:0);
