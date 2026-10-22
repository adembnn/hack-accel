// Leviers du juré sur le Forum : tout ce qu'on peut ouvrir ou fermer, en épingles bien visibles et cliquables,
// reliées à la simulation (sim.js). Même format que la maquette Arena : {code,id,nom,type,x,z,niveau,etat,source,effet}.
// Codes du catalogue (reports/catalogue-perturbations.md) : B1 issue bloquée, B5 ascenseur en panne, C1 station fermée,
// D1 manifestation, D2 troubles. Bascule : toggleLever(id) ; chaque changement émet l'événement window 'levier'.
const FORUM=[-30,-20];            // centre du Forum (Canopée), repère local en mètres
const LEV=[];const ZONES=[];let levGrp=null,zoneGrp=null,labelGrp=null,placing=null;
const LEVCOL={bouche:'#1d3f8f',porte:'#0b6b45',incendie:'#c62828',ascenseur:'#5b6b7a',ferme:'#d32f2f',zone:'#e65100'};

function pinTex(glyph,bg,closed,small){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 x.beginPath();x.arc(64,58,small?34:48,0,7);x.fillStyle=closed?LEVCOL.ferme:bg;x.fill();x.lineWidth=8;x.strokeStyle='#fff';x.stroke();
 x.beginPath();x.moveTo(52,104);x.lineTo(76,104);x.lineTo(64,124);x.closePath();x.fillStyle='#fff';x.fill();
 x.fillStyle='#fff';x.font=`700 ${small?34:48}px ui-monospace,Menlo,monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(closed?'✕':glyph,64,60);
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
function textTex(s,bg,fg){const c=document.createElement('canvas');const x=c.getContext('2d');x.font='600 30px ui-monospace,Menlo,monospace';const w=Math.ceil(x.measureText(s).width)+28;
 c.width=w;c.height=48;x.font='600 30px ui-monospace,Menlo,monospace';x.fillStyle=bg;x.beginPath();x.moveTo(10,0);x.lineTo(w-10,0);x.quadraticCurveTo(w,0,w,10);x.lineTo(w,38);x.quadraticCurveTo(w,48,w-10,48);x.lineTo(10,48);x.quadraticCurveTo(0,48,0,38);x.lineTo(0,10);x.quadraticCurveTo(0,0,10,0);x.fill();
 x.fillStyle=fg;x.textBaseline='middle';x.fillText(s,14,25);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.userData={w,h:48};return t;}
const TEXC={};function pinMat(type,closed){const k=type+closed;if(!TEXC[k]){const g={bouche:'M',porte:'⇥',incendie:'BI',ascenseur:'⇅'}[type];
 TEXC[k]=new THREE.SpriteMaterial({map:pinTex(g,LEVCOL[type],closed,type==='incendie'),sizeAttenuation:false,depthTest:false,transparent:true});}return TEXC[k];}

function cellXYZ(cell){const g=SIM.g;return [g.bbox[0]+(cell[2]+.5)*g.res,alt(g.levels[cell[0]]),g.bbox[1]+(cell[1]+.5)*g.res];}
function near(x,z,r){return Math.hypot(x-FORUM[0],z-FORUM[1])<r;}

function levBuild(){levGrp=new THREE.Group();levGrp.renderOrder=10;scene.add(levGrp);zoneGrp=new THREE.Group();scene.add(zoneGrp);labelGrp=new THREE.Group();scene.add(labelGrp);
 // Portes du Forum = sorties de la simulation (B1)
 SIM.groups.forEach((G,k)=>{if(G.type!=='rue')return;const [x,y,z]=cellXYZ(G.cells[0].cell);G.zone0=G.zone;
  LEV.push({code:'B1',id:'porte-'+k,nom:G.n,type:'porte',x,z,y:Math.max(y,0),niveau:SIM.g.levels[G.cells[0].cell[0]],etat:'ouvert',source:'OpenStreetMap (porte nommée du Forum)',effet:'Sortie de la simulation : fermée, la foule repart vers une autre porte',grp:k});});
 // Bouches de métro et RER autour du Forum (C1)
 SCN.metro.forEach((o,i)=>{if(!near(o.x,o.z,420))return;LEV.push({code:'C1',id:'bouche-'+i,nom:o.n||'Accès métro',type:'bouche',x:o.x,z:o.z,y:0,niveau:0,etat:'ouvert',source:'OpenStreetMap (railway=subway_entrance)',effet:'Toutes fermées : stations du Forum fermées, les quais ne sont plus une sortie (19 oct., ~20h07)'});});
 // Ascenseurs (B5)
 SCN.ascenseurs.forEach((o,i)=>{const lv=o.l.length?Math.min(...o.l):0;LEV.push({code:'B5',id:'ascenseur-'+i,nom:o.n||'Ascenseur',type:'ascenseur',x:o.x,z:o.z,y:alt(Math.max(0,...(o.l.length?o.l:[0])))+2,niveau:lv,etat:'ouvert',source:'OpenStreetMap (highway=elevator)',effet:'En panne : les personnes à mobilité réduite de ce niveau doivent être évacuées par les secours'});});
 // Bouches d'incendie (pas un levier du juré : leur accès est bloqué si une zone les couvre)
 SCN.incendie.forEach((p,i)=>{const x=p[0]??p.x,z=p[1]??p.z;if(!near(x,z,320))return;LEV.push({code:'—',id:'incendie-'+i,nom:"Bouche d'incendie",type:'incendie',x,z,y:0,niveau:0,etat:'accessible',source:'OpenStreetMap (emergency=fire_hydrant)',effet:'Pompiers (BSPP) : doit rester dégagée ; masquée si une manifestation la couvre'});});
 LEV.forEach(L=>{const s=new THREE.Sprite(pinMat(L.type,false));s.position.set(L.x,L.y+(L.type==='incendie'?5:L.type==='bouche'?10:14),L.z);s.center.set(.5,0);
  const sc=L.type==='incendie'?.022:.034;s.scale.set(sc,sc,1);s.renderOrder=20;s.userData.lev=L;L.sprite=s;levGrp.add(s);
  if(L.type!=='incendie'){const st=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,s.position.y-L.y,6),new THREE.MeshBasicMaterial({color:new THREE.Color(LEVCOL[L.type]),transparent:true,opacity:.7,depthTest:false}));st.position.set(L.x,(s.position.y+L.y)/2,L.z);st.renderOrder=19;L.stem=st;levGrp.add(st);}});
 streetLabels();levPanel();levRefresh();}

// Noms des rues autour du Forum, pour se repérer
function streetLabels(){const best={};SCN.rues.forEach(o=>{if(!o.n||!['primary','secondary','tertiary','pedestrian','residential','living_street','unclassified'].includes(o.k))return;const pts=pairs(o.p);
  for(let i=0;i<pts.length-1;i++){const[a,c]=[pts[i],pts[i+1]];const L=Math.hypot(c[0]-a[0],c[1]-a[1]);const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2;if(!near(mx,mz,380))continue;if(!best[o.n]||L>best[o.n].L)best[o.n]={L,mx,mz};}});
 Object.entries(best).sort((a,b)=>b[1].L-a[1].L).slice(0,22).forEach(([n,b])=>{const t=textTex(n,'rgba(20,24,28,.78)','#ffffff');const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,sizeAttenuation:false,depthTest:false,transparent:true}));
  const h=.018;s.scale.set(h*t.userData.w/48,h,1);s.position.set(b.mx,3,b.mz);s.renderOrder=18;labelGrp.add(s);});}

function levRefresh(){
 // zones posées : D1 pénalise les portes proches, D2 les bloque ; elles masquent les bouches d'incendie couvertes
 const inZ=(x,z,pad,kind)=>ZONES.some(Z=>(!kind||Z.code===kind)&&Math.hypot(x-Z.x,z-Z.z)<Z.r+pad);
 LEV.forEach(L=>{if(L.type==='incendie')L.etat=inZ(L.x,L.z,0)?'masquée':'accessible';});
 SIM.groups.forEach((G,k)=>{if(G.type!=='rue')return;const L=LEV.find(l=>l.grp===k);const [x,,z]=cellXYZ(G.cells[0].cell);
  const blocked=inZ(x,z,10,'D2');const open=L.etat==='ouvert'&&!blocked;if(G.open!==open){G.open=open;simField(k);}G.zone=G.zone0||inZ(x,z,25);});
 const bou=LEV.filter(l=>l.type==='bouche'),T=SIM.groups.find(G=>G.type==='train'),k=SIM.groups.indexOf(T);const anyOpen=bou.some(l=>l.etat==='ouvert');
 if(T.open!==anyOpen){T.open=anyOpen;simField(k);}
 LEV.forEach(L=>{const closed=L.etat==='fermé'||L.etat==='masquée'||(L.type==='porte'&&!SIM.groups[L.grp].open);L.sprite.material=pinMat(L.type,closed);if(L.stem)L.stem.material.color.set(closed?LEVCOL.ferme:LEVCOL[L.type]);});
 // les cases à cocher du panneau Perturbations suivent
 document.querySelectorAll('#perturb input').forEach((inp,i)=>{if(SIM.groups[i])inp.checked=SIM.groups[i].open;});
 const nb=bou.filter(l=>l.etat==='fermé').length,np=LEV.filter(l=>l.type==='porte'&&!SIM.groups[l.grp].open).length;
 const el=document.getElementById('levSum');if(el)el.innerHTML=`Bouches fermées <b>${nb}</b>/${bou.length}${anyOpen?'':' · stations fermées (C1)'} · portes fermées <b>${np}</b> · zones <b>${ZONES.length}</b>`;
 window.dispatchEvent(new CustomEvent('levier',{detail:{leviers:LEV.map(({sprite,stem,...l})=>l),zones:ZONES.map(({mesh,...z})=>z)}}));}
function toggleLever(id){const L=LEV.find(l=>l.id===id);if(!L||L.type==='incendie')return L;L.etat=L.etat==='ouvert'?'fermé':'ouvert';levRefresh();return L;}

function levInfo(L){const d={code:L.code,type:{bouche:'Bouche de métro / RER',porte:'Porte du Forum',ascenseur:'Ascenseur',incendie:"Bouche d'incendie"}[L.type],nom:L.nom,niveau:L.niveau,état:L.etat,effet:L.effet};
 info.innerHTML=Object.entries(d).map(([k,v])=>`<div><span class="k">${k}</span> ${v}</div>`).join('')+`<div class="k" style="margin-top:6px">source : ${L.source}</div>`+(L.type==='incendie'?'':`<div class="k">Cliquez à nouveau pour ${L.etat==='ouvert'?'fermer':'rouvrir'}.</div>`);}

// Zones posées par le juré : manifestation (D1) ou troubles (D2)
function addZone(code,x,z){const r=code==='D1'?55:30;const col=code==='D1'?0xe65100:0xb71c1c;const g=new THREE.Group();
 const disk=new THREE.Mesh(new THREE.CircleGeometry(r,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.28,depthWrite:false}));disk.rotation.x=-Math.PI/2;disk.position.y=.6;g.add(disk);
 const ring=new THREE.Mesh(new THREE.RingGeometry(r-1.2,r,64),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.7;g.add(ring);
 const n=code==='D1'?140:50,crowd=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.28,1.7,6),new THREE.MeshLambertMaterial({color:col}),n);const M=new THREE.Matrix4();const P=[];
 for(let i=0;i<n;i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*r*.8;P.push([x+Math.cos(a)*d,z+Math.sin(a)*d,Math.random()*6.283]);M.makeTranslation(P[i][0],.85,P[i][1]);crowd.setMatrixAt(i,M);}g.add(crowd);
 const t=textTex(code==='D1'?'Manifestation (D1) ✕':'Troubles (D2) ✕','#'+col.toString(16).padStart(6,'0'),'#fff');const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,sizeAttenuation:false,depthTest:false}));s.scale.set(.022*t.userData.w/48,.022,1);s.position.set(x,16,z);s.center.set(.5,0);s.renderOrder=21;g.add(s);
 g.position.set(0,0,0);disk.position.x=ring.position.x=x;disk.position.z=ring.position.z=z;zoneGrp.add(g);
 const Z={code,id:'zone-'+Date.now(),x,z,r,mesh:g,crowd,P};s.userData.zone=Z;ZONES.push(Z);levRefresh();}
function removeZone(Z){zoneGrp.remove(Z.mesh);ZONES.splice(ZONES.indexOf(Z),1);levRefresh();}
let zt=0;function zonesTick(dt){zt+=dt;if(!ZONES.length)return;const M=new THREE.Matrix4();ZONES.forEach(Z=>{Z.P.forEach((p,i)=>{if((i+((zt*10)|0))%4)return;p[2]+=(Math.random()-.5)*.6;const nx=p[0]+Math.cos(p[2])*.25,nz=p[1]+Math.sin(p[2])*.25;if(Math.hypot(nx-Z.x,nz-Z.z)<Z.r*.85){p[0]=nx;p[1]=nz;}else p[2]+=3.14;M.makeTranslation(p[0],.85+Math.abs(Math.sin(zt*6+i))*.12,p[1]);Z.crowd.setMatrixAt(i,M);});Z.crowd.instanceMatrix.needsUpdate=true;});}

// Panneau : résumé, actions rapides, zones de focus
function levPanel(){const host=document.getElementById('levers');host.innerHTML=`<div id="levSum" style="font-size:12px;margin-bottom:6px"></div>
 <div class="row"><button id="lvC1">Fermer les bouches (19 oct.)</button><button id="lvOpen">Tout rouvrir</button></div>
 <div class="row" style="margin-top:4px"><button id="lvD1">+ Manifestation</button><button id="lvD2">+ Troubles</button></div>
 <div id="lvHint" class="k" style="font-size:11px;margin-top:4px">Cliquez une épingle pour ouvrir ou fermer.</div>
 <h2>Aller à</h2><div class="row" id="lvGo"></div>`;
 document.getElementById('lvC1').onclick=()=>{LEV.forEach(l=>{if(l.type==='bouche')l.etat='fermé';});levRefresh();};
 document.getElementById('lvOpen').onclick=()=>{LEV.forEach(l=>{if(l.type!=='incendie')l.etat='ouvert';});ZONES.slice().forEach(removeZone);levRefresh();};
 const arm=c=>{placing=c;document.getElementById('lvHint').textContent=`Cliquez dans la rue pour poser ${c==='D1'?'la manifestation':'les troubles'}.`;rnd.domElement.style.cursor='crosshair';};
 document.getElementById('lvD1').onclick=()=>arm('D1');document.getElementById('lvD2').onclick=()=>arm('D2');
 const go=document.getElementById('lvGo');const spots=[['Forum',[FORUM[0]+170,150,FORUM[1]+200],[FORUM[0],-20,FORUM[1]]]];
 ['Porte Berger','Porte Rambuteau','Porte Lescot','Porte du Pont Neuf'].forEach(n=>{const L=LEV.find(l=>l.nom===n&&l.type==='porte');if(L)spots.push([n.replace('Porte ',''),[L.x+70,60,L.z+90],[L.x,0,L.z]]);});
 const cin=SCN.interieur.filter(o=>/UGC|Cin[ée]/i.test(o.n||''));if(cin.length){const p=pairs(cin[0].p);const cx=p.reduce((s,q)=>s+q[0],0)/p.length,cz=p.reduce((s,q)=>s+q[1],0)/p.length;spots.push(['Cinéma UGC',[cx+90,30,cz+110],[cx,alt(-3),cz]]);}
 spots.push(['Châtelet',[FORUM[0]+150,120,FORUM[1]+420],[FORUM[0]+40,0,FORUM[1]+230]]);
 spots.forEach(([n,p,t])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>camFly(p,t);go.appendChild(b);});}

// vol de caméra doux vers une zone
let fly=null;function camFly(p,t){fly={p0:cam.position.clone(),t0:ctl.target.clone(),p1:new THREE.Vector3(...p),t1:new THREE.Vector3(...t),k:0};}
function flyTick(dt){if(!fly)return;fly.k=Math.min(1,fly.k+dt/1.2);const e=fly.k<.5?2*fly.k*fly.k:1-Math.pow(-2*fly.k+2,2)/2;cam.position.lerpVectors(fly.p0,fly.p1,e);ctl.target.lerpVectors(fly.t0,fly.t1,e);if(fly.k>=1)fly=null;}

// clic : épingle ou zone d'abord (avant le clic d'information général)
rnd.domElement.addEventListener('pointerup',e=>{if(!levGrp||!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>4)return;ms.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(ms,cam);
 if(placing){const p=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p)){addZone(placing,p.x,p.z);}placing=null;rnd.domElement.style.cursor='';document.getElementById('lvHint').textContent='Cliquez une épingle pour ouvrir ou fermer.';e.stopImmediatePropagation();return;}
 const hs=ray.intersectObjects([...levGrp.children.filter(o=>o.isSprite&&o.visible),...zoneGrp.children.flatMap(g=>g.children.filter(o=>o.isSprite))],false);
 if(!hs.length)return;const o=hs[0].object;e.stopImmediatePropagation();
 if(o.userData.zone){removeZone(o.userData.zone);info.innerHTML='<span class="k">Zone retirée.</span>';return;}
 const L=o.userData.lev;if(L.type!=='incendie')toggleLever(L.id);levInfo(L);},true);

(function wait(){if(typeof SCN==='undefined'||!SCN||!SIM.groups||!SIM.F){setTimeout(wait,200);return;}levBuild();
 let t=performance.now();(function tick(now){const dt=Math.min(.1,(now-t)/1000);t=now;flyTick(dt);zonesTick(dt);
  const under=lvSel!=='all'&&+lvSel<0;LEV.forEach(L=>{const v=L.type==='ascenseur'||L.type==='porte'||!under;L.sprite.visible=v;if(L.stem)L.stem.visible=v;});labelGrp.visible=!under;
  requestAnimationFrame(tick);})(t);})();
