// lieu.mjs : adresse (ou lat/lon + rayon) -> scene.json + navgrid.json (même format que wt-proto-jumeau-3d/src/scene).
// Node >= 22, aucune dépendance, aucune clé. Sources : Géoplateforme (adresse, WFS BD TOPO), OpenStreetMap (Overpass).
// Usage : node lieu.mjs --adresse "5 rue La Boétie 75008 Paris" [--rayon 150] [--out dossier] [--cache dossier] [--etage 3.2]
//         node lieu.mjs --lat 48.862 --lon 2.347 --rayon 150 --nom forum [--images] [--sans-cache]
// Étapes : géocodage -> (Overpass | WFS bâtiments | WFS parcelles | WFS voirie | images) EN PARALLÈLE -> scène -> grille.
// Ce qui reste MANUEL / estimé : l'intérieur des étages (plan, escaliers, ascenseurs) quand OSM ne le documente pas.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); if (i < 0) return d; const v = process.argv[i + 1]; return v === undefined || v.startsWith('--') ? true : v; };
const ADRESSE = arg('adresse'), RAYON = Number(arg('rayon', 150)), ETAGE = Number(arg('etage', 3.2));
const CELLULE = Number(arg('cellule', 0.5));
const NOM = arg('nom', 'lieu');
const OUT = resolve(arg('out', join(import.meta.dirname, '..', '..', 'data', 'lieux', String(NOM))));
const CACHE = resolve(arg('cache', join(import.meta.dirname, 'cache')));
const SANS_CACHE = process.argv.includes('--sans-cache'), IMAGES = process.argv.includes('--images');
const UA = { 'User-Agent': 'refuge-hackathon-demo/1.0 (usage hackathon, sans scraping massif)' };
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
mkdirSync(OUT, { recursive: true }); mkdirSync(CACHE, { recursive: true });

// ---------- journal ----------
const T0 = performance.now(); const journal = [];
async function etape(nom, f) {
  const t = performance.now(); let info = '';
  try { const r = await f(); info = r?.info ?? ''; return r?.val ?? r; }
  finally { const s = +((performance.now() - t) / 1000).toFixed(2); journal.push({ etape: nom, s, ...(info ? { info } : {}) }); console.log(`  ${nom.padEnd(22)} ${String(s).padStart(7)} s ${info}`); }
}
// ---------- réseau + cache ----------
let cacheHits = 0;
async function http(url, { body, timeout = 90000 } = {}) {
  const cle = createHash('sha1').update(url + (body ?? '')).digest('hex').slice(0, 16), f = join(CACHE, cle + '.json');
  if (!SANS_CACHE && existsSync(f)) { cacheHits++; return JSON.parse(readFileSync(f, 'utf8')); }
  const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { ...UA, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body, signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url.slice(0, 80)}`);
  const txt = await r.text(); const j = JSON.parse(txt); writeFileSync(f, txt); return j;
}

// ---------- géométrie ----------
let LAT0, LON0, KX, KZ;
const r1 = (v) => Math.round(v * 10) / 10;
const xy = (lat, lon) => [(lon - LON0) * KX, (LAT0 - lat) * KZ];
const aplat = (pts) => pts.flatMap(([x, z]) => [r1(x), r1(z)]);
const geoPts = (g) => g.map((p) => xy(p.lat, p.lon));
const aire = (P) => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return Math.abs(s) / 2; };
const dansPoly = (x, z, P) => { let d = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) d = !d; return d; };
function distSeg(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz; let t = L ? ((x - a[0]) * dx + (z - a[1]) * dz) / L : 0; t = Math.max(0, Math.min(1, t)); const px = a[0] + t * dx, pz = a[1] + t * dz; return { d: Math.hypot(x - px, z - pz), px, pz }; }
const distBord = (x, z, P) => { let m = { d: Infinity }; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const r = distSeg(x, z, P[j], P[i]); if (r.d < m.d) m = r; } return m; };
const bbox = (P) => P.reduce((b, [x, z]) => [Math.min(b[0], x), Math.min(b[1], z), Math.max(b[2], x), Math.max(b[3], z)], [Infinity, Infinity, -Infinity, -Infinity]);
const centreP = (P) => { let sx = 0, sz = 0; for (const [x, z] of P) { sx += x; sz += z; } return [sx / P.length, sz / P.length]; };
function pole(P) { // point le plus éloigné du bord à l'intérieur (pas de 1 m)
  const [x0, z0, x1, z1] = bbox(P); let best = { d: -1, x: P[0][0], z: P[0][1] };
  for (let x = x0; x <= x1; x += 1) for (let z = z0; z <= z1; z += 1) if (dansPoly(x, z, P)) { const d = distBord(x, z, P).d; if (d > best.d) best = { d, x, z }; }
  return best;
}
const num = (s) => { if (s === undefined || s === null) return undefined; const m = /-?\d+(?:[.,]\d+)?/.exec(String(s)); return m ? parseFloat(m[0].replace(',', '.')) : undefined; };
const niveauEntier = (n) => Math.round(n - 0.001);
const niveauxOsm = (t) => (t ? String(t).split(/[;,]/).map((v) => parseFloat(v.trim())).filter(Number.isFinite) : []);

// ---------- grille (même logique que raster.ts / navgrid.ts) ----------
class Grille {
  constructor(x0, z0, l, h) { this.x0 = x0; this.z0 = z0; this.largeur = l; this.hauteur = h; this.data = new Uint8Array(l * h); }
  static couvrant(a, b, c, d) { return new Grille(a, b, Math.ceil((c - a) / CELLULE), Math.ceil((d - b) / CELLULE)); }
  col(x) { return Math.floor((x - this.x0) / CELLULE); }
  lig(z) { return Math.floor((z - this.z0) / CELLULE); }
  indice(x, z) { const i = this.col(x), j = this.lig(z); return i < 0 || j < 0 || i >= this.largeur || j >= this.hauteur ? -1 : j * this.largeur + i; }
  remplir(p, v) {
    const n = p.length / 2; if (n < 3) return; let zmin = Infinity, zmax = -Infinity;
    for (let k = 0; k < n; k++) { zmin = Math.min(zmin, p[2 * k + 1]); zmax = Math.max(zmax, p[2 * k + 1]); }
    const j0 = Math.max(0, this.lig(zmin)), j1 = Math.min(this.hauteur - 1, this.lig(zmax)); const xs = [];
    for (let j = j0; j <= j1; j++) {
      const zc = this.z0 + (j + 0.5) * CELLULE; xs.length = 0;
      for (let k = 0, m = n - 1; k < n; m = k++) { const za = p[2 * k + 1], zb = p[2 * m + 1]; if ((za > zc) !== (zb > zc)) xs.push(p[2 * k] + ((zc - za) / (zb - za)) * (p[2 * m] - p[2 * k])); }
      xs.sort((a, b) => a - b);
      for (let s = 0; s + 1 < xs.length; s += 2) { const i0 = Math.max(0, Math.ceil((xs[s] - this.x0) / CELLULE - 0.5)), i1 = Math.min(this.largeur - 1, Math.floor((xs[s + 1] - this.x0) / CELLULE - 0.5)); for (let i = i0; i <= i1; i++) this.data[j * this.largeur + i] = v; }
    }
  }
  disque(x, z, r, v, seulementVide = false) {
    const i0 = Math.max(0, this.col(x - r)), i1 = Math.min(this.largeur - 1, this.col(x + r)), j0 = Math.max(0, this.lig(z - r)), j1 = Math.min(this.hauteur - 1, this.lig(z + r));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = this.x0 + (i + 0.5) * CELLULE - x, dz = this.z0 + (j + 0.5) * CELLULE - z; if (dx * dx + dz * dz <= r * r) { const k = j * this.largeur + i; if (!(seulementVide && this.data[k] > 0)) this.data[k] = v; } }
  }
  trait(p, demi, v) { for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3]; const pas = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / (CELLULE * 0.6))); for (let s = 0; s <= pas; s++) this.disque(ax + ((bx - ax) * s) / pas, az + ((bz - az) * s) / pas, demi, v); } }
}
function etiqueter(g) {
  const W = g.largeur, d = g.data, lab = new Int32Array(d.length).fill(-1), tailles = [], pile = new Int32Array(d.length);
  for (let s = 0; s < d.length; s++) {
    if (!d[s] || lab[s] !== -1) continue; const id = tailles.length; let n = 0, sp = 0; pile[sp++] = s; lab[s] = id;
    while (sp) {
      const c = pile[--sp]; n++; const i = c % W;
      if (i > 0 && d[c - 1] && lab[c - 1] === -1) { lab[c - 1] = id; pile[sp++] = c - 1; }
      if (i < W - 1 && d[c + 1] && lab[c + 1] === -1) { lab[c + 1] = id; pile[sp++] = c + 1; }
      if (c >= W && d[c - W] && lab[c - W] === -1) { lab[c - W] = id; pile[sp++] = c - W; }
      if (c + W < d.length && d[c + W] && lab[c + W] === -1) { lab[c + W] = id; pile[sp++] = c + W; }
    }
    tailles.push(n);
  }
  return { lab, tailles };
}
function relier(g) { // îlots reliés au plus grand par une liaison estimée (2) si < 60 m, sinon supprimés (< 5 m² ou trop loin)
  const W = g.largeur, d = g.data, { lab, tailles } = etiqueter(g); if (tailles.length <= 1) return { relies: 0, supprimes: 0 };
  let main = 0; tailles.forEach((t, i) => { if (t > tailles[main]) main = i; });
  const L = Math.round(60 / CELLULE), dist = new Int16Array(d.length).fill(-1), parent = new Int32Array(d.length).fill(-1), file = new Int32Array(d.length); let tete = 0, q = 0;
  for (let c = 0; c < d.length; c++) if (lab[c] === main) { dist[c] = 0; file[q++] = c; }
  while (tete < q) {
    const c = file[tete++], dd = dist[c]; if (dd >= L) continue; const i = c % W;
    for (const v of [i > 0 ? c - 1 : -1, i < W - 1 ? c + 1 : -1, c >= W ? c - W : -1, c + W < d.length ? c + W : -1]) if (v >= 0 && dist[v] === -1) { dist[v] = dd + 1; parent[v] = c; file[q++] = v; }
  }
  const meilleur = new Int32Array(tailles.length).fill(-1);
  for (let c = 0; c < d.length; c++) { const l = lab[c]; if (l < 0 || l === main || dist[c] < 0) continue; if (meilleur[l] < 0 || dist[c] < dist[meilleur[l]]) meilleur[l] = c; }
  let relies = 0, supprimes = 0; const sup = new Set();
  for (let l = 0; l < tailles.length; l++) {
    if (l === main) continue;
    if (tailles[l] * CELLULE * CELLULE < 5 || meilleur[l] < 0) { sup.add(l); supprimes++; continue; }
    for (let c = parent[meilleur[l]]; c >= 0 && dist[c] > 0; c = parent[c]) if (d[c] === 0) d[c] = 2;
    relies++;
  }
  if (sup.size) for (let c = 0; c < d.length; c++) if (lab[c] >= 0 && sup.has(lab[c])) d[c] = 0;
  return { relies, supprimes };
}
function rle(d) { const o = []; let v = d[0], n = 0; for (let i = 0; i < d.length; i++) { if (d[i] === v) n++; else { o.push(v, n); v = d[i]; n = 1; } } o.push(v, n); return o; }

// ---------- 1. géocodage ----------
let lat, lon, adresseTrouvee = '';
if (ADRESSE && ADRESSE !== true) {
  console.log(`Lieu : ${ADRESSE} (rayon ${RAYON} m)`);
  const g = await etape('geocodage', async () => { const j = await http('https://data.geopf.fr/geocodage/search?' + new URLSearchParams({ q: ADRESSE, limit: '1' })); return { val: j, info: j.features?.[0]?.properties?.label }; });
  if (!g.features?.length) throw new Error('adresse introuvable');
  [lon, lat] = g.features[0].geometry.coordinates; adresseTrouvee = g.features[0].properties.label;
} else {
  lat = Number(arg('lat')); lon = Number(arg('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('--adresse ou --lat/--lon requis');
  console.log(`Lieu : ${lat}, ${lon} (rayon ${RAYON} m)`);
}
LAT0 = lat; LON0 = lon; KX = Math.cos((lat * Math.PI) / 180) * 111320; KZ = 110540;
const [W, S, E, N] = [lon - RAYON / KX, lat - RAYON / KZ, lon + RAYON / KX, lat + RAYON / KZ];

// ---------- 2. téléchargements en parallèle ----------
const around = `(around:${RAYON},${lat},${lon})`;
const QOSM = `[out:json][timeout:60];(way["building"]${around};relation["building"]${around};way["building:part"]${around};node["entrance"]${around};node["door"]${around};node["highway"="elevator"]${around};node["railway"="subway_entrance"]${around};way["highway"]${around};way["indoor"]${around};way["level"]${around};);out geom tags;`;
async function overpass() { // course entre deux miroirs (2 requêtes seulement) : le plus rapide gagne, 60 s max
  try { return await Promise.any(OVERPASS.map((u) => http(u, { body: new URLSearchParams({ data: QOSM }).toString(), timeout: 60000 }))); }
  catch (e) { throw new Error(e.errors?.map((x) => x.message).join(' | ') ?? e.message); }
}
const wfs = (couche) => http('https://data.geopf.fr/wfs/ows?' + new URLSearchParams({ service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: couche, outputFormat: 'application/json', srsName: 'EPSG:4326', bbox: `${W},${S},${E},${N},EPSG:4326`, count: '5000' }));
async function images() {
  const out = { panoramax: null, commons: null, mapillary: 'non interrogé : jeton obligatoire, aucune clé utilisée' };
  try {
    const j = await http(`https://api.panoramax.xyz/api/search?bbox=${W},${S},${E},${N}&limit=100`);
    out.panoramax = (j.features ?? []).map((f) => ({ id: f.id, lon: f.geometry?.coordinates?.[0], lat: f.geometry?.coordinates?.[1], date: f.properties?.datetime, licence: f.properties?.license ?? null, collection: f.collection, url: f.assets?.sd?.href ?? f.assets?.hd?.href }));
  } catch (e) { out.panoramax = { erreur: e.message }; }
  try {
    const j = await http('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', generator: 'geosearch', ggscoord: `${lat}|${lon}`, ggsradius: String(Math.max(RAYON, 100)), ggslimit: '40', ggsnamespace: '6', prop: 'imageinfo', iiprop: 'url|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist', format: 'json' }));
    out.commons = Object.values(j.query?.pages ?? {}).map((p) => ({ titre: p.title, url: p.imageinfo?.[0]?.descriptionurl, licence: p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value, auteur: (p.imageinfo?.[0]?.extmetadata?.Artist?.value ?? '').replace(/<[^>]+>/g, '') }));
  } catch (e) { out.commons = { erreur: e.message }; }
  return { val: out, info: `panoramax ${Array.isArray(out.panoramax) ? out.panoramax.length : 'err'} · commons ${Array.isArray(out.commons) ? out.commons.length : 'err'}` };
}
console.log('Téléchargements en parallèle :');
const tPar = performance.now();
const [osm, bdBat, bdParc, bdVoi, imgs] = await Promise.all([
  etape('osm_overpass', async () => { try { const j = await overpass(); return { val: j, info: `${j.elements.length} éléments` }; } catch (e) { return { val: { elements: [] }, info: 'INDISPONIBLE (' + e.message + ') : repli BD TOPO seule, sans entrées ni intérieur OSM' }; } }),
  etape('bdtopo_batiments', async () => { const j = await wfs('BDTOPO_V3:batiment'); return { val: j, info: `${j.features.length} entités` }; }),
  etape('bdtopo_parcelles', async () => { try { const j = await wfs('CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle'); return { val: j, info: `${j.features.length} entités` }; } catch (e) { return { val: { features: [] }, info: 'indisponible : ' + e.message }; } }),
  etape('bdtopo_voirie', async () => { try { const j = await wfs('BDTOPO_V3:troncon_de_route'); return { val: j, info: `${j.features.length} entités` }; } catch (e) { return { val: { features: [] }, info: 'indisponible : ' + e.message }; } }),
  IMAGES ? etape('images', images) : Promise.resolve(null),
]);
const dureeTelechargement = +((performance.now() - tPar) / 1000).toFixed(2);

// ---------- 3. scène ----------
const sceneEtape = await etape('scene', async () => {
  const els = osm.elements;
  const bats = [];
  for (const f of bdBat.features) {
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const poly of polys) { const P = poly[0].map(([lo, la]) => xy(la, lo)); if (P.length >= 4) bats.push({ P, props: f.properties, id: f.properties.cleabs ?? f.id }); }
  }
  let cible = bats.find((b) => dansPoly(0, 0, b.P)), distCible = 0; // contient le point adresse, sinon le plus proche
  if (!cible) { let m = Infinity; for (const b of bats) { const d = distBord(0, 0, b.P).d; if (d < m) { m = d; cible = b; } } distCible = m; }
  const osmBat = [];
  for (const e of els) {
    if (!e.tags?.building && !e.tags?.['building:part']) continue;
    if (e.type === 'way' && e.geometry) osmBat.push({ P: geoPts(e.geometry), t: e.tags, id: `way/${e.id}` });
    else if (e.type === 'relation') for (const m of e.members ?? []) if (m.role === 'outer' && m.geometry) osmBat.push({ P: geoPts(m.geometry), t: e.tags, id: `relation/${e.id}` });
  }
  const osmSur = (P) => { const [cx, cz] = centreP(P); return osmBat.find((o) => o.t.building && dansPoly(cx, cz, o.P)); };

  const batiments = bats.filter((b) => b.P.some(([x, z]) => Math.hypot(x, z) <= RAYON + 20)).map((b) => {
    const o = osmSur(b.P), h = typeof b.props.hauteur === 'number' ? b.props.hauteur : null;
    const niv = num(o?.t['building:levels']) ?? b.props.nombre_d_etages;
    return { h: h ?? (niv ? niv * ETAGE : 15), b: 0, n: o?.t.name ?? '', k: String(b.props.usage_1 ?? o?.t.building ?? 'yes'), p: aplat(b.P), ...(b === cible ? { cible: true } : {}), ...(h === null ? { estime: true } : {}) };
  });
  const LARG = { primary: 12, secondary: 10, tertiary: 8, residential: 6, unclassified: 6, living_street: 6, service: 4, pedestrian: 8, footway: 2.5, cycleway: 2.5, path: 2, steps: 2.5 };
  const rues = [], pietons = [], chemins = [], liensBruts = [], interieur = [];
  for (const e of els) {
    const t = e.tags ?? {}; if (e.type !== 'way' || !e.geometry) continue;
    const l = niveauxOsm(t.level), P = geoPts(e.geometry), hw = t.highway;
    if (t.indoor && ['corridor', 'area', 'room', 'yes'].includes(t.indoor) && l.length) { interieur.push({ k: t.indoor, l: [...new Set(l.map(niveauEntier))].sort((a, b) => a - b), n: t.name ?? t.ref ?? '', p: aplat(P) }); continue; }
    if (!hw) continue;
    if (t.conveying) { liensBruts.push({ e, kind: 'escalator', P }); continue; }
    if (hw === 'elevator') { liensBruts.push({ e, kind: 'ascenseur', P }); continue; }
    if (hw === 'steps' && l.length > 1) { liensBruts.push({ e, kind: 'escalier', P }); continue; }
    if (l.some((v) => v !== 0) || t.tunnel === 'yes' || (t.layer && parseFloat(t.layer) < 0)) {
      if (['footway', 'corridor', 'pedestrian', 'path'].includes(hw) && l.length) chemins.push({ k: hw, n: t.name ?? '', l: [...new Set(l.map(niveauEntier))], w: num(t.width) >= 1 ? num(t.width) : 2.5, p: aplat(P) });
      continue;
    }
    if (!(hw in LARG)) continue;
    const ferme = e.geometry.length > 3 && e.geometry[0].lat === e.geometry.at(-1).lat && e.geometry[0].lon === e.geometry.at(-1).lon;
    if (t.area === 'yes' && ferme) pietons.push({ n: t.name ?? '', p: aplat(P) });
    else rues.push({ k: hw, n: t.name ?? '', w: num(t.width) >= 1 ? num(t.width) : LARG[hw], p: aplat(P) });
  }
  if (!rues.length) for (const f of bdVoi.features) { // repli : voirie BD TOPO quand OSM est indisponible
    const gs = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const ls of gs) rues.push({ k: String(f.properties.nature ?? 'route').toLowerCase(), n: f.properties.nom_1_gauche ?? '', w: num(f.properties.largeur_de_chaussee) ?? 6, p: aplat(ls.map(([lo, la]) => xy(la, lo))) });
  }
  const liens = { escalator: [], escalier: [], ascenseur: [] };
  for (const { e, kind, P } of liensBruts) {
    const t = e.tags, lv = [...new Set(niveauxOsm(t.level).map(niveauEntier))].sort((a, b) => a - b); if (lv.length < 2) continue;
    const p = aplat(P), a = { x: p[0], z: p[1] }, b = { x: p[p.length - 2], z: p[p.length - 1] }; let de, vers, estime = false;
    if (kind === 'ascenseur') { const [cx, cz] = centreP(P); de = { niveau: lv[0], x: r1(cx), z: r1(cz) }; vers = { niveau: lv.at(-1), x: r1(cx), z: r1(cz) }; estime = true; }
    else { if (!t.incline) estime = true; const m = t.incline !== 'down'; const pb = m ? a : b, ph = m ? b : a; de = { niveau: lv[0], ...pb }; vers = { niveau: lv.at(-1), ...ph }; }
    const w = num(t.width), def = kind === 'escalator' ? 1 : kind === 'ascenseur' ? 1.2 : 2; if (!w) estime = true;
    liens[kind].push({ id: `${kind === 'escalator' ? 'ESC' : kind === 'escalier' ? 'ESL' : 'ASC'}-${e.id}`, type: kind, l: [lv[0], lv.at(-1)], n: t.name ?? '', ...(t.conveying ? { d: t.conveying } : {}), p, ...(kind === 'ascenseur' ? { x: de.x, z: de.z } : {}), de, vers, largeur_m: w > 0.3 ? w : def, etat: 'ouverte', estime });
  }
  const portes = [], metro = [], sorties = [];
  const LW = { main: 2.4, shop: 1.8, yes: 1.2, exit: 1.4, emergency: 1.4, staircase: 1.2, service: 1.2, home: 1.0 };
  for (const e of els) {
    const t = e.tags ?? {}; if (e.type !== 'node') continue;
    const [x0, z0] = xy(e.lat, e.lon), x = r1(x0), z = r1(z0), l = [...new Set(niveauxOsm(t.level).map(niveauEntier))];
    if (t.railway === 'subway_entrance') { metro.push({ id: `M-${e.id}`, type: 'bouche_metro', k: 'metro', n: t.name ?? t.ref ?? '', x, z, l: [l[0] ?? 0], largeur_m: num(t.width) ?? 2.5, etat: 'ouverte', estime: !num(t.width) }); continue; }
    const k = t.entrance ?? (t.door ? 'yes' : undefined); if (!k || k === 'no' || k === 'garage') continue;
    const sec = k === 'exit' || k === 'emergency', w = num(t.width);
    portes.push({ id: `P-${e.id}`, type: sec ? 'sortie' : 'porte', k, n: t.name ?? t.ref ?? '', x, z, l: [l[0] ?? 0], largeur_m: w >= 0.5 ? w : LW[k] ?? 1.2, etat: t.access === 'no' || t.access === 'private' ? 'fermee' : 'ouverte', estime: !w || !l.length });
  }
  // --- bâtiment cible : étages estimés ---
  const cibleInfo = {}; const niveauxEstimes = new Set();
  if (cible) {
    const [ccx, ccz] = centreP(cible.P);
    const o = osmBat.filter((q) => q.t.building && (dansPoly(ccx, ccz, q.P) || dansPoly(0, 0, q.P))).sort((a, b) => aire(b.P) - aire(a.P))[0];
    const t = o?.t ?? {};
    const hBd = typeof cible.props.hauteur === 'number' ? cible.props.hauteur : null;
    const nOsm = num(t['building:levels']), nBd = cible.props.nombre_d_etages ?? null;
    const nEt = Math.max(1, Math.round(nOsm ?? nBd ?? (hBd ? hBd / 3 : 5)));
    const nSous = Math.round(num(t['building:levels:underground']) ?? 0);
    Object.assign(cibleInfo, { bdtopo_id: cible.id, bdtopo_hauteur_m: hBd, bdtopo_nombre_etages: nBd, bdtopo_usage_1: cible.props.usage_1 ?? null, bdtopo_usage_2: cible.props.usage_2 ?? null, osm_id: o?.id ?? null, osm_nom: t.name ?? null, osm_building: t.building ?? null, osm_levels: nOsm ?? null, niveaux_retenus: nEt, niveaux_sous_sol: nSous, distance_point_adresse_m: +distCible.toFixed(1), surface_emprise_m2: Math.round(aire(cible.P)) });
    for (let n = -nSous; n < nEt; n++) { niveauxEstimes.add(n); interieur.push({ k: 'area', l: [n], n: 'étage estimé (emprise BD TOPO)', p: aplat(cible.P), estime: true }); }
    const pl = pole(cible.P); cibleInfo.cage_estimee = { x: pl.x, z: pl.z, rayon_libre_m: +pl.d.toFixed(1) };
    const box = (cx, cz, w, h) => aplat([[cx - w / 2, cz - h / 2], [cx + w / 2, cz - h / 2], [cx + w / 2, cz + h / 2], [cx - w / 2, cz + h / 2]]);
    const lv = [...niveauxEstimes].sort((a, b) => a - b);
    for (let i = 0; i + 1 < lv.length; i++) liens.escalier.push({ id: `ESL-EST-${lv[i]}-${lv[i + 1]}`, type: 'escalier', l: [lv[i], lv[i + 1]], n: 'escalier estimé', p: box(pl.x - 1.2, pl.z, 1.2, 2.5), de: { niveau: lv[i], x: r1(pl.x - 1.2), z: r1(pl.z) }, vers: { niveau: lv[i + 1], x: r1(pl.x - 1.2), z: r1(pl.z) }, largeur_m: 1.2, etat: 'ouverte', estime: true });
    if (lv.length > 1) liens.ascenseur.push({ id: 'ASC-EST-1', type: 'ascenseur', l: [lv[0], lv.at(-1)], n: 'ascenseur estimé', p: box(pl.x + 1.2, pl.z, 1.4, 2), x: r1(pl.x + 1.2), z: r1(pl.z), de: { niveau: lv[0], x: r1(pl.x + 1.2), z: r1(pl.z) }, vers: { niveau: lv.at(-1), x: r1(pl.x + 1.2), z: r1(pl.z) }, largeur_m: 1.1, etat: 'ouverte', estime: true });
    const pc = portes.filter((p) => distBord(p.x, p.z, cible.P).d < 4);
    if (!pc.length) { const b = distBord(0, 0, cible.P); portes.push({ id: 'P-EST-ADRESSE', type: 'porte', k: 'main', n: 'entrée estimée (point adresse BAN projeté sur la façade)', x: r1(b.px), z: r1(b.pz), l: [0], largeur_m: 1.8, etat: 'ouverte', estime: true }); cibleInfo.entree_estimee = true; }
    else { cibleInfo.entree_estimee = false; cibleInfo.entrees_osm = pc.length; }
    for (const p of portes) if (distBord(p.x, p.z, cible.P).d < 4 && p.l[0] === 0) sorties.push({ id: `S-${p.id}`, genre: p.k === 'exit' || p.k === 'emergency' ? 'secours' : 'rue', ref: p.id, niveau: 0, x: p.x, z: p.z, largeur_m: p.largeur_m, etat: p.etat, hors_modele: false });
  }
  for (const m of metro) sorties.push({ id: `S-${m.id}`, genre: 'metro', ref: m.id, niveau: m.l[0], x: m.x, z: m.z, largeur_m: m.largeur_m, etat: m.etat, hors_modele: true });
  const objPar = {};
  for (const o of interieur) if (!o.estime) for (const n of o.l) objPar[n] = (objPar[n] ?? 0) + 1;
  for (const c of chemins) for (const n of c.l) objPar[n] = (objPar[n] ?? 0) + 1;
  const tousN = [...new Set([0, ...niveauxEstimes, ...Object.keys(objPar).map(Number)])].sort((a, b) => b - a);
  const niveaux = tousN.map((n) => {
    const nb = objPar[n] ?? 0, estime = niveauxEstimes.has(n) || nb < 5;
    return { niveau: n, altitude_m: +(n * ETAGE).toFixed(2), estime,
      raison: n === 0 && !niveauxEstimes.has(0) ? 'rue et rez-de-chaussée documentés (OSM, BD TOPO)' : n === 0 ? 'rue documentée (OSM, BD TOPO) ; intérieur du rez-de-chaussée estimé : emprise BD TOPO, aucun plan' : estime ? `étage estimé : emprise BD TOPO extrudée, ${nb} objet(s) intérieur(s) OSM, cage d'escalier et ascenseur supposés` : `${nb} objets intérieurs documentés dans OSM`, nb_objets_osm: nb };
  });
  const scene = { version: 1, origine: [LAT0, LON0], etage: ETAGE, rayon_rues_m: RAYON, genere: 'node pipeline/lieu/lieu.mjs', sources: ["© les contributeurs d'OpenStreetMap (ODbL)", 'Source : IGN, BD TOPO (Licence Ouverte 2.0)', 'Adresse : Géoplateforme / BAN (Licence Ouverte 2.0)'],
    lieu: { adresse: adresseTrouvee || null, lat, lon, rayon_m: RAYON, batiment_cible: cibleInfo },
    niveaux, batiments, interieur, chemins, escalators: liens.escalator, escaliers: liens.escalier, ascenseurs: liens.ascenseur, portes, metro, sorties, rues, pietons,
    parcelles: bdParc.features.map((f) => ({ id: f.properties?.idu ?? f.id, p: aplat((f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0]).map(([lo, la]) => xy(la, lo))) })),
    quais: [], voies: [], incendie: [], arbres: [], bancs: [], bornes: [], velib: [], verts: [], eau: [] };
  return { val: { scene, cible }, info: `${batiments.length} bât. · ${rues.length} rues · ${portes.length} portes · ${niveaux.length} niveaux` };
});
const { scene, cible: cibleP } = sceneEtape;
writeFileSync(join(OUT, 'scene.json'), JSON.stringify(scene));

// ---------- 4. grille praticable ----------
const ng = await etape('navgrid', async () => {
  const stats = { niveaux: [], portes_ignorees: [], liens_ignores: [] }, grilles = new Map();
  const R = RAYON + 10, niv = (l) => (l?.length ? [...new Set(l.map(niveauEntier))] : [0]);
  const empr = cibleP ? bbox(cibleP.P) : [-10, -10, 10, 10];
  for (const n of scene.niveaux.map((q) => q.niveau)) {
    if (n === 0) grilles.set(0, Grille.couvrant(-R, -R, R, R));
    else {
      let b = [...empr];
      for (const o of scene.interieur) if (o.l.includes(n) && !o.estime) for (let i = 0; i < o.p.length; i += 2) b = [Math.min(b[0], o.p[i]), Math.min(b[1], o.p[i + 1]), Math.max(b[2], o.p[i]), Math.max(b[3], o.p[i + 1])];
      grilles.set(n, Grille.couvrant(Math.max(-R, b[0] - 3), Math.max(-R, b[1] - 3), Math.min(R, b[2] + 3), Math.min(R, b[3] + 3)));
    }
  }
  const g0 = grilles.get(0);
  for (const r of scene.rues) g0.trait(r.p, r.w / 2, 1);
  for (const a of scene.pietons) g0.remplir(a.p, 1);
  for (const b of scene.batiments) g0.remplir(b.p, 0);
  for (const o of scene.interieur) { if (!['corridor', 'area'].includes(o.k)) continue; for (const n of niv(o.l)) grilles.get(n)?.remplir(o.p, o.estime ? 2 : 1); }
  for (const c of scene.chemins) for (const n of niv(c.l)) grilles.get(n)?.trait(c.p, c.w / 2, 1);
  const toutesPortes = [];
  for (const p of [...scene.portes, ...scene.metro]) {
    const n = niveauEntier(p.l[0] ?? 0), g = grilles.get(n);
    if (!g || g.indice(p.x, p.z) < 0) { stats.portes_ignorees.push(p.id); continue; }
    g.disque(p.x, p.z, 0.75, p.estime ? 2 : 1, true); toutesPortes.push({ id: p.id, type: p.type, niveau: n, x: p.x, y: p.z, largeur_m: p.largeur_m, etat: p.etat });
  }
  const liensG = [];
  for (const l of [...scene.escalators, ...scene.escaliers, ...scene.ascenseurs]) {
    const a = niveauEntier(l.de.niveau), b = niveauEntier(l.vers.niveau), ga = grilles.get(a), gb = grilles.get(b);
    if (a === b || !ga || !gb || ga.indice(l.de.x, l.de.z) < 0 || gb.indice(l.vers.x, l.vers.z) < 0) { stats.liens_ignores.push(l.id); continue; }
    ga.disque(l.de.x, l.de.z, 1.0, 2, true); gb.disque(l.vers.x, l.vers.z, 1.0, 2, true);
    liensG.push({ id: l.id, type: l.type, de: { niveau: a, x: l.de.x, y: l.de.z }, vers: { niveau: b, x: l.vers.x, y: l.vers.z }, largeur_m: l.largeur_m, etat: l.etat, estime: l.estime });
  }
  const niveaux = [];
  for (const n of scene.niveaux.map((q) => q.niveau)) {
    const g = grilles.get(n), rel = relier(g); let prat = 0, est = 0; for (const v of g.data) { if (v) prat++; if (v === 2) est++; }
    const meta = scene.niveaux.find((x) => x.niveau === n);
    stats.niveaux.push({ niveau: n, praticables: prat, dont_estimees: est, ilots_relies: rel.relies, ilots_supprimes: rel.supprimes, surface_m2: prat * CELLULE * CELLULE, estime: meta.estime, raison: meta.raison });
    niveaux.push({ niveau: n, x0: g.x0, z0: g.z0, largeur: g.largeur, hauteur: g.hauteur, rle: rle(g.data) });
  }
  const ok = (n, x, z) => { const g = grilles.get(n), i = g.indice(x, z); return i >= 0 && g.data[i] > 0; };
  const portes = toutesPortes.filter((p) => { const o = ok(p.niveau, p.x, p.y); if (!o) stats.portes_ignorees.push(p.id); return o; });
  const liens = liensG.filter((l) => { const o = ok(l.de.niveau, l.de.x, l.de.y) && ok(l.vers.niveau, l.vers.x, l.vers.y); if (!o) stats.liens_ignores.push(l.id); return o; });
  const idsP = new Set(portes.map((p) => p.id));
  const sorties = scene.sorties.filter((s) => idsP.has(s.ref)).map((s) => ({ id: s.ref, genre: s.genre, niveau: niveauEntier(s.niveau), x: s.x, y: s.z, largeur_m: s.largeur_m, etat: s.etat, hors_modele: s.hors_modele }));
  return { val: { version: 1, cellule_m: CELLULE, origine: scene.origine, niveaux, portes, liens, sorties, stats }, info: `${niveaux.length} niveaux, ${portes.length} portes, ${liens.length} liens, ${sorties.length} sorties` };
});
writeFileSync(join(OUT, 'navgrid.json'), JSON.stringify(ng));
if (imgs) writeFileSync(join(OUT, 'images.json'), JSON.stringify(imgs, null, 1));

const total = +((performance.now() - T0) / 1000).toFixed(2);
const bilan = { lieu: scene.lieu, rayon_m: RAYON, total_s: total, telechargements_paralleles_s: dureeTelechargement, cache_hits: cacheHits, etapes: journal,
  tailles_mo: { scene: +(JSON.stringify(scene).length / 1e6).toFixed(2), navgrid: +(JSON.stringify(ng).length / 1e6).toFixed(2) },
  comptes: Object.fromEntries(['batiments', 'rues', 'portes', 'metro', 'escaliers', 'ascenseurs', 'sorties', 'interieur', 'parcelles'].map((k) => [k, scene[k].length])) };
writeFileSync(join(OUT, 'journal.json'), JSON.stringify(bilan, null, 1));
console.log(`TOTAL ${total} s (téléchargements ${dureeTelechargement} s, ${cacheHits} réponse(s) en cache) -> ${OUT}`);
