// Chronologie des alertes en temps réel et propositions d'intervention (lot « alertes »).
// Le bandeau du bas détecte, nomme et date les problèmes de la simulation (bouchon, porte fermée visée, zone qui touche
// une porte, file d'ascenseur, stations fermées avec quais pleins, évacuation trop longue) et PROPOSE des interventions
// calculées sur l'état réel (leviers fermés proches, portes peu chargées). Le chef de poste valide ou refuse ; rien n'est
// joué sans lui. Seuils : voir SEUIL ci-dessous (sourcés dans reports/criteres-jugement-crise.md, sinon marqués estimé).
(function(){
 if(typeof SIM==='undefined'||typeof LEV==='undefined')return;
 const SEUIL={
  orange:3,   // pers./m² : redline foule mobile de Still (EIAI). Sourcé. (Adem demandait 4 : sur 2×2 m la simulation plafonne à ~3,5, voir LISEZMOI)
  rouge:4,    // pers./m² : guides britanniques (Green Guide, via Still, thèse ch. 2) ; redline statique de Still = 5. Sourcé.
  duree:20,   // s au-dessus du seuil avant d'alerter : estimé (Still donne des minutes pour les forces, pas pour une alerte).
  cellule:2,  // m : côté de la cellule de mesure (4 m², 16 personnes = 4 pers./m²). Choix de la maquette.
  pas:2,      // s simulées entre deux détections.
  evacMax:600,// s : temps restant d'évacuation au-delà duquel on alerte (10 min, demande d'Adem) ; extrapolation = estimé.
  file:10,    // personnes à moins de 4 m du pied d'un ascenseur : estimé.
  visee:5,    // personnes qui hésitent devant une porte fermée : estimé.
  quais:40,   // personnes sur les quais (niveaux ≤ -4) avec stations fermées : estimé.
  fermeApres:2// détections consécutives sans le problème avant de fermer l'alerte (4 s simulées).
 };
 const ROUGE='#d32f2f',ORANGE='#e65100';
 const EV=[],ACT=new Map(),PEND=[];let lastDet=-1e9,evSeq=0,quiet=0,voix=true,lastVoice=-1e9,snap=null,lastMode=null;
 const COUT={n:0,sum:0,max:0,pic:0};
 const p2=n=>String(n).padStart(2,'0');
 const tt=T=>`T+${p2(Math.floor(T/60))}:${p2(Math.floor(T%60))}`;
 const fr=n=>n.toFixed(1).replace('.',',');
 const reg=()=>window.registre||(window.registre=[]);

 // ---------- DOM autonome ----------
 const st=document.createElement('style');
 st.textContent=`#alB{position:fixed;left:12px;right:12px;z-index:30;padding:0;overflow:hidden}
 #alB .hd{display:flex;align-items:center;gap:10px;padding:3px 10px;font-size:11px;color:var(--ink2);border-bottom:1px solid var(--line);cursor:default}
 #alB .hd b{color:var(--ink);letter-spacing:.06em;font-weight:600}#alB .hd .sp{flex:1}
 #alB .hd button{font-size:10px;padding:1px 6px}
 #alS{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:6px 8px;scroll-behavior:smooth}
 #alB.rep #alS{display:none}
 .ev{flex:0 0 auto;width:262px;border:1px solid var(--line);border-left:4px solid var(--ink2);border-radius:4px;padding:4px 7px;font-size:11px;line-height:1.35;cursor:pointer}
 .ev .m{color:var(--ink2);font-size:10px;letter-spacing:.03em}.ev .m i{font-style:normal;font-weight:700}
 .ev.rouge{border-left-color:${ROUGE}}.ev.rouge .m i{color:${ROUGE}}
 .ev.orange{border-left-color:${ORANGE}}.ev.orange .m i{color:${ORANGE}}
 .ev.proposition{border-left-color:var(--acc)}.ev.proposition .m i{color:var(--acc)}
 .ev.decision{border-left-color:var(--acc);background:rgba(57,255,136,.08)}.ev.decision .m i{color:var(--acc)}
 .ev.off{opacity:.55}.ev .bt{display:flex;gap:4px;margin-top:3px}.ev .bt button{font-size:10px;padding:1px 6px}
 .ev .bt .ok{border-color:var(--acc);color:var(--acc)}
 #alB .un{display:none;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
 @media (max-width:760px){#alB:not(.ouv) #alS{display:none}#alB:not(.ouv) .un{display:block}#alB:not(.ouv) .hd .lbl{display:none}#alB.ouv #alS{display:flex}}`;
 document.head.appendChild(st);
 const box=document.createElement('div');box.id='alB';box.className='pn';
 box.innerHTML=`<div class="hd"><b class="lbl">CHRONOLOGIE</b><span class="un"></span><span class="lbl" id="alN"></span><span class="sp"></span><button id="alV" title="Annonce vocale des alertes rouges">Voix : oui</button><button id="alR">Replier</button></div><div id="alS"></div>`;
 document.body.appendChild(box);
 const strip=box.querySelector('#alS'),un=box.querySelector('.un');
 const place=()=>{const f=document.getElementById('foot');box.style.bottom=((f?f.offsetHeight:30)+18)+'px';};place();addEventListener('resize',place);
 try{new ResizeObserver(place).observe(document.getElementById('foot'));}catch(e){}
 box.querySelector('#alV').onclick=e=>{voix=!voix;e.target.textContent='Voix : '+(voix?'oui':'non');if(!voix)try{speechSynthesis.cancel();}catch(x){}};
 box.querySelector('#alR').onclick=e=>{const mob=innerWidth<=760;if(mob){box.classList.toggle('ouv');e.target.textContent=box.classList.contains('ouv')?'Replier':'Déplier';}else{box.classList.toggle('rep');e.target.textContent=box.classList.contains('rep')?'Déplier':'Replier';}};
 if(innerWidth<=760)box.querySelector('#alR').textContent='Déplier';

 function parler(t){if(!voix||SIM.T-lastVoice<8&&SIM.T>=lastVoice)return;lastVoice=SIM.T;try{const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=1.05;speechSynthesis.speak(u);}catch(e){}}
 const LAB={rouge:'ALERTE',orange:'ATTENTION',info:'INFO',proposition:'PROPOSITION',decision:'DÉCISION'};
 function fly(pos){if(!pos||typeof camFly!=='function')return;const y=alt(pos.lvl);camFly([pos.x+45,y+40,pos.z+55],[pos.x,y,pos.z]);}
 function push(type,txt,pos,extra){const e=Object.assign({id:++evSeq,type,txt,T:SIM.T||0,heure:new Date().toLocaleTimeString('fr-FR'),pos},extra||{});
  const el=document.createElement('div');el.className='ev '+type;
  el.innerHTML=`<div class="m"><i>${LAB[type]}</i> · ${tt(e.T)} · ${e.heure}${pos?` · niv. ${pos.lvl}`:''}</div><div class="tx"></div>`;
  el.querySelector('.tx').textContent=txt;el.onclick=ev=>{if(ev.target.closest('button'))return;fly(e.pos);};
  e.el=el;
  if(type==='proposition'){const b=document.createElement('div');b.className='bt';b.innerHTML='<button class="ok">Valider (chef de poste)</button><button class="no">Refuser</button>';el.appendChild(b);
   b.querySelector('.ok').onclick=()=>valider(e);b.querySelector('.no').onclick=()=>refuser(e);}
  EV.push(e);const near=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-40;strip.appendChild(el);if(near)strip.scrollLeft=strip.scrollWidth;
  box.querySelector('#alN').textContent=`${ACT.size} alerte(s) active(s) · ${EV.length} événements`;un.textContent=`${tt(e.T)} ${txt}`;
  if(type==='alerte'||type==='rouge'||type==='orange')return e;return e;}
 const majN=()=>{box.querySelector('#alN').textContent=`${ACT.size} alerte(s) active(s) · ${EV.length} événements`;};
 function clore(e,note){const b=e.el.querySelector('.bt');if(b)b.outerHTML=`<div class="m">${note}</div>`;e.el.classList.add('off');e.clos=true;}

 // ---------- Validation d'une proposition ----------
 function valider(e){if(e.clos)return;const pr=e.prop;if(!pr.valide()){clore(e,'Sans objet : la situation a changé.');return;}
  const d=pr.delai||0;clore(e,`Validée à ${tt(SIM.T)}${d?` · effet à ${tt(SIM.T+d)} (délai ${d>=60?Math.round(d/60)+' min':d+' s'}${pr.delaiEstime?', estimé':''})`:''}`);e.el.classList.remove('off');e.valide=SIM.T;
  reg().push({heure:new Date().toLocaleTimeString('fr-FR'),T:Math.round(SIM.T),decision:pr.txt,par:pr.acteur==='chef de poste'?'chef de poste':'chef de poste (demande à '+pr.acteur+')',source:'alertes : '+e.alerte});
  push('decision',`${pr.acteur==='chef de poste'?'Validé':'Demande transmise à '+pr.acteur+', validée'} : ${pr.txt}`,e.pos);
  PEND.push({rest:d,run:()=>{quiet++;try{pr.run();}finally{quiet--;}},txt:pr.txt,pos:e.pos,ext:pr.acteur!=='chef de poste'});if(!d)jouer();}
 function refuser(e){if(e.clos)return;clore(e,'Refusée');reg().push({heure:new Date().toLocaleTimeString('fr-FR'),T:Math.round(SIM.T),decision:'Refusé : '+e.prop.txt,par:'chef de poste',source:'alertes : '+e.alerte});}
 function jouer(dT){for(let i=PEND.length-1;i>=0;i--){PEND[i].rest-=dT||0;if(PEND[i].rest<=0){const q=PEND.splice(i,1)[0];try{q.run();}catch(x){console.warn('alertes',x);}if(q.ext)push('info','Effet en place : '+q.txt,q.pos);}}}

 // ---------- Lieux ----------
 const g=()=>SIM.g,lvOf=l=>g().levels[l];
 const wx=c=>g().bbox[0]+(c+.5)*g().res,wz=r=>g().bbox[1]+(r+.5)*g().res;
 const portes=()=>LEV.filter(l=>l.type==='porte');
 function nearestPorte(x,z){let b=null,bd=1e9;portes().forEach(L=>{const d=Math.hypot(L.x-x,L.z-z);if(d<bd){bd=d;b=L;}});return b;}
 function nomLev(L){if(L.type==='issue'){const j=+L.id.split('-')[1]+1;const P=nearestPorte(L.x,L.z);return `l'issue de secours n°${j}${P?' (près de '+P.nom+')':''}`;}
  if(L.type==='ascenseur')return `l'ascenseur ${L.nom}`;if(L.type==='bouche')return L.nom;return L.nom;}
 function linkEnds(k){return [k.a,k.b].map(c=>({l:lvOf(c[0]),x:wx(c[2]),z:wz(c[1])}));}
 function labelLink(k){const w={escalator:"l'escalator",escalier:"l'escalier",ascenseur:"l'ascenseur"}[k.k]||'le passage';const n=(k.n||'').replace(/^Ascenseurs?\s*/i,'').trim();
  if(n)return `${w} ${n}`;const e=linkEnds(k)[0];const P=nearestPorte(e.x,e.z);return P?`${w} près de ${P.nom}`:w;}
 function lieu(x,z,lvl){let best=null,bd=8;g().links.forEach(k=>{linkEnds(k).forEach(e=>{if(e.l!==lvl)return;const d=Math.hypot(e.x-x,e.z-z);if(d<bd){bd=d;best=k;}});});
  if(best)return `au pied de ${labelLink(best)}`;
  let L2=null,ld=40;LEV.forEach(L=>{if(L.type==='incendie'||L.type==='bouche'||L.niveau!==lvl)return;const d=Math.hypot(L.x-x,L.z-z);if(d<ld){ld=d;L2=L;}});
  if(L2)return `près de ${nomLev(L2)}`;const P=nearestPorte(x,z);return P?`à ${Math.round(Math.hypot(P.x-x,P.z-z))} m de ${P.nom}`:'dans le Forum';}

 // ---------- Propositions calculées ----------
 const cellIdx=(x,z,lvl)=>simCell({l:g().levels.indexOf(lvl),x,z});
 function chargeGroupes(){const c={};(SIM.A||[]).forEach(a=>{if(!a.out&&a.t>=0)c[a.t]=(c[a.t]||0)+1;});return c;}
 const ratpDelai=()=>{const D=window.dispositif&&window.dispositif.D&&window.dispositif.D.find(e=>e.id==='liaison-ratp');return D&&D.delai_s!=null?{d:D.delai_s,est:false}:{d:0,est:true};};
 function propIssues(c,max){return LEV.filter(L=>L.type==='issue'&&L.etat==='fermé'&&Math.abs(L.niveau-c.lvl)<=2).map(L=>({L,d:Math.hypot(L.x-c.x,L.z-c.z)})).filter(o=>o.d<=60).sort((a,b)=>a.d-b.d).slice(0,max||2)
  .map(o=>({txt:`Ouvrir ${nomLev(o.L)}, à ${Math.round(o.d)} m`,acteur:'chef de poste',run:()=>levAction(o.L.id,'ouvrir'),valide:()=>o.L.etat==='fermé'}));}
 function propRatp(c,rayon){const B=LEV.filter(L=>L.type==='bouche'&&L.etat==='fermé'&&Math.hypot(L.x-c.x,L.z-c.z)<=rayon);if(!B.length)return [];const noms=[...new Set(B.map(b=>b.nom))].slice(0,3).join(', ');const r=ratpDelai();
  return [{txt:`Demander à la RATP de rouvrir les accès ${noms}${B.length>3?' et '+(B.length-3)+' autres':''} (${B.length} fermés à moins de ${rayon} m)`,acteur:'la RATP',delai:r.d,delaiEstime:r.est,run:()=>B.forEach(b=>levAction(b.id,'ouvrir')),valide:()=>B.some(b=>b.etat==='fermé')}];}
 function propPorte(c,exclure){const i=cellIdx(c.x,c.z,c.lvl),ch=chargeGroupes();const C=[];portes().forEach(L=>{const G=SIM.groups[L.grp];if(!G||!G.open||G.zone||L===exclure||Math.hypot(L.x-c.x,L.z-c.z)<15)return;const d=SIM.F[L.grp][i];if(!(d<250))return;C.push({L,d,n:ch[L.grp]||0});});
  if(!C.length)return [];C.sort((a,b)=>a.n-b.n||a.d-b.d);const o=C[0];
  return [{txt:`Annonce et guide-files vers ${o.L.nom} (à ${Math.round(o.d)} m, ${o.n} personnes s'y dirigent)`,acteur:'chef de poste',run:()=>{if(!o.L.annonce)levAction(o.L.id,'annonce');if(!o.L.agent)levAction(o.L.id,'agent');},valide:()=>!o.L.annonce||!o.L.agent}];}
 const propTout=c=>[...propIssues(c),...propRatp(c,80),...propPorte(c,nearestPorte(c.x,c.z))];

 // ---------- Gestion des alertes ----------
 function upsert(key,sev,txt,pos,mkProps,vus){vus.add(key);let A=ACT.get(key);
  if(!A){A={key,sev,txt,pos,miss:0,since:SIM.T,props:[]};A.ev=push(sev,txt,pos);A.ev.alerte=txt;ACT.set(key,A);
   if(sev==='rouge')parler('Alerte rouge. '+txt.split(' : ')[0].replace(/pers\.\/m²/g,'personnes par mètre carré'));
   try{mkProps().forEach(pr=>{const e=push('proposition',pr.txt,pos);e.prop=pr;e.alerte=txt.split(' : ')[0];A.props.push(e);});}catch(x){console.warn('alertes props',x);}
   majN();return;}
  A.miss=0;A.pos=pos;if(txt!==A.txt){A.txt=txt;A.ev.txt=txt;A.ev.el.querySelector('.tx').textContent=txt;}
  if(sev==='rouge'&&A.sev!=='rouge'){A.sev='rouge';A.ev.type='rouge';A.ev.el.className='ev rouge';A.ev.el.querySelector('.m i').textContent='ALERTE';
   const e=push('rouge',`Aggravation : ${txt}`,pos);e.alerte=txt;parler('Alerte rouge. '+txt.split(' : ')[0]);}}
 function fermer(A,note){ACT.delete(A.key);A.ev.el.classList.add('off');A.props.forEach(e=>{if(!e.clos)clore(e,'Alerte résorbée : proposition caduque.');});push('info',`${note} : ${A.txt.split(' : ')[0]}`,A.pos);majN();}

 // ---------- Détection ----------
 const HOT=new Map();let ech=[];
 function detecter(){const t0=performance.now();const T=SIM.T,G=g(),S=SEUIL.cellule,A=SIM.A;if(!A||!G)return;
  const vus=new Set();const evac=SIM.mode==='evac';
  // 1. densité par cellule de 2×2 m
  const D=new Map();for(const a of A){if(a.out||a.ride)continue;const k=a.l*1e7+Math.floor((a.x-G.bbox[0])/S)*10000+Math.floor((a.z-G.bbox[1])/S);D.set(k,(D.get(k)||0)+1);}
  const aire=S*S,seuilN=SEUIL.orange*aire;for(const n of D.values())if(n/aire>COUT.pic)COUT.pic=n/aire;
  for(const[k,n]of D){if(n>=seuilN){const h=HOT.get(k);if(h){h.last=T;h.n=n;}else HOT.set(k,{since:T,last:T,n});}}
  for(const[k,h]of HOT){if(h.last<T-.01&&(T-h.last>SEUIL.pas*2||!D.has(k)))HOT.delete(k);else if(h.last<T-.01)h.n=D.get(k)||0;}
  // 2. grappes de cellules mûres (au-dessus du seuil depuis plus de 20 s), voisinage à 8
  const mur=[];for(const[k,h]of HOT)if(h.last>=T-.01&&T-h.since>=SEUIL.duree)mur.push(k);
  const set=new Set(mur),done=new Set();
  for(const k0 of mur){if(done.has(k0))continue;const pile=[k0],cl=[];done.add(k0);
   while(pile.length){const k=pile.pop();cl.push(k);const l=Math.floor(k/1e7),r=k-l*1e7,ix=Math.floor(r/10000),iz=r%10000;
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const k2=l*1e7+(ix+dx)*10000+(iz+dz);if(set.has(k2)&&!done.has(k2)){done.add(k2);pile.push(k2);}}}
   let sx=0,sz=0,sw=0,pk=0,since=T;const l=Math.floor(k0/1e7);
   for(const k of cl){const h=HOT.get(k),r=k-l*1e7,ix=Math.floor(r/10000),iz=r%10000;const w=h.n;sx+=(G.bbox[0]+(ix+.5)*S)*w;sz+=(G.bbox[1]+(iz+.5)*S)*w;sw+=w;pk=Math.max(pk,h.n/aire);since=Math.min(since,h.since);}
   const pos={x:sx/sw,z:sz/sw,lvl:lvOf(l)};
   // identité : une alerte active du même niveau à moins de 8 m est la même
   let key=null;for(const A2 of ACT.values())if(A2.key[0]==='b'&&A2.pos.lvl===pos.lvl&&Math.hypot(A2.pos.x-pos.x,A2.pos.z-pos.z)<8){key=A2.key;break;}
   if(!key)key=`b${pos.lvl}:${Math.round(pos.x)}:${Math.round(pos.z)}`;
   const sev=pk>=SEUIL.rouge?'rouge':'orange';
   upsert(key,sev,`Bouchon ${lieu(pos.x,pos.z,pos.lvl)}, niveau ${pos.lvl} : ${fr(pk)} pers./m² depuis ${Math.round(T-since)} s`,pos,()=>propTout(pos),vus);}
  if(evac){
   // 3. porte fermée encore visée par la foule
   const hes={};for(const a of A){if(!a.out&&!a.ride&&a.hes>0&&a.t>=0&&!SIM.groups[a.t].open)hes[a.t]=(hes[a.t]||0)+1;}
   for(const t in hes){if(hes[t]<SEUIL.visee)continue;const L=LEV.find(l=>l.type==='porte'&&l.grp===+t);if(!L)continue;const pos={x:L.x,z:L.z,lvl:L.niveau};
    upsert(`p${t}`,'orange',`${L.nom} fermée mais encore visée : ${hes[t]} personnes s'y présentent`,pos,()=>[...(L.etat==='fermé'?[{txt:`Rouvrir ${L.nom}`,acteur:'chef de poste',run:()=>levAction(L.id,'ouvrir'),valide:()=>L.etat==='fermé'}]:[]),...propPorte(pos,L)],vus);}
   // 5. stations fermées alors que les quais sont pleins
   const T0=SIM.groups.find(x=>x.type==='train');if(T0&&!T0.open){let n=0,sx=0,sz=0,lv=-4;for(const a of A){if(a.out||a.ride||lvOf(a.l)>-4)continue;n++;sx+=a.x;sz+=a.z;lv=lvOf(a.l);}
    if(n>=SEUIL.quais){const pos={x:sx/n,z:sz/n,lvl:lv};upsert('station','rouge',`Stations fermées : ${n} personnes encore sur les quais, sans sortie par le métro ou le RER`,pos,()=>[...propRatp({x:FORUM[0],z:FORUM[1]},500),...propIssues(pos,1)],vus);}}
   // 6. file devant un ascenseur (agents rangés par cases de 4 m, une seule passe)
   const B4=new Map();for(const a of A){if(a.out||a.ride)continue;const k=a.l*1e7+Math.floor((a.x-G.bbox[0])/4)*10000+Math.floor((a.z-G.bbox[1])/4);let L3=B4.get(k);if(!L3)B4.set(k,L3=[]);L3.push(a);}
   const Q=new Map();g().links.forEach((k,li)=>{if(k.k!=='ascenseur'||!k.open)return;const lab=labelLink(k);for(const c of [k.a,k.b]){const e={l:lvOf(c[0]),x:wx(c[2]),z:wz(c[1])};let n=0;
     const ix=Math.floor((e.x-G.bbox[0])/4),iz=Math.floor((e.z-G.bbox[1])/4);
     for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const L3=B4.get(c[0]*1e7+(ix+dx)*10000+(iz+dz));if(L3)for(const a of L3)if(Math.hypot(a.x-e.x,a.z-e.z)<4)n++;}
     if(n>=SEUIL.file){const q=`q${lab}:${e.l}`,o=Q.get(q);if(!o||o.n<n)Q.set(q,{n,lab,e});}}});
   Q.forEach((o,q)=>{const pos={x:o.e.x,z:o.e.z,lvl:o.e.l};upsert(q,'orange',`File d'attente devant ${o.lab}, niveau ${o.e.l} : ${o.n} personnes (débit d'un ascenseur ~0,6 pers./s)`,pos,()=>propTout(pos),vus);});
   // 7. temps restant d'évacuation (extrapolation du débit de sortie des 60 dernières secondes : estimé)
   ech.push([T,SIM.out]);while(ech.length>2&&ech[1][0]<T-60)ech.shift();
   const rest=A.filter(a=>!a.out).length;
   if(T>=90&&rest>0&&ech.length>1){const dt=T-ech[0][0],rate=(SIM.out-ech[0][1])/Math.max(1,dt);const eta=rate>0?rest/rate:Infinity;
    if(eta>SEUIL.evacMax){const pos={x:FORUM[0],z:FORUM[1],lvl:0};upsert('eta','orange',`Évacuation trop lente : ${rest} personnes restent, ${isFinite(eta)?'environ '+Math.round(eta/60)+' min':'plus aucune sortie constatée'} au débit actuel (estimé)`,pos,()=>[...(()=>{const F=LEV.filter(l=>l.type==='issue'&&l.etat==='fermé');return F.length?[{txt:F.length>1?`Ouvrir les ${F.length} issues de secours fermées`:'Ouvrir l\'issue de secours fermée',acteur:'chef de poste',run:()=>F.forEach(l=>levAction(l.id,'ouvrir')),valide:()=>F.some(l=>l.etat==='fermé')}]:[];})(),...propRatp({x:FORUM[0],z:FORUM[1]},500)],vus);}}
  }
  // 4. zone de manifestation ou de troubles qui touche une porte
  if(typeof ZONES!=='undefined')ZONES.forEach(Z=>portes().forEach(L=>{const G=SIM.groups[L.grp];const d=Math.hypot(L.x-Z.x,L.z-Z.z);const pos={x:L.x,z:L.z,lvl:L.niveau};
   if(Z.code==='D2'&&d<Z.r+10&&L.etat!=='fermé')upsert(`z${Z.id}:${L.id}`,'rouge',`Troubles devant ${L.nom} : porte bloquée de fait`,pos,()=>propPorte(pos,L),vus);
   else if(Z.code==='D1'&&d<Z.r+25&&G&&G.open)upsert(`z${Z.id}:${L.id}`,'orange',`La manifestation touche ${L.nom}, encore ouverte`,pos,()=>[{txt:`Poster un guide-files à ${L.nom}`,acteur:'chef de poste',run:()=>levAction(L.id,'agent'),valide:()=>!L.agent},...propPorte(pos,L)],vus);}));
  // fermeture des alertes résorbées
  for(const A2 of [...ACT.values()])if(!vus.has(A2.key)){A2.miss++;if(A2.miss>=SEUIL.fermeApres*(A2.key[0]==='q'?3:1))fermer(A2,'Résorbé');}
  // propositions devenues sans objet
  EV.forEach(e=>{if(e.type==='proposition'&&!e.clos&&!e.prop.valide())clore(e,'Sans objet : la situation a changé.');});
  const c=performance.now()-t0;COUT.n++;COUT.sum+=c;COUT.max=Math.max(COUT.max,c);}

 // ---------- Journal des changements de leviers ----------
 function snapshot(){const s={};LEV.forEach(L=>{s[L.id]=[L.etat,!!L.agent,!!L.annonce];});s.zones=ZONES.map(z=>z.id).join();return s;}
 addEventListener('levier',()=>{const n=snapshot();if(snap&&!quiet){const ch=[];LEV.forEach(L=>{const a=snap[L.id],b=n[L.id];if(!a||a.join()===b.join())return;const pos={x:L.x,z:L.z,lvl:L.niveau};
   if(a[0]!==b[0])ch.push({L,pos,k:L.type+'|'+b[0],txt:`${nomLev(L)} : ${b[0]}`});else if(a[1]!==b[1])ch.push({L,pos,k:'g',txt:`Guide-files ${b[1]?'posté':'retiré'} à ${L.nom}`});else ch.push({L,pos,k:'a',txt:`Annonce ${b[2]?'vers':'retirée de'} ${L.nom}`});});
   const par={};ch.forEach(c=>(par[c.k]=par[c.k]||[]).push(c));
   Object.values(par).forEach(G=>{if(G.length>2){const L=G[0].L;const etat=G[0].k.split('|')[1];const nom={bouche:'accès de métro et RER',issue:'issues de secours',porte:'portes',ascenseur:'ascenseurs'}[L.type]||'leviers';push('info',`${G.length} ${nom} : ${etat}`,G[0].pos);}else G.forEach(c=>push('info',c.txt,c.pos));});
   if(snap.zones!==n.zones){const z=ZONES[ZONES.length-1];push('info',n.zones.length>snap.zones.length&&z?`Zone ${z.code==='D1'?'de manifestation':'de troubles'} posée`:'Zone retirée',z?{x:z.x,z:z.z,lvl:0}:null);}}
  snap=n;});

 // ---------- Boucle : branchée sur simStep (aucun fichier voisin touché) ----------
 let lastT=0;
 function tick(){if(!SIM.A)return;const T=SIM.T||0;
  if(T<lastT-.01){ACT.forEach(A=>{A.ev.el.classList.add('off');A.props.forEach(e=>{if(!e.clos)clore(e,'Simulation relancée.');});});ACT.clear();HOT.clear();ech=[];PEND.length=0;lastDet=-1e9;push('info','Simulation relancée',null);majN();}
  jouer(Math.max(0,T-lastT));lastT=T;
  if(SIM.mode!==lastMode){if(lastMode!==null)push('info',SIM.mode==='evac'?'Alerte déclenchée : évacuation en cours':'Retour à la situation calme',null);lastMode=SIM.mode;}
  if(T-lastDet>=SEUIL.pas){lastDet=T;detecter();}}
 const orig=window.simStep;if(typeof orig==='function')window.simStep=function(dt){const r=orig.apply(this,arguments);try{tick();}catch(x){console.warn('alertes',x);}return r;};
 setInterval(()=>{try{if(!SIM.on)tick();}catch(x){}},1000);
 window.alertes={events:EV,actives:ACT,seuils:SEUIL,cout:COUT,hot:HOT,detecter,tick,valider:e=>valider(e),refuser:e=>refuser(e),pending:PEND,parler:v=>{voix=!!v;}};
})();
