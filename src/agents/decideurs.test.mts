// Tests du lot « decideurs ». Lancer : node --test src/agents/decideurs.test.ts  (Node 24, types supprimés à l'exécution).
// Aucun réseau : fetch est remplacé par une fonction qui échoue, aucune clé n'est lue ni fournie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LEVIERS, leviersDe, appliquerActions, etatInitial, verifierPlan } from './leviers.ts';
import { DECIDEURS, PORTES } from './types.ts';
import type { Action, Decideur, Journal } from './types.ts';
import { lireReponse, schemaReponse } from './questions.ts';
import { lancerBoucle, clientsHeuristiques, comparerNotes } from './boucle.ts';
import { FauxSimulateur, scenarioDeTest } from './fausse-sim.ts';
import { StockageMemoire } from './stockage.ts';
import { verifierChiffres, extraireNombres } from './verificateur.ts';
import {
  RedacteurGabarit, RedacteurRejeu, RedacteurEnregistreur, RedacteurClaude, RedacteurClaudeCli,
  ErreurRejeuAbsent, ErreurChiffres, demandeExplication, demandeOrdre, redigerVerifie,
} from './redacteur.ts';
import { AnalysteDeterministe, StockageRexMemoire, verifierLecon, leconsPertinentes } from './rex.ts';
import type { RexCrise } from './rex.ts';
import { ClientJev, TransportRejeuJev, TransportHttpJev, cleDeRequete, valeurDecidee, SPECS_JEV, MODELE_JEV } from './jev.ts';
import type { RequeteJev, ReponseSystemOne, TransportJev } from './jev.ts';

// Garde-fou global : tout appel réseau fait échouer le test.
let appelsReseau = 0;
globalThis.fetch = (async () => { appelsReseau++; throw new Error('RÉSEAU INTERDIT DANS LES TESTS'); }) as typeof fetch;

const REX: RexCrise[] = [
  { id: 'r1', enseigne: 'Fnac', zone: 'niveau_-1', type_incident: 'evacuation_magasin', date: '2025-03-02', duree_min: 12, description: 'alarme technique', mesures: ['annonce'], efficace: true },
  { id: 'r2', enseigne: 'Sephora', zone: 'niveau_-1', type_incident: 'evacuation_magasin', date: '2025-06-14', duree_min: 18, description: 'colis suspect', mesures: ['agents'], efficace: false },
  { id: 'r3', enseigne: 'UGC', zone: 'ugc', type_incident: 'evacuation_cinema', date: '2026-10-19', duree_min: 40, description: 'couvre-feu', mesures: ['annonce vocale'], efficace: true },
];

async function jouer(clients = clientsHeuristiques(), minutes = 20, lecons: Awaited<ReturnType<AnalysteDeterministe['analyser']>> = []) {
  const stockage = new StockageMemoire();
  const sim = new FauxSimulateur();
  const journal = await lancerBoucle({ simulateur: sim, scenario: scenarioDeTest(), clients, stockage, minutes, lecons });
  return { journal, stockage, sim };
}

// ---------------- Leviers respectés ----------------
test('chaque décideur a un menu non vide, chaque levier est sourcé et son exemple est accepté', () => {
  const sc = scenarioDeTest();
  for (const d of DECIDEURS) assert.ok(leviersDe(d).length >= 1, `menu vide pour ${d}`);
  for (const l of LEVIERS) {
    assert.match(l.source, /contraintes-forum-des-halles/, `source manquante : ${l.id}`);
    const r = appliquerActions(etatInitial(), [{ decideur: l.decideur, levier: l.id, valeur: l.exemple }], { scenario: sc });
    assert.deepEqual(r.refusees, [], `exemple refusé pour ${l.decideur}/${l.id}`);
  }
});

test('un levier d\'un autre décideur, une valeur hors domaine ou une alarme générale sont refusés', () => {
  const sc = scenarioDeTest();
  const essais: Action[] = [
    { decideur: 'ratp', levier: 'porte', valeur: { porte: 'berger', etat: 'fermee' } },                   // levier du directeur
    { decideur: 'directeur', levier: 'mode', valeur: 'tout_brûler' },                                       // hors domaine
    { decideur: 'ratp', levier: 'heure_fermeture_stations', valeur: 1400 },                                 // après 22 h
    { decideur: 'securite_centre', levier: 'message_zone', valeur: { zone: 'z', texte: 'Alarme générale : sortez' } },
    { decideur: 'securite_centre', levier: 'guidage', valeur: { point: 'p', agents: 999 } },               // plus que l'effectif
    { decideur: 'directeur', levier: 'inconnu', valeur: 1 },
  ];
  const r = appliquerActions(etatInitial(), essais, { scenario: sc });
  assert.equal(r.acceptees.length, 0);
  assert.equal(r.refusees.length, essais.length);
});

test('le plan garde au moins 4 portes ouvertes hors mode fermer et reste valide', () => {
  const sc = scenarioDeTest();
  const actions: Action[] = PORTES.map((p) => ({ decideur: 'directeur' as Decideur, levier: 'porte', valeur: { porte: p, etat: 'fermee' } }));
  const r = appliquerActions(etatInitial(), actions, { scenario: sc });
  const ouvertes = Object.values(r.etat.plan.portes).filter((e) => e === 'ouverte').length;
  assert.equal(ouvertes, 4);
  assert.deepEqual(verifierPlan(r.etat.plan, sc), []);
  const f = appliquerActions(r.etat, [{ decideur: 'directeur', levier: 'mode', valeur: 'fermer' }, { decideur: 'directeur', levier: 'porte', valeur: { porte: 'lescot', etat: 'fermee' } }], { scenario: sc });
  assert.equal(f.refusees.length, 0, 'en mode fermer, toutes les portes peuvent fermer');
});

// ---------------- Questions typées ----------------
test('le schéma de réponse de chaque décideur n\'autorise que son menu', () => {
  for (const d of DECIDEURS) {
    const ids = leviersDe(d).map((l) => l.id).sort();
    const schema = schemaReponse(d) as { properties: { actions: { items: { oneOf: { properties: { levier: { const: string } } }[] } } } };
    assert.deepEqual(schema.properties.actions.items.oneOf.map((o) => o.properties.levier.const).sort(), ids);
  }
  assert.deepEqual(lireReponse('ratp', { actions: [{ levier: 'mode', valeur: 'fermer' }] }).actions, []);
  assert.equal(lireReponse('ratp', { actions: [{ levier: 'correspondances', valeur: true }] }).actions.length, 1);
});

// ---------------- Boucle ----------------
test('la boucle décide, simule et note à chaque minute simulée, avec tableau commun', async () => {
  const { journal, stockage, sim } = await jouer(clientsHeuristiques(), 15);
  assert.ok(journal.entrees.length >= 5 && journal.entrees.length <= 15);
  assert.equal(sim.appels, journal.entrees.length, 'une minute simulée par tour');
  assert.equal((await stockage.lister()).length, journal.entrees.length * 4, 'quatre décideurs par minute');
  assert.equal((await stockage.lister({ decideur: 'directeur', minute: 1160 })).length, 1);
  for (const e of journal.entrees) assert.deepEqual(verifierPlan(e.plan, journal.scenario), []);
  assert.equal(journal.entrees[0].plan.mode, 'fermer_par_etapes');
});

test('la boucle est déterministe pour une même graine', async () => {
  const a = await jouer(clientsHeuristiques(), 10);
  const b = await jouer(clientsHeuristiques(), 10);
  assert.deepEqual(a.journal, b.journal);
});

test('fermer les portes du périmètre réduit les sortis vers la zone de danger (ordre de grille d\'Adem)', async () => {
  const sansRien = Object.fromEntries(DECIDEURS.map((d) => [d, { decider: async () => ({ actions: [] }) }])) as unknown as ReturnType<typeof clientsHeuristiques>;
  const base = await jouer(sansRien, 12);
  const defendu = await jouer(clientsHeuristiques(), 12);
  const nb = base.journal.entrees.at(-1)!.note;
  const nd = defendu.journal.entrees.at(-1)!.note;
  assert.ok(nd.sortis_vers_zone_danger < nb.sortis_vers_zone_danger);
  assert.ok(comparerNotes({ ...nd, non_sortis: 0 }, { ...nb, non_sortis: 0 }) < 0);
  // L'ordre : non-sortis d'abord, puis zone de danger, puis écrasement.
  const a = { ...nb, non_sortis: 1, sortis_vers_zone_danger: 99, ecrasement_personnes_minutes: 99 };
  const b = { ...nb, non_sortis: 2, sortis_vers_zone_danger: 0, ecrasement_personnes_minutes: 0 };
  assert.ok(comparerNotes(a, b) < 0);
});

test('une action hors menu renvoyée par un client est refusée et tracée, sans casser la boucle', async () => {
  const clients = clientsHeuristiques();
  clients.ratp = { decider: async () => ({ actions: [{ levier: 'porte', valeur: { porte: 'berger', etat: 'fermee' } }] }) };
  const { stockage } = await jouer(clients, 2);
  const lignes = await stockage.lister({ decideur: 'ratp' });
  assert.ok(lignes.every((l) => l.actions_acceptees.length === 0 && l.actions_refusees.length >= 1));
});

// ---------------- Vérificateur de chiffres ----------------
test('le vérificateur retrouve 100 % des chiffres d\'un texte généré à partir du journal', async () => {
  const { journal } = await jouer(clientsHeuristiques(), 15);
  const g = new RedacteurGabarit();
  const expl = await redigerVerifie(g, demandeExplication(journal), journal);
  assert.equal(expl.rapport.taux, 1);
  assert.ok(expl.rapport.total >= 8);
  for (const zone of Object.keys(journal.entrees.at(-1)!.etat.par_zone)) {
    const o = await redigerVerifie(g, demandeOrdre(journal, zone), journal);
    assert.equal(o.rapport.taux, 1, o.texte.texte);
    assert.ok(o.texte.porteur);
  }
});

test('le vérificateur rend les chiffres non retrouvés et rejette un texte inventé', async () => {
  const { journal } = await jouer(clientsHeuristiques(), 5);
  const r = verifierChiffres('Le plan évacue 4242 personnes en 17 minutes.', journal);
  assert.equal(r.ok, false);
  assert.deepEqual(r.non_retrouves.map((n) => n.valeur), [4242, 17]);
  const mauvais = { rediger: async () => ({ type: 'explication' as const, texte: 'Il reste 123456 personnes.', origine: 'gabarit' as const }) };
  await assert.rejects(redigerVerifie(mauvais, demandeExplication(journal), journal, { repli: false }), ErreurChiffres);
});

test('le vérificateur lit les formats français (milliers, virgule, heures)', () => {
  const j = { a: 3000, b: 6.5, c: 1160, d: 1320, e: -2 };
  assert.equal(verifierChiffres('3 000 personnes, 6,5 pers./m², annonce à 19 h 20, stations à 22 h, niveau -2', j).ok, true);
  assert.equal(verifierChiffres('annonce à 19 h 25', j).ok, false);
  assert.deepEqual(extraireNombres('3 000 et 12,5').map((n) => n.valeur), [3000, 12.5]);
});

// ---------------- Rédacteur : rejeu sans réseau ----------------
test('le rejeu relit le cache fichier sans aucun réseau et échoue si la demande est absente', async () => {
  const { journal } = await jouer(clientsHeuristiques(), 8);
  const dossier = mkdtempSync(join(tmpdir(), 'rejeu-'));
  const chemin = join(dossier, 'cache.json');
  const rejeu = new RedacteurRejeu(chemin);
  const remplisseur = new RedacteurEnregistreur(new RedacteurGabarit(), rejeu);
  const demandes = [demandeExplication(journal), demandeOrdre(journal, 'ugc')];
  const attendus = [];
  for (const d of demandes) attendus.push(await remplisseur.rediger(d));
  const relu = new RedacteurRejeu(chemin); // nouveau processus simulé : relit le fichier
  assert.equal(relu.taille, 2);
  for (const [i, d] of demandes.entries()) {
    const t = await relu.rediger(d);
    assert.equal(t.texte, attendus[i].texte);
    assert.equal(t.origine, 'rejeu');
    assert.equal(verifierChiffres(t.texte, journal).taux, 1);
  }
  await assert.rejects(relu.rediger(demandeOrdre(journal, 'niveau_0')), ErreurRejeuAbsent);
  assert.equal(appelsReseau, 0);
});

test('les implémentations Claude refusent de démarrer sans accord, sans clé, et ne touchent jamais le réseau', async () => {
  assert.throws(() => new RedacteurClaude({ autorise_payant: false, env: {} }), /non autorisé/);
  assert.throws(() => new RedacteurClaude({ autorise_payant: true, env: {} }), /ANTHROPIC_API_KEY absente/);
  assert.throws(() => new RedacteurClaudeCli({ autorise: false }), /non autorisé/);
  assert.throws(() => new TransportHttpJev({ autorise_payant: false, env: {} }), /non autorisé/);
  assert.throws(() => new TransportHttpJev({ autorise_payant: true, env: {} }), /TYPESAFE_API_KEY absente/);
  // La version CLI s'injecte : lanceur factice (aucun processus `claude` lancé), gabarit à champs rempli depuis les faits.
  const { journal } = await jouer(clientsHeuristiques(), 5);
  const cli = new RedacteurClaudeCli({ autorise: true, lanceur: async () => 'Fermeture à {{heure_stations}}, {{non_sortis_fin}} personnes restantes.' });
  const r = await redigerVerifie(cli, demandeExplication(journal), journal);
  assert.equal(r.rapport.taux, 1);
  const libre = new RedacteurClaudeCli({ autorise: true, lanceur: async () => 'Il y a {{inconnu}} personnes.' });
  await assert.rejects(libre.rediger(demandeExplication(journal)), /champ inconnu/);
  assert.equal(appelsReseau, 0);
});

// ---------------- REX et leçons ----------------
test('l\'analyste déterministe regroupe, calcule fréquences et durées, et ses chiffres sont vérifiables', async () => {
  const stock = new StockageRexMemoire();
  for (const r of REX) await stock.ajouterRex(r);
  const lecons = await new AnalysteDeterministe().analyser(await stock.listerRex());
  await stock.remplacerLecons(lecons);
  assert.equal((await stock.listerLecons()).length, 2);
  const l = lecons.find((x) => x.id === 'lecon:evacuation_magasin:niveau_-1')!;
  assert.equal(l.frequence, 2);
  assert.equal(l.duree_moyenne_min, 15);
  assert.equal(l.duree_max_min, 18);
  assert.deepEqual(l.sources, ['r1', 'r2']);
  for (const x of lecons) assert.deepEqual(verifierLecon(x, REX), { ok: true, problemes: [] });
  assert.equal(verifierLecon({ ...l, enonce: `${l.enonce} Soit 77 blessés.` }, REX).ok, false);
  assert.equal(verifierLecon({ ...l, sources: ['r1', 'zz'] }, REX).ok, false);
  assert.deepEqual(leconsPertinentes(lecons, ['ugc']).map((x) => x.zone), ['ugc']);
});

test('les leçons pertinentes sont montrées au décideur et citées dans sa décision', async () => {
  const lecons = await new AnalysteDeterministe().analyser(REX);
  const vues: string[][] = [];
  const clients = clientsHeuristiques();
  clients.directeur = { decider: async (q) => { vues.push(q.entree.lecons.map((l) => l.id)); return { actions: [] }; } };
  const { stockage } = await jouer(clients, 3, lecons);
  assert.ok(vues[0].includes('lecon:evacuation_cinema:ugc'));
  const l = await stockage.lister({ decideur: 'directeur', minute: 1160 });
  assert.deepEqual(l[0].lecons_utilisees, vues[0]);
});

// ---------------- Jev : probabilités, seuil, repli, rejeu ----------------
function transportScripte(reponses: Record<string, ReponseSystemOne['answers']>, vues: RequeteJev[] = []): TransportJev {
  let i = 0;
  return { envoyer: async (r) => { vues.push(r); const cle = Object.keys(reponses)[Math.min(i++, Object.keys(reponses).length - 1)]; return { model: r.model, answers: reponses[cle] }; } };
}

test('Jev : version figée, état en niveaux nommés (pas de chiffres bruts), une requête par décideur et par minute', async () => {
  const vues: RequeteJev[] = [];
  const t = transportScripte({ a: { plan: { choice: 'fermer_par_etapes', probabilities: { rester_ouvert: 0.1, fermer_par_etapes: 0.8, fermer: 0.1 }, confidence: 0.8 }, confinement: { noul: 0.1 }, fermer_portes_perimetre: { noul: 0.9 } } }, vues);
  const clients = clientsHeuristiques();
  clients.directeur = new ClientJev({ transport: t });
  await jouer(clients, 3);
  assert.equal(vues.length, 3);
  assert.ok(vues.every((v) => v.model === MODELE_JEV && (v.model as string) !== 'jev-latest'));
  assert.deepEqual(Object.keys(vues[0].questions).sort(), SPECS_JEV.directeur.map((s) => s.cle).sort());
  for (const v of vues) for (const val of Object.values(v.state)) assert.ok(typeof val !== 'number', 'pas de nombre brut dans le state');
});

test('Jev : sous le seuil de confiance on garde la décision précédente', async () => {
  const sur = { plan: { choice: 'fermer', probabilities: { rester_ouvert: 0.05, fermer_par_etapes: 0.05, fermer: 0.9 }, confidence: 0.9 }, confinement: { noul: 0.5 }, fermer_portes_perimetre: { noul: 0.5 } };
  const hesite = { plan: { choice: 'rester_ouvert', probabilities: { rester_ouvert: 0.4, fermer_par_etapes: 0.3, fermer: 0.3 }, confidence: 0.4 }, confinement: { noul: 0.5 }, fermer_portes_perimetre: { noul: 0.5 } };
  const clients = clientsHeuristiques();
  clients.directeur = new ClientJev({ transport: transportScripte({ sur, hesite }) });
  const { journal } = await jouer(clients, 4);
  assert.deepEqual(journal.entrees.map((e) => e.plan.mode), ['fermer', 'fermer', 'fermer', 'fermer']);
  const spec = SPECS_JEV.directeur[0];
  assert.equal(valeurDecidee(spec, hesite.plan), null);
  assert.equal(valeurDecidee(SPECS_JEV.directeur[1], { noul: 0.5 }), null);
  assert.equal(valeurDecidee(SPECS_JEV.directeur[1], { noul: 0.9 }), true);
});

test('Jev : sans réponse en cache ou en panne, le repli à règles décide sans réseau', async () => {
  const dossier = mkdtempSync(join(tmpdir(), 'jev-'));
  const vide = join(dossier, 'jev.json');
  writeFileSync(vide, '{}');
  const raisons: string[] = [];
  const clients = clientsHeuristiques();
  const cj = new ClientJev({ transport: new TransportRejeuJev(vide), surRepli: (_d, r) => raisons.push(r) });
  clients.directeur = cj;
  const { journal } = await jouer(clients, 3);
  assert.equal(cj.replis, 3);
  assert.match(raisons[0], /absente du cache/);
  assert.ok(journal.entrees.every((e) => ['rester_ouvert', 'fermer_par_etapes', 'fermer'].includes(e.plan.mode)));
  assert.equal(appelsReseau, 0);
});

test('Jev : rejeu fichier, clé = hash(model + state + questions), plafond de requêtes', async () => {
  const dossier = mkdtempSync(join(tmpdir(), 'jev-'));
  const chemin = join(dossier, 'jev.json');
  const req: RequeteJev = { model: MODELE_JEV, state: { densite: 'faible' }, questions: { x: { type: 'noul', instructions: 'ok ?' } } };
  const rejeu = new TransportRejeuJev(chemin);
  rejeu.enregistrer(req, { model: MODELE_JEV, answers: { x: { noul: 0.8 } } });
  const relu = new TransportRejeuJev(chemin);
  assert.deepEqual((await relu.envoyer(structuredClone(req))).answers.x, { noul: 0.8 });
  assert.notEqual(cleDeRequete(req), cleDeRequete({ ...req, model: 'jev-1.13.0' }));
  assert.notEqual(cleDeRequete(req), cleDeRequete({ ...req, state: { densite: 'critique' } }));
  assert.equal(cleDeRequete(req), cleDeRequete({ questions: req.questions, state: req.state, model: req.model }));
  const cj = new ClientJev({ transport: transportScripte({ a: {} }), plafond_requetes: 0 });
  const { journal } = await jouer({ ...clientsHeuristiques(), directeur: cj }, 2);
  assert.equal(cj.requetes, 0);
  assert.equal(cj.replis, 2);
  assert.equal(journal.entrees.length, 2);
  assert.equal(appelsReseau, 0);
});

test('aucun appel réseau pendant toute la suite', () => {
  assert.equal(appelsReseau, 0);
});

// Type utilisé pour garantir que Journal reste exporté et sérialisable (couture avec le lot aiven).
test('le journal est sérialisable en JSON sans perte', async () => {
  const { journal } = await jouer(clientsHeuristiques(), 4);
  const copie = JSON.parse(JSON.stringify(journal)) as Journal;
  assert.deepEqual(copie, journal);
});
