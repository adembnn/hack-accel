// Cortèges et groupes en mouvement (lot « maquette-cortege »).
// Un groupe = une zone D1 (manifestation) ou D2 (troubles) qui se DÉPLACE le long des vraies rues OpenStreetMap (SCN.rues).
// La zone est enregistrée dans ZONES (leviers.js) : levRefresh() fait donc le travail déjà en place :
//   D1 : les portes à moins de r + 25 m passent « à éviter » (G.zone) ; D2 : celles à moins de r + 10 m sont bloquées (G.open = false) ;
//   quand le groupe s'éloigne, elles redeviennent normales. Clic sur l'étiquette = retrait (même geste que les zones fixes).
// Interface (appelée par directeur.js) : window.cortege = { ajouter, retirer, lever, liste } (+ outils : echelle, _tick, _mesure).
// Vitesse par défaut 3 km/h : ordre de grandeur d'un cortège dense (marche libre ~4,8 km/h, cortège ralenti par la densité) — ESTIMÉ, non sourcé.
// Effectif : de 50 à 5 000. Rayon physique estimé à 1,5 pers./m² (cortège dense, estimé) ; zone d'influence = rayon physique + marge.
(function(){
 const ECHELLE={v:1};                       // accélérateur de démonstration (1 = temps réel)
 const G={};                                // groupes actifs par id
 const PEND=[];                             // demandes arrivées avant la fin du chargement de la scène
 let n=0,graphe=null,ready=false,lastSig='',acc=0;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

 // ---------- graphe des rues : sommets des polylignes, liens entre points voisins (<= 3 m) ----------
 function buildGraph(){
  const X=[],Z=[],NM=[],adj=[];const cell=3,H=new Map();
  const add=(x,z)=>{const i=X.length;X.push(x);Z.push(z);adj.push([]);const k=Math.floor(x/cell)+','+Math.floor(z/cell);let l=H.get(k);if(!l)H.set(k,l=[]);l.push(i);return i;};
  const link=(a,b,nm)=>{if(a===b)return;const w=Math.hypot(X[a]-X[b],Z[a]-Z[b]);adj[a].push({v:b,w,nm});adj[b].push({v:a,w,nm});};
  SCN.rues.forEach(o=>{if(!o.p||o.p.length<4)return;let prev=-1;for(let i=0;i<o.p.length;i+=2){const c=add(o.p[i],o.p[i+1]);if(prev>=0)link(prev,c,o.n||'');prev=c;}});
  // jonction : deux sommets à moins de 3 m se rejoignent (cases voisines comprises)
  for(let i=0;i<X.length;i++){const cx=Math.floor(X[i]/cell),cz=Math.floor(Z[i]/cell);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const l=H.get((cx+dx)+','+(cz+dz));if(!l)continue;for(const j of l){if(j<=i)continue;if(Math.hypot(X[i]-X[j],Z[i]-Z[j])<=3)link(i,j,'');}}}
  return{X,Z,adj,H,cell};}
 function nearest(g,x,z){let best=-1,bd=1e9;const cx=Math.floor(x/g.cell),cz=Math.floor(z/g.cell);
  for(let R=1;R<=40&&best<0;R+=3){for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++){const l=g.H.get((cx+dx)+','+(cz+dz));if(!l)continue;for(const j of l){const d=Math.hypot(g.X[j]-x,g.Z[j]-z);if(d<bd){bd=d;best=j;}}}}
  return{i:best,d:bd};}
 // tas binaire pour Dijkstra
 function heap(){const a=[];return{n:()=>a.length,push(k,v){a.push([k,v]);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}},
  pop(){const t=a[0],l=a.pop();if(a.length){a[0]=l;let i=0;for(;;){let m=i;const L=2*i+1,R=L+1;if(L<a.length&&a[L][0]<a[m][0])m=L;if(R<a.length&&a[R][0]<a[m][0])m=R;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}return t;}};}
 // trajet : [{x,z,nm}] ; nm = nom de la rue du tronçon qui MÈNE à ce point. Ligne droite si pas de chemin.
 function route(dep,arr){
  if(!arr)return[{x:dep.x,z:dep.z,nm:''}];
  const g=graphe||(graphe=buildGraph());const a=nearest(g,dep.x,dep.z),b=nearest(g,arr.x,arr.z);
  const droit=()=>[{x:dep.x,z:dep.z,nm:''},{x:arr.x,z:arr.z,nm:''}];
  if(a.i<0||b.i<0||a.d>80||b.d>80)return droit();
  const D=new Float64Array(g.X.length).fill(1e18),P=new Int32Array(g.X.length).fill(-1),PN=new Array(g.X.length);const h=heap();D[a.i]=0;h.push(0,a.i);
  while(h.n()){const[d,u]=h.pop();if(d>D[u])continue;if(u===b.i)break;for(const e of g.adj[u]){const nd=d+e.w;if(nd<D[e.v]){D[e.v]=nd;P[e.v]=u;PN[e.v]=e.nm;h.push(nd,e.v);}}}
  if(D[b.i]>=1e17)return droit();
  const ch=[];for(let u=b.i;u>=0;u=P[u])ch.push({x:g.X[u],z:g.Z[u],nm:PN[u]||''});ch.reverse();
  const pts=[{x:dep.x,z:dep.z,nm:''},...ch,{x:arr.x,z:arr.z,nm:''}];
  // le tronçon d'accès hérite du nom de la rue voisine ; les tronçons sans nom (jonctions) héritent du précédent
  for(let i=1;i<pts.length;i++)if(!pts[i].nm)pts[i].nm=(i>1?pts[i-1].nm:'')||(pts[2]&&pts[2].nm)||'';
  const out=[pts[0]];for(let i=1;i<pts.length;i++)if(Math.hypot(pts[i].x-out[out.length-1].x,pts[i].z-out[out.length-1].z)>.05)out.push(pts[i]);
  return out.length>1?out:[out[0]];}

 // ---------- noms ----------
 function rueProche(x,z){if(!graphe)graphe=buildGraph();const g=graphe;const i=nearest(g,x,z).i;if(i<0)return'';const e=g.adj[i].find(e=>e.nm);return e?e.nm:'';}
 function lieuProche(p){if(typeof LEV!=='undefined'){let b=null,bd=45;LEV.forEach(L=>{if(L.type!=='porte')return;const d=Math.hypot(L.x-p.x,L.z-p.z);if(d<bd){bd=d;b=L;}});if(b)return b.nom;}
  const r=rueProche(p.x,p.z);return r||'';}
 const mini=s=>s.replace(/^Rue /,'rue ').replace(/^Place /,'place ').replace(/^Boulevard /,'boulevard ').replace(/^Avenue /,'avenue ');

 // ---------- visuels ----------
 const colOf=c=>c==='D2'?0xb71c1c:0xe65100;
 function etiq(g){const nm=g.nom+' · '+g.effectif+' pers. · '+(g.rue?mini(g.rue):'rue')+(g.destNom&&!g.fini?' → '+mini(g.destNom):g.fini?' (arrivé)':'');
  if(nm===g.etiqTxt)return;g.etiqTxt=nm;const t=textTex(nm,'#'+colOf(g.code).toString(16).padStart(6,'0'),'#fff');
  if(g.sprite.material.map)g.sprite.material.map.dispose();g.sprite.material.map=t;g.sprite.material.needsUpdate=true;g.sprite.scale.set(.022*t.userData.w/48,.022,1);}
 function visuels(g){
  const col=colOf(g.code),grp=new THREE.Group();
  const disk=new THREE.Mesh(new THREE.CircleGeometry(g.r,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.22,depthWrite:false}));disk.rotation.x=-Math.PI/2;disk.position.y=.6;grp.add(disk);
  const ring=new THREE.Mesh(new THREE.RingGeometry(g.r-1,g.r,56),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.7;grp.add(ring);
  const nb=Math.max(24,Math.min(220,Math.round(Math.sqrt(g.effectif)*4.5)));g.nb=nb;
  const im=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.28,1.7,6),new THREE.MeshLambertMaterial({color:0xffffff}),nb);
  const C=new THREE.Color();g.off=[];for(let i=0;i<nb;i++){const a=Math.random()*2-1,b=Math.random()*2-1;g.off.push([a*g.Lh,b*g.Wh,Math.random()*6.283]);
   C.setHex(i%3===0?0xff7043:i%3===1?col:0xffa000);im.setColorAt(i,C);}
  im.frustumCulled=false;grp.add(im);g.im=im;
  // flèche de direction, posée devant le groupe
  const ar=new THREE.Mesh(new THREE.ConeGeometry(2.6,7,3),new THREE.MeshBasicMaterial({color:col,depthTest:false,transparent:true,opacity:.95}));ar.geometry.rotateZ(-Math.PI/2);ar.geometry.rotateX(Math.PI/2*0);ar.position.y=2.2;ar.renderOrder=22;ar.visible=false;grp.add(ar);g.arrow=ar;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({sizeAttenuation:false,depthTest:false,transparent:true}));sp.center.set(.5,0);sp.position.set(0,18,0);sp.renderOrder=23;grp.add(sp);g.sprite=sp;
  return grp;}

 // ---------- cycle de vie ----------
 function creer(p,id){
  const code=p.code==='D2'?'D2':'D1',eff=Math.max(50,Math.min(5000,Math.round(p.effectif||(code==='D1'?800:120))));
  const rp=Math.sqrt(eff/(1.5*Math.PI));                       // rayon physique à 1,5 pers./m² (estimé)
  const r=code==='D1'?Math.max(30,rp+22):Math.max(25,rp+12);
  const v=Math.max(.3,(p.vitesse_kmh||3))/3.6;
  const dep={x:p.depart.x,z:p.depart.z},arr=p.arrivee?{x:p.arrivee.x,z:p.arrivee.z}:null;
  const pts=route(dep,arr);const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));
  const g={id,code,nom:p.nom||(code==='D1'?'Cortège':'Troubles'),effectif:eff,r,v,pts,cum,len:cum[cum.length-1],s:0,x:dep.x,z:dep.z,hx:1,hz:0,arr,fini:!arr||cum[cum.length-1]<.5,
   Lh:Math.max(5,Math.min(55,eff/(1.5*8)/2)),Wh:Math.min(4,Math.max(2,rp*.5)),destNom:arr?lieuProche(arr):'',rue:'',etiqTxt:''};
  g.mesh=visuels(g);
  // objet zone compatible leviers.js (ZONES) : P vide et crowd factice, car zonesTick n'anime que les zones fixes
  const Z={code,id,x:g.x,z:g.z,r,mesh:g.mesh,crowd:{instanceMatrix:{needsUpdate:false}},P:[],cortege:true};
  g.Z=Z;g.sprite.userData.zone=Z;
  zoneGrp.add(g.mesh);ZONES.push(Z);G[id]=g;place(g,0);levRefresh();lastSig=signature();return id;}

 // position au long du trajet (abscisse curviligne s) + cap + nom de rue courant
 function place(g){
  const L=g.len;let s=Math.min(g.s,L);
  if(L>0){let i=1;while(i<g.pts.length-1&&g.cum[i]<s)i++;const a=g.pts[i-1],b=g.pts[i],sl=g.cum[i]-g.cum[i-1]||1,t=(s-g.cum[i-1])/sl;
   g.x=a.x+(b.x-a.x)*t;g.z=a.z+(b.z-a.z)*t;const dx=b.x-a.x,dz=b.z-a.z,m=Math.hypot(dx,dz)||1;g.hx=dx/m;g.hz=dz/m;if(b.nm)g.rue=b.nm;}
  else{g.x=g.pts[0].x;g.z=g.pts[0].z;}
  if(!g.rue)g.rue=rueProche(g.x,g.z);
  g.Z.x=g.x;g.Z.z=g.z;g.mesh.position.set(g.x,0,g.z);
  g.arrow.visible=!g.fini;if(!g.fini){g.arrow.position.set(g.hx*(g.Lh+8),2.2,g.hz*(g.Lh+8));g.arrow.rotation.y=-Math.atan2(g.hz,g.hx);}
  etiq(g);}

 function signature(){ // état des portes, issues et bouches concernées : on ne recalcule levRefresh que si ça change
  let s='';ZONES.forEach(Z=>{if(Z.cortege)s+=Z.code;});
  if(typeof LEV==='undefined')return s;
  for(const L of LEV){if(L.type!=='porte'&&L.type!=='issue'&&L.type!=='incendie')continue;let f=0;for(const Z of ZONES){if(!Z.cortege)continue;const d=Math.hypot(L.x-Z.x,L.z-Z.z);if(d<Z.r+25)f|=Z.code==='D2'&&d<Z.r+10?2:1;}s+=f;}
  return s;}

 let t=0;
 function tick(dt){
  if(!ready)return;
  // retrait extérieur (clic sur l'étiquette, directeur : removeZone) : on oublie le groupe
  for(const id in G){if(!ZONES.includes(G[id].Z)){dispose(G[id]);delete G[id];}}
  const ids=Object.keys(G);if(!ids.length)return;t+=dt;
  const M=new THREE.Matrix4(),m=M.elements;
  for(const id of ids){const g=G[id];
   if(!g.fini){g.s+=g.v*dt*ECHELLE.v;if(g.s>=g.len){g.s=g.len;g.fini=true;}place(g);}
   // la foule : décalages le long du cap, petites oscillations de marche
   const arr=g.im.instanceMatrix.array,fx=g.hx,fz=g.hz;
   for(let i=0;i<g.nb;i++){const o=g.off[i];const b=g.fini?0:Math.abs(Math.sin(t*6+i))*.1;const ox=o[0]*fx-o[1]*fz+Math.cos(t*.8+o[2])*.3,oz=o[0]*fz+o[1]*fx+Math.sin(t*.8+o[2])*.3;
    const k=i*16;arr[k]=1;arr[k+1]=0;arr[k+2]=0;arr[k+3]=0;arr[k+4]=0;arr[k+5]=1;arr[k+6]=0;arr[k+7]=0;arr[k+8]=0;arr[k+9]=0;arr[k+10]=1;arr[k+11]=0;arr[k+12]=ox;arr[k+13]=.85+b;arr[k+14]=oz;arr[k+15]=1;}
   g.im.instanceMatrix.needsUpdate=true;}
  acc+=dt;if(acc>=.2){acc=0;const sg=signature();if(sg!==lastSig){lastSig=sg;levRefresh();}}}
 function dispose(g){if(g.im){g.im.geometry.dispose();g.im.material.dispose();}if(g.sprite.material.map)g.sprite.material.map.dispose();}

 function retirerG(id){const g=G[id];if(!g)return false;if(ZONES.includes(g.Z))removeZone(g.Z);dispose(g);delete G[id];lastSig=signature();return true;}

 // ---------- interface publique ----------
 window.cortege={
  ajouter(p){const id='cortege-'+(++n);if(!p||!p.depart)throw new Error('cortege.ajouter : depart {x,z} requis');
   if(ready)creer(p,id);else PEND.push([p,id]);return id;},
  retirer(id){return retirerG(id);},
  lever(f){f=f||{};let k=0;Object.keys(G).forEach(id=>{const g=G[id];if(f.code&&g.code!==f.code)return;if(f.pres&&Math.hypot(g.x-f.pres.x,g.z-f.pres.z)>(f.pres.r==null?g.r:f.pres.r))return;if(retirerG(id))k++;});
   if(!ready)for(let i=PEND.length-1;i>=0;i--){const[p,id]=PEND[i];if(f.code&&p.code!==f.code)continue;PEND.splice(i,1);k++;}return k;},
  liste(){return Object.values(G).map(g=>({id:g.id,code:g.code,nom:g.nom,x:g.x,z:g.z,effectif:g.effectif,vers:g.arr&&!g.fini?{x:g.arr.x,z:g.arr.z}:null}));},
  get echelle(){return ECHELLE.v;},set echelle(v){ECHELLE.v=Math.max(0,+v||1);},
  _tick:tick,_groupes:G,
  _mesure(k=300,dt=1/60){const t0=performance.now();for(let i=0;i<k;i++)tick(dt);return(performance.now()-t0)/k;}
 };

 // ---------- démarrage : attendre la scène et leviers.js ----------
 (function attendre(){
  if(typeof SCN==='undefined'||!SCN||!SCN.rues||typeof zoneGrp==='undefined'||!zoneGrp||typeof levRefresh!=='function'){setTimeout(attendre,200);return;}
  ready=true;PEND.splice(0).forEach(([p,id])=>creer(p,id));
  let last=performance.now();(function boucle(now){tick(Math.min(.1,(now-last)/1000));last=now;requestAnimationFrame(boucle);})(last);})();
})();
