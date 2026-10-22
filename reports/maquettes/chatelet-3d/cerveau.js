// Cerveau des agents : un appel à Claude Haiku par lot d'agents (POST /api/agents), avec un cache de rejeu.
// Contrat avec agents.js : window.cerveau.decider(lot, {projection}) -> {decisions:[{id, action, cible, message, raison}]} ;
// window.cerveau.etat() -> {mode:'claude'|'regles'|'cache', appels, jetons, cout_usd, cache_hits}.
// Pendant une projection (rejeu accéléré), le serveur n'est JAMAIS appelé : on rejoue le cache, et les agents sans
// décision en cache reçoivent {decisions:[]} (agents.js applique alors ses règles). Sans clé ou si le réseau échoue : mode 'regles'.
(function(){
 const ACTIONS=['deplacer','guider','crier','bloquer','ouvrir','appeler_pc','attendre'];
 // Tarif Haiku 5.5 = HYPOTHÈSE non vérifiée ($ par jeton), remplacée par le tarif renvoyé par le serveur (réglable côté serveur)
 let PRIX={entree:0.10/1e6,sortie:0.50/1e6,lecture_cache:0.01/1e6,ecriture_cache:0.125/1e6};
 const CLE_STOCK='cerveau-cache-v1',MAX_CACHE=600,DELAI_MS=9000;
 const cache=new Map();
 const S={mode:'regles',appels:0,jetons:0,cout_usd:0,cache_hits:0};
 let serveurOk=null; // null = pas encore su ; false = pas de clé

 try{const brut=localStorage.getItem(CLE_STOCK);if(brut)JSON.parse(brut).forEach(([k,v])=>cache.set(k,v));}catch(e){}
 const garder=()=>{try{localStorage.setItem(CLE_STOCK,JSON.stringify([...cache.entries()].slice(-MAX_CACHE)));}catch(e){}};

 // --- clé de situation : rôle + perception arrondie ---
 const palierDensite=d=>d<0.5?0:d<1.5?1:d<3?2:d<4.5?3:d<6?4:5; // personnes / m²
 function arrondir(v,cle){
  if(v==null)return null;
  if(typeof v==='boolean')return v?1:0;
  if(typeof v==='number'){
   if(/^(t|x|y|z|id|temps|horodatage)$/i.test(cle))return undefined; // position et horloge : jamais dans la clé
   if(/dens/i.test(cle))return palierDensite(v);
   if(/zone|proche|menace|danger|feu|fumee/i.test(cle))return v>0&&v<=120?1:0; // zone proche oui/non
   if(/dist/i.test(cle))return v<30?0:v<100?1:v<250?2:3;
   if(/nombre|nb|effectif|foule|restants|personnes/i.test(cle))return v<5?0:Math.round(Math.log2(v));
   return Math.round(v*2)/2;
  }
  if(typeof v==='string')return v;
  if(Array.isArray(v)){
   const items=v.map(x=>arrondir(x,cle)).filter(x=>x!==undefined);
   return typeof items[0]==='string'?items.slice().sort():items; // listes de noms : sans ordre
  }
  if(typeof v==='object'){
   const o={};Object.keys(v).sort().forEach(k=>{const r=arrondir(v[k],k);if(r!==undefined)o[k]=r;});return o;
  }
  return undefined;
 }
 const cleDe=a=>a.role+'|'+JSON.stringify(arrondir(a.perception,''));

 function bonneDecision(d){return d&&typeof d.id==='string'&&ACTIONS.includes(d.action)&&typeof d.raison==='string';}
 function mode(m){S.mode=m;}
 async function serveurPret(){
  if(serveurOk!==null)return serveurOk;
  try{const r=await fetch('/api/etat',{cache:'no-store'});const j=await r.json();serveurOk=!!j.claude;}catch(e){serveurOk=false;}
  return serveurOk;
 }
 function compter(j){
  if(!j)return;const e=j.input_tokens||0,s=j.output_tokens||0,l=j.cache_read_input_tokens||0,w=j.cache_creation_input_tokens||0;
  S.jetons+=e+s+l+w;S.cout_usd+=e*PRIX.entree+s*PRIX.sortie+l*PRIX.lecture_cache+w*PRIX.ecriture_cache;
 }

 async function decider(lot,opts){
  const agents=(lot&&lot.agents)||[];
  const projection=!!(opts&&opts.projection);
  const decisions=[],manquants=[];
  agents.forEach(a=>{
   const k=cleDe(a),c=cache.get(k);
   if(c){S.cache_hits++;decisions.push({...c,id:a.id});}else manquants.push({a,k});
  });
  if(projection||!manquants.length){ // rejeu : cache seulement
   if(projection||decisions.length)mode('cache');
   return {decisions};
  }
  if(!(await serveurPret())){mode('regles');return {decisions};}
  // un seul appel pour tous les agents non couverts ; les agents de même situation partagent la décision
  const uniques=new Map();manquants.forEach(({a,k})=>{if(!uniques.has(k))uniques.set(k,a);});
  const ctl=new AbortController(),minuteur=setTimeout(()=>ctl.abort(),DELAI_MS);
  try{
   const r=await fetch('/api/agents',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,
    body:JSON.stringify({T:lot.T,evacuation:lot.evacuation,etat:lot.etat,agents:[...uniques.values()].map(a=>({id:a.id,role:a.role,perception:a.perception}))})});
   if(r.status===503){serveurOk=false;mode('regles');return {decisions};}
   if(!r.ok)throw new Error('http '+r.status);
   const j=await r.json();S.appels++;if(j.tarif_usd_par_million){const t=j.tarif_usd_par_million;PRIX={entree:t.entree/1e6,sortie:t.sortie/1e6,lecture_cache:t.entree*0.1/1e6,ecriture_cache:t.entree*1.25/1e6};}compter(j.jetons);
   const parId=new Map((j.decisions||[]).filter(bonneDecision).map(d=>[d.id,d]));
   manquants.forEach(({a,k})=>{
    const d=parId.get(uniques.get(k).id);if(!d)return;
    const nette={action:d.action,cible:d.cible??null,message:d.message||'',raison:d.raison};
    cache.set(k,nette);decisions.push({...nette,id:a.id});
   });
   garder();mode('claude');
  }catch(e){mode('regles');}
  finally{clearTimeout(minuteur);}
  return {decisions};
 }

 window.cerveau={decider,etat:()=>({...S,cout_usd:Math.round(S.cout_usd*1e6)/1e6}),_cache:cache,_vider:()=>{cache.clear();garder();}};
})();
