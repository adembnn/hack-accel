// Évacuation sur la vraie grille du Forum (navgrid.json, 1 m, niveaux 0 à -5) : cartes de pentes par sortie (Dial),
// départ log-logistique (cinéma, médiane 40,5 s), choix de sortie logit (Lovreglio), suivisme, hésitation devant une issue
// fermée, forces sociales avec glissement le long des murs, escalators et escaliers à débit limité.
// Perturbations posables : sortie fermée, station fermée (quais), escalator arrêté, zone de troubles, annonce tardive.
const SIM={on:false,mode:'calme'};
function b64bits(s,n){const b=atob(s),u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=(b.charCodeAt(i>>3)>>(7-(i&7)))&1;return u;}
async function simLoad(){let g=null;for(let k=0;k<4&&!g;k++){try{g=await fetch('navgrid.json').then(r=>r.json());}catch(e){await new Promise(r=>setTimeout(r,500*(k+1)));}}if(!g)throw new Error('navgrid.json introuvable');const N=g.w*g.h,L=g.levels.length;
 SIM.g=g;SIM.N=N;SIM.L=L;SIM.walk=new Uint8Array(N*L);SIM.reach=new Uint8Array(N*L);
 for(let l=0;l<L;l++){SIM.walk.set(b64bits(g.walk[l],N),l*N);SIM.reach.set(b64bits(g.reach[l],N),l*N);}
 SIM.linkAt=new Map();g.links.forEach((k,i)=>{k.open=true;k.free=[0,0];k.debit=k.k==='escalator'?1.25:k.k==='ascenseur'?(k.debit||.6):2.0; /* ascenseur : débit de navgrid (0,6 pers./s), pas 2,0 */const a=k.a[0]*N+k.a[1]*g.w+k.a[2],b=k.b[0]*N+k.b[1]*g.w+k.b[2];k.ia=a;k.ib=b;
  if(!SIM.linkAt.has(a))SIM.linkAt.set(a,[]);if(!SIM.linkAt.has(b))SIM.linkAt.set(b,[]);SIM.linkAt.get(a).push(i);SIM.linkAt.get(b).push(i);});
 // groupes de sortie : chaque porte de rue, et « train » (tous les quais)
 SIM.groups=[];g.exits.forEach(e=>{if(e.type!=='rue')return;let G=SIM.groups.find(G=>G.n===e.n);if(G)G.cells.push(e);else SIM.groups.push({n:e.n,type:'rue',cells:[e],open:true,zone:/Berger|Rambuteau/.test(e.n)});});
 if(g.exits.some(e=>e.type==='secours'))SIM.groups.push({n:'Issues de secours',type:'secours',cells:g.exits.filter(e=>e.type==='secours'),open:true,zone:false});
 gareGroups();
 SIM.F=SIM.groups.map(()=>new Float32Array(N*L));SIM.groups.forEach((_,k)=>simField(k));gareInit();}
// durée d'un trajet vertical : escalator 0,75 m/s, escalier 0,55 m/s, ascenseur (portes + trajet) ~1,3 m/s équivalent
const rideT=k=>k.len/(k.k==='escalator'?.75:k.k==='ascenseur'?1.3:.55);
const idx3=(l,r,c)=>l*SIM.N+r*SIM.g.w+c;
function simField(k){const f=SIM.F[k];f.fill(1e9);const G=SIM.groups[k];if(!G.open&&G.type!=='train')return;/* le champ des quais reste calculé station fermée : évacuation RATP */distField(f,G.cells.map(e=>idx3(e.cell[0],e.cell[1],e.cell[2])));}
function distField(f,srcs){const g=SIM.g,N=SIM.N;f.fill(1e9);
 const B=16384,buckets=Array.from({length:B},()=>[]);let cnt=0;const push=(i,d)=>{f[i]=d;buckets[Math.round(d)%B].push(i);cnt++;};
 srcs.forEach(i=>push(i,0));
 const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4],[1,-1,1.4],[-1,1,1.4],[-1,-1,1.4]];let cur=0,guard=0;
 while(cnt>0&&guard<5e7){const bk=buckets[cur%B];if(!bk.length){cur++;continue;}const i=bk.pop();cnt--;guard++;const d=f[i];if(Math.round(d)!==cur%B&&Math.round(d)>cur)continue;
  const l=(i/N)|0,rem=i-l*N,r=(rem/g.w)|0,c=rem-r*g.w;
  for(const[dr,dc,w]of NB){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=g.h||cc>=g.w)continue;const j=i+dr*g.w+dc;if(!SIM.walk[j])continue;if(dr&&dc&&(!SIM.walk[i+dr*g.w]||!SIM.walk[i+dc]))continue;const nd=d+w;if(nd<f[j]-1e-3){push(j,nd);}}
  const ls=SIM.linkAt.get(i);if(ls)for(const li of ls){const k2=g.links[li];if(!k2.open)continue;const j=k2.ia===i?k2.ib:k2.ia;const nd=d+k2.len*1.4;if(nd<f[j]-1e-3)push(j,nd);}}}
function ll(med,b){const u=Math.min(.999,Math.max(.001,Math.random()));return med*Math.pow(u/(1-u),1/b);}
function gauss(){return Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.2832*Math.random());}
function simResetCounters(){SIM.T=0;SIM.out=0;SIM.outBy={};SIM.expo=0;SIM.dmax=0;SIM.zoneOut=0;}
// Passe de « calme » (avant l'alerte) à « évacuation » sans déplacer personne : chacun garde sa place, tire son délai de départ
function simAlert(){if(!SIM.A)return;const g=SIM.g,T0=SIM.T;hBuild();SIM.A.forEach(a=>{if(a.ride){const to=a.ride.to;a.l=to[0];a.ride=null;simPlace(a,g.bbox[0]+(to[2]+.5)*g.res,g.bbox[1]+(to[1]+.5)*g.res,null,null);}
 a.st=null;a.t=-1;a.next=0;a.hes=0;a.stopT=0;a.pre=a.kind==='cine'?ll(40.5,3.5):a.kind==='rer'?ll(20,3):ll(30,3.5);});simResetCounters();g.links.forEach(k=>{k.free=[0,0];});SIM.quais.forEach(q=>{q.pend.length=0;q.nextR=0;q.streams.forEach(t=>{t.next=Math.max(0,t.next-T0);});});SIM.gare.sigT=0;SIM.mode='evac';}
function simSpawn(n){const g=SIM.g,N=SIM.N;SIM.A=[];simResetCounters();g.links.forEach(k=>{k.free=[0,0];});
 const ugc=SCN.interieur.filter(o=>/UGC|Cin[ée]/i.test(o.n||''));const inPoly=(x,z)=>ugc.some(o=>pip(x,z,pairs(o.p)));
 const cand=[];for(let l=0;l<SIM.L;l++)for(let r=0;r<g.h;r+=1)for(let c=0;c<g.w;c+=1){const i=l*N+r*g.w+c;if(!SIM.reach[i])continue;const x=g.bbox[0]+(c+.5)*g.res,z=g.bbox[1]+(r+.5)*g.res;cand.push([l,x,z,inPoly(x,z)&&(g.levels[l]===-3||g.levels[l]===-2)]);}
 const cin=cand.filter(c=>c[3]),oth=cand.filter(c=>!c[3]);
 const pick=(arr,k,kind)=>{for(let j=0;j<k&&arr.length;j++){const c=arr[(Math.random()*arr.length)|0];SIM.A.push({l:c[0],x:c[1]+(Math.random()-.5)*.8,z:c[2]+(Math.random()-.5)*.8,vx:0,vz:0,kind,
  v0:Math.max(.7,1.34+.26*gauss()),pre:kind==='cine'?ll(40.5,3.5):kind==='rer'?ll(20,3):ll(30,3.5),bh:Math.max(0,1+.6*gauss()),fam:(Math.random()*SIM.groups.length)|0,t:-1,next:0,hes:0,ride:null,out:false,dens:0,stopT:0,wh:undefined,st:null,qo:null,ln:0,tq:0,dw:0,sh:0,sa:0,hc:-1,i:0,noTrain:false,rats:false});}};
 const nc=Math.round(n*(cin.length?.55:0));pick(cin,nc,'cine');pick(oth.filter(c=>g.levels[c[0]]<=-4),Math.round(n*.2),'rer');pick(oth.filter(c=>g.levels[c[0]]>-4),n-SIM.A.length,'client');SIM.A.forEach((a,i)=>{a.i=i;a.hc=-1;});gareSpawn();}
function simCell(a){const g=SIM.g;const c=((a.x-g.bbox[0])/g.res)|0,r=((a.z-g.bbox[1])/g.res)|0;if(c<0||r<0||c>=g.w||r>=g.h)return -1;return a.l*SIM.N+r*g.w+c;}
function walkable(l,x,z){const g=SIM.g;const c=((x-g.bbox[0])/g.res)|0,r=((z-g.bbox[1])/g.res)|0;if(c<0||r<0||c>=g.w||r>=g.h)return false;return SIM.walk[l*SIM.N+r*g.w+c]===1;}
const R=.24;
function freeAt(l,x,z){const g=SIM.g,w=g.w,h=g.h,ir=1/g.res,bx=g.bbox[0],bz=g.bbox[1],W=SIM.walk,o=l*SIM.N;const c0=((x-R-bx)*ir)|0,c1=((x+R-bx)*ir)|0,r0=((z-R-bz)*ir)|0,r1=((z+R-bz)*ir)|0;
 if(c0<0||r0<0||c1>=w||r1>=h)return false;return W[o+r0*w+c0]===1&&W[o+r0*w+c1]===1&&W[o+r1*w+c0]===1&&W[o+r1*w+c1]===1;}
// grille spatiale : cases de 1 m, listes chaînées dans des tableaux typés (pas de Map, pas d'allocation par pas)
function hHead(l,x,z){const g=SIM.g,c=(x-g.bbox[0])|0,r=(z-g.bbox[1])|0;if(c<0||r<0||c>=g.w||r>=g.h)return -1;return SIM.hh[l*SIM.N+r*g.w+c];}
function hIns(a){const g=SIM.g,c=(a.x-g.bbox[0])|0,r=(a.z-g.bbox[1])|0;if(c<0||r<0||c>=g.w||r>=g.h){a.hc=-1;return;}const ci=a.l*SIM.N+r*g.w+c;a.hc=ci;SIM.hn[a.i]=SIM.hh[ci];SIM.hh[ci]=a.i;}
function hRem(a){const ci=a.hc;if(ci<0)return;let j=SIM.hh[ci];if(j===a.i){SIM.hh[ci]=SIM.hn[j];}else{while(j>=0&&SIM.hn[j]!==a.i)j=SIM.hn[j];if(j>=0)SIM.hn[j]=SIM.hn[a.i];}a.hc=-1;}
function hBuild(){const A=SIM.A,hd=SIM.hh;if(!hd||SIM.hn.length<A.length){SIM.hh=new Int32Array(SIM.N*SIM.L).fill(-1);SIM.hn=new Int32Array(A.length);}
 for(let k=0;k<A.length;k++){const a=A[k];if(a.hc>=0){SIM.hh[a.hc]=-1;}a.hc=-1;}
 for(let k=0;k<A.length;k++){const a=A[k];if(a.out||a.ride)continue;hIns(a);}}
SIM.delay=0;SIM.zoneOn=true;
function simChoose(a,herd){let s=0;const u=[];const i=simCell(a);const rats=a.rats=gSansRoute(i);SIM.groups.forEach((G,k)=>{const d=SIM.F[k][i];if(d>=1e9||(a.noTrain&&G.type==='train')||(!G.open&&!(G.type==='train'&&rats))){u.push(0);return;}
  const V=-0.04*d+(a.fam===k?0.795:0)-(SIM.zoneOn&&G.zone?1.5:0)+a.bh*(herd[k]||0)+(G.agent&&d<40?2.739:0)+(G.annonce?1:0);const e=Math.exp(Math.max(-30,Math.min(30,V)));u.push(e);s+=e;});
 if(!s)return -1;let x=Math.random()*s;for(let k=0;k<u.length;k++){x-=u[k];if(x<=0)return k;}return u.length-1;}
// À la sortie d'un escalator : la place libre la plus proche (pas d'empilement au même point)
function simPlace(a,x0,z0,H,key){let bx=x0,bz=z0,bd=-1;for(let t=0;t<12;t++){const r=t?.35+.12*t:0,th=t*2.4;const x=x0+r*Math.cos(th),z=z0+r*Math.sin(th);if(!freeAt(a.l,x,z))continue;let dm=9;for(let j=hHead(a.l,x,z);j>=0;j=SIM.hn[j]){const b=SIM.A[j];if(b===a||b.out||b.ride||b.l!==a.l)continue;dm=Math.min(dm,Math.hypot(b.x-x,b.z-z));}if(dm>=2*R+.05){bx=x;bz=z;bd=dm;break;}if(dm>bd){bd=dm;bx=x;bz=z;}}a.x=bx;a.z=bz;a.vx=a.vz=0;hRem(a);hIns(a);}
function simStep(dt){if(!SIM.A)return;SIM.T+=dt;const g=SIM.g,key=gKey,H=null,A=SIM.A,hh=SIM.hh,hn=SIM.hn,N=SIM.N,gw=g.w,gh=g.h,bx0=g.bbox[0],bz0=g.bbox[1];hBuild();
 gareTick(dt);
 for(const a of SIM.A){if(a.out)continue;
  if(a.ride){if(SIM.T>=a.ride.t1){const k=g.links[a.ride.li],to=a.ride.to;a.l=to[0];simPlace(a,g.bbox[0]+(to[2]+.5)*g.res,g.bbox[1]+(to[1]+.5)*g.res,H,key);a.ride=null;}continue;}
  let ex=0,ez=0,hold=false;let vd=SIM.mode==='calme'?a.v0*.7:a.v0;
  if(SIM.mode==='calme'){
   // avant l'alerte : les spectateurs restent assis, les autres flânent ; demi-tour devant un mur ; pauses ; prennent parfois un escalator
   if(a.kind==='cine'){a.vx*=.5;a.vz*=.5;}else if(a.st){if(gTravel(a,dt))continue;ex=SIM.ex;ez=SIM.ez;vd=a.v0*SIM.vf;}else if(a.stopT>0){a.stopT-=dt;}else{
    if(a.wh===undefined)a.wh=Math.random()*6.283;a.wh+=(Math.random()-.5)*.25;ex=Math.cos(a.wh);ez=Math.sin(a.wh);
    if(!freeAt(a.l,a.x+ex*1.2,a.z+ez*1.2))a.wh+=1.6+Math.random()*2.5;if(Math.random()<.0015)a.stopT=2+Math.random()*8;
    const i=simCell(a),ls=i>=0&&SIM.linkAt.get(i);if(ls&&Math.random()<.35){const li=ls[(Math.random()*ls.length)|0],k=g.links[li];if(k.open){const dir=k.ia===i?0:1;
     if(SIM.T>=k.free[dir]){k.free[dir]=SIM.T+1/k.debit;a.ride={li,t1:SIM.T+rideT(k),to:dir===0?k.b:k.a,from:[a.l,a.x,a.z]};continue;}}}}
  }else{
  if(SIM.T<a.pre+SIM.delay)continue;
   if(a.t>=0&&!gOk(a)){if(a.hes<=0)a.hes=2+Math.random()*3;}
   if(a.hes>0){a.hes-=dt;a.vx*=.7;a.vz*=.7;if(a.hes>0)continue;a.next=0;}
   if(SIM.T>=a.next){const herd={};let nn=0;for(let ix=-4;ix<=4;ix+=2)for(let iz=-4;iz<=4;iz+=2){for(let j=hHead(a.l,a.x+ix,a.z+iz);j>=0;j=hn[j]){const b=A[j];if(b===a||b.t<0||b.out||b.ride)continue;herd[b.t]=(herd[b.t]||0)+1;nn++;}}if(nn)for(const k in herd)herd[k]/=nn;
    if(a.t<0||!gOk(a)||Math.random()<.1)a.t=simChoose(a,herd);a.next=SIM.T+(a.t<0?2:8);
    // case isolée (aucune sortie calculable d'ici) : on rejoint la case praticable voisine reliée la plus proche (2 m au plus)
    if(a.t<0){const g2=SIM.g,i=simCell(a);let bj=-1,bd=9;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const j=i+dr*g2.w+dc;if(!SIM.walk[j])continue;if(!SIM.F.some((F,k)=>(SIM.groups[k].open||SIM.groups[k].type==='train')&&F[j]<1e9))continue;const d=Math.hypot(dr,dc);if(d<bd){bd=d;bj=j;}}
     if(bj>=0){const rem=bj-a.l*SIM.N,r=(rem/g2.w)|0,c=rem-r*g2.w;simPlace(a,g2.bbox[0]+(c+.5)*g2.res,g2.bbox[1]+(r+.5)*g2.res,H,key);a.next=0;}}}
   if(a.t<0)continue;
   const i=simCell(a);if(i<0){a.out=true;continue;}const f=SIM.F[a.t];
   if(f[i]<1.6&&SIM.groups[a.t].filtre){const G2=SIM.groups[a.t];if(SIM.T<(G2.nextFree||0)){a.vx*=.3;a.vz*=.3;continue;}G2.nextFree=SIM.T+1/1.3;}
   if(f[i]<1.6&&SIM.groups[a.t].type==='train'&&!gQuaiExit(a,i))hold=true; // attend le train ou son tour d'évacuation RATP, mais reste soumis aux contacts
   if(hold){}else
   if(f[i]<1.6){a.out=true;SIM.out++;const n=SIM.groups[a.t].n;SIM.outBy[n]=(SIM.outBy[n]||0)+1;if(SIM.groups[a.t].zone)SIM.zoneOut++;continue;}
   let ls=SIM.linkAt.get(i);if(!ls)for(const o of [1,-1,g.w,-g.w,g.w+1,g.w-1,-g.w+1,-g.w-1]){const q=SIM.linkAt.get(i+o);if(q){ls=q.map(li=>li);ls.from=i+o;break;}}if(ls&&!hold){const ib=ls.from??i;for(const li of ls){const k=g.links[li];if(!k.open)continue;const other=k.ia===ib?k.ib:k.ia;if(f[other]+k.len*1.4<=f[ib]+.5){const dir=k.ia===ib?0:1;if(SIM.T>=k.free[dir]){k.free[dir]=SIM.T+1/k.debit;a.ride={li,t1:SIM.T+rideT(k),to:dir===0?k.b:k.a,from:[a.l,a.x,a.z]};}else{a.vx*=.5;a.vz*=.5;}break;}}if(a.ride)continue;}
   // direction : descente de la carte de pentes (gradient sur les 8 voisins)
   const w=g.w;let bx=0,bz=0,best=f[i];for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const j=i+dr*w+dc;if(!SIM.walk[j])continue;const v=f[j];if(v<best){best=v;bx=dc;bz=dr;}}
   const m=Math.hypot(bx,bz)||1;ex=bx/m;ez=bz/m;if(hold){ex=ez=0;vd=0;}
  }let ax=(vd*ex-a.vx)/.5,az=(vd*ez-a.vz)/.5,crowd=0;
  const cA=(a.x-bx0)|0,rA=(a.z-bz0)|0,oA=a.l*N,seated=SIM.mode==='calme'&&a.kind==='cine'; // spectateurs assis : pas de force sociale, contact vérifié un pas sur quatre
  for(let rr=rA-1;rr<=(seated?rA-2:rA+1);rr++){if(rr<0||rr>=gh)continue;for(let cc=cA-1;cc<=cA+1;cc++){if(cc<0||cc>=gw)continue;for(let j=hh[oA+rr*gw+cc];j>=0;j=hn[j]){const b=A[j];if(b===a||b.out)continue;const dx=a.x-b.x,dz=a.z-b.z,d2=dx*dx+dz*dz;if(d2>1.28)continue;const d=Math.sqrt(d2)||1e-3;if(d<1.13)crowd++;if(d>1)continue;const nx=dx/d,nz=dz/d,cos=-(nx*ex+nz*ez),wgt=.3+.7*(1+cos)/2,F=25*Math.exp((2*R-d)/.08)*wgt;ax+=F*nx;az+=F*nz;}}}
  a.dens=crowd;a.vx+=ax*dt;a.vz+=az*dt;const sp=Math.hypot(a.vx,a.vz),vm=1.3*a.v0;if(sp>vm){a.vx*=vm/sp;a.vz*=vm/sp;}
  const cB=(a.x-bx0)|0,rB=(a.z-bz0)|0;
  for(let rr=rB-1;rr<=(seated&&((a.i+(SIM.T*10+.5))|0)%4!==0?rB-2:rB+1);rr++){if(rr<0||rr>=gh)continue;for(let cc=cB-1;cc<=cB+1;cc++){if(cc<0||cc>=gw)continue;for(let j=hh[oA+rr*gw+cc];j>=0;j=hn[j]){const b=A[j];if(b===a||b.out||b.ride)continue;const dx=a.x-b.x,dz=a.z-b.z,d=Math.sqrt(dx*dx+dz*dz)||1e-3;if(d<2*R){const p=(2*R-d)*.5;const px=a.x+dx/d*p,pz=a.z+dz/d*p;if(freeAt(a.l,px,pz)){a.x=px;a.z=pz;}}}}}
  if(seated&&a.vx*a.vx+a.vz*a.vz<1e-4){a.vx=a.vz=0;continue;}
  const nx=a.x+a.vx*dt,nz=a.z+a.vz*dt;if(freeAt(a.l,nx,a.z))a.x=nx;else a.vx*=-.1;if(freeAt(a.l,a.x,nz))a.z=nz;else a.vz*=-.1;}
 // densité par m² et exposition (personnes-secondes au-dessus de 5 pers./m²)
 if(SIM.mode==='evac'&&((SIM.T/dt)|0)%5===0){const D=new Map();for(const a of SIM.A){if(a.out||a.ride)continue;const k=a.l*1e6+(Math.floor(a.x)+400)*1000+(Math.floor(a.z)+400);D.set(k,(D.get(k)||0)+1);}let e=0;for(const v of D.values()){if(v>SIM.dmax)SIM.dmax=v;if(v>5)e+=v;}SIM.expo+=e*dt*5;}}
// Rendu : les silhouettes existantes suivent la simulation
function simDraw(){if(!silBody||!SIM.A)return;const show=l=>lvSel==='all'||Math.round(l)===+lvSel;const g=SIM.g;let n=0;const C=new THREE.Color();
 SIM.A.forEach((a,i)=>{if(i>=silBody.instanceMatrix.count)return;let x=a.x,z=a.z,lv=g.levels[a.l],y;
  if(a.out){SM.compose(HID,SQ.identity(),ONE);}else{if(a.ride){const k=g.links[a.ride.li];const t=1-Math.max(0,(a.ride.t1-SIM.T))/(rideT(k));const to=a.ride.to,fr=a.ride.from;const tx=g.bbox[0]+(to[2]+.5)*g.res,tz=g.bbox[1]+(to[1]+.5)*g.res;x=fr[1]+(tx-fr[1])*t;z=fr[2]+(tz-fr[2])*t;y=alt(g.levels[fr[0]])+(alt(g.levels[to[0]])-alt(g.levels[fr[0]]))*t;lv=g.levels[to[0]];}else y=alt(lv);
   if(!show(lv)){SM.compose(HID,SQ.identity(),ONE);}else{SQ.setFromEuler(SE.set(0,Math.atan2(a.vx,a.vz),0));SM.compose(SV.set(x,y+Math.abs(Math.sin(walkT*7+i))*.04,z),SQ,ONE);}}
  silBody.setMatrixAt(i,SM);silHead.setMatrixAt(i,SM);
  if(S!=='A'){C.set(SIM.T<a.pre+SIM.delay?0x8E928F:a.hes>0?0xC98A12:a.dens>=5?0xE0461F:[0x26324d,0x8c1f1f,0x2f2f2f,0x1f5a40,0x55578f,0x6b2d5c,0x3b6e8f,0xb85c2a][i%8]);silBody.setColorAt(i,C);}});
 for(let i=SIM.A.length;i<silBody.count;i++){SM.compose(HID,SQ.identity(),ONE);silBody.setMatrixAt(i,SM);silHead.setMatrixAt(i,SM);}
 silBody.instanceMatrix.needsUpdate=silHead.instanceMatrix.needsUpdate=true;if(silBody.instanceColor)silBody.instanceColor.needsUpdate=true;}

// ============================================================================================================
// FOULE DE LA GARE : trains par ligne et par quai, vagues de voyageurs, attente sur le quai, correspondances,
// fermeture ligne par ligne, évacuation RATP.
// Sources (retrouvées le 22/10/2026) : 750 000 voyageurs par jour ouvré dont 493 000 pour le RER seul (RATP, via Wikipédia « Châtelet–Les Halles ») ;
// RER A : un train toutes les 2 à 4 min par sens de 7 h à 20 h, toutes les 6 à 8 min en dehors (itineraire-metro.fr) ;
// RER B : 12 trains par heure et par sens en heures creuses (fr.wikipedia « Ligne B du RER d'Île-de-France ») ; RER D : 8 trains par heure en heures creuses (VoyageForum, source faible).
// ESTIMÉ (aucune source trouvée) : intervalles du métro (1, 4, 7, 11, 14), voyageurs par rame, durée d'arrêt.
// Rattachement des quais de la grille aux lignes (OSM) : nom « Quai 1 » = métro 1 ; sinon ligne dont la voie OSM (scene.json, voies) passe à moins de 10 m de la case de sortie :
// niveau -4 (« Quai Châtelet ») et niveau -2 nord (Les Halles) = métro 4, niveau -2 sud = métro 1, niveau -5 = métro 14.
// La grille n'a aucune case de sortie pour le RER A, B, D, le métro 7 et le métro 11 : pour les RER on place le quai sur la voie OSM (niveau -5, cases praticables sur la voie : ESTIMÉ),
// pour les métros 7 et 11 dont les voies sont hors de la grille de 1 km, on place le quai près de celui du métro 1 (ESTIMÉ).
// Échelle : 1 agent = 1 voyageur, mais les rames sont réduites à ~1/4 de la charge réelle (3 200 agents au total) : descendants par rame RER 40 à 50 (réel ~200, estimé), métro 12 à 16 (réel ~50, estimé).
// Station fermée : plus aucun train (C5) ; les voyageurs déjà dedans sans chemin vers une porte de rue sortent par les quais à débit limité (évacuation RATP : la RATP fait sortir les voyageurs par ses accès, estimé).
// ============================================================================================================
const RATP_DEBIT=1.3,GARE_RESERVE=40,PART_RUE=.65; // pers./s et quai pour l'évacuation RATP (même débit que le filtrage des portes, estimé)
// ligne, intervalle en s par sens, descendants par rame, arrêt en s, niveau du quai (index de la grille), cases de quai posées à la main (index niveau, ligne, colonne), provenance
const LIGNES_DEF=[
 {nom:'RER A',h:300,pax:50,dwell:45,synth:[[5,320,328],[5,288,319]],src:'voie OSM RER A (niveau -5) ; position du quai estimée'},
 {nom:'RER B',h:300,pax:45,dwell:45,synth:[[5,334,386],[5,295,375]],src:'voie OSM RER B (niveau -5) ; position du quai estimée'},
 {nom:'RER D',h:450,pax:40,dwell:45,synth:[[5,356,363],[5,327,355]],src:'voie OSM RER D (niveau -5) ; position du quai estimée'},
 {nom:'Métro 1',h:180,pax:16,dwell:30,src:'nom du quai « Quai 1 » et voie OSM'},
 {nom:'Métro 4',h:210,pax:14,dwell:30,src:'voie OSM à moins de 10 m des cases de sortie'},
 {nom:'Métro 7',h:240,pax:12,dwell:30,niv:3,src:'hors de la grille : quai estimé près du métro 1'},
 {nom:'Métro 11',h:240,pax:12,dwell:30,niv:2,src:'hors de la grille : quai estimé près du métro 1'},
 {nom:'Métro 14',h:200,pax:16,dwell:30,src:'voie OSM à moins de 10 m des cases de sortie'}];
function gLigneDe(e){const[l,r]=e.cell;if(/Quai 1/.test(e.n||''))return'Métro 1';if(l===5)return'Métro 14';if(l===4)return'Métro 4';if(l===2)return r<200?'Métro 4':'Métro 1';return'Métro 4';}
const gKey=(l,x,z)=>l*1e6+((x+400)|0)*1000+((z+400)|0);
const gN8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function gSig(){return SIM.g.links.map(k=>k.open?1:0).join('');}
// cases praticables d'un niveau, les plus proches d'un point, à au moins minD des cases à éviter
function gNear(li,r0,c0,count,minSep,avoid){const g=SIM.g,N=SIM.N,out=[];const cand=[];for(let r=0;r<g.h;r++)for(let c=0;c<g.w;c++){if(!SIM.reach[li*N+r*g.w+c])continue;cand.push([Math.hypot(r-r0,c-c0),r,c]);}
 cand.sort((a,b)=>a[0]-b[0]);for(const[d,r,c]of cand){if(d<12)continue;if(avoid.some(v=>v[0]===li&&Math.hypot(v[1]-r,v[2]-c)<20))continue;if(out.some(v=>Math.hypot(v[1]-r,v[2]-c)<minSep))continue;out.push([li,r,c]);if(out.length>=count)break;}return out;}
function gareGroups(){const g=SIM.g;const par={};LIGNES_DEF.forEach(d=>par[d.nom]=[]);const seen=new Set();
 g.exits.forEach(e=>{if(e.type!=='train')return;const k=e.cell.join();if(seen.has(k))return;seen.add(k);par[gLigneDe(e)].push(e.cell.slice());});
 LIGNES_DEF.forEach(d=>{if(d.synth)par[d.nom]=d.synth.map(c=>c.slice());});
 const m1=par['Métro 1'],r1=m1.reduce((s,c)=>s+c[1],0)/m1.length,c1=m1.reduce((s,c)=>s+c[2],0)/m1.length,avoid=[].concat(...Object.values(par));
 LIGNES_DEF.forEach(d=>{if(d.niv!==undefined){par[d.nom]=gNear(d.niv,Math.round(r1),Math.round(c1),2,30,avoid);avoid.push(...par[d.nom]);}});
 // groupe « toutes lignes » (C1 global) : fermer/ouvrir ici agit sur toutes les lignes ; il reste en tête pour la compatibilité avec leviers.js
 const agg={n:'Quais RER et métro',type:'train',cells:[],zone:false,toutes:true};
 Object.defineProperty(agg,'open',{enumerable:true,get(){return SIM.lignes.some(L=>L.G.open);},set(v){SIM.lignes.forEach(L=>{if(L.G.open!==v){L.G.open=v;simField(SIM.groups.indexOf(L.G));}});}});
 SIM.groups.push(agg);SIM.trainG=agg;
 SIM.lignes=LIGNES_DEF.map(d=>{const G={n:d.nom,type:'train',cells:par[d.nom].map((cell,j)=>({id:900+j,n:d.nom,type:'train',cell})),open:true,zone:false,ligne:d.nom};SIM.groups.push(G);return Object.assign({G},d);});}
const gNorm=n=>String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'').replace(/^m(?=\d)/,'metro').replace(/^(\d+)$/,'metro$1');
function gLigne(n){const k=gNorm(n);return SIM.lignes.find(L=>gNorm(L.nom)===k);}
function gCompte(L){let n=0;const qs=SIM.quais.filter(q=>q.L===L);for(const a of SIM.A){if(a.out||a.ride)continue;const i=simCell(a);if(i<0)continue;for(const q of qs)if(a.l===q.l&&q.f[i]<=40){n++;break;}}return n;}
SIM.apiLignes={
 liste(){return SIM.lignes.map(L=>({ligne:L.nom,open:L.G.open,quais:SIM.quais.filter(q=>q.L===L).map(q=>q.nom),voyageurs:gCompte(L),source:L.src}));},
 fermer(n){const L=gLigne(n);if(!L)return false;L.G.open=false;simField(SIM.groups.indexOf(L.G));return true;},
 ouvrir(n){const L=gLigne(n);if(!L)return false;L.G.open=true;simField(SIM.groups.indexOf(L.G));return true;}};
if(typeof window!=='undefined')window.lignes=SIM.apiLignes;
function gareInit(){const g=SIM.g,N=SIM.N,w=g.w;
 const cl=[];SIM.lignes.forEach(L=>L.G.cells.forEach(e=>{const c=e.cell;const q=cl.find(q=>q.L===L&&q.l===c[0]&&q.cells.some(d=>Math.hypot(d[1]-c[1],d[2]-c[2])<60));if(q)q.cells.push(c);else cl.push({L,l:c[0],cells:[c]});}));
 SIM.quais=cl.map((q,id)=>{const L=q.L,nom=L.nom+' · niveau '+g.levels[q.l];
  const streams=['sens 1','sens 2'].map((d,sid)=>({id:sid,nom:L.nom+' '+d,h:L.h,pax:L.pax,dwell:L.dwell,room:L.pax*3,next:0}));
  const idx=q.cells.map(c=>idx3(c[0],c[1],c[2])),f=new Float32Array(N*SIM.L);distField(f,idx);
  const spots=[],doors=[],base=q.l*N;for(let j=0;j<N;j++){const v=f[base+j];if(v>=1e9||!SIM.reach[base+j])continue;if(v<=8)doors.push(base+j);if(v>=3&&v<=32)spots.push(base+j);}
  return{id,L,l:q.l,nom,idx,f,streams,spots,doors,pend:[],dwell:0,room:0,acc:0,eacc:0,nextR:0,flux:streams.reduce((s,t)=>s+t.pax/t.h,0),paxTot:streams.reduce((s,t)=>s+t.pax,0)};});
 SIM.gq=new Map();SIM.quais.forEach(q=>q.idx.forEach(i=>{SIM.gq.set(i,q);for(const[dr,dc]of gN8)SIM.gq.set(i+dr*w+dc,q);}));
 // départ des entrants : portes de rue pondérées par la proximité du quai
 SIM.quais.forEach(q=>{q.src=[];let tot=0;SIM.groups.forEach(G=>{if(G.type!=='rue')return;G.cells.forEach(e=>{const i=idx3(e.cell[0],e.cell[1],e.cell[2]),d=q.f[i];if(d>=1e9)return;tot+=Math.exp(-d/120);q.src.push({i,wt:tot});});});q.srcTot=tot;});
 SIM.free=[];SIM.gare={q:[],rue:0,entr:0,refus:0,ratp:0,sans:0,sig:gSig(),sigT:0};}
function gPickQ(excl){let t=0;for(const q of SIM.quais)if(q!==excl&&q.L.G.open)t+=q.flux;if(!t)return null;let x=Math.random()*t;for(const q of SIM.quais){if(q===excl||!q.L.G.open)continue;x-=q.flux;if(x<=0)return q;}return null;}
function gPickLine(q){let t=0;q.streams.forEach(s=>t+=s.pax);let x=Math.random()*t;for(const s of q.streams){x-=s.pax;if(x<=0)return s;}return q.streams[0];}
function gCellXZ(i){const g=SIM.g,rem=i%SIM.N,r=(rem/g.w)|0,c=rem-r*g.w;return[g.bbox[0]+(c+.5)*g.res+(Math.random()-.5)*.8,g.bbox[1]+(r+.5)*g.res+(Math.random()-.5)*.8];}
function gFree(l,x,z,H,r){if(!freeAt(l,x,z))return false;for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){for(let j=hHead(l,x+ix,z+iz);j>=0;j=SIM.hn[j]){const b=SIM.A[j];if(b.out||b.ride||b.l!==l)continue;const dx=b.x-x,dz=b.z-z;if(dx*dx+dz*dz<r*r)return false;}}return true;}
function gPut(a,l,x,z,H){hRem(a);a.l=l;a.x=x;a.z=z;a.vx=a.vz=0;hIns(a);}
function gTake(){if(!SIM.free.length)return null;if(SIM.mode==='calme'&&SIM.free.length<=GARE_RESERVE)return null;return SIM.free.pop();}
function gInit(a){a.kind='rer';a.v0=Math.max(.7,1.34+.26*gauss());a.bh=Math.max(0,1+.6*gauss());a.fam=(Math.random()*SIM.groups.length)|0;a.vx=a.vz=0;a.out=false;a.ride=null;a.t=-1;a.next=0;a.hes=0;a.stopT=0;a.dens=0;a.noTrain=false;a.rats=false;a.st=null;a.sh=0;a.wh=undefined;a.pre=ll(20,3);return a;}
function gSansRoute(i){for(let k=0;k<SIM.groups.length;k++){const G=SIM.groups[k];if(G.type!=='train'&&G.open&&SIM.F[k][i]<1e9)return false;}return true;}
function gOk(a){const G=SIM.groups[a.t];return G.open||(G.type==='train'&&a.rats);}
function gQuaiExit(a,i){const q=SIM.gq.get(i);if(!q)return false;
 if(q.L.G.open){if(q.dwell<=0||q.room<=0)return false;q.room--;SIM.gare.q[q.id].emb++;return true;}
 if(SIM.T<q.nextR)return false;q.nextR=SIM.T+1/RATP_DEBIT;SIM.gare.q[q.id].ratp++;SIM.gare.ratp++;return true;}
// destination d'un voyageur qui sort : porte de rue ouverte la plus proche (logit), sinon évacuation RATP par le quai le plus proche
function gTarget(a,i){let s=0;const u=[];SIM.groups.forEach((G,k)=>{const d=SIM.F[k][i];if(G.type!=='rue'||!G.open||d>=1e9){u.push(0);return;}const e=Math.exp(Math.max(-30,Math.min(30,-.04*d+(a.fam===k?.8:0)-(G.zone?1.5:0))));u.push(e);s+=e;});
 if(s){let x=Math.random()*s;for(let k=0;k<u.length;k++){x-=u[k];if(x<=0)return k;}}
 let bk=-1,bd=1e9;SIM.groups.forEach((G,k)=>{if(G.type==='train'&&G.cells.length&&SIM.F[k][i]<bd){bd=SIM.F[k][i];bk=k;}});return bk;}
function gRetire(a){a.out=true;a.st=null;a.ride=null;if(SIM.mode==='calme')SIM.free.push(a);}
// suit un champ de distance : lien (escalator, escalier, ascenseur) si le champ y descend, sinon pente sur 8 voisins. Renvoie 1 si l'agent a fini son tour.
function gStep(a,f,i){const g=SIM.g,w=g.w;if(f[i]>=1e9){gRetire(a);SIM.gare.sans++;return 1;}
 let ls=SIM.linkAt.get(i),ib=i;if(!ls)for(const o of [1,-1,w,-w,w+1,w-1,-w+1,-w-1]){const q=SIM.linkAt.get(i+o);if(q){ls=q;ib=i+o;break;}}
 if(ls){for(const li of ls){const k=g.links[li];if(!k.open)continue;const other=k.ia===ib?k.ib:k.ia;if(f[other]+k.len*1.4<=f[ib]+.5){const dir=k.ia===ib?0:1;if(SIM.T>=k.free[dir]){k.free[dir]=SIM.T+1/k.debit;a.ride={li,t1:SIM.T+rideT(k),to:dir===0?k.b:k.a,from:[a.l,a.x,a.z]};return 1;}a.vx*=.5;a.vz*=.5;break;}}}
 let bx=0,bz=0,best=f[i];for(const[dr,dc]of gN8){const j=i+dr*w+dc;if(!SIM.walk[j])continue;const v=f[j];if(v<best){best=v;bx=dc;bz=dr;}}
 const m=Math.sqrt(bx*bx+bz*bz)||1;SIM.ex=bx/m;SIM.ez=bz/m;return 0;}
// comportement d'un voyageur en mode calme. Renvoie 1 si l'agent a fini son tour (sorti, sur un lien).
function gTravel(a,dt){SIM.ex=SIM.ez=0;SIM.vf=1;const i=simCell(a);if(i<0){gRetire(a);return 1;}let st=a.st;
 const qo=st==='wait'||st==='board'?a.qo:st==='xfer'?SIM.quais[a.tq]:null;
 if(qo&&!qo.L.G.open){st=a.st='leave';a.t=-1;} // ligne fermée : on repart vers la rue
 if(st==='wait'){SIM.vf=0;if(a.sh>0){a.sh-=dt;SIM.ex=Math.cos(a.sa);SIM.ez=Math.sin(a.sa);SIM.vf=.25;if(!freeAt(a.l,a.x+SIM.ex*.4,a.z+SIM.ez*.4))a.sh=0;}else if(Math.random()<.01){a.sh=.8+Math.random()*1.5;a.sa=Math.random()*6.283;}return 0;}
 if(st==='board'){const q=a.qo;if(q.dwell<=0||q.room<=0){a.st='wait';SIM.vf=0;return 0;}if(q.f[i]<1.6){q.room--;SIM.gare.q[q.id].emb++;gRetire(a);return 1;}return gStep(a,q.f,i);}
 if(st==='xfer'){const q=SIM.quais[a.tq];if(q.f[i]<=a.dw){a.st='wait';a.qo=q;SIM.vf=0;return 0;}return gStep(a,q.f,i);}
 // « alight » et « leave » : vers une sortie
 let G=a.t>=0&&SIM.groups[a.t];if(!G||SIM.F[a.t][i]>=1e9||(!G.open&&G.type!=='train')){a.t=gTarget(a,i);if(a.t<0){gRetire(a);SIM.gare.sans++;return 1;}G=SIM.groups[a.t];}
 const f=SIM.F[a.t];
 if(f[i]<1.6){if(G.type!=='train'||gQuaiExit(a,i)){if(G.type==='rue')SIM.gare.rue++;gRetire(a);return 1;}SIM.vf=0;return 0;}
 return gStep(a,f,i);}
// État initial : voyageurs qui attendent sur les quais, voyageurs en correspondance ou en sortie, réserve d'agents libres
function gareSpawn(){const A=SIM.A,n=A.length;SIM.free=[];
 SIM.quais.forEach(q=>{q.pend=[];q.dwell=0;q.room=0;q.acc=0;q.eacc=0;q.nextR=0;q.streams.forEach(s=>{s.next=Math.random()*s.h;});});
 SIM.gare={q:SIM.quais.map(q=>({n:q.nom,ligne:q.L.nom,arr:0,desc:0,emb:0,ratp:0,xfer:0,entr:0})),rue:0,entr:0,refus:0,ratp:0,sans:0,sig:gSig(),sigT:0};
 let k=0;const R=Math.round(n*.08);for(let j=A.length-1;j>=0&&k<R;j--){if(A[j].kind==='client'){A[j].out=true;A[j].st=null;SIM.free.push(A[j]);k++;}}
 const H=null;hBuild();
 const rer=A.filter(a=>a.kind==='rer'&&!a.out),W=Math.min(rer.length,Math.round(n*.08));let ptot=0;SIM.quais.forEach(q=>{if(q.L.G.open)ptot+=q.paxTot;});
 rer.forEach((a,j)=>{let ok=false;if(j<W&&ptot){let x=Math.random()*ptot,q=null;for(const o of SIM.quais){if(!o.L.G.open)continue;q=o;x-=o.paxTot;if(x<=0)break;}
   for(let t=0;t<14&&!ok&&q&&q.spots.length;t++){const sp=q.spots[(Math.random()*q.spots.length)|0],[px,pz]=gCellXZ(sp);if(gFree(q.l,px,pz,H,.55)){gPut(a,q.l,px,pz,H);a.st='wait';a.qo=q;a.ln=gPickLine(q).id;a.sh=0;ok=true;}}}
  if(ok)return;
  const i=simCell(a);let q2=Math.random()<.45?gPickQ(null):null;if(q2&&q2.f[i]>=1e9)q2=null;if(q2){a.st='xfer';a.tq=q2.id;a.ln=gPickLine(q2).id;a.dw=4+Math.random()*24;}else{a.t=gTarget(a,i);if(a.t<0){a.out=true;SIM.free.push(a);return;}a.st='alight';}});}
// Chaque pas : arrivée des trains, vague de descendants posée près des portes, voyageurs qui entrent depuis la rue
function gareTick(dt){const H=null;const G=SIM.gare,calm=SIM.mode==='calme';
 if(SIM.T>=G.sigT){G.sigT=SIM.T+2;const sg=gSig();if(sg!==G.sig){G.sig=sg;SIM.quais.forEach(q=>distField(q.f,q.idx));}}
 for(const q of SIM.quais){const S=G.q[q.id],open=q.L.G.open;q.dwell=Math.max(0,q.dwell-dt);if(q.dwell<=0)q.room=0;
  if(!open){q.pend.length=0;q.dwell=0;q.room=0;continue;}
  for(const s of q.streams){if(SIM.T<s.next)continue;s.next=SIM.T+s.h*(.8+.4*Math.random());S.arr++;q.dwell=s.dwell;q.room=s.room;
   q.pend.push(Math.max(1,Math.round(s.pax*(.7+.6*Math.random()))));
   if(calm)for(const a of SIM.A){if(a.st==='wait'&&a.qo===q&&a.ln===s.id)a.st='board';}}
  // descendants : 6 par seconde et par quai, posés près des portes, un par un
  q.acc+=dt*6;while(q.acc>=1&&q.pend.length){const a0=gTake();if(!a0){G.refus+=q.pend.shift();continue;}
   let ok=false;for(let t=0;t<10&&!ok&&q.doors.length;t++){const [px,pz]=gCellXZ(q.doors[(Math.random()*q.doors.length)|0]);if(gFree(q.l,px,pz,H,.55)){gInit(a0);gPut(a0,q.l,px,pz,H);ok=true;}}
   if(!ok){SIM.free.push(a0);q.acc=Math.min(q.acc,1);break;}
   q.acc-=1;if(--q.pend[0]<=0)q.pend.shift();S.desc++;
   let q2=calm&&Math.random()>PART_RUE?gPickQ(q):null;if(q2&&q2.f[simCell(a0)]>=1e9)q2=null;
   if(q2){a0.st='xfer';a0.tq=q2.id;a0.ln=gPickLine(q2).id;a0.dw=4+Math.random()*24;S.xfer++;}
   else if(calm){a0.t=gTarget(a0,simCell(a0));if(a0.t<0){gRetire(a0);G.sans++;}else a0.st='alight';}
   else{a0.pre=SIM.T-SIM.delay+ll(8,3);a0.noTrain=true;}}
  if(q.acc>3)q.acc=3;
  // entrants depuis la rue (mode calme seulement)
  if(calm){q.eacc+=dt*q.flux*PART_RUE;while(q.eacc>=1){if(!q.srcTot){q.eacc=0;break;}const a0=gTake();if(!a0){G.refus++;q.eacc-=1;continue;}
   let x=Math.random()*q.srcTot,sc=q.src[q.src.length-1];for(const c of q.src){if(x<=c.wt){sc=c;break;}}
   const l=(sc.i/SIM.N)|0;let ok=false;for(let t=0;t<8&&!ok;t++){const [px,pz]=gCellXZ(sc.i);if(gFree(l,px,pz,H,.55)){gInit(a0);gPut(a0,l,px,pz,H);ok=true;}}
   if(!ok){SIM.free.push(a0);q.eacc=Math.min(q.eacc,1);break;}
   q.eacc-=1;a0.st='xfer';a0.tq=q.id;a0.ln=gPickLine(q).id;a0.dw=4+Math.random()*24;S.entr++;G.entr++;}
   if(q.eacc>3)q.eacc=3;}}}
