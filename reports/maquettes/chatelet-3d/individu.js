// Chaque personne de la simulation est cliquable et reçoit sa consigne en temps réel (lot « maquette-individu », ticket #31).
// Clic sur une silhouette (silBody, instanceId = indice dans SIM.A ; sinon la personne la plus proche du rayon à moins de 1,5 m) :
// anneau au sol qui la suit, caméra qui la suit (l'orbite reste libre), fiche mise à jour 2 fois par seconde, consigne
// personnalisée, aperçu d'une notification de téléphone, envoi à la personne ou à toute la zone (30 m, même niveau).
// Tout est déduit de l'état de sim.js (SIM.A, SIM.F, SIM.groups, SIM.g.links) : rien n'est inventé. DOM et style injectés ici.
(function(){
 if(typeof SIM==='undefined'||typeof rnd==='undefined'||typeof silBody==='undefined')return;
 const TOL=1.5,ZONE_R=30,HZ=500;
 const KIND={cine:'Spectateur du cinéma UGC',client:'Client du Forum',rer:'Voyageur (quais RER et métro)'};
 const LNK={escalator:["l'escalator",'escalator'],escalier:["l'escalier",'escalier'],ascenseur:["l'ascenseur",'ascenseur']};
 const WIND=['nord','nord-est','est','sud-est','sud','sud-ouest','ouest','nord-ouest'];
 const OBEI=new Map();             // personne -> indice de la sortie qu'on lui a conseillée
 let sel=-1,selA=null,lastPos=null,lastTxt='',sentT=null,zoneMsg='',lastArr=null,sentTxt='';
 const p2=n=>String(n).padStart(2,'0'),tt=T=>`T+${p2(Math.floor(T/60))}:${p2(Math.floor(T%60))}`;
 const dur=s=>s<90?Math.round(s/5)*5+' s':Math.floor(s/60)+' min '+p2(Math.round(s%60/5)*5%60)+' s';
 const lvName=l=>'niveau '+SIM.g.levels[l];
 const groupFr=n=>/^Porte/.test(n)?'la '+n:/^Issues? de secours/i.test(n)?'une issue de secours':/^Quai/.test(n)||/^Quais/.test(n)?'les quais RER et métro':n;
 const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

 // ---------- DOM ----------
 const st=document.createElement('style');
 st.textContent=`#indP{position:fixed;right:12px;top:12px;width:560px;max-height:calc(100vh - 80px);overflow:auto;z-index:40;display:none;font-size:12px}
 body.indSel #indP{display:block}
 #indP .ih{display:flex;align-items:center;gap:10px;margin-bottom:6px}#indP .ih b{flex:1;font-size:13px;letter-spacing:.04em}
 #indP .ib{display:flex;gap:12px}#indP .ic{flex:1;min-width:0}#indP .ip{width:176px;flex:none}
 #indP .r{display:flex;gap:6px;padding:2px 0;border-top:1px solid var(--line)}#indP .r span:first-child{width:92px;flex:none;color:var(--ink2)}#indP .r span:last-child{flex:1}
 #indP .m{color:var(--ink2);font-size:11px}
 #indP .cs{border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:4px;padding:6px 8px;margin:6px 0}
 #indP .bt{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0 2px}#indP .bt button:first-child{border-color:var(--acc);color:var(--acc)}
 #indP .iph{margin:4px auto 6px;width:152px;min-height:262px;border:2px solid var(--ink2);border-radius:20px;padding:10px 7px;background:var(--panel);display:flex;flex-direction:column;align-items:center}
 #indP .iph .nt{width:36px;height:4px;border-radius:2px;background:var(--line);margin-bottom:8px}
 #indP .iph .tm{font-size:28px;line-height:1.1;color:var(--ink)}#indP .iph .dt{font-size:10px;color:var(--ink2);margin-bottom:10px}
 #indP .iph .nf{width:100%;border:1px solid var(--line);border-radius:9px;padding:6px 7px;background:var(--panel);font-size:10.5px;line-height:1.35;color:var(--ink)}
 #indP .iph .nf .nh{display:flex;flex-direction:column;gap:0;color:var(--ink2);font-size:9px;margin-bottom:3px}
 #indP .iph .nf .ar{display:flex;align-items:center;gap:6px;margin-top:5px;color:var(--acc);font-size:10px}
 #indP .iph .nf svg{flex:none;transition:transform .3s}
 body.indSel #info{display:none}
 @media (max-width:760px){body.indSel #left,body.indSel #alB{display:none}#indP{left:12px;right:12px;top:auto;bottom:12px;width:auto;max-height:55vh}#indP .ib{flex-direction:column}#indP .ip{width:auto}}`;
 document.head.appendChild(st);
 const P=document.createElement('div');P.id='indP';P.className='pn';
 P.innerHTML=`<div class="ih"><b>PERSONNE <span id="indN"></span></b><label><input type="checkbox" id="indF" checked> Suivre</label><button id="indX" title="Fermer">✕</button></div>
 <div class="ib"><div class="ic"><div id="indRows"></div><div class="cs"><div class="m">Consigne recalculée en temps réel</div><div id="indCons" style="margin-top:2px"></div></div>
 <div class="bt"><button id="indSend">Envoyer la consigne</button><button id="indZone">Envoyer à toute la zone</button></div><div id="indRes" class="m"></div>
 <div class="m" style="margin-top:6px">Pourquoi cette sortie</div><div id="indWhy"></div></div>
 <div class="ip"><div class="m" id="indCap" style="text-align:center"></div><div class="iph"><div class="nt"></div><div class="tm" id="indTm">00:00</div><div class="dt" id="indDt"></div>
 <div class="nf"><div class="nh"><span>Forum des Halles · Sécurité</span><span id="indWhen">maintenant</span></div><div id="indMsg"></div>
 <div class="ar"><svg id="indAr" width="22" height="22" viewBox="-12 -12 24 24"><path d="M0-9 L7 3 L2 1 L2 9 L-2 9 L-2 1 L-7 3 Z" fill="currentColor"/></svg><span id="indAt"></span></div></div></div>
 <div class="m">Diffusion possible : notification de l'application du centre ou SMS ; FR-Alert (diffusion cellulaire de l'État) pour toute une zone. Aucune intégration existante n'est affirmée ici : aperçu de principe.</div></div></div>`;
 document.body.appendChild(P);
 const $=id=>document.getElementById(id);

 // ---------- Marqueur 3D : anneau + flèche au-dessus de la tête, à taille constante à l'écran ----------
 const mk=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xff7a00,depthTest:false,transparent:true,opacity:.95});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.75,1,40),mat);ring.rotation.x=-Math.PI/2;ring.position.y=.08;
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.55,1.3,12),mat);cone.rotation.x=Math.PI;cone.position.y=3.2;
 ring.renderOrder=cone.renderOrder=40;mk.add(ring,cone);mk.visible=false;mk.frustumCulled=false;scene.add(mk);

 // position de dessin (même formule que simDraw)
 function pos(a){const g=SIM.g;if(a.ride){const k=g.links[a.ride.li],t=1-Math.max(0,a.ride.t1-SIM.T)/rideT(k),to=a.ride.to,fr=a.ride.from;
   const tx=g.bbox[0]+(to[2]+.5)*g.res,tz=g.bbox[1]+(to[1]+.5)*g.res;return [fr[1]+(tx-fr[1])*t,alt(g.levels[fr[0]])+(alt(g.levels[to[0]])-alt(g.levels[fr[0]]))*t,fr[2]+(tz-fr[2])*t,g.levels[to[0]]];}
  return [a.x,alt(g.levels[a.l]),a.z,g.levels[a.l]];}
 const cellOf=a=>a.ride?idx3(a.ride.to[0],a.ride.to[1],a.ride.to[2]):simCell(a);
 const shown=lv=>lvSel==='all'||Math.round(lv)===+lvSel;

 // ---------- Raisonnement : chemin, étape verticale, meilleure sortie ----------
 // On suit la descente de la carte de distance de la sortie k, comme le fait la simulation, jusqu'au premier lien vertical utile.
 function trace(a,k){const g=SIM.g,f=SIM.F[k],w=g.w,N=SIM.N;let i=cellOf(a);if(i<0)return null;const x0=a.x,z0=a.z;let walked=0,dir=null,vert=null;
  const xy=j=>{const l=(j/N)|0,rem=j-l*N,r=(rem/w)|0,c=rem-r*w;return [g.bbox[0]+(c+.5)*g.res,g.bbox[1]+(r+.5)*g.res];};
  for(let n=0;n<800&&f[i]<1e9;n++){if(f[i]<1.6)break;
   const ls=SIM.linkAt.get(i);if(ls)for(const li of ls){const L=g.links[li];if(!L.open)continue;const up=L.ia===i,o=up?L.ib:L.ia;
     if(f[o]+L.len*1.4<=f[i]+.5){vert={L,walked,from:up?L.a[0]:L.b[0],to:up?L.b[0]:L.a[0]};if(!dir){const p=xy(i);dir=[p[0]-x0,p[1]-z0];}return {vert,dir,walked};}}
   let bj=-1,bv=f[i],step=1;for(const[dr,dc,s]of[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4],[1,-1,1.4],[-1,1,1.4],[-1,-1,1.4]]){const j=i+dr*w+dc;if(!SIM.walk[j])continue;if(f[j]<bv){bv=f[j];bj=j;step=s;}}
   if(bj<0)break;i=bj;walked+=step*g.res;if(!dir&&walked>=6){const p=xy(i);dir=[p[0]-x0,p[1]-z0];}}
  if(!dir){const p=xy(i);dir=[p[0]-x0,p[1]-z0];}return {vert:null,dir,walked};}
 // la meilleure sortie pour elle : ouverte, atteignable, hors zone évitée ; sinon la plus proche
 function advise(a){const i=cellOf(a);if(i<0)return null;let best=-1,bd=1e9,near=-1,nd=1e9;
  SIM.groups.forEach((G,k)=>{if(!G.open)return;const d=SIM.F[k][i];if(d>=1e9)return;if(d<nd){nd=d;near=k;}if(SIM.zoneOn&&G.zone)return;if(d<bd){bd=d;best=k;}});
  if(best<0){best=near;bd=nd;}if(best<0)return null;let k=best,why='';const c=a.t;
  if(c>=0){const G=SIM.groups[c],dc=SIM.F[c][i],ok=G.open&&dc<1e9&&!(SIM.zoneOn&&G.zone);
   if(ok&&dc-bd<Math.max(15,.25*dc)){k=c;bd=dc;}else if(!G.open)why='fermée';else if(SIM.zoneOn&&G.zone)why='en zone évitée';else if(dc>=1e9)why='inaccessible d\'ici';else why='nettement plus loin ('+Math.round(dc-bd)+' m de plus)';}
  return {k,d:SIM.F[k][i]*SIM.g.res,better:c>=0&&k!==c,why,cur:c};}
 function consigne(a){
  if(a.out)return {txt:"Vous êtes sorti du centre. Éloignez-vous des issues et suivez les consignes des forces de l'ordre.",arrow:null};
  const A=advise(a);if(!A)return {txt:"Aucune sortie accessible depuis cet endroit : restez sur place et attendez les secours.",arrow:null};
  const G=SIM.groups[A.k],tr=trace(a,A.k);const d=Math.round(A.d/5)*5||5;let s='';
  if(a.ride){const kk=SIM.g.links[a.ride.li];s=`Restez sur ${(LNK[kk.k]||[kk.k])[0]} jusqu'au ${lvName(a.ride.to[0])}. Puis `;}
  s+=(a.ride?'dirigez-vous':'Dirigez-vous')+` vers ${groupFr(G.n)}, à ${d} m`;
  if(tr&&tr.vert){const V=tr.vert,nm=(LNK[V.L.k]||[V.L.k,V.L.k]),w=V.walked<12?'devant vous':'à '+(Math.round(V.walked/5)*5||5)+' m';
   s+=` : prenez ${nm[0]} ${w} jusqu'au ${lvName(V.to)}.`;}else s+=' : même niveau, suivez le flux.';
  const ev=SIM.groups.filter(g=>g.open&&g.zone&&SIM.zoneOn&&g!==G).map(g=>g.n.replace(/^Porte /,''));
  if(ev.length)s+=` Évitez ${ev.length>1?'les portes ':'la porte '}${ev.join(' et ')} (zone de troubles ou de manifestation).`;
  if(A.better)s=`Votre sortie actuelle (${SIM.groups[A.cur].n}) est ${A.why}. `+s;
  return {txt:s,arrow:tr&&tr.dir,A,G};}

 function etat(a){if(a.out)return 'Sortie du centre';
  if(a.ride){const k=SIM.g.links[a.ride.li];return `Sur ${(LNK[k.k]||[k.k])[0]} (${lvName(a.ride.from[0])} vers ${lvName(a.ride.to[0])})`;}
  if(SIM.mode!=='evac')return a.kind==='cine'?'Avant l\'alerte : assis en séance':'Avant l\'alerte : flâne dans le centre';
  if(SIM.T<a.pre+SIM.delay)return `Attend l'alerte (réagit dans ~${Math.max(1,Math.round(a.pre+SIM.delay-SIM.T))} s)`;
  if(a.hes>0)return 'Hésite devant une porte fermée';
  if(a.t<0)return 'Cherche sa sortie';
  const sp=Math.hypot(a.vx,a.vz);return sp<.25?'À l\'arrêt (file ou foule dense)':'Marche vers sa sortie';}
 function densite(a){let n=0;const R=3;for(const b of SIM.A){if(b.out||b.ride||b.l!==a.l)continue;if(Math.abs(b.x-a.x)<R&&Math.abs(b.z-a.z)<R&&Math.hypot(b.x-a.x,b.z-a.z)<R)n++;}return n/(Math.PI*R*R);}
 function pourquoi(a){const L=[];if(a.t<0)return ['Pas encore de sortie choisie.'];const G=SIM.groups[a.t],i=cellOf(a),d=i>=0?SIM.F[a.t][i]:1e9;
  if(a.fam===a.t)L.push('Elle connaît cette sortie (familiarité).');
  let nn=0,same=0;for(const b of SIM.A){if(b===a||b.out||b.ride||b.l!==a.l||b.t<0)continue;if(Math.abs(b.x-a.x)<4&&Math.abs(b.z-a.z)<4){nn++;if(b.t===a.t)same++;}}
  if(nn>=3&&same/nn>=.5)L.push(`Elle suit les personnes proches (${same} sur ${nn} vont vers la même sortie).`);
  if(G.agent&&d<40)L.push('Un agent posté guide vers cette sortie.');
  if(G.annonce)L.push('Une annonce est diffusée vers cette sortie.');
  if(SIM.zoneOn&&G.zone)L.push('Sortie en zone évitée : choisie malgré la pénalité.');
  let nearest=true;SIM.groups.forEach((H,k)=>{if(H.open&&SIM.F[k][i]<d-1)nearest=false;});if(nearest&&d<1e9)L.push(`C'est la sortie la plus proche (${Math.round(d)} m).`);
  if(!L.length)L.push('Aucun facteur marqué : choix tiré par le modèle (distance, avec une part de hasard).');return L;}

 // ---------- Envoi ----------
 function envoyer(a,c){c=c||consigne(a);if(!c.A)return false;a.t=c.A.k;a.hes=0;a.consigne={T:SIM.T,k:c.A.k};OBEI.set(a,c.A.k);return true;}
 function zoneEnvoi(){const a=selA;if(!a)return 0;const [x0,,z0]=pos(a);let n=0,tot=0;for(const b of SIM.A){if(b.out||b.l!==a.l||b.ride)continue;if(Math.hypot(b.x-x0,b.z-z0)>ZONE_R)continue;tot++;if(envoyer(b))n++;}
  zoneMsg=`Envoyée à la zone (${ZONE_R} m, même niveau) à ${tt(SIM.T)} : ${n} personne${n>1?'s':''} sur ${tot} l'ont reçue.`;sentT=SIM.T;majTexte();return n;}
 // la simulation retombe parfois sur un autre choix : on rétablit la sortie conseillée à chaque pas pour ceux qui ont reçu la consigne
 const orig=window.simStep;
 if(typeof orig==='function')window.simStep=function(dt){const r=orig.apply(this,arguments);
  if(OBEI.size)for(const [a,k] of OBEI){if(a.out||SIM.mode!=='evac'||!SIM.groups[k].open){OBEI.delete(a);if(!a.out&&SIM.mode==='evac')a.consigneCaduque=true;continue;}a.t=k;a.hes=0;}return r;};

 // ---------- Fiche ----------
 function majFiche(force){if(sel<0)return;if(SIM.A[sel]!==selA){deselect();return;}const a=selA,i=cellOf(a),g=SIM.g;
  const c=consigne(a),G=a.t>=0?SIM.groups[a.t]:null,d=G&&i>=0?SIM.F[a.t][i]*g.res:null;
  const lv=a.ride?`niveau ${g.levels[a.ride.from[0]]} vers ${g.levels[a.ride.to[0]]}`:'niveau '+g.levels[a.l];
  const dd=d!=null&&d<1e9?`${Math.round(d)} m · ~${dur(d/a.v0)} à ${a.v0.toFixed(1).replace('.',',')} m/s`:(G&&!G.open?'sortie fermée : à recalculer':'—');
  const rows=[['Profil',KIND[a.kind]||a.kind],['Niveau',lv],['État',etat(a)],['Sortie visée',G?G.n+(G.open?'':' (fermée)'):'pas encore choisie'],['Distance restante',a.out?'0 m':dd],
   ['Densité autour',densite(a).toFixed(1).replace('.',',')+' pers./m² (rayon 3 m)'],
   ['Consigne',a.consigne?(OBEI.has(a)?`envoyée à ${tt(a.consigne.T)} : suivie`:(a.consigneCaduque?`envoyée à ${tt(a.consigne.T)} : sortie devenue indisponible, à renvoyer`:`envoyée à ${tt(a.consigne.T)}`)):'non envoyée']];
  $('indRows').innerHTML=rows.map(r=>`<div class="r"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');
  $('indWhy').innerHTML=pourquoi(a).map(s=>`<div>· ${s}</div>`).join('');
  const txt=c.txt;if(txt!==lastTxt){lastTxt=txt;}
  const sentNow=a.consigne&&OBEI.has(a);
  $('indCons').textContent=txt;
  // le téléphone montre la dernière consigne reçue, ou l'aperçu de ce qu'elle recevrait
  const recu=!!a.consigne&&!!sentTxt;const showTxt=recu?sentTxt:txt;
  $('indMsg').textContent=showTxt;$('indCap').textContent=recu?`Reçue à ${tt(a.consigne.T)}`:'Aperçu (non envoyé)';
  $('indWhen').textContent=recu?'envoyée':'aperçu';
  const now=new Date();$('indTm').textContent=p2(now.getHours())+':'+p2(now.getMinutes());$('indDt').textContent=tt(SIM.T)+' · alerte '+(SIM.mode==='evac'?'en cours':'pas lancée');
  const dir=c.arrow;if(dir&&Math.hypot(dir[0],dir[1])>.2){const br=Math.atan2(dir[0],-dir[1])*180/Math.PI;$('indAr').style.transform=`rotate(${br.toFixed(0)}deg)`;
   $('indAt').textContent='Cap '+WIND[Math.round(((br%360)+360)%360/45)%8]+' (nord en haut de la carte)';}else{$('indAt').textContent='Vous êtes arrivé';}
  $('indSend').disabled=SIM.mode!=='evac'||a.out;$('indZone').disabled=SIM.mode!=='evac';
  $('indRes').textContent=zoneMsg;}
 function majTexte(){sentTxt=selA&&OBEI.has(selA)?consigne(selA).txt:sentTxt;majFiche();}

 // petit écran : la fiche occupe le bas, on remonte la personne vers le haut de l'image
 function vue(){if(innerWidth<=760)cam.setViewOffset(innerWidth,innerHeight,0,innerHeight*.28,innerWidth,innerHeight);else cam.clearViewOffset();}
 function select(i){if(!SIM.A||!SIM.A[i])return;sel=i;selA=SIM.A[i];zoneMsg='';sentTxt='';lastTxt='';document.body.classList.add('indSel');vue();$('indN').textContent='n° '+(i+1);
  if(selA.consigne&&OBEI.has(selA))sentTxt='';
  const [x,y,z]=pos(selA);if(typeof camFly==='function')camFly([x+22,y+20,z+28],[x,y,z]);lastPos=null;mk.visible=true;majFiche(true);}
 function deselect(){cam.clearViewOffset();sel=-1;selA=null;lastPos=null;mk.visible=false;document.body.classList.remove('indSel');}
 $('indX').onclick=deselect;
 $('indSend').onclick=()=>{if(!selA)return;const c=consigne(selA);if(envoyer(selA,c)){sentTxt=c.txt;sentT=SIM.T;zoneMsg='';majFiche(true);}};
 $('indZone').onclick=()=>{zoneEnvoi();if(selA&&OBEI.has(selA))sentTxt=consigne(selA).txt;majFiche(true);};

 // ---------- Clic (avant le clic d'information général, comme leviers.js) ----------
 rnd.domElement.addEventListener('pointerup',e=>{if(!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>4||!SIM.A||!silBody)return;
  ms.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(ms,cam);
  let id=-1;const h=ray.intersectObject(silBody,false);for(const q of h){const a=SIM.A[q.instanceId];if(a&&!a.out&&shown(pos(a)[3])){id=q.instanceId;break;}}
  if(id<0){let bd=TOL*TOL+1,bc=1e9;const v=new THREE.Vector3();SIM.A.forEach((a,j)=>{if(a.out)return;const p=pos(a);if(!shown(p[3]))return;v.set(p[0],p[1]+.9,p[2]);
    const dd=ray.ray.distanceSqToPoint(v);if(dd>TOL*TOL)return;const dc=cam.position.distanceToSquared(v);if(dd<bd-.3||(Math.abs(dd-bd)<=.3&&dc<bc)){bd=dd;bc=dc;id=j;}});}
  if(id<0)return;e.stopImmediatePropagation();select(id);},true);


 // ---------- Halos : un anneau plat au sol par personne (rayon du corps 0,24 m : deux halos ne se chevauchent pas, comme les corps durs de sim.js) ----------
 // couleur : gris tant qu'elle attend l'alerte, vert (< 2 pers./m²), orange (2 à 4), rouge (> 4) d'après a.dens (voisins à moins de 1,13 m ; 1 voisin = ~1 pers./m²)
 let HM=null,hA=null,hOn=true,hMs=0,hN=0;const hCol=new THREE.Color(),HC={g:new THREE.Color(0x2e9e5b),o:new THREE.Color(0xf08a00),r:new THREE.Color(0xe0261f),n:new THREE.Color(0x8e928f)};
 function haloBuild(){if(HM){scene.remove(HM);HM.dispose();}hA=SIM.A;const g=new THREE.RingGeometry(.15,.24,20);g.rotateX(-Math.PI/2);
  HM=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({transparent:true,opacity:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide}),SIM.A.length);
  HM.frustumCulled=false;HM.renderOrder=5;HM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);const m=new THREE.Matrix4();for(let i=0;i<SIM.A.length;i++){HM.setMatrixAt(i,m.identity());HM.setColorAt(i,HC.n);}scene.add(HM);}
 function haloTick(){if(!SIM.A||!SIM.g)return;if(hA!==SIM.A||!HM)haloBuild();HM.visible=hOn&&SIM.on;if(!HM.visible)return;const t0=performance.now();
  const A=SIM.A,g=SIM.g,ar=HM.instanceMatrix.array,cr=HM.instanceColor.array,show=lvSel==='all'?null:+lvSel;
  for(let i=0;i<A.length;i++){const a=A[i],o=i*16;let x=a.x,z=a.z,y,lv;
   if(a.out){ar[o+13]=-9999;continue;}
   if(a.ride){const k=g.links[a.ride.li],t=1-Math.max(0,a.ride.t1-SIM.T)/rideT(k),to=a.ride.to,fr=a.ride.from;x=fr[1]+(g.bbox[0]+(to[2]+.5)*g.res-fr[1])*t;z=fr[2]+(g.bbox[1]+(to[1]+.5)*g.res-fr[2])*t;
    y=alt(g.levels[fr[0]])+(alt(g.levels[to[0]])-alt(g.levels[fr[0]]))*t;lv=g.levels[to[0]];}else{lv=g.levels[a.l];y=alt(lv);}
   if(show!==null&&Math.round(lv)!==show){ar[o+13]=-9999;continue;}
   ar[o]=1;ar[o+5]=1;ar[o+10]=1;ar[o+15]=1;ar[o+12]=x;ar[o+13]=y+.06;ar[o+14]=z;
   const c=SIM.T<a.pre+SIM.delay&&SIM.mode==='evac'||SIM.mode!=='evac'?HC.n:a.dens>4?HC.r:a.dens>=2?HC.o:HC.g;cr[i*3]=c.r;cr[i*3+1]=c.g;cr[i*3+2]=c.b;}
  HM.instanceMatrix.needsUpdate=true;HM.instanceColor.needsUpdate=true;hMs+=performance.now()-t0;hN++;}
 const lab=document.createElement('label');lab.innerHTML='<input type="checkbox" id="indHalo" checked> Halos des personnes (touche H)';const es=document.getElementById('evacStats');if(es)es.after(lab);
 const setHalo=v=>{hOn=v;const c=$('indHalo');if(c)c.checked=v;};if($('indHalo'))$('indHalo').onchange=e=>setHalo(e.target.checked);
 addEventListener('keydown',e=>{if(e.key==='h'||e.key==='H'){const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA')return;setHalo(!hOn);}});

 // ---------- Suivi par image : anneau, caméra ----------
 let acc=0,last=performance.now();
 (function tick(now){requestAnimationFrame(tick);const dt=now-last;last=now;try{haloTick();}catch(x){console.warn('halo',x);}if(sel<0)return;
  if(SIM.A[sel]!==selA){deselect();return;}
  const [x,y,z,lv]=pos(selA);mk.visible=!selA.out&&shown(lv);mk.position.set(x,y,z);
  const dist=cam.position.distanceTo(mk.position),s=Math.max(1,dist/55);ring.scale.set(s,s,s);cone.scale.set(s,s,s);cone.position.y=2.6+1.4*s;
  const flying=typeof fly!=='undefined'&&fly;
  if(!flying&&$('indF').checked){if(lastPos){const dx=x-lastPos[0],dy=y-lastPos[1],dz=z-lastPos[2];if(Math.abs(dx)+Math.abs(dy)+Math.abs(dz)<60){cam.position.x+=dx;cam.position.y+=dy;cam.position.z+=dz;ctl.target.x+=dx;ctl.target.y+=dy;ctl.target.z+=dz;}}lastPos=[x,y,z];}else lastPos=flying?null:[x,y,z];
  acc+=dt;if(acc>=HZ){acc=0;majFiche();}})(performance.now());

 // ---------- Accès pour les tests ----------
 window.indiv={halo:v=>setHalo(v),haloMs:()=>{const r=hN?hMs/hN:0;hMs=0;hN=0;return r;},select,deselect,envoyer:()=>$('indSend').click(),zone:()=>$('indZone').click(),consigne:i=>consigne(i==null?selA:SIM.A[i]),
  get sel(){return sel;},etat:()=>$('indRows').innerText,texte:()=>$('indCons').textContent,
  // simule un vrai clic à la position projetée de la personne i (pointerdown + pointerup sur le canevas)
  clic:i=>{const a=SIM.A[i],p=pos(a),v=new THREE.Vector3(p[0],p[1]+.9,p[2]).project(cam),x=(v.x+1)/2*innerWidth,y=(1-v.y)/2*innerHeight;
   const o={clientX:x,clientY:y,bubbles:true,pointerId:1};rnd.domElement.dispatchEvent(new PointerEvent('pointerdown',o));rnd.domElement.dispatchEvent(new PointerEvent('pointerup',o));return [Math.round(x),Math.round(y)];}};
})();
