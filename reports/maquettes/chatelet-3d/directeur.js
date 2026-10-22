// Le directeur parle à l'outil : reconnaissance vocale du navigateur (fr-FR), compréhension des ordres, actions sur la
// simulation, réponse parlée. Sans appel payant : la compréhension est faite par règles. Un modèle de langage pourra
// remplacer `comprendre()` (même sortie : une liste d'actions) quand le fournisseur sera choisi.
(function(){
 const pane=document.querySelector('.tabp[data-tab="directeur"]');if(!pane)return;
 pane.innerHTML=`<h2>Cellule de crise</h2>
 <div class="row"><button id="dirMic" style="flex:1;padding:10px 8px;font-size:13px">● Parler à l'outil</button></div>
 <div class="row" style="margin-top:6px"><input id="dirTxt" placeholder="ou tapez : manifestation rue Berger, que faire ?" style="flex:1;font:inherit;font-size:12px;padding:5px 6px;border:1px solid var(--line);border-radius:4px;background:transparent;color:var(--ink)"></div>
 <div id="dirEx" class="k" style="font-size:11px;margin-top:6px;line-height:1.5">Exemples : « une manifestation arrive rue Berger » · « ferme la porte Rambuteau » · « les stations sont fermées » · « poste un agent porte du Louvre » · « lance l'évacuation » · « que faire ? »</div>
 <h2>Journal</h2><div id="dirLog" style="font-size:12px;max-height:38vh;overflow:auto"></div>`;
 const log=(who,txt)=>{const d=document.createElement('div');d.style.cssText='margin:0 0 8px;'+(who==='outil'?'':'color:var(--ink2)');d.innerHTML=`<b>${who==='outil'?'Outil':'Directeur'}</b> · ${txt}`;const L=document.getElementById('dirLog');L.prepend(d);};
 const dire=t=>{try{const u=new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g,''));u.lang='fr-FR';u.rate=1.05;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}};
 const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,' ');

 // lieux reconnus : portes du Forum et rues autour
 function lieux(){const out=[];LEV.filter(l=>l.type==='porte').forEach(l=>{const k=norm(l.nom.replace(/^Porte (du |de la |de )?/,''));out.push({k,nom:l.nom,x:l.x,z:l.z,porte:l});});
  const seen={};SCN.rues.forEach(o=>{if(!o.n)return;const pts=pairs(o.p);pts.forEach(([x,z])=>{const d=Math.hypot(x-FORUM[0],z-FORUM[1]);if(d<450&&(!seen[o.n]||d<seen[o.n].d))seen[o.n]={x,z,d};});});
  Object.entries(seen).forEach(([n,p])=>out.push({k:norm(n).replace(/^(rue|boulevard|place|allee|passage|square|avenue|quai) (de la |du |des |de l |de )?/,''),nom:n,x:p.x,z:p.z}));
  out.push({k:'chatelet',nom:'place du Châtelet',x:FORUM[0]+40,z:FORUM[1]+230});return out.filter(l=>l.k.length>2).sort((a,b)=>b.k.length-a.k.length);}
 // le lieu cité le plus tôt dans la proposition ; pour une porte on préfère l'épingle de porte, sinon la rue
 function trouverLieu(t,porte){const L=lieux().map(l=>({l,i:t.search(new RegExp('\\b'+l.k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b'))})).filter(o=>o.i>=0);
  if(!L.length)return null;L.sort((a,b)=>a.i-b.i||(porte?(!!b.l.porte-!!a.l.porte):(!!a.l.porte-!!b.l.porte))||b.l.k.length-a.l.k.length);return L[0].l;}
 const has=(t,re)=>new RegExp('\\b('+re+')').test(t);
 // Compréhension par règles : texte -> actions, proposition par proposition
 function comprendre(texte){const A=[];let question=false;
  norm(texte).split(/[,.;?!]| et | puis | mais | alors /).map(c=>c.trim()).filter(Boolean).forEach(t=>{
   const zl=trouverLieu(t,false),pl=trouverLieu(t,true),porte=pl&&pl.porte;
   if(has(t,'que faire|comment|quoi faire|recommand|conseil|meilleur|on fait quoi|propos'))question=true;
   const fin=has(t,'arret|stop|retir|leve[rz]?|lever|termin|disperse|dispersee|enleve|supprim|fini|partie?s?|annule');
   if(fin&&has(t,'manif|cortege|rassemblement|trouble|casseur|zone'))A.push({a:'finZone',lieu:zl,code:has(t,'trouble|casseur')?'D2':has(t,'manif|cortege|rassemblement')?'D1':null});
   else if(has(t,'ascenseurs?'))A.push({a:'ascenseurs',ferme:!has(t,'rouvr|reouvr|remet|remarch|repar|fonctionne a nouveau|en service'),lieu:zl});
   else if(has(t,'escalators?|escaliers? mecaniques?'))A.push({a:'escalators',arret:!has(t,'rouvr|remet|redemar|remarch|repar|en marche')});
   else if(has(t,'manif|cortege|rassemblement'))A.push({a:'zone',code:'D1',lieu:zl});
   else if(has(t,'trouble|casseur|affrontement|bagarre|degradation|violence'))A.push({a:'zone',code:'D2',lieu:zl});
   else if(has(t,'stations?|metro|rer|bouches?')&&has(t,'ferm|coup'))A.push({a:'bouches',ferme:true});
   else if(has(t,'stations?|metro|rer|bouches?')&&has(t,'rouvr|reouvr|ouvr'))A.push({a:'bouches',ferme:false});
   else if(porte&&has(t,'ferm|bloqu|condamn'))A.push({a:'levier',id:porte.id,act:'fermer'});
   else if(porte&&has(t,'rouvr|reouvr|ouvre[rsz]?|ouvrez'))A.push({a:'levier',id:porte.id,act:'ouvrir'});
   else if(porte&&has(t,'agent|steward|vigile|securite'))A.push({a:'levier',id:porte.id,act:'agent'});
   else if(porte&&has(t,'annonce|diffus|sono'))A.push({a:'levier',id:porte.id,act:'annonce'});
   if(has(t,'evacu|faire sortir|vider')&&!question)A.push({a:'evacuer'});});
  if(question||!A.length)A.push({a:'conseil'});return A;}

 // État des sorties : ouvertes, hors zone, charge actuelle (personnes en route)
 function conseil(){const load={};if(SIM.A)SIM.A.forEach(a=>{if(!a.out&&a.t>=0)load[a.t]=(load[a.t]||0)+1;});
  const ok=SIM.groups.map((G,k)=>({G,k,n:load[k]||0})).filter(o=>o.G.open&&o.G.type!=='train');
  const bonnes=ok.filter(o=>!o.G.zone).sort((a,b)=>a.n-b.n).slice(0,3).map(o=>o.G.n);
  const evitees=ok.filter(o=>o.G.zone).map(o=>o.G.n);const fermees=SIM.groups.filter(G=>!G.open).map(G=>G.n);
  let r=`Sorties à privilégier : ${bonnes.join(', ')||'aucune'}.`;if(evitees.length)r+=` À éviter, trop près d'une zone : ${evitees.join(', ')}.`;if(fermees.length)r+=` Fermées : ${fermees.join(', ')}.`;
  if(SIM.mode!=='evac')r+=' Je peux lancer l\'évacuation vers ces sorties si vous le demandez.';
  return r+' (Calcul simple sur l\'état de la simulation ; les décideurs compareront bientôt plusieurs plans.)';}

 function executer(texte){log('directeur',texte);const A=comprendre(texte),dit=[];
  A.forEach(x=>{
   if(x.a==='zone'){if(!x.lieu){dit.push(`Où se trouve ${x.code==='D1'?'la manifestation':'le trouble'} ? Dites par exemple « rue Berger ».`);return;}
    addZone(x.code,x.lieu.x,x.lieu.z);camFly([x.lieu.x+90,90,x.lieu.z+120],[x.lieu.x,0,x.lieu.z]);dit.push(`${x.code==='D1'?'Manifestation':'Zone de troubles'} posée ${x.lieu.nom}.`);}
   else if(x.a==='finZone'){const Z=ZONES.filter(z=>(!x.code||z.code===x.code)&&(!x.lieu||Math.hypot(z.x-x.lieu.x,z.z-x.lieu.z)<z.r+80));const cible=Z.length?Z:(x.lieu||x.code?[]:ZONES.slice());
    cible.slice().forEach(removeZone);dit.push(cible.length?`${cible.length>1?cible.length+' zones levées':'Zone levée'}${x.lieu?' '+x.lieu.nom:''} : les portes voisines redeviennent normales.`:'Aucune zone à lever ici.');}
   else if(x.a==='ascenseurs'){const As=LEV.filter(l=>l.type==='ascenseur'&&(!x.lieu||Math.hypot(l.x-x.lieu.x,l.z-x.lieu.z)<80));const vis=As.length?As:LEV.filter(l=>l.type==='ascenseur');
    vis.forEach(l=>{if((l.etat==='fermé')!==x.ferme)toggleLever(l.id);});dit.push(`${vis.length} ascenseur${vis.length>1?'s':''}${x.lieu&&As.length?' près de '+x.lieu.nom:''} ${x.ferme?'hors service : ils ne servent plus dans la simulation ; les personnes à mobilité réduite attendent les secours':'remis en service'}.`);}
   else if(x.a==='escalators'){SIM.g.links.forEach(k=>{if(k.k==='escalator')k.debit=x.arret?.9:1.25;});const cb=[...document.querySelectorAll('#perturb label')].find(l=>/Escalators/.test(l.textContent));if(cb)cb.querySelector('input').checked=x.arret;
    dit.push(x.arret?'Escalators arrêtés : ils servent d\'escaliers, le débit baisse.':'Escalators remis en marche.');}
   else if(x.a==='bouches'){LEV.forEach(l=>{if(l.type==='bouche')l.etat=x.ferme?'fermé':'ouvert';});levRefresh();dit.push(x.ferme?'Bouches de métro et RER fermées : les quais ne sont plus une sortie.':'Bouches rouvertes.');}
   else if(x.a==='levier'){levAction(x.id,x.act);const L=LEV.find(l=>l.id===x.id);dit.push({fermer:`${L.nom} fermée.`,ouvrir:`${L.nom} rouverte.`,agent:`Agent posté à ${L.nom} : il guide le public vers cette sortie.`,annonce:`Annonce diffusée : sortir par ${L.nom}.`}[x.act]);}
   else if(x.a==='evacuer'){if(SIM.mode!=='evac')simAlert();showTab&&0;dit.push('Évacuation lancée.');}
   else if(x.a==='conseil'){dit.push(conseil());
    // s'appuyer sur le dispositif en place : propositions au PC sécurité, à valider par le chef de poste
    if(window.dispositif){dispositif.proposer('sonorisation');dispositif.proposer('guide-serre-files');dit.push('Deux propositions sont envoyées au PC sécurité : un message de sonorisation et des guide-files aux portes conseillées. Le chef de poste les valide.');}}});
  const rep=dit.join(' ');log('outil',rep);dire(rep);}

 const txt=document.getElementById('dirTxt');txt.addEventListener('keydown',e=>{if(e.key==='Enter'&&txt.value.trim()){executer(txt.value.trim());txt.value='';}});
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const mic=document.getElementById('dirMic');
 if(!SR){mic.disabled=true;mic.textContent='Micro non disponible ici (tapez l\'ordre)';}
 else{const rec=new SR();rec.lang='fr-FR';rec.interimResults=true;rec.continuous=false;let on=false;
  rec.onresult=e=>{const r=e.results[e.results.length-1];txt.value=r[0].transcript;if(r.isFinal){executer(r[0].transcript);txt.value='';}};
  rec.onend=()=>{on=false;mic.textContent='● Parler à l\'outil';mic.classList.remove('on');};
  rec.onerror=e=>log('outil','Micro : '+e.error);
  mic.onclick=()=>{if(on){rec.stop();return;}try{rec.start();on=true;mic.textContent='■ J\'écoute… (cliquez pour arrêter)';mic.classList.add('on');}catch(e){}};}
 window.directeur={executer,comprendre};
})();
