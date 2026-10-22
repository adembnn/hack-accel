// Navigation façon Blender (lot maquette-navigation, ticket #40).
// Surcharge : remplace les gestes souris d'OrbitControls (le tactile reste à OrbitControls),
// ajoute le clavier, et bloque tout vol de caméra non demandé (il devient une proposition « Aller voir »).
(function(){
'use strict';
if(typeof cam==='undefined'||typeof ctl==='undefined'||typeof rnd==='undefined'){console.warn('navigation.js : caméra introuvable');return;}
const V=THREE.Vector3,cv=rnd.domElement,Y=new V(0,1,0);
const FOV0=cam.fov,FOV_O=6,tanH=f=>Math.tan(f*Math.PI/360);
const D_MIN=4,D_MAX=2600,POL_MIN=.001,POL_MAX=Math.PI/2;       // distances en « équivalent perspective 42° »
let ortho=false;
const kOrtho=()=>tanH(FOV0)/tanH(FOV_O);                          // facteur de distance pour garder la même taille apparente
const kNow=()=>ortho?kOrtho():1;

// ---------- réglages d'OrbitControls (il reste responsable du tactile et du verrou final) ----------
ctl.mouseButtons={LEFT:-1,MIDDLE:-1,RIGHT:-1};
ctl.enableDamping=true;ctl.dampingFactor=.12;
ctl.minPolarAngle=POL_MIN;ctl.maxPolarAngle=POL_MAX;
function limites(){ctl.minDistance=D_MIN*kNow();ctl.maxDistance=D_MAX*kNow();}limites();

// ---------- état ----------
const st={pivot:null,mode:null,lx:0,ly:0,pend:{yaw:0,pitch:0,px:0,py:0,zoom:0},zp:null,zpT:0,zpXY:[0,0]};
let tween=null;
const stopAuto=()=>{tween=null;try{if(typeof fly!=='undefined')fly=null;}catch(e){}};
const dirOf=()=>cam.position.clone().sub(ctl.target);
const sph=()=>{const d=dirOf(),r=d.length();return {r,pol:Math.acos(Math.max(-1,Math.min(1,d.y/(r||1)))),az:Math.atan2(d.x,d.z)};};
const fromSph=(s,t)=>new V(Math.sin(s.pol)*Math.sin(s.az),Math.cos(s.pol),Math.sin(s.pol)*Math.cos(s.az)).multiplyScalar(s.r).add(t);

// ---------- rayon sous le curseur (meshes visibles seulement) ----------
const ray2=new THREE.Raycaster(),ndc=new THREE.Vector2();
function meshes(){const out=[];(function w(o){if(!o.visible)return;if((o.isMesh)&&o.material&&o.material.visible!==false&&!(o.material.opacity===0))out.push(o);o.children.forEach(w);})(scene);return out;}
function setRay(x,y){const r=cv.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);ray2.setFromCamera(ndc,cam);}
function pointUnder(x,y,fallback){
  setRay(x,y);
  const hs=ray2.intersectObjects(meshes(),false).filter(h=>h.distance>.5);
  if(hs.length&&hs[0].distance<9000)return hs[0].point.clone();
  const p=new V();if(ray2.ray.intersectPlane(new THREE.Plane(Y,0),p)&&p.distanceTo(cam.position)<9000)return p;
  return fallback;
}

// ---------- transformations de la caméra ----------
// rotation rigide de (caméra, cible) autour du pivot P : lacet autour de Y, tangage autour de l'axe droit de la caméra
function orbiter(P,yaw,pitch){
  const d=dirOf(),r=d.length(),pol=Math.acos(Math.max(-1,Math.min(1,d.y/(r||1))));
  const np=Math.max(POL_MIN,Math.min(POL_MAX,pol+pitch));pitch=np-pol;
  const ax=new V().crossVectors(Y,d);if(ax.lengthSq()<1e-12)ax.set(1,0,0);ax.normalize();
  const f=v=>{if(Math.abs(pitch)>1e-9)v.applyAxisAngle(ax,pitch);if(Math.abs(yaw)>1e-9)v.applyAxisAngle(Y,yaw);return v;};
  cam.position.copy(f(cam.position.clone().sub(P)).add(P));
  ctl.target.copy(f(ctl.target.clone().sub(P)).add(P));
}
function panner(dx,dy){ // en pixels écran
  const h=cv.clientHeight||innerHeight,dist=cam.position.distanceTo(ctl.target),k=2*dist*tanH(cam.fov)/h;
  const e=cam.matrix.elements,right=new V(e[0],e[1],e[2]),up=new V(e[4],e[5],e[6]);
  const m=right.multiplyScalar(-dx*k).add(up.multiplyScalar(dy*k));
  cam.position.add(m);ctl.target.add(m);
}
function zoomer(P,factor){ // homothétie de rapport factor autour de P : P garde sa place à l'écran
  const dist=cam.position.distanceTo(ctl.target),nd=dist*factor,k=kNow();
  if(nd<D_MIN*k)factor=D_MIN*k/dist;else if(nd>D_MAX*k)factor=D_MAX*k/dist;
  if(Math.abs(factor-1)<1e-6)return;
  cam.position.copy(cam.position.clone().sub(P).multiplyScalar(factor).add(P));
  ctl.target.copy(ctl.target.clone().sub(P).multiplyScalar(factor).add(P));
}
function cadrerPlancher(){ // jamais sous le sol quand la cible est à la surface
  if(ctl.target.y>=-1&&cam.position.y<.5)cam.position.y=.5;
}

// ---------- boucle : lissage léger des gestes + animations de vue ----------
let lastT=performance.now();
function avancer(dt){
  const a=1-Math.pow(1-.35,dt*60),p=st.pend;
  if(tween){tween.k=Math.min(1,tween.k+dt/tween.d);const e=1-Math.pow(1-tween.k,3);
    const s={r:tween.a.r+(tween.b.r-tween.a.r)*e,pol:tween.a.pol+(tween.b.pol-tween.a.pol)*e,az:tween.a.az+tween.da*e};
    const t=tween.t0.clone().lerp(tween.t1,e);ctl.target.copy(t);cam.position.copy(fromSph(s,t));if(tween.k>=1)tween=null;}
  if(Math.abs(p.yaw)+Math.abs(p.pitch)>1e-5){const P=st.pivot||ctl.target.clone();orbiter(P,p.yaw*a,p.pitch*a);p.yaw*=1-a;p.pitch*=1-a;}
  if(Math.abs(p.px)+Math.abs(p.py)>.01){panner(p.px*a,p.py*a);p.px*=1-a;p.py*=1-a;}
  if(Math.abs(p.zoom)>1e-4){const z=p.zoom*a;p.zoom-=z;zoomer(st.zp||ctl.target,Math.exp(z));}
  cadrerPlancher();
}
requestAnimationFrame(function boucle(now){requestAnimationFrame(boucle);const dt=Math.min(.1,(now-lastT)/1000);lastT=now;avancer(dt);});

// ---------- souris ----------
function pointeurSouris(e){return e.pointerType==='mouse'||e.pointerType===undefined||e.pointerType==='';}
addEventListener('pointerdown',e=>{
  if(e.target!==cv||!pointeurSouris(e))return;
  let mode=null;
  if(e.button===1)mode=e.ctrlKey?'zoom':e.shiftKey?'pan':'orbit';
  else if(e.button===0&&e.altKey)mode=e.shiftKey?'pan':'orbit';           // émulation 3 boutons
  else if(e.button===2){e.preventDefault();e.stopImmediatePropagation();return;}
  if(!mode)return;
  e.preventDefault();e.stopImmediatePropagation();stopAuto();
  st.mode=mode;st.lx=e.clientX;st.ly=e.clientY;st.pend.yaw=st.pend.pitch=st.pend.px=st.pend.py=0;
  st.pivot=mode==='orbit'?pointUnder(e.clientX,e.clientY,ctl.target.clone()):null;
  st.id=e.pointerId;try{cv.setPointerCapture(e.pointerId);}catch(x){}
  cv.style.cursor=mode==='orbit'?'grabbing':mode==='pan'?'move':'zoom-in';
},true);
addEventListener('mousedown',e=>{if(e.target===cv&&(e.button===1||e.button===2))e.preventDefault();},true); // pas de défilement automatique
addEventListener('auxclick',e=>{if(e.target===cv)e.preventDefault();},true);
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointermove',e=>{
  if(!st.mode)return;
  e.stopImmediatePropagation();
  const dx=e.clientX-st.lx,dy=e.clientY-st.ly;st.lx=e.clientX;st.ly=e.clientY;const p=st.pend;
  if(st.mode==='orbit'){p.yaw+=-dx*.0055;p.pitch+=-dy*.0055;}
  else if(st.mode==='pan'){p.px+=dx;p.py+=dy;}
  else{p.zoom+=dy*.006;st.zp=ctl.target;}
},true);
function fin(e){if(!st.mode)return;e.stopImmediatePropagation();st.mode=null;st.pivot=null;cv.style.cursor='';try{cv.releasePointerCapture(st.id);}catch(x){}}
addEventListener('pointerup',fin,true);addEventListener('pointercancel',fin,true);
addEventListener('wheel',e=>{
  if(e.target!==cv)return;
  e.preventDefault();e.stopImmediatePropagation();stopAuto();
  const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?400:1);
  const now=performance.now();
  if(!st.zp||now-st.zpT>250||Math.hypot(e.clientX-st.zpXY[0],e.clientY-st.zpXY[1])>6){
    setRay(e.clientX,e.clientY);const fb2=ray2.ray.origin.clone().add(ray2.ray.direction.clone().multiplyScalar(cam.position.distanceTo(ctl.target)));
    st.zp=pointUnder(e.clientX,e.clientY,fb2);st.zpXY=[e.clientX,e.clientY];}
  st.zpT=now;
  st.pend.zoom+=Math.max(-200,Math.min(200,dy))*.0012;   // proportionnel à la distance (homothétie)
},{capture:true,passive:false});

// ---------- vues et clavier ----------
function versVue(az,pol){ // anime vers un angle en gardant cible et distance
  stopAuto();const a=sph(),b={r:a.r,pol,az};let da=az-a.az;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  tween={a,b,da,t0:ctl.target.clone(),t1:ctl.target.clone(),d:.35,k:0};
}
function pas(dyaw,dpitch){stopAuto();const a=sph();let pol=Math.max(POL_MIN,Math.min(POL_MAX,a.pol+dpitch));
  tween={a,b:{r:a.r,pol,az:a.az+dyaw},da:dyaw,t0:ctl.target.clone(),t1:ctl.target.clone(),d:.2,k:0};}
function zoomPas(f){stopAuto();const a=sph(),k=kNow();const r=Math.max(D_MIN*k,Math.min(D_MAX*k,a.r*f));
  tween={a,b:{r,pol:a.pol,az:a.az},da:0,t0:ctl.target.clone(),t1:ctl.target.clone(),d:.2,k:0};}
function setOrtho(on){
  if(on===ortho)return;stopAuto();
  const d=dirOf(),r=d.length(),k=on?kOrtho():1/kOrtho();
  ortho=on;cam.fov=on?FOV_O:FOV0;cam.far=on?60000:8000;cam.updateProjectionMatrix();
  cam.position.copy(ctl.target.clone().add(d.setLength(r*k)));
  limites();
  if(scene.fog&&scene.fog.far){const f=scene.fog;if(on){f._n0=f.near;f._f0=f.far;f.near*=kOrtho();f.far*=kOrtho();}else if(f._f0){f.near=f._n0;f.far=f._f0;delete f._f0;}}
  flash(on?'Vue orthographique (5 pour revenir)':'Vue en perspective');
}
// cadrage d'un point (touche « . ») : garde la direction de vue
let derSel=null;
function selection(){
  try{if(window.indiv&&window.indiv.sel>=0&&SIM.A&&SIM.A[window.indiv.sel]){const a=SIM.A[window.indiv.sel];return {t:new V(a.x,(typeof alt==='function'?alt(a.l):0)+1,a.z),d:45,n:'personne'};}}catch(e){}
  if(derSel&&derSel.lev){const L=derSel.lev;return {t:new V(L.x,typeof alt==='function'?alt(L.niveau||0):0,L.z),d:70,n:L.nom||'épingle'};}
  try{if(typeof ZONES!=='undefined'&&ZONES.length){const Z=ZONES[ZONES.length-1];return {t:new V(Z.x,0,Z.z),d:130,n:'zone'};}}catch(e){}
  return null;
}
function cadrer(s){const d=dirOf().setLength(s.d*kNow());volOriginal([s.t.x+d.x,s.t.y+d.y,s.t.z+d.z],[s.t.x,s.t.y,s.t.z]);}
function toutCadrer(){const t=new V(-10,-40,0),d=dirOf().setLength(340*kNow());volOriginal([t.x+d.x,t.y+d.y,t.z+d.z],[t.x,t.y,t.z]);}
function suivre(){
  const box=document.getElementById('indF'),s=window.indiv&&window.indiv.sel>=0;
  if(!box||!s){flash('Sélectionnez d’abord une personne');return;}
  box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));flash(box.checked?'Suivi activé (F pour arrêter)':'Suivi arrêté');
}
const champ=t=>t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);
addEventListener('keydown',e=>{
  if(champ(e.target)||e.metaKey||e.altKey)return;
  const c=e.code||'',k=e.key,num=c.startsWith('Numpad'),dg=/^(Digit|Numpad)(\d)$/.exec(c);
  let d=null;
  if(num&&dg)d=dg[2];else if(/^\d$/.test(k))d=k;else if(dg&&!e.shiftKey&&k!=='-'&&k!=='+')d=dg[2];  // AZERTY : & e " portent les codes Digit1.. sans Maj
  const pris=()=>{e.preventDefault();e.stopPropagation();};
  if(d==='1'){pris();versVue(e.ctrlKey?Math.PI:0,POL_MAX);return;}
  if(d==='3'){pris();versVue(e.ctrlKey?-Math.PI/2:Math.PI/2,POL_MAX);return;}
  if(d==='7'){pris();versVue(0,POL_MIN);return;}
  if(d==='5'){pris();setOrtho(!ortho);return;}
  if(d==='4'){pris();pas(-Math.PI/12,0);return;}
  if(d==='6'){pris();pas(Math.PI/12,0);return;}
  if(d==='8'){pris();pas(0,-Math.PI/12);return;}
  if(d==='2'){pris();pas(0,Math.PI/12);return;}
  if(k==='+'||c==='NumpadAdd'||(k==='='&&e.shiftKey)){pris();zoomPas(.8);return;}
  if(k==='-'||c==='NumpadSubtract'){pris();zoomPas(1.25);return;}
  if(k==='.'||c==='NumpadDecimal'||(k==='Delete'&&num)){pris();const s=selection();if(s)cadrer(s);else flash('Rien de sélectionné à cadrer');return;}
  if(k==='Home'||c==='Home'){pris();toutCadrer();return;}
  if(k==='f'||k==='F'){pris();suivre();return;}
  if(k==='?'||(k==='/'&&e.shiftKey)){pris();aide(!aideOuverte);return;}
  if(k==='Escape'&&aideOuverte){aide(false);}
},true);

// ---------- volontaire ou non ? : seuls les gestes explicites déplacent la caméra ----------
const GEST_OK='#lvGo,.ev,#navProp';
let tOk=-1e9,tToile=-1e9;
function noter(e){const t=e.target&&e.target.closest?e.target:null;if(!t)return;const n=performance.now();
  if(t.closest(GEST_OK))tOk=n;
  else if(t===cv)tToile=n;}
['pointerdown','pointerup','click'].forEach(n=>addEventListener(n,noter,true));
const volOriginal=(p,t)=>{if(ortho){const T=new V(...t),P=new V(...p);P.sub(T).multiplyScalar(kOrtho()).add(T);p=[P.x,P.y,P.z];}stopAuto();orig(p,t);};
const orig=window.camFly;
function lieu(t){let best=null,bd=70;try{LEV.forEach(L=>{const d=Math.hypot(L.x-t[0],L.z-t[2]);if(d<bd){bd=d;best=L.nom;}});}catch(e){}return best||'ce lieu';}
window.camFly=function(p,t){
  const n=performance.now();
  if(n-tOk<350){volOriginal(p,t);return;}
  if(n-tToile<350)return;                                           // sélection d'une personne au clic : pas de vol, « . » pour cadrer
  proposer(p,t);
};
// la touche « . » et les boutons « Aller voir » passent par volOriginal : geste explicite

// suivi : ne démarre que si l'utilisateur coche « Suivre » (la case est décochée au départ)
(function(){const b=document.getElementById('indF');if(b)b.checked=false;})();

// mémoire de la dernière épingle ouverte (pour « . »)
if(typeof levInfo==='function'){const o=levInfo;window.levInfo=function(L){derSel={lev:L};return o.apply(this,arguments);};}

// ---------- interface : proposition + aide ----------
const st1=document.createElement('style');
st1.textContent=`
#navProp{position:fixed;left:50%;bottom:54px;transform:translateX(-50%);z-index:9;display:none;gap:8px;align-items:center;padding:6px 10px;font-size:12px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px}
#navProp.on{display:flex}#navProp button{border-color:var(--acc);color:var(--acc)}
#navMsg{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9;padding:4px 10px;font-size:12px;background:var(--panel);color:var(--ink2);border:1px solid var(--line);border-radius:6px;display:none}
#navMsg.on{display:block}
#navHelpB{position:fixed;right:12px;bottom:46px;z-index:9;width:26px;height:26px;padding:0;border-radius:13px;color:var(--ink2)}
#navHelp{position:fixed;right:12px;bottom:80px;z-index:9;width:310px;max-width:calc(100vw - 24px);padding:10px 12px;font-size:11.5px;line-height:1.55;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;display:none}
#navHelp.on{display:block}#navHelp b{font-size:11px;letter-spacing:.06em;color:var(--ink2);font-weight:500;text-transform:uppercase;display:block;margin:6px 0 2px}
#navHelp kbd{font:inherit;color:var(--acc);border:1px solid var(--line);border-radius:3px;padding:0 4px}
@media (max-width:760px){#navHelpB,#navHelp{display:none!important}}`;
document.head.appendChild(st1);
const prop=document.createElement('div');prop.id='navProp';document.body.appendChild(prop);
const msg=document.createElement('div');msg.id='navMsg';document.body.appendChild(msg);
let tProp=0,tMsg=0;
function proposer(p,t){
  prop.innerHTML='';const s=document.createElement('span');s.textContent='Quelque chose se passe : ';
  const b=document.createElement('button');b.textContent='Aller voir → '+lieu(t);
  b.onclick=()=>{prop.classList.remove('on');volOriginal(p,t);};
  prop.append(s,b);prop.classList.add('on');
  clearTimeout(tProp);tProp=setTimeout(()=>prop.classList.remove('on'),7000);
  window.navStats.propositions++;
}
function flash(t){msg.textContent=t;msg.classList.add('on');clearTimeout(tMsg);tMsg=setTimeout(()=>msg.classList.remove('on'),2000);}
const aideB=document.createElement('button');aideB.id='navHelpB';aideB.textContent='?';aideB.title='Aide navigation (?)';
const aideP=document.createElement('div');aideP.id='navHelp';
aideP.innerHTML=`<b>Souris</b>
<kbd>milieu</kbd> orbite · <kbd>Maj</kbd>+milieu panoramique · <kbd>Ctrl</kbd>+milieu zoom<br>
<kbd>molette</kbd> zoom vers le curseur · clic gauche : sélection<br>
Sans bouton du milieu : <kbd>Alt</kbd>+clic gauche orbite, <kbd>Maj</kbd>+<kbd>Alt</kbd> panoramique
<b>Clavier (pavé numérique ou chiffres)</b>
<kbd>1</kbd> face · <kbd>Ctrl</kbd>+<kbd>1</kbd> arrière · <kbd>3</kbd> est · <kbd>Ctrl</kbd>+<kbd>3</kbd> ouest · <kbd>7</kbd> dessus<br>
<kbd>5</kbd> perspective / orthographique · <kbd>2</kbd><kbd>4</kbd><kbd>6</kbd><kbd>8</kbd> pas de 15°<br>
<kbd>+</kbd> <kbd>−</kbd> zoom · <kbd>.</kbd> cadrer la sélection · <kbd>Origine</kbd> tout cadrer<br>
<kbd>F</kbd> suivre la personne sélectionnée · <kbd>?</kbd> cette aide
<b>Caméra</b>
Elle ne bouge que sur votre geste. Le reste devient « Aller voir ».`;
document.body.append(aideP,aideB);
let aideOuverte=false;
function aide(o){aideOuverte=o;aideP.classList.toggle('on',o);}
aideB.onclick=()=>aide(!aideOuverte);

// ---------- accès pour les tests ----------
window.navStats={propositions:0};
window.nav={avancer:(n)=>{for(let i=0;i<n;i++){avancer(1/60);ctl.update();}},etat:()=>({cam:cam.position.toArray().map(v=>+v.toFixed(2)),cible:ctl.target.toArray().map(v=>+v.toFixed(2)),fov:cam.fov,ortho,vol:(typeof fly!=='undefined'&&!!fly)||!!tween}),setOrtho,proposition:()=>prop.classList.contains('on')?prop.textContent:null,aideOuverte:()=>aideOuverte};
})();
