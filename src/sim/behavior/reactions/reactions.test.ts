// Tests du lot « preuve-reactions » : faux fournisseur, aucun réseau, aucune clé.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { IDS_REACTIONS, REACTIONS, reaction } from './catalogue.ts';
import { CONSIGNE, PROFILS, SITUATIONS } from './consigne.ts';
import { lancerExperience } from './experience.ts';
import { analyserReponse, empreinte, reagir, type Fournisseur } from './fournisseur.ts';
import { appliquerInfluence, BONUS_MAX, BORNES_DELAI, PLAFOND_ADOPTION } from './influence.ts';
import { MODELES } from './modeles.ts';
import { creerRng } from '../rng.ts';

const situation = SITUATIONS[0];
const profil = PROFILS[0];
const dossierTemp = (): string => mkdtempSync(join(tmpdir(), 'reactions-'));

test('catalogue : 15 réactions, descriptions neutres, effets sourcés', () => {
  assert.equal(REACTIONS.length, 15);
  assert.equal(new Set(IDS_REACTIONS).size, 15);
  assert.ok(!/panique/i.test(CONSIGNE), 'le mot « panique » ne doit pas être dans la consigne');
  for (const r of REACTIONS) assert.ok(r.effet.source.length > 0, r.id);
  assert.equal(reaction('inconnue').id, 'autre');
});

test('consigne : 20 profils, 10 situations', () => {
  assert.equal(PROFILS.length, 20);
  assert.equal(SITUATIONS.length, 10);
  assert.equal(new Set(MODELES.map((m) => m.origine)).size, 3);
  assert.ok(MODELES.length >= 8 && MODELES.length <= 10);
});

test('validation : réponse correcte', () => {
  const c = analyserReponse('{"action":"suivre_consigne","issue":"lescot","intensite":0.8,"raison":"je suis les annonces"}', situation);
  assert.equal(c.statut, 'ok');
  assert.equal(c.action, 'suivre_consigne');
  assert.equal(c.issue, 'lescot');
  assert.equal(c.intensite, 0.8);
});

test('validation : action hors liste devient « autre » et est consignée', () => {
  const c = analyserReponse('```json\n{"action":"hurler","issue":"nulle_part","intensite":3,"raison":"x"}\n```', situation);
  assert.equal(c.statut, 'hors_liste');
  assert.equal(c.action, 'autre');
  assert.equal(c.action_brute, 'hurler');
  assert.equal(c.issue, null);
  assert.equal(c.intensite, 1);
});

test('validation : JSON cassé et raison trop longue', () => {
  assert.equal(analyserReponse('désolé, je ne peux pas', situation).statut, 'json_casse');
  assert.equal(analyserReponse('{"action": "aider", ', situation).statut, 'json_casse');
  assert.equal(analyserReponse('{"pas_action": 1}', situation).statut, 'json_casse');
  const longue = Array.from({ length: 30 }, (_, i) => `m${i}`).join(' ');
  const c = analyserReponse(JSON.stringify({ action: 'aider', issue: null, intensite: 0.5, raison: longue }), situation);
  assert.equal(c.raison.split(' ').length, 20);
});

test('cache : le second appel ne touche pas le fournisseur', async () => {
  const dossierCache = dossierTemp();
  let appels = 0;
  const faux: Fournisseur = async () => {
    appels++;
    return { texte: '{"action":"s_informer","issue":null,"intensite":0.4,"raison":"je regarde"}' };
  };
  const a = await reagir({ modele: 'm/x', profil, situation, fournisseur: faux, dossierCache });
  const b = await reagir({ modele: 'm/x', profil, situation, fournisseur: faux, dossierCache });
  assert.equal(appels, 1);
  assert.equal(a.du_cache, false);
  assert.equal(b.du_cache, true);
  assert.deepEqual(a.choix, b.choix);
  assert.notEqual(empreinte('m/x', profil, situation), empreinte('m/y', profil, situation));
  // hors ligne sans cache : aucune réponse, aucun appel
  const c = await reagir({ modele: 'm/autre', profil, situation, fournisseur: faux, horsLigne: true, dossierCache });
  assert.equal(c.choix.statut, 'absent');
  assert.equal(appels, 1);
});

test('expérience en mode hors ligne sur réponses factices : produit le tableau et resultats.json', async () => {
  const dossierCache = dossierTemp();
  const modeles = MODELES.slice(0, 3);
  const actions = ['suivre_consigne', 'aider', 'hurler', 'fuite_precipitee'];
  let k = 0;
  const faux: Fournisseur = async () => ({ texte: k++ % 7 === 0 ? 'pas du json' : `{"action":"${actions[k % 4]}","issue":"lescot","intensite":0.5,"raison":"test"}` });
  const options = { modeles, nbProfils: 1, dossierCache, ecrire: () => {} };
  await lancerExperience({ ...options, fournisseur: faux });
  const lignes: string[] = [];
  const tous = await lancerExperience({ ...options, horsLigne: true, ecrire: (l) => lignes.push(l) });
  const sortie = lignes.join('\n');
  assert.equal(tous.length, 30);
  assert.ok(tous.every((c) => c.choix.statut !== 'absent'));
  assert.match(sortie, /== 1\. Par modèle ==/);
  assert.match(sortie, /== 2\. Par famille/);
  assert.match(sortie, /suivre_consigne/);
  assert.match(sortie, /invalides/);
  assert.match(sortie, /Littérature/);
  assert.match(sortie, /\[\?\]/);
  assert.ok(existsSync(join(dossierCache, 'resultats.json')));
  const j = JSON.parse(readFileSync(join(dossierCache, 'resultats.json'), 'utf8'));
  assert.equal(j.nb_cas, 30);
});

test('influence : respecte le rayon et les bornes', () => {
  const source = { id: 's', x: 0, y: 0, reaction: 'donner_un_ordre', issue: 'lescot', intensite: 1 };
  const voisins = [
    { id: 'proche', x: 3, y: 0, confiance: 1 },
    { id: 'loin', x: 5.01, y: 0, confiance: 1 },
    { id: 's', x: 0, y: 0, confiance: 1 },
  ];
  // rayon 5 m : « loin » est dehors, la source ne s'influence pas elle-même
  let adoptants = 0;
  for (let graine = 0; graine < 200; graine++) {
    const r = appliquerInfluence(source, voisins, creerRng(graine));
    assert.ok(r.every((e) => e.id === 'proche'));
    for (const e of r) {
      assert.ok(e.bonus_issue <= BONUS_MAX);
      assert.ok(e.mult_delai >= BORNES_DELAI[0] && e.mult_delai <= BORNES_DELAI[1]);
      assert.equal(e.issue, 'lescot');
    }
    adoptants += r.length;
  }
  const p = adoptants / 200;
  assert.ok(p > 0.25 && p < 0.55, `proba observée ${p} proche de 0,4`);
  // confiance nulle ou intensité nulle : personne n'adopte ; réaction sans contagion : rien
  assert.equal(appliquerInfluence(source, [{ id: 'a', x: 1, y: 0, confiance: 0 }], creerRng(1)).length, 0);
  assert.equal(appliquerInfluence({ ...source, intensite: 0 }, voisins, creerRng(1)).length, 0);
  assert.equal(appliquerInfluence({ ...source, reaction: 'choisir_seul' }, voisins, creerRng(1)).length, 0);
  // plafond d'adoption : 0,9 même si proba x confiance dépasse
  assert.ok(PLAFOND_ADOPTION <= 0.9);
});
