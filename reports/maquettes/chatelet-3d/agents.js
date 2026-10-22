// Personnages à rôle dans la foule (lot « maquette-agents », ticket #38).
// ~30 agents de SIM.A sont convertis en personnages : sécurité SSIAP, pompiers BSPP, directeur et chef de poste (au PC, non mobiles),
// agents RATP, policiers, et huit individus influents (meneur, panique, parent, filmeur, personne à mobilité réduite + accompagnant).
// Principe : le LLM (window.cerveau.decider, Claude Haiku) ou, à défaut, les règles ci-dessous CHOISISSENT UNE INTENTION dans une liste
// fermée ; le moteur de sim.js fait le mouvement. Aucun rôle hostile : une menace n'est qu'une zone ou un obstacle (ZONES, issue bloquée).
// Les personnages simulent des rôles plausibles ; ils ne prédisent pas des personnes réelles.
// Branchements (aucun autre fichier touché) : window.simStep, window.simAlert et window.simDraw sont enveloppés comme le fait alertes.js.
(function(){
 if(typeof SIM==='undefined')return;
 const ACTIONS=['deplacer','guider','crier','bloquer','ouvrir','appeler_pc','attendre'];
 // effectifs par défaut ; « echelle » les multiplie (le directeur et le chef de poste restent à 1)
 const CFG=window.agentsCfg={actif:true,cadence:15,delaiBSPP:480,obeir:.6,echelle:1,
  n:{ssiap:9,bspp:4,dir:1,chef:1,ratp:3,pn:2,meneur:2,panique:2,parent:1,filme:1,pmr:1}};
 const ROLES={
  ssiap:{nom:'Agent SSIAP',court:'SSIAP',col:0xff7a00,css:'#ff7a00',staff:true},
  bspp:{nom:'Pompier BSPP',court:'BSPP',col:0xd32f2f,css:'#d32f2f',staff:true},
  dir:{nom:'Directeur du centre',court:'DIR',col:0xf2c200,css:'#c79a00',staff:true,fixe:true},
  chef:{nom:'Chef de poste (PC sécurité)',court:'PC',col:0xffd54f,css:'#c79a00',staff:true,fixe:true},
  ratp:{nom:'Agent RATP',court:'RATP',col:0x2e9e5b,css:'#2e9e5b',staff:true},
  pn:{nom:'Policier (barrage)',court:'POLICE',col:0x1e5bd8,css:'#1e5bd8',staff:true},
  meneur:{nom:'Meneur de groupe',court:'MENEUR',col:0x8e44ad,css:'#8e44ad'},
  panique:{nom:'Personne qui panique',court:'PANIQUE',col:0x8e44ad,css:'#8e44ad'},
  parent:{nom:'Parent qui cherche son enfant',court:'PARENT',col:0x8e44ad,css:'#8e44ad',arret:true},
  filme:{nom:'Personne qui filme',court:'FILME',col:0x8e44ad,css:'#8e44ad'},
  pmr:{nom:'Personne à mobilité réduite',court:'PMR',col:0x8e44ad,css:'#8e44ad'},
  accomp:{nom:'Accompagnant (PMR)',court:'ACCOMP.',col:0x8e44ad,css:'#8e44ad'}};
 const OBEI_ROLE={ssiap:1,bspp:1.15,pn:1,ratp:.85,meneur:.4,panique:.25}; // facteur sur CFG.obeir (estimé)
 const ctx={A:null,idx:[],probe:-1,probeRole:null,nextBrain:0,pending:false,pendT:0,ORD:[],journalPC:[],loads:null,n:0,appels:0,srcN:{claude:0,regles:0,cache:0},lastMode:null};
 window.agents={ctx,CFG,ROLES};
 const p2=n=>String(n).padStart(2,'0'),tt=T=>`T+${p2(Math.floor(T/60))}:${p2(Math.floor(T%60))}`;
 const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,' ').trim();
 const lvOf=a=>SIM.g.levels[a.ride?a.ride.to[0]:a.l];
 const civil=b=>!b.out&&!b.ride&&!b.role;
 const G=k=>SIM.groups[k];
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const dM=(k,a)=>{const i=simCell(a);if(i<0)return 1e9;const f=SIM.F[k][i];return f>=1e9?1e9:f*SIM.g.res;};
 const zoneDoor=k=>{const g=G(k);if(!g||!g.cells||!g.cells.length)return false;const [x,,z]=cellXYZ(g.cells[0].cell);return ZONES.some(Z=>Math.hypot(x-Z.x,z-Z.z)<Z.r+10);};
 const mauvaise=k=>{const g=G(k);return !g.open||g.zone||zoneDoor(k);};

 // ---------- chargement des groupes ----------
 function loads(){const L=new Array(SIM.groups.length).fill(0);for(const b of SIM.A){if(!b.out&&!b.ride&&b.t>=0&&!b.role)L[b.t]++;}return L;}
 // meilleure sortie vue de a : ouverte, hors zone, pondérée par la distance et la file (1 m de plus pour 3 personnes qui la visent / cellule)
 function meilleure(a,pasTrain,exclure){const L=ctx.loads||loads();let best=-1,bs=1e18;
  SIM.groups.forEach((g,k)=>{if(mauvaise(k)||k===exclure)return;if(pasTrain&&g.type==='train')return;const d=dM(k,a);if(d>=1e9)return;
   const s=d+(g.type==='train'?200:0)+(L[k]/Math.max(1,g.cells.length))*1.5;if(s<bs){bs=s;best=k;}});
  if(best<0&&!pasTrain)SIM.groups.forEach((g,k)=>{if(!g.open)return;const d=dM(k,a);if(d<bs){bs=d;best=k;}});return best;}
 const nomG=k=>k>=0&&G(k)?G(k).n:'—';
 const porteDe=k=>LEV.find(l=>l.type==='porte'&&l.grp===k);

 // ---------- installation : convertit des agents de SIM.A en personnages ----------
 function celluleProche(k,fmin,fmax,l0){const g=SIM.g,e=G(k).cells[0].cell,c=[];const l=e[0],r0=e[1],c0=e[2];
  for(let dr=-14;dr<=14;dr++)for(let dc=-14;dc<=14;dc++){const r=r0+dr,cc=c0+dc;if(r<0||cc<0||r>=g.h||cc>=g.w)continue;const i=l*SIM.N+r*g.w+cc;
   if(!SIM.walk[i])continue;const f=SIM.F[k][i];if(f<fmin||f>fmax)continue;const x=g.bbox[0]+(cc+.5)*g.res,z=g.bbox[1]+(r+.5)*g.res;if(freeAt(l,x,z))c.push([l,x,z]);}
  return c.length?c[(Math.random()*c.length)|0]:null;}
 function convertir(a,role,extra){a.role=role;a.v0b=a.v0b||a.v0;a.staff=!!ROLES[role].staff;a.hold=!!ROLES[role].staff;a.goal=-1;a.jr=[];a.last=null;a.live=true;a.entered=true;a.post={k:-1,txt:''};
  a.hes=0;a.stopT=0;if(a.staff){a.pre=-1e4;}Object.assign(a,extra||{});return a;}
 function pickNear(l,x,z,pred){let b=null,bd=1e18;for(let i=0;i<SIM.A.length;i++){const a=SIM.A[i];if(a.role||a.out||a.ride||a.l!==l||a.kind==='cine'&&pred!=='any')continue;const d=(a.x-x)**2+(a.z-z)**2;if(d<bd){bd=d;b=i;}}return b;}
 function install(){
  const A=SIM.A;ctx.A=A;ctx.idx=[];ctx.ORD=[];ctx.journalPC=[];ctx.nextBrain=0;ctx.n={};A.forEach(a=>{a.v0b=a.v0;});
  const sc=CFG.echelle,N=r=>r==='dir'||r==='chef'?CFG.n[r]:Math.max(CFG.n[r]?1:0,Math.round(CFG.n[r]*sc));
  const rue=SIM.groups.map((g,k)=>({g,k})).filter(o=>o.g.type==='rue');
  let seq=0;const nom=(r)=>{ctx.n[r]=(ctx.n[r]||0)+1;return ROLES[r].nom+(N(r)>1?' '+ctx.n[r]:'');};
  const reg=(i,r,post)=>{const a=A[i];ctx.idx.push(i);a.rid='P'+p2(++seq);a.nom=nom(r);if(post){a.post=post;}return a;};
  const poser=(k,fmin,fmax,role,txt)=>{const c=celluleProche(k,fmin,fmax);if(!c)return false;const i=pickNear(c[0],c[1],c[2]);if(i==null)return false;const a=A[i];
   convertir(a,role);a.l=c[0];a.x=c[1];a.z=c[2];a.vx=a.vz=0;reg(i,role,{k,txt});a.post.txt=txt;return true;};
  // SSIAP : aux portes de rue hors zone d'abord, puis aux issues de secours (carrefours)
  const hors=rue.filter(o=>!/Berger|Rambuteau|Rivoli/.test(o.g.n)),seco=SIM.groups.map((g,k)=>({g,k})).filter(o=>o.g.type==='secours');
  const postes=[...hors,...rue.filter(o=>/Rivoli/.test(o.g.n)),...seco,...hors];
  for(let j=0,n=0;n<N('ssiap')&&j<postes.length*2;j++){const o=postes[j%postes.length];if(poser(o.k,4,8,'ssiap','poste à '+o.g.n))n++;}
  // policiers : au barrage, à l'intérieur des portes touchées par le couvre-feu (Berger, Rambuteau)
  const zr=rue.filter(o=>/Berger|Rambuteau/.test(o.g.n));for(let j=0,n=0;n<N('pn')&&j<6;j++){const o=zr[j%Math.max(1,zr.length)];if(o&&poser(o.k,5,9,'pn','barrage à '+o.g.n))n++;}
  // RATP : aux accès des quais (trois noms de quai différents)
  const T=SIM.groups.findIndex(g=>g.type==='train');if(T>=0){const noms=[...new Set(G(T).cells.map(c=>c.label||c.n))];
   for(let j=0,n=0;n<N('ratp')&&j<8;j++){const e=G(T).cells[(j*3)%G(T).cells.length].cell;const c=[];const g=SIM.g;
    for(let dr=-10;dr<=10;dr++)for(let dc=-10;dc<=10;dc++){const r=e[1]+dr,cc=e[2]+dc;if(r<0||cc<0||r>=g.h||cc>=g.w)continue;const i=e[0]*SIM.N+r*g.w+cc;if(!SIM.walk[i])continue;const x=g.bbox[0]+(cc+.5)*g.res,z=g.bbox[1]+(r+.5)*g.res;if(freeAt(e[0],x,z)&&Math.hypot(dr,dc)>3)c.push([e[0],x,z]);}
    if(!c.length)continue;const q=c[(Math.random()*c.length)|0],i=pickNear(q[0],q[1],q[2]);if(i==null)continue;const a=A[i];convertir(a,'ratp');a.l=q[0];a.x=q[1];a.z=q[2];a.vx=a.vz=0;reg(i,'ratp',{k:T,txt:'accès quais'});n++;}}
  // PC : directeur et chef de poste, au niveau 0 près du centre du Forum, immobiles
  const l0=Math.max(0,SIM.g.levels.indexOf(0));['dir','chef'].forEach(r=>{for(let n=0;n<N(r);n++){const i=pickNear(l0,FORUM[0]+(n?3:-3),FORUM[1]);if(i==null)return;convertir(A[i],r);reg(i,r,{k:-1,txt:'PC sécurité'});}});
  // pompiers : hors du bâtiment (a.out) jusqu'à leur arrivée
  for(let n=0;n<N('bspp');n++){const cand=A.findIndex(a=>!a.role&&!a.out&&!a.ride&&a.kind!=='cine');if(cand<0)break;const a=A[cand];convertir(a,'bspp');a.out=true;a.entered=false;a.live=false;a.hold=true;reg(cand,'bspp',{k:-1,txt:'extérieur'});a.slot=n;}
  // influents : n'importe où dans la foule
  const libre=()=>{const L=[];for(let i=0;i<A.length;i++){const a=A[i];if(!a.role&&!a.out&&!a.ride&&a.kind==='client')L.push(i);}return L[(Math.random()*L.length)|0];};
  const prox=(i,r,k)=>{const a=A[i],o=[];for(let j=0;j<A.length;j++){const b=A[j];if(b.role||b.out||b.ride||b.l!==a.l||j===i)continue;const d=dist(a,b);if(d<r)o.push([d,j]);}return o.sort((x,y)=>x[0]-y[0]).slice(0,k).map(x=>x[1]);};
  for(let n=0;n<N('meneur');n++){const i=libre();if(i==null)break;const mem=prox(i,7,10);convertir(A[i],'meneur',{members:mem});mem.forEach(j=>{A[j].lead=i;});reg(i,'meneur',{k:-1,txt:'groupe de '+(mem.length+1)});}
  for(let n=0;n<N('panique');n++){const i=libre();if(i==null)break;convertir(A[i],'panique');reg(i,'panique',{k:-1,txt:''});}
  for(let n=0;n<N('parent');n++){const i=libre();if(i==null)break;convertir(A[i],'parent');reg(i,'parent',{k:-1,txt:''});}
  for(let n=0;n<N('filme');n++){const i=libre();if(i==null)break;convertir(A[i],'filme',{filmant:true});reg(i,'filme',{k:-1,txt:''});}
  for(let n=0;n<N('pmr');n++){const i=libre();if(i==null)break;const b=prox(i,5,1)[0];convertir(A[i],'pmr');A[i].v0=A[i].v0b=.6;
   if(b!=null){convertir(A[b],'accomp',{buddy:i});A[b].v0=A[b].v0b=.6;A[i].buddy=b;reg(i,'pmr',{k:-1,txt:'v = 0,6 m/s'});reg(b,'accomp',{k:-1,txt:'avec PMR'});}else reg(i,'pmr',{k:-1,txt:''});}
  // le directeur sert de sonde : un plan (copie de SIM.A) garde les mêmes indices
  const d=ctx.idx.find(i=>A[i].role==='chef'||A[i].role==='dir');ctx.probe=d==null?ctx.idx[0]:d;ctx.probeRole=ctx.probe==null?null:A[ctx.probe].role;
  A.forEach(a=>{if(a.role&&(a.role==='meneur'||a.role==='panique'||a.role==='parent'||a.role==='filme'||a.role==='pmr'||a.role==='accomp')){}});
  majPanneau();}
 const memeMonde=()=>SIM.A&&((SIM.A===ctx.A)||(ctx.probe>=0&&SIM.A[ctx.probe]&&SIM.A[ctx.probe].role===ctx.probeRole));
 const vivant=()=>SIM.A===ctx.A;

 // ---------- boucle : avant et après chaque pas de sim.js ----------
 function avant(){const A=SIM.A,evac=SIM.mode==='evac';
  for(const i of ctx.idx){const a=A[i];if(!a)continue;
   if(a.role==='bspp'&&!a.entered){if(evac&&SIM.T>=CFG.delaiBSPP)entrer(a);continue;}
   if(a.out)continue;
   if(!evac){if(a.staff)a.stopT=1e9;continue;}
   if(a.staff||a.role==='parent'||a.role==='pmr'||a.role==='accomp'||a.role==='panique'||a.role==='meneur'||a.role==='filme'){
    if(a.goal>=0){const g=G(a.goal);const f=dM(a.goal,a);
     if(!g.open){a.goal=-1;a.next=0;if(a.staff||ROLES[a.role].arret)a.hold=true;}
     else if((a.staff||ROLES[a.role].arret)&&f<4){a.goal=-1;a.hold=true;a.post={k:a.goal0!=null?a.goal0:a.post.k,txt:'à '+nomG(a.goal0)};}
     else{a.t=a.goal;a.next=1e9;a.hold=false;a.hes=Math.min(a.hes,0);}}
    if(a.role==='filme'&&a.filmant){a.hold=true;}else if(a.role==='filme'&&a.goal<0){a.hold=false;}
    if(a.role==='accomp'){const p=A[a.buddy];if(p&&!p.out&&dist(a,p)>2.5)a.hes=Math.max(a.hes,.3);else if(p&&p.t>=0){a.t=p.t;a.next=SIM.T+8;}}
    if(a.hold){a.hes=Math.max(a.hes,.5);}}
  }}
 function entrer(a){const rue=SIM.groups.map((g,k)=>({g,k})).filter(o=>o.g.type==='rue'&&!mauvaise(o.k));const o=rue[a.slot%Math.max(1,rue.length)];if(!o)return;
  const e=o.g.cells[0].cell,c=celluleProche(o.k,2,5)||[e[0],SIM.g.bbox[0]+(e[2]+.5)*SIM.g.res,SIM.g.bbox[1]+(e[1]+.5)*SIM.g.res];
  a.l=c[0];a.x=c[1];a.z=c[2];a.vx=a.vz=0;a.out=false;a.entered=true;a.live=true;a.hold=true;a.post={k:o.k,txt:'arrivé par '+o.g.n};a.pre=-1e4;a.hes=0;
  journaliser(a,{action:'attendre',cible:'',raison:'arrive sur place par '+o.g.n+' (délai d\'intervention estimé)',src:'moteur'},'entre dans le Forum');}
 function apres(){const A=SIM.A;
  for(const i of ctx.idx){const a=A[i];if(!a||!a.live)continue;
   if(a.out){ // un personnage ne « sort » pas : il reste au poste
    a.out=false;SIM.out--;if(a.t>=0){const n=G(a.t).n;if(SIM.outBy[n])SIM.outBy[n]--;if(G(a.t).zone)SIM.zoneOut--;}if(a.staff||ROLES[a.role].arret){a.hold=true;a.goal=-1;}}}
  if(SIM.mode==='evac'&&SIM.T-(ctx.eT||0)>=.5){ctx.eT=SIM.T;effets();}
  if(vivant()&&SIM.mode==='evac'&&SIM.T>=ctx.nextBrain)cycle();
  ctx.lastMode=SIM.mode;}

 // ---------- effets continus des influents (toutes les 0,5 s simulées) ----------
 function voisins(a,r,f){for(const b of SIM.A){if(b===a||b.out||b.ride||b.l!==a.l||b.role)continue;const dx=b.x-a.x;if(dx>r||dx<-r)continue;const d=Math.hypot(dx,b.z-a.z);if(d<r)f(b,d);}}
 function effets(){const A=SIM.A;
  for(const b of A){if(b._vf){b.v0=b.v0b;b._vf=0;}}
  for(const i of ctx.idx){const a=A[i];if(!a||a.out||a.ride||!a.live)continue;
   if(a.role==='panique'){a.v0=a.v0b*1.3; // une personne qui court : voisins plus rapides (×1,2, estimé) et qui hésitent plus
    voisins(a,8,(b)=>{b.v0=b.v0b*1.2;b._vf=1;if(b.t>=0&&Math.random()<.03)b.hes=Math.max(b.hes,1.5+Math.random()*2);});}
   else if(a.role==='filme'){if(a.filmant)voisins(a,4,b=>{b.v0=Math.min(b.v0,b.v0b*.8);b._vf=1;});
    else if(a.goal<0&&a.last&&a.last.action==='deplacer'){}}
   else if(a.role==='meneur'){const lead=a;if(a.t>=0&&SIM.T>=a.pre+SIM.delay)for(const j of a.members){const m=A[j];if(!m||m.out||m.ride||m.role||dist(m,a)>14)continue;m.t=a.t;m.hes=0;m.next=SIM.T+10;m.pre=Math.min(m.pre,a.pre);}}
  }}

 // ---------- perception ----------
 const NOMLV=l=>l.nom||l.type;
 function percevoir(a){const A=SIM.A,i=simCell(a),lv=lvOf(a);let n=0;const vis={};
  for(const b of A){if(b===a||b.out||b.ride||b.l!==a.l||b.role&&b.staff)continue;const dx=b.x-a.x;if(dx>15||dx<-15)continue;if(Math.hypot(dx,b.z-a.z)>15)continue;n++;if(b.t>=0){const nm=nomG(b.t);vis[nm]=(vis[nm]||0)+1;}}
  let dn=0;voisins(a,3,()=>dn++);const dens=Math.round(dn/(Math.PI*9)*10)/10;
  const px=a.x,pz=a.z;const proches=LEV.filter(l=>l.type!=='incendie'&&Math.abs(l.niveau-lv)<=1).map(l=>({l,d:Math.hypot(l.x-px,l.z-pz)})).sort((x,y)=>x.d-y.d);
  const lieu=proches.length?`près de ${NOMLV(proches[0].l)} (${Math.round(proches[0].d)} m)`:'dans le Forum';
  const etat=k=>{const g=G(k);return !g.open?'fermée':g.zone||zoneDoor(k)?'en zone':g.filtre?'filtrée':'ouverte';};
  const sorties=SIM.groups.map((g,k)=>({nom:g.n,etat:etat(k),distance:Math.round(dM(k,a)>=1e9?9999:dM(k,a))})).sort((x,y)=>x.distance-y.distance);
  const portes=LEV.filter(l=>l.type==='porte').map(l=>({nom:l.nom,etat:etat(l.grp),distance:Math.round(Math.hypot(l.x-px,l.z-pz))})).sort((x,y)=>x.distance-y.distance).slice(0,4);
  const issues=LEV.filter(l=>l.type==='issue').map(l=>({nom:l.nom,etat:G(l.grp).cells.includes(l.cellRef)?'ouverte':'fermée',distance:Math.round(Math.hypot(l.x-px,l.z-pz))})).sort((x,y)=>x.distance-y.distance).slice(0,3);
  const lieux=[...new Set([...proches.slice(0,5).map(o=>NOMLV(o.l)),...sorties.slice(0,4).map(s=>s.nom)])];
  const zones=ZONES.map(Z=>{const dp=LEV.filter(l=>l.type==='porte').sort((x,y)=>Math.hypot(x.x-Z.x,x.z-Z.z)-Math.hypot(y.x-Z.x,y.z-Z.z))[0];return {code:Z.code,lieu:dp?'près de '+dp.nom:'rue',distance:Math.round(Math.max(0,Math.hypot(Z.x-px,Z.z-pz)-Z.r))};});
  const ordres=ctx.ORD.filter(o=>SIM.T-o.T<300).slice(-3).map(o=>`${tt(o.T)} ${o.de} : ${o.texte}`);
  const alertes=window.alertes&&window.alertes.actives?[...window.alertes.actives.values()].slice(0,3).map(x=>String(x.txt||'')).filter(Boolean):[];
  return {niveau:lv,lieu,densite:dens,foule_15m:{n,visent:vis},sorties,portes,issues,lieux,zones,ordres,alertes};}

 // ---------- règles par rôle (secours du cerveau, et défaut sans clé) ----------
 const D=(action,cible,message,raison)=>({action,cible:cible||'',message:message||'',raison});
 function regles(a){const evac=SIM.mode==='evac';
  const k0=a.post&&a.post.k>=0?a.post.k:-1;
  const ordre=ctx.ORD.filter(o=>SIM.T-o.T<300&&o.k>=0&&G(o.k).open).slice(-1)[0];
  const proches=[];voisins(a,10,b=>proches.push(b));
  const nonDep=[];voisins(a,15,b=>{if(SIM.T<b.pre+SIM.delay)nonDep.push(b);});
  const cible=()=>{const b=meilleure(a,true);if(ordre&&!mauvaise(ordre.k)){const d=dM(ordre.k,a);if(d<1e9&&(b<0||d<dM(b,a)+60))return ordre.k;}return b;};
  switch(a.role){
   case 'chef':{if(!evac)return D('attendre','','','pas d\'alerte en cours, surveille les écrans');
    const k=meilleure(a,true);const L=ctx.loads||loads();
    const dernier=ctx.ORD.slice(-1)[0];
    if(k>=0&&(!dernier||dernier.k!==k||SIM.T-dernier.T>90||mauvaise(dernier.k)))return D('guider',nomG(k),'Évacuer vers '+nomG(k),`sortie ouverte, hors zone, la moins chargée (${L[k]} visent déjà cette sortie)`);
    const T=SIM.groups.find(g=>g.type==='train');if(T&&!T.open&&!a.alerteRATP&&SIM.A.filter(b=>!b.out&&!b.role&&b.l>=SIM.g.levels.indexOf(-4)).length>30){a.alerteRATP=1;return D('appeler_pc','','Stations fermées avec du monde sur les quais : demander à la RATP de rouvrir un accès','quais pleins, stations fermées');}
    for(const l of LEV){if(l.type==='porte'&&l.etat!=='fermé'&&G(l.grp).open&&ZONES.some(Z=>Math.hypot(l.x-Z.x,l.z-Z.z)<Z.r+10)&&SIM.A.some(b=>!b.out&&b.t===l.grp&&!b.role))return D('bloquer',l.nom,'','porte dans la zone, des personnes s\'y dirigent');}
    return D('attendre','','','ordres déjà donnés, suit l\'évolution');}
   case 'dir':{if(!evac)return D('attendre','','','pas d\'alerte en cours');
    if(SIM.T-(a.lastPC||-1e9)>=120){a.lastPC=SIM.T;const r=SIM.A.filter(b=>!b.out&&!b.role).length;return D('appeler_pc','',`Point de situation : ${r} personnes encore dans le centre, ${SIM.out} sorties`,'point de situation toutes les 2 minutes');}
    return D('attendre','','','laisse le chef de poste appliquer les ordres');}
   case 'ssiap':case 'pn':case 'ratp':case 'bspp':{
    if(!evac)return D('attendre','','','pas d\'alerte, tient son poste');
    if(a.role==='pn'){const zl=LEV.find(l=>l.type==='porte'&&l.grp===k0);
     if(zl&&zl.etat!=='fermé'&&G(k0).open&&ZONES.some(Z=>Math.hypot(zl.x-Z.x,zl.z-Z.z)<Z.r+15))return D('bloquer',zl.nom,'','la zone de troubles touche cette porte : barrage');
     if(proches.length){const k=meilleure(a,true);if(k>=0)return D('guider',nomG(k),'Éloignez-vous de la zone',`écarte ${proches.length} personnes de la zone vers ${nomG(k)}`);}
     return D('attendre','','','tient le barrage');}
    if(a.role==='ratp'){const T=SIM.groups.find(g=>g.type==='train');
     if(T&&!T.open&&proches.length){const k=cible();if(k>=0)return D('crier',nomG(k),'Stations fermées, sortez par '+nomG(k),'stations fermées : renvoie le public vers la rue');}
     if(T&&!T.open&&!a.annoncePC){a.annoncePC=1;return D('appeler_pc','','Accès fermés : les quais ne sont plus une sortie','stations fermées, informe le PC');}
     return D('attendre','','',T&&!T.open?'stations fermées, personne à renvoyer près de l\'accès':'accès ouverts, surveille les quais');}
    if(a.role==='bspp'){if(!a.entered)return D('attendre');const z=ZONES[0];const j=a.slot%4;
     if(j===0&&z){const dp=LEV.filter(l=>l.type==='porte').sort((x,y)=>Math.hypot(x.x-z.x,x.z-z.z)-Math.hypot(y.x-z.x,y.z-z.z))[0];
      if(dp&&a.post.k!==dp.grp)return D('deplacer',dp.nom,'','va à la zone de troubles, côté '+dp.nom);
      if(dp&&dp.etat!=='fermé'&&G(dp.grp).open)return D('bloquer',dp.nom,'','sécurise la porte touchée par la zone');}
     if(j===2&&SIM.groups.some(g=>g.type==='secours'&&g.open)){const ks=SIM.groups.findIndex(g=>g.type==='secours');if(a.post.k!==ks)return D('deplacer',nomG(ks),'','va aux issues de secours, aide les personnes lentes');}
     const L=ctx.loads||loads();let bk=-1;SIM.groups.forEach((g,k)=>{if(g.open&&g.type==='rue'&&!mauvaise(k)&&(bk<0||L[k]>L[bk]))bk=k;});
     if(bk>=0&&a.post.k!==bk)return D('deplacer',nomG(bk),'','rejoint la sortie la plus chargée ('+L[bk]+' personnes)');
     if(proches.length){const k=meilleure(a,true,a.post.k);if(k>=0)return D('guider',nomG(k),'Répartissez-vous : sortie '+nomG(k),'étale le flux vers une sortie moins chargée');}
     return D('attendre','','','en position');}
    // ssiap
    if(k0>=0&&G(k0).type==='rue'&&mauvaise(k0)){const k=meilleure(a,true);if(k>=0&&k!==k0)return D('deplacer',nomG(k),'',`son poste (${nomG(k0)}) est fermé ou en zone : se redéploie`);}
    const k=cible();if(k<0)return D('attendre','','','aucune sortie utilisable depuis ici');
    if(nonDep.length>=3)return D('crier',nomG(k),'Évacuation, sortez par '+nomG(k),`${nonDep.length} personnes n'ont pas encore réagi à moins de 15 m`);
    if(proches.length)return D('guider',nomG(k),'',ordre?`applique l'ordre du PC : ${nomG(k)}`:`${proches.length} personnes à guider vers la sortie ouverte la moins chargée`);
    return D('attendre','','','personne à guider près du poste');}
   case 'meneur':{if(!evac)return D('attendre');const k=meilleure(a,true);return k<0?D('attendre'):D('guider',nomG(k),'On y va, suivez-moi',`mène son groupe (${a.members.length} personnes) vers ${nomG(k)}`);}
   case 'panique':{if(!evac)return D('attendre');const k=meilleure(a,true,-1);
    if(SIM.T<a.pre+SIM.delay+1)return D('crier','','Sortez, sortez !','panique, crie avant de partir');
    if(a.goal<0&&k>=0)return D('deplacer',nomG(k),'','court vers la sortie la plus proche');
    return SIM.T-(a.lastCri||-1e9)>20&&SIM.T<400?(a.lastCri=SIM.T,D('crier','','Vite, vite !','crie en courant (panique localisée)')):D('attendre','','','court vers la sortie');}
   case 'parent':{if(!evac)return D('attendre');const T=SIM.groups.findIndex(g=>g.type==='train');let k=T>=0&&G(T).open?T:-1;
    if(k<0){let bd=-1;SIM.groups.forEach((g,j)=>{if(g.open&&g.type==='rue'){const d=dM(j,a);if(d<1e9&&d>bd){bd=d;k=j;}}});}
    return a.post.k===k||k<0?D('attendre','','','attend, cherche son enfant du regard'):D('deplacer',nomG(k),'','remonte le flux : cherche son enfant resté vers les salles de cinéma');}
   case 'filme':{if(!evac)return D('attendre');if(SIM.T<150)return D('attendre','','','filme la scène, ralentit les passants');const k=meilleure(a,true);
    return k>=0?D('deplacer',nomG(k),'','range son téléphone et part'):D('attendre');}
   case 'pmr':{if(!evac)return D('attendre');const k=meilleure(a,true);return a.goal<0&&k>=0&&SIM.T>=a.pre+SIM.delay?D('deplacer',nomG(k),'','se dirige lentement vers la sortie (0,6 m/s)'):D('attendre');}
   case 'accomp':return D('attendre','','','reste avec la personne qu\'il accompagne');}
  return D('attendre');}

 // ---------- cible nommée -> groupe ----------
 function resoudre(nom){if(!nom)return -1;const n=norm(nom);let k=SIM.groups.findIndex(g=>norm(g.n)===n);if(k>=0)return k;
  const L=LEV.find(l=>norm(l.nom)===n)||LEV.find(l=>norm(l.nom).includes(n)||n.includes(norm(l.nom)));
  if(L){if(L.grp!=null)return L.grp;if(L.type==='bouche')return SIM.groups.findIndex(g=>g.type==='train');}
  k=SIM.groups.findIndex(g=>norm(g.n).includes(n)||n.includes(norm(g.n)));return k;}
 function levDe(nom){const n=norm(nom);return LEV.find(l=>(l.type==='porte'||l.type==='issue'||l.type==='ascenseur')&&norm(l.nom)===n)||LEV.find(l=>l.type==='porte'&&G(l.grp)&&norm(G(l.grp).n)===n)||LEV.find(l=>(l.type==='porte'||l.type==='issue')&&norm(l.nom).includes(n));}

 // ---------- effets des actions ----------
 function guider(a,k,msg){const g=G(k);if(!g||!g.open)return 'sortie fermée : sans effet';
  const p=Math.min(1,CFG.obeir*(OBEI_ROLE[a.role]||1));let tot=0,ok=0;
  voisins(a,10,b=>{tot++;if(dM(k,b)>=1e9)return;if(b.obeyK===k&&SIM.T-b.obeyT<30)return;if(Math.random()<p||(a.role==='meneur'&&a.members.includes(SIM.A.indexOf(b)))){b.t=k;b.hes=0;b.next=SIM.T+30;b.obeyK=k;b.obeyT=SIM.T;ok++;}});
  if(a.role==='meneur'){a.goal=k;a.hold=false;}
  return `${tot} personnes à moins de 10 m, ${ok} prennent la cible (obéissance ${Math.round(p*100)} %, estimée)`;}
 function crier(a,k,msg){let n=0,ch=0;
  voisins(a,15,b=>{if(SIM.T<b.pre+SIM.delay){b.pre=Math.min(b.pre,SIM.T-SIM.delay+ll(8,3));n++;}
   if(k>=0&&G(k).open&&dM(k,b)<1e9&&Math.random()<.4*(OBEI_ROLE[a.role]||1)){b.t=k;b.hes=0;b.next=SIM.T+20;ch++;}});
  return `${n} personnes voient leur départ avancé, ${ch} changent de cible (rayon 15 m)`;}
 function bloquer(a,nom){if(!a.staff||a.role==='ratp')return 'refusé : action réservée à la sécurité, aux pompiers et à la police';const L=levDe(nom);if(!L)return 'refusé : passage inconnu';
  if(L.etat==='fermé')return 'déjà fermé';
  const reste=LEV.filter(l=>l.type==='porte'&&l!==L&&G(l.grp).open&&!G(l.grp).zone&&!zoneDoor(l.grp)).length;
  if(L.type==='porte'&&reste<2)return 'refusé par le moteur : il resterait moins de 2 sorties utilisables';
  levAction(L.id,'fermer');return L.nom+' fermée';}
 function ouvrir(a,nom){if(!a.staff)return 'refusé : réservé au personnel';const L=levDe(nom)||LEV.find(l=>l.type==='bouche'&&l.etat==='fermé'&&a.role==='ratp');if(!L)return 'refusé : passage inconnu';
  if(L.etat!=='fermé')return 'déjà ouvert';levAction(L.id,'ouvrir');return L.nom+' rouverte';}
 function deplacer(a,nom){const k=resoudre(nom);if(a.fixe||ROLES[a.role].fixe)return 'non mobile (reste au PC)';if(k<0)return 'refusé : lieu inconnu';if(!G(k).open)return 'refusé : sortie fermée';
  if(!a.entered)return 'pas encore arrivé';a.goal=k;a.goal0=k;a.hold=false;if(a.role==='filme')a.filmant=false;return 'se met en route vers '+nomG(k)+' ('+Math.round(dM(k,a))+' m)';}
 function appelerPC(a,msg){const key=a.rid+msg;if(a.lastMsg===key&&SIM.T-a.lastMsgT<60)return 'message déjà transmis';a.lastMsg=key;a.lastMsgT=SIM.T;
  const L=document.getElementById('dirLog');if(L){const d=document.createElement('div');d.style.cssText='margin:0 0 8px;border-left:3px solid '+ROLES[a.role].css+';padding-left:6px';d.innerHTML=`<b>${a.nom}</b> · ${tt(SIM.T)} · ${msg}`;L.prepend(d);}
  ctx.journalPC.push({T:SIM.T,de:a.nom,texte:msg});return 'message au journal du directeur';}
 function relais(a,d){ // le PC n'est pas mobile : ses « actions » sont des ordres et des annonces
  const k=resoudre(d.cible);
  if(d.action==='guider'||d.action==='crier'){if(k<0)return 'refusé : sortie inconnue';ctx.ORD.push({T:SIM.T,de:a.nom,texte:d.message||('Évacuer vers '+nomG(k)),k});
   const L=porteDe(k);if(L&&!L.annonce&&G(k).open)levAction(L.id,'annonce');return `ordre diffusé aux agents : ${nomG(k)}${L?' ; annonce de sonorisation vers cette sortie':''}`;}
  return null;}
 const FX={deplacer,guider,crier,bloquer,ouvrir,appeler_pc:appelerPC};

 function appliquer(a,d,src){if(!a||a.out&&a.entered||!a.live&&a.entered===false)return;
  let dec=d;
  if(!dec||!ACTIONS.includes(dec.action)){dec=regles(a);src='règles';}
  let eff='';const cible=dec.cible||'';
  try{
   if(a.fixe||ROLES[a.role].fixe){const r=relais(a,dec);eff=r!=null?r:dec.action==='bloquer'||dec.action==='ouvrir'?FX[dec.action](a,cible):dec.action==='appeler_pc'?appelerPC(a,dec.message||dec.raison):dec.action==='deplacer'?deplacer(a,cible):'';}
   else if(dec.action==='guider'){const k=resoudre(cible);eff=k<0?'refusé : sortie inconnue':guider(a,k,dec.message);}
   else if(dec.action==='crier'){const k=resoudre(cible);eff=crier(a,k,dec.message);}
   else if(dec.action==='attendre'){eff='';}
   else eff=FX[dec.action](a,cible||dec.message,dec.message);
  }catch(x){eff='erreur : '+x.message;}
  if(/^refus/.test(eff)&&src!=='règles'){ // décision refusée par le validateur : on joue la règle du rôle
   const r=regles(a);journaliser(a,{...dec,src},eff);dec=r;src='règles (repli)';try{const c=dec.cible||'';eff=a.fixe?(relais(a,dec)||''):dec.action==='guider'?guider(a,resoudre(c)):dec.action==='crier'?crier(a,resoudre(c)):dec.action==='attendre'?'':FX[dec.action](a,c||dec.message,dec.message);}catch(x){eff='erreur';}}
  journaliser(a,{...dec,src},eff);}
 function journaliser(a,d,eff){const e={T:SIM.T,action:d.action,cible:d.cible||'',message:d.message||'',raison:d.raison||'',src:d.src||'règles',effet:eff||''};a.last=e;a.jr.push(e);if(a.jr.length>40)a.jr.shift();}

 // ---------- cycle de décision ----------
 function cycle(){ctx.nextBrain=SIM.T+CFG.cadence;if(ctx.pending&&performance.now()-ctx.pendT<12000)return;
  ctx.loads=loads();
  const ids=ctx.idx.filter(i=>{const a=SIM.A[i];return a&&a.live&&!a.out;});
  const lot={T:Math.round(SIM.T),agents:ids.map(i=>{const a=SIM.A[i];return {id:a.rid,role:a.role,perception:percevoir(a)};})};
  const parId={};ids.forEach(i=>{parId[SIM.A[i].rid]=i;});
  const A0=SIM.A;
  const jouer=(res,src)=>{if(SIM.A!==A0)return;const dec={};(res&&res.decisions||[]).forEach(d=>{if(d&&d.id)dec[d.id]=d;});
   ctx.loads=loads();
   // les ordres du PC d'abord, pour que les agents suivants les voient
   const ordre=ids.slice().sort((x,y)=>(SIM.A[y].fixe?1:0)-(SIM.A[x].fixe?1:0));
   ordre.forEach(i=>{const a=SIM.A[i];if(!a||a.out)return;const d=dec[a.rid];if(d){ctx.srcN[src]++;appliquer(a,{action:d.action,cible:d.cible,message:d.message,raison:d.raison},src);}else{ctx.srcN.regles++;appliquer(a,regles(a),'règles');}});
   majPanneau();};
  const c=window.cerveau;
  if(c&&typeof c.decider==='function'){ctx.pending=true;ctx.pendT=performance.now();ctx.appels++;
   const mode=()=>{try{return c.etat&&c.etat().mode==='cache'?'cache':'claude';}catch(e){return 'claude';}};
   Promise.race([Promise.resolve(c.decider(lot)),new Promise((_,r)=>setTimeout(()=>r(new Error('délai')),10000))])
    .then(r=>{jouer(r,(r&&r.decisions&&r.decisions.length)?mode():'regles');}).catch(()=>jouer({decisions:[]},'regles')).finally(()=>{ctx.pending=false;});}
  else jouer({decisions:[]},'regles');}

 // ---------- enveloppes ----------
 const oStep=window.simStep;
 window.simStep=function(dt){
  if(!CFG.actif||!SIM.A||!SIM.groups||!SIM.F||typeof LEV==='undefined'||!LEV.length||(typeof ZONES==='undefined'))return oStep.apply(this,arguments);
  if(!memeMonde()){install();}
  avant();const r=oStep.apply(this,arguments);try{apres();}catch(x){console.warn('agents',x);}return r;};
 const oAlert=window.simAlert;
 if(typeof oAlert==='function')window.simAlert=function(){const r=oAlert.apply(this,arguments);
  if(SIM.A&&ctx.A===SIM.A)for(const i of ctx.idx){const a=SIM.A[i];if(!a)continue;a.ride=null;
   if(a.staff)a.pre=-1e4;else if(a.role==='panique')a.pre=Math.min(a.pre,2+Math.random()*4);else if(a.role==='filme')a.pre+=20;
   else if(a.role==='meneur')for(const j of a.members){if(SIM.A[j])SIM.A[j].pre=a.pre;}
   else if(a.role==='accomp'&&SIM.A[a.buddy])a.pre=SIM.A[a.buddy].pre;}
  ctx.nextBrain=0;ctx.ORD=[];return r;};

 // ---------- rendu : couleur, taille, étiquette ----------
 const ETQ={};let spr=null;
 function etiq(role){if(ETQ[role])return ETQ[role];const R=ROLES[role],c=document.createElement('canvas'),x=c.getContext('2d');x.font='700 30px ui-monospace,Menlo,monospace';
  const w=Math.ceil(x.measureText(R.court).width)+22;c.width=w;c.height=44;x.font='700 30px ui-monospace,Menlo,monospace';x.fillStyle=R.css;x.fillRect(0,0,w,44);
  x.fillStyle='#fff';x.textBaseline='middle';x.fillText(R.court,11,24);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  return ETQ[role]={mat:new THREE.SpriteMaterial({map:t,sizeAttenuation:false,depthTest:false,transparent:true}),w};}
 const M4=typeof THREE!=='undefined'?new THREE.Matrix4():null,C4=typeof THREE!=='undefined'?new THREE.Color():null;
 function habiller(){if(!SIM.A||SIM.A!==ctx.A||typeof silBody==='undefined'||!silBody)return;
  if(!spr){spr=new THREE.Group();scene.add(spr);}
  const show=l=>lvSel==='all'||Math.round(l)===+lvSel;
  for(const i of ctx.idx){const a=SIM.A[i];if(!a)continue;
   if(!a.spr){const e=etiq(a.role),s=new THREE.Sprite(e.mat);s.scale.set(.016*e.w/44,.016,1);s.renderOrder=22;s.userData.i=i;spr.add(s);a.spr=s;}
   const lv=lvOf(a),vis=!a.out&&a.live&&show(lv)&&!a.ride;a.spr.visible=vis;
   if(vis){a.spr.position.set(a.x,alt(lv)+2.3,a.z);
    if(i<silBody.instanceMatrix.count){silBody.getMatrixAt(i,M4);M4.scale(SV.set(1.25,1.12,1.25));silBody.setMatrixAt(i,M4);silHead.setMatrixAt(i,M4);
     if(typeof S!=='undefined'&&S!=='A'){C4.set(ROLES[a.role].col);silBody.setColorAt(i,C4);}}}}
  silBody.instanceMatrix.needsUpdate=silHead.instanceMatrix.needsUpdate=true;if(silBody.instanceColor)silBody.instanceColor.needsUpdate=true;}
 const oDraw=window.simDraw;
 if(typeof oDraw==='function')window.simDraw=function(){const r=oDraw.apply(this,arguments);try{if(CFG.actif)habiller();}catch(x){console.warn('agents habiller',x);}return r;};

 // ---------- fiche : on complète le panneau de individu.js ----------
 const st=document.createElement('style');st.textContent=`#agBox{border-top:1px solid var(--line);margin-top:6px;padding-top:6px}#agBox .j{padding:2px 0;border-top:1px solid var(--line);font-size:11px}
 #agBox .t{display:inline-block;color:#fff;font-size:10px;padding:0 5px;border-radius:3px;letter-spacing:.04em}body.agRole #indP .cs,body.agRole #indP .bt,body.agRole #indP .ip{display:none}
 #agList .l{cursor:pointer;padding:1px 0;font-size:11px}#agList .l:hover{color:var(--acc)}`;document.head.appendChild(st);
 function fiche(){const P=document.getElementById('indP');if(!P||!document.body.classList.contains('indSel')||!window.indiv)return document.body.classList.remove('agRole');
  const a=SIM.A&&SIM.A[window.indiv.sel];if(!a||!a.role||SIM.A!==ctx.A){document.body.classList.remove('agRole');const o=document.getElementById('agBox');if(o)o.remove();return;}
  document.body.classList.add('agRole');const R=ROLES[a.role];const N=document.getElementById('indN');if(N)N.textContent=a.rid+' · '+R.nom.toUpperCase();
  let box=document.getElementById('agBox');if(!box){box=document.createElement('div');box.id='agBox';P.querySelector('.ic').appendChild(box);}
  const l=a.last,rows=document.querySelectorAll('#indRows .r');if(rows[0])rows[0].lastElementChild.textContent=R.nom+(a.post&&a.post.txt?' · '+a.post.txt:'');
  box.innerHTML=`<span class="t" style="background:${R.css}">${R.court}</span> <b>${a.nom}</b>${a.live?'':' · pas encore arrivé (délai estimé '+Math.round(CFG.delaiBSPP/60)+' min)'}
   <div style="margin-top:4px"><span class="m">Dernière action</span> ${l?`<b>${l.action}${l.cible?' → '+l.cible:''}</b> (${tt(l.T)}, ${l.src})`:'aucune'}</div>
   <div><span class="m">Raison</span> ${l?l.raison||'—':'—'}</div>${l&&l.message?`<div><span class="m">Message</span> « ${l.message} »</div>`:''}${l&&l.effet?`<div><span class="m">Effet sur la foule</span> ${l.effet}</div>`:''}
   <div class="m" style="margin-top:6px">Journal des décisions</div>${a.jr.slice(-8).reverse().map(e=>`<div class="j">${tt(e.T)} · <b>${e.action}</b>${e.cible?' → '+e.cible:''} · ${e.raison||''}<span class="m"> [${e.src}]</span>${e.effet?'<br><span class="m">'+e.effet+'</span>':''}</div>`).join('')||'<div class="j m">pas encore de décision</div>'}
   <div class="m" style="margin-top:6px">Ce personnage simule un rôle plausible, il ne prédit pas une personne réelle.</div>`;}
 setInterval(()=>{try{fiche();}catch(x){}},400);

 // ---------- panneau de réglage (colonne de gauche) ----------
 function majPanneau(){const el=document.getElementById('agStat');if(!el)return;
  const c=window.cerveau&&window.cerveau.etat?window.cerveau.etat():null;const nb={};ctx.idx.forEach(i=>{const a=SIM.A[i];if(a)nb[a.role]=(nb[a.role]||0)+1;});
  el.innerHTML=`${ctx.idx.length} personnages (sur ${SIM.A.length} silhouettes) · cerveau : <b>${c?c.mode:'règles locales'}</b> · décisions Claude ${ctx.srcN.claude}, cache ${ctx.srcN.cache}, règles ${ctx.srcN.regles}`;
  const L=document.getElementById('agList');if(L)L.innerHTML=ctx.idx.map(i=>{const a=SIM.A[i];if(!a)return '';return `<div class="l" data-i="${i}"><span class="t" style="background:${ROLES[a.role].css};color:#fff;font-size:9px;padding:0 4px;border-radius:3px">${ROLES[a.role].court}</span> ${a.nom} · ${a.last?a.last.action+(a.last.cible?' → '+a.last.cible:''):'—'}</div>`;}).join('');}
 function panneau(){const h=[...document.querySelectorAll('#left h2')].find(x=>/Leviers/.test(x.textContent));if(!h||document.getElementById('agPan'))return !!h;
  const d=document.createElement('div');d.id='agPan';d.innerHTML=`<h2>Personnages à rôle</h2>
   <label><input type="checkbox" id="agOn" checked> Personnages actifs (appliqué à « Remettre »)</label>
   <label style="display:block">Effectif <input type="range" id="agEch" min="0.5" max="1.5" step="0.1" value="1"> <span id="agEchV">~30</span></label>
   <label style="display:block">Cadence de décision <input type="range" id="agCad" min="5" max="60" step="5" value="${CFG.cadence}"> <span id="agCadV">${CFG.cadence} s</span></label>
   <label style="display:block">Arrivée des pompiers <input type="range" id="agBs" min="2" max="15" step="1" value="${CFG.delaiBSPP/60}"> <span id="agBsV">${CFG.delaiBSPP/60} min (estimé)</span></label>
   <label style="display:block">Obéissance au guidage <input type="range" id="agOb" min="0.2" max="1" step="0.05" value="${CFG.obeir}"> <span id="agObV">${Math.round(CFG.obeir*100)} % (estimé)</span></label>
   <div id="agStat" class="k" style="font-size:11px;margin-top:4px"></div>
   <details><summary class="k" style="font-size:11px;cursor:pointer">Liste (clic = fiche)</summary><div id="agList"></div></details>
   <div class="k" style="font-size:11px;margin-top:4px">Orange sécurité · rouge pompiers · bleu police · vert RATP · violet individus. Les personnages simulent des rôles plausibles, ils ne prédisent pas des personnes réelles.</div>`;
  h.before(d);const $=id=>document.getElementById(id);
  const tot=()=>Object.values(CFG.n).reduce((s,v)=>s+v,0)-2;
  $('agOn').onchange=e=>{CFG.actif=e.target.checked;};
  $('agEch').oninput=e=>{CFG.echelle=+e.target.value;$('agEchV').textContent='~'+Math.round(tot()*CFG.echelle+2);};
  $('agCad').oninput=e=>{CFG.cadence=+e.target.value;$('agCadV').textContent=CFG.cadence+' s';};
  $('agBs').oninput=e=>{CFG.delaiBSPP=+e.target.value*60;$('agBsV').textContent=e.target.value+' min (estimé)';};
  $('agOb').oninput=e=>{CFG.obeir=+e.target.value;$('agObV').textContent=Math.round(CFG.obeir*100)+' % (estimé)';};
  $('agList').onclick=e=>{const l=e.target.closest('.l');if(!l)return;const i=+l.dataset.i,a=SIM.A[i];if(!a)return;if(window.indiv)window.indiv.select(i);};
  return true;}
 (function w(){if(!panneau())setTimeout(w,300);})();
 window.agents.install=install;window.agents.cycle=cycle;window.agents.regles=regles;window.agents.percevoir=percevoir;window.agents.liste=()=>ctx.idx.map(i=>{const a=SIM.A[i];return {i,id:a.rid,role:a.role,nom:a.nom,live:a.live,out:a.out,l:SIM.g.levels[a.l],post:a.post&&a.post.txt,trois:a.jr.slice(-3).map(e=>`${tt(e.T)} ${e.action}${e.cible?'→'+e.cible:''} [${e.src}] ${e.raison}${e.effet?' ('+e.effet+')':''}`)};});
})();
