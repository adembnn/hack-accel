// Le directeur parle à l'outil : reconnaissance vocale du navigateur (fr-FR), compréhension des ordres, actions sur la
// simulation, réponse parlée. Sans appel payant : la compréhension est faite par règles. Un modèle de langage pourra
// remplacer `comprendre()` (même sortie : une liste d'actions) quand le fournisseur sera choisi.
(function(){
 const pane=document.querySelector('.tabp[data-tab="directeur"]');if(!pane)return;
 pane.innerHTML=`<h2>Cellule de crise</h2>
 <div class="row"><button id="dirMic" style="flex:1;padding:10px 8px;font-size:13px">● Parler à l'outil</button></div>
 <div class="row" style="margin-top:6px"><input id="dirTxt" placeholder="ou tapez : manifestation rue Berger, que faire ?" style="flex:1;font:inherit;font-size:12px;padding:5px 6px;border:1px solid var(--line);border-radius:4px;background:transparent;color:var(--ink)"></div>
 <div id="dirEx" class="k" style="font-size:11px;margin-top:6px;line-height:1.5">Exemples : « deux manifestations, une rue Berger et une rue Rambuteau » · « ferme la porte Rambuteau dans 5 minutes » · « quelles sorties sont fermées ? » · « une manifestation arrive rue Berger » · « ferme la porte Rambuteau » · « les stations sont fermées » · « poste un agent porte du Louvre » · « lance l'évacuation » · « que faire ? »</div>
 <h2>Journal</h2><div id="dirLog" style="font-size:12px;max-height:38vh;overflow:auto"></div>`;
 const log=(who,txt)=>{const d=document.createElement('div');d.style.cssText='margin:0 0 8px;'+(who==='outil'?'':'color:var(--ink2)');d.innerHTML=`<b>${who==='outil'?'Outil':'Directeur'}</b> · ${txt}`;const L=document.getElementById('dirLog');L.prepend(d);};
 const dire=t=>{try{const u=new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g,''));u.lang='fr-FR';u.rate=1.05;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}};
 const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,' ');

 // lieux reconnus : portes et issues du Forum, rues autour, repères plus lointains pour les cortèges
 const esc=k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 // repères hors du rayon de 450 m (mètres depuis le Forum, calculés depuis latitude/longitude, à ±30 m)
 const REPERES=[['Place de la République',1254,-632],['Hôtel de Ville',411,581],['Opéra',-1099,-1122]];
 let LXC=null,LXN=-1;
 function lieux(){if(LXC&&LXN===LEV.length)return LXC;const out=[];LEV.filter(l=>l.type==='porte').forEach(l=>{const k=norm(l.nom.replace(/^Porte (du |de la |de )?/,''));out.push({k,nom:l.nom,x:l.x,z:l.z,porte:l});});
  LEV.filter(l=>l.type==='issue').forEach(l=>out.push({k:norm(l.nom),nom:l.nom,x:l.x,z:l.z,porte:l,issue:true}));
  const seen={};SCN.rues.forEach(o=>{if(!o.n)return;const pts=pairs(o.p);pts.forEach(([x,z])=>{const d=Math.hypot(x-FORUM[0],z-FORUM[1]);if(d<450&&(!seen[o.n]||d<seen[o.n].d))seen[o.n]={x,z,d};});});
  Object.entries(seen).forEach(([n,p])=>out.push({k:norm(n).replace(/^(rue|boulevard|place|allee|passage|square|avenue|quai) (de la |du |des |de l |de )?/,''),nom:n,x:p.x,z:p.z}));
  out.push({k:'chatelet',nom:'Place du Châtelet',x:FORUM[0]+40,z:FORUM[1]+230});
  REPERES.forEach(([n,dx,dz])=>out.push({k:norm(n).replace(/^place (de la |du |de )?/,''),nom:n,x:FORUM[0]+dx,z:FORUM[1]+dz,loin:true}));
  LXC=out.filter(l=>l.k.length>2).sort((a,b)=>b.k.length-a.k.length);LXN=LEV.length;return LXC;}
 // le lieu cité le plus tôt dans la proposition ; pour une porte on préfère l'épingle de porte, sinon la rue
 function trouverLieu(t,porte){const L=lieux().map(l=>({l,i:t.search(new RegExp('\\b'+esc(l.k)+'\\b'))})).filter(o=>o.i>=0);
  if(!L.length)return null;L.sort((a,b)=>a.i-b.i||(porte?(!!b.l.porte-!!a.l.porte):(!!a.l.porte-!!b.l.porte))||b.l.k.length-a.l.k.length);return L[0].l;}
 // tous les lieux cités, dans l'ordre de la phrase, sans chevauchement (la rue est préférée à la porte de même nom)
 function lieuxDans(t){const used=[],out=[];const L=lieux().slice().sort((a,b)=>b.k.length-a.k.length||(!!a.porte-!!b.porte));
  L.forEach(l=>{const re=new RegExp('\\b'+esc(l.k)+'\\b','g');let m;while((m=re.exec(t))){const x=m.index,y=x+l.k.length;if(used.some(([p,q])=>x<q&&y>p))continue;used.push([x,y]);out.push({l,i:x});}});
  return out.sort((p,q)=>p.i-q.i);}
 const has=(t,re)=>new RegExp('\\b('+re+')').test(t);
 const NUM={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,quinze:15,vingt:20,trente:30,quarante:40,'quarante cinq':45,cinquante:50,soixante:60,'vingt cinq':25};
 const nombre=s=>{s=s.trim();return /^\d+$/.test(s)?+s:(NUM[s]??null);};
 // consigne horaire : « dans 5 minutes » -> secondes de simulation, et la phrase sans ce morceau
 function delai(t){let m=t.match(/\b(?:dans|d ici|au bout de)\s+(un quart d heure|une demi heure)/);
  if(m)return{s:/quart/.test(m[1])?900:1800,t:t.replace(m[0],' ')};
  m=t.match(/\b(?:dans|d ici|au bout de)\s+(\d+|[a-z]+(?: [a-z]+)?)\s+(secondes?|sec|minutes?|min|mn|heures?|h)\b/);
  if(m){const n=nombre(m[1]);if(n!=null){const u=m[2][0];return{s:n*(u==='s'?1:u==='h'?3600:60),t:t.replace(m[0],' ')};}}
  return{s:null,t};}
 function effectif(t){let m=t.match(/(\d[\d ]*\d|\d)\s*(?:personnes|manifestants|gens|participants|supporters|casseurs|individus|militants)/);if(m)return +m[1].replace(/ /g,'');
  m=t.match(/\b([a-z]+)\s+mille\b/);if(m&&nombre(m[1]))return nombre(m[1])*1000;if(has(t,'mille\\b'))return 1000;
  if(has(t,'centaine'))return 100;if(has(t,'millier'))return 1000;if(has(t,'dizaine'))return 10;return null;}
 const nomGroupe=t=>{const m=t.match(/\b(supporters|syndicats?|etudiants|lyceens|agriculteurs|taxis|casseurs|black blocs?|gilets jaunes|militants)\b/);return m?m[1][0].toUpperCase()+m[1].slice(1):null;};
 // « sauf Lescot et Berger » : on garde la liste de l'exception dans la même proposition
 function protegerSauf(t){return t.replace(/\bsauf\b([^.;?!]*)/g,(m,reste)=>{const parts=reste.split(/(,| et )/);let out='sauf',stop=false;
  parts.forEach(p=>{if(!stop&&/^\s*(ferm|ouvr|lanc|evacu|pos|annonc|post|arret|rouvr|que |quoi|combien|quelles?)/.test(p))stop=true;out+=(!stop&&(p===','||p===' et '))?' ~ ':p;});return out;});}
 const actDe=t=>has(t,'rouvr|reouvr|ouvr')?'ouvrir':has(t,'ferm|bloqu|condamn')?'fermer':has(t,'agent|steward|vigile|securite|guide')?'agent':has(t,'annonce|diffus|sono')?'annonce':has(t,'filtr')?'filtrer':null;
 const STOP=new Set('de du des la le les l d a au aux toutes tous tout ces cette cet leur leurs sur par pour sont est un une deux trois quatre cinq six sept huit et ou secours metro rer maintenant immediatement svp ferme fermez ferment fermer ouvre ouvrez ouvrir rouvre rouvrez poste postez annonce'.split(' '));
 const mots=s=>s.split(/\s+/).filter(w=>w.length>1&&!STOP.has(w));
 // sélecteur : « toutes les issues rue Berger », « toutes les portes sauf Lescot », « les bouches de la porte Berger »
 function selecteur(t){const fam={portes:['porte'],issues:['issue'],sorties:['porte','issue'],bouches:['bouche']};
  const m=t.match(/\b(portes|issues|sorties|bouches)\b/);if(!m)return null;
  const apres=t.slice(m.index+m[0].length),i=apres.indexOf('sauf');const motif=mots(i<0?apres:apres.slice(0,i));
  const sauf=i<0?[]:apres.slice(i+4).split('~').map(mots).filter(w=>w.length);
  const types=fam[m[1]];const nm=L=>norm(L.nom);
  const cibles=LEV.filter(L=>types.includes(L.type)&&motif.every(w=>nm(L).includes(w))&&!sauf.some(ws=>ws.every(w=>nm(L).includes(w))));
  return{cibles,motif,sauf,tout:!motif.length&&!sauf.length,fam:m[1]};}
 // questions d'état
 function etatDe(t){
  if(has(t,'quelles? (sorties|portes|issues|bouches|stations)')&&has(t,'ferm|bloqu')||has(t,'qu est ce qui est ferme|ce qui est ferme'))return'sorties_fermees';
  if(has(t,'combien')&&has(t,'restent?|reste|encore|dedans|a l interieur|presentes?|bloquees?'))return'restants';
  if(has(t,'combien')&&has(t,'sorti|evacue|dehors'))return'sortis';
  if((has(t,'ou (sont|est)|quelles?|combien')&&has(t,'manif|zones?|cortege|trouble|casseur')))return'zones';
  if(has(t,'densite|ecrasement|pression')&&has(t,'quelle|combien|niveau|quel'))return'densite';
  if(has(t,'programme|prevu|en attente|planifie'))return has(t,'qu est ce|quelles?|quoi|ordres|consignes')?'programme':null;
  if(has(t,'ou en est|point de situation|etat des lieux|bilan|la situation'))return'general';
  return null;}
 // Compréhension par règles : texte -> actions, proposition par proposition
 function comprendre(texte){const A=[];let question=false,last=null;
  protegerSauf(norm(texte)).split(/[,.;?!]| et | puis | mais | alors /).map(c=>c.trim()).filter(Boolean).forEach(c0=>{
   const dd=delai(c0);let t=dd.t.replace(/\b(sortie|issue)s? de secours\b/g,'issue').replace(/\bsorties? (rue|cote)\b/g,'issue $1').replace(/\s+/g,' ').trim();
   const push=o=>{if(dd.s!=null)o.delai=dd.s;A.push(o);return o;};
   if(has(t,'que faire|comment|quoi faire|recommand|conseil|meilleur|on fait quoi|propos'))question=true;
   const et=etatDe(t);if(et){push({a:'etat',sujet:et});return;}
   const lds=lieuxDans(t),zl=trouverLieu(t,false),pl=trouverLieu(t,true),porte=pl&&pl.porte;
   const fin=has(t,'arret|stop|retir|leve[rz]?|lever|termin|disperse|dispersee|enleve|supprim|fini|partie?s?|annule');
   const zonal=has(t,'manif|cortege|rassemblement|defile|trouble|casseur|affrontement|bagarre|degradation|violence|supporters?|syndicat');
   const code=has(t,'trouble|casseur|affrontement|bagarre|degradation|violence')?'D2':'D1';
   const S=selecteur(t),act=actDe(t);
   if(fin&&has(t,'manif|cortege|rassemblement|trouble|casseur|zone')){push({a:'finZone',lieu:zl,code:has(t,'trouble|casseur')?'D2':has(t,'manif|cortege|rassemblement')?'D1':null});last=null;}
   else if(has(t,'ascenseurs?')){push({a:'ascenseurs',ferme:!has(t,'rouvr|reouvr|remet|remarch|repar|fonctionne a nouveau|en service'),lieu:zl});last=null;}
   else if(has(t,'escalators?|escaliers? mecaniques?')){push({a:'escalators',arret:!has(t,'rouvr|remet|redemar|remarch|repar|en marche')});last=null;}
   else if(zonal){
    const mouv=has(t,'vers|jusqu|direction|depuis|rejoint|rejoignent|part|partent|partant|venant|remonte|descend|se dirige|progress');
    const marche=has(t,'cortege|defile|marche');
    if((lds.length>=2&&(mouv||marche))||(lds.length===1&&marche)){
     let dep=lds[0].l,arr=lds[1]?lds[1].l:null;const mk=t.search(/\b(vers|jusqu|en direction|direction|rejoint|rejoignent)/);
     if(mk>=0&&lds.length>=2){const ap=lds.find(o=>o.i>mk),av=lds.filter(o=>o.i<mk)[0];if(ap&&av){dep=av.l;arr=ap.l;}else if(ap){arr=ap.l;dep=lds.find(o=>o!==ap).l;}}
     push({a:'cortege',code,depart:dep,arrivee:arr,effectif:effectif(t),nom:nomGroupe(t)});last={k:'zone',code};}
    else{const o=push({a:'zone',code,lieu:zl});last={k:'zone',code,o};}}
   else if(S&&act&&!(S.tout&&S.fam==='bouches')){
    if(S.cibles.length)push({a:'levier',ids:S.cibles.map(l=>l.id),act});else push({a:'inconnu',txt:c0});last={k:'levier',act};}
   else if(has(t,'stations?|metro|rer|bouches?')&&has(t,'ferm|coup')){push({a:'bouches',ferme:true});last=null;}
   else if(has(t,'stations?|metro|rer|bouches?')&&has(t,'rouvr|reouvr|ouvr')){push({a:'bouches',ferme:false});last=null;}
   else if(porte&&act){push({a:'levier',id:porte.id,act});last={k:'levier',act};}
   else if(lds.length&&!has(t,'evacu|faire sortir|vider')){ // proposition sans verbe : « une rue Rambuteau », « la porte du Jour »
    if(last&&last.k==='zone'){const dep=lds[0].l;if(last.o&&!last.o.lieu)last.o.lieu=dep;else{const o=push({a:'zone',code:last.code,lieu:dep});last={k:'zone',code:last.code,o};}}
    else if(last&&last.k==='levier'&&porte)push({a:'levier',id:porte.id,act:last.act});
    else if(porte)push({a:'levier',id:porte.id,act:null});}
   if(has(t,'evacu|faire sortir|vider')&&!question)push({a:'evacuer'});});
  // une porte nommée avant le verbe (« l'issue X et la porte Y sont fermées ») prend l'action du levier suivant
  A.forEach((x,i)=>{if(x.a==='levier'&&!x.act){const n=A.slice(i+1).find(y=>y.a==='levier'&&y.act);if(n)x.act=n.act;else{x.a='inconnu';x.txt='quoi faire à '+(LEV.find(l=>l.id===x.id)||{}).nom;}}});
  if(question||!A.length)A.push({a:'conseil'});return A;}

 // État des sorties : ouvertes, hors zone, charge actuelle (personnes en route)
 function conseil(){const load={};if(SIM.A)SIM.A.forEach(a=>{if(!a.out&&a.t>=0)load[a.t]=(load[a.t]||0)+1;});
  const ok=SIM.groups.map((G,k)=>({G,k,n:load[k]||0})).filter(o=>o.G.open&&o.G.type!=='train');
  const bonnes=ok.filter(o=>!o.G.zone).sort((a,b)=>a.n-b.n).slice(0,3).map(o=>o.G.n);
  const evitees=ok.filter(o=>o.G.zone).map(o=>o.G.n);const fermees=SIM.groups.filter(G=>!G.open).map(G=>G.n);
  let r=`Sorties à privilégier : ${bonnes.join(', ')||'aucune'}.`;if(evitees.length)r+=` À éviter, trop près d'une zone : ${evitees.join(', ')}.`;if(fermees.length)r+=` Fermées : ${fermees.join(', ')}.`;
  if(SIM.mode!=='evac')r+=' Je peux lancer l\'évacuation vers ces sorties si vous le demandez.';
  return r+' (Calcul simple sur l\'état de la simulation ; les décideurs compareront bientôt plusieurs plans.)';}

 // Compréhension par Claude (serveur local, /api/directeur) : plusieurs ordres par phrase, noms exacts des listes.
 // Les réponses lues au directeur viennent toujours de l'exécution réelle, jamais du texte du modèle.
 function contexte(){const L=lieux();return{lieux:[...new Set(L.filter(l=>!l.issue).map(l=>l.nom))],
  leviers:LEV.filter(l=>l.type!=='incendie').map(l=>l.nom),
  etat:`mode ${SIM.mode} ; zones : ${ZONES.map(z=>z.code).join(', ')||'aucune'} ; fermés : ${LEV.filter(l=>l.etat==='fermé').map(l=>l.nom).join(', ')||'rien'}`};}
 const egal=(a,b)=>norm(a||'')===norm(b||'');
 function traduire(r){const L=lieux(),A=[];const lieu=n=>n?L.find(l=>egal(l.nom,n))||null:null;
  (r.actions||[]).forEach(x=>{const dl=x.delai_s>0?{delai:x.delai_s}:{};const P=o=>A.push({...o,...dl});
   if(x.type==='zone_poser')P({a:'zone',code:x.code||'D1',lieu:lieu(x.lieu)});
   else if(x.type==='zone_lever')P({a:'finZone',code:x.code,lieu:lieu(x.lieu)});
   else if(x.type==='cortege'){const d=lieu(x.depart);if(!d)A.push({a:'inconnu',txt:x.depart||'départ du cortège'});else P({a:'cortege',code:x.code||'D1',depart:d,arrivee:lieu(x.arrivee),effectif:x.effectif||null,nom:x.nom||null});
    if(x.arrivee&&!lieu(x.arrivee))A.push({a:'inconnu',txt:x.arrivee});}
   else if(x.type==='levier'){const noms=x.cibles&&x.cibles.length?x.cibles:(x.cible?[x.cible]:[]);const Vs=noms.map(n=>LEV.find(l=>egal(l.nom,n))),ok=Vs.filter(Boolean);
    if(ok.length&&['fermer','ouvrir','agent','annonce','filtrer'].includes(x.action))P({a:'levier',ids:ok.map(v=>v.id),act:x.action});
    noms.forEach((n,i)=>{if(!Vs[i])A.push({a:'inconnu',txt:n});});if(!noms.length)A.push({a:'inconnu',txt:'cible de l\'ordre'});}
   else if(x.type==='bouches_toutes')P({a:'bouches',ferme:x.action!=='ouvrir'});
   else if(x.type==='ascenseurs')P({a:'ascenseurs',ferme:x.action!=='ouvrir',lieu:lieu(x.lieu)});
   else if(x.type==='escalators')P({a:'escalators',arret:x.action!=='remettre'});
   else if(x.type==='etat')P({a:'etat',sujet:x.sujet||'general'});
   else if(x.type==='evacuer')P({a:'evacuer'});else if(x.type==='conseil')P({a:'conseil'});});
  (r.incompris||[]).forEach(t=>A.push({a:'inconnu',txt:t}));return A;}
 async function viaClaude(texte){const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),12000);
  try{const r=await fetch('/api/directeur',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texte,contexte:contexte()}),signal:ctl.signal});if(!r.ok)throw new Error(r.status);return await r.json();}finally{clearTimeout(to);}}
 async function executer(texte,sansClaude){log('directeur',texte);let A,src='règles';
  try{if(sansClaude)throw 0;const r=await viaClaude(texte);A=traduire(r);src=`Claude, ${r.ms} ms`;}catch(e){A=comprendre(texte);}
  appliquer(A,src);return A;}

 // Consignes horaires : file d'attente en temps de simulation (SIM.T), décomptée seulement quand la simulation avance
 const file=[];let lastT=null;
 const duree=s=>s<90?`${Math.round(s)} s`:s<5400?`${Math.round(s/60)} min`:`${(s/3600).toFixed(1).replace('.',',')} h`;
 setInterval(()=>{const T=(typeof SIM!=="undefined"&&SIM.T)||0;const dt=lastT==null?0:T-lastT;lastT=T;if(dt<0||!file.length)return; // dt<0 : la simulation a été remise à zéro
  file.forEach(c=>c.reste-=dt);const dues=file.filter(c=>c.reste<=0);dues.forEach(c=>file.splice(file.indexOf(c),1));
  if(dues.length)appliquer(dues.map(c=>c.x),'consigne programmée');},200);
 const noms=ids=>ids.map(i=>(LEV.find(l=>l.id===i)||{}).nom).filter(Boolean);
 const lister=n=>n.length>4?`${n.slice(0,4).join(', ')} et ${n.length-4} autres`:n.join(', ');
 function decrire(x){const V={fermer:'fermer',ouvrir:'rouvrir',agent:'poster un agent à',annonce:'annoncer la sortie par',filtrer:'filtrer'};
  switch(x.a){case'levier':return`${V[x.act]} ${lister(noms(x.ids||[x.id]))}`;case'zone':return`poser ${x.code==='D1'?'la manifestation':'les troubles'} ${x.lieu?x.lieu.nom:''}`;
   case'cortege':return`lancer le cortège${x.arrivee?' vers '+x.arrivee.nom:''}`;case'finZone':return'lever la zone';case'bouches':return x.ferme?'fermer les bouches de métro':'rouvrir les bouches';
   case'ascenseurs':return x.ferme?'mettre les ascenseurs hors service':'remettre les ascenseurs';case'escalators':return x.arret?'arrêter les escalators':'remettre les escalators';case'evacuer':return'lancer l\'évacuation';default:return'exécuter l\'ordre';}}

 // Réponses aux questions d'état : calculées sur LEV, SIM et ZONES, jamais par le modèle
 const rue=(x,z)=>{let b=null,d=1e9;lieux().forEach(l=>{if(l.porte||l.loin)return;const e=Math.hypot(l.x-x,l.z-z);if(e<d){d=e;b=l;}});return b&&d<250?b.nom:'hors des rues connues';};
 const pluriel=(n,s,p)=>`${n} ${n>1?(p||s+'s'):s}`;
 function etat(sujet){const T=SIM.A?SIM.A.length:0;
  const fer=()=>{const P=LEV.filter(l=>(l.type==='porte'||l.type==='issue')&&(l.etat==='fermé'||(l.type==='porte'&&SIM.groups[l.grp]&&!SIM.groups[l.grp].open)));
   const bo=LEV.filter(l=>l.type==='bouche'),bf=bo.filter(l=>l.etat==='fermé'),as=LEV.filter(l=>l.type==='ascenseur'&&l.etat==='fermé');
   const r=[];r.push(P.length?`Fermées : ${P.map(l=>l.nom).join(', ')}.`:'Aucune porte ni issue fermée.');
   r.push(bf.length?`${bf.length} bouche${bf.length>1?'s':''} de métro sur ${bo.length} fermée${bf.length>1?'s':''}${bf.length===bo.length?' : stations fermées':''}.`:'Toutes les bouches de métro sont ouvertes.');
   if(as.length)r.push(`${pluriel(as.length,'ascenseur')} hors service.`);return r.join(' ');};
  const rest=()=>{if(!SIM.A)return'La simulation n\'est pas chargée.';const n=SIM.A.filter(a=>!a.out).length;return SIM.mode==='evac'?`Il reste ${pluriel(n,'personne')} sur ${T}, ${SIM.out} sorties, à T+${Math.floor(SIM.T/60)} min ${String(Math.floor(SIM.T%60)).padStart(2,'0')}.`:`Pas d'évacuation en cours : ${T} personnes dans le périmètre.`;};
  const sor=()=>{if(!SIM.A||SIM.mode!=='evac')return'Pas d\'évacuation en cours : personne n\'est sorti.';const top=Object.entries(SIM.outBy).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,v])=>`${v} par ${n}`).join(', ');return`${SIM.out} personnes sorties sur ${T}${top?' ('+top+')':''}.`;};
  const zon=()=>{const Z=ZONES.map(z=>`${z.code==='D1'?'manifestation':'troubles'} ${rue(z.x,z.z)}`);let r=Z.length?`${pluriel(Z.length,'zone')} : ${Z.join(' ; ')}.`:'Aucune manifestation ni zone de troubles posée.';
   try{const c=window.cortege&&cortege.liste&&cortege.liste();if(c&&c.length)r+=` ${pluriel(c.length,'cortège')} en mouvement.`;}catch(e){}return r;};
  const den=()=>SIM.mode==='evac'?`Densité maximale ${SIM.dmax} pers./m², ${Math.round(SIM.expo)} personnes·secondes au-dessus de 5 pers./m².`:'La densité se mesure pendant l\'évacuation.';
  const pro=()=>file.length?'Programmé : '+file.map(c=>`${decrire(c.x)} dans ${duree(Math.max(0,c.reste))}`).join(' ; ')+'.':'Aucune consigne programmée.';
  const f={sorties_fermees:fer,restants:rest,sortis:sor,zones:zon,densite:den,programme:pro,general:()=>[fer(),rest(),zon(),file.length?pro():''].filter(Boolean).join(' ')};
  return(f[sujet]||f.general)();}
 function appliquer(A,src){const dit=[];
  // consignes horaires : mises en file, exécutées quand la simulation a avancé du délai
  A=A.filter(x=>{if(x.delai>0){file.push({reste:x.delai,x:{...x,delai:0}});dit.push(`Noté : ${decrire(x)} dans ${duree(x.delai)} de simulation.`);return false;}return true;});
  A.forEach(x=>{
   if(x.a==='inconnu'){dit.push(`Je n'ai pas reconnu « ${x.txt} ».`);return;}
   if(x.a==='etat'){dit.push(etat(x.sujet));return;}
   if(x.a==='cortege'){const d=x.depart,ar=x.arrivee;const qui=`${x.nom?x.nom+' : ':''}${x.code==='D1'?'cortège':'groupe de troubles'}${x.effectif?' de '+x.effectif+' personnes':''}`;
    let ok=false;if(window.cortege&&typeof cortege.ajouter==='function'){try{cortege.ajouter({code:x.code,nom:x.nom,depart:{x:d.x,z:d.z},arrivee:ar?{x:ar.x,z:ar.z}:null,effectif:x.effectif,vitesse_kmh:4});ok=true;}catch(e){}}
    if(!ok)addZone(x.code,d.x,d.z);camFly([d.x+90,90,d.z+120],[d.x,0,d.z]);
    dit.push(ok?`${qui} lancé depuis ${d.nom}${ar?' vers '+ar.nom:''}.`:`${qui} posé à ${d.nom}${ar?' (destination '+ar.nom+' notée, le module de cortèges n\'est pas chargé : zone fixe)':' (zone fixe)'}.`);return;}
   if(x.a==='zone'){if(!x.lieu){dit.push(`Où se trouve ${x.code==='D1'?'la manifestation':'le trouble'} ? Dites par exemple « rue Berger ».`);return;}
    addZone(x.code,x.lieu.x,x.lieu.z);camFly([x.lieu.x+90,90,x.lieu.z+120],[x.lieu.x,0,x.lieu.z]);dit.push(`${x.code==='D1'?'Manifestation':'Zone de troubles'} posée ${x.lieu.nom}.`);}
   else if(x.a==='finZone'){const Z=ZONES.filter(z=>(!x.code||z.code===x.code)&&(!x.lieu||Math.hypot(z.x-x.lieu.x,z.z-x.lieu.z)<z.r+80));const cible=Z.length?Z:(x.lieu||x.code?[]:ZONES.slice());
    cible.slice().forEach(removeZone);dit.push(cible.length?`${cible.length>1?cible.length+' zones levées':'Zone levée'}${x.lieu?' '+x.lieu.nom:''} : les portes voisines redeviennent normales.`:'Aucune zone à lever ici.');}
   else if(x.a==='ascenseurs'){const As=LEV.filter(l=>l.type==='ascenseur'&&(!x.lieu||Math.hypot(l.x-x.lieu.x,l.z-x.lieu.z)<80));const vis=As.length?As:LEV.filter(l=>l.type==='ascenseur');
    vis.forEach(l=>{if((l.etat==='fermé')!==x.ferme)toggleLever(l.id);});dit.push(`${vis.length} ascenseur${vis.length>1?'s':''}${x.lieu&&As.length?' près de '+x.lieu.nom:''} ${x.ferme?'hors service : ils ne servent plus dans la simulation ; les personnes à mobilité réduite attendent les secours':'remis en service'}.`);}
   else if(x.a==='escalators'){SIM.g.links.forEach(k=>{if(k.k==='escalator')k.debit=x.arret?.9:1.25;});const cb=[...document.querySelectorAll('#perturb label')].find(l=>/Escalators/.test(l.textContent));if(cb)cb.querySelector('input').checked=x.arret;
    dit.push(x.arret?'Escalators arrêtés : ils servent d\'escaliers, le débit baisse.':'Escalators remis en marche.');}
   else if(x.a==='bouches'){LEV.forEach(l=>{if(l.type==='bouche')l.etat=x.ferme?'fermé':'ouvert';});levRefresh();dit.push(x.ferme?'Bouches de métro et RER fermées : les quais ne sont plus une sortie.':'Bouches rouvertes.');}
   else if(x.a==='levier'){const ids=x.ids||[x.id];ids.forEach(id=>levAction(id,x.act));const Ls=ids.map(id=>LEV.find(l=>l.id===id)).filter(Boolean),n=lister(Ls.map(l=>l.nom));
    dit.push(Ls.length>1?{fermer:`Fermées : ${n}.`,ouvrir:`Rouvertes : ${n}.`,agent:`Agents postés à ${n}.`,annonce:`Annonce diffusée vers ${n}.`,filtrer:`Filtrées : ${n}.`}[x.act]:{fermer:`${n} fermée.`,ouvrir:`${n} rouverte.`,agent:`Agent posté à ${n} : il guide le public vers cette sortie.`,annonce:`Annonce diffusée : sortir par ${n}.`,filtrer:`${n} filtrée : débit réduit.`}[x.act]);}
   else if(x.a==='evacuer'){if(SIM.mode!=='evac')simAlert();showTab&&0;dit.push('Évacuation lancée.');}
   else if(x.a==='conseil'){dit.push(conseil());
    // s'appuyer sur le dispositif en place : propositions au PC sécurité, à valider par le chef de poste
    if(window.dispositif){dispositif.proposer('sonorisation');dispositif.proposer('guide-serre-files');dit.push('Deux propositions sont envoyées au PC sécurité : un message de sonorisation et des guide-files aux portes conseillées. Le chef de poste les valide.');}}});
  const rep=dit.join(' ');log('outil',rep+(src?` <span class="k">(${src})</span>`:''));dire(rep);return rep;}

 const txt=document.getElementById('dirTxt');txt.addEventListener('keydown',e=>{if(e.key==='Enter'&&txt.value.trim()){executer(txt.value.trim());txt.value='';}});
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const mic=document.getElementById('dirMic');
 if(!SR){mic.disabled=true;mic.textContent='Micro non disponible ici (tapez l\'ordre)';}
 else{const rec=new SR();rec.lang='fr-FR';rec.interimResults=true;rec.continuous=false;let on=false;
  rec.onresult=e=>{const r=e.results[e.results.length-1];txt.value=r[0].transcript;if(r.isFinal){executer(r[0].transcript);txt.value='';}};
  rec.onend=()=>{on=false;mic.textContent='● Parler à l\'outil';mic.classList.remove('on');};
  rec.onerror=e=>log('outil','Micro : '+e.error);
  mic.onclick=()=>{if(on){rec.stop();return;}try{rec.start();on=true;mic.textContent='■ J\'écoute… (cliquez pour arrêter)';mic.classList.add('on');}catch(e){}};}
 window.directeur={executer,comprendre,traduire,contexte,appliquer,etat,file,lieuxDans};
})();
