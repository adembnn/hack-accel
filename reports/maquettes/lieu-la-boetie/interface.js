// Range le panneau de gauche en quatre onglets : Directeur (parler à l'outil), Agir (leviers, perturbations),
// Simuler (évacuation et chiffres), Voir (style, caméra, niveaux, calques). Déplace les blocs existants sans les recréer.
(function(){
 const left=document.getElementById('left');if(!left)return;
 const TABS=[['directeur','Directeur'],['agir','Agir'],['simuler','Simuler'],['voir','Voir']];
 const WHERE={'Style':'voir','Moment':'voir','Caméra':'voir','Sous-sol':'voir','Calques':'voir','Leviers du juré':'agir','Perturbations (juré)':'agir','Évacuation · 19 oct.':'simuler'};
 const css=document.createElement('style');css.textContent=`
 #tabs{display:flex;gap:0;margin:8px -12px 4px;border-bottom:1px solid var(--line)}
 #tabs button{flex:1;border:0;border-bottom:2px solid transparent;border-radius:0;padding:7px 2px;color:var(--ink2);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
 #tabs button.on{color:var(--ink);border-bottom-color:var(--acc);background:transparent}
 .tabp{display:none}.tabp.on{display:block}
 #left h2:first-child{margin-top:8px}
 @media (max-width:1100px){body:has(#rg-vue) #left{top:96px;max-height:calc(100vh - 108px)}}`;document.head.appendChild(css);
 const bar=document.createElement('div');bar.id='tabs';const panes={};
 TABS.forEach(([k,n])=>{const b=document.createElement('button');b.textContent=n;b.dataset.tab=k;bar.appendChild(b);const p=document.createElement('div');p.className='tabp';p.dataset.tab=k;panes[k]=p;});
 // découpe : chaque titre h2 et ses voisins jusqu'au titre suivant
 const kids=[...left.children];const h1=left.querySelector('h1');let cur=null;
 kids.forEach(el=>{if(el===h1)return;if(el.tagName==='H2')cur=WHERE[el.textContent.trim()]||'voir';if(cur)panes[cur].appendChild(el);});
 h1.after(bar);let prev=bar;TABS.forEach(([k])=>{prev.after(panes[k]);prev=panes[k];});
 const show=k=>{bar.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===k));Object.values(panes).forEach(p=>p.classList.toggle('on',p.dataset.tab===k));try{localStorage.setItem('onglet',k);}catch(e){}};
 bar.onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.tab);};
 let first='directeur';try{first=localStorage.getItem('onglet')||first;}catch(e){}show(first);
 window.showTab=show;
})();
