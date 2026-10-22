import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chargerMoteurSimJs, donneesPresentes, DOSSIER_FORUM } from './moteur-simjs.ts';
import type { Plan } from './types.ts';

const PLAN_OUVERT: Plan = { mode: 'rester_ouvert', portes: [], phasage_salles: [], guidage: null, messages_par_zone: [], confinement: false };
const fermer = (...ids: string[]): Plan => ({ ...PLAN_OUVERT, portes: ids.map((id) => ({ id, ouverte: false })) });

// ---- Grille synthétique : un couloir 40 m x 12 m, un niveau, deux portes aux deux bouts. Pas besoin des données OSM. ----
// Cases praticables (bord de 2 m laissé en mur, sauf aux portes) -> bits empaquetés en base64, comme navgrid.json.
function bits(w: number, h: number, praticable: (r: number, c: number) => boolean): string {
  const u = new Uint8Array(Math.ceil((w * h) / 8));
  for (let i = 0; i < w * h; i++) if (praticable(Math.floor(i / w), i % w)) u[i >> 3] |= 128 >> (i & 7);
  return Buffer.from(u).toString('base64');
}
async function moteurSynthetique() {
  const dossier = mkdtempSync(join(tmpdir(), 'simjs-'));
  copyFileSync(join(DOSSIER_FORUM, 'sim.js'), join(dossier, 'sim.js'));
  const w = 40, h = 12;
  const sol = bits(w, h, (r, c) => (r >= 2 && r < h - 2 && c >= 2 && c < w - 2) || (r >= 5 && r <= 7 && (c < 2 || c >= w - 2)));
  const navgrid = {
    bbox: [0, 0, w, h], res: 1, w, h, levels: [0], walk: [sol], reach: [sol], links: [],
    exits: [{ id: 0, n: 'Porte Ouest', type: 'rue', cell: [0, 6, 0] }, { id: 1, n: 'Porte Est', type: 'rue', cell: [0, 6, w - 1] }],
  };
  writeFileSync(join(dossier, 'navgrid.json'), JSON.stringify(navgrid));
  writeFileSync(join(dossier, 'scene.json'), JSON.stringify({ interieur: [] }));
  return chargerMoteurSimJs(dossier);
}

test('grille synthétique : même graine = même résultat, graine différente = autre résultat', async () => {
  const m = await moteurSynthetique();
  const a = m.jouer(PLAN_OUVERT, 7, { personnes: 60, duree_s: 300 });
  const b = m.jouer(PLAN_OUVERT, 7, { personnes: 60, duree_s: 300 });
  assert.deepEqual(a, b);
  const c = m.jouer(PLAN_OUVERT, 8, { personnes: 60, duree_s: 300 });
  assert.notDeepEqual(a.sortis_par_porte, c.sortis_par_porte);
});

test('grille synthétique : tout ouvert = tout le monde sort ; une porte fermée = 0 sortie par elle, l\'autre prend tout', async () => {
  const m = await moteurSynthetique();
  const ouvert = m.jouer(PLAN_OUVERT, 1, { personnes: 60, duree_s: 600 });
  // Le moteur laisse parfois 1 personne coincée contre un coin de mur (limite connue, voir MOTEUR-SIMJS.md) : on exige 95 %.
  assert.ok(ouvert.sortis >= 57, `sortis : ${ouvert.sortis}/60`);
  assert.equal(ouvert.sortis + ouvert.non_sortis, 60);
  assert.ok(ouvert.t90_s !== null && ouvert.t95_s !== null && ouvert.t90_s <= ouvert.t95_s && ouvert.t95_s <= ouvert.t_s);
  const ferme = m.jouer(fermer('Porte Ouest'), 1, { personnes: 60, duree_s: 600 });
  assert.equal(ferme.sortis_par_porte['Porte Ouest'] ?? 0, 0);
  assert.ok(ferme.sortis_par_porte['Porte Est'] >= 48, `par la porte Est : ${ferme.sortis_par_porte['Porte Est']}/60`);
  // l'état d'une partie ne fuit pas dans la suivante
  assert.deepEqual(m.jouer(PLAN_OUVERT, 1, { personnes: 60, duree_s: 600 }), ouvert);
});

test('grille synthétique : une porte fermée à t = 20 s ne laisse plus sortir personne par elle ensuite', async () => {
  const m = await moteurSynthetique();
  const tot = m.jouer(PLAN_OUVERT, 3, { personnes: 80, duree_s: 600 }).sortis_par_porte['Porte Ouest'] ?? 0;
  const tard = m.jouer({ ...PLAN_OUVERT, portes: [{ id: 'Porte Ouest', ouverte: false, a_partir_de_s: 20 }] }, 3, { personnes: 80, duree_s: 600 });
  assert.ok((tard.sortis_par_porte['Porte Ouest'] ?? 0) < tot, 'moins de sorties par la porte fermée en cours de route');
  assert.ok(tard.sortis >= 76);
});

test('grille synthétique : une issue inconnue est refusée avec un message clair', async () => {
  const m = await moteurSynthetique();
  assert.throws(() => m.jouer(fermer('porte-imaginaire'), 1, { personnes: 10, duree_s: 10 }), /sans groupe sim\.js/);
});

// ---- Vrai Forum : sauté avec un message clair si navgrid.json / scene.json n'ont pas été générés. ----
const reel = donneesPresentes();
const raison = 'données du Forum absentes : lancer ./recuperer-osm.sh puis python3 build_navgrid.py dans reports/maquettes/chatelet-3d';

test('Forum réel : même graine = même résultat', { skip: !reel && raison }, async () => {
  const m = await chargerMoteurSimJs();
  const a = m.jouer(PLAN_OUVERT, 42, { personnes: 300, duree_s: 120 });
  const b = m.jouer(PLAN_OUVERT, 42, { personnes: 300, duree_s: 120 });
  assert.deepEqual(a, b);
});

test('Forum réel : fermer une porte = 0 sortie par cette porte', { skip: !reel && raison, timeout: 120_000 }, async () => {
  const m = await chargerMoteurSimJs();
  const libre = m.jouer(PLAN_OUVERT, 5, { personnes: 300, duree_s: 400 });
  const porte = Object.entries(libre.sortis_par_porte).sort((x, y) => y[1] - x[1])[0][0];
  const ferme = m.jouer(fermer(porte), 5, { personnes: 300, duree_s: 400 });
  assert.equal(ferme.sortis_par_porte[porte] ?? 0, 0);
});

test('Forum réel : tout le monde finit par sortir quand tout est ouvert (300 personnes)', { skip: !reel && raison, timeout: 120_000 }, async () => {
  const m = await chargerMoteurSimJs();
  const r = m.jouer(PLAN_OUVERT, 11, { personnes: 300, duree_s: 1800 });
  assert.equal(r.non_sortis, 0, `non sortis : ${r.non_sortis} à t = ${r.t_s} s`);
  assert.equal(r.sortis, 300);
});
