// Écran de démo du juré (style « Matrix » : fil de fer vert sur noir). Script classique, sans dépendance, sans réseau externe.
// Tourne sous `npm run dev` (http://localhost:5173/src/app/ui/index.html) ou servi en statique (voir README.md).
// Événements émis sur window : `contrainte` (detail = Contrainte de src/scene/contrainte.ts) et `perturbation` (F1, sans géométrie).
// Repère : mètres, x vers l'est, z vers le sud (= y des contraintes), niveau 0 à -5.
(() => {
  'use strict';

  /** @typedef {{id:string,type:string,niveau:number,x:number,y:number,largeur_m:number,etat:'ouverte'|'fermee'|'bloquee'}} Contrainte */
  const TYPES = ['porte', 'sortie', 'bouche_metro', 'escalier', 'escalator', 'ascenseur', 'barrage'];
  const ETATS = ['ouverte', 'fermee', 'bloquee'];
  // Même règles que validerContrainte() de src/scene/contrainte.ts (recopiées : ce script ne peut pas importer de TypeScript).
  function valider(c) {
    const p = [];
    if (!c || typeof c.id !== 'string' || !c.id) p.push('id manquant');
    if (!TYPES.includes(c.type)) p.push('type inconnu');
    if (!Number.isInteger(c.niveau)) p.push('niveau entier');
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) p.push('x/y invalide');
    if (!(c.largeur_m > 0)) p.push('largeur_m > 0');
    if (!ETATS.includes(c.etat)) p.push('etat inconnu');
    return p;
  }

  // Menu des perturbations (codes de reports/catalogue-contraintes.md, décision #13).
  const MENU = [
    { code: 'SORTIE', nom: 'Ouvrir / fermer une sortie', aide: 'Clic sur une sortie (triangle) pour la fermer ou la rouvrir.' },
    { code: 'C1', nom: 'C1 Bouche de métro fermée', aide: 'Clic près d\'une bouche de métro / RER.' },
    { code: 'B1', nom: 'B1 Issue bloquée', aide: 'Clic près d\'une porte ou d\'une sortie.' },
    { code: 'B3', nom: 'B3 Escalator arrêté', aide: 'Clic près d\'un escalator (isoler un niveau aide).' },
    { code: 'B5', nom: 'B5 Ascenseur en panne', aide: 'Clic près d\'un ascenseur.' },
    { code: 'D1', nom: 'D1 Manifestation (zone)', aide: 'Clic : pose une zone à éviter de 60 m.' },
    { code: 'D2', nom: 'D2 Troubles (zone)', aide: 'Clic : pose une zone à éviter de 25 m.' },
    { code: 'D5', nom: 'D5 Colis suspect', aide: 'Clic : périmètre fermé de 50 m.' },
    { code: 'F1', nom: 'F1 Annonce tardive', aide: 'Régler le retard avec le curseur.' },
  ];

  const $ = (id) => document.getElementById(id);
  const cv = $('cv');
  const ctx = cv.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const t0 = performance.now();

  const etat = {
    scene: null,
    res: null,
    mode: 'SORTIE',
    niveau: null, // null = tous
    yaw: 0.6, pitch: 0.95, zoom: 1.5, cx: 0, cz: 0,
    auto: false,
    cursor: 0, // index de la trame de résultats
    lecture: false,
    lance: false,
    etats: new Map(), // id d'élément ou de contrainte → { c: Contrainte }
    pile: [],
    libres: [], // contraintes posées hors élément (zones)
    alertesVues: new Set(),
    nLibre: 0,
    couches: null,
  };
  const bus = (window.refugeUI = { contraintes: [], etat, proj: (...a) => proj(...a) });

  // ---------- Alertes ----------
  const fil = $('fil');
  function alerte(texte, niveau = 'info', tag = '') {
    const d = document.createElement('div');
    d.className = niveau;
    d.textContent = `${horloge()} ${tag ? '[' + tag + '] ' : ''}${texte}`;
    fil.prepend(d);
    while (fil.children.length > 60) fil.lastChild.remove();
  }
  function horloge() {
    const s = Math.floor((performance.now() - t0) / 1000);
    return `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  setInterval(() => { $('clk').textContent = horloge(); }, 1000);

  // ---------- Émission ----------
  function emettre(c, libelle) {
    const pb = valider(c);
    if (pb.length) { alerte(`contrainte invalide : ${pb.join(', ')}`, 'critique'); return; }
    bus.contraintes.push({ ...c });
    window.dispatchEvent(new CustomEvent('contrainte', { detail: { ...c } }));
    alerte(`${libelle} (${c.etat}, niveau ${c.niveau})`, c.etat === 'ouverte' ? 'info' : 'alerte', 'CONTRAINTE');
  }
  function poser(item, type, etatVoulu, libelle, bascule = true) {
    const prec = etat.etats.get(item.id);
    const nouvel = bascule && prec && prec.etat !== 'ouverte' ? 'ouverte' : etatVoulu;
    const c = { id: item.id, type, niveau: item.niveau, x: round(item.x), y: round(item.z ?? item.y), largeur_m: item.largeur_m || 1, etat: nouvel };
    etat.etats.set(item.id, c);
    if (item.ref) etat.etats.set(item.ref, c);
    if (item.liens) for (const l of item.liens) etat.etats.set(l, c);
    etat.pile.push({ id: item.id, prec: prec || null, ref: item.ref, liens: item.liens });
    emettre(c, libelle);
  }
  const round = (v) => Math.round(v * 10) / 10;
  const etatDe = (it) => etat.etats.get(it.id) || (it.ref && etat.etats.get(it.ref)) || null;

  // ---------- Chargement ----------
  async function charger(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
    return r.json();
  }
  async function init() {
    construireMenu();
    try {
      installerScene(await charger(params.get('scene') || '../../scene/scene.json'));
    } catch (e) {
      $('bScene').textContent = 'SCÈNE : ABSENTE';
      $('fichiers').classList.add('vue');
      alerte(`scène non chargée (${e.message}). Servir en HTTP ou choisir le fichier à gauche.`, 'critique');
    }
    try {
      installerRes(await charger(params.get('resultats') || './resultats.exemple.json'));
    } catch (e) {
      $('bRes').textContent = 'RÉSULTATS : ABSENTS';
      $('fichiers').classList.add('vue');
      alerte(`résultats non chargés (${e.message})`, 'alerte');
    }
    boucle();
  }
  function lireFichier(input, cb) {
    input.addEventListener('change', () => {
      const f = input.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { try { cb(JSON.parse(String(fr.result))); } catch (e) { alerte(`JSON illisible : ${e.message}`, 'critique'); } };
      fr.readAsText(f);
    });
  }
  lireFichier($('fScene'), installerScene);
  lireFichier($('fRes'), installerRes);

  function installerScene(s) {
    etat.scene = s;
    const R = 420;
    const proche = (p) => Math.hypot(p[0], p[1]) < R;
    const L = { bat: [], rues: [], int: [], ch: [] };
    for (const b of s.batiments) { const p = b.p; if (proche([p[0], p[1]])) L.bat.push(b); }
    for (const r of s.rues) if (proche([r.p[0], r.p[1]])) L.rues.push(r);
    L.int = s.interieur;
    L.ch = s.chemins;
    etat.couches = L;
    const alt = {};
    for (const n of s.niveaux) alt[n.niveau] = n.altitude_m;
    etat.alt = alt;
    // éléments cliquables, ramenés à { id, niveau, x, z, largeur_m, ... }
    etat.sorties = s.sorties.map((o) => ({ id: o.id, ref: o.ref, niveau: o.niveau, x: o.x, z: o.z, largeur_m: o.largeur_m, genre: o.genre, liens: [] }));
    etat.metro = s.metro.map((m) => ({ id: m.id, niveau: m.l[0] ?? -1, x: m.x, z: m.z, largeur_m: m.largeur_m }));
    etat.portes = s.portes.map((p) => ({ id: p.id, niveau: p.l[0] ?? 0, x: p.x, z: p.z, largeur_m: p.largeur_m }));
    const lien = (a) => ({ id: a.id, niveau: a.de.niveau, niveau2: a.vers.niveau, x: (a.de.x + a.vers.x) / 2, z: (a.de.z + a.vers.z) / 2, largeur_m: a.largeur_m, p: a.p, de: a.de, vers: a.vers });
    etat.escalators = s.escalators.map(lien);
    etat.ascenseurs = s.ascenseurs.map((a) => ({ id: a.id, niveau: a.l[0], x: a.x ?? a.de.x, z: a.z ?? a.de.z, largeur_m: a.largeur_m, niveau2: a.l[a.l.length - 1] }));
    etat.escaliers = s.escaliers.map(lien);
    const niveaux = [null, ...s.niveaux.map((n) => n.niveau)];
    const box = $('niveaux');
    box.innerHTML = '';
    for (const n of niveaux) {
      const b = document.createElement('button');
      b.textContent = n === null ? 'TOUS' : String(n);
      b.dataset.niveau = n === null ? 'tous' : n;
      b.onclick = () => { etat.niveau = n; if (n !== null) etat.pitch = 1.35; majNiveaux(); };
      box.appendChild(b);
    }
    majNiveaux();
    $('bScene').textContent = `SCÈNE : ${s.sorties.length} SORTIES / ${s.metro.length} BOUCHES`;
    $('bScene').classList.add('ok');
    $('hudA').dataset.etape = '2'; // étape 2 du script : la donnée est arrivée
    alerte(`scène chargée (${s.niveaux.length} niveaux, ${s.batiments.length} bâtiments)`, 'info', 'DONNÉE');
  }
  function majNiveaux() {
    for (const b of $('niveaux').children) b.classList.toggle('on', (etat.niveau === null ? 'tous' : String(etat.niveau)) === b.dataset.niveau);
  }

  /*
   * Format du fichier de résultats (voir README.md) :
   * { source: "exemple"|"simulation", rejeu: bool, titre, duree_s,
   *   metriques: [{ cle, libelle, unite, avant, apres, sens: "bas_mieux"|"haut_mieux" }],
   *   serie: [{ t_s, tension: 0..1, points: [[x, z, niveau], ...] }],
   *   alertes: [{ t_s, niveau: "info"|"alerte"|"critique", texte }] }
   */
  function installerRes(r) {
    etat.res = r;
    etat.cursor = 0;
    const exemple = r.source === 'exemple';
    $('bRes').textContent = `RÉSULTATS : ${String(r.source || '?').toUpperCase()}${r.rejeu ? ' / REJEU' : ''}`;
    $('bRes').classList.toggle('ok', !exemple);
    $('rejeu').style.display = r.rejeu ? '' : 'none';
    const tt = $('tt');
    tt.max = String(Math.max(0, (r.serie || []).length - 1));
    tt.value = '0';
    rendreAvantApres();
    majTemps();
    alerte(`résultats chargés : ${r.titre || 'sans titre'} (${exemple ? 'EXEMPLE, valeurs illustratives' : 'source ' + r.source})`, exemple ? 'alerte' : 'info', 'RÉSULTATS');
  }
  function rendreAvantApres() {
    const r = etat.res;
    const box = $('aa');
    if (!r || !r.metriques || !r.metriques.length) { box.textContent = 'Aucun résultat chargé.'; return; }
    const src = r.source === 'exemple' ? 'EXEMPLE : valeurs illustratives, à ne pas citer' : `Source : ${r.source}`;
    const rows = r.metriques.map((m) => {
      const a = m.avant, b = m.apres;
      let d = '—', cls = '';
      if (typeof a === 'number' && typeof b === 'number') {
        const dv = b - a;
        d = (dv > 0 ? '+' : '') + (Math.round(dv * 10) / 10);
        const mieux = m.sens === 'haut_mieux' ? dv > 0 : dv < 0;
        cls = dv === 0 ? '' : mieux ? 'mieux' : 'pire';
      }
      const f = (v) => (v === null || v === undefined ? '—' : v + (m.unite ? ' ' + m.unite : ''));
      return `<tr><td>${esc(m.libelle)}</td><td>${esc(f(a))}</td><td>${esc(f(b))}</td><td class="${cls}">${esc(d)}</td></tr>`;
    }).join('');
    box.className = '';
    box.innerHTML = `<table><tr><th></th><th>Avant</th><th>Après</th><th>Δ</th></tr>${rows}</table><div class="note">${esc(src)}</div>`;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Temps, tension, lecture ----------
  function trame() { return etat.res && etat.res.serie ? etat.res.serie[etat.cursor] : null; }
  function majTemps() {
    const f = trame();
    $('tt').value = String(etat.cursor);
    $('ttv').textContent = f ? `t = ${f.t_s} s` : 't = —';
    const g = $('tension');
    if (!g.children.length) for (let i = 0; i < 20; i++) g.appendChild(document.createElement('i'));
    const v = f && typeof f.tension === 'number' ? f.tension : null;
    const n = v === null ? 0 : Math.round(v * 20);
    [...g.children].forEach((c, i) => {
      c.classList.toggle('on', i < n);
      c.style.background = i < n ? (i < 10 ? '#39ff88' : i < 15 ? '#ffb000' : '#ff4d4d') : '';
    });
    g.setAttribute('aria-valuenow', v === null ? '' : String(v));
    $('tensionv').textContent = v === null ? '— (aucune tension fournie)' : `${Math.round(v * 100)} / 100`;
    if (etat.res && etat.res.alertes && etat.lance) {
      for (const [i, a] of etat.res.alertes.entries()) {
        if (f && a.t_s <= f.t_s && !etat.alertesVues.has(i)) { etat.alertesVues.add(i); alerte(a.texte, a.niveau || 'info', `REJEU t=${a.t_s}s`); }
      }
    }
  }
  $('tt').addEventListener('input', () => { etat.cursor = Number($('tt').value); majTemps(); });
  function lancer() {
    if (!etat.res) { alerte('aucun résultat à rejouer', 'alerte'); return; }
    etat.lance = true;
    etat.alertesVues.clear();
    etat.cursor = 0;
    fil.dataset.etape = '3'; // étape 3 : l'agent a travaillé
    $('avantapres').dataset.etape = '5'; // étape 5 : résultat avec source
    alerte('rejeu lancé', 'info', 'AGENT');
    etat.lecture = true;
    majTemps();
    majLecture();
  }
  function majLecture() { $('bPlay').textContent = etat.lecture ? '|| PAUSE' : '> LECTURE'; }
  $('bPlay').onclick = () => { if (!etat.lance) lancer(); else { etat.lecture = !etat.lecture; majLecture(); } };
  document.querySelector('[data-action="lancer"]').onclick = lancer;
  document.querySelector('[data-action="envoyer"]').onclick = () => {
    const i = $('jury');
    const t = i.value.trim();
    if (!t) return;
    $('consigne').dataset.etape = '4'; // étape 4 : le jury agit
    $('consigne').textContent = `Consigne reçue : « ${t} »`;
    alerte(`consigne du juré : ${t}`, 'alerte', 'JURÉ');
    window.dispatchEvent(new CustomEvent('consigne', { detail: { texte: t } }));
    i.value = '';
  };
  $('jury').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.querySelector('[data-action="envoyer"]').click(); });
  let dernier = 0;
  function avancer(now) {
    if (etat.lecture && etat.res && etat.res.serie && now - dernier > 450) {
      dernier = now;
      if (etat.cursor < etat.res.serie.length - 1) { etat.cursor++; majTemps(); } else { etat.lecture = false; majLecture(); }
    }
  }

  // ---------- Menu ----------
  function construireMenu() {
    const m = $('menu');
    for (const o of MENU) {
      const b = document.createElement('button');
      b.textContent = o.nom;
      b.dataset.code = o.code;
      b.onclick = () => { etat.mode = o.code; $('aide').textContent = `Mode : ${o.aide}`; $('f1box').style.display = o.code === 'F1' ? '' : 'none'; majMenu(); if (o.code === 'F1') appliquerF1(); };
      m.appendChild(b);
    }
    majMenu();
  }
  function majMenu() { for (const b of $('menu').children) b.classList.toggle('on', b.dataset.code === etat.mode); }
  function appliquerF1() {
    const min = Number($('f1').value);
    $('f1v').textContent = String(min);
    window.dispatchEvent(new CustomEvent('perturbation', { detail: { code: 'F1', retard_min: min } }));
    alerte(`annonce retardée de ${min} min`, min > 0 ? 'alerte' : 'info', 'F1');
    etat.f1 = min;
  }
  $('f1').addEventListener('input', () => { $('f1v').textContent = $('f1').value; });
  $('f1').addEventListener('change', appliquerF1);
  $('bUndo').onclick = () => {
    const d = etat.pile.pop();
    if (!d) return;
    const cur = etat.etats.get(d.id);
    const retour = { ...(d.prec || cur), etat: 'ouverte' };
    if (d.prec) etat.etats.set(d.id, d.prec); else { etat.etats.delete(d.id); if (d.ref) etat.etats.delete(d.ref); }
    etat.libres = etat.libres.filter((c) => c.id !== d.id);
    emettre(retour, `annulation de ${d.id}`);
  };
  $('bRaz').onclick = () => {
    for (const c of new Set(etat.etats.values())) if (c.etat !== 'ouverte') emettre({ ...c, etat: 'ouverte' }, `réinitialisation de ${c.id}`);
    etat.etats.clear(); etat.libres = []; etat.pile = [];
  };

  // ---------- Caméra ----------
  const altDe = (n) => (etat.alt ? (etat.alt[n] ?? n * 6) : n * 6) * 1.4;
  function proj(x, z, n) {
    const cy = Math.cos(etat.yaw), sy = Math.sin(etat.yaw);
    const xr = (x - etat.cx) * cy + (z - etat.cz) * sy;
    const zr = -(x - etat.cx) * sy + (z - etat.cz) * cy;
    const a = etat.niveau === null ? altDe(n) : 0;
    return [W / 2 + xr * etat.zoom, H / 2 + (zr * Math.sin(etat.pitch) - a * Math.cos(etat.pitch)) * etat.zoom];
  }
  // inverse sur le plan d'un niveau (la projection y est affine)
  function deproj(px, py, n) {
    const o = proj(0, 0, n), ax = proj(1, 0, n), az = proj(0, 1, n);
    const m11 = ax[0] - o[0], m12 = az[0] - o[0], m21 = ax[1] - o[1], m22 = az[1] - o[1];
    const det = m11 * m22 - m12 * m21 || 1e-9;
    const dx = px - o[0], dy = py - o[1];
    return [(dx * m22 - dy * m12) / det, (m11 * dy - m21 * dx) / det];
  }
  let W = 800, H = 600;
  function redim() {
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    cv.width = Math.max(1, Math.round(W * d)); cv.height = Math.max(1, Math.round(H * d));
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  window.addEventListener('resize', redim);

  // ---------- Dessin ----------
  const VERT = '57,255,136';
  function poly(p, n, ferme) {
    ctx.beginPath();
    for (let i = 0; i < p.length; i += 2) { const [x, y] = proj(p[i], p[i + 1], n); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    if (ferme) ctx.closePath();
    ctx.stroke();
  }
  const visible = (n) => etat.niveau === null || etat.niveau === n;
  function dessiner(now) {
    ctx.clearRect(0, 0, W, H);
    const s = etat.scene;
    if (!s) { ctx.fillStyle = `rgb(${VERT})`; ctx.fillText('en attente de scene.json…', 20, 30); return; }
    const L = etat.couches;
    const sel = etat.niveau;
    // grille de repère
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = `rgba(${VERT},0.10)`;
    for (const r of L.rues) poly(r.p, sel === null ? 0 : sel, false);
    ctx.strokeStyle = `rgba(${VERT},${sel === null || sel === 0 ? 0.35 : 0.12})`;
    for (const b of L.bat) poly(b.p, sel === null ? 0 : sel, true);
    // niveaux
    const niv = s.niveaux.map((n) => n.niveau);
    for (const n of niv) {
      if (!visible(n)) continue;
      const clair = sel === n ? 0.95 : 0.55;
      ctx.lineWidth = sel === n ? 1 : 0.7;
      ctx.strokeStyle = `rgba(${VERT},${clair * 0.7})`;
      for (const o of L.int) if (o.l.includes(n)) poly(o.p, n, true);
      ctx.strokeStyle = `rgba(${VERT},${clair})`;
      for (const c of L.ch) if (c.l.includes(n)) poly(c.p, n, false);
    }
    // liens verticaux
    ctx.lineWidth = 1;
    const liens = (arr, couleur) => {
      ctx.strokeStyle = couleur;
      for (const a of arr) {
        const e = etatDe(a);
        const hors = e && e.etat !== 'ouverte';
        if (sel !== null && a.de.niveau !== sel && a.vers.niveau !== sel) continue;
        ctx.strokeStyle = hors ? '#ffb000' : couleur;
        ctx.beginPath();
        const [x1, y1] = proj(a.de.x, a.de.z, a.de.niveau), [x2, y2] = proj(a.vers.x, a.vers.z, a.vers.niveau);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (hors) croix(x1, y1, 5, '#ffb000');
      }
    };
    liens(etat.escalators, `rgba(${VERT},0.9)`);
    liens(etat.escaliers, `rgba(${VERT},0.45)`);
    for (const a of etat.ascenseurs) {
      if (sel !== null && a.niveau !== sel && a.niveau2 !== sel) continue;
      const [x, y] = proj(a.x, a.z, sel === null ? a.niveau : sel), e = etatDe(a);
      ctx.strokeStyle = e && e.etat !== 'ouverte' ? '#ffb000' : `rgb(${VERT})`;
      ctx.strokeRect(x - 4, y - 4, 8, 8);
      if (e && e.etat !== 'ouverte') croix(x, y, 6, '#ffb000');
    }
    if (sel !== null && sel !== undefined) {
      ctx.fillStyle = `rgba(${VERT},0.35)`;
      for (const p of etat.portes) if (p.niveau === sel) { const [x, y] = proj(p.x, p.z, sel); ctx.fillRect(x - 1, y - 1, 2, 2); }
    }
    for (const m of etat.metro) {
      if (!visible(m.niveau)) continue;
      const [x, y] = proj(m.x, m.z, m.niveau), e = etatDe(m);
      ctx.strokeStyle = e && e.etat !== 'ouverte' ? '#ff4d4d' : `rgba(${VERT},0.8)`;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.font = '9px monospace'; ctx.fillText('M', x - 3, y + 3);
      if (e && e.etat !== 'ouverte') croix(x, y, 8, '#ff4d4d');
    }
    for (const o of etat.sorties) {
      if (o.genre === 'metro') continue; // déjà tracées via la bouche
      if (!visible(o.niveau)) continue;
      const [x, y] = proj(o.x, o.z, o.niveau), e = etatDe(o), ferme = e && e.etat !== 'ouverte';
      ctx.strokeStyle = ferme ? '#ff4d4d' : `rgb(${VERT})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y + 4); ctx.lineTo(x - 6, y + 4); ctx.closePath(); ctx.stroke();
      if (ferme) croix(x, y, 8, '#ff4d4d');
    }
    ctx.lineWidth = 1;
    // zones posées
    for (const c of etat.libres) {
      if (!visible(c.niveau)) continue;
      const [x, y] = proj(c.x, c.y, c.niveau);
      if (c.etat === 'ouverte') continue;
      const r = Math.max(6, (c.largeur_m / 2) * etat.zoom);
      ctx.strokeStyle = 'rgba(255,77,77,.9)'; ctx.fillStyle = 'rgba(255,77,77,.12)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * Math.max(0.25, Math.sin(etat.pitch)), 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff4d4d'; ctx.font = '10px monospace'; ctx.fillText(c.id.split('-')[0], x - 6, y + 3);
    }
    // personnes (points qui clignotent)
    const f = trame();
    let nbPts = 0;
    if (f && f.points) {
      const t = now / 1000;
      for (let i = 0; i < f.points.length; i++) {
        const [px, pz, pn] = f.points[i];
        if (!visible(pn)) continue;
        nbPts++;
        const [x, y] = proj(px, pz, pn);
        const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 3.1 + i * 1.73));
        ctx.fillStyle = `rgba(${VERT},${a})`;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
      }
    }
    // HUD à chasse fixe
    const pad = (v, n) => String(v).padEnd(n);
    const nbc = [...new Set(etat.etats.values())].filter((c) => c.etat !== 'ouverte').length;
    $('hudA').textContent = [
      `NIVEAU   ${pad(sel === null ? 'TOUS' : sel, 6)} VUE   ${pad(etat.pitch > 1.3 ? 'DESSUS' : 'ISO', 6)}`,
      `CONTR.   ${pad(nbc, 6)} F1    ${pad((etat.f1 || 0) + ' min', 6)}`,
      `POINTS   ${pad(nbPts, 6)} T     ${pad(f ? f.t_s + ' s' : '—', 6)}`,
      etat.res ? `DONNÉE   ${String(etat.res.source || '?').toUpperCase()}${etat.res.rejeu ? ' (REJEU)' : ''}` : 'DONNÉE   —',
    ].join('\n');
    $('hudB').textContent = `MODE ${etat.mode}  |  glisser : tourner  molette : zoom  maj+glisser : déplacer`;
  }
  function croix(x, y, r, c) {
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    ctx.lineWidth = 1;
  }
  function boucle(now = 0) {
    if (etat.auto) etat.yaw += 0.003;
    avancer(now);
    dessiner(now);
    requestAnimationFrame(boucle);
  }

  // ---------- Interaction ----------
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, bouge: false, deplace: e.shiftKey || e.button === 2 }; });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.bouge = true;
    if (!drag.bouge) return;
    if (drag.deplace) {
      const [ax, az] = deproj(W / 2 - dx, H / 2 - dy, etat.niveau ?? 0);
      const [bx, bz] = deproj(W / 2, H / 2, etat.niveau ?? 0);
      etat.cx += ax - bx; etat.cz += az - bz;
    } else { etat.yaw += dx * 0.006; etat.pitch = Math.min(1.5, Math.max(0.25, etat.pitch + dy * 0.004)); }
    drag.x = e.clientX; drag.y = e.clientY;
  });
  cv.addEventListener('pointerup', (e) => {
    const d = drag; drag = null;
    if (d && !d.bouge) cliquer(e.clientX - cv.getBoundingClientRect().left, e.clientY - cv.getBoundingClientRect().top);
  });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => { e.preventDefault(); etat.zoom = Math.min(8, Math.max(0.25, etat.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); }, { passive: false });
  $('bTop').onclick = () => { etat.pitch = 1.5; etat.yaw = 0; };
  $('bIso').onclick = () => { etat.pitch = 0.95; etat.yaw = 0.6; };
  $('bAuto').onclick = () => { etat.auto = !etat.auto; $('bAuto').textContent = `${etat.auto ? '[x]' : '[ ]'} ROTATION`; $('bAuto').classList.toggle('on', etat.auto); };

  function plusProche(liste, px, py, rayon = 22, filtreNiveau = true) {
    let best = null, bd = rayon;
    for (const it of liste) {
      if (filtreNiveau && !visible(it.niveau)) continue;
      const [x, y] = proj(it.x, it.z, it.niveau);
      const d = Math.hypot(x - px, y - py);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }
  function cliquer(px, py) {
    if (!etat.scene) return;
    const m = etat.mode;
    const niv = etat.niveau ?? 0;
    const rien = () => alerte('rien à cet endroit pour ce geste (zoomer ou isoler un niveau)', 'info');
    if (m === 'SORTIE') {
      const o = plusProche(etat.sorties.filter((s) => s.genre !== 'metro'), px, py) || plusProche(etat.metro, px, py);
      if (!o) return rien();
      const metro = o.genre === undefined && !o.ref;
      poser(o, metro ? 'bouche_metro' : 'sortie', 'fermee', `${metro ? 'bouche' : 'sortie'} ${o.id}`);
    } else if (m === 'C1') {
      const o = plusProche(etat.metro, px, py, 30); if (!o) return rien();
      o.liens = etat.sorties.filter((s) => s.ref === o.id).map((s) => s.id);
      poser(o, 'bouche_metro', 'fermee', `C1 bouche de métro ${o.id}`);
    } else if (m === 'B1') {
      const o = plusProche([...etat.sorties.filter((s) => s.genre !== 'metro'), ...etat.portes], px, py, 26); if (!o) return rien();
      poser(o, o.genre ? 'sortie' : 'porte', 'bloquee', `B1 issue ${o.id}`);
    } else if (m === 'B3') {
      const o = plusProche(etat.escalators, px, py, 30, false); if (!o) return rien();
      poser(o, 'escalator', 'fermee', `B3 escalator ${o.id}`);
    } else if (m === 'B5') {
      const o = plusProche(etat.ascenseurs, px, py, 30); if (!o) return rien();
      poser(o, 'ascenseur', 'bloquee', `B5 ascenseur ${o.id}`);
    } else if (m === 'D1' || m === 'D2' || m === 'D5') {
      const [x, z] = deproj(px, py, niv);
      const l = m === 'D1' ? 60 : m === 'D2' ? 25 : 50;
      const id = `${m}-${++etat.nLibre}`;
      const c = { id, type: 'barrage', niveau: niv, x: round(x), y: round(z), largeur_m: l, etat: m === 'D5' ? 'fermee' : 'bloquee' };
      etat.libres.push(c); etat.etats.set(id, c); etat.pile.push({ id, prec: null });
      emettre(c, `${m} ${m === 'D5' ? 'périmètre colis suspect' : 'zone à éviter'} en (${c.x}, ${c.y})`);
    } else if (m === 'F1') {
      alerte('F1 : régler le curseur de retard à gauche', 'info');
    }
  }

  window.addEventListener('load', () => { redim(); init(); });
})();
