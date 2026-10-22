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
 #indP .sp{padding:1px 0;color:var(--ink)}#indP .sp.dn{color:var(--ink2);text-decoration:line-through}#indP .sp.cu{font-weight:600;color:var(--acc)}
 #indP #indGd{margin-top:5px;border-top:1px solid var(--line);padding-top:4px;font-size:9.5px;line-height:1.3;max-height:150px;overflow:auto}#indGd .cu2{color:var(--ink2)}#indGd .cut{font-size:11px;font-weight:600;margin:1px 0 4px;color:var(--acc)}
 body.indSel #info{display:none}
 @media (max-width:760px){body.indSel #left,body.indSel #alB{display:none}#indP{left:12px;right:12px;top:auto;bottom:12px;width:auto;max-height:55vh}#indP .ib{flex-direction:column}#indP .ip{width:auto}}`;
 document.head.appendChild(st);
 const P=document.createElement('div');P.id='indP';P.className='pn';
 P.innerHTML=`<div class="ih"><b>PERSONNE <span id="indN"></span></b><label><input type="checkbox" id="indF" checked> Suivre</label><button id="indX" title="Fermer">✕</button></div>
 <div class="ib"><div class="ic"><div id="indRows"></div><div class="cs"><div class="m">Consigne recalculée en temps réel</div><div id="indCons" style="margin-top:2px"></div></div>
 <div class="bt"><button id="indSend">Envoyer la consigne</button><button id="indZone">Envoyer à toute la zone</button></div><div id="indRes" class="m"></div>
 <div class="m" style="margin-top:6px">Pourquoi cette sortie</div><div id="indWhy"></div></div>
 <div class="ip"><div class="m" id="indCap" style="text-align:center"></div><div class="iph"><div class="nt"></div><div class="tm" id="indTm">00:00</div><div class="dt" id="indDt"></div>
 <div class="nf"><div class="nh"><span>Forum des Halles · Sécurité</span><span id="indWhen">maintenant</span></div><div id="indMsg"></div><div id="indGd"></div>
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

 // ---------- Guidage : sortie la plus sûre, trajet (descente de SIM.F), manœuvres, repères ----------
 const LV=l=>SIM.g.levels[l],LVN=v=>v<0?'−'+Math.abs(v):''+v;
 const lvTxt=l=>'niveau '+LVN(LV(l));
 const NOIR=/^(ticket|ticket_validator|toilets|vacant|RATP|)$/i;
 let LM=null; // repères : boutiques, couloirs, salles nommées (scene.json interieur)
 function lmBuild(){LM=[];if(typeof SCN==='undefined'||!SCN.interieur)return;SCN.interieur.forEach(o=>{const n=(o.n||'').trim();if(NOIR.test(n))return;const P=pairs(o.p);if(P.length<3)return;
  let cx=0,cz=0;P.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=P.length;cz/=P.length;LM.push({n,k:o.k,l:o.l,P,cx,cz,rue:/^(rue|passage|galerie|patio|place|grand balcon|balcon)/i.test(n)});});}
 const lvIn=(o,lv)=>o.l.some(v=>Math.round(v)===Math.round(lv));
 // repère le plus utile près de (x,z) au niveau d'indice l : porte ou issue proche, boutique proche, ou couloir où l'on se trouve
 function repere(x,z,l){if(!LM)lmBuild();const lv=LV(l);let best=null,bd=1e9;
  if(typeof LEV!=='undefined')for(const L of LEV){if(L.type!=='porte'&&L.type!=='issue')continue;if(Math.round(L.niveau)!==Math.round(lv))continue;const d=Math.hypot(L.x-x,L.z-z);if(d<12&&d<bd){bd=d;best=(L.type==='porte'?'la ':"l'")+L.nom.replace(/^Porte /,'porte ').replace(/^Issue /,'issue ');}}
  if(best)return best;bd=1e9;
  for(const o of LM){if(!o.n||o.rue||o.k==='corridor'||!lvIn(o,lv))continue;const d=Math.hypot(o.cx-x,o.cz-z);if(d<18&&d<bd){bd=d;best=o.n;}}
  if(best)return 'devant '+best;
  for(const o of LM){if(!o.n||!lvIn(o,lv))continue;if(pip(x,z,o.P))return (/^(Rue|Place|Galerie|Passage|Salle)/i.test(o.n)?'dans la ':'dans le ')+o.n.replace(/^(Rue|Place|Galerie|Passage|Salle)/,m=>m.toLowerCase());}
  return null;}
 const cellXZ=i=>{const g=SIM.g,N=SIM.N,l=(i/N)|0,rem=i-l*N,r=(rem/g.w)|0,c=rem-r*g.w;return [g.bbox[0]+(c+.5)*g.res,g.bbox[1]+(r+.5)*g.res,l];};
 // trajet : descente du gradient de SIM.F[k] depuis la cellule de la personne, à travers les liens verticaux, jusqu'à la sortie
 function trajet(a,k){const g=SIM.g,f=SIM.F[k],w=g.w;let i=cellOf(a);if(i<0||f[i]>=1e9)return null;const P=[],V=[];let len=0;
  const push=j=>{const q=cellXZ(j);P.push({x:q[0],z:q[1],l:q[2],s:len});};push(i);
  for(let n=0;n<2500;n++){if(f[i]<1.6)break;
   const ls=SIM.linkAt.get(i);let jumped=false;
   if(ls)for(const li of ls){const L=g.links[li];if(!L.open)continue;const up=L.ia===i,o=up?L.ib:L.ia;if(f[o]+L.len*1.4<=f[i]+.5){const q=cellXZ(o);V.push({li,L,at:P.length-1,from:cellXZ(i)[2],to:q[2],s:len});len+=L.len;i=o;push(i);jumped=true;break;}}
   if(jumped)continue;
   let bj=-1,bv=f[i],st=1;for(const[dr,dc,s]of[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4],[1,-1,1.4],[-1,1,1.4],[-1,-1,1.4]]){const j=i+dr*w+dc;if(!SIM.walk[j])continue;if(f[j]<bv){bv=f[j];bj=j;st=s;}}
   if(bj<0)break;len+=st*g.res;i=bj;push(i);}
  return {P,V,len,end:i};}
 // densité des personnes par case de 3 m, pour la pénalité de foule le long du trajet
 let HC0=null,HT0=0;function foule(){const nw=performance.now();if(HC0&&nw-HT0<300&&HC0.A===SIM.A)return HC0.H;const H=new Map();for(const b of SIM.A){if(b.out||b.ride)continue;const key=b.l*1e6+((b.x/3)|0)*1000+((b.z/3)|0);H.set(key,(H.get(key)||0)+1);}HC0={H,A:SIM.A};HT0=nw;return H;}
 function densTrajet(tr,H){let sum=0,n=0;for(let j=0;j<tr.P.length;j+=3){const p=tr.P[j];let c=0;const ix=(p.x/3)|0,iz=(p.z/3)|0;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)c+=H.get(p.l*1e6+(ix+dx)*1000+(iz+dz))||0;sum+=c/81;n++;}return n?sum/n:0;} // pers./m²
 const zonesTraj=tr=>{let n=0;if(typeof ZONES==='undefined'||!ZONES.length)return 0;for(let j=0;j<tr.P.length;j+=3){const p=tr.P[j];if(LV(p.l)<0)continue;if(ZONES.some(Z=>Math.hypot(p.x-Z.x,p.z-Z.z)<Z.r+4))n++;}return n*3;}; // mètres de trajet dans une zone posée
 function nomSortie(G,tr){if(G.type==='rue')return G.n;
  if(G.type==='secours'){const q=cellXZ(tr.end);let e=null,bd=1e9;G.cells.forEach(c=>{const p=cellXZ(idx3(c.cell[0],c.cell[1],c.cell[2])),d=Math.hypot(p[0]-q[0],p[1]-q[1])+(p[2]!==q[2]?99:0);if(d<bd){bd=d;e=c;}});
   return e?(typeof nomIssue==='function'?nomIssue(e.label):e.label):'Issue de secours';}
  return 'Quais RER et métro';}
 const PEN_ZONE=80,PEN_ASC=50,PEN_DENS=14; // pénalités en mètres équivalents
 // toutes les sorties ouvertes, notées : distance + zone évitée + zone posée + foule + ascenseur ; porte fermée exclue
 function evalSorties(a){if(!SIM.A||!SIM.F)return [];const i=cellOf(a);if(i<0)return [];const H=foule(),R=[];
  SIM.groups.forEach((G,k)=>{if(!G.open)return;const d=SIM.F[k][i];if(d>=1e9)return;const tr=trajet(a,k);if(!tr)return;
   const dist=d*SIM.g.res,zg=SIM.zoneOn&&G.zone?PEN_ZONE:0,zp=zonesTraj(tr)*(PEN_ZONE/30),dn=densTrajet(tr,H),pd=Math.max(0,dn-.5)*PEN_DENS*(tr.len/10),asc=tr.V.some(v=>v.L.k==='ascenseur')?PEN_ASC:0;
   R.push({k,G,tr,nom:nomSortie(G,tr),dist,zg,zp,pd,asc,dn,score:dist+zg+zp+pd+asc});});
  R.sort((x,y)=>x.score-y.score);return R;}
 function advise(a){const R=evalSorties(a);if(!R.length)return null;let b=R[0];const c=a.t,cur=c>=0?R.find(r=>r.k===c):null;let better=false,why='';
  if(cur&&cur.score-b.score<Math.max(15,.25*cur.score))b=cur;else if(c>=0){better=true;const G=SIM.groups[c];why=!G.open?'fermée':SIM.zoneOn&&G.zone?'en zone évitée':cur?'nettement moins sûre ('+Math.round(cur.score-b.score)+' m équivalents de plus)':"inaccessible d'ici";}
  return {k:b.k,d:b.dist,R,best:b,better,why,cur:c};}
 // ---- manœuvres déduites du trajet : virages > 35°, liens verticaux ----
 const hd=(p,q)=>Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI,ad=(x,y)=>{let d=y-x;while(d>180)d-=360;while(d<-180)d+=360;return d;};
 const rd=d=>Math.max(5,Math.round(d/5)*5);
 function manoeuvres(tr){const E=[],P=tr.P,segs=[];let cur=[];
  for(let j=0;j<P.length;j++){cur.push(P[j]);const lk=tr.V.find(v=>v.at===j);if(lk){segs.push({pts:cur,lk});cur=[];}}segs.push({pts:cur,lk:null});
  segs.forEach(sg=>{const S=[];let last=-9;sg.pts.forEach((p,j)=>{if(p.s-last>=2||j===sg.pts.length-1){S.push(p);last=p.s;}});const n=S.length;
   if(n>=7){let ref=hd(S[0],S[4]);
    for(let j=3;j<n-3;j++){const h=hd(S[j-2],S[j+2]);if(Math.abs(ad(ref,h))>35){let k=j;while(k<n-4&&Math.abs(ad(hd(S[k-2],S[k+2]),hd(S[k-1],S[k+3])))>6)k++;
      const h2=hd(S[Math.min(k,n-4)],S[Math.min(k+3,n-1)]),tot=ad(ref,h2);if(Math.abs(tot)>35){E.push({kind:'turn',s:S[j].s,p:S[j],ang:tot,l:S[j].l});ref=h2;}j=k;}}}
   if(sg.lk)E.push({kind:'link',s:sg.lk.s,p:P[sg.lk.at],lk:sg.lk,l:sg.lk.from});});
  E.sort((x,y)=>x.s-y.s);
  const M=[];E.forEach(e=>{const q=M[M.length-1];if(q&&q.kind==='turn'&&e.kind==='turn'&&e.s-q.s<8){q.ang+=e.ang;q.s=e.s;if(Math.abs(q.ang)<35)M.pop();}else M.push(e);});
  return M;}
 const LIENS={escalator:"l'escalator",escalier:"l'escalier",ascenseur:"l'ascenseur"};
 function etapes(a,A){const b=A.best,tr=b.tr,v0=a.v0||1.3,P=tr.P,total=tr.len,endP=P[P.length-1];
  const M=manoeuvres(tr);
  while(M.length>5){let bi=-1,bd=1e9;M.forEach((e,j)=>{if(e.kind!=='turn')return;const prev=j?M[j-1].s:0,nxt=j<M.length-1?M[j+1].s:total,d=Math.min(e.s-prev,nxt-e.s);if(d<bd){bd=d;bi=j;}});if(bi<0)break;M.splice(bi,1);}
  const steps=[],ev=[{kind:'start',s:0,p:P[0],l:P[0].l},...M];
  for(let j=0;j<ev.length;j++){const e=ev[j],nx=ev[j+1];
   if(e.kind==='link'){const L=e.lk.L,up=LV(e.lk.to)>LV(e.lk.from),rp=repere(e.p.x,e.p.z,e.lk.from);
    const t=(L.k==='ascenseur'?"Prenez l'ascenseur (à éviter en évacuation, sauf mobilité réduite)":`Prenez ${LIENS[L.k]} ${up?'montant':'descendant'}`)+` jusqu'au ${lvTxt(e.lk.to)}${rp?' ('+rp+')':''}.`;
    steps.push({kind:'link',end:{k:'L',li:e.lk.li,x:e.p.x,z:e.p.z,l:e.lk.from},txt:t,d:L.len,t:rideT(L),l:e.lk.from,x:e.p.x,z:e.p.z,s0:e.s,s1:e.s+L.len});continue;}
   const endS=nx?nx.s:total,dist=Math.max(0,endS-e.s),dtxt=rd(dist)+' m';
   const tg=nx?(nx.kind==='link'?{x:nx.p.x,z:nx.p.z,l:nx.lk.from}:{x:nx.p.x,z:nx.p.z,l:nx.l}):endP;
   const rpn=nx?repere(tg.x,tg.z,tg.l):null;
   const jus=r=>r.replace(/^devant /,"jusqu'à ").replace(/^dans /,'jusque dans ').replace(/^(la |l')/,"jusqu'à $1");
   const jusqua=nx?(nx.kind==='link'?' '+(rpn?jus(rpn):"jusqu'à "+LIENS[nx.lk.L.k]):rpn?' '+jus(rpn):''):'';
   let txt;
   if(e.kind==='start'){const pre=a.ride?`Restez sur ${LIENS[SIM.g.links[a.ride.li].k]} jusqu'au ${lvTxt(a.ride.to[0])}, puis `:'';
    txt=dist<4?(pre?pre+'prenez la suite devant vous.':(nx&&nx.kind==='link'?`${cap(LIENS[nx.lk.L.k])} est juste devant vous.`:'Vous êtes devant la sortie.')):pre+(pre?'marchez':'Marchez')+` tout droit sur ${dtxt}${jusqua}.`;}
   else{const here=repere(e.p.x,e.p.z,e.l),A2=Math.abs(e.ang),side=e.ang>0?'droite':'gauche';
    txt=(here?cap(here)+', t':'T')+(A2>120?`ournez en demi-tour par la ${side}`:`ournez ${A2<60?'légèrement ':''}à ${side}`)+(dist>=4?`, puis marchez ${dtxt}${jusqua}`:'')+'.';}
   steps.push({kind:e.kind,end:{k:nx?nx.kind:'F',li:nx&&nx.kind==='link'?nx.lk.li:-1,x:tg.x,z:tg.z,l:tg.l},txt,d:dist,t:dist/v0,l:e.l,x:e.p.x,z:e.p.z,s0:e.s,s1:endS});}
  const nm=b.nom,isP=/^Porte/.test(nm),isI=/^Issue/.test(nm);
  steps.push({kind:'fin',end:{k:'FIN',li:-1,x:endP.x,z:endP.z,l:endP.l},txt:b.G.type==='train'?'Les quais sont en face de vous.':isP?`La ${nm.replace(/^Porte /,'porte ')} est en face de vous.`:isI?`L'${nm.replace(/^Issue /,'issue ')} est en face de vous.`:`La sortie « ${nm} » est en face de vous.`,d:0,t:0,l:endP.l,x:endP.x,z:endP.z,s0:total,s1:total});
  while(steps.length>7){let bj=-1,bd=1e9;for(let j=1;j<steps.length-2;j++){if(steps[j].kind==='link'||steps[j+1].kind==='link')continue;if(steps[j].d<bd){bd=steps[j].d;bj=j;}}if(bj<0)break;steps[bj+1].d+=steps[bj].d;steps[bj+1].t+=steps[bj].t;steps[bj+1].s0=steps[bj].s0;steps.splice(bj,1);}
  steps.forEach((s,j)=>{s.n=j+1;});
  return {steps,dest:nm,total,t:total/v0};}
 function consigne(a){
  if(a.out)return {txt:"Vous êtes sorti du centre. Éloignez-vous des issues et suivez les consignes des forces de l'ordre.",arrow:null,steps:[]};
  const A=advise(a);if(!A)return {txt:"Aucune sortie accessible depuis cet endroit : restez sur place et attendez les secours.",arrow:null,steps:[]};
  const Z=etapes(a,A),b=A.best,d=Math.round(A.d/5)*5||5,P=b.tr.P,q=P[Math.min(P.length-1,6)];
  let head=`Sortie conseillée : ${b.nom}, à ${d} m (~${dur(Z.t)}).`;
  if(A.better)head=`Votre sortie actuelle (${SIM.groups[A.cur].n}) est ${A.why}. `+head;
  return {txt:head+' '+Z.steps.map(s=>`${s.n}. ${s.txt}`).join(' '),head,steps:Z.steps,arrow:[q.x-a.x,q.z-a.z],A,G:b.G,Z};}
 function etat(a){if(a.out)return 'Sortie du centre';
  if(a.ride){const k=SIM.g.links[a.ride.li];return `Sur ${(LNK[k.k]||[k.k])[0]} (${lvName(a.ride.from[0])} vers ${lvName(a.ride.to[0])})`;}
  if(OBEI.has(a)&&SIM.mode!=='evac')return 'Part vers la sortie conseillée (consigne reçue avant l\'alerte)';
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
 // Avant l'alerte : la personne reçoit la consigne et part (évacuation individuelle : a.t = sortie conseillée, a.pre = maintenant). Pendant l'évacuation : elle change de cible.
 const PROG=new WeakMap(); // personne -> étapes déjà passées
 function envoyer(a,c){c=c||consigne(a);if(!c.A)return false;const evac=SIM.mode==='evac',i=cellOf(a);a.t=c.A.k;a.hes=0;a.guide=true;
  a.consigne={T:SIM.T,k:c.A.k,d0:i>=0?SIM.F[c.A.k][i]:0,avant:!evac,prev:a.consigne?a.consigne.k:-1};if(!evac)a.pre=SIM.T-SIM.delay;
  OBEI.set(a,c.A.k);a.consigneCaduque=false;PROG.delete(a);return true;}
 function zoneEnvoi(){const a=selA;if(!a)return 0;const [x0,,z0]=pos(a);let n=0,tot=0;for(const b of SIM.A){if(b.out||b.l!==a.l||b.ride)continue;if(Math.hypot(b.x-x0,b.z-z0)>ZONE_R)continue;tot++;if(envoyer(b))n++;}
  zoneMsg=`Envoyée à la zone (${ZONE_R} m, même niveau) à ${tt(SIM.T)} : ${n} personne${n>1?'s':''} sur ${tot} l'ont reçue.`;sentT=SIM.T;majTexte();return n;}
 // la simulation retombe parfois sur un autre choix : on rétablit la sortie conseillée à chaque pas pour ceux qui ont reçu la consigne.
 // Avant l'alerte, sim.js ne fait marcher personne vers une sortie : on joue le pas une 2e fois en mode évacuation pour les seules personnes guidées.
 const orig=window.simStep;
 if(typeof orig==='function')window.simStep=function(dt){let r;const G=[];
  if(SIM.mode==='calme')for(const [a] of OBEI)if(!a.out)G.push(a);
  if(G.length){G.forEach(a=>{a.out=true;});r=orig.apply(this,arguments);G.forEach(a=>{a.out=false;a.t=OBEI.get(a);});
   const sav=[];SIM.A.forEach(b=>{if(!b.out&&!OBEI.has(b)){sav.push([b,b.pre]);b.pre=1e9;}});SIM.mode='evac';SIM.T-=dt;
   try{orig.apply(this,arguments);}finally{SIM.mode='calme';sav.forEach(q=>{q[0].pre=q[1];});}}
  else r=orig.apply(this,arguments);
  if(OBEI.size)for(const [a,k] of OBEI){if(a.out){OBEI.delete(a);continue;}
   if(!SIM.groups[k].open){const A=advise(a);if(A){a.t=A.k;a.hes=0;OBEI.set(a,A.k);if(a.consigne){a.consigne.k=A.k;a.consigne.maj=SIM.T;a.consigne.d0=SIM.F[A.k][cellOf(a)];}PROG.delete(a);}else{OBEI.delete(a);a.consigneCaduque=true;}continue;}
   a.t=k;a.hes=0;}
  return r;};
 const origA=window.simAlert;
 if(typeof origA==='function')window.simAlert=function(){const r=origA.apply(this,arguments);for(const [a,k] of OBEI){if(a.out)continue;a.t=k;a.pre=-1e3;}return r;};

 // ---------- Fiche ----------
 function suivi(a){if(!a.consigne)return 'non envoyée';const c=a.consigne,i=cellOf(a),dn=i>=0?SIM.F[c.k][i]:0;
  if(a.out)return `envoyée à ${tt(c.T)} : suivie, sortie atteinte`;
  if(!OBEI.has(a))return a.consigneCaduque?`envoyée à ${tt(c.T)} : plus aucune sortie accessible`:`envoyée à ${tt(c.T)}`;
  const gagne=(c.d0-dn)*SIM.g.res,mj=c.maj?` · itinéraire mis à jour à ${tt(c.maj)} (porte fermée)`:'',av=c.avant?' avant l\'alerte':'';
  return gagne>=3||a.ride?`reçue à ${tt(c.T)}${av} · suivie (${Math.round(Math.max(0,gagne))} m parcourus vers la sortie)${mj}`:`reçue à ${tt(c.T)}${av} · pas encore suivie${mj}`;}
 // étapes : on garde celles déjà franchies, l'étape en cours est la première du plan recalculé
 const memeFin=(x,y)=>x.k===y.k&&x.l===y.l&&x.li===y.li&&Math.hypot(x.x-y.x,x.z-y.z)<7;
 function progres(a,steps,k){let p=PROG.get(a);if(!p||p.k!==k){p={k,all:steps.map(s=>s),cur:0};PROG.set(a,p);}
  else if(steps.length){let j=-1;for(let q=p.cur;q<p.all.length;q++){if(memeFin(p.all[q].end,steps[0].end)){j=q;break;}}
   if(j<0){p.all=steps.slice();p.cur=0;}else{p.all=p.all.slice(0,j).concat(steps);p.cur=j;}}
  p.all.forEach((s,j)=>{s.n=j+1;});return p;}
 const stepsHTML=(p)=>p.all.map((s,j)=>`<div class="sp ${j<p.cur?'dn':j===p.cur?'cu':''}"><b>${s.n}.</b> ${s.txt}${s.kind==='fin'?'':` <span class="m">${rd(s.d)} m · ${dur(s.t)}</span>`}</div>`).join('');
 function alternatives(A){const R=A.R.slice(0,3),b=A.best;if(!R.length)return '';
  const l=r=>`${r===b?'✔ ':''}<b>${r.nom}</b> : ${Math.round(r.dist)} m${r.zg?` + ${r.zg} (zone évitée)`:''}${r.zp?` + ${Math.round(r.zp)} (zone posée)`:''}${r.pd>=1?` + ${Math.round(r.pd)} (foule ${r.dn.toFixed(1).replace('.',',')} pers./m²)`:''}${r.asc?` + ${r.asc} (ascenseur)`:''} = <b>${Math.round(r.score)}</b>`;
  const alt2=R.filter(r=>r!==b).slice(0,2);let why;
  if(!alt2.length)why="C'est la seule sortie ouverte et accessible depuis ici.";
  else{const r=alt2[0],ec=Math.round(r.score-b.score);const fact=[];if(r.dist<b.dist-1)fact.push(`${r.nom} est plus proche de ${Math.round(b.dist-r.dist)} m mais`);
   const pen=[r.zg+r.zp>0?'passe par une zone à éviter':'',r.pd>=5?'longe une foule dense':'',r.asc?"impose l'ascenseur":''].filter(Boolean);
   why=r.dist<b.dist-1?`${fact[0]} ${pen.join(' et ')||'cumule des pénalités'} (${ec} m équivalents de plus).`:`Plus courte que ${r.nom} de ${Math.round(r.dist-b.dist)} m${pen.length?' et sans pénalité de zone ni de foule':''} (score ${ec} m équivalents plus bas).`;}
  return `<div class="m">Score = distance + zone à éviter (${PEN_ZONE}) + zone posée + foule + ascenseur (${PEN_ASC}) ; porte fermée exclue</div>`+[b,...alt2].map(r=>`<div>${l(r)}</div>`).join('')+`<div style="margin-top:3px">${why}</div>`;}
 let C=null,routeT=0,openSig='';
 function sigOuv(){return SIM.groups.map(G=>G.open?1:0).join('')+SIM.g.links.reduce((s,k)=>s+(k.open?'':'x'),'')+(typeof ZONES!=='undefined'?ZONES.length:0);}
 function majFiche(force){if(sel<0)return;if(SIM.A[sel]!==selA){deselect();return;}const a=selA,i=cellOf(a),g=SIM.g;
  const c=C=consigne(a),G=a.t>=0?SIM.groups[a.t]:null,d=G&&i>=0?SIM.F[a.t][i]*g.res:null;
  const lv=a.ride?`niveau ${g.levels[a.ride.from[0]]} vers ${g.levels[a.ride.to[0]]}`:'niveau '+g.levels[a.l];
  const dd=d!=null&&d<1e9?`${Math.round(d)} m · ~${dur(d/a.v0)} à ${a.v0.toFixed(1).replace('.',',')} m/s`:(G&&!G.open?'sortie fermée : à recalculer':'—');
  const rows=[['Profil',KIND[a.kind]||a.kind],['Niveau',lv],['État',etat(a)],['Sortie visée',G?G.n+(G.open?'':' (fermée)'):'pas encore choisie'],['Distance restante',a.out?'0 m':dd],
   ['Densité autour',densite(a).toFixed(1).replace('.',',')+' pers./m² (rayon 3 m)'],['Consigne',suivi(a)]];
  $('indRows').innerHTML=rows.map(r=>`<div class="r"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');
  const P0=c.A?progres(a,c.steps,c.A.k):null;
  $('indCons').innerHTML=c.A?`<div><b>${c.head}</b></div>${stepsHTML(P0)}`:c.txt;
  $('indWhy').innerHTML=(c.A?alternatives(c.A):'')+`<div class="m" style="margin-top:4px">Choix du modèle de foule pour cette personne</div>`+pourquoi(a).map(s=>`<div>· ${s}</div>`).join('');
  const recu=!!a.consigne&&OBEI.has(a);
  // téléphone : notification (résumé) + écran de guidage (étapes, l'étape en cours avance pendant la marche)
  $('indMsg').textContent=c.A?`Évacuez par ${c.A.best.nom} : ${Math.round(c.A.d/5)*5||5} m, ~${dur(c.Z.t)}. ${P0.all.length} étapes.`:c.txt;
  $('indGd').innerHTML=c.A&&P0?`<div class="cu2">Étape ${Math.min(P0.cur+1,P0.all.length)}/${P0.all.length}</div><div class="cut">${P0.all[Math.min(P0.cur,P0.all.length-1)].txt}</div>${P0.all.map((s,j)=>`<div class="sp ${j<P0.cur?'dn':j===P0.cur?'cu':''}">${s.n}. ${s.txt}</div>`).join('')}`:'';
  $('indCap').textContent=recu?`Reçue à ${tt(a.consigne.T)} · guidage en cours`:'Aperçu (non envoyé)';
  $('indWhen').textContent=recu?'envoyée':'aperçu';
  const now=new Date();$('indTm').textContent=p2(now.getHours())+':'+p2(now.getMinutes());$('indDt').textContent=tt(SIM.T)+' · alerte '+(SIM.mode==='evac'?'en cours':'pas lancée');
  const dir=c.arrow;if(dir&&Math.hypot(dir[0],dir[1])>.2){const br=Math.atan2(dir[0],-dir[1])*180/Math.PI;$('indAr').style.transform=`rotate(${br.toFixed(0)}deg)`;
   $('indAt').textContent='Cap '+WIND[Math.round(((br%360)+360)%360/45)%8]+' (nord en haut de la carte)';}else{$('indAt').textContent='Vous êtes arrivé';}
  $('indSend').disabled=a.out;$('indZone').disabled=false;
  $('indRes').textContent=zoneMsg;
  const sg=sigOuv(),nw=performance.now();if(force||sg!==openSig||nw-routeT>1200){openSig=sg;routeT=nw;routeDraw(c);}}
 function majTexte(){sentTxt=selA&&OBEI.has(selA)?'envoyé':sentTxt;majFiche(true);}

 // ---------- Trajet tracé en 3D : ruban lumineux au sol (alt(niveau)+0,1 m), flèches régulières, marqueurs aux changements de niveau et à la sortie ----------
 const rtG=new THREE.Group();rtG.frustumCulled=false;scene.add(rtG);
 const rtMat=new THREE.MeshBasicMaterial({color:0x14e0a0,transparent:true,opacity:.85,depthTest:false,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const arMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthTest:false,depthWrite:false}),arGeo=new THREE.ConeGeometry(.7,1.8,3).rotateZ(-Math.PI/2).rotateX(Math.PI/2*0);
 const mvMat=new THREE.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:.8,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}),exMat=new THREE.MeshBasicMaterial({color:0x35ff7a,transparent:true,opacity:.75,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending});
 const pilGeo=new THREE.CylinderGeometry(.9,.9,7,12,1,true),ringGeo=new THREE.RingGeometry(1.4,2,24).rotateX(-Math.PI/2);
 function routeClear(){while(rtG.children.length){const o=rtG.children.pop();if(o.userData.own&&o.geometry)o.geometry.dispose();}}
 function routeDraw(c){routeClear();if(!c||!c.A||sel<0)return;const tr=c.A.best.tr,P=tr.P;if(P.length<2)return;
  const Y=p=>alt(LV(p.l))+.1,pts=P.map(p=>new THREE.Vector3(p.x,Y(p),p.z));
  const pos3=[],idx=[];let vi=0,dirs=[];
  for(let j=0;j<pts.length-1;j++){const A0=pts[j],B0=pts[j+1],d=B0.clone().sub(A0);if(d.length()<.01)continue;d.normalize();let r=new THREE.Vector3().crossVectors(d,new THREE.Vector3(0,1,0));if(r.length()<.3)r.set(1,0,0);r.normalize().multiplyScalar(.35);
   pos3.push(A0.x-r.x,A0.y-r.y,A0.z-r.z,A0.x+r.x,A0.y+r.y,A0.z+r.z,B0.x-r.x,B0.y-r.y,B0.z-r.z,B0.x+r.x,B0.y+r.y,B0.z+r.z);idx.push(vi,vi+1,vi+2,vi+1,vi+3,vi+2);vi+=4;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos3,3));geo.setIndex(idx);const m=new THREE.Mesh(geo,rtMat);m.userData.own=true;m.renderOrder=44;m.frustumCulled=false;rtG.add(m);
  let nextS=4;for(let j=0;j<P.length-2;j++){if(P[j].s>=nextS&&P[j].l===P[j+2].l){const A0=pts[j],B0=pts[j+2];const ar=new THREE.Mesh(arGeo,arMat);ar.position.set(A0.x,A0.y+.05,A0.z);ar.rotation.y=Math.atan2(-(B0.z-A0.z),B0.x-A0.x);ar.renderOrder=46;rtG.add(ar);nextS=P[j].s+8;}}
  tr.V.forEach(v=>{[P[v.at],P[v.at+1]].forEach(p=>{if(!p)return;const y=Y(p);const r=new THREE.Mesh(ringGeo,mvMat);r.position.set(p.x,y,p.z);r.renderOrder=47;rtG.add(r);const pl=new THREE.Mesh(pilGeo,mvMat);pl.position.set(p.x,y+3.5,p.z);pl.renderOrder=47;rtG.add(pl);});});
  const e=P[P.length-1],ye=Y(e);const r=new THREE.Mesh(ringGeo,exMat);r.position.set(e.x,ye,e.z);r.scale.set(1.4,1,1.4);r.renderOrder=47;rtG.add(r);const pl=new THREE.Mesh(pilGeo,exMat);pl.scale.set(1.3,1.6,1.3);pl.position.set(e.x,ye+5.6,e.z);pl.renderOrder=47;rtG.add(pl);}

 // petit écran : la fiche occupe le bas, on remonte la personne vers le haut de l'image
 function vue(){if(innerWidth<=760)cam.setViewOffset(innerWidth,innerHeight,0,innerHeight*.28,innerWidth,innerHeight);else cam.clearViewOffset();}
 function select(i){if(!SIM.A||!SIM.A[i])return;sel=i;selA=SIM.A[i];zoneMsg='';sentTxt='';lastTxt='';document.body.classList.add('indSel');vue();$('indN').textContent='n° '+(i+1);
  if(selA.consigne&&OBEI.has(selA))sentTxt='';
  const [x,y,z]=pos(selA);if(typeof camFly==='function')camFly([x+22,y+20,z+28],[x,y,z]);lastPos=null;mk.visible=true;majFiche(true);}
 function deselect(){routeClear();cam.clearViewOffset();sel=-1;selA=null;lastPos=null;mk.visible=false;document.body.classList.remove('indSel');}
 $('indX').onclick=deselect;
 $('indSend').onclick=()=>{if(!selA)return;const c=consigne(selA);if(envoyer(selA,c)){sentTxt='envoyé';sentT=SIM.T;zoneMsg='';majFiche(true);}};
 $('indZone').onclick=()=>{zoneEnvoi();majFiche(true);};

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
