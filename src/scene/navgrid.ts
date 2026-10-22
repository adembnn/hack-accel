// Grille praticable de 0,5 m par niveau + liens verticaux + portes + navigation (accessibilité sous contraintes).
// Construction : scene.json -> navgrid.json (fonction pure, reproductible). Exécution : classe Navigation.
import { CELLULE_M, Grille } from './raster.ts';
import type { Contrainte, TypeContrainte, EtatContrainte, BusContraintes } from './contrainte.ts';
import type { Scene } from './types.ts';

export const NIVEAUX = [0, -1, -2, -3, -4, -5] as const;
/** Étendue de la grille de rue (niveau 0), en mètres autour du centre du Forum. */
export const RAYON_GRILLE_RUE_M = 700;
/** Boîte des niveaux du Forum (x0, z0, x1, z1) en mètres. */
export const BOITE_FORUM: [number, number, number, number] = [-380, -290, 230, 400];
const KINDS_PRATICABLES = new Set(['corridor', 'area']);
const DIST_RELIAISON_MAX_M = 60;
const ILOT_MIN_M2 = 5;

export interface NiveauGrille { niveau: number; x0: number; z0: number; largeur: number; hauteur: number; data: Uint8Array }
export interface PorteGrille { id: string; type: TypeContrainte; niveau: number; x: number; y: number; largeur_m: number; etat: EtatContrainte }
export interface PointNiveau { niveau: number; x: number; y: number }
export interface LienGrille { id: string; type: 'escalier' | 'escalator' | 'ascenseur'; de: PointNiveau; vers: PointNiveau; largeur_m: number; etat: EtatContrainte; estime: boolean }
export interface SortieGrille { id: string; genre: 'rue' | 'secours' | 'metro'; niveau: number; x: number; y: number; largeur_m: number; etat: EtatContrainte; hors_modele: boolean }
export interface StatsNiveau { niveau: number; praticables: number; dont_estimees: number; ilots_relies: number; ilots_supprimes: number; surface_m2: number; estime: boolean; raison: string }
export interface Navgrid {
  version: 1; cellule_m: number; origine: [number, number];
  niveaux: NiveauGrille[]; portes: PorteGrille[]; liens: LienGrille[]; sorties: SortieGrille[];
  stats: { niveaux: StatsNiveau[]; portes_ignorees: string[]; liens_ignores: string[] };
}

/** Niveau OSM (peut être fractionnaire : -0,5 ; -3,5) -> niveau entier de la grille (demi-niveau arrondi vers le bas). */
export function niveauEntier(n: number): number { return Math.round(n - 0.001); }

// ---------- composantes connexes ----------
function etiqueter(g: Grille): { lab: Int32Array; tailles: number[] } {
  const { largeur: W, data } = g;
  const lab = new Int32Array(data.length).fill(-1);
  const tailles: number[] = [];
  const pile = new Int32Array(data.length);
  for (let s = 0; s < data.length; s++) {
    if (data[s] === 0 || lab[s] !== -1) continue;
    const id = tailles.length; let n = 0, sp = 0;
    pile[sp++] = s; lab[s] = id;
    while (sp) {
      const c = pile[--sp]; n++;
      const i = c % W;
      if (i > 0 && data[c - 1] && lab[c - 1] === -1) { lab[c - 1] = id; pile[sp++] = c - 1; }
      if (i < W - 1 && data[c + 1] && lab[c + 1] === -1) { lab[c + 1] = id; pile[sp++] = c + 1; }
      if (c >= W && data[c - W] && lab[c - W] === -1) { lab[c - W] = id; pile[sp++] = c - W; }
      if (c + W < data.length && data[c + W] && lab[c + W] === -1) { lab[c + W] = id; pile[sp++] = c + W; }
    }
    tailles.push(n);
  }
  return { lab, tailles };
}

/** Relie les îlots au plus grand îlot par une liaison estimée (valeur 2) si elle fait moins de DIST_RELIAISON_MAX_M, sinon les supprime. */
function relier(g: Grille): { relies: number; supprimes: number } {
  const { largeur: W, data } = g;
  const { lab, tailles } = etiqueter(g);
  if (tailles.length <= 1) return { relies: 0, supprimes: 0 };
  let main = 0;
  tailles.forEach((t, i) => { if (t > tailles[main]) main = i; });
  const L = Math.round(DIST_RELIAISON_MAX_M / CELLULE_M);
  const dist = new Int16Array(data.length).fill(-1);
  const parent = new Int32Array(data.length).fill(-1);
  const file = new Int32Array(data.length);
  let tete = 0, queue = 0;
  for (let c = 0; c < data.length; c++) if (lab[c] === main) { dist[c] = 0; file[queue++] = c; }
  while (tete < queue) {
    const c = file[tete++]; const d = dist[c]; if (d >= L) continue;
    const i = c % W;
    const voisins = [i > 0 ? c - 1 : -1, i < W - 1 ? c + 1 : -1, c >= W ? c - W : -1, c + W < data.length ? c + W : -1];
    for (const v of voisins) if (v >= 0 && dist[v] === -1) { dist[v] = d + 1; parent[v] = c; file[queue++] = v; }
  }
  const meilleur = new Int32Array(tailles.length).fill(-1);
  for (let c = 0; c < data.length; c++) {
    const l = lab[c]; if (l < 0 || l === main || dist[c] < 0) continue;
    if (meilleur[l] < 0 || dist[c] < dist[meilleur[l]]) meilleur[l] = c;
  }
  let relies = 0, supprimes = 0;
  const aSupprimer = new Set<number>();
  for (let l = 0; l < tailles.length; l++) {
    if (l === main) continue;
    if (tailles[l] * CELLULE_M * CELLULE_M < ILOT_MIN_M2 || meilleur[l] < 0) { aSupprimer.add(l); supprimes++; continue; }
    for (let c = parent[meilleur[l]]; c >= 0 && dist[c] > 0; c = parent[c]) {
      if (data[c] === 0) data[c] = 2;
    }
    relies++;
  }
  if (aSupprimer.size) for (let c = 0; c < data.length; c++) if (lab[c] >= 0 && aSupprimer.has(lab[c])) data[c] = 0;
  return { relies, supprimes };
}

// ---------- construction ----------
export function construireNavgrid(scene: Scene): Navgrid {
  const stats: Navgrid['stats'] = { niveaux: [], portes_ignorees: [], liens_ignores: [] };
  const grilles = new Map<number, Grille>();
  for (const n of NIVEAUX) {
    grilles.set(n, n === 0
      ? Grille.couvrant(-RAYON_GRILLE_RUE_M, -RAYON_GRILLE_RUE_M, RAYON_GRILLE_RUE_M, RAYON_GRILLE_RUE_M)
      : Grille.couvrant(...BOITE_FORUM));
  }
  const niv = (l: number[] | undefined): number[] => (l && l.length ? [...new Set(l.map(niveauEntier))] : [0]);

  // niveau 0 : rues, places piétonnes, bâtiments en creux
  const g0 = grilles.get(0)!;
  for (const r of scene.rues) g0.trait(r.p, r.w / 2, 1);
  for (const a of scene.pietons) g0.remplir(a.p, 1);
  for (const b of scene.batiments) g0.remplir(b.p, 0);

  // intérieur du Forum, tous niveaux
  for (const o of scene.interieur) {
    if (!KINDS_PRATICABLES.has(o.k)) continue;
    for (const n of niv(o.l)) grilles.get(n)?.remplir(o.p, 1);
  }
  for (const c of scene.chemins) for (const n of niv(c.l)) grilles.get(n)?.trait(c.p, c.w / 2, 1);
  for (const a of scene.ascenseurs) for (const n of niv(a.l)) grilles.get(n)?.remplir(a.p, 1);

  // portes et bouches : disque de 0,75 m (perce le mur / pose la porte sur la grille)
  const toutesPortes: PorteGrille[] = [];
  for (const p of [...scene.portes, ...scene.metro]) {
    const n = niveauEntier(p.l[0] ?? 0);
    const g = grilles.get(n);
    if (!g || g.indice(p.x, p.z) < 0) { stats.portes_ignorees.push(p.id); continue; }
    g.disque(p.x, p.z, 0.75, 1, true);
    toutesPortes.push({ id: p.id, type: p.type, niveau: n, x: p.x, y: p.z, largeur_m: p.largeur_m, etat: p.etat });
  }
  // liens verticaux : disque de 1,5 m à chaque extrémité
  const liens: LienGrille[] = [];
  for (const l of [...scene.escalators, ...scene.escaliers, ...scene.ascenseurs]) {
    const a = niveauEntier(l.de.niveau), b = niveauEntier(l.vers.niveau);
    const ga = grilles.get(a), gb = grilles.get(b);
    if (a === b || !ga || !gb || ga.indice(l.de.x, l.de.z) < 0 || gb.indice(l.vers.x, l.vers.z) < 0) { stats.liens_ignores.push(l.id); continue; }
    ga.disque(l.de.x, l.de.z, 1.5, 1, true); gb.disque(l.vers.x, l.vers.z, 1.5, 1, true);
    liens.push({ id: l.id, type: l.type, de: { niveau: a, x: l.de.x, y: l.de.z }, vers: { niveau: b, x: l.vers.x, y: l.vers.z }, largeur_m: l.largeur_m, etat: l.etat, estime: l.estime });
  }

  // connexité par niveau
  const niveaux: NiveauGrille[] = [];
  for (const n of NIVEAUX) {
    const g = grilles.get(n)!;
    const rel = relier(g);
    let prat = 0, est = 0;
    for (const v of g.data) { if (v) prat++; if (v === 2) est++; }
    const meta = scene.niveaux.find((x) => x.niveau === n);
    stats.niveaux.push({ niveau: n, praticables: prat, dont_estimees: est, ilots_relies: rel.relies, ilots_supprimes: rel.supprimes,
      surface_m2: prat * CELLULE_M * CELLULE_M, estime: meta?.estime ?? true, raison: meta?.raison ?? '' });
    niveaux.push({ niveau: n, x0: g.x0, z0: g.z0, largeur: g.largeur, hauteur: g.hauteur, data: g.data });
  }

  // ne garder que les portes / liens dont l'extrémité est réellement sur une cellule praticable
  const pr = (n: number, x: number, z: number): boolean => {
    const g = niveaux.find((q) => q.niveau === n)!;
    const i = Math.floor((x - g.x0) / CELLULE_M), j = Math.floor((z - g.z0) / CELLULE_M);
    return i >= 0 && j >= 0 && i < g.largeur && j < g.hauteur && g.data[j * g.largeur + i] > 0;
  };
  const portes = toutesPortes.filter((p) => { const ok = pr(p.niveau, p.x, p.y); if (!ok) stats.portes_ignorees.push(p.id); return ok; });
  const liensOk = liens.filter((l) => { const ok = pr(l.de.niveau, l.de.x, l.de.y) && pr(l.vers.niveau, l.vers.x, l.vers.y); if (!ok) stats.liens_ignores.push(l.id); return ok; });
  // un niveau resté sans lien vertical documenté est relié par UNE liaison estimée, posée au milieu d'un cheminement OSM
  // déclaré sur deux niveaux (ex. level=-5;-4), et marquée estime:true
  const reliesSet = new Set<number>([0]);
  for (let boucle = 0; boucle < NIVEAUX.length; boucle++) for (const l of liensOk) {
    if (reliesSet.has(l.de.niveau) || reliesSet.has(l.vers.niveau)) { reliesSet.add(l.de.niveau); reliesSet.add(l.vers.niveau); }
  }
  for (const n of NIVEAUX) {
    if (reliesSet.has(n)) continue;
    const elements = [...scene.chemins.map((c) => ({ l: c.l, p: c.p })), ...scene.interieur.filter((o) => KINDS_PRATICABLES.has(o.k)).map((o) => ({ l: o.l, p: o.p }))];
    let pose = false;
    for (const el of elements) {
      const lv = [...new Set(el.l.map(niveauEntier))];
      const m = lv.find((v) => v !== n && reliesSet.has(v));
      if (!lv.includes(n) || m === undefined) continue;
      for (let k = 0; k + 3 < el.p.length && !pose; k += 2) {
        const x = (el.p[k] + el.p[k + 2]) / 2, z = (el.p[k + 1] + el.p[k + 3]) / 2;
        if (!pr(n, x, z) || !pr(m, x, z)) continue;
        const [bas, haut] = n < m ? [n, m] : [m, n];
        liensOk.push({ id: `EST-${n}`, type: 'escalier', de: { niveau: bas, x, y: z }, vers: { niveau: haut, x, y: z }, largeur_m: 2, etat: 'ouverte', estime: true });
        reliesSet.add(n); pose = true;
      }
      if (pose) break;
    }
  }
  const idsPortes = new Set(portes.map((p) => p.id));
  const sorties: SortieGrille[] = scene.sorties.filter((s) => idsPortes.has(s.ref)).map((s) => ({
    id: s.ref, genre: s.genre, niveau: niveauEntier(s.niveau), x: s.x, y: s.z, largeur_m: s.largeur_m, etat: s.etat, hors_modele: s.hors_modele,
  }));
  return { version: 1, cellule_m: CELLULE_M, origine: scene.origine, niveaux, portes, liens: liensOk, sorties, stats };
}

// ---------- sérialisation (RLE : [valeur, longueur, valeur, longueur, ...]) ----------
export function encoderRLE(d: Uint8Array): number[] {
  const out: number[] = [];
  let v = d[0], n = 0;
  for (let i = 0; i < d.length; i++) { if (d[i] === v) n++; else { out.push(v, n); v = d[i]; n = 1; } }
  out.push(v, n);
  return out;
}
export function decoderRLE(rle: number[], taille: number): Uint8Array {
  const d = new Uint8Array(taille); let k = 0;
  for (let i = 0; i < rle.length; i += 2) { d.fill(rle[i], k, k + rle[i + 1]); k += rle[i + 1]; }
  if (k !== taille) throw new Error(`RLE corrompu : ${k} cellules au lieu de ${taille}`);
  return d;
}
export function serialiserNavgrid(ng: Navgrid): string {
  const o = { ...ng, niveaux: ng.niveaux.map((n) => ({ niveau: n.niveau, x0: n.x0, z0: n.z0, largeur: n.largeur, hauteur: n.hauteur, rle: encoderRLE(n.data) })) };
  return JSON.stringify(o);
}
export function lireNavgrid(json: string): Navgrid {
  const o = JSON.parse(json);
  o.niveaux = o.niveaux.map((n: { rle: number[]; largeur: number; hauteur: number }) => {
    const { rle, ...reste } = n;
    return { ...reste, data: decoderRLE(rle, n.largeur * n.hauteur) };
  });
  return o as Navgrid;
}

// ---------- navigation sous contraintes ----------
const cle = (niveau: number, idx: number): number => (niveau + 10) * 1e8 + idx;
const deCle = (c: number): [number, number] => { const n = Math.floor(c / 1e8); return [n - 10, c - n * 1e8]; };

export interface Accessibilite {
  cellules_visitees: number;
  par_niveau: Record<number, number>;
  sorties_atteintes: string[];
  sorties_coupees: string[];
}

export class Navigation {
  readonly ng: Navgrid;
  #masque = new Map<number, Uint8Array>();
  #bloc = new Map<string, { niveau: number; idx: number[] }>();
  #etatLien = new Map<string, EtatContrainte>();
  #portail = new Map<number, { id: string; vers: number }[]>();
  constructor(ng: Navgrid) {
    this.ng = ng;
    for (const n of ng.niveaux) this.#masque.set(n.niveau, new Uint8Array(n.largeur * n.hauteur));
    for (const l of ng.liens) {
      this.#etatLien.set(l.id, l.etat);
      const a = this.indice(l.de.niveau, l.de.x, l.de.y), b = this.indice(l.vers.niveau, l.vers.x, l.vers.y);
      if (a < 0 || b < 0) continue;
      const ka = cle(l.de.niveau, a), kb = cle(l.vers.niveau, b);
      if (!this.#portail.has(ka)) this.#portail.set(ka, []);
      if (!this.#portail.has(kb)) this.#portail.set(kb, []);
      this.#portail.get(ka)!.push({ id: l.id, vers: kb });
      this.#portail.get(kb)!.push({ id: l.id, vers: ka });
    }
    for (const p of ng.portes) if (p.etat !== 'ouverte') this.#poser(p.id, p.niveau, p.x, p.y, p.largeur_m);
  }
  niveau(n: number): NiveauGrille {
    const g = this.ng.niveaux.find((q) => q.niveau === n);
    if (!g) throw new Error(`niveau ${n} absent de la grille`);
    return g;
  }
  indice(n: number, x: number, y: number): number {
    const g = this.niveau(n);
    const i = Math.floor((x - g.x0) / CELLULE_M), j = Math.floor((y - g.z0) / CELLULE_M);
    return i < 0 || j < 0 || i >= g.largeur || j >= g.hauteur ? -1 : j * g.largeur + i;
  }
  praticable(n: number, idx: number): boolean {
    return idx >= 0 && this.niveau(n).data[idx] > 0 && this.#masque.get(n)![idx] === 0;
  }
  #disque(n: number, x: number, y: number, r: number): number[] {
    const g = this.niveau(n); const out: number[] = [];
    const i0 = Math.max(0, Math.floor((x - r - g.x0) / CELLULE_M)), i1 = Math.min(g.largeur - 1, Math.floor((x + r - g.x0) / CELLULE_M));
    const j0 = Math.max(0, Math.floor((y - r - g.z0) / CELLULE_M)), j1 = Math.min(g.hauteur - 1, Math.floor((y + r - g.z0) / CELLULE_M));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = g.x0 + (i + 0.5) * CELLULE_M - x, dy = g.z0 + (j + 0.5) * CELLULE_M - y;
      if (dx * dx + dy * dy <= r * r) out.push(j * g.largeur + i);
    }
    return out;
  }
  /** Fermer = bloquer un disque de rayon largeur/2 + 0,5 m autour de la porte (le mur voisin est déjà non praticable). */
  #poser(id: string, n: number, x: number, y: number, largeur: number): void {
    if (this.#bloc.has(id)) return;
    const idx = this.#disque(n, x, y, largeur / 2 + 0.5);
    const m = this.#masque.get(n)!;
    for (const k of idx) m[k]++;
    this.#bloc.set(id, { niveau: n, idx });
  }
  #lever(id: string): void {
    const b = this.#bloc.get(id); if (!b) return;
    const m = this.#masque.get(b.niveau)!;
    for (const k of b.idx) m[k]--;
    this.#bloc.delete(id);
  }

  /** Applique une contrainte : porte / sortie / bouche / barrage = disque bloqué ; escalier / escalator / ascenseur = lien coupé. */
  appliquer(c: Contrainte): void {
    if (this.ng.liens.some((l) => l.id === c.id)) { this.#etatLien.set(c.id, c.etat); return; }
    const porte = this.ng.portes.find((p) => p.id === c.id);
    const [n, x, y, w] = porte ? [porte.niveau, porte.x, porte.y, porte.largeur_m] : [c.niveau, c.x, c.y, c.largeur_m];
    if (!this.ng.niveaux.some((q) => q.niveau === n)) throw new Error(`niveau ${n} hors grille`);
    if (c.etat === 'ouverte') this.#lever(c.id); else this.#poser(c.id, n, x, y, w);
  }
  brancher(bus: BusContraintes): () => void { return bus.sur('contrainte', (c) => this.appliquer(c)); }
  etatLien(id: string): EtatContrainte | undefined { return this.#etatLien.get(id); }

  /** Cellule praticable la plus proche (rayon max en m), ou -1. */
  plusProche(n: number, x: number, y: number, rayon = 3): number {
    const g = this.niveau(n);
    let best = -1, bd = Infinity;
    for (const k of this.#disque(n, x, y, rayon)) {
      if (!this.praticable(n, k)) continue;
      const i = k % g.largeur, j = (k - i) / g.largeur;
      const d = (g.x0 + (i + 0.5) * CELLULE_M - x) ** 2 + (g.z0 + (j + 0.5) * CELLULE_M - y) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  /** Parcours depuis un point : cellules atteignables, tous niveaux, liens verticaux ouverts, contraintes comprises. */
  accessibles(n: number, x: number, y: number): Accessibilite {
    const depart = this.plusProche(n, x, y);
    if (depart < 0) throw new Error('point de départ hors zone praticable');
    const vus = new Map<number, Uint8Array>();
    for (const g of this.ng.niveaux) vus.set(g.niveau, new Uint8Array(g.largeur * g.hauteur));
    const par_niveau: Record<number, number> = {};
    const pile: number[] = [cle(n, depart)]; vus.get(n)![depart] = 1;
    let total = 0;
    while (pile.length) {
      const c = pile.pop()!;
      const [niv, idx] = deCle(c);
      total++; par_niveau[niv] = (par_niveau[niv] ?? 0) + 1;
      const g = this.niveau(niv), v = vus.get(niv)!, W = g.largeur, i = idx % W;
      const cand = [i > 0 ? idx - 1 : -1, i < W - 1 ? idx + 1 : -1, idx >= W ? idx - W : -1, idx + W < g.data.length ? idx + W : -1];
      for (const k of cand) if (k >= 0 && !v[k] && this.praticable(niv, k)) { v[k] = 1; pile.push(cle(niv, k)); }
      for (const p of this.#portail.get(c) ?? []) {
        if (this.#etatLien.get(p.id) !== 'ouverte') continue;
        const [n2, i2] = deCle(p.vers);
        if (!vus.get(n2)![i2] && this.praticable(n2, i2)) { vus.get(n2)![i2] = 1; pile.push(p.vers); }
      }
    }
    const atteintes: string[] = [], coupees: string[] = [];
    for (const s of this.ng.sorties) {
      const v = vus.get(s.niveau)!;
      (this.#disque(s.niveau, s.x, s.y, Math.max(0.6, Math.min(1.5, s.largeur_m / 2 + 0.25))).some((k) => v[k]) ? atteintes : coupees).push(s.id);
    }
    return { cellules_visitees: total, par_niveau, sorties_atteintes: atteintes, sorties_coupees: coupees };
  }
}

/** Nombre de composantes connexes d'un niveau (diagnostic et tests). */
export function composantes(nv: NiveauGrille): number {
  return etiqueter(new Grille(nv.x0, nv.z0, nv.largeur, nv.hauteur, nv.data)).tailles.length;
}
