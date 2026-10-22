// Vue 3D unique du jumeau (portage de reports/maquettes/chatelet-3d/index.html, style D « Paris », rendu procédural sans texture).
// Les épingles de leviers lisent et commandent `Leviers` (leviers.ts) : cliquer une épingle appelle toggleLever, qui émet `contrainte`
// (la grille Navigation l'applique) puis `levier` (la vue se redessine). Les zones D1/D2 se posent au clic dans la rue.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Scene } from '../types.ts';
import type { Navgrid } from '../navgrid.ts';
import { BusContraintes } from '../contrainte.ts';
import { brancherGrille, construireLeviers, FORUM, Leviers } from '../leviers.ts';
import type { AccesForum, Levier, Zone, TypeLevier } from '../leviers.ts';
import { altitude, camera as presetCamera, epingleSousCurseur, epingleVisible, nomsDeRues, paires, positionEpingle, projeterEcran } from './projection.ts';
import type { NomCamera } from './projection.ts';

const STYLE = { ciel: 0xbcd3e6, sol: 0xd9d4c7, rue: 0xa9aeb3, pieton: 0xe6dfd0, mur: 0xe6dcc4, toit: 0x7f8c97 };
const COULEUR_PIN: Record<TypeLevier, string> = { bouche: '#1d3f8f', porte: '#0b6b45', issue: '#2e7d32', ascenseur: '#5b6b7a' };
const COULEUR_FERME = '#d32f2f';
const GLYPHE: Record<TypeLevier, string> = { bouche: 'M', porte: '⇥', issue: 'IS', ascenseur: '⇅' };
const COULEURS_NIVEAU = [0xd9cdb4, 0xc8d6c9, 0xc9d0e0, 0xe0cfd0, 0xd6d0b8, 0xcbd9d6];
const RAYON_AFFICHE_M = 700;

export interface Entrees { scene: Scene; navgrid: Navgrid; acces: AccesForum[]; hote: HTMLElement }
export interface Vue { leviers: Leviers; bus: BusContraintes; calculerAccessibilite(): string; stats: { batiments: number; rues: number; leviers: number } }

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const proche = (x: number, z: number): boolean => Math.hypot(x - FORUM[0], z - FORUM[1]) < RAYON_AFFICHE_M;

function canvasEpingle(glyphe: string, fond: string, ferme: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.beginPath(); x.arc(64, 58, 48, 0, 7); x.fillStyle = ferme ? COULEUR_FERME : fond; x.fill();
  x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
  x.beginPath(); x.moveTo(52, 104); x.lineTo(76, 104); x.lineTo(64, 124); x.closePath(); x.fillStyle = '#fff'; x.fill();
  x.fillStyle = '#fff'; x.font = '700 48px ui-monospace,Menlo,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ferme ? '✕' : glyphe, 64, 60);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function etiquette(s: string, fond: string, fg: string): { tex: THREE.CanvasTexture; w: number } {
  const c = document.createElement('canvas');
  const x = c.getContext('2d')!;
  x.font = '600 30px ui-monospace,Menlo,monospace';
  const w = Math.ceil(x.measureText(s).width) + 28;
  c.width = w; c.height = 48;
  x.font = '600 30px ui-monospace,Menlo,monospace';
  x.fillStyle = fond; x.beginPath(); x.roundRect(0, 0, w, 48, 10); x.fill();
  x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(s, 14, 25);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, w };
}

function sprite(tex: THREE.Texture, ordre: number): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, sizeAttenuation: false, depthTest: false, transparent: true }));
  s.renderOrder = ordre;
  return s;
}

function rubans(rues: { k: string; w: number; p: number[] }[], filtre: (k: string) => boolean, y: number, couleur: number): THREE.Mesh | null {
  const pos: number[] = [];
  for (const r of rues) {
    if (!filtre(r.k)) continue;
    const pts = paires(r.p), demi = Math.max(1.2, r.w) / 2;
    if (!pts.some(([x, z]) => proche(x, z))) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      const nx = (-dz / L) * demi, nz = (dx / L) * demi;
      pos.push(a[0] + nx, y, a[1] + nz, a[0] - nx, y, a[1] - nz, b[0] + nx, y, b[1] + nz, b[0] + nx, y, b[1] + nz, a[0] - nx, y, a[1] - nz, b[0] - nx, y, b[1] - nz);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: couleur, side: THREE.DoubleSide }));
}

function polygone(p: number[], y: number): THREE.BufferGeometry | null {
  const pts = paires(p);
  if (pts.length < 3) return null;
  let tri: number[][];
  try { tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch { return null; }
  if (!tri.length) return null;
  const pos: number[] = [];
  for (const f of tri) for (const i of f) pos.push(pts[i][0], y, pts[i][1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function demarrer(e: Entrees): Vue {
  const { scene: SC, navgrid, acces, hote } = e;
  // ---- rendu ----
  const rnd = new THREE.WebGLRenderer({ antialias: true });
  rnd.setPixelRatio(Math.min(1.5, devicePixelRatio));
  hote.appendChild(rnd.domElement);
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(STYLE.ciel);
  sc.fog = new THREE.Fog(STYLE.ciel, 900, 2600);
  const cam = new THREE.PerspectiveCamera(42, 1, 1, 6000);
  const ctl = new OrbitControls(cam, rnd.domElement);
  ctl.maxPolarAngle = Math.PI * 0.499;
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8c86, 0.9));
  const soleil = new THREE.DirectionalLight(0xfff1dc, 0.6);
  soleil.position.set(-260, 420, 180);
  sc.add(soleil);
  const redim = (): void => { rnd.setSize(hote.clientWidth, hote.clientHeight); cam.aspect = hote.clientWidth / hote.clientHeight; cam.updateProjectionMatrix(); };
  addEventListener('resize', redim); redim();

  let ecart = 2.2, niveauChoisi: 'all' | number = 'all', xray = true;
  const calque: Record<string, boolean> = { batiments: true, rues: true, interieur: true, liaisons: true, leviers: true, noms: true };
  const G = { sol: new THREE.Group(), batiments: new THREE.Group(), rues: new THREE.Group(), niveaux: new Map<number, THREE.Group>(), liaisons: new THREE.Group(), leviers: new THREE.Group(), zones: new THREE.Group(), noms: new THREE.Group() };
  for (const g of [G.sol, G.batiments, G.rues, G.liaisons, G.leviers, G.zones, G.noms]) sc.add(g);

  // ---- sol et rues ----
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: STYLE.sol, transparent: true }));
  sol.position.y = -0.3; sol.renderOrder = -2;
  G.sol.add(sol);
  const chaussees = rubans(SC.rues, (k) => !['pedestrian', 'footway', 'path', 'steps', 'cycleway'].includes(k), 0.1, STYLE.rue);
  const pietons = rubans(SC.rues, (k) => ['pedestrian', 'footway', 'path', 'cycleway'].includes(k), 0.15, STYLE.pieton);
  for (const m of [chaussees, pietons]) if (m) G.rues.add(m);
  const matRues = [chaussees, pietons].filter((m): m is THREE.Mesh => m !== null).map((m) => m.material as THREE.MeshLambertMaterial);
  for (const m of matRues) m.transparent = true;

  // ---- bâtiments (un seul maillage fusionné, murs + toits en couleurs de sommets) ----
  const geos: THREE.BufferGeometry[] = [];
  const proprietaires: { debut: number; b: number }[] = [];
  let sommets = 0, nb = 0;
  SC.batiments.forEach((b, bi) => {
    const pts = paires(b.p);
    if (pts.length < 3 || !pts.some(([x, z]) => proche(x, z))) return;
    const h = Math.max(3, b.h), pos: number[] = [], col: number[] = [];
    const teinte = 0.94 + ((bi * 37) % 13) / 100, mur = new THREE.Color(STYLE.mur).multiplyScalar(teinte), toit = new THREE.Color(STYLE.toit);
    for (let i = 0; i < pts.length; i++) {
      const [a, c] = [pts[i], pts[(i + 1) % pts.length]];
      pos.push(a[0], 0, a[1], c[0], 0, c[1], c[0], h, c[1], a[0], 0, a[1], c[0], h, c[1], a[0], h, a[1]);
      for (let k = 0; k < 6; k++) col.push(mur.r, mur.g, mur.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const roof = polygone(b.p, h);
    const parts = [g];
    if (roof) {
      const rc: number[] = [];
      for (let k = 0; k < roof.getAttribute('position').count; k++) rc.push(toit.r, toit.g, toit.b);
      roof.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
      parts.push(roof);
    }
    const m = mergeGeometries(parts, false);
    if (!m) return;
    proprietaires.push({ debut: sommets, b: bi });
    sommets += m.getAttribute('position').count;
    geos.push(m); nb++;
  });
  const matBat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true });
  const maillageBat = new THREE.Mesh(mergeGeometries(geos, false)!, matBat);
  G.batiments.add(maillageBat);

  // ---- intérieur du Forum : un groupe par niveau, posé à son altitude ----
  const nivEntier = (l: number[]): number => Math.round((l.length ? Math.min(...l) : 0) - 0.001);
  const groupeNiveau = (n: number): THREE.Group => {
    let g = G.niveaux.get(n);
    if (!g) { g = new THREE.Group(); G.niveaux.set(n, g); sc.add(g); }
    return g;
  };
  const parNiveau = new Map<number, THREE.BufferGeometry[]>();
  const ajouterNiveau = (n: number, g: THREE.BufferGeometry | null): void => { if (g) (parNiveau.get(n) ?? parNiveau.set(n, []).get(n)!).push(g); };
  for (const o of SC.interieur) {
    const n = nivEntier(o.l);
    if (n > 0 || n < -5 || !paires(o.p).some(([x, z]) => proche(x, z))) continue;
    ajouterNiveau(n, polygone(o.p, 0.2 + (o.k === 'room' ? 0.1 : 0)));
  }
  for (const [n, list] of parNiveau) {
    const m = mergeGeometries(list, false);
    if (m) groupeNiveau(n).add(new THREE.Mesh(m, new THREE.MeshLambertMaterial({ color: COULEURS_NIVEAU[-n] ?? 0xcccccc, side: THREE.DoubleSide })));
  }
  for (const c of SC.chemins) {
    const n = nivEntier(c.l);
    if (n > 0 || n < -5) continue;
    const m = rubans([{ k: 'x', w: c.w, p: c.p }], () => true, 0.35, COULEURS_NIVEAU[-n] ?? 0xcccccc);
    if (m) groupeNiveau(n).add(m);
  }

  // ---- liaisons verticales ----
  const matLiaison = { escalator: 0xd9822b, escalier: 0x6d7075, ascenseur: 0x3a3d42 };
  function dessinerLiaisons(): void {
    G.liaisons.clear();
    for (const l of [...SC.escalators, ...SC.escaliers, ...SC.ascenseurs]) {
      const a = new THREE.Vector3(l.de.x, altitude(l.de.niveau, ecart) + 0.7, l.de.z), b = new THREE.Vector3(l.vers.x, altitude(l.vers.niveau, ecart) + 0.7, l.vers.z);
      const seg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: matLiaison[l.type] }));
      seg.userData = { niveaux: [l.de.niveau, l.vers.niveau] };
      G.liaisons.add(seg);
    }
  }

  // ---- leviers : état, grille et bus ----
  const bus = new BusContraintes();
  const nav = brancherGrille(navgrid, bus);
  const leviers = new Leviers(construireLeviers(SC, acces, navgrid), bus, window);
  const matPin = new Map<string, THREE.SpriteMaterial>();
  const pinMat = (t: TypeLevier, ferme: boolean): THREE.SpriteMaterial => {
    const k = t + ferme;
    if (!matPin.has(k)) matPin.set(k, new THREE.SpriteMaterial({ map: canvasEpingle(GLYPHE[t], COULEUR_PIN[t], ferme), sizeAttenuation: false, depthTest: false, transparent: true }));
    return matPin.get(k)!;
  };
  const pins = new Map<string, { s: THREE.Sprite; label?: THREE.Sprite }>();
  const tige = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x24303a, depthTest: false, transparent: true, opacity: 0.6 }));
  tige.renderOrder = 19;
  G.leviers.add(tige);
  for (const l of leviers.leviers) {
    const s = new THREE.Sprite(pinMat(l.type, false));
    s.scale.set(0.034, 0.034, 1); s.center.set(0.5, 0); s.renderOrder = 20;
    G.leviers.add(s);
    const p: { s: THREE.Sprite; label?: THREE.Sprite } = { s };
    if (l.type === 'porte' || l.type === 'issue') {
      const t = etiquette(l.nom, l.type === 'porte' ? 'rgba(11,107,69,.92)' : 'rgba(46,125,50,.88)', '#fff');
      const lb = sprite(t.tex, 21);
      const h = l.type === 'porte' ? 0.017 : 0.014;
      lb.scale.set((h * t.w) / 48, h, 1); lb.center.set(0.5, -2.3);
      G.leviers.add(lb); p.label = lb;
    }
    pins.set(l.id, p);
  }

  function rafraichir(): void {
    const tiges: number[] = [];
    for (const l of leviers.leviers) {
      const p = pins.get(l.id)!, pos = positionEpingle(l, ecart);
      const visible = calque.leviers && epingleVisible(l, niveauChoisi);
      p.s.visible = visible; p.s.position.set(pos.x, pos.y, pos.z); p.s.material = pinMat(l.type, l.etat === 'fermé');
      if (p.label) { p.label.visible = visible; p.label.position.copy(p.s.position); }
      if (visible) tiges.push(pos.x, pos.base, pos.z, pos.x, pos.y, pos.z);
    }
    tige.geometry.setAttribute('position', new THREE.Float32BufferAttribute(tiges, 3));
    tige.visible = calque.leviers;
    // zones
    const vues = new Set<string>();
    for (const z of leviers.zones) { vues.add(z.id); if (!zonesVue.has(z.id)) zonesVue.set(z.id, dessinerZone(z)); }
    for (const [id, g] of zonesVue) if (!vues.has(id)) { G.zones.remove(g); zonesVue.delete(id); }
    const fermes = leviers.leviers.filter((l) => l.etat === 'fermé');
    const bouches = leviers.leviers.filter((l) => l.type === 'bouche');
    $('levSum').innerHTML = `Bouches fermées <b>${bouches.filter((l) => l.etat === 'fermé').length}</b>/${bouches.length} · portes fermées <b>${fermes.filter((l) => l.type === 'porte').length}</b> · issues fermées <b>${fermes.filter((l) => l.type === 'issue').length}</b> · zones <b>${leviers.zones.length}</b>`;
    $('journal').textContent = bus.journal.slice(-4).map((c) => `contrainte ${c.id} ${c.type} ${c.etat}`).join('\n') || 'aucune contrainte émise';
  }

  const zonesVue = new Map<string, THREE.Group>();
  function dessinerZone(z: Zone): THREE.Group {
    const g = new THREE.Group(), col = z.code === 'D1' ? 0xe65100 : 0xb71c1c;
    const disque = new THREE.Mesh(new THREE.CircleGeometry(z.r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false }));
    const anneau = new THREE.Mesh(new THREE.RingGeometry(z.r - 1.2, z.r, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false }));
    disque.position.set(z.x, 0.6, z.z); anneau.position.set(z.x, 0.7, z.z);
    const t = etiquette(z.code === 'D1' ? 'Manifestation (D1) ✕' : 'Troubles (D2) ✕', '#' + col.toString(16).padStart(6, '0'), '#fff');
    const s = sprite(t.tex, 21);
    s.scale.set((0.022 * t.w) / 48, 0.022, 1); s.position.set(z.x, 16, z.z); s.center.set(0.5, 0);
    g.add(disque, anneau, s); G.zones.add(g);
    return g;
  }

  // ---- noms de rues ----
  for (const r of nomsDeRues(SC.rues)) {
    const t = etiquette(r.n, 'rgba(20,24,28,.78)', '#fff'), s = sprite(t.tex, 18);
    s.scale.set((0.018 * t.w) / 48, 0.018, 1); s.position.set(r.x, 3, r.z);
    G.noms.add(s);
  }

  // ---- visibilité : niveaux, calques, transparence ----
  function appliquerVisibilite(): void {
    const sous = niveauChoisi !== 'all' && niveauChoisi < 0;
    for (const [n, g] of G.niveaux) { g.visible = calque.interieur && (niveauChoisi === 'all' || n === niveauChoisi); g.position.y = altitude(n, ecart); }
    G.batiments.visible = calque.batiments && !sous;
    matBat.opacity = xray && niveauChoisi === 'all' ? 0.35 : 1;
    G.sol.visible = !sous || true;
    (sol.material as THREE.MeshLambertMaterial).opacity = sous ? 0.15 : xray ? 0.55 : 1;
    G.rues.visible = calque.rues && !sous;
    for (const m of matRues) m.opacity = xray && niveauChoisi === 'all' ? 0.6 : 1;
    G.noms.visible = calque.noms && !sous;
    G.liaisons.visible = calque.liaisons;
    for (const o of G.liaisons.children) { const n = o.userData.niveaux as number[]; o.visible = niveauChoisi === 'all' || n.includes(niveauChoisi); }
    rafraichir();
  }

  // ---- caméra ----
  let vol: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; k: number } | null = null;
  const aller = (p: number[], t: number[]): void => { vol = { p0: cam.position.clone(), t0: ctl.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; };
  const allerCam = (nom: NomCamera): void => { const c = presetCamera(nom); aller(c.position, c.cible); };
  { const c = presetCamera('orbit'); cam.position.set(...c.position); ctl.target.set(...c.cible); ctl.update(); }

  // ---- panneau ----
  const info = $('info');
  const ligne = (k: string, v: string): string => `<div><span class="k">${k}</span> ${v}</div>`;
  function fiche(l: Levier): void {
    info.innerHTML = ligne('code', l.code) + ligne('type', l.type) + ligne('nom', `<b>${l.nom}</b>`) + ligne('niveau', String(l.niveau)) + ligne('état', l.etat)
      + ligne('effet', l.effet) + ligne('estimé', l.estime ? 'oui (valeur posée par nous)' : 'non') + (l.sur_grille === false ? ligne('grille', 'hors grille : fermer ce levier n’agit pas sur la grille') : '')
      + `<div class="k" style="margin-top:6px">source : ${l.source}</div><div class="k">Cliquez à nouveau pour ${l.etat === 'ouvert' ? 'fermer' : 'rouvrir'}.</div>`;
  }
  let pose: 'D1' | 'D2' | null = null;
  const indice = $('lvHint');
  const armer = (c: 'D1' | 'D2'): void => { pose = c; indice.textContent = `Cliquez dans la rue pour poser ${c === 'D1' ? 'la manifestation' : 'les troubles'}.`; rnd.domElement.style.cursor = 'crosshair'; };
  $('lvC1').onclick = () => leviers.fermerBouches(true);
  $('lvOpen').onclick = () => leviers.toutRouvrir();
  $('lvD1').onclick = () => armer('D1');
  $('lvD2').onclick = () => armer('D2');
  $('accessBtn').onclick = () => { $('accessOut').textContent = calculerAccessibilite(); };
  function calculerAccessibilite(): string {
    const dep = navgrid.sorties.find((s) => s.genre === 'rue')!;
    const r = nav.accessibles(dep.niveau, dep.x, dep.y);
    return `${r.sorties_atteintes.length} sorties atteintes, ${r.sorties_coupees.length} coupées, ${r.cellules_visitees} cellules`;
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-c]')) b.onclick = () => { allerCam(b.dataset.c as NomCamera); for (const o of document.querySelectorAll('[data-c]')) o.classList.toggle('on', o === b); };
  $<HTMLSelectElement>('lvl').onchange = (ev) => { const v = (ev.target as HTMLSelectElement).value; niveauChoisi = v === 'all' ? 'all' : +v; appliquerVisibilite(); };
  $<HTMLInputElement>('spread').oninput = (ev) => { ecart = +(ev.target as HTMLInputElement).value; dessinerLiaisons(); appliquerVisibilite(); };
  $<HTMLInputElement>('xray').onchange = (ev) => { xray = (ev.target as HTMLInputElement).checked; appliquerVisibilite(); };
  for (const cb of document.querySelectorAll<HTMLInputElement>('[data-l]')) cb.onchange = () => { calque[cb.dataset.l!] = cb.checked; appliquerVisibilite(); };
  const spots: [string, number[], number[]][] = [['Forum', [FORUM[0] + 170, 150, FORUM[1] + 200], [FORUM[0], -20, FORUM[1]]]];
  for (const n of ['Porte Berger', 'Porte Rambuteau', 'Porte Lescot', 'Porte du Pont Neuf']) {
    const l = leviers.leviers.find((q) => q.nom === n);
    if (l) spots.push([n.replace('Porte ', ''), [l.x + 70, 60, l.z + 90], [l.x, 0, l.z]]);
  }
  for (const [n, p, t] of spots) { const b = document.createElement('button'); b.textContent = n; b.onclick = () => aller(p, t); $('lvGo').appendChild(b); }

  // ---- clic : épingle (logique de projection.ts), zone, bâtiment ----
  const ray = new THREE.Raycaster(), ms = new THREE.Vector2();
  let bas: [number, number] | null = null;
  rnd.domElement.addEventListener('pointerdown', (ev) => { bas = [ev.clientX, ev.clientY]; });
  rnd.domElement.addEventListener('pointerup', (ev) => {
    if (!bas || Math.hypot(ev.clientX - bas[0], ev.clientY - bas[1]) > 4) return;
    const r = rnd.domElement.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    ms.set((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1);
    ray.setFromCamera(ms, cam);
    const sol0 = new THREE.Vector3();
    const surSol = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), sol0) !== null;
    if (pose) {
      if (surSol) leviers.ajouterZone(pose, sol0.x, sol0.z);
      pose = null; rnd.domElement.style.cursor = ''; indice.textContent = 'Cliquez une épingle pour ouvrir ou fermer.';
      return;
    }
    const vp = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).elements;
    const cand = leviers.leviers.filter((l) => pins.get(l.id)!.s.visible).map((l) => ({ id: l.id, ecran: projeterEcran(vp, positionEpingle(l, ecart), r.width, r.height) }));
    const id = epingleSousCurseur(cand, px, py);
    if (id) { const l = leviers.toggleLever(id)!; fiche(l); return; }
    const z = surSol ? leviers.zones.find((q) => Math.hypot(sol0.x - q.x, sol0.z - q.z) < q.r) : undefined;
    if (z) { leviers.retirerZone(z.id); info.innerHTML = '<span class="k">Zone retirée.</span>'; return; }
    const h = ray.intersectObject(maillageBat, false)[0];
    if (h && G.batiments.visible && h.faceIndex != null) {
      const v = h.faceIndex * 3;
      let o = proprietaires[0];
      for (const q of proprietaires) { if (q.debut <= v) o = q; else break; }
      const b = SC.batiments[o.b];
      info.innerHTML = ligne('bâtiment', `<b>${b.n || b.k}</b>`) + ligne('hauteur', `${b.h} m${b.estime ? ' (estimée : 18 m par défaut)' : ''}`) + '<div class="k">source : BD TOPO (IGN)</div>';
    }
  });

  // ---- boucle ----
  leviers.sur('levier', () => rafraichir());
  dessinerLiaisons();
  appliquerVisibilite();
  let t0 = performance.now(), zt = 0;
  const boucle = (now: number): void => {
    const dt = Math.min(0.1, (now - t0) / 1000); t0 = now; zt += dt;
    if (vol) {
      vol.k = Math.min(1, vol.k + dt / 1.2);
      const k = vol.k < 0.5 ? 2 * vol.k * vol.k : 1 - Math.pow(-2 * vol.k + 2, 2) / 2;
      cam.position.lerpVectors(vol.p0, vol.p1, k); ctl.target.lerpVectors(vol.t0, vol.t1, k);
      if (vol.k >= 1) vol = null;
    }
    for (const g of zonesVue.values()) g.children[1].scale.setScalar(1 + Math.sin(zt * 3) * 0.01);
    ctl.update();
    rnd.render(sc, cam);
    requestAnimationFrame(boucle);
  };
  requestAnimationFrame(boucle);
  (window as unknown as Record<string, unknown>).jumeau = { leviers, bus, nav, cam, ctl, rnd };
  return { leviers, bus, calculerAccessibilite, stats: { batiments: nb, rues: SC.rues.length, leviers: leviers.leviers.length } };
}
