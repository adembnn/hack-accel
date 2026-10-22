// Générateur reproductible : extraits OpenStreetMap + BD TOPO (lecture seule) -> src/scene/scene.json + src/scene/navgrid.json
// Usage : node src/scene/generer.ts [--data <dossier data>]   (défaut : ../../../../refuge-data/data, ou la variable REFUGE_DATA)
// Aucune clé, aucun réseau : on ne lit que des fichiers déjà téléchargés (voir SOURCES.md du dossier de données).
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { Navgrid } from './navgrid.ts';
import { construireNavgrid, serialiserNavgrid, niveauEntier, NIVEAUX } from './navgrid.ts';
import type { Scene, LienVertical, Porte, Bouche, Sortie } from './types.ts';

const LAT0 = 48.862, LON0 = 2.347;
const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KZ = 110540;
const ETAGE = 6;
const RAYON_RUES_M = 1000;
const FORUM = { x0: -400, z0: -300, x1: 260, z1: 420 }; // boîte (m) où l'on garde l'intérieur du Forum et ses portes
const r1 = (v: number): number => Math.round(v * 10) / 10;

interface Geo { lat: number; lon: number }
interface Elt { type: string; id: number; lat?: number; lon?: number; geometry?: Geo[]; tags?: Record<string, string> }

const xy = (lat: number, lon: number): [number, number] => [(lon - LON0) * KX, (LAT0 - lat) * KZ];
const anneau = (g: Geo[]): number[] => g.flatMap((p) => { const [x, z] = xy(p.lat, p.lon); return [r1(x), r1(z)]; });
const dansBoite = (x: number, z: number): boolean => x >= FORUM.x0 && x <= FORUM.x1 && z >= FORUM.z0 && z <= FORUM.z1;
const proche = (p: number[], r: number): boolean => { for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i], p[i + 1]) <= r) return true; return false; };
const centre = (p: number[]): [number, number] => { let sx = 0, sz = 0; const n = p.length / 2; for (let i = 0; i < p.length; i += 2) { sx += p[i]; sz += p[i + 1]; } return [r1(sx / n), r1(sz / n)]; };
const lire = (dir: string, f: string): Elt[] => JSON.parse(readFileSync(join(dir, f), 'utf8')).elements;
const num = (s: string | undefined): number | undefined => { if (s === undefined) return undefined; const m = /-?\d+(?:[.,]\d+)?/.exec(s); return m ? parseFloat(m[0].replace(',', '.')) : undefined; };

/** '-2;-1' -> [-2,-1] ; '-3.5' -> [-3.5] ; ''/absent -> [] */
function niveauxOsm(tag: string | undefined): number[] {
  if (!tag) return [];
  const out: number[] = [];
  for (const part of tag.split(/[;,]/)) { const v = parseFloat(part.trim()); if (Number.isFinite(v)) out.push(v); }
  return out;
}
const entiers = (l: number[]): number[] => [...new Set(l.map(niveauEntier))].filter((n) => (NIVEAUX as readonly number[]).includes(n)).sort((a, b) => a - b);

const LARGEUR_RUE: Record<string, number> = { primary: 12, secondary: 10, tertiary: 8, residential: 6, unclassified: 6, living_street: 6, service: 4, pedestrian: 8, footway: 2.5, cycleway: 2.5, path: 2, steps: 2.5 };

export function genererScene(dir: string): Scene {
  const voies = lire(dir, 'osm/voies.json');
  const inter = lire(dir, 'osm/interieur.json');
  const acces = lire(dir, 'osm/points_acces.json');
  const bd = JSON.parse(readFileSync(join(dir, 'bdtopo/halles_batiments.json'), 'utf8'));

  // --- bâtiments (BD TOPO, anneaux extérieurs) ---
  const batiments: Scene['batiments'] = [];
  for (const f of bd.features) {
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    const h = typeof f.properties.hauteur === 'number' ? f.properties.hauteur : null;
    for (const poly of polys) {
      const p = (poly[0] as number[][]).flatMap(([lon, lat]) => { const [x, z] = xy(lat, lon); return [r1(x), r1(z)]; });
      if (p.length >= 8 && proche(p, RAYON_RUES_M)) {
        batiments.push({ h: h ?? 18, b: 0, n: '', k: String(f.properties.usage_1 ?? 'yes'), p, ...(h === null ? { estime: true } : {}) });
      }
    }
  }

  // --- rues de surface (rayon ~1 km) et places piétonnes ---
  const rues: Scene['rues'] = [], pietons: Scene['pietons'] = [];
  for (const e of voies) {
    const t = e.tags ?? {}; const hw = t.highway;
    if (!e.geometry || !hw || !(hw in LARGEUR_RUE)) continue;
    if (t.level && niveauxOsm(t.level).some((v) => v !== 0)) continue;
    if (t.tunnel === 'yes' || (t.layer && parseFloat(t.layer) < 0) || t.conveying) continue;
    const p = anneau(e.geometry);
    if (!proche(p, RAYON_RUES_M)) continue;
    const ferme = e.geometry.length > 3 && e.geometry[0].lat === e.geometry.at(-1)!.lat && e.geometry[0].lon === e.geometry.at(-1)!.lon;
    if (t.area === 'yes' && ferme) pietons.push({ n: t.name ?? '', p });
    else rues.push({ k: hw, n: t.name ?? '', w: num(t.width) && num(t.width)! >= 1 ? num(t.width)! : LARGEUR_RUE[hw], p });
  }

  // --- intérieur du Forum ---
  const interieur: Scene['interieur'] = [];
  const objPar: Record<number, number> = {};
  const compte = (l: number[]): void => { for (const n of entiers(l)) objPar[n] = (objPar[n] ?? 0) + 1; };
  for (const e of inter) {
    const t = e.tags ?? {};
    if (!e.geometry || !t.indoor || !['corridor', 'area', 'room', 'yes'].includes(t.indoor)) continue;
    const l = niveauxOsm(t.level);
    if (!entiers(l).length) continue;
    const p = anneau(e.geometry); const [cx, cz] = centre(p);
    if (!dansBoite(cx, cz) || p.length < 6) continue;
    interieur.push({ k: t.indoor, l: entiers(l), n: t.name ?? t.ref ?? '', p });
    if (t.indoor === 'corridor' || t.indoor === 'area') compte(l);
  }
  const chemins: Scene['chemins'] = [];
  const liensBruts: { e: Elt; kind: 'escalator' | 'escalier' | 'ascenseur' }[] = [];
  for (const e of voies) {
    const t = e.tags ?? {}; if (!e.geometry || !t.highway) continue;
    const p = anneau(e.geometry); const [cx, cz] = centre(p);
    if (!dansBoite(cx, cz)) continue;
    const l = niveauxOsm(t.level);
    if (t.conveying) liensBruts.push({ e, kind: 'escalator' });
    else if (t.highway === 'steps' && l.length) liensBruts.push({ e, kind: 'escalier' });
    else if (t.highway === 'elevator') liensBruts.push({ e, kind: 'ascenseur' });
    else if (['footway', 'corridor', 'pedestrian', 'path'].includes(t.highway) && l.length && entiers(l).length) {
      chemins.push({ k: t.highway, n: t.name ?? '', l: entiers(l), w: num(t.width) && num(t.width)! >= 1 ? num(t.width)! : t.highway === 'corridor' ? 3 : 2.5, p });
      compte(l);
    }
  }

  // --- liens verticaux ---
  const liens: Record<'escalator' | 'escalier' | 'ascenseur', LienVertical[]> = { escalator: [], escalier: [], ascenseur: [] };
  for (const { e, kind } of liensBruts) {
    const t = e.tags!; const lv = entiers(niveauxOsm(t.level));
    if (lv.length < 2) { if (kind === 'ascenseur') compte(niveauxOsm(t.level)); continue; }
    compte(niveauxOsm(t.level));
    const bas = lv[0], haut = lv[lv.length - 1];
    const p = anneau(e.geometry!);
    const a = { x: p[0], z: p[1] }, b = { x: p[p.length - 2], z: p[p.length - 1] };
    let de, vers; let estime = false;
    if (kind === 'ascenseur') { const [cx, cz] = centre(p); de = { niveau: bas, x: cx, z: cz }; vers = { niveau: haut, x: cx, z: cz }; estime = true; }
    else {
      if (!t.incline) estime = true;
      const montant = t.incline !== 'down';
      const pb = montant ? a : b, ph = montant ? b : a;
      de = { niveau: bas, x: pb.x, z: pb.z }; vers = { niveau: haut, x: ph.x, z: ph.z };
    }
    const w = num(t.width);
    const defaut = kind === 'escalator' ? 1.0 : kind === 'ascenseur' ? 1.2 : 2.0;
    if (!w) estime = true;
    liens[kind].push({
      id: `${kind === 'escalator' ? 'ESC' : kind === 'escalier' ? 'ESL' : 'ASC'}-${e.id}`, type: kind, l: [bas, haut], n: t.name ?? '', ...(t.conveying ? { d: t.conveying } : {}),
      p, de, vers, largeur_m: w && w > 0.3 ? w : defaut, etat: 'ouverte', estime,
    });
  }

  // --- portes, sorties, bouches ---
  const portes: Porte[] = [], metro: Bouche[] = [], sorties: Sortie[] = [];
  const LARG: Record<string, number> = { main: 2.4, shop: 1.8, yes: 1.2, exit: 1.4, emergency: 1.4, staircase: 1.2, service: 1.2, home: 1.0 };
  for (const e of acces) {
    const t = e.tags ?? {}; if (e.type !== 'node' || e.lat === undefined || e.lon === undefined) continue;
    const [x0, z0] = xy(e.lat, e.lon); const x = r1(x0), z = r1(z0);
    const l = entiers(niveauxOsm(t.level));
    if (t.railway === 'subway_entrance' || t.railway === 'train_station_entrance' || t.entrance === 'train_station_entrance' || t.public_transport === 'train_station_entrance') {
      if (Math.hypot(x, z) > RAYON_RUES_M) continue;
      const rer = t.railway !== 'subway_entrance';
      metro.push({ id: `M-${e.id}`, type: 'bouche_metro', k: rer ? 'rer' : 'metro', n: t.name ?? t.ref ?? '', x, z, l: [l[0] ?? 0], largeur_m: num(t.width) ?? (rer ? 3 : 2.5), etat: 'ouverte', estime: !num(t.width) });
      continue;
    }
    const k = t.entrance; if (!k || k === 'no' || k === 'garage' || !dansBoite(x, z)) continue;
    const secours = k === 'exit' || k === 'emergency';
    const w = num(t.width);
    const niveau = l[0] ?? 0;
    portes.push({ id: `P-${e.id}`, type: secours ? 'sortie' : 'porte', k, n: t.name ?? t.ref ?? '', x, z, l: [niveau], largeur_m: w && w >= 0.5 ? w : LARG[k] ?? 1.2,
      etat: t.access === 'no' || t.access === 'private' ? 'fermee' : 'ouverte', estime: !w || !l.length });
    if (l.length) compte(l);
  }
  for (const p of portes) {
    if (p.l[0] === 0 && (p.k === 'main' || p.k === 'exit' || p.k === 'emergency')) {
      sorties.push({ id: `S-${p.id}`, genre: p.k === 'main' ? 'rue' : 'secours', ref: p.id, niveau: 0, x: p.x, z: p.z, largeur_m: p.largeur_m, etat: p.etat, hors_modele: false });
    }
  }
  for (const m of metro) sorties.push({ id: `S-${m.id}`, genre: 'metro', ref: m.id, niveau: m.l[0], x: m.x, z: m.z, largeur_m: m.largeur_m, etat: m.etat, hors_modele: true });

  const niveaux = (NIVEAUX as readonly number[]).map((n) => {
    const nb = objPar[n] ?? 0;
    const estime = n !== 0 && nb < 90;
    return { niveau: n, altitude_m: n * ETAGE, estime, raison: n === 0 ? 'rue et rez-de-chaussée : bien documentés dans OSM et la BD TOPO' : estime ? `peu documenté dans OSM (${nb} objets de circulation) : couloirs partiels, liaisons complétées par estimation` : `correctement documenté dans OSM (${nb} objets de circulation)`, nb_objets_osm: nb };
  });

  return {
    version: 1, origine: [LAT0, LON0], etage: ETAGE, rayon_rues_m: RAYON_RUES_M,
    genere: 'node src/scene/generer.ts',
    sources: ['© les contributeurs d\'OpenStreetMap (ODbL)', 'Source : IGN, BD TOPO (Licence Ouverte 2.0)'],
    niveaux, batiments, interieur, chemins,
    escalators: liens.escalator, escaliers: liens.escalier, ascenseurs: liens.ascenseur,
    portes, metro, sorties, rues, pietons,
    quais: [], voies: [], incendie: [], arbres: [], bancs: [], bornes: [], velib: [], verts: [], eau: [],
  };
}

/** Construit la grille puis qualifie chaque niveau d'après la grille réellement obtenue (surface praticable, part de liaisons estimées). */
export function produireNavgrid(scene: Scene): Navgrid {
  const ng = construireNavgrid(scene);
  // qualité de chaque niveau d'après la grille réellement obtenue (surface praticable, part de liaisons estimées)
  for (const s of ng.stats.niveaux) {
    const nv = scene.niveaux.find((q) => q.niveau === s.niveau)!;
    if (s.niveau === 0) continue;
    const part = s.dont_estimees / Math.max(1, s.praticables);
    nv.estime = s.surface_m2 < 8000 || part > 0.05;
    s.estime = nv.estime;
    nv.raison = nv.estime
      ? `niveau partiel : ${s.surface_m2.toFixed(0)} m² de circulation documentés (OSM) sur ~15 000 m² attendus, liaisons complétées par estimation`
      : `documenté dans OSM : ${s.surface_m2.toFixed(0)} m² de circulation, ${(part * 100).toFixed(1)} % de liaisons estimées`;
    s.raison = nv.raison;
  }
  return ng;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const i = process.argv.indexOf('--data');
  const dir = resolve(i > 0 ? process.argv[i + 1] : process.env.REFUGE_DATA ?? resolve(import.meta.dirname, '../../../../refuge-data/data'));
  const debut = Date.now();
  const scene = genererScene(dir);
  const ng = produireNavgrid(scene);
  writeFileSync(resolve(import.meta.dirname, 'scene.json'), JSON.stringify(scene));
  writeFileSync(resolve(import.meta.dirname, 'navgrid.json'), serialiserNavgrid(ng));
  const taille = (f: string): string => (statSync(resolve(import.meta.dirname, f)).size / 1e6).toFixed(2) + ' Mo';
  console.log(`scene.json ${taille('scene.json')} | navgrid.json ${taille('navgrid.json')} | ${((Date.now() - debut) / 1000).toFixed(1)} s`);
  console.log(`batiments ${scene.batiments.length} · rues ${scene.rues.length} · interieur ${scene.interieur.length} · chemins ${scene.chemins.length} · portes ${scene.portes.length} · bouches ${scene.metro.length} · escalators ${scene.escalators.length} · escaliers ${scene.escaliers.length} · ascenseurs ${scene.ascenseurs.length} · sorties ${scene.sorties.length}`);
  console.log(`grille : ${ng.portes.length} portes, ${ng.liens.length} liens, ${ng.sorties.length} sorties ; ignorés : ${ng.stats.portes_ignorees.length} portes, ${ng.stats.liens_ignores.length} liens`);
  for (const s of ng.stats.niveaux) console.log(`niveau ${String(s.niveau).padStart(2)} : ${String(s.praticables).padStart(8)} cellules (${s.surface_m2.toFixed(0)} m², estimées ${s.dont_estimees}, îlots reliés ${s.ilots_relies}, supprimés ${s.ilots_supprimes}) estime=${s.estime}`);
}
