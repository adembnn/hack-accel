// Lot « plans » : compare 3 plans d'évacuation rejoués en accéléré à partir de l'état courant (10 min simulées),
// avec les mêmes graines aléatoires. Ne touche ni à sim.js ni aux leviers : chaque plan joue sur une COPIE de l'état
// (agents, compteurs, groupes de sortie, cartes de distance, liens verticaux) échangée avec l'état vivant le temps d'une
// tranche de calcul, puis rendue. L'état vivant n'est donc jamais modifié entre deux tranches.
// API : window.plans.comparer({duree,graine}) -> Promise<{lignes,recommande,resume}> ; window.plans.proposer(id).
// Rien n'est appliqué sans validation : « Proposer au PC sécurité » écrit une carte dans le journal du directeur.
(function(){
 const DUREE=600,PAS=.1,TRANCHE_MS=30;
 // délais réels (dispositif.json) : sonorisation 30 s, guide-files 120 s (estimé) ; fermeture de porte = présence d'agents (120 s)
 const DELAI={annonce:30,agent:120,fermer:120};
 let enCours=null,dernier=null;

 function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

 // ---- échange d'état (tout ce que simStep lit ou écrit) ----
 function capture(){return{A:SIM.A,T:SIM.T,out:SIM.out,outBy:SIM.outBy,expo:SIM.expo,dmax:SIM.dmax,zoneOut:SIM.zoneOut,mode:SIM.mode,F:SIM.F,
  G:SIM.groups.map(g=>({open:g.open,agent:g.agent,annonce:g.annonce,zone:g.zone,nextFree:g.nextFree,cells:g.cells})),
  L:SIM.g.links.map(k=>({free:k.free,open:k.open,debit:k.debit}))};}
 function appliquer(s){SIM.A=s.A;SIM.T=s.T;SIM.out=s.out;SIM.outBy=s.outBy;SIM.expo=s.expo;SIM.dmax=s.dmax;SIM.zoneOut=s.zoneOut;SIM.mode=s.mode;SIM.F=s.F;
  SIM.groups.forEach((g,i)=>{const o=s.G[i];g.open=o.open;g.agent=o.agent;g.annonce=o.annonce;g.zone=o.zone;g.nextFree=o.nextFree;g.cells=o.cells;});
  SIM.g.links.forEach((k,i)=>{const o=s.L[i];k.free=o.free;k.open=o.open;k.debit=o.debit;});}
 function copie(s){const c=capture();return{A:s.A.map(a=>Object.assign({},a)),T:s.T,out:s.out,outBy:Object.assign({},s.outBy),expo:s.expo,dmax:s.dmax,zoneOut:s.zoneOut,mode:s.mode,F:s.F.slice(),
  G:s.G.map(o=>Object.assign({},o)),L:s.L.map(o=>({free:o.free.slice(),open:o.open,debit:o.debit}))};}

 // ---- effets d'un plan, appliqués sur l'état échangé (SIM = état du plan) ----
 const idxGroupe=nom=>SIM.groups.findIndex(G=>G.n===nom&&G.type==='rue');
 const EFF={
  agent:k=>{SIM.groups[k].agent=true;},
  annonce:(ks,seul)=>{if(seul)SIM.groups.forEach(G=>G.annonce=false);ks.forEach(k=>SIM.groups[k].annonce=true);
   if(SIM.mode==='evac')SIM.A.forEach(a=>{if(SIM.T<a.pre+SIM.delay)a.pre=Math.min(a.pre,SIM.T-SIM.delay+ll(10,3));});},
  fermer:k=>{const G=SIM.groups[k];G.open=false;SIM.F[k]=new Float32Array(SIM.N*SIM.L);simField(k);},
  // issue de secours n°j (indice dans G.all, comme LEV 'issue-j') : retirée du groupe
  issue:j=>{const k=SIM.groups.findIndex(G=>G.type==='secours');if(k<0)return;const G=SIM.groups[k],e=G.all&&G.all[j];if(!e)return;G.cells=G.cells.filter(c=>c!==e);G.open=G.cells.length>0;SIM.F[k]=new Float32Array(SIM.N*SIM.L);simField(k);},
  // ratp : rouvre les quais (au moins une bouche rouverte)
  ratp:()=>{const k=SIM.groups.findIndex(G=>G.type==='train');if(k<0||SIM.groups[k].open)return;SIM.groups[k].open=true;SIM.F[k]=new Float32Array(SIM.N*SIM.L);simField(k);},
 };

 // portes candidates à partir de l'état de départ : couverture à 40 m (portée d'un guide-files) et porte la plus proche
 function analyse(A){const n=SIM.groups.length,cov=new Array(n).fill(0),near=new Array(n).fill(0);
  const cand=SIM.groups.map((G,k)=>({G,k})).filter(o=>o.G.open&&o.G.type==='rue'&&!o.G.zone);
  A.forEach(a=>{if(a.out||a.ride)return;const i=simCell(a);if(i<0)return;let b=-1,bd=1e9;
   cand.forEach(o=>{const d=SIM.F[o.k][i];if(d<40)cov[o.k]++;if(d<bd){bd=d;b=o.k;}});if(b>=0&&bd<1e9)near[b]++;});
  const tri=(t)=>cand.map(o=>o.k).sort((x,y)=>t[y]-t[x]||SIM.groups[y].cells.length-SIM.groups[x].cells.length);
  return{cov,near,parCouverture:tri(cov),parDemande:tri(near),zone:SIM.groups.map((G,k)=>({G,k})).filter(o=>o.G.open&&o.G.type==='rue'&&o.G.zone).map(o=>o.k),
   autres:cand.map(o=>o.k)};}

 // ---- définition des plans (évalués sur l'état de départ) ----
 function definir(base,etat0,fichier){
  const an=analyse(base.A),nom=k=>SIM.groups[k].n,ev=[],P=[];
  const mk=(id,titre,actions)=>({id,titre,actions});
  P.push(mk('A','Consigne actuelle',[]));
  if(fichier.length){
   fichier.forEach((f,j)=>{const p=f.plan||{},ign=[],actions=[];
    const ks=l=>(l||[]).map(s=>{const k=idxGroupe(s);if(k<0)ign.push(s+' (pas une porte du Forum)');return k;}).filter(k=>k>=0);
    const iss=[];ks((p.fermees||[]).filter(n=>{const m=/^Issue de secours\s*(\d+)/i.exec(n);if(m){iss.push(+m[1]-1);return false;}return true;})).forEach(k=>actions.push({t:DELAI.fermer,type:'fermer',k,txt:`Fermer ${nom(k)}`}));
    iss.forEach(j=>actions.push({t:DELAI.fermer,type:'issue',j,txt:`Fermer l'issue de secours ${j+1}`}));
    if(p.ratp===true)actions.push({t:DELAI.annonce,type:'ratp',txt:'Demander à la RATP de rouvrir les bouches (liaison)'});
    ks(p.agents).forEach(k=>actions.push({t:DELAI.agent,type:'agent',k,txt:`Guide-files à ${nom(k)}`}));
    const an2=ks(p.annonces);if(an2.length)actions.push({t:DELAI.annonce,type:'annonce',ks:an2,seul:true,txt:`Annonce : sortir par ${an2.map(nom).join(', ')}`});
    if(p.vagues)ign.push('vagues non appliquées ici');if(p.escalators&&p.escalators!=='normal')ign.push('escalators « '+p.escalators+' » non appliqués ici');
    const q=mk('E'+(j+1),`Explorateur hors ligne #${j+1}${p.id?' ('+p.id+')':''}`,actions);q.ignore=ign;P.push(q);});
  }else{
   const d2=an.parCouverture.slice(0,2),d1=an.parDemande.slice(0,1);
   const B=[];d1.forEach(k=>B.push({t:DELAI.annonce,type:'annonce',ks:[k],seul:true,txt:`Annonce : sortir par ${nom(k)}`}));
   d2.forEach(k=>B.push({t:DELAI.agent,type:'agent',k,txt:`Guide-files à ${nom(k)}`}));
   P.push(mk('B','Sonorisation + guide-files',B));
   const C=[];if(an.zone.length&&an.autres.length)an.zone.forEach(k=>C.push({t:DELAI.fermer,type:'fermer',k,txt:`Fermer ${nom(k)} (en zone)`}));
   if(an.autres.length)C.push({t:DELAI.annonce,type:'annonce',ks:an.autres,seul:false,txt:`Annonce : sortir par les portes hors zone (${an.autres.map(nom).join(', ')})`});
   P.push(mk('C','Éviter les zones',C));
  }
  return P;}

 // ---- exécution par tranches ----
 function lancer(P,graine){const st=copie(capture()),calme=st.mode!=='evac';
  const run={P,etat:st,rng:mulberry32(graine),T0:st.T,out0:st.out,expo0:st.expo,zo0:st.zoneOut,n0:st.A.filter(a=>!a.out).length,ev:P.actions.slice().sort((a,b)=>a.t-b.t),
   alerte:calme,fait:false,zh:0,k:0,m5:null,m10:null,ms:0,dmax:0,sampleN:0};
  run.pas=Math.round(DUREE/PAS);return run;}
 function tranche(run){const vivant=capture();const mr=Math.random;Math.random=run.rng;const t0=performance.now();
  appliquer(run.etat);
  try{
   if(run.alerte&&!run.fait){simAlert();run.fait=true;}
   const zones=typeof ZONES!=='undefined'?ZONES:[],niv=SIM.g.levels;
   while(run.k<run.pas&&performance.now()-t0<TRANCHE_MS){
    while(run.ev.length&&run.ev[0].t<=SIM.T-run.T0+1e-6){const e=run.ev.shift();if(e.type==='fermer')EFF.fermer(e.k);else if(e.type==='issue')EFF.issue(e.j);else if(e.type==='ratp')EFF.ratp();else if(e.type==='agent')EFF.agent(e.k);else EFF.annonce(e.ks,e.seul);}
    simStep(PAS);run.k++;
    for(const a of SIM.A){if(a.out&&!a._o){a._o=1;if(a.t>=0&&SIM.groups[a.t].zone&&!a.zh){a.zh=1;run.zh++;}}}
    if(run.k%5===0&&zones.length)for(const a of SIM.A){if(a.out||a.ride||a.zh||niv[a.l]!==0)continue;if(zones.some(Z=>Math.hypot(a.x-Z.x,a.z-Z.z)<Z.r)){a.zh=1;run.zh++;}}
    const el=run.k*PAS;
    if(!run.m5&&el>=300-1e-6)run.m5=mesure(run);
    if(run.k>=run.pas)run.m10=mesure(run);}
  }finally{run.etat=capture();run.dmax=SIM.dmax;Math.random=mr;appliquer(vivant);run.ms+=performance.now()-t0;}
  return run.k>=run.pas;}
 function mesure(run){return{nonSortis:SIM.A.filter(a=>!a.out).length,expo:SIM.expo-run.expo0,zone:run.zh,sortis:SIM.out-run.out0};}

 // ---- verdict : critères dans l'ordre d'Adem, avec un seuil de bruit (une seule graine) ----
 function verdict(L,N){const tol={nonSortis:Math.max(10,.01*N),zone:Math.max(10,.01*N)};tol.expo=.05*Math.max(1,...L.map(l=>l.expo10));
  const crit=[['nonSortis','non sortis à 10 min','n10'],['zone','passés en zone','zone'],['expo','personnes-secondes > 5/m²','expo10']];
  let rest=L.slice(),decide=null;
  for(const[c,nom,f]of crit){const min=Math.min(...rest.map(l=>l[f]));const garde=rest.filter(l=>l[f]-min<=tol[c]);if(garde.length<rest.length&&!decide)decide=nom;rest=garde;}
  const best=rest.slice().sort((a,b)=>a._def.actions.length-b._def.actions.length||a.n10-b.n10)[0];
  const A=L[0];let raison;
  if(best===A&&!decide)raison='Aucun écart au-delà du bruit de la simulation (1 graine) : on garde la consigne actuelle.';
  else if(best===A)raison=`La consigne actuelle reste devant sur : ${decide}.`;
  else raison=`Devant sur : ${decide}. Les autres écarts sont sous le seuil de bruit ; à égalité on prend le plan qui change le moins de choses.`;
  return{best,raison,tol};}

 function resume(R){const b=R.recommande;return `Plan recommandé : ${b.id}, ${b.titre}. ${R.raison} `+R.lignes.map(l=>`${l.id} : ${l.n5} non sortis à 5 min, ${l.n10} à 10 min, ${l.zone} passés en zone, ${l.expo10} personnes-secondes au-dessus de 5 par mètre carré`).join(' ; ')+'. À valider par le chef de poste.';}

 function comparer(opts){opts=opts||{};if(enCours)return enCours.promesse;
  if(!SIM.A||!SIM.g)return Promise.reject(new Error('Simulation non prête'));
  const graine=opts.graine??20261022;const duree=opts.duree;
  const promesse=new Promise(async(res,rej)=>{
   try{
    let fichier=[];try{const r=await fetch('../commun/plans-forum.json');if(r.ok){const j=await r.json();fichier=(j.meilleurs||[]).slice(0,3);}}catch(e){}
    const base=capture(),etat0={T:SIM.T,mode:SIM.mode};const defs=definir({A:SIM.A},etat0,fichier);
    const runs=defs.map(P=>lancer(P,graine));const total=runs.length*runs[0].pas;let i=0;
    const T=performance.now();
    enCours.runs=runs;
    (function step(){if(enCours.annule){enCours=null;progress(null);return rej(new Error('annulé'));}
     const r=runs[i];const fini=tranche(r);progress((runs.slice(0,i).reduce((s,x)=>s+x.pas,0)+r.k)/total,`Plan ${r.P.id} · T+${Math.round(r.k*PAS)} s sur ${DUREE} s`);
     if(fini)i++;
     if(i>=runs.length){const N=runs[0].n0;
      const lignes=runs.map(r=>({id:r.P.id,titre:r.P.titre,actions:r.P.actions.map(a=>`${a.txt} (à +${a.t} s)`),ignore:r.P.ignore||[],alerte:r.alerte,
       n5:r.m5.nonSortis,n10:r.m10.nonSortis,zone:r.m10.zone,expo10:Math.round(r.m10.expo),expo5:Math.round(r.m5.expo),dmax:r.dmax,ms:Math.round(r.ms),_def:r.P}));
      const v=verdict(lignes,N);const R={lignes,recommande:v.best,raison:v.raison,tol:v.tol,T0:runs[0].T0,mode0:etat0.mode,graine,dureeCalculMs:Math.round(performance.now()-T),population:N};
      R.resume=resume(R);dernier=R;enCours=null;progress(null);afficher(R);res(R);return;}
     setTimeout(step,0);})();
   }catch(e){enCours=null;progress(null);rej(e);}});
  enCours={promesse,annule:false};return promesse;}

 // ---- proposition au PC sécurité (carte dans le journal du directeur ; rien d'appliqué sans validation) ----
 function proposer(id){const R=dernier;if(!R)return null;const L=R.lignes.find(l=>l.id===id);if(!L)return null;
  const acts=L._def.actions,txt=acts.length?acts.map(a=>a.txt).join(' ; '):'Maintenir la consigne actuelle (aucune action en plus)';
  const Lg=document.getElementById('dirLog');if(!Lg)return null;
  const d=document.createElement('div');d.className='prop';
  d.style.cssText='border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:4px;padding:6px 8px;margin:0 0 8px;font-size:12px';
  d.innerHTML=`<b>Proposition au PC sécurité · plan ${L.id}, ${L.titre}</b><br>${txt}<div class="k" style="font-size:11px">Rejoué à T+${Math.round(R.T0)} s : ${L.n10} non sortis à 10 min, ${L.zone} passés en zone, ${L.expo10} personnes-secondes au-dessus de 5/m².${R.mode0!=='evac'?' Suppose l\'alarme générale.':''}</div>
   <div class="row" style="margin-top:5px"><button class="ok">Valider (chef de poste)</button><button class="no">Refuser</button></div>`;
  Lg.prepend(d);if(window.showTab)showTab('directeur');
  const reg=(dec)=>{if(window.registre){registre.push({heure:new Date().toLocaleTimeString('fr-FR'),T:Math.round(SIM.T),decision:dec,par:'chef de poste',source:'Comparateur de plans'});const E=document.getElementById('regList');if(E)E.innerHTML=registre.slice().reverse().map(r=>`<div style="margin-bottom:4px">${r.heure} · T+${r.T} s · ${r.decision}</div>`).join('');}};
  d.querySelector('.ok').onclick=()=>{d.querySelector('.row').innerHTML=`<span class="k">Validé à T+${Math.round(SIM.T)} s</span>`;reg('Plan '+L.id+' : '+txt);appliquerVivant(acts);window.dispatchEvent(new CustomEvent('plan-retenu',{detail:{plan:L.id,ordres:acts.map(a=>a.txt),note:`${L.titre} : ${L.n10} non sortis à 10 min, ${L.zone} passés en zone, ${L.expo10} pers.-s > 5/m² (rejeu en direct, T+${Math.round(R.T0)} s, ${DUREE} s simulées)`}}));};
  d.querySelector('.no').onclick=()=>{d.querySelector('.row').innerHTML='<span class="k">Refusé</span>';reg('Refusé, plan '+L.id+' : '+txt);};
  return d;}
 const PEND=[];let lastT=0;
 function appliquerVivant(acts){if(SIM.mode!=='evac')simAlert();acts.forEach(a=>PEND.push({rest:a.t,a}));}
 (function tick(){const dT=Math.max(0,(SIM.T||0)-lastT);lastT=SIM.T||0;
  for(let i=PEND.length-1;i>=0;i--){PEND[i].rest-=dT;if(PEND[i].rest<=0){const a=PEND.splice(i,1)[0].a;try{
   const porte=k=>LEV.find(l=>l.type==='porte'&&l.grp===k);
   if(a.type==='fermer'){const l=porte(a.k);if(l)levAction(l.id,'fermer');}
   else if(a.type==='issue'){levAction('issue-'+a.j,'fermer');}
   else if(a.type==='ratp'){LEV.forEach(l=>{if(l.type==='bouche')l.etat='ouvert';});levRefresh();}
   else if(a.type==='agent'){const l=porte(a.k);if(l&&!l.agent)levAction(l.id,'agent');}
   else if(a.type==='annonce'){a.ks.forEach(k=>{const l=porte(k);if(l&&!l.annonce)levAction(l.id,'annonce');});}}catch(e){}}}
  setTimeout(tick,250);})();

 // ---- interface ----
 let ui=null;
 function progress(v,txt){if(!ui)return;ui.prog.hidden=v==null;ui.stop.hidden=v==null;ui.go.disabled=v!=null;if(v!=null){ui.prog.value=v;ui.st.textContent=txt;}}
 function afficher(R){const b=R.recommande;
  const ln=R.lignes.map(l=>`<tr${l===b?' style="font-weight:600"':''}><td style="text-align:left">${l===b?'★ ':''}${l.id}. ${l.titre}<br><button data-pl="${l.id}" style="padding:1px 5px;font-size:11px;margin-top:2px;font-weight:400">Choisir ce plan</button></td><td>${l.n5}</td><td>${l.n10}</td><td>${l.zone}</td><td>${l.expo10.toLocaleString('fr-FR')}</td></tr>`).join('');
  const det=R.lignes.map(l=>`<div><b>${l.id}</b> · ${l.actions.length?l.actions.join(' ; '):'aucune action en plus'}${l.ignore.length?`<br><i>Non appliqué : ${l.ignore.join(' ; ')}</i>`:''}</div>`).join('');
  ui.res.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:11px;text-align:right"><thead><tr style="color:var(--ink2)"><th style="text-align:left">Plan</th><th>Non sortis 5 min</th><th>Non sortis 10 min</th><th>Passés en zone</th><th>Pers.·s &gt; 5/m²</th></tr></thead><tbody>${ln}</tbody></table>
   <div style="margin:6px 0;font-size:12px"><b>Recommandé : ${b.id}, ${b.titre}.</b> ${R.raison}</div>
   <div class="row"><button data-pl="${b.id}" style="flex:1;padding:7px 8px">Proposer au PC sécurité : plan ${b.id}</button></div>
   <div class="k" style="font-size:11px;margin-top:6px;line-height:1.45">${det}<br>Départ à T+${Math.round(R.T0)} s${R.mode0!=='evac'?' (alarme générale supposée à cet instant)':''} · ${R.population} personnes · mêmes graines pour tous les plans · calcul ${(R.dureeCalculMs/1000).toFixed(1)} s. Ordre des critères : non sortis, passés en zone, écrasement ; écarts sous ${Math.round(R.tol.nonSortis)} personnes (bruit, 1 graine) comptés égaux. Délais : annonce 30 s, agents et fermetures 120 s (estimés).</div>`;
  ui.res.querySelectorAll('button[data-pl]').forEach(bt=>bt.onclick=()=>proposer(bt.dataset.pl));}
 function monter(){const pane=document.querySelector('.tabp[data-tab="simuler"]');if(!pane){setTimeout(monter,300);return;}
  const bloc=document.createElement('div');bloc.id='plBloc';
  bloc.innerHTML=`<h2>Comparer des plans</h2><div class="row"><button id="plGo" style="flex:1;padding:7px 8px">Comparer 3 plans</button><button id="plStop" hidden>Annuler</button></div>
   <progress id="plProg" value="0" max="1" hidden style="width:100%;margin-top:6px"></progress><div id="plSt" class="k" style="font-size:11px;margin-top:2px"></div><div id="plRes" style="margin-top:6px"></div>`;
  pane.appendChild(bloc);ui={go:bloc.querySelector('#plGo'),stop:bloc.querySelector('#plStop'),prog:bloc.querySelector('#plProg'),st:bloc.querySelector('#plSt'),res:bloc.querySelector('#plRes')};
  ui.go.onclick=()=>comparer().catch(e=>{ui.st.textContent=e.message;});ui.stop.onclick=()=>{if(enCours)enCours.annule=true;};}
 monter();
 window.plans={comparer,proposer,get dernier(){return dernier;}};
})();
