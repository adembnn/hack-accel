const T0=Date.now();
// ---------- Géométrie stylisée (mètres) : 3 niveaux de 100 × 60 m ----------
const CS=0.5,LW=100,LH=60,GW=LW/CS,GH=LH/CS,NC=GW*GH,NL=3;
const LNAME=['Niveau 0 · surface','Niveau -1 · galerie','Niveau -2 · cinéma et RER'];
const grid=new Uint8Array(NL*NC);const solids=[[],[],[]];
const idx=(l,cx,cy)=>l*NC+cy*GW+cx;
function rect(l,x0,y0,x1,y1){solids[l].push([x0,y0,x1,y1]);for(let y=Math.floor(y0/CS);y<Math.ceil(y1/CS);y++)for(let x=Math.floor(x0/CS);x<Math.ceil(x1/CS);x++)if(x>=0&&y>=0&&x<GW&&y<GH)grid[idx(l,x,y)]=1;}
function border(l,gaps){const segs={t:[[0,LW]],b:[[0,LW]],l:[[0,LH]],r:[[0,LH]]};gaps.forEach(([s,a,b])=>{segs[s]=segs[s].flatMap(([u,v])=>a>u&&b<v?[[u,a],[b,v]]:[[u,v]]);});
segs.t.forEach(([u,v])=>rect(l,u,0,v,.5));segs.b.forEach(([u,v])=>rect(l,u,LH-.5,v,LH));segs.l.forEach(([u,v])=>rect(l,0,u,.5,v));segs.r.forEach(([u,v])=>rect(l,LW-.5,u,LW,v));}
const EXITS=[
 {n:'Rue Berger',l:0,s:'t',a:44,b:52,zone:false},
 {n:'Rue Rambuteau',l:0,s:'r',a:4,b:10,zone:true},
 {n:'Rue Pierre-Lescot',l:0,s:'r',a:40,b:48,zone:false},
 {n:'Rue de Rivoli',l:0,s:'b',a:60,b:68,zone:false},
 {n:'Rue du Louvre',l:0,s:'l',a:44,b:50,zone:false},
 {n:'Bouche métro Châtelet',l:0,s:'b',a:20,b:23,zone:false},
 {n:'Accès RER / métro',l:2,s:'l',a:44,b:52,zone:false}];
EXITS.forEach(e=>{e.open=true;e.r=e.s==='t'?[e.a,0,e.b,.5]:e.s==='b'?[e.a,LH-.5,e.b,LH]:e.s==='l'?[0,e.a,.5,e.b]:[LW-.5,e.a,LW,e.b];});
[0,1,2].forEach(l=>border(l,EXITS.filter(e=>e.l===l).map(e=>[e.s,e.a,e.b])));
// Niveau 0 : jardin, Canopée (patio central ouvert), Bourse de commerce
rect(0,40,22,46,38);rect(0,54,22,60,38);rect(0,8,22,20,36);rect(0,70,20,84,30);
[[28,12],[30,46],[66,46],[76,40],[14,48],[86,12]].forEach(([x,y])=>rect(0,x,y,x+1,y+1));
// Niveau -1 : galerie en anneau
rect(1,6,6,40,18);rect(1,60,6,94,18);rect(1,6,42,40,54);rect(1,60,42,94,54);rect(1,44,26,46,34);rect(1,54,26,56,34);
// Niveau -2 : six salles de cinéma (portes de 2 m), caisses
for(let i=0;i<6;i++){const x0=6+i*14;rect(2,x0,2,x0+.5,18);rect(2,x0,17.5,x0+6,18);rect(2,x0+8,17.5,x0+14,18);}rect(2,90,2,90.5,18);rect(2,40,30,60,34);
// Escalators : [niveau bas, x, y, niveau haut, x, y]
const LINKS=[[1,50,30,0,50,30],[1,92,30,0,88,44],[1,50,3,0,48,16],[2,30,46,1,30,30],[2,70,46,1,70,30]];
const ESC_T=12,ESC_GAP=0.9,ESC_COST=14;
const linkNode=LINKS.map(k=>[idx(k[0],k[1]/CS|0,k[2]/CS|0),idx(k[3],k[4]/CS|0,k[5]/CS|0)]);
const exitOf=new Int8Array(NL*NC).fill(-1);
EXITS.forEach((e,k)=>{for(let y=Math.floor(e.r[1]/CS);y<Math.ceil(e.r[3]/CS);y++)for(let x=Math.floor(e.r[0]/CS);x<Math.ceil(e.r[2]/CS);x++)exitOf[idx(e.l,x,y)]=k;});

// ---------- Champs : distance aux murs puis carte de pentes multi-niveaux par issue ----------
const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
function heap(){const h=[];return{h,push(i,v){h.push([v,i]);let k=h.length-1;while(k>0){const p=(k-1)>>1;if(h[p][0]<=h[k][0])break;[h[p],h[k]]=[h[k],h[p]];k=p;}},pop(){const t=h[0],l=h.pop();if(h.length){h[0]=l;let k=0;for(;;){let a=2*k+1,b=a+1,m=k;if(a<h.length&&h[a][0]<h[m][0])m=a;if(b<h.length&&h[b][0]<h[m][0])m=b;if(m===k)break;[h[m],h[k]]=[h[k],h[m]];k=m;}}return t;}};}
const wd=new Float64Array(NL*NC).fill(1e9);
(function(){const H=heap();for(let i=0;i<NL*NC;i++)if(grid[i]){wd[i]=0;H.push(i,0);}while(H.h.length){const[v,c]=H.pop();if(v>wd[c])continue;const l=(c/NC)|0,r=c%NC,cx=r%GW,cy=(r/GW)|0;for(const[dx,dy,w]of NB){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=idx(l,nx,ny),nv=v+w*CS;if(nv<wd[n]){wd[n]=nv;H.push(n,nv);}}}})();
const wgx=new Float32Array(NL*NC),wgy=new Float32Array(NL*NC),cost=new Float32Array(NL*NC);
for(let l=0;l<NL;l++)for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const i=idx(l,x,y);const gx=wd[idx(l,x+1,y)]-wd[idx(l,x-1,y)],gy=wd[idx(l,x,y+1)]-wd[idx(l,x,y-1)],m=Math.hypot(gx,gy)||1;wgx[i]=gx/m;wgy[i]=gy/m;cost[i]=1+3*Math.max(0,1-wd[i]/1.2);}
const linksAt=new Map();LINKS.forEach((k,j)=>{linksAt.set(linkNode[j][0],[j,linkNode[j][1]]);linksAt.set(linkNode[j][1],[j,linkNode[j][0]]);});
const F=[],FX=[],FY=[];
EXITS.forEach((e,k)=>{const f=new Float64Array(NL*NC).fill(1e9),H=heap();for(let i=0;i<NL*NC;i++)if(exitOf[i]===k){f[i]=0;H.push(i,0);}
 while(H.h.length){const[v,c]=H.pop();if(v>f[c])continue;const l=(c/NC)|0,r=c%NC,cx=r%GW,cy=(r/GW)|0;
  for(const[dx,dy,w]of NB){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=idx(l,nx,ny);if(grid[n])continue;if(dx&&dy&&(grid[idx(l,cx+dx,cy)]||grid[idx(l,cx,cy+dy)]))continue;const nv=v+w*CS*cost[n];if(nv<f[n]){f[n]=nv;H.push(n,nv);}}
  const lk=linksAt.get(c);if(lk){const n=lk[1],nv=v+ESC_COST;if(nv<f[n]){f[n]=nv;H.push(n,nv);}}}
 const ax=new Float32Array(NL*NC),ay=new Float32Array(NL*NC);
 for(let l=0;l<NL;l++)for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=idx(l,x,y);if(grid[c]||f[c]>=1e9)continue;let sx=0,sy=0;for(const[dx,dy,w]of NB){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=idx(l,nx,ny);if(grid[n]||f[n]>=1e9)continue;if(dx&&dy&&(grid[idx(l,x+dx,y)]||grid[idx(l,x,y+dy)]))continue;const g=(f[c]-f[n])/w;if(g>0){sx+=g*dx/w;sy+=g*dy/w;}}const m=Math.hypot(sx,sy)||1;ax[c]=sx/m;ay[c]=sy/m;}
 F.push(f);FX.push(ax);FY.push(ay);});

// ---------- Plans du directeur (leviers) ----------
const SALLES=6;
const PLANS=[
 {nom:'A',guide:[],closed:[],famMul:2,phase:()=>0},
 {nom:'B',guide:[0,2,6],closed:[1],famMul:1,phase:s=>s<3?0:120},
 {nom:'C',guide:[6,3],closed:[1],famMul:1,phase:()=>0}];

// ---------- Modèles publiés (sources dans reports/instantane-4-decision-humaine.md) ----------
// Départ : log-logistique, médiane 40,5 s (1 954 spectateurs de cinéma) ; forme 3,5 = hypothèse.
// Choix de sortie : logit mixte ; familiarité +0,795 et guidage +2,739 (Lovreglio, réalité virtuelle) ;
// distance -0,08 par mètre (renormalisée pour un grand site, hypothèse) ; suivisme tiré par personne ; périmètre interdit -1,5 (hypothèse).
// Mouvement : forces sociales (Helbing et Molnár), A=25 m/s², B=0,08 m, tau=0,5 s, anisotropie 0,3 ; murs par champ de distance.
const B_DIST=0.08,B_FAM=0.795,B_GUIDE=2.739,B_ZONE=1.5,R=0.24,DT=0.1;
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const cellAt=(l,x,y)=>idx(l,Math.min(GW-1,Math.max(0,x/CS|0)),Math.min(GH-1,Math.max(0,y/CS|0)));
const blocked=(l,x,y)=>grid[cellAt(l,x-R,y-R)]||grid[cellAt(l,x+R,y-R)]||grid[cellAt(l,x-R,y+R)]||grid[cellAt(l,x+R,y+R)];
let zoneOn=true;
class Sim{
 constructor(plan,seed){this.p=PLANS[plan];this.r=rng(seed);this.T=0;this.A=[];this.out=0;this.zone=0;this.expo=0;this.t95=null;this.dmax=0;this.esc=LINKS.map(()=>[0,0]);this.den=new Uint16Array(NL*LW*LH);this.spawn();}
 g(){return Math.sqrt(-2*Math.log(this.r()+1e-9))*Math.cos(6.2832*this.r());}
 ll(med,b){const u=Math.min(.999,Math.max(.001,this.r()));return med*Math.pow(u/(1-u),1/b);}
 add(l,x0,y0,x1,y1,n,salle){const r=this.r;let k=0,tries=0;while(k<n&&tries<n*40){tries++;const sz=r()<.4?(r()<.6?2:3):1;const gx=x0+r()*(x1-x0),gy=y0+r()*(y1-y0),gid=this.A.length;
  const fam=salle>=0?(r()<.45?6:r()<.6?2:0):[0,2,3,4][r()*4|0];
  const pre=(salle>=0?this.p.phase(salle)+this.ll(40.5,3.5):this.ll(25,3.5));
  for(let j=0;j<sz&&k<n;j++){const x=gx+(r()-.5)*1.4,y=gy+(r()-.5)*1.4;if(x<x0||x>x1||y<y0||y>y1||blocked(l,x,y))continue;
   this.A.push({l,x,y,vx:0,vy:0,ex:0,ey:0,v0:Math.max(.75,1.34+.26*this.g()),pre:pre+r()*4,fam,bh:Math.max(0,1+.6*this.g()),gid,t:-1,hes:0,next:0,out:false,ride:null,salle,dens:0});k++;}}}
 spawn(){for(let s=0;s<SALLES;s++)this.add(2,7+s*14,3,19+s*14,16.5,60,s);this.add(2,10,20,90,28,40,-1);this.add(1,8,20,92,40,150,-1);this.add(0,22,8,92,18,30,-1);this.add(0,62,32,96,56,20,-1);this.total=this.A.length;}
 avail(k){return EXITS[k].open&&!this.p.closed.includes(k);}
 choose(a,herd){let s=0;const u=[];const c=cellAt(a.l,a.x,a.y);for(let k=0;k<EXITS.length;k++){if(!this.avail(k)||F[k][c]>=1e9){u.push(0);continue;}
  let V=-B_DIST*F[k][c]+(a.fam===k?B_FAM*this.p.famMul:0)+(this.p.guide.includes(k)&&this.T>a.pre?B_GUIDE:0)-(zoneOn&&EXITS[k].zone?B_ZONE:0)+a.bh*(herd[k]||0);
  const e=Math.exp(Math.max(-30,Math.min(30,V)));u.push(e);s+=e;}
  if(!s)return -1;let x=this.r()*s;for(let k=0;k<u.length;k++){x-=u[k];if(x<=0)return k;}return u.length-1;}
 step(){const dt=DT;this.T+=dt;const H=new Map(),key=(l,x,y)=>l*100000+(x|0)*256+(y|0);
  for(const a of this.A){if(a.out||a.ride)continue;const kk=key(a.l,a.x,a.y);let L=H.get(kk);if(!L)H.set(kk,L=[]);L.push(a);}
  for(const a of this.A){if(a.out)continue;
   if(a.ride){if(this.T>=a.ride.t1){const k=LINKS[a.ride.j],up=a.ride.up;a.l=up?k[3]:k[0];a.x=(up?k[4]:k[1])+(this.r()-.5);a.y=(up?k[5]:k[2])+(this.r()-.5);a.ride=null;a.next=0;}continue;}
   if(this.T<a.pre)continue;
   if(a.t<0||!this.avail(a.t)){if(a.t>=0&&a.hes<=0)a.hes=2+this.r()*3;if(a.hes>0){a.hes-=dt;a.vx*=.7;a.vy*=.7;if(a.hes>0)continue;}a.next=0;}
   if(this.T>=a.next){const herd={};let nn=0;for(let ix=-4;ix<=4;ix++)for(let iy=-4;iy<=4;iy++){const L=H.get(key(a.l,a.x+ix,a.y+iy));if(!L)continue;for(const b of L){if(b===a||b.t<0||this.T<b.pre)continue;herd[b.t]=(herd[b.t]||0)+1;nn++;}}if(nn)for(const k in herd)herd[k]/=nn;
    const prev=a.t;const k=a.t<0||!this.avail(a.t)||this.r()<.1?this.choose(a,herd):a.t;a.t=k;a.next=this.T+10;if(k<0)continue;}
   const c=cellAt(a.l,a.x,a.y);
   if(exitOf[c]>=0&&this.avail(exitOf[c])){a.out=true;this.out++;if(EXITS[exitOf[c]].zone)this.zone++;continue;}
   const lk=linksAt.get(c);if(lk){const j=lk[0],up=LINKS[j][0]===a.l;const other=lk[1];if(F[a.t][other]+ESC_COST<=F[a.t][c]+.5){const d=up?0:1;if(this.T>=this.esc[j][d]){this.esc[j][d]=this.T+ESC_GAP;a.ride={j,up,t0:this.T,t1:this.T+ESC_T,fx:a.x,fy:a.y};continue;}a.vx*=.5;a.vy*=.5;continue;}}
   let ex=FX[a.t][c],ey=FY[a.t][c];ex=.65*ex+.35*a.ex;ey=.65*ey+.35*a.ey;const m=Math.hypot(ex,ey)||1;ex/=m;ey/=m;a.ex=ex;a.ey=ey;
   let ax=(a.v0*ex-a.vx)/.5,ay=(a.v0*ey-a.vy)/.5,crowd=0;
   for(let ix=-2;ix<=2;ix++)for(let iy=-2;iy<=2;iy++){const L=H.get(key(a.l,a.x+ix,a.y+iy));if(!L)continue;for(const b of L){if(b===a)continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1e-3;if(d>2)continue;if(d<1.13)crowd++;const nx=dx/d,ny=dy/d,cos=-(nx*ex+ny*ey),w=.3+.7*(1+cos)/2,f=25*Math.exp((2*R-d)/.08)*w;ax+=f*nx;ay+=f*ny;if(b.gid===a.gid&&d>1.6){ax-=.8*nx;ay-=.8*ny;}}}
   a.dens=crowd;
   const wdd=wd[c];if(wdd<1){const f=30*Math.exp((R-wdd)/.12);ax+=f*wgx[c];ay+=f*wgy[c];}
   a.vx+=ax*dt;a.vy+=ay*dt;const sp=Math.hypot(a.vx,a.vy),vm=1.25*a.v0;if(sp>vm){a.vx*=vm/sp;a.vy*=vm/sp;}
   const nx=a.x+a.vx*dt,ny=a.y+a.vy*dt;if(!blocked(a.l,nx,a.y))a.x=nx;else a.vx*=-.1;if(!blocked(a.l,a.x,ny))a.y=ny;else a.vy*=-.1;}
  for(const L of H.values())for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.out||b.out)continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<2*R*.92&&d>1e-4){const p=(2*R*.92-d)/2,px=dx/d*p,py=dy/d*p;if(!blocked(a.l,a.x+px,a.y+py)){a.x+=px;a.y+=py;}if(!blocked(b.l,b.x-px,b.y-py)){b.x-=px;b.y-=py;}}}
  if(Math.round(this.T/DT)%5===0){this.den.fill(0);for(const a of this.A)if(!a.out&&!a.ride){const i=a.l*LW*LH+(a.y|0)*LW+(a.x|0);this.den[i]++;}let e=0;for(let i=0;i<this.den.length;i++){const d=this.den[i];if(d>this.dmax)this.dmax=d;if(d>4)e+=d;}this.expo+=e*DT*5;}
  if(this.t95===null&&this.out>=.95*this.total)this.t95=this.T;}
 done(){return this.out>=this.total||this.T>1200;}
}


const init=Date.now()-T0;const res=[];
for(const p of [0,1,2]){const t0=Date.now();const S=new Sim(p,19102026);let steps=0;while(!S.done()){S.step();steps++;}
let inWall=0;for(const a of S.A){if(!a.out&&!a.ride&&grid[cellAt(a.l,a.x,a.y)])inWall++;}
const lv=[0,0,0];for(const a of S.A)if(!a.out)lv[a.l]++;
res.push({plan:'ABC'[p],total:S.total,out:S.out,t95:S.t95&&Math.round(S.t95),simT:Math.round(S.T),expo:Math.round(S.expo),zone:S.zone,dmax:S.dmax,inWall,leftByLevel:lv,msPerStep:+((Date.now()-t0)/steps).toFixed(2)});}
console.log('init ms',init);for(const r of res)console.log(JSON.stringify(r));
