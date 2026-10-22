// Tests de la logique pure : `node --test src/app/ui/logique.test.mts`
import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Node exige l'extension .mts ; tsc ne l'accepte pas sans allowImportingTsExtensions.
import * as L from './logique.mts';

const lieux = [
  { id: 'porte-a', nom: 'Porte A', type: 'porte', x: 0.2, y: 0.2 },
  { id: 'porte-b', nom: 'Porte B', type: 'porte', x: 0.8, y: 0.2 },
  { id: 'bouche-1', nom: 'Rambuteau', type: 'bouche', x: 0.7, y: 0.3 },
] as const;

test('seuils de densité : orange à 3, rouge à 4', () => {
  assert.equal(L.niveauDensite(2.99), 'normal');
  assert.equal(L.niveauDensite(3), 'orange');
  assert.equal(L.niveauDensite(3.99), 'orange');
  assert.equal(L.niveauDensite(4), 'rouge');
});

test('jauge de tension : bornée et repères alignés sur les seuils', () => {
  assert.equal(L.jaugeTension(-1).position, 0);
  assert.equal(L.jaugeTension(99).position, 1);
  const j = L.jaugeTension(4.5);
  assert.equal(j.niveau, 'rouge');
  assert.equal(j.orange, 0.5);
  assert.ok(Math.abs(j.rouge - 4 / 6) < 1e-9);
});

const brut = {
  source: 'simulation',
  total_personnes: 100,
  horizon_s: 60,
  serie: [
    { t: 30, non_sortis: 50, densite_max: 3.4, personnes_min_sup5: 0, vers_zone: 1 },
    { t: 0, non_sortis: 100, densite_max: 1, personnes_min_sup5: 0, vers_zone: 0 },
    { t: 60, non_sortis: 5, densite_max: 4.2, densite_lieu: 'Porte Lescot', personnes_min_sup5: 0, vers_zone: 2 },
  ],
  avant: { non_sortis: 9, personnes_min_sup5: 8, vers_zone: 7, temps_evacuation_s: 6 },
  apres: { non_sortis: 1, personnes_min_sup5: 1, vers_zone: 1, temps_evacuation_s: 1 },
};

test('résultats : source simulation sans badge, tout le reste en EXEMPLE', () => {
  const r = L.lireResultats(brut);
  assert.ok(r);
  assert.equal(L.badgeSource(r), null);
  assert.equal(L.badgeSource(L.lireResultats({ ...brut, source: 'exemple' })), 'EXEMPLE');
  assert.equal(L.badgeSource(L.lireResultats({ ...brut, source: 'autre chose' })), 'EXEMPLE');
  assert.equal(L.badgeSource(L.lireResultats({ ...brut, source: undefined })), 'EXEMPLE');
  assert.equal(L.badgeSource(null), 'EXEMPLE');
});

test('résultats : un fichier inexploitable est refusé', () => {
  assert.equal(L.lireResultats(null), null);
  assert.equal(L.lireResultats({ ...brut, serie: [] }), null);
  assert.equal(L.lireResultats({ ...brut, avant: {} }), null);
  assert.equal(L.lireResultats({ ...brut, total_personnes: 'x' }), null);
});

test('série triée, point lu au dernier t atteint, alertes au premier franchissement', () => {
  const r = L.lireResultats(brut)!;
  assert.deepEqual(r.serie.map((p: { t: number }) => p.t), [0, 30, 60]);
  assert.equal(L.pointA(r, 45).t, 30);
  assert.equal(L.pointA(r, -5).t, 0);
  const a = L.alertesDepuisSerie(r.serie);
  assert.deepEqual(a.map((x: { niveau: string; t: number }) => [x.niveau, x.t]), [['orange', 30], ['rouge', 60]]);
  assert.match(a[1].texte, /4,2 pers\.\/m² · Porte Lescot/);
  assert.deepEqual(L.alertesDepuisSerie([r.serie[0]]), []);
});

test('perturbations : un lieu du bon type est exigé, les zones exigent une position', () => {
  const p = L.creerPerturbation('C1', { lieu: lieux[2] }, 1)!;
  assert.equal(p.lieuId, 'bouche-1');
  assert.equal(L.creerPerturbation('C1', { lieu: lieux[0] }, 2), null);
  assert.equal(L.creerPerturbation('D1', {}, 3), null);
  assert.equal(L.creerPerturbation('D5', { x: 0.5, y: 0.5 }, 4)!.code, 'D5');
  assert.equal(L.creerPerturbation('F1', { delai_s: 0 }, 5), null);
  assert.equal(L.creerPerturbation('F1', { delai_s: 90 }, 6)!.delai_s, 90);
});

test('le catalogue couvre C1, B1, B3, B5, D1, D2, D5, F1', () => {
  assert.deepEqual(L.CATALOGUE.map((d: { code: string }) => d.code), ['C1', 'B1', 'B3', 'B5', 'D1', 'D2', 'D5', 'F1']);
});

test('événement contrainte : position et délai présents seulement quand ils existent', () => {
  const p = L.creerPerturbation('D1', { x: 0.6, y: 0.3 }, 7)!;
  const c = L.versContrainte(p, 'pose', 120);
  assert.deepEqual(c, { etat: 'pose', code: 'D1', id: 'D1-7', nom: 'Manifestation', position: { x: 0.6, y: 0.3 }, t: 120 });
  const f = L.versContrainte(L.creerPerturbation('F1', { delai_s: 45 }, 8)!, 'levee', 0);
  assert.equal(f.delai_s, 45);
  assert.equal('position' in f, false);
});

test('compteurs de leviers : un lieu visé compte comme fermé', () => {
  const p = L.creerPerturbation('C1', { lieu: lieux[2] }, 1)!;
  const c = L.compteursLeviers(lieux, [p]);
  assert.deepEqual(c.bouche, { ouverts: 0, total: 1 });
  assert.deepEqual(c.porte, { ouverts: 2, total: 2 });
});

test('lieu le plus proche : rien au-delà de la distance maximale', () => {
  assert.equal(L.lieuLePlusProche(lieux, 0.21, 0.2)?.id, 'porte-a');
  assert.equal(L.lieuLePlusProche(lieux, 0.5, 0.5), null);
});

test('état des onglets : neutre tant que rien ne cloche', () => {
  const calme = { propositionsEnAttente: 0, decisionsRegistre: 0, perturbationsActives: 0, niveau: 'normal' as const };
  for (const o of L.ONGLETS) assert.deepEqual(L.etatOnglet(o.id, calme), { pastille: null, ton: 'neutre' });
  const chaud = { propositionsEnAttente: 3, decisionsRegistre: 2, perturbationsActives: 1, niveau: 'rouge' as const };
  assert.deepEqual(L.etatOnglet('directeur', chaud), { pastille: 3, ton: 'ambre' });
  assert.deepEqual(L.etatOnglet('agir', chaud), { pastille: 1, ton: 'rouge' });
  assert.deepEqual(L.etatOnglet('simuler', chaud), { pastille: null, ton: 'rouge' });
  assert.equal(L.etatOnglet('simuler', { ...chaud, niveau: 'orange' }).ton, 'ambre');
  assert.equal(L.etatOnglet('dispositif', chaud).pastille, 2);
});

test('onglet mémorisé invalide : retour à Directeur', () => {
  assert.equal(L.ongletValide('voir'), 'voir');
  assert.equal(L.ongletValide('nimporte'), 'directeur');
  assert.equal(L.ongletValide(null), 'directeur');
});

test('appel serveur : serveur absent ou erreur donne un message, jamais une exception', async () => {
  const refuse = async () => {
    throw new TypeError('fetch failed');
  };
  const r1 = await L.appelerApi('/api/directeur', { texte: 'x' }, refuse);
  assert.equal(r1.ok, false);
  assert.match(r1.message, /injoignable/);
  const r2 = await L.appelerApi('/api/agents', {}, async () => ({ ok: false, status: 404, json: async () => ({}) }));
  assert.equal(r2.ok, false);
  assert.match(r2.message, /ne propose pas encore/);
  const r3 = await L.appelerApi('/api/agents', {}, async () => ({ ok: true, status: 200, json: async () => { throw new Error('html'); } }));
  assert.equal(r3.ok, false);
  assert.match(r3.message, /illisible/);
  const r4 = await L.appelerApi('/api/agents', {}, async () => ({ ok: true, status: 200, json: async () => ({ a: 1 }) }));
  assert.deepEqual(r4, { ok: true, data: { a: 1 } });
});

test('appel serveur : délai dépassé', async () => {
  const lent = (_u: string, init: { signal?: AbortSignal }) => new Promise<never>((_, rej) => init.signal?.addEventListener('abort', () => rej(new Error('abort'))));
  const r = await L.appelerApi('/api/directeur', {}, lent, 20);
  assert.equal(r.ok, false);
  assert.match(r.message, /ne répond pas/);
});

test('formats', () => {
  assert.equal(L.formatT(252), 'T+04:12');
  assert.equal(L.phraseDelai(30), 'effet après 30 s');
  assert.equal(L.phraseDelai(300), 'effet après 5 min');
  assert.equal(L.phraseDelai(0), 'effet immédiat');
  assert.equal(L.phraseDelai(null), '');
});
