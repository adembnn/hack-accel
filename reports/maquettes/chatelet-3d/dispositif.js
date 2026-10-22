// Le dispositif de sécurité déjà en place (reports/dispositif-securite-existant.md, dispositif.json) : l'outil ne le
// remplace pas. Il PROPOSE au PC sécurité, dans le vocabulaire officiel ; le chef de poste valide, et seulement alors
// l'effet est joué dans la simulation, avec le délai réel quand il est connu. Chaque décision validée va au registre.
(function(){
 const TAB=['dispositif','Dispositif'];
 const REG=[];window.registre=REG;const PEND=[];
 // effets dans la simulation (les autres leviers sont tracés au registre sans effet simulé pour l'instant)
 const meilleures=n=>{const load={};(SIM.A||[]).forEach(a=>{if(!a.out&&a.t>=0)load[a.t]=(load[a.t]||0)+1;});
  return SIM.groups.map((G,k)=>({G,k,n:load[k]||0})).filter(o=>o.G.open&&o.G.type==='rue'&&!o.G.zone).sort((a,b)=>a.n-b.n).slice(0,n).map(o=>LEV.find(l=>l.type==='porte'&&l.grp===o.k)).filter(Boolean);};
 const EFFETS={
  'alarme-generale':{txt:'Déclencher l\'alarme générale : évacuation de tout le centre.',run:()=>{if(SIM.mode!=='evac')simAlert();},avert:'Hors incendie (manifestation, couvre-feu, colis), l\'alarme générale peut provoquer un mouvement de foule : à décider par le chef de poste.'},
  'lev-doute':{txt:'Ne pas attendre la fin de la levée de doute (5 min au plus) : alarme générale immédiate.',run:()=>{if(SIM.mode!=='evac')simAlert();}},
  'sonorisation':{txt:()=>{const b=meilleures(1)[0];return `Message de sonorisation : « Quittez le centre par ${b?b.nom:'la sortie la plus proche'} ».`;},run:()=>{const b=meilleures(1)[0];if(b)levAction(b.id,'annonce');}},
  'guide-serre-files':{txt:()=>`Positionner des guide-files à ${meilleures(2).map(l=>l.nom).join(' et ')||'deux portes'}.`,run:()=>meilleures(2).forEach(l=>{if(!l.agent)levAction(l.id,'agent');})},
  'issues-controle':{txt:'Déverrouiller depuis le PC toutes les issues à contrôle d\'accès.',run:()=>{LEV.forEach(l=>{if(l.type==='issue')l.etat='ouvert';});levRefresh();}},
  'cinema-l':{txt:'Demander à l\'UGC d\'interrompre les séances et de faire sortir les salles par vagues.',run:()=>{if(SIM.mode!=='evac')simAlert();(SIM.A||[]).forEach(a=>{if(a.kind==='cine')a.pre=Math.min(a.pre,SIM.T+ll(25,3.5));});}},
  'liaison-ratp':{txt:'Demander à la RATP de rouvrir au moins un accès des stations du Forum.',run:()=>{const b=LEV.find(l=>l.type==='bouche'&&l.etat==='fermé');if(b){b.etat='ouvert';levRefresh();}}},
 };
 // onglet
 const bar=document.getElementById('tabs');if(!bar)return;
 const b=document.createElement('button');b.textContent=TAB[1];b.dataset.tab=TAB[0];bar.insertBefore(b,bar.children[1]);
 const pane=document.createElement('div');pane.className='tabp';pane.dataset.tab=TAB[0];document.querySelector('.tabp[data-tab="directeur"]').after(pane);
 const st=document.createElement('style');st.textContent=`#tabs button{font-size:10px;letter-spacing:.03em}
 .dsp details{border-top:1px solid var(--line);padding:4px 0}.dsp summary{cursor:pointer;font-size:12px;color:var(--ink2);padding:3px 0}
 .dsp .it{padding:5px 0 6px 8px;font-size:12px}.dsp .it b{font-weight:600}.dsp .m{color:var(--ink2);font-size:11px}
 .dsp .c{display:inline-block;font-size:10px;padding:0 4px;border:1px solid var(--line);border-radius:3px;margin-left:4px;color:var(--ink2)}
 .prop{border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:4px;padding:6px 8px;margin:0 0 8px;font-size:12px}`;document.head.appendChild(st);
 const showT=k=>window.showTab&&showTab(k);
 fetch('dispositif.json').then(r=>r.json()).then(D=>{
  const fam={};D.forEach(e=>(fam[e.famille]=fam[e.famille]||[]).push(e));
  pane.innerHTML=`<div class="dsp"><h2>Dispositif en place</h2><div class="m" style="margin-bottom:6px">Ce qui existe déjà au Forum ou est obligatoire. L'outil propose au PC sécurité ; le chef de poste décide.</div>`+
   Object.entries(fam).map(([f,L],i)=>`<details${i<2?' open':''}><summary>${f} · ${L.length}</summary>${L.map(e=>`<div class="it"><b>${e.nom}</b><span class="c">${e.certitude}</span><br>
   <span class="m">${e.acteur||''}${e.delai_s!=null?' · délai '+(e.delai_s>=60?Math.round(e.delai_s/60)+' min':e.delai_s+' s'):''}</span><br>${e.role||''}
   ${EFFETS[e.id]?`<div class="row" style="margin-top:4px"><button data-p="${e.id}">Proposer au PC sécurité</button></div>`:(e.levier?`<div class="m">Levier : ${e.levier}</div>`:'')}</div>`).join('')}</details>`).join('')+
   `<h2>Registre de sécurité</h2><div id="regList" class="m">Aucune décision encore.</div></div>`;
  pane.onclick=ev=>{const bt=ev.target.closest('button[data-p]');if(bt)proposer(bt.dataset.p,D.find(e=>e.id===bt.dataset.p));};
  window.dispositif={D,proposer:id=>proposer(id,D.find(e=>e.id===id))};
 });
 function proposer(id,e){const E=EFFETS[id];if(!E)return;const txt=typeof E.txt==='function'?E.txt():E.txt;
  const L=document.getElementById('dirLog');const d=document.createElement('div');d.className='prop';
  d.innerHTML=`<b>Proposition au PC sécurité</b> · ${txt}${E.avert?`<div class="m" style="margin-top:3px">${E.avert}</div>`:''}<div class="m">${e.acteur||''}${e.delai_s?' · effet après '+(e.delai_s>=60?Math.round(e.delai_s/60)+' min':e.delai_s+' s'):''} · ${e.certitude}</div>
   <div class="row" style="margin-top:5px"><button class="ok">Valider (chef de poste)</button><button class="no">Refuser</button></div>`;
  L.prepend(d);showT('directeur');
  d.querySelector('.ok').onclick=()=>{const t=SIM.T+(e.delai_s||0);PEND.push({rest:e.delai_s||0,run:E.run,txt});d.querySelector('.row').innerHTML=`<span class="m">Validé à T+${Math.round(SIM.T)} s${e.delai_s?' · effet à T+'+Math.round(t)+' s':''}</span>`;
   REG.push({heure:new Date().toLocaleTimeString('fr-FR'),T:Math.round(SIM.T),decision:txt,par:'chef de poste',source:e.nom});majReg();};
  d.querySelector('.no').onclick=()=>{d.querySelector('.row').innerHTML='<span class="m">Refusé</span>';REG.push({heure:new Date().toLocaleTimeString('fr-FR'),T:Math.round(SIM.T),decision:'Refusé : '+txt,par:'chef de poste',source:e.nom});majReg();};
  try{const u=new SpeechSynthesisUtterance('Proposition au PC sécurité : '+txt);u.lang='fr-FR';speechSynthesis.speak(u);}catch(err){}}
 function majReg(){const R=document.getElementById('regList');if(R)R.innerHTML=REG.slice().reverse().map(r=>`<div style="margin-bottom:4px">${r.heure} · T+${r.T} s · ${r.decision}</div>`).join('');}
 // les effets validés partent au bon moment de la simulation
 // (délai décompté en temps simulé ; si la simulation repart de zéro, le décompte continue)
 let lastT=0;(function tick(){const dT=Math.max(0,(SIM.T||0)-lastT);lastT=SIM.T||0;
  for(let i=PEND.length-1;i>=0;i--){PEND[i].rest-=dT;if(PEND[i].rest<=0){const p=PEND.splice(i,1)[0];try{p.run();}catch(err){}}}setTimeout(tick,250);})();
})();
