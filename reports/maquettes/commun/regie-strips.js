// Régie « C · Strips de contrôle » sur la vue 3D du Forum des Halles (planche reports/maquettes/design-regie/C-strips.html).
// Remplace visuellement le panneau de gauche, la barre de vues, la boîte d'info, le bouton des plans et la frise du bas
// par : barre haute (T+, bandeau de problèmes, chiffres clés), baie de strips à gauche (À trancher, En cours, Fait),
// vue 3D au centre (la même scène three.js), frise colorée et sous-titre du dernier ordre en bas.
// Les anciens panneaux restent dans la page et continuent de fonctionner (CSS seulement) ; bouton « Ancienne vue ».
// Lit : SIM, LEV, window.alertes, window.registre, plans-forum.json, #dirLog (directeur.js). N'écrit que dans window.registre
// et par les événements 'plan-retenu' et 'chrono'. Expose window.regie {afficher, ancienneVue, selectionner}.
(function () {
  'use strict';
  if (window.regie) return;
  const CLE = 'regieC', TOP = 56, BAY = 420, TL = 42, SUB = 80, BOT = TL + SUB;
  let on = true; try { if (localStorage.getItem(CLE) === '0') on = false; } catch (e) {}

  // ---------- Style ----------
  const link = document.createElement('link'); link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap';
  document.head.appendChild(link);
  const css = document.createElement('style');
  css.textContent = `
  :root{--rc-top:${TOP}px;--rc-bay:${BAY}px;--rc-bot:${BOT}px}
  body.regie-c #left,body.regie-c #rg-vue,body.regie-c #info,body.regie-c #pl,body.regie-c #alB,body.regie-c #foot{display:none!important}
  body.regie-c #camBtn{bottom:calc(var(--rc-bot) + 12px)!important}
  body.regie-c #camWall{top:calc(var(--rc-top) + 12px)!important;bottom:calc(var(--rc-bot) + 56px)!important}
  .rc{display:none;--bg:#0c1114;--bay:#12191e;--line:#25323a;--ink:#e8eef0;--muted:#8c9ca5;--paper:#efe8d4;--paper-ink:#171a1c;--paper-mute:#5c5a50;--paper-line:#cfc6ab;
    --red:#ff5a47;--amber:#ffb21e;--green:#4fd18b;--blue:#4aa3ff;--good:#12784a;--bad:#b3261e;
    --sans:'Barlow',system-ui,sans-serif;--cond:'Barlow Condensed','Arial Narrow',sans-serif;font:500 14px/1.25 var(--sans);font-variant-numeric:tabular-nums;color:var(--ink)}
  body.regie-c .rc{display:block}
  .rc *{box-sizing:border-box;margin:0}
  .rc button{font:inherit;color:inherit;cursor:pointer}
  .rc button:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
  #rc-top{position:fixed;left:0;right:0;top:0;height:var(--rc-top);z-index:40;display:flex;align-items:stretch;background:#0a0f12;border-bottom:1px solid var(--line)}
  #rc-top .id{display:flex;align-items:center;gap:12px;padding:0 18px;border-right:1px solid var(--line);white-space:nowrap}
  #rc-top .id b{font:700 19px var(--cond);letter-spacing:.04em;text-transform:uppercase}
  #rc-clock{font:700 26px var(--cond);color:var(--amber)}
  #rc-top .id small{font:600 11px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-left:-6px}
  #rc-alarm{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px;padding:0 18px;background:var(--red);color:#1a0705;font:700 17px var(--cond);letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}
  #rc-alarm.ok{background:transparent;color:var(--green)}
  #rc-alarm span{font:600 14px var(--sans);text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;min-width:0}
  #rc-top .nums{display:flex;flex:none}
  #rc-top .num{display:flex;gap:8px;padding:0 16px;border-left:1px solid var(--line);align-items:center}
  #rc-top .num strong{font:700 27px var(--cond)}
  #rc-top .num em{font:500 12px var(--sans);font-style:normal;color:var(--muted);max-width:92px;line-height:1.15}
  #rc-top .num.hot strong{color:var(--red)}#rc-top .num.warm strong{color:var(--amber)}
  #rc-top .tools{display:flex;align-items:center;gap:6px;padding:0 12px;border-left:1px solid var(--line);flex:none}
  .rc .tb{background:transparent;border:1px solid #3a4a54;border-radius:2px;padding:5px 9px;font:700 12px var(--cond);letter-spacing:.08em;text-transform:uppercase;color:var(--ink)}
  .rc .tb:hover{border-color:var(--amber);color:var(--amber)}
  #rc-new{font-family:'Barlow Condensed','Arial Narrow',sans-serif;position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:40;display:none;background:#0a0f12;border:1px solid var(--amber);color:var(--amber);border-radius:2px;padding:5px 12px;font:700 12px var(--cond);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  body:not(.regie-c) #rc-new.pret{display:block}

  #rc-rack{position:fixed;left:0;top:var(--rc-top);bottom:var(--rc-bot);width:var(--rc-bay);z-index:40;background:var(--bay);border-right:1px solid var(--line);padding:10px 12px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2c3a42 transparent}
  .rc .bay{display:flex;flex-direction:column;gap:5px;flex:none}
  .rc .bay h2{display:flex;align-items:baseline;gap:10px;font:700 15px var(--cond);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-bottom:4px;border-bottom:1px solid var(--line)}
  .rc .bay h2 i{font-style:normal;margin-left:auto;font:500 12px var(--sans);letter-spacing:0;text-transform:none}
  .rc .bay.decide h2{color:var(--amber)}
  .rc .sous{font:600 11px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:2px}
  .rc .vide{font-size:12.5px;color:var(--muted);padding:3px 0}
  .rc .more{font:600 12px var(--cond);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-align:center;padding:3px;border:1px dashed #33434c;cursor:pointer;background:none}
  .rc .more:hover{color:var(--amber);border-color:var(--amber)}
  .rc .strip{display:grid;grid-template-columns:62px 30px 1fr auto;min-height:46px;background:var(--paper);color:var(--paper-ink);border-radius:2px;position:relative;cursor:pointer;
    box-shadow:0 1px 0 #fff6 inset,0 3px 0 #0007,0 8px 14px -6px #000a}
  .rc .strip>*{padding:5px 8px;display:flex;flex-direction:column;justify-content:center;min-width:0}
  .rc .t{font:700 18px var(--cond);color:#101010;align-items:center;border-radius:2px 0 0 2px}
  .rc .t small{font:700 9.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;margin-top:-2px;text-align:center}
  .rc .lv{font:700 16px var(--cond);border-right:1px dashed var(--paper-line);align-items:center;color:#2b2f31;padding:5px 2px}
  .rc .body{font-size:13px;font-weight:500;line-height:1.2;border-right:1px dashed var(--paper-line)}
  .rc .body b{font-weight:600}
  .rc .where{font:600 11px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--paper-mute)}
  .rc .act{align-items:stretch;gap:4px;flex-direction:column;padding:5px 7px}
  .rc .btn{border:0;border-radius:2px;padding:5px 9px;font:700 12px var(--cond);letter-spacing:.07em;text-transform:uppercase;background:#1b2226;color:#f1ece0}
  .rc .btn:hover{background:#2c373d}
  .rc .btn.ok{background:var(--good);color:#fff}.rc .btn.ok:hover{background:#0e6a40}
  .rc .btn.no{background:transparent;color:#2b2f31;box-shadow:inset 0 0 0 1px #8d8671}.rc .btn.no:hover{background:#0001}
  .rc .btn[disabled]{opacity:.55;cursor:default}
  .rc .red .t{background:var(--red)}.rc .amber .t{background:var(--amber)}.rc .green .t{background:var(--green)}.rc .blue .t{background:var(--blue)}.rc .grey .t{background:#a9b3b8}
  .rc .strip.done{background:#cfc9b6;min-height:40px;box-shadow:0 3px 0 #0006;cursor:default}
  .rc .strip.done .body{font-size:12.5px;color:#34373a}
  .rc .strip.sel{outline:2px solid var(--amber);outline-offset:2px;transform:translateX(8px);margin-right:8px}
  .rc .strip.plan{grid-template-columns:62px 1fr auto;min-height:74px}
  .rc .plan .t{font-size:28px}
  .rc .plan .body{gap:4px}
  .rc .name{font:700 17px/1.1 var(--cond);letter-spacing:.02em}
  .rc .delta{display:flex;gap:4px;flex-wrap:wrap}
  .rc .delta span{font:600 12px var(--sans);padding:1px 6px;background:#e2dac1;border-radius:2px;white-space:nowrap}
  .rc .delta .g{color:var(--good)}.rc .delta .b{color:var(--bad)}

  #rc-eff{position:fixed;left:calc(var(--rc-bay) + 14px);top:calc(var(--rc-top) + 12px);width:270px;z-index:38;background:#0a0f12ee;border:1px solid #4a3a12;padding:9px 12px;border-radius:2px;display:none}
  #rc-eff.on{display:block}
  #rc-eff h3{font:700 14px var(--cond);letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin-bottom:5px}
  #rc-eff li{list-style:none;font-size:12.5px;display:flex;gap:8px;padding:2px 0;color:#cfd8dc}
  #rc-eff li i{flex:none;width:16px;height:3px;margin-top:7px;display:block}
  #rc-lead{position:fixed;left:0;top:0;pointer-events:none;z-index:39}

  #rc-bot{position:fixed;left:0;right:0;bottom:0;height:var(--rc-bot);z-index:40;background:#05080a;border-top:1px solid var(--line)}
  #rc-tl{position:relative;height:${TL}px;background:#0a0f12;border-bottom:1px solid var(--line)}
  #rc-tl .ruler{position:absolute;left:0;right:0;top:20px;height:2px;background:#25323a}
  #rc-tl .proj{position:absolute;top:12px;bottom:12px;right:0;background:#ffb21e14}
  #rc-tl .now{position:absolute;top:6px;bottom:6px;width:2px;background:var(--amber)}
  #rc-tl .now em{position:absolute;right:6px;top:-3px;font:600 11px var(--cond);letter-spacing:.08em;color:var(--amber);font-style:normal;white-space:nowrap}
  #rc-tl .lab{position:absolute;bottom:2px;font:600 11px var(--cond);letter-spacing:.06em;color:var(--muted)}
  #rc-tl i.tk{position:absolute;top:21px;border-radius:50%;transform:translate(-50%,-50%);cursor:pointer}
  #rc-tip{position:fixed;z-index:60;max-width:360px;background:#0a0f12;border:1px solid var(--amber);padding:5px 9px;font:500 12.5px var(--sans);color:var(--ink);display:none;pointer-events:none}
  #rc-sub{position:relative;height:${SUB}px;display:flex;align-items:center;gap:22px;padding:0 20px;border-top:2px solid var(--amber)}
  #rc-sub .who{font:600 12px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);width:130px;flex:none;line-height:1.3}
  #rc-sub .who b{display:block;color:var(--amber);font-weight:700;font-size:14px}
  #rc-sub q{quotes:"« " " »";font:600 46px/1.1 var(--cond);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rc-sub q.vide{font-size:26px;color:#5d6d76;font-weight:500}
  #rc-sub .ctl{flex:none;width:300px;display:flex;flex-direction:column;gap:5px}
  #rc-sub .ctl .row{display:flex;gap:5px}
  #rc-sub input{flex:1;min-width:0;background:#0f171b;border:1px solid #33434c;color:var(--ink);font:500 13px var(--sans);padding:5px 8px;border-radius:2px}
  #rc-sub input:focus{outline:2px solid var(--amber);outline-offset:0}
  #rc-sub .state{font:500 12px/1.3 var(--sans);color:var(--green);max-height:32px;overflow:hidden}
  @media (max-width:1500px){#rc-top .num em{display:none}#rc-sub q{font-size:38px}#rc-sub .ctl{width:240px}#rc-top .id b{font-size:16px}}
  @media (prefers-reduced-motion:reduce){.rc .strip.sel{transform:none}}`;
  document.head.appendChild(css);

  // ---------- DOM ----------
  const mk = (html, id) => { const d = document.createElement('div'); d.className = 'rc'; d.id = id; d.innerHTML = html; document.body.appendChild(d); return d; };
  const top = mk(`<div class="id"><b>Régie · Forum des Halles</b><span id="rc-clock">T+00:00</span><small>min : s</small></div>
    <div id="rc-alarm" class="ok">Chargement…</div>
    <div class="nums">
     <div class="num"><strong id="rc-n-in">–</strong><em>personnes à l'intérieur</em></div>
     <div class="num" id="rc-n-dens"><strong>–</strong><em>p/m² max</em></div>
     <div class="num" id="rc-n-ex"><strong>–</strong><em>issues en tension</em></div>
     <div class="num"><strong id="rc-n-out">–</strong><em>sorties</em></div>
    </div>
    <div class="tools"><button class="tb" id="rc-go">Évacuer</button><button class="tb" id="rc-reset">Remettre</button><button class="tb" id="rc-vue">Vue ▾</button><button class="tb" id="rc-old">Ancienne vue</button></div>`, 'rc-top');
  const rack = mk(`<section class="bay decide" id="rc-b1"></section><section class="bay" id="rc-b2"></section><section class="bay" id="rc-b3"></section>`, 'rc-rack');
  const eff = mk('', 'rc-eff');
  const bot = mk(`<div id="rc-tl"></div><div id="rc-sub">
    <div class="who">Dernier ordre<b id="rc-who">Directeur</b></div><q id="rc-q" class="vide">Aucun ordre pour l'instant</q>
    <div class="ctl"><div class="row"><input id="rc-in" placeholder="Dire un ordre au directeur" autocomplete="off"><button class="tb" id="rc-mic" title="Parler au directeur">Micro</button></div><div class="state" id="rc-st"></div></div></div>`, 'rc-bot');
  const tip = mk('', 'rc-tip');
  const btnNew = document.createElement('button'); btnNew.id = 'rc-new'; btnNew.textContent = 'Régie strips'; document.body.appendChild(btnNew);
  const lead = document.createElement('canvas'); lead.id = 'rc-lead'; lead.className = 'rc'; document.body.appendChild(lead);
  const $ = (id) => document.getElementById(id);
  const b1 = $('rc-b1'), b2 = $('rc-b2'), b3 = $('rc-b3'), tl = $('rc-tl');

  // ---------- Données ----------
  let R = null; const proposed = new Set(); const ouvert = { b1: false, b2: false, b3: false };
  fetch('../commun/plans-forum.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => { R = j; if (pret) rendre(); });
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const mmss = (T) => `${p2(Math.floor((T || 0) / 60))}:${p2(Math.floor((T || 0) % 60))}`;
  const virg = (n, d) => Number(n).toFixed(d == null ? 1 : d).replace('.', ',');
  const A = () => window.alertes;
  const nomLev = (L) => (L.type === 'porte' ? SIM.groups[L.grp] && SIM.groups[L.grp].n : L.type === 'issue' ? `Issue de secours ${+L.id.split('-')[1] + 1}` : null);
  const levDe = (n) => LEV.find((l) => nomLev(l) === n);
  const court = (n) => { const L = levDe(n); return L && L.type === 'issue' && L.nom && L.nom !== 'Issue de secours' ? L.nom : n; };
  const liste = (a) => (a.length > 2 ? `${court(a[0])}, ${court(a[1])} +${a.length - 2}` : a.map(court).join(', '));
  const ordres = (p) => {
    const o = [];
    if (p.fermees.length) o.push(`Fermer : ${p.fermees.map(court).join(', ')}`);
    p.agents.forEach((s, i) => o.push(`Équipe ${String.fromCharCode(65 + i)} (4 agents) à ${court(s)} : guider vers la sortie`));
    if (p.annonces.length) o.push(`Messages par zone : diriger vers ${p.annonces.map(court).join(', ')}`);
    if (p.vagues > 1) o.push(`Sortie des salles du cinéma en ${p.vagues} vagues`);
    if (p.escalators === 'montee') o.push('Tous les escalators dans le sens de la sortie');
    if (p.ratp) o.push('Demander à la RATP de garder une bouche ouverte, filtrée');
    return o.length ? o : ['Tout ouvert, aucun guidage'];
  };
  const planNom = (p) => {
    const parts = [];
    if (p.fermees.length) parts.push('Fermer ' + liste(p.fermees));
    if (p.annonces.length) parts.push('Guider vers ' + liste(p.annonces)); else if (p.agents.length) parts.push('Agents à ' + liste(p.agents));
    if (p.ratp) parts.push('RATP'); if (p.escalators === 'montee') parts.push('escalators en montée'); if (p.vagues > 1) parts.push(p.vagues + ' vagues');
    return parts.slice(0, 2).join(' · ') || 'Garder la consigne';
  };
  const sg = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + (-n) : '0');
  const actives = () => { const m = A() && A().actives; return m ? [...m.values()].sort((a, b) => (b.sev === 'rouge') - (a.sev === 'rouge') || b.since - a.since) : []; };
  const attente = () => (A() ? A().events.filter((e) => e.type === 'proposition' && !e.clos && e.prop).sort((a, b) => b.T - a.T) : []);
  const lvl = (pos) => (pos && pos.lvl != null ? String(pos.lvl).replace('-', '−') : '·');
  const titre = (t) => String(t || '').split(' : ')[0];

  // ---------- Baie de strips ----------
  let sel = null; // {k:'a',key} | {k:'e',id} | {k:'p',i}
  const isSel = (k, v) => !!sel && sel.k === k && sel.v === v;
  function strip(cls, tm, tl2, lv, body, acts, data, extra) {
    return `<article class="strip ${cls}${extra || ''}" ${data}><div class="t">${tm}<small>${tl2}</small></div><div class="lv">${lv}</div><div class="body">${body}</div><div class="act">${acts || ''}</div></article>`;
  }
  const plus = (k, n, vu) => (n > 0 || vu ? `<button class="more" data-more="${k}">${ouvert[k] ? 'Réduire' : '+' + n + ' autres'}</button>` : '');
  function htmlTrancher() {
    const maxP = innerHeight < 860 ? 2 : 3, props = attente();
    const lim = ouvert.b1 ? props.length : maxP, vis = props.slice(0, lim);
    let h = `<h2>À trancher <i>${props.length} à valider · ${R ? R.meilleurs.length : 0} plans conseillés</i></h2>`;
    h += vis.map((e) => strip('amber', mmss(e.T), 'Proposé', lvl(e.pos), `<span class="where">${esc(titre(e.alerte) || 'Alerte')}</span>${esc(e.txt)}`,
      `<button class="btn ok" data-ok="${e.id}">Valider</button><button class="btn no" data-no="${e.id}">Refuser</button>`, `data-e="${e.id}"`, isSel('e', e.id) ? ' sel' : '')).join('');
    h += plus('b1', props.length - vis.length, ouvert.b1 && props.length > maxP);
    if (!props.length) h += '<div class="vide">Aucune proposition en attente.</div>';
    h += '<div class="sous">Plans conseillés · écart par rapport à la consigne actuelle</div>';
    if (!R) h += '<div class="vide">Aucun classement chargé (plans-forum.json absent).</div>';
    else {
      const r = R.reference.pire;
      h += R.meilleurs.map((x, i) => {
        const n = x.pire, dz = n.zone_danger - r.zone_danger, dn = n.non_sortis - r.non_sortis, da = n.agents - r.agents, pr = proposed.has(x.plan.id);
        const cl = (v) => (v < 0 ? 'g' : v > 0 ? 'b' : '');
        return `<article class="strip plan green${isSel('p', i) ? ' sel' : ''}" data-p="${i}" title="${esc(ordres(x.plan).join(' ; '))}"><div class="t">${i + 1}<small>Pire cas ${virg(n.densite_max, 0)}</small></div>
         <div class="body"><div class="name">${esc(planNom(x.plan))}</div><div class="delta"><span class="${cl(dz)}">${sg(dz)} vers les perturbations</span><span class="${cl(dn)}">${sg(dn)} non sortis à 10 min</span><span class="${cl(da)}">${sg(da)} agent${Math.abs(da) > 1 ? 's' : ''}</span></div></div>
         <div class="act"><button class="btn ok" data-prop="${i}"${pr ? ' disabled' : ''}>${pr ? 'Proposé' : 'Proposer'}</button></div></article>`;
      }).join('');
    }
    return h;
  }
  function htmlEnCours() {
    const L = actives(), max = 4, vis = ouvert.b2 ? L : L.slice(0, max);
    let h = `<h2>En cours <i>${L.length} actif${L.length > 1 ? 's' : ''}</i></h2>`;
    h += vis.map((a) => strip(a.sev === 'rouge' ? 'red' : 'amber', mmss(a.since), a.sev === 'rouge' ? 'Danger' : 'Attention', lvl(a.pos),
      `<span class="where">${esc(titre(a.txt))}</span>${esc(a.txt.includes(' : ') ? a.txt.slice(a.txt.indexOf(' : ') + 3) : '')}`, '<button class="btn" data-voir="1">Voir</button>', `data-a="${esc(a.key)}"`, isSel('a', a.key) ? ' sel' : '')).join('');
    h += plus('b2', L.length - vis.length, ouvert.b2 && L.length > max);
    if (!L.length) h += '<div class="vide">Aucun problème actif.</div>';
    return h;
  }
  function htmlFait() {
    const reg = (window.registre || []).slice().reverse(), max = 3, vis = ouvert.b3 ? reg : reg.slice(0, max);
    let h = `<h2>Fait <i>${reg.length} décision${reg.length > 1 ? 's' : ''}</i></h2>`;
    h += vis.map((d) => { const ref = /^Refusé/.test(d.decision || ''); return strip('done ' + (ref ? 'grey' : 'green'), mmss(d.T), ref ? 'Refusé' : 'Décidé', '·', `${esc(d.decision)} <span class="where">· ${esc(d.par || '')}</span>`, '', ''); }).join('');
    h += plus('b3', reg.length - vis.length, ouvert.b3 && reg.length > max);
    if (!reg.length) h += '<div class="vide">Aucune décision pour l\'instant.</div>';
    return h;
  }
  const last = { b1: '', b2: '', b3: '' };
  function rendre() {
    if (!on) return;
    const h1 = htmlTrancher(), h2 = htmlEnCours(), h3 = htmlFait();
    if (h1 !== last.b1) { last.b1 = h1; b1.innerHTML = h1; }
    if (h2 !== last.b2) { last.b2 = h2; b2.innerHTML = h2; }
    if (h3 !== last.b3) { last.b3 = h3; b3.innerHTML = h3; }
    majEffet(); majAncre();
  }

  // ---------- Actions ----------
  function proposer(i) {
    const x = R && R.meilleurs[i]; if (!x) return;
    const o = ordres(x.plan);
    (window.registre || (window.registre = [])).push({ heure: new Date().toLocaleTimeString('fr-FR'), T: Math.round(SIM.T || 0), decision: `Plan conseillé ${i + 1} proposé au PC : ${o.join(' ; ')}`, par: 'chef de poste', source: 'explorateur (strips)' });
    window.dispatchEvent(new CustomEvent('plan-retenu', { detail: { plan: x.plan, ordres: o, note: x.pire } }));
    window.dispatchEvent(new CustomEvent('chrono', { detail: { type: 'vert', txt: `Plan ${i + 1} proposé au PC : ${planNom(x.plan)}` } }));
    proposed.add(x.plan.id); rendre();
  }
  const evParId = (id) => A().events.find((e) => e.id === +id);
  function voler(pos) {
    if (!pos || typeof camFly !== 'function') return;
    const y = typeof alt === 'function' ? alt(pos.lvl) : 0; camFly([pos.x + 45, y + 40, pos.z + 55], [pos.x, y, pos.z]);
  }
  function choisir(s) {
    sel = s; majCibles();
    if (!s) { rendre(); return; }
    const T = cibles();
    if (s.k === 'p') {
      const pts = T.filter((c) => c.col !== AMB);
      if (pts.length && typeof camFly === 'function') {
        const cx = pts.reduce((a, c) => a + c.x, 0) / pts.length, cz = pts.reduce((a, c) => a + c.z, 0) / pts.length;
        const sp = Math.max(60, ...pts.map((c) => Math.hypot(c.x - cx, c.z - cz))), d = Math.min(420, sp * 1.25 + 40);
        camFly([cx + d * .45, d * .75, cz + d * .85], [cx, 0, cz]);
      }
    } else if (T[0]) voler({ x: T[0].x, z: T[0].z, lvl: T[0].lvl });
    rendre();
  }
  rack.addEventListener('click', (e) => {
    const t = e.target;
    const more = t.closest('[data-more]'); if (more) { ouvert[more.dataset.more] = !ouvert[more.dataset.more]; rendre(); return; }
    const ok = t.closest('[data-ok]'); if (ok) { const ev = evParId(ok.dataset.ok); if (ev) A().valider(ev); rendre(); return; }
    const no = t.closest('[data-no]'); if (no) { const ev = evParId(no.dataset.no); if (ev) A().refuser(ev); rendre(); return; }
    const pr = t.closest('[data-prop]'); if (pr) { proposer(+pr.dataset.prop); return; }
    const s = t.closest('.strip'); if (!s) return;
    if (s.dataset.p != null) choisir(isSel('p', +s.dataset.p) ? null : { k: 'p', v: +s.dataset.p });
    else if (s.dataset.e != null) choisir(isSel('e', +s.dataset.e) ? null : { k: 'e', v: +s.dataset.e });
    else if (s.dataset.a != null) choisir(isSel('a', s.dataset.a) ? null : { k: 'a', v: s.dataset.a });
  });
  rack.addEventListener('scroll', () => majAncre(), { passive: true });

  // ---------- Effet dans la 3D : anneaux pulsés + fil de liaison ----------
  const AMB = '#ffb21e', RED = '#ff5a47', GRN = '#4fd18b';
  let cib = [], anneaux = [], tex = null, grp = null, ancre = null, boucle = 0;
  function cibles() {
    if (!sel) return [];
    const out = [];
    if (sel.k === 'p' && R) {
      const p = R.meilleurs[sel.v].plan, vus = new Set();
      const add = (n, col) => { const L = levDe(n); if (!L || !L.sprite) return; const k = col + n; if (vus.has(k)) return; vus.add(k); const q = L.sprite.position; out.push({ x: q.x, y: q.y, z: q.z, col, nom: court(n), lvl: L.niveau }); };
      p.fermees.forEach((n) => add(n, RED)); [...p.annonces, ...p.agents].forEach((n) => add(n, GRN));
    } else {
      let pos = null;
      if (sel.k === 'a') { const a = A().actives.get(sel.v); pos = a && a.pos; } else if (sel.k === 'e') { const e = evParId(sel.v); pos = e && e.pos; }
      if (pos) out.push({ x: pos.x, y: (typeof alt === 'function' ? alt(pos.lvl) : 0) + 1, z: pos.z, col: AMB, nom: '', lvl: pos.lvl });
    }
    return out;
  }
  function majCibles() {
    cib = cibles();
    if (!grp) { grp = new THREE.Group(); scene.add(grp); }
    if (!tex) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(32, 32, 22, 0, 7); g.stroke();
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      tex = new THREE.CanvasTexture(c);
    }
    anneaux.forEach((s) => grp.remove(s)); anneaux = [];
    cib.forEach((c) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: c.col, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }));
      s.position.set(c.x, c.y, c.z); s.scale.set(.05, .05, 1); s.renderOrder = 30; grp.add(s); anneaux.push(s);
    });
    cancelAnimationFrame(boucle); boucle = 0;
    if (cib.length && on) boucle = requestAnimationFrame(anime); else dessiner(true);
  }
  const v3 = new THREE.Vector3();
  function anime(t) {
    if (!cib.length || !on) { boucle = 0; return; }
    const k = .5 + .5 * Math.sin(t / 220);
    anneaux.forEach((s) => s.scale.set(.045 + .03 * k, .045 + .03 * k, 1));
    dessiner(false); boucle = requestAnimationFrame(anime);
  }
  function majAncre() {
    const s = rack.querySelector('.strip.sel');
    if (!s) { ancre = null; return; }
    const r = s.getBoundingClientRect(), b = rack.getBoundingClientRect();
    ancre = { x: BAY, y: Math.max(b.top + 10, Math.min(b.bottom - 10, r.top + r.height / 2)) };
  }
  function dessiner(vide) {
    const ctx = lead.getContext('2d'), W = innerWidth, H = innerHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lead.width, lead.height);
    if (vide || !ancre || !cib.length) return;
    const dpr = lead.width / W; ctx.scale(dpr, dpr);
    ctx.save(); ctx.beginPath(); ctx.rect(BAY, TOP, W - BAY, H - TOP - BOT); ctx.clip();
    ctx.font = '600 13px "Barlow Condensed",Arial Narrow,sans-serif'; ctx.lineWidth = 1.4;
    cib.forEach((c) => {
      v3.set(c.x, c.y, c.z).project(cam); if (v3.z > 1) return;
      const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
      ctx.beginPath(); ctx.moveTo(ancre.x, ancre.y); ctx.lineTo(ancre.x + 30, ancre.y); ctx.lineTo(x, y); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = AMB; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
      if (c.nom) { const tx = c.nom.toUpperCase(), w = ctx.measureText(tx).width + 12; ctx.fillStyle = '#0a0f12'; ctx.fillRect(x + 8, y - 22, w, 18); ctx.strokeStyle = c.col; ctx.strokeRect(x + 8.5, y - 21.5, w - 1, 17); ctx.fillStyle = '#e8eef0'; ctx.fillText(tx, x + 14, y - 9); }
    });
    ctx.restore();
  }
  function majEffet() {
    if (!sel) { eff.classList.remove('on'); eff.innerHTML = ''; return; }
    let h = '';
    if (sel.k === 'p' && R) {
      const x = R.meilleurs[sel.v], p = x.plan;
      h = `<h3>Effet du plan ${sel.v + 1}</h3><ul>`;
      if (p.fermees.length) h += `<li><i style="background:${RED}"></i><span><b>Fermer</b> ${esc(p.fermees.map(court).join(', '))}</span></li>`;
      const g = [...p.annonces, ...p.agents]; if (g.length) h += `<li><i style="background:${GRN}"></i><span><b>Guider vers</b> ${esc([...new Set(g)].map(court).join(', '))}</span></li>`;
      (x.pire.tension || []).slice(0, 2).forEach((t) => { h += `<li><i style="background:${AMB}"></i><span><b>${esc(court(t.sortie))}</b> : jusqu'à ${t.file_max} en file${t.delestage && t.delestage[0] ? `, soulager par ${esc(court(t.delestage[0].sortie))} (+${t.delestage[0].detour_m} m)` : ''}</span></li>`; });
      h += '</ul>';
    } else {
      let a = null;
      if (sel.k === 'a') { const o = A().actives.get(sel.v); a = o && o.txt; } else { const e = evParId(sel.v); a = e && e.txt; }
      h = `<h3>Lieu de l'alerte</h3><ul><li><i style="background:${AMB}"></i><span>${esc(a || '')}</span></li></ul>`;
    }
    eff.innerHTML = h; eff.classList.add('on');
  }

  // ---------- Barre haute ----------
  const coul = (id, t) => { const el = $(id); if (el.textContent !== t) el.textContent = t; };
  function barre() {
    const T = SIM.T || 0; coul('rc-clock', 'T+' + mmss(T));
    const act = actives(); const al = $('rc-alarm');
    const html = act.length ? `${act.length} problème${act.length > 1 ? 's' : ''} <span>${esc(act.slice(0, 3).map((a) => titre(a.txt)).join(' · '))}</span>` : 'Aucun problème';
    if (al.dataset.h !== html) { al.dataset.h = html; al.className = act.length ? '' : 'ok'; al.innerHTML = html; }
    let dedans = 0; for (let i = 0, a = SIM.A; i < a.length; i++) if (!a[i].out) dedans++;
    coul('rc-n-in', dedans.toLocaleString('fr-FR'));
    const dm = Math.max(SIM.dmax || 0, (A().cout && A().cout.pic) || 0); const nd = $('rc-n-dens');
    nd.firstChild.textContent = virg(dm, 1); nd.className = 'num' + (dm >= 4 ? ' hot' : dm >= 3 ? ' warm' : '');
    const issues = LEV.filter((l) => l.type === 'porte' || l.type === 'issue').length;
    const ten = act.filter((a) => /porte|issue|ascenseur|escalator|escalier/i.test(a.txt)).length; const ne = $('rc-n-ex');
    ne.firstChild.textContent = ten + '/' + issues; ne.className = 'num' + (ten ? ' hot' : '');
    coul('rc-n-out', (SIM.out || 0).toLocaleString('fr-FR'));
  }

  // ---------- Frise ----------
  const COL = { rouge: RED, orange: AMB, info: '#4aa3ff', proposition: GRN, decision: GRN };
  let ticks = [], lastTl = '';
  function frise() {
    const T = SIM.T || 0, W0 = 600, SPAN = 660, t0 = T - W0;
    ticks = A().events.filter((e) => e.T >= t0 && e.T <= T + 1).slice(-160);
    const pos = (t) => ((t - t0) / SPAN * 100);
    let h = `<div class="ruler"></div><div class="proj" style="width:${100 - pos(T)}%"></div><div class="now" style="left:${pos(T)}%"><em>maintenant ${mmss(T)}</em></div>`;
    h += `<span class="lab" style="left:8px">−10 min</span><span class="lab" style="left:${pos(T - 300)}%">−5 min</span><span class="lab" style="right:8px">projection +1 min</span>`;
    ticks.slice().sort((a, b) => (a.type === 'info' ? 0 : 1) - (b.type === 'info' ? 0 : 1)).forEach((e) => {
      const gr = e.type === 'info' ? 8 : 12, i = ticks.indexOf(e);
      h += `<i class="tk" data-i="${i}" style="left:${pos(e.T)}%;width:${gr}px;height:${gr}px;background:${COL[e.type] || '#7f8d95'}"></i>`;
    });
    if (h !== lastTl) { lastTl = h; tl.innerHTML = h; }
  }
  tl.addEventListener('mouseover', (e) => {
    const t = e.target.closest('.tk'); if (!t) { tip.style.display = 'none'; return; }
    const ev = ticks[+t.dataset.i]; if (!ev) return;
    tip.textContent = `${mmss(ev.T)} · ${ev.txt}`; tip.style.display = 'block';
    const r = t.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(innerWidth - 380, r.left - 20)) + 'px'; tip.style.top = (r.top - tip.offsetHeight - 8) + 'px';
  });
  tl.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  tl.addEventListener('click', (e) => { const t = e.target.closest('.tk'); const ev = t && ticks[+t.dataset.i]; if (ev) voler(ev.pos); });

  // ---------- Dernier ordre du directeur (journal #dirLog de directeur.js) ----------
  let obs = null;
  function brancherDirecteur() {
    const L = document.getElementById('dirLog'); if (!L || obs) return !!obs;
    obs = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
      if (!n.textContent) return; const tx = n.textContent.trim();
      if (/^Directeur du centre/.test(tx)) return; // message d'un agent au PC, pas un ordre
      if (/^Directeur\s*·/.test(tx)) { $('rc-q').textContent = tx.replace(/^Directeur\s*·\s*/, ''); $('rc-q').className = ''; $('rc-who').textContent = 'Directeur · T+' + mmss(SIM.T); $('rc-st').textContent = ''; }
      else if (/^Outil/.test(tx)) $('rc-st').textContent = tx.replace(/^Outil\s*·\s*/, '').slice(0, 160);
    })));
    obs.observe(L, { childList: true }); return true;
  }
  $('rc-in').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.value.trim()) return;
    const d = $('dirTxt'); if (!d) return; d.value = e.target.value.trim(); e.target.value = '';
    d.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  // Voix : le micro de directeur.js reste la seule reconnaissance ; ici on rend visible son état, la phrase entendue en
  // direct et la réponse. Bouton « Parler » ou touche V (hors champ de saisie) pour commencer / arrêter.
  const vst = document.createElement('style');
  vst.textContent = `#rc-mic{font-size:16px!important;padding:10px 18px!important;background:#FFB21E!important;color:#111!important;font-weight:700!important;letter-spacing:.04em}
  #rc-mic.on{background:#E0461F!important;color:#fff!important;animation:rcpulse 1s infinite}
  @keyframes rcpulse{50%{box-shadow:0 0 0 8px rgba(224,70,31,.25)}} #rc-q.ecoute{font-style:italic;opacity:.85}`;
  document.head.appendChild(vst);
  const micBtn = $('rc-mic'), m0 = $('dirMic');
  micBtn.textContent = m0 && !m0.disabled ? '🎙 PARLER (V)' : 'Micro indisponible : tapez l’ordre';
  const parler = () => { const m = $('dirMic'); if (m && !m.disabled) m.click(); else $('rc-in').focus(); };
  micBtn.onclick = parler;
  addEventListener('keydown', (e) => {
    if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) { e.preventDefault(); parler(); }
  });
  // Sélecteur de vue : relaie les commandes d'origine de la page (style A fil de fer « holographique », B argile,
  // C thermique, D Paris ; jour / nuit ; caméra ; niveau ; écartement), cachées en mode strips.
  const pv = document.createElement('div'); pv.id = 'rc-vuep';
  pv.style.cssText = 'position:fixed;top:60px;right:12px;z-index:60;display:none;background:#14181d;border:1px solid #FFB21E;border-radius:6px;padding:10px 12px;font:600 13px Barlow Condensed,system-ui,sans-serif;color:#eee;min-width:300px';
  const ligne = (titre, items) => `<div style="margin:6px 0 2px;color:#FFB21E;letter-spacing:.06em">${titre}</div><div style="display:flex;flex-wrap:wrap;gap:4px">${items}</div>`;
  const bt = (attr, txt) => `<button class="tb" ${attr} style="padding:5px 9px">${txt}</button>`;
  pv.innerHTML = ligne('STYLE', bt('data-vs="A"', 'Holographique (fil de fer)') + bt('data-vs="B"', 'Argile') + bt('data-vs="C"', 'Thermique') + bt('data-vs="D"', 'Paris texturé'))
    + ligne('MOMENT', bt('data-vm="dayBtn"', 'Jour') + bt('data-vm="nightBtn"', 'Nuit · 19 oct. 20 h'))
    + ligne('CAMÉRA', bt('data-vc="orbit"', 'Orbite') + bt('data-vc="top"', 'Dessus') + bt('data-vc="cut"', 'Coupe') + bt('data-vc="forum"', 'Forum'))
    + ligne('NIVEAU', ['all', '0', '-1', '-2', '-3', '-4', '-5'].map((n) => bt(`data-vl="${n}"`, n === 'all' ? 'Tous' : n)).join(''))
    + `<div style="margin-top:8px">ÉCARTER LES NIVEAUX <input id="rc-spread" type="range" min="1" max="4" step="0.1" value="1" style="width:140px;vertical-align:middle"></div>`;
  document.body.appendChild(pv);
  $('rc-vue').onclick = () => { pv.style.display = pv.style.display === 'none' ? 'block' : 'none'; };
  pv.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    try {
      if (b.dataset.vs) document.querySelector(`button[data-s="${b.dataset.vs}"]`)?.click();
      if (b.dataset.vm) $(b.dataset.vm)?.click();
      if (b.dataset.vc) document.querySelector(`button[data-c="${b.dataset.vc}"]`)?.click();
      if (b.dataset.vl) { const s = $('lvl'); if (s) { s.value = b.dataset.vl; s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); } }
    } catch (x) { console.warn('vue', x); }
  });
  $('rc-spread').addEventListener('input', (e) => { const s = $('spread'); if (s) { s.value = e.target.value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); } });
  let ecoutait = false;
  setInterval(() => {
    const m = $('dirMic'), d = $('dirTxt'); if (!m) return;
    const on = m.classList.contains('on');
    micBtn.classList.toggle('on', on);
    if (on) {
      micBtn.textContent = '● J’ÉCOUTE… (V pour arrêter)';
      const t = d && d.value.trim();
      $('rc-q').textContent = t ? `« ${t} »` : '« … parlez »'; $('rc-q').className = 'ecoute';
      $('rc-who').textContent = 'Directeur · en direct';
    } else if (ecoutait) micBtn.textContent = '🎙 PARLER (V)';
    ecoutait = on;
  }, 150);
  $('rc-go').onclick = () => { const b = $('evacGo'); if (b) b.click(); };
  $('rc-reset').onclick = () => { const b = $('evacReset'); if (b) b.click(); };
  $('rc-old').onclick = () => afficher(false);
  btnNew.onclick = () => afficher(true);

  // ---------- Disposition : la 3D occupe la zone libre (décalage de projection, le canvas garde la taille de la fenêtre) ----------
  // Les autres modules lisent clientX / innerWidth pour viser : le canvas reste plein écran et la caméra est décalée
  // (setViewOffset), ce qui garde le picking exact sans toucher à leurs fichiers.
  let pret = false, effacerOrig = null;
  function disposer() {
    const W = innerWidth, H = innerHeight, fw = Math.max(200, W - BAY), fh = Math.max(200, H - TOP - BOT);
    cam.aspect = fw / fh; cam.setViewOffset(fw, fh, -BAY, -TOP, W, H); cam.updateProjectionMatrix();
    const d = Math.min(2, devicePixelRatio || 1); lead.width = Math.round(W * d); lead.height = Math.round(H * d); lead.style.width = W + 'px'; lead.style.height = H + 'px';
    majAncre();
  }
  function afficher(v) {
    on = !!v; try { localStorage.setItem(CLE, on ? '1' : '0'); } catch (e) {}
    document.body.classList.toggle('regie-c', on);
    if (!pret) return;
    if (on) { disposer(); last.b1 = last.b2 = last.b3 = ''; rendre(); majCibles(); tick(); }
    else { effacerOrig(); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); dessiner(true); cancelAnimationFrame(boucle); boucle = 0; }
  }
  function tick() { if (!pret || !on) return; try { brancherDirecteur(); barre(); frise(); rendre(); } catch (e) { console.warn('regie-strips', e); } }

  function demarrer() {
    pret = true;
    effacerOrig = cam.clearViewOffset.bind(cam);
    cam.clearViewOffset = function () { if (on) disposer(); else effacerOrig(); }; // individu.js l'appelle à chaque sélection
    addEventListener('resize', () => { if (on) disposer(); });
    btnNew.classList.add('pret');
    setInterval(tick, 1000);
    afficher(on); tick();
  }
  window.regie = { afficher, ancienneVue: () => afficher(false), selectionner: (s) => choisir(s) };
  let essais = 0;
  (function attendre() {
    let ok = false;
    try { ok = typeof SIM !== 'undefined' && SIM.A && typeof LEV !== 'undefined' && LEV.length && window.alertes && typeof cam !== 'undefined' && typeof rnd !== 'undefined' && typeof scene !== 'undefined' && LEV[0].sprite; } catch (e) {}
    if (ok) demarrer(); else if (++essais < 1500) setTimeout(attendre, 200); else console.warn('regie-strips : page non prête');
  })();
})();
