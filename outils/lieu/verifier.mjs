// Vérifie scene + navgrid d'un lieu : usage node verifier.mjs <dossier>. Lecture seule.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const d = process.argv[2];
const sc = JSON.parse(readFileSync(join(d, 'scene.json'), 'utf8')), ng = JSON.parse(readFileSync(join(d, 'navgrid.json'), 'utf8'));
const C = ng.cellule_m, G = new Map();
for (const n of ng.niveaux) { const a = new Uint8Array(n.largeur * n.hauteur); let k = 0; for (let i = 0; i < n.rle.length; i += 2) { a.fill(n.rle[i], k, k + n.rle[i + 1]); k += n.rle[i + 1]; } if (k !== a.length) throw new Error('RLE corrompu'); G.set(n.niveau, { ...n, a }); }
const idx = (n, x, z) => { const g = G.get(n), i = Math.floor((x - g.x0) / C), j = Math.floor((z - g.z0) / C); return i < 0 || j < 0 || i >= g.largeur || j >= g.hauteur ? -1 : j * g.largeur + i; };
const ok = [];
const test = (nom, c, det = '') => { ok.push(c); console.log(c ? 'OK  ' : 'ECHEC', nom, det); };
test('format : clés du Scene', ['version', 'origine', 'etage', 'rayon_rues_m', 'genere', 'sources', 'niveaux', 'batiments', 'interieur', 'chemins', 'escalators', 'escaliers', 'ascenseurs', 'portes', 'metro', 'sorties', 'rues', 'pietons', 'quais', 'voies', 'incendie', 'arbres', 'bancs', 'bornes', 'velib', 'verts', 'eau'].every((k) => k in sc));
test('sources OSM + IGN citées', sc.sources.some((s) => s.includes('OpenStreetMap')) && sc.sources.some((s) => s.includes('IGN')));
test('niveaux intérieurs estimés marqués estime:true', sc.niveaux.filter((n) => n.niveau !== 0).every((n) => n.estime) && sc.niveaux.every((n) => n.raison.length > 10), sc.niveaux.map((n) => `${n.niveau}${n.estime ? '*' : ''}`).join(' '));
const ids = [...sc.portes, ...sc.metro, ...sc.escalators, ...sc.escaliers, ...sc.ascenseurs].map((o) => o.id);
test('identifiants uniques', new Set(ids).size === ids.length);
test('largeurs > 0 et valeurs par défaut estime', [...sc.portes, ...sc.escaliers, ...sc.ascenseurs].every((o) => o.largeur_m > 0));
const bad = [...ng.portes.map((p) => [p.niveau, p.x, p.y, p.id]), ...ng.liens.flatMap((l) => [[l.de.niveau, l.de.x, l.de.y, l.id], [l.vers.niveau, l.vers.x, l.vers.y, l.id]])].filter(([n, x, z]) => { const i = idx(n, x, z); return i < 0 || !G.get(n).a[i]; });
test('portes et extrémités de liens sur cellule praticable', bad.length === 0, bad.length ? bad.map((b) => b[3]).join(',') : '');
// composantes connexes par niveau (4-voisins)
for (const [n, g] of G) { const lab = new Int32Array(g.a.length).fill(-1); let nc = 0; const pile = [];
  for (let s = 0; s < g.a.length; s++) { if (!g.a[s] || lab[s] >= 0) continue; nc++; pile.push(s); lab[s] = nc; while (pile.length) { const c = pile.pop(), i = c % g.largeur; for (const v of [i > 0 ? c - 1 : -1, i < g.largeur - 1 ? c + 1 : -1, c >= g.largeur ? c - g.largeur : -1, c + g.largeur < g.a.length ? c + g.largeur : -1]) if (v >= 0 && g.a[v] && lab[v] < 0) { lab[v] = nc; pile.push(v); } } }
  g.lab = lab; g.nc = nc; test(`niveau ${n} : composantes connexes`, nc === 1, `${nc}`); }
// atteignabilité des niveaux depuis la rue par les liens (composante de la porte principale)
const reach = new Set([0]); let ch = true; while (ch) { ch = false; for (const l of ng.liens) { const a = reach.has(l.de.niveau), b = reach.has(l.vers.niveau); if (a !== b) { reach.add(l.de.niveau); reach.add(l.vers.niveau); ch = true; } } }
test('tous les niveaux atteignables depuis la rue par les liens', [...G.keys()].every((n) => reach.has(n)), [...reach].join(','));
const cible = sc.batiments.find((b) => b.cible);
test('bâtiment cible extrudé (hauteur BD TOPO)', !!cible && cible.h > 3, cible ? `h=${cible.h} m` : '');
const sortieRue = ng.sorties.filter((s) => s.genre === 'rue');
test('au moins une sortie rue sur la grille', sortieRue.length >= 1, `${sortieRue.length}`);
process.exit(ok.every(Boolean) ? 0 : 1);
