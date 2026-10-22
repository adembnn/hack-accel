// Interface commune aux vues 3D (Châtelet, Adidas Arena) : à charger APRÈS le script principal de index.html, sans le modifier.
// <script src="../commun/regie-ui.js"></script>
// 1) Vue par calques : chaque calque en Complet / Fantôme / Masqué, et un bouton Focus qui fantômise les voisins.
// 2) Leviers (scene['leviers'], format commun) : un repère lisible à taille constante par porte, issue, bouche, escalator,
//    ascenseur ou zone ; un clic ouvre un menu d'actions (fermer, rouvrir, poster un agent, annonce...).
//    Chaque action émet window 'levier' {detail: {levier, action}} pour la régie et le moteur.
// Utilise les globales de index.html : THREE, scene, cam, rnd, G, SCN, rebuild, pairs, alt (si défini).
(function () {
  const css = document.createElement('style');
  css.textContent = `
  #rg-vue{position:fixed;left:50%;top:10px;transform:translateX(-50%);display:flex;gap:6px;align-items:center;background:rgba(250,248,243,.94);border:1px solid #d6d1c6;border-radius:6px;padding:6px 8px;font:500 13px system-ui,sans-serif;color:#1D1F1E;z-index:6}
  #rg-vue b{font-weight:700;margin-right:4px}
  #rg-vue button{all:unset;cursor:pointer;padding:4px 8px;border-radius:4px;border:1px solid #d6d1c6;background:#fff}
  #rg-vue button[data-st="1"]{background:#e9e5dc;color:#6b665c}#rg-vue button[data-st="2"]{background:transparent;color:#a8a296;text-decoration:line-through}
  #rg-vue button.focus{background:#1D1F1E;color:#fff;border-color:#1D1F1E}
  #rg-menu{position:fixed;min-width:260px;max-width:320px;background:#fff;border:1px solid #1D1F1E;border-radius:6px;box-shadow:0 10px 24px rgba(0,0,0,.22);font:500 14px system-ui,sans-serif;color:#1D1F1E;z-index:7;display:none}
  #rg-menu .h{padding:10px 12px 6px;border-bottom:1px solid #eee}#rg-menu .h small{display:block;color:#6b665c;font-size:12px;margin-top:2px}
  #rg-menu .code{display:inline-block;color:#fff;font-weight:700;border-radius:3px;padding:1px 6px;margin-right:6px}
  #rg-menu .st{font-weight:700}#rg-menu .acts{display:flex;flex-direction:column;padding:6px}
  #rg-menu .acts button{all:unset;cursor:pointer;padding:8px 10px;border-radius:4px}#rg-menu .acts button:hover{background:#f1eee7}
  #rg-menu .acts button.main{background:#1D1F1E;color:#fff;font-weight:700;margin-bottom:4px}#rg-menu .acts button.main:hover{background:#000}
  #rg-menu .f{padding:6px 12px 10px;color:#6b665c;font-size:12px;border-top:1px solid #eee}
  #rg-tip{position:fixed;pointer-events:none;background:#1D1F1E;color:#fff;font:600 13px system-ui,sans-serif;padding:4px 8px;border-radius:4px;z-index:7;display:none}`;
  document.head.appendChild(css);

  // ---------- 1) Calques ----------
  const LAYERS = [['batiments', 'Bâtiments'], ['arbres', 'Arbres'], ['abords', 'Mobilier'], ['lampes', 'Lampadaires'], ['rues', 'Rues'], ['population', 'Foule'], ['incendie', "Bouches d'incendie"]];
  const state = {}; // 0 complet, 1 fantôme, 2 masqué
  const bar = document.createElement('div'); bar.id = 'rg-vue';
  bar.innerHTML = '<b>Vue</b><button class="fx">Focus sur le lieu</button>' + LAYERS.filter(([k]) => G[k]).map(([k, n]) => `<button data-k="${k}" data-st="0">${n}</button>`).join('');
  document.body.appendChild(bar);
  function ghost(obj, on) {
    obj.traverse(o => {
      if (!o.material) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => {
        if (m.userData.rgOp === undefined) m.userData.rgOp = [m.opacity, m.transparent, m.depthWrite];
        if (on) { m.transparent = true; m.opacity = Math.min(m.userData.rgOp[0], .07); m.depthWrite = false; }
        else { [m.opacity, m.transparent, m.depthWrite] = m.userData.rgOp; }
        m.needsUpdate = true;
      });
      o.castShadow = !on && o.castShadow;
    });
  }
  function applyLayers() {
    LAYERS.forEach(([k]) => { if (!G[k]) return; const st = state[k] || 0; G[k].visible = st !== 2; ghost(G[k], st === 1); });
    bar.querySelectorAll('button[data-k]').forEach(b => b.dataset.st = state[b.dataset.k] || 0);
    if (rnd.shadowMap) rnd.shadowMap.needsUpdate = true;
  }
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('fx')) { const on = !b.classList.contains('focus'); b.classList.toggle('focus', on);
      Object.assign(state, on ? {batiments: 1, arbres: 2, abords: 2, lampes: 2, population: 0, rues: 0} : {batiments: 0, arbres: 0, abords: 0, lampes: 0}); }
    else { const k = b.dataset.k; state[k] = ((state[k] || 0) + 1) % 3; }
    applyLayers();
  });
  window.regieFocus = on => { const b = bar.querySelector('.fx'); if (b.classList.contains('focus') !== !!on) b.click(); };

  // ---------- 2) Leviers : repères et menu d'actions ----------
  const FAM = {C1: '#1D6FB8', B1: '#0A8A3E', B2: '#0A8A3E', B3: '#C98A12', B5: '#7A4FB5', D1: '#D8572A', D2: '#B8322A', D5: '#1D1F1E', F1: '#1D1F1E'};
  const KIND = {issue: 'Issue', vomitoire: 'Vomitoire', porte: 'Porte', metro: 'Accès métro', tram: 'Arrêt de tram', station: 'Station', escalator: 'Escalator', ascenseur: 'Ascenseur', zone: 'Zone', point: 'Point'};
  const closedState = L => !/ouvert|en service|^0 min|inactive|inactif/.test(L.etat);
  const GLYPH = {metro: 'M', station: 'M', tram: 'T', bouche: 'M', issue: '⇥', porte: '⇥', vomitoire: '⇥', ascenseur: '⇅', escalator: '⇗', zone: '!', point: '!', incendie: 'BI'};
  function pin(L) { // même dessin que les épingles de leviers.js (Châtelet) : rond, liseré blanc, pointe, glyphe ; rouge et ✕ quand fermé
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), shut = closedState(L);
    x.beginPath(); x.arc(64, 58, 48, 0, 7); x.fillStyle = shut ? '#d32f2f' : (FAM[L.code] || '#1D1F1E'); x.fill(); x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
    x.beginPath(); x.moveTo(52, 104); x.lineTo(76, 104); x.lineTo(64, 124); x.closePath(); x.fillStyle = '#fff'; x.fill();
    x.fillStyle = '#fff'; x.font = '700 48px ui-monospace,Menlo,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(shut ? '✕' : (GLYPH[L.type] || L.code), 64, 60);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, sizeAttenuation: false, depthTest: false, transparent: true}));
    s.center.set(.5, 0); s.scale.set(.034, .034, 1); s.renderOrder = 20; return s;
  }
  const yOf = L => { const n = L.niveau || 0; if (n < 0 && typeof alt === 'function') return alt(n); return n * 5.6; };
  G.rgLeviers = new THREE.Group(); scene.add(G.rgLeviers);
  const host = () => (typeof LEV !== 'undefined' && typeof levGrp !== 'undefined' && levGrp) ? 'chatelet' : 'propre';
  function buildPins() {
    G.rgLeviers.clear(); if (host() === 'chatelet') return; // les épingles sont celles de leviers.js
    (SCN.leviers || []).forEach(L => {
      if (L.type === 'parametre') return;
      const g = new THREE.Group(); g.position.set(L.x, yOf(L), L.z); g.userData.lever = L;
      const s = pin(L); s.position.y = 1.5; s.userData.lever = L; g.add(s);
      if (L.poly) { const sh = new THREE.Shape(pairs(L.poly).map(([x, z]) => new THREE.Vector2(x - L.x, z - L.z))); const geo = new THREE.ShapeGeometry(sh); geo.rotateX(Math.PI / 2);
        const z = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: FAM[L.code], transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false})); z.position.y = .4; z.visible = closedState(L); g.add(z); g.userData.zone = z; }
      if (L.rayon) { const z = new THREE.Mesh(new THREE.RingGeometry(0, L.rayon, 48), new THREE.MeshBasicMaterial({color: 0xE0461F, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide})); z.rotation.x = -Math.PI / 2; z.position.y = .4; z.visible = closedState(L); g.add(z); g.userData.zone = z; }
      if (L.largeur && ['issue', 'porte', 'vomitoire'].includes(L.type)) { // barre au sol de la largeur de la porte : verte ouverte, rouge fermée
        const b = new THREE.Mesh(new THREE.BoxGeometry(L.largeur, .5, .6), new THREE.MeshBasicMaterial({color: closedState(L) ? 0xE0461F : 0x0A8A3E})); b.position.y = .25; g.add(b); }
      G.rgLeviers.add(g);
    });
  }
  // Actions par type d'objet : [libellé, nouvel état ou null, action]
  function actionsFor(L) {
    const shut = closedState(L);
    if (['issue', 'porte', 'vomitoire'].includes(L.type)) return [[shut ? 'Rouvrir' : 'Fermer', shut ? 'ouvert' : 'fermé', shut ? 'ouvrir' : 'fermer'], ['Poster un agent de sécurité', null, 'agent'], ['Annonce : diriger le public ici', null, 'annonce'], ['Filtrer (débit réduit de moitié)', 'filtré', 'filtrer']];
    if (L.type === 'incendie') return [];
    if (['metro', 'tram', 'station', 'bouche'].includes(L.type)) return [[shut ? 'Rouvrir (demande RATP)' : 'Fermer (C1)', shut ? 'ouvert' : 'fermé', shut ? 'ouvrir' : 'fermer'], ['Poster un agent pour réorienter', null, 'agent'], ['Annonce : station fermée, aller vers…', null, 'annonce']];
    if (L.type === 'escalator') return [[shut ? 'Remettre en marche' : 'Arrêter (B3)', shut ? 'ouvert' : 'arrêté', shut ? 'ouvrir' : 'arreter'], ['Inverser le sens (B4)', 'inversé', 'inverser']];
    if (L.type === 'ascenseur') return [[shut ? 'Remettre en service' : 'Mettre hors service (B5)', shut ? 'ouvert' : 'hors service', shut ? 'ouvrir' : 'fermer']];
    if (L.type === 'zone') return [[shut ? 'Lever la zone' : 'Activer la zone (' + L.code + ')', shut ? 'inactive' : 'active', shut ? 'lever' : 'activer'], ['Déplacer : cliquer sur la carte', null, 'deplacer']];
    if (L.type === 'point') return [[shut ? 'Lever le périmètre' : 'Poser le colis suspect (D5)', shut ? 'inactif' : 'actif', shut ? 'lever' : 'poser'], ['Déplacer : cliquer sur la carte', null, 'deplacer']];
    return [];
  }
  const menu = document.createElement('div'); menu.id = 'rg-menu'; document.body.appendChild(menu);
  const tip = document.createElement('div'); tip.id = 'rg-tip'; document.body.appendChild(tip);
  let moving = null;
  function openMenu(L, x, y) {
    const acts = actionsFor(L);
    menu.innerHTML = `<div class="h"><span class="code" style="background:${FAM[L.code] || '#1D1F1E'}">${L.code}</span>${KIND[L.type] || ''} · ${L.nom}<small>État : <span class="st">${L.etat}</span>${L.largeur ? ' · largeur ' + L.largeur + ' m' : ''}</small></div>
      <div class="acts">${acts.map((a, i) => `<button data-i="${i}" class="${i ? '' : 'main'}">${a[0]}</button>`).join('')}</div>
      <div class="f">${L.effet || ''}<br>${L.e ? 'Position estimée : ' : 'Source : '}${L.source || ''}</div>`;
    menu.style.display = 'block'; menu.style.left = Math.min(x + 12, innerWidth - 340) + 'px'; menu.style.top = Math.min(y + 12, innerHeight - menu.offsetHeight - 10) + 'px';
    menu.onclick = e => { const b = e.target.closest('button'); if (!b) return; const [, st, act] = acts[+b.dataset.i];
      if (act === 'deplacer') { moving = L; menu.style.display = 'none'; tip.textContent = 'Cliquez où poser « ' + L.nom + ' »'; return; }
      menu.style.display = 'none'; apply(L, st, act); };
  }
  function apply(L, st, act) {
    if (host() === 'chatelet') { // la simulation du Forum décide de l'effet
      if (typeof window.levAction === 'function') window.levAction(L.id, act);
      else if (['fermer', 'ouvrir', 'arreter'].includes(act) && typeof toggleLever === 'function') toggleLever(L.id);
      return;
    }
    if (st) L.etat = st; buildPins(); window.dispatchEvent(new CustomEvent('levier', {detail: {levier: L, action: act}}));
  }
  window.leverAction = (id, act) => { const L = (host() === 'chatelet' ? LEV : (SCN.leviers || [])).find(l => l.id === id); if (!L) return null; const a = actionsFor(L).find(a => a[2] === act); if (!a) return null; apply(L, a[1], act); return L.etat; };
  const ray = new THREE.Raycaster(), ms = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const at = e => { const r = rnd.domElement.getBoundingClientRect(); ms.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ms, cam); };
  const hitPin = () => {
    const grp = host() === 'chatelet' ? levGrp : G.rgLeviers;
    const h = ray.intersectObjects(grp.children, true).find(h => h.object.isSprite && (h.object.userData.lever || h.object.userData.lev));
    return h && (h.object.userData.lever || h.object.userData.lev);
  };
  let down = null;
  rnd.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  rnd.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return; at(e);
    if (moving) { const p = new THREE.Vector3(); if (ray.ray.intersectPlane(ground, p)) { const dx = p.x - moving.x, dz = p.z - moving.z; moving.x = p.x; moving.z = p.z;
      if (moving.poly) moving.poly = moving.poly.map((v, i) => v + (i % 2 ? dz : dx)); buildPins(); window.dispatchEvent(new CustomEvent('levier', {detail: {levier: moving, action: 'deplacer'}})); } moving = null; tip.style.display = 'none'; return; }
    const L = hitPin(); if (L) openMenu(L, e.clientX, e.clientY); else menu.style.display = 'none';
  });
  rnd.domElement.addEventListener('pointermove', e => {
    if (moving) { tip.style.display = 'block'; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; return; }
    at(e); const L = hitPin(); rnd.domElement.style.cursor = L ? 'pointer' : '';
    if (L) { tip.textContent = `${L.code} · ${L.nom} · ${L.etat}`; tip.style.display = 'block'; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; } else tip.style.display = 'none';
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { menu.style.display = 'none'; moving = null; tip.style.display = 'none'; } });

  // ---------- Branchement : après chaque rebuild() de la page ----------
  const base = rebuild;
  rebuild = function () { base(); buildPins(); applyLayers(); };
  window.regieRefresh = () => { buildPins(); applyLayers(); };
  // Sur la vue du Forum : le panneau des plans du directeur, classés par l'explorateur (src/explorateur/)
  // (levGrp n'existe qu'une fois les leviers construits : on attend jusqu'à 20 s)
  (function plans(n) { if (host() === 'chatelet') { const s = document.createElement('script'); s.type = 'module'; s.src = '../commun/plans-ui.js'; document.body.appendChild(s); const m = document.createElement('script'); m.src = '../commun/murs-cameras.js'; document.body.appendChild(m); const d = document.createElement('script'); d.src = '../commun/decisions-ui.js'; document.body.appendChild(d); const c = document.createElement('script'); c.src = '../commun/regie-strips.js'; document.body.appendChild(c); } else if (n < 100 && typeof LEV !== 'undefined') setTimeout(() => plans(n + 1), 200); })(0);
})();
