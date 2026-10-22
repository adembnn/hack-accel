// Évacuation sur la vraie grille du Forum (navgrid.json, 1 m, niveaux 0 à -5) : cartes de pentes par sortie (Dial),
// départ log-logistique (cinéma, médiane 40,5 s), choix de sortie logit (Lovreglio), suivisme, hésitation devant une issue
// fermée, forces sociales avec glissement le long des murs, escalators et escaliers à débit limité.
// Perturbations posables : sortie fermée, station fermée (quais), escalator arrêté, zone de troubles, annonce tardive.
const SIM={on:false};
function b64bits(s,n){const b=atob(s),u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=(b.charCodeAt(i>>3)>>(7-(i&7)))&1;return u;}
async function simLoad(){let g=null;for(let k=0;k<4&&!g;k++){try{g=await fetch('navgrid.json').then(r=>r.json());}catch(e){await new Promise(r=>setTimeout(r,500*(k+1)));}}if(!g)throw new Error('navgrid.json introuvable');const N=g.w*g.h,L=g.levels.length;
 SIM.g=g;SIM.N=N;SIM.L=L;SIM.walk=new Uint8Array(N*L);SIM.reach=new Uint8Array(N*L);
 for(let l=0;l<L;l++){SIM.walk.set(b64bits(g.walk[l],N),l*N);SIM.reach.set(b64bits(g.reach[l],N),l*N);}
 SIM.linkAt=new Map();g.links.forEach((k,i)=>{k.open=true;k.free=[0,0];k.debit=k.k==='escalator'?1.25:2.0;const a=k.a[0]*N+k.a[1]*g.w+k.a[2],b=k.b[0]*N+k.b[1]*g.w+k.b[2];k.ia=a;k.ib=b;
  if(!SIM.linkAt.has(a))SIM.linkAt.set(a,[]);if(!SIM.linkAt.has(b))SIM.linkAt.set(b,[]);SIM.linkAt.get(a).push(i);SIM.linkAt.get(b).push(i);});
 // groupes de sortie : chaque porte de rue, et « train » (tous les quais)
 SIM.groups=[];g.exits.forEach(e=>{if(e.type==='rue')SIM.groups.push({n:e.n,type:'rue',cells:[e],open:true,zone:/Berger|Rambuteau/.test(e.n)});});
 SIM.groups.push({n:'Quais RER et métro',type:'train',cells:g.exits.filter(e=>e.type==='train'),open:true,zone:false});
 SIM.F=SIM.groups.map(()=>new Float32Array(N*L));SIM.groups.forEach((_,k)=>simField(k));}
const idx3=(l,r,c)=>l*SIM.N+r*SIM.g.w+c;
function simField(k){const g=SIM.g,N=SIM.N,f=SIM.F[k];f.fill(1e9);const G=SIM.groups[k];if(!G.open)return;
 const B=4096,buckets=Array.from({length:B},()=>[]);let cnt=0;const push=(i,d)=>{f[i]=d;buckets[Math.round(d)%B].push(i);cnt++;};
 G.cells.forEach(e=>{const i=idx3(e.cell[0],e.cell[1],e.cell[2]);push(i,0);});
 const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4],[1,-1,1.4],[-1,1,1.4],[-1,-1,1.4]];let cur=0,guard=0;
 while(cnt>0&&guard<5e7){const bk=buckets[cur%B];if(!bk.length){cur++;continue;}const i=bk.pop();cnt--;guard++;const d=f[i];if(Math.round(d)!==cur%B&&Math.round(d)>cur)continue;
  const l=(i/N)|0,rem=i-l*N,r=(rem/g.w)|0,c=rem-r*g.w;
  for(const[dr,dc,w]of NB){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=g.h||cc>=g.w)continue;const j=i+dr*g.w+dc;if(!SIM.walk[j])continue;if(dr&&dc&&(!SIM.walk[i+dr*g.w]||!SIM.walk[i+dc]))continue;const nd=d+w;if(nd<f[j]){push(j,nd);}}
  const ls=SIM.linkAt.get(i);if(ls)for(const li of ls){const k2=g.links[li];if(!k2.open)continue;const j=k2.ia===i?k2.ib:k2.ia;const nd=d+k2.len*1.4;if(nd<f[j])push(j,nd);}}}
function ll(med,b){const u=Math.min(.999,Math.max(.001,Math.random()));return med*Math.pow(u/(1-u),1/b);}
function gauss(){return Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.2832*Math.random());}
function simSpawn(n){const g=SIM.g,N=SIM.N;SIM.A=[];SIM.T=0;SIM.out=0;SIM.outBy={};SIM.expo=0;SIM.dmax=0;SIM.zoneOut=0;
 const ugc=SCN.interieur.filter(o=>/UGC|Cin[ée]/i.test(o.n||''));const inPoly=(x,z)=>ugc.some(o=>pip(x,z,pairs(o.p)));
 const cand=[];for(let l=0;l<SIM.L;l++)for(let r=0;r<g.h;r+=1)for(let c=0;c<g.w;c+=1){const i=l*N+r*g.w+c;if(!SIM.reach[i])continue;const x=g.bbox[0]+(c+.5)*g.res,z=g.bbox[1]+(r+.5)*g.res;cand.push([l,x,z,inPoly(x,z)&&(g.levels[l]===-3||g.levels[l]===-2)]);}
 const cin=cand.filter(c=>c[3]),oth=cand.filter(c=>!c[3]);
 const pick=(arr,k,kind)=>{for(let j=0;j<k&&arr.length;j++){const c=arr[(Math.random()*arr.length)|0];SIM.A.push({l:c[0],x:c[1]+(Math.random()-.5)*.8,z:c[2]+(Math.random()-.5)*.8,vx:0,vz:0,kind,
  v0:Math.max(.7,1.34+.26*gauss()),pre:kind==='cine'?ll(40.5,3.5):kind==='rer'?ll(20,3):ll(30,3.5),bh:Math.max(0,1+.6*gauss()),fam:(Math.random()*SIM.groups.length)|0,t:-1,next:0,hes:0,ride:null,out:false,dens:0});}};
 const nc=Math.round(n*(cin.length?.55:0));pick(cin,nc,'cine');pick(oth.filter(c=>g.levels[c[0]]<=-4),Math.round(n*.2),'rer');pick(oth.filter(c=>g.levels[c[0]]>-4),n-SIM.A.length,'client');}
function simCell(a){const g=SIM.g;const c=((a.x-g.bbox[0])/g.res)|0,r=((a.z-g.bbox[1])/g.res)|0;if(c<0||r<0||c>=g.w||r>=g.h)return -1;return a.l*SIM.N+r*g.w+c;}
function walkable(l,x,z){const g=SIM.g;const c=((x-g.bbox[0])/g.res)|0,r=((z-g.bbox[1])/g.res)|0;if(c<0||r<0||c>=g.w||r>=g.h)return false;return SIM.walk[l*SIM.N+r*g.w+c]===1;}
const R=.24,freeAt=(l,x,z)=>walkable(l,x-R,z-R)&&walkable(l,x+R,z-R)&&walkable(l,x-R,z+R)&&walkable(l,x+R,z+R);
SIM.delay=0;SIM.zoneOn=true;
function simChoose(a,herd){let s=0;const u=[];const i=simCell(a);SIM.groups.forEach((G,k)=>{const d=SIM.F[k][i];if(!G.open||d>=1e9){u.push(0);return;}
  const V=-0.04*d+(a.fam===k?0.795:0)-(SIM.zoneOn&&G.zone?1.5:0)+a.bh*(herd[k]||0);const e=Math.exp(Math.max(-30,Math.min(30,V)));u.push(e);s+=e;});
 if(!s)return -1;let x=Math.random()*s;for(let k=0;k<u.length;k++){x-=u[k];if(x<=0)return k;}return u.length-1;}
// À la sortie d'un escalator : la place libre la plus proche (pas d'empilement au même point)
function simPlace(a,x0,z0,H,key){let bx=x0,bz=z0,bd=-1;for(let t=0;t<12;t++){const r=t?.35+.12*t:0,th=t*2.4;const x=x0+r*Math.cos(th),z=z0+r*Math.sin(th);if(!freeAt(a.l,x,z))continue;let dm=9;const L2=H.get(key(a.l,x,z));if(L2)for(const b of L2){if(b.out||b.ride||b.l!==a.l)continue;dm=Math.min(dm,Math.hypot(b.x-x,b.z-z));}if(dm>=2*R+.05){bx=x;bz=z;bd=dm;break;}if(dm>bd){bd=dm;bx=x;bz=z;}}a.x=bx;a.z=bz;a.vx=a.vz=0;const L3=H.get(key(a.l,bx,bz));if(L3)L3.push(a);else H.set(key(a.l,bx,bz),[a]);}
function simStep(dt){if(!SIM.A)return;SIM.T+=dt;const g=SIM.g,H=new Map(),key=(l,x,z)=>l*1e6+((x+400)|0)*1000+((z+400)|0);
 for(const a of SIM.A){if(a.out||a.ride)continue;const kk=key(a.l,a.x,a.z);let L2=H.get(kk);if(!L2)H.set(kk,L2=[]);L2.push(a);}
 for(const a of SIM.A){if(a.out)continue;
  if(a.ride){if(SIM.T>=a.ride.t1){const k=g.links[a.ride.li],to=a.ride.to;a.l=to[0];simPlace(a,g.bbox[0]+(to[2]+.5)*g.res,g.bbox[1]+(to[1]+.5)*g.res,H,key);a.ride=null;}continue;}
  if(SIM.T<a.pre+SIM.delay)continue;
  if(a.t>=0&&!SIM.groups[a.t].open){if(a.hes<=0)a.hes=2+Math.random()*3;}
  if(a.hes>0){a.hes-=dt;a.vx*=.7;a.vz*=.7;if(a.hes>0)continue;a.next=0;}
  if(SIM.T>=a.next){const herd={};let nn=0;for(let ix=-4;ix<=4;ix+=2)for(let iz=-4;iz<=4;iz+=2){const L2=H.get(key(a.l,a.x+ix,a.z+iz));if(!L2)continue;for(const b of L2){if(b===a||b.t<0)continue;herd[b.t]=(herd[b.t]||0)+1;nn++;}}if(nn)for(const k in herd)herd[k]/=nn;
   if(a.t<0||!SIM.groups[a.t].open||Math.random()<.1)a.t=simChoose(a,herd);a.next=SIM.T+(a.t<0?2:8);}
  if(a.t<0)continue;
  const i=simCell(a);if(i<0){a.out=true;continue;}const f=SIM.F[a.t];
  if(f[i]<1.6){a.out=true;SIM.out++;const n=SIM.groups[a.t].n;SIM.outBy[n]=(SIM.outBy[n]||0)+1;if(SIM.groups[a.t].zone)SIM.zoneOut++;continue;}
  let ls=SIM.linkAt.get(i);if(!ls)for(const o of [1,-1,g.w,-g.w,g.w+1,g.w-1,-g.w+1,-g.w-1]){const q=SIM.linkAt.get(i+o);if(q){ls=q.map(li=>li);ls.from=i+o;break;}}if(ls){const ib=ls.from??i;for(const li of ls){const k=g.links[li];if(!k.open)continue;const other=k.ia===ib?k.ib:k.ia;if(f[other]+k.len*1.4<=f[ib]+.5){const dir=k.ia===ib?0:1;if(SIM.T>=k.free[dir]){k.free[dir]=SIM.T+1/k.debit;a.ride={li,t1:SIM.T+k.len/(k.k==='escalator'?.75:.55),to:dir===0?k.b:k.a,from:[a.l,a.x,a.z]};}else{a.vx*=.5;a.vz*=.5;}break;}}if(a.ride)continue;}
  // direction : descente de la carte de pentes (gradient sur les 8 voisins)
  const w=g.w;let bx=0,bz=0,best=f[i];for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const j=i+dr*w+dc;if(!SIM.walk[j])continue;const v=f[j];if(v<best){best=v;bx=dc;bz=dr;}}
  const m=Math.hypot(bx,bz)||1;let ex=bx/m,ez=bz/m;let ax=(a.v0*ex-a.vx)/.5,az=(a.v0*ez-a.vz)/.5,crowd=0;
  for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){const L2=H.get(key(a.l,a.x+ix,a.z+iz));if(!L2)continue;for(const b of L2){if(b===a)continue;const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz)||1e-3;if(d>1.6)continue;if(d<1.13)crowd++;const nx=dx/d,nz=dz/d,cos=-(nx*ex+nz*ez),wgt=.3+.7*(1+cos)/2,F=25*Math.exp((2*R-d)/.08)*wgt;ax+=F*nx;az+=F*nz;}}
  a.dens=crowd;a.vx+=ax*dt;a.vz+=az*dt;const sp=Math.hypot(a.vx,a.vz),vm=1.3*a.v0;if(sp>vm){a.vx*=vm/sp;a.vz*=vm/sp;}
  for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){const L2=H.get(key(a.l,a.x+ix,a.z+iz));if(!L2)continue;for(const b of L2){if(b===a||b.out||b.ride)continue;const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz)||1e-3;if(d<2*R){const p=(2*R-d)*.5;const px=a.x+dx/d*p,pz=a.z+dz/d*p;if(freeAt(a.l,px,pz)){a.x=px;a.z=pz;}}}}
  const nx=a.x+a.vx*dt,nz=a.z+a.vz*dt;if(freeAt(a.l,nx,a.z))a.x=nx;else a.vx*=-.1;if(freeAt(a.l,a.x,nz))a.z=nz;else a.vz*=-.1;}
 // densité par m² et exposition (personnes-secondes au-dessus de 5 pers./m²)
 if(((SIM.T/dt)|0)%5===0){const D=new Map();for(const a of SIM.A){if(a.out||a.ride)continue;const k=a.l*1e6+(Math.floor(a.x)+400)*1000+(Math.floor(a.z)+400);D.set(k,(D.get(k)||0)+1);}let e=0;for(const v of D.values()){if(v>SIM.dmax)SIM.dmax=v;if(v>5)e+=v;}SIM.expo+=e*dt*5;}}
// Rendu : les silhouettes existantes suivent la simulation
function simDraw(){if(!silBody||!SIM.A)return;const show=l=>lvSel==='all'||Math.round(l)===+lvSel;const g=SIM.g;let n=0;const C=new THREE.Color();
 SIM.A.forEach((a,i)=>{if(i>=silBody.instanceMatrix.count)return;let x=a.x,z=a.z,lv=g.levels[a.l],y;
  if(a.out){SM.compose(HID,SQ.identity(),ONE);}else{if(a.ride){const k=g.links[a.ride.li];const t=1-Math.max(0,(a.ride.t1-SIM.T))/(k.len/(k.k==='escalator'?.75:.55));const to=a.ride.to,fr=a.ride.from;const tx=g.bbox[0]+(to[2]+.5)*g.res,tz=g.bbox[1]+(to[1]+.5)*g.res;x=fr[1]+(tx-fr[1])*t;z=fr[2]+(tz-fr[2])*t;y=alt(g.levels[fr[0]])+(alt(g.levels[to[0]])-alt(g.levels[fr[0]]))*t;lv=g.levels[to[0]];}else y=alt(lv);
   if(!show(lv)){SM.compose(HID,SQ.identity(),ONE);}else{SQ.setFromEuler(SE.set(0,Math.atan2(a.vx,a.vz),0));SM.compose(SV.set(x,y+Math.abs(Math.sin(walkT*7+i))*.04,z),SQ,ONE);}}
  silBody.setMatrixAt(i,SM);silHead.setMatrixAt(i,SM);
  if(S!=='A'){C.set(SIM.T<a.pre+SIM.delay?0x8E928F:a.hes>0?0xC98A12:a.dens>=5?0xE0461F:[0x26324d,0x8c1f1f,0x2f2f2f,0x1f5a40,0x55578f,0x6b2d5c,0x3b6e8f,0xb85c2a][i%8]);silBody.setColorAt(i,C);}});
 silBody.instanceMatrix.needsUpdate=silHead.instanceMatrix.needsUpdate=true;if(silBody.instanceColor)silBody.instanceColor.needsUpdate=true;}
