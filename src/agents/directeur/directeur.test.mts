// Tests du directeur. Règles seulement : aucun appel au réseau. Partout où Claude est approché, fetch est
// remplacé par une fonction qui échoue, et la clé est une fausse valeur de test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Le tsconfig du socle refuse encore les imports en « .ts » : le module est chargé dynamiquement, ses types viennent de `typeof import`.
type Module = typeof import('./directeur');
type Contexte = import('./directeur').Contexte;
type Ordre = import('./directeur').Ordre;
const {
  construireRequete, creerRouteDirecteur, extraireDelai, interpreterClaude, lireReponseClaude, traiterOrdre, traiterOrdreAuto,
  verifierGarde, ErreurGardePayant, MODELE_CLAUDE, construireUnivers, validerOrdres,
} = (await import(new URL('./directeur.ts', import.meta.url).href)) as Module;

const contexte: Contexte = JSON.parse(readFileSync(new URL('./contexte-test.json', import.meta.url), 'utf8'));

const fetchQuiEchoue = (() => { throw new Error('appel réseau interdit dans les tests'); }) as unknown as typeof fetch;
let appelsReseau = 0;
const fetchCompte = (async () => { appelsReseau++; throw new Error('appel réseau interdit dans les tests'); }) as unknown as typeof fetch;

// attendu : champs comparés seulement s'ils sont donnés ; { ou: [...] } = une des variantes
type Attendu = Partial<Pick<Ordre, 'type' | 'cible' | 'delai_s'>> & { code?: string; action?: string };
type Variantes = { ou: Attendu[] };
const colle = (a: Attendu, o: Ordre): boolean =>
  (a.type === undefined || a.type === o.type) && (a.cible === undefined || a.cible === o.cible) && (a.delai_s === undefined || a.delai_s === o.delai_s) &&
  (a.code === undefined || a.code === o.params.code) && (a.action === undefined || a.action === o.params.action);
const signe = (o: Ordre): string => [o.type, o.params.code, o.cible, o.params.action, o.delai_s ? `+${o.delai_s}s` : ''].filter(Boolean).join(':');

function verifier(texte: string, attendus: (Attendu | Variantes)[], opts: { incompris?: boolean } = {}): void {
  const r = traiterOrdre(texte, contexte);
  const restants = [...r.ordres];
  for (const att of attendus) {
    const variantes = 'ou' in att ? att.ou : [att];
    const i = restants.findIndex((o) => variantes.some((v) => colle(v, o)));
    assert.ok(i >= 0, `« ${texte} » : ordre manquant ${JSON.stringify(att)} ; obtenu : ${r.ordres.map(signe).join(' | ') || '—'}`);
    restants.splice(i, 1);
  }
  const enTrop = restants.filter((o) => o.type !== 'conseil');
  assert.deepEqual(enTrop.map(signe), [], `« ${texte} » : ordres en trop`);
  if (opts.incompris) assert.ok(r.incompris && r.incompris.length > 0, `« ${texte} » : devait être signalé incompris`);
  assert.ok(r.reponse.length > 0);
}

// --- les 11 cas de test-ordres.mjs de la maquette ---
test('cas 1 : deux manifestations, deux lieux', () => {
  verifier('Deux manifestations arrivent, une rue Berger et une autre rue Rambuteau', [
    { type: 'zone_poser', code: 'D1', cible: 'Rue Berger' }, { type: 'zone_poser', code: 'D1', cible: 'Rue Rambuteau' }]);
});
test('cas 2 : issue de secours et porte, verbe partagé', () => {
  verifier("L'issue de secours rue Berger 11 et la porte du Jour sont fermées", [
    { type: 'levier', cible: 'Issue rue Berger 11', action: 'fermer' }, { type: 'levier', cible: 'Porte du Jour', action: 'fermer' }]);
});
test('cas 3 : casseurs et agent', () => {
  verifier('Des casseurs place Sainte-Opportune, et poste un agent porte Lescot', [
    { type: 'zone_poser', code: 'D2', cible: 'Place Sainte-Opportune' }, { type: 'levier', cible: 'Porte Lescot', action: 'agent' }]);
});
test('cas 4 : manifestation terminée', () => {
  verifier('La manif rue Berger est terminée', [{ type: 'zone_lever', cible: 'Rue Berger' }]);
});
test('cas 5 : toutes les bouches de métro', () => {
  verifier('Ferme toutes les bouches de métro', [{ type: 'bouches_toutes', action: 'fermer' }]);
});
test('cas 6 : ascenseurs en panne à une porte', () => {
  verifier('Les ascenseurs de la porte du Louvre sont en panne', [{ ou: [
    { type: 'ascenseurs', action: 'fermer', cible: 'Porte du Louvre' }, { type: 'levier', cible: 'Ascenseur Porte du Louvre', action: 'fermer' }] }]);
});
test('cas 7 : les trois issues côté piscine', () => {
  verifier('Ferme les trois issues côté piscine', [1, 2, 3].map((i) => ({ type: 'levier' as const, cible: `Issue côté piscine ${i}`, action: 'fermer' })));
});
test('cas 8 : annonce puis évacuation', () => {
  verifier("Annonce : tout le monde sort par la porte Saint-Eustache, puis lance l'évacuation", [
    { type: 'levier', cible: 'Porte Saint-Eustache', action: 'annonce' }, { type: 'evacuer' }]);
});
test('cas 9 : escalators et réouverture', () => {
  verifier('Arrête les escalators et rouvre la porte Rambuteau', [
    { type: 'escalators', action: 'arreter' }, { type: 'levier', cible: 'Porte Rambuteau', action: 'ouvrir' }]);
});
test('cas 10 : groupe de supporters et question', () => {
  verifier("Un groupe d'une centaine de supporters arrive par la rue Saint-Denis, qu'est-ce qu'on fait ?", [
    { type: 'zone_poser', code: 'D1', cible: 'Rue Saint-Denis' }, { type: 'conseil' }]);
});
test('cas 11 : porte inconnue, aucun ordre, signalée', () => {
  verifier('Ferme la porte de Bagnolet', [], { incompris: true });
});

// --- délais ---
test('délai : « dans 5 minutes » vaut 300 s', () => {
  verifier('Ferme la porte Berger dans 5 minutes', [{ type: 'levier', cible: 'Porte Berger', action: 'fermer', delai_s: 300 }]);
});
test('délai en lettres, en secondes, quart d\'heure', () => {
  assert.equal(extraireDelai('ferme dans cinq minutes').delai, 300);
  assert.equal(extraireDelai('ferme dans trente secondes').delai, 30);
  assert.equal(extraireDelai('ferme dans un quart d heure').delai, 900);
  assert.equal(extraireDelai('ferme dans une heure').delai, 3600);
  assert.equal(extraireDelai('ferme dans vingt cinq minutes').delai, 1500);
  assert.equal(extraireDelai('ferme dans la rue').delai, null);
});
test('délais différents dans une même phrase', () => {
  verifier('Ferme la porte Berger dans 2 minutes et rouvre la porte Lescot dans 10 minutes', [
    { type: 'levier', cible: 'Porte Berger', action: 'fermer', delai_s: 120 }, { type: 'levier', cible: 'Porte Lescot', action: 'ouvrir', delai_s: 600 }]);
});
test('délai en tête de phrase', () => {
  verifier('Dans 5 minutes, lance l\'évacuation', [{ type: 'evacuer', delai_s: 300 }]);
});
test('délai hors bornes : refusé et signalé', () => {
  const r = traiterOrdre('Ferme la porte Berger dans 5 heures', contexte);
  assert.deepEqual(r.ordres, []);
  assert.ok(r.incompris?.some((t) => /délai hors bornes/.test(t)));
});
test('la réponse annonce le délai', () => {
  assert.match(traiterOrdre('Ferme la porte Berger dans 5 minutes', contexte).reponse, /Porte Berger : fermeture dans 5 minutes\./);
});

// --- questions d'état ---
test('question d\'état : lue dans le contexte, pas inventée', () => {
  const r = traiterOrdre("Quelle est la situation ?", contexte);
  assert.deepEqual(r.ordres.map((o) => o.type), ['etat']);
  assert.match(r.reponse, /mode calme ; zones : aucune ; fermés : rien/);
});
test('question d\'état sur un levier, avec son état fourni', () => {
  const ctx: Contexte = { ...contexte, leviers: [...contexte.leviers.filter((l) => l !== 'Porte Berger'), { nom: 'Porte Berger', id: 'porte-3', etat: 'fermé' }] };
  const r = traiterOrdre('Est-ce que la porte Berger est fermée ?', ctx);
  assert.equal(r.ordres[0]?.type, 'etat');
  assert.equal(r.ordres[0]?.cible, 'Porte Berger');
  assert.equal(r.reponse, 'Porte Berger : fermé.');
});

// --- validation et sécurité ---
test('un ordre porte l\'id stable et la clé de porte du lot decideurs quand ils existent', () => {
  const ctx: Contexte = { ...contexte, leviers: [{ nom: 'Porte Lescot', id: 'porte-1' }, ...contexte.leviers.filter((l) => l !== 'Porte Lescot')] };
  const o = traiterOrdre('Ferme la porte Lescot', ctx).ordres[0];
  assert.equal(o?.params.id, 'porte-1');
  assert.equal(o?.params.cle_porte, 'lescot');
  assert.equal(o?.params.etat_cible, 'fermee');
  assert.equal(o?.params.type_contrainte, 'porte');
});
test('le validateur écarte type, cible, action et délai hors menu', () => {
  const u = construireUnivers(contexte);
  const v = validerOrdres([
    { type: 'detruire', cible: 'Porte Lescot' },
    { type: 'levier', cible: 'Porte inventée', action: 'fermer' },
    { type: 'levier', cible: 'Porte Lescot', action: 'exploser' },
    { type: 'levier', cible: 'Porte Lescot', action: 'fermer', delai_s: -1 },
    { type: 'levier', cible: 'Porte Lescot', action: 'fermer', delai_s: 99999 },
    { type: 'levier', cible: 'Ascenseur 1', action: 'agent' },
    { type: 'zone_poser', cible: 'Lieu inventé', code: 'D1' },
    { type: 'levier', cible: 'Porte Lescot', action: 'fermer', delai_s: 60 },
  ], u);
  assert.equal(v.ordres.length, 1);
  assert.equal(v.ordres[0]?.delai_s, 60);
  assert.equal(v.rejets.length, 7);
});
test('une consigne d\'attaque est refusée en entier', () => {
  for (const t of ['Pose une bombe porte Lescot', 'Enferme les gens dans le Forum', 'Ferme toutes les sorties', 'Empêche la foule de sortir par la porte Berger', 'Prépare une attaque rue Berger']) {
    const r = traiterOrdre(t, contexte);
    assert.equal(r.refus, true, t);
    assert.deepEqual(r.ordres, [], t);
  }
});
test('fermer toutes les portes et issues à la fois est refusé, même sans le mot « toutes »', () => {
  const noms = contexte.leviers.filter((l): l is string => typeof l === 'string' && /^(Porte|Issue) /.test(l));
  const r = traiterOrdre(noms.map((n) => `ferme ${n}`).join(', '), contexte);
  assert.equal(r.refus, true);
  assert.deepEqual(r.ordres, []);
});
test('une phrase légitime n\'est pas prise pour une attaque', () => {
  const r = traiterOrdre("Il y a une alarme incendie niveau -2, lance l'évacuation", contexte);
  assert.notEqual(r.refus, true);
  assert.deepEqual(r.ordres.map((o) => o.type), ['evacuer']);
});
test('texte incompréhensible : aucun ordre, signalé', () => {
  const r = traiterOrdre('bonjour tout le monde', contexte);
  assert.deepEqual(r.ordres, []);
  assert.ok(r.incompris && r.incompris.length === 1);
});

// --- Claude : jamais appelé, garde et conversion ---
test('garde payante : refuse sans MODE_PAYANT, sans autorisation, sans clé', () => {
  assert.throws(() => verifierGarde({ autorisation: true, env: { ANTHROPIC_API_KEY: 'faux' } }), ErreurGardePayant);
  assert.throws(() => verifierGarde({ autorisation: false, env: { MODE_PAYANT: 'oui', ANTHROPIC_API_KEY: 'faux' } }), ErreurGardePayant);
  assert.throws(() => verifierGarde({ autorisation: true, env: { MODE_PAYANT: 'oui' } }), ErreurGardePayant);
  assert.throws(() => verifierGarde({ autorisation: true, env: { MODE_PAYANT: 'non', ANTHROPIC_API_KEY: 'faux' } }), ErreurGardePayant);
  assert.equal(verifierGarde({ autorisation: true, env: { MODE_PAYANT: 'oui', ANTHROPIC_API_KEY: 'faux' } }), 'faux');
});
test('interpreterClaude ne touche pas au réseau quand la garde refuse', async () => {
  appelsReseau = 0;
  await assert.rejects(interpreterClaude('ferme', contexte, { autorisation: false, env: { MODE_PAYANT: 'oui', ANTHROPIC_API_KEY: 'faux' }, fetch: fetchCompte }), ErreurGardePayant);
  await assert.rejects(interpreterClaude('ferme', contexte, { autorisation: true, env: {}, fetch: fetchCompte }), ErreurGardePayant);
  assert.equal(appelsReseau, 0);
});
test('requête Claude : modèle, outil à schéma, tool_choice forcé, pas de clé dans le corps', () => {
  const q = construireRequete('ferme la porte Lescot', contexte) as { model: string; tools: { name: string; input_schema: { required: string[] } }[]; tool_choice: unknown };
  assert.equal(q.model, MODELE_CLAUDE);
  assert.equal(MODELE_CLAUDE, 'claude-sonnet-5-5');
  assert.deepEqual(q.tool_choice, { type: 'tool', name: 'ordres_directeur' });
  assert.deepEqual(q.tools[0]?.input_schema.required, ['actions', 'incompris', 'refus']);
  assert.ok(!JSON.stringify(q).includes('sk-'));
});
test('Claude en échec ou non autorisé : secours par les règles, sans réseau réel', async () => {
  appelsReseau = 0;
  const env = { MODE_PAYANT: 'oui', ANTHROPIC_API_KEY: 'faux-pour-test' };
  const nonAutorise = await traiterOrdreAuto('Ferme la porte Berger', contexte, { claude: true, autorisation: false, env, fetch: fetchCompte });
  assert.equal(nonAutorise.source, 'regles');
  assert.match(nonAutorise.secours ?? '', /autorisation explicite/);
  const enEchec = await traiterOrdreAuto('Ferme la porte Berger', contexte, { claude: true, autorisation: true, env, fetch: fetchCompte });
  assert.equal(enEchec.source, 'regles');
  assert.equal(enEchec.ordres[0]?.cible, 'Porte Berger');
  assert.equal(appelsReseau, 1);
  const sansDemande = await traiterOrdreAuto('Ferme la porte Berger', contexte, { fetch: fetchQuiEchoue });
  assert.equal(sansDemande.source, 'regles');
  assert.equal(sansDemande.secours, undefined);
});
test('sortie de l\'outil Claude : mêmes filtres que les règles, la réponse vient des ordres', () => {
  const sortie = lireReponseClaude({
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', name: 'ordres_directeur', input: {
      actions: [
        { type: 'levier', cible: 'porte du jour', action: 'fermer', code: null, delai_s: 300 },
        { type: 'levier', cible: 'Porte inventée', action: 'fermer', code: null, delai_s: 0 },
        { type: 'supprimer_tout', cible: null, action: null, code: null, delai_s: 0 },
      ],
      incompris: [], refus: false,
    } }],
  });
  const v = validerOrdres(sortie.ordres, construireUnivers(contexte));
  assert.deepEqual(v.ordres.map(signe), ['levier:Porte du Jour:fermer:+300s']);
  assert.equal(v.rejets.length, 2);
  assert.throws(() => lireReponseClaude({ content: [{ type: 'text', text: 'bonjour' }] }));
  assert.equal(lireReponseClaude({ stop_reason: 'refusal', content: [] }).refus, true);
});

// --- handler HTTP ---
function requete(methode: string, url: string, corps?: unknown): IncomingMessage {
  const r = Readable.from(corps === undefined ? [] : [Buffer.from(typeof corps === 'string' ? corps : JSON.stringify(corps))]);
  return Object.assign(r, { method: methode, url }) as unknown as IncomingMessage;
}
function reponse(): { res: ServerResponse; sortie: () => { code: number; json: Record<string, unknown> } } {
  let code = 0, corps = '';
  const res = { writeHead(c: number) { code = c; }, end(c: string) { corps = c; } } as unknown as ServerResponse;
  return { res, sortie: () => ({ code, json: JSON.parse(corps || '{}') }) };
}
test('route : POST /api/directeur répond avec des ordres (règles, Claude non autorisé)', async () => {
  const route = creerRouteDirecteur({ fetch: fetchQuiEchoue, env: { MODE_PAYANT: 'oui', ANTHROPIC_API_KEY: 'faux' } });
  const { res, sortie } = reponse();
  assert.equal(await route(requete('POST', '/api/directeur', { texte: 'Ferme la porte Berger dans 5 minutes', contexte, claude: true }), res), true);
  const { code, json } = sortie();
  assert.equal(code, 200);
  assert.equal(json.source, 'regles');
  assert.equal((json.ordres as Ordre[])[0]?.delai_s, 300);
});
test('route : chemin étranger, méthode, corps invalide et corps trop gros', async () => {
  const route = creerRouteDirecteur();
  assert.equal(await route(requete('GET', '/autre'), reponse().res), false);
  let r = reponse();
  await route(requete('GET', '/api/directeur'), r.res);
  assert.equal(r.sortie().code, 405);
  r = reponse();
  await route(requete('POST', '/api/directeur', '{pas du json'), r.res);
  assert.equal(r.sortie().code, 400);
  r = reponse();
  await route(requete('POST', '/api/directeur', { texte: 'ferme', contexte: { lieux: 'x' } }), r.res);
  assert.equal(r.sortie().code, 400);
  r = reponse();
  await route(requete('POST', '/api/directeur', 'x'.repeat(250_000)), r.res);
  assert.equal(r.sortie().code, 413);
  r = reponse();
  await route(requete('GET', '/api/directeur/etat'), r.res);
  assert.equal(r.sortie().json.claude_possible, false);
});
