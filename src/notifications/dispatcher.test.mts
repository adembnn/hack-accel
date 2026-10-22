// Tests du dispatcher (public). Aucun appel réseau : fetch est remplacé par une fonction qui lève.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { preparerNotifications } from './dispatcher.ts';
import { DECISION_EVACUATION_EXEMPLE, SORTIES_EXEMPLE, populationExemple } from './exemple.ts';
import type { Decision, Destinataire } from './types.ts';
import { ErreurDecision, chiffresInventes, estSur } from './validation.ts';

let appelsReseau = 0;
globalThis.fetch = (() => {
  appelsReseau += 1;
  throw new Error('appel réseau interdit en test');
}) as unknown as typeof fetch;

const maintenant = (): number => 1_000_000;
const dest = (o: Partial<Destinataire>): Destinataire => ({ id: 'x', zone: 'cinema', niveau: '-1', pmr: false, langue: 'fr', canal_prefere: 'telephone-simule', ...o });
const prep = (d: Decision, pop: Destinataire[]) => preparerNotifications(d, pop, SORTIES_EXEMPLE, { maintenant });
const SECURITE: Decision = { ...DECISION_EVACUATION_EXEMPLE, id: 'dec-s', contexte: 'securite' };

test('message différent par salle, rang et place (issue différente)', () => {
  const pop = [
    dest({ id: 'a', billet: { salle: 'salle_07', rang: '3', place: '5' } }),
    dest({ id: 'b', billet: { salle: 'salle_07', rang: '20', place: '5' } }),
    dest({ id: 'c', billet: { salle: 'salle_08', rang: '3', place: '5' } }),
    dest({ id: 'd', billet: { salle: 'salle_08', rang: '3', place: '30' } }),
  ];
  const n = prep(DECISION_EVACUATION_EXEMPLE, pop);
  assert.equal(new Set(n.map((x) => x.corps)).size, 4);
  assert.equal(n[0]!.consigne.porte, 'lescot');
  assert.equal(n[1]!.consigne.porte, 'pont_neuf');
  assert.equal(n[2]!.consigne.porte, 'lescot');
  assert.equal(n[3]!.consigne.porte, 'pont_neuf');
  assert.match(n[0]!.corps, /Salle 7, rang 3, place 5/);
  assert.match(n[0]!.corps, /Lescot/);
  assert.equal(n[0]!.consigne.niveau_urgence, 'urgence');
});

test('message différent par zone, et la consigne de zone des décideurs est suivie', () => {
  const n = prep(DECISION_EVACUATION_EXEMPLE, [dest({ id: 'g', zone: 'galerie', niveau: '0' }), dest({ id: 'c' })]);
  assert.equal(n[0]!.consigne.porte, 'saint_eustache');
  assert.notEqual(n[0]!.corps, n[1]!.corps);
  assert.match(n[0]!.corps, /Quittez la galerie calmement/);
});

test('une porte fermée n\'est jamais indiquée ; un cheminement bloqué est contourné', () => {
  const d: Decision = { ...DECISION_EVACUATION_EXEMPLE, id: 'dec-f', portes: { ...DECISION_EVACUATION_EXEMPLE.portes, lescot: 'fermee' } };
  const n = prep(d, [dest({ id: 'a', billet: { salle: 'salle_07', rang: '3', place: '5' } })]);
  assert.equal(n[0]!.consigne.porte, 'pont_neuf');
  assert.doesNotMatch(n[0]!.corps, /Lescot/);
});

test('PMR en incendie : jamais l\'ascenseur, refuge ou aide du personnel', () => {
  const [pmr, sansRefuge] = prep(DECISION_EVACUATION_EXEMPLE, [
    dest({ id: 'p', pmr: true, billet: { salle: 'salle_07', rang: '3', place: '5' } }),
    dest({ id: 'q', pmr: true }),
  ]);
  assert.match(pmr!.corps, /ne prenez pas l'ascenseur/i);
  assert.match(pmr!.corps, /refuge du cinéma/);
  assert.equal(pmr!.consigne.porte, 'refuge');
  assert.doesNotMatch(pmr!.corps, /ascenseur est utilisable/);
  assert.match(sansRefuge!.corps, /ascenseur/i);
  const sans = preparerNotifications(DECISION_EVACUATION_EXEMPLE, [dest({ id: 'z', pmr: true, zone: 'galerie' })], { ...SORTIES_EXEMPLE, zones: { ...SORTIES_EXEMPLE.zones, galerie: { portes: ['rambuteau'] } } }, { maintenant });
  assert.equal(sans[0]!.consigne.porte, 'personnel');
  assert.match(sans[0]!.corps, /signe au personnel/);
});

test('PMR hors incendie : l\'ascenseur peut être indiqué comme utilisable seulement si la zone en a un et si rien ne l\'interdit', () => {
  const [a] = prep(SECURITE, [dest({ id: 'p', pmr: true })]);
  assert.match(a!.corps, /ascenseur est utilisable/);
  const [b] = prep({ ...SECURITE, ascenseurs_interdits: true }, [dest({ id: 'p', pmr: true })]);
  assert.match(b!.corps, /ne prenez pas l'ascenseur/i);
});

test('variante anglaise', () => {
  const [n] = prep(DECISION_EVACUATION_EXEMPLE, [dest({ id: 'e', langue: 'en', billet: { salle: 'salle_07', rang: '3', place: '5' } })]);
  assert.equal(n!.titre, 'Message from the venue');
  assert.match(n!.corps, /Hall 7, row 3, seat 5: leave through Lescot/);
  const [pmr] = prep(DECISION_EVACUATION_EXEMPLE, [dest({ id: 'e', langue: 'en', pmr: true })]);
  assert.match(pmr!.corps, /do not use the lift/i);
});

test('confinement et information', () => {
  const [c] = prep({ ...SECURITE, id: 'c1', action: 'confiner' }, [dest({ id: 'a', billet: { salle: 'salle_08', rang: '3', place: '5' } })]);
  assert.match(c!.corps, /Restez à l'intérieur/);
  assert.equal(c!.consigne.porte, 'sur_place');
  assert.equal(c!.consigne.niveau_urgence, 'important');
  const [i] = prep({ id: 'i1', action: 'informer' }, [dest({ id: 'a', langue: 'en' })]);
  assert.equal(i!.consigne.niveau_urgence, 'info');
  assert.match(i!.corps, /No evacuation/);
});

test('titre fixe, corps de 160 caractères au plus, jamais « alerte officielle », pas de cri, aucun chiffre inventé', () => {
  const pop = populationExemple(600);
  const sources = [JSON.stringify(SORTIES_EXEMPLE)];
  for (const d of [DECISION_EVACUATION_EXEMPLE, SECURITE, { ...SECURITE, id: 'c', action: 'confiner' as const }, { id: 'i', action: 'informer' as const }]) {
    for (const n of prep(d, pop)) {
      const p = pop.find((x) => x.id === n.destinataire_id)!;
      assert.ok(n.titre === 'Message du lieu' || n.titre === 'Message from the venue');
      assert.ok(n.corps.length <= 160, n.corps);
      assert.ok(estSur(n.corps), n.corps);
      assert.doesNotMatch(n.corps, /alerte|alert\b|FR-Alert|officiel/i);
      assert.deepEqual(chiffresInventes(n.corps, [...sources, p.billet?.salle ?? '', p.billet?.rang ?? '', p.billet?.place ?? '']), [], n.corps);
    }
  }
});

test('texte libre : balises, liens, cris, chiffres inventés et termes d\'alerte d\'État ne passent jamais', () => {
  const sale = '<script>alert(1)</script> ALERTE OFFICIELLE!!! FR-Alert https://x.example/a 98765 ${process.env.X}';
  const d: Decision = { ...DECISION_EVACUATION_EXEMPLE, id: 'dec-sale', messages_par_zone: { galerie: sale, cinema: 'SORTEZ TOUS MAINTENANT!!! Le sol est glissant' } };
  const n = prep(d, [dest({ id: 'g', zone: 'galerie' }), dest({ id: 'c' })]);
  for (const x of n) {
    assert.doesNotMatch(x.corps, /<|>|script|http|\$\{|98765|alerte|FR-Alert|!/i);
    assert.ok(x.corps.length <= 160);
  }
  assert.match(n[1]!.corps, /Sortez tous maintenant/i);
});

test('refus des consignes qui enferment ou empêchent de sortir', () => {
  const toutes = Object.fromEntries(SORTIES_EXEMPLE.portes.map((p) => [p, 'fermee' as const]));
  const refus = (d: Decision): ErreurDecision => {
    try {
      prep(d, populationExemple(3));
    } catch (e) {
      assert.ok(e instanceof ErreurDecision);
      return e;
    }
    assert.fail('refus attendu');
  };
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, portes: toutes }).raisons.join(), /toutes les portes sont fermées/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, action: 'confiner' }).raisons.join(), /confinement refusé en incendie/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, consignes_par_zone: { galerie: { porte: 'berger' } } }).raisons.join(), /porte fermée/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, consignes_par_zone: { galerie: { porte: 'canopee', clarte: 'bloquee' } } }).raisons.join(), /bloquée/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, consignes_par_zone: { atlantide: { porte: 'lescot' } } }).raisons.join(), /zone inconnue/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, portes: { mordor: 'ouverte' } }).raisons.join(), /porte inconnue/);
  assert.match(refus({ ...DECISION_EVACUATION_EXEMPLE, portes: { lescot: 'fermee', pont_neuf: 'fermee' } }).raisons.join(), /zone cinema sans sortie ouverte/);
});

test('idempotence : mêmes identifiants pour la même décision, un destinataire en double reçoit une seule notification', () => {
  const sansId: Decision = { ...DECISION_EVACUATION_EXEMPLE, id: undefined };
  const pop = [dest({ id: 'a' }), dest({ id: 'a' }), dest({ id: 'b' })];
  const un = prep(sansId, pop);
  const deux = prep({ ...sansId }, pop);
  assert.equal(un.length, 2);
  assert.deepEqual(un.map((x) => x.id), deux.map((x) => x.id));
  assert.notEqual(prep({ ...sansId, action: 'confiner', contexte: 'securite' }, pop)[0]!.id, un[0]!.id);
});

test('3 000 destinataires préparés en moins de 500 ms, zéro appel réseau', () => {
  const pop = populationExemple(3000);
  const t0 = performance.now();
  const n = prep(DECISION_EVACUATION_EXEMPLE, pop);
  const ms = performance.now() - t0;
  assert.equal(n.length, 3000);
  assert.ok(ms < 500, `${ms.toFixed(1)} ms`);
  assert.equal(appelsReseau, 0);
});
