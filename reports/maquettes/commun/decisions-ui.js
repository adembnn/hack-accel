// Onglet « Décisions » pour le chef de poste d'une société de sécurité, sur la vue du Forum.
// Trois colonnes mises à jour chaque seconde :
//   Conseillé : les meilleurs plans de l'explorateur (plans-forum.json, jugés sur leur pire variante) ;
//   À trancher : les propositions d'intervention en attente (window.alertes, lot alertes), avec Valider / Refuser ;
//   Pris : le registre des décisions (window.registre), le plus récent en haut.
// La frise des événements en cours reste la chronologie du bas (alertes.js), avec le même code couleur :
// rouge danger, orange attention, vert proposition ou décision, bleu information.
// Ne modifie aucun fichier de la page : ajoute un bouton dans la barre d'onglets et son propre panneau.
(function () {
  const COUL = { rouge: '#d32f2f', orange: '#e65100', proposition: '#0b6b45', decision: '#0b6b45', info: '#1d3f8f', fait: '#6b665c' };
  const css = document.createElement('style');
  css.textContent = `
  .tabp.dcs{display:none}.tabp.dcs.on{display:block}
  #dcs h2{margin:8px 0 4px}#dcs .col{margin-bottom:10px}
  #dcs .vide{color:var(--ink2,#6b665c);font-size:11px;padding:2px 0 6px}
  #dcs .it{border:1px solid var(--line,#d6d1c6);border-left:4px solid var(--c);border-radius:4px;padding:5px 7px;margin:4px 0;font-size:12px;line-height:1.35;background:rgba(255,255,255,.03)}
  #dcs .it .m{font-size:10px;color:var(--ink2,#6b665c);letter-spacing:.03em}#dcs .it .m b{color:var(--c)}
  #dcs .it ul{margin:3px 0 0;padding-left:15px}#dcs .it li{margin:1px 0}
  #dcs .it .bt{display:flex;gap:5px;margin-top:4px}#dcs .it .bt button{font-size:11px;padding:2px 8px}
  #dcs .it .bt .ok{border-color:var(--c);color:var(--c);font-weight:700}
  #dcs .cpt{display:inline-block;min-width:16px;text-align:center;border-radius:8px;font-size:10px;padding:0 5px;margin-left:5px;background:var(--c);color:#fff}`;
  document.head.appendChild(css);

  let R = null, pane = null, btn = null;
  fetch('../commun/plans-forum.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => { R = j; });

  const tt = (T) => `T+${String(Math.floor((T || 0) / 60)).padStart(2, '0')}:${String(Math.floor((T || 0) % 60)).padStart(2, '0')}`;
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const ordres = (p) => {
    const o = [];
    if (p.fermees.length) o.push(`Fermer : ${p.fermees.join(', ')}`);
    p.agents.forEach((s, i) => o.push(`Équipe ${String.fromCharCode(65 + i)} (4 agents) à ${s} : guider vers la sortie`));
    if (p.annonces.length) o.push(`Messages par zone vers ${p.annonces.join(', ')}`);
    if (p.vagues > 1) o.push(`Cinéma : sortie en ${p.vagues} vagues`);
    if (p.escalators === 'montee') o.push('Escalators dans le sens de la sortie');
    if (p.ratp) o.push('Demander à la RATP une bouche ouverte, filtrée');
    return o.length ? o : ['Tout ouvert, aucun guidage'];
  };

  function monter() {
    const bar = document.querySelector('button[data-tab]')?.parentElement;
    const ref = document.querySelector('.tabp');
    if (!bar || !ref) return setTimeout(monter, 300);
    btn = document.createElement('button'); btn.dataset.tab = 'decisions'; btn.innerHTML = 'Décisions<span class="cpt" style="--c:#e65100" hidden></span>';
    bar.prepend(btn);
    pane = document.createElement('div'); pane.className = 'tabp dcs'; pane.id = 'dcs';
    ref.parentElement.insertBefore(pane, ref);
    // l'onglet de la page masque ses panneaux mais ne connaît pas le nôtre : on suit les clics de la barre
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const moi = b === btn;
      pane.classList.toggle('on', moi); btn.classList.toggle('on', moi);
      if (moi) { document.querySelectorAll('.tabp').forEach((p) => { if (p !== pane) p.classList.remove('on'); }); bar.querySelectorAll('button').forEach((x) => { if (x !== btn) x.classList.remove('on'); }); rendre(); }
    });
    setInterval(rendre, 1000);
  }

  function rendre() {
    if (!pane) return;
    const A = window.alertes, ev = A ? A.events : [];
    const attente = ev.filter((e) => e.type === 'proposition' && !e.clos && e.prop);
    const actives = ev.filter((e) => (e.type === 'rouge' || e.type === 'orange') && !(e.el && e.el.classList.contains('off'))).slice(-4).reverse();
    const pris = (window.registre || []).slice(-8).reverse();
    const cpt = btn.querySelector('.cpt'); cpt.hidden = !attente.length; cpt.textContent = attente.length;
    if (!pane.classList.contains('on')) return;
    const conseils = R ? R.meilleurs.slice(0, 3).map((x, i) => {
      const n = x.pire, r = R.reference.pire;
      return `<div class="it" style="--c:${COUL.proposition}"><div class="m"><b>CONSEILLÉ ${i + 1}</b> · explorateur · ${R.runs} simulations · pire cas sur ${R.variantes.length} variantes</div>
       <ul>${ordres(x.plan).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
       <div class="m">Sortis côté perturbations ${n.zone_danger} (consigne actuelle ${r.zone_danger}) · non sortis à 10 min ${n.non_sortis} (${r.non_sortis}) · ${n.agents} agents</div>
       <div class="bt"><button class="ok" data-plan="${i}">Proposer au PC sécurité</button></div></div>`;
    }).join('') : '<div class="vide">Aucun classement chargé : lancer l’explorateur (node src/explorateur/explorer.mjs).</div>';
    const urgent = actives.map((e) => `<div class="it" style="--c:${COUL[e.type]}"><div class="m"><b>${e.type === 'rouge' ? 'DANGER' : 'ATTENTION'}</b> · ${tt(e.T)} · ${esc(e.heure)}</div>${esc(e.txt)}</div>`).join('');
    const trancher = attente.map((e) => `<div class="it" style="--c:${COUL.proposition}"><div class="m"><b>À TRANCHER</b> · ${tt(e.T)} · ${esc(e.alerte || 'alerte')}</div>${esc(e.txt)}
       <div class="bt"><button class="ok" data-ok="${e.id}">Valider</button><button data-non="${e.id}">Refuser</button></div></div>`).join('');
    const faits = pris.map((d) => `<div class="it" style="--c:${/^Refusé/.test(d.decision) ? COUL.fait : COUL.decision}"><div class="m"><b>${/^Refusé/.test(d.decision) ? 'REFUSÉ' : 'PRIS'}</b> · ${tt(d.T)} · ${esc(d.heure)} · ${esc(d.par)}</div>${esc(d.decision)}</div>`).join('');
    pane.innerHTML = `<h2>Conseillé par le modèle</h2><div class="col">${conseils}</div>
      <h2>À trancher maintenant</h2><div class="col">${urgent}${trancher || (urgent ? '' : '<div class="vide">Rien en attente : aucune alerte active.</div>')}</div>
      <h2>Décisions prises</h2><div class="col">${faits || '<div class="vide">Aucune décision pour l’instant.</div>'}</div>
      <div class="vide">Frise des événements : bandeau « Chronologie » en bas (rouge danger, orange attention, vert proposition, bleu information).</div>`;
    pane.querySelectorAll('[data-ok]').forEach((b) => { b.onclick = () => { const e = ev.find((x) => x.id === +b.dataset.ok); if (e) A.valider(e); rendre(); }; });
    pane.querySelectorAll('[data-non]').forEach((b) => { b.onclick = () => { const e = ev.find((x) => x.id === +b.dataset.non); if (e) A.refuser(e); rendre(); }; });
    pane.querySelectorAll('[data-plan]').forEach((b) => { b.onclick = () => {
      const x = R.meilleurs[+b.dataset.plan];
      (window.registre || (window.registre = [])).push({ heure: new Date().toLocaleTimeString('fr-FR'), T: Math.round(window.SIM?.T || 0), decision: `Plan conseillé ${+b.dataset.plan + 1} proposé au PC : ${ordres(x.plan).join(' ; ')}`, par: 'chef de poste', source: 'explorateur' });
      window.dispatchEvent(new CustomEvent('plan-retenu', { detail: { plan: x.plan, ordres: ordres(x.plan), note: x.pire } }));
      rendre();
    }; });
  }
  monter();
})();
