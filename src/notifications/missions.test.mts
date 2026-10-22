// Tests des fiches mission (personnel) et de la couverture. Aucun réseau.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerCanalAgent, ficheImprimable, missionEnNotification } from './canaux/agent.ts';
import { AGENTS_EXEMPLE, DECISION_EVACUATION_EXEMPLE, SORTIES_EXEMPLE } from './exemple.ts';
import { calculerCouverture, preparerMissions } from './missions.ts';
import { creerSuivi } from './suivi.ts';
import type { Agent, Decision } from './types.ts';
import { ErreurDecision, estSur } from './validation.ts';

const maintenant = (): number => 5_000_000;
const missions = (d: Decision = DECISION_EVACUATION_EXEMPLE, a: Agent[] = AGENTS_EXEMPLE) => preparerMissions(d, a, SORTIES_EXEMPLE, { maintenant });

test('une fiche différente par poste, avec porte, direction, relève et personnes à appeler', () => {
  const m = missions();
  assert.equal(m.length, AGENTS_EXEMPLE.length);
  assert.equal(new Set(m.map((x) => `${x.role}|${x.se_tenir}`)).size, m.length);
  assert.equal(new Set(m.map((x) => x.phrase_megaphone)).size >= 4, true);
  const porte = m.find((x) => x.agent_id === 'porte-lescot-1')!;
  assert.deepEqual(porte.porte_a_garder, { porte: 'lescot', etat: 'ouverte' });
  assert.match(porte.phrase_megaphone, /Sortie par Lescot/);
  assert.deepEqual(porte.appeler, ['pc-1', 'chef-1', 'ssiap-1']);
  assert.equal(porte.priorite, 1);
  const salle = m.find((x) => x.agent_id === 'salle-07-1')!;
  assert.equal(salle.heure_effet_min, 1165);
  assert.match(salle.phrase_megaphone, /Salle 7 : sortez rang par rang vers/);
  assert.equal(salle.priorite, 2);
  assert.equal(m.find((x) => x.agent_id === 'pc-1')!.dirige.length, 2);
  assert.equal(m.find((x) => x.agent_id === 'pc-1')!.heure_effet_min, 1160);
});

test('porte fermée : l\'agent garde la porte fermée et renvoie vers une autre sortie', () => {
  const d: Decision = { ...DECISION_EVACUATION_EXEMPLE, id: 'f', portes: { ...DECISION_EVACUATION_EXEMPLE.portes, lescot: 'fermee' } };
  const porte = missions(d).find((x) => x.agent_id === 'porte-lescot-1')!;
  assert.deepEqual(porte.porte_a_garder, { porte: 'lescot', etat: 'fermee' });
  assert.match(porte.phrase_megaphone, /Cette porte est fermée\. Allez vers Pont-Neuf/);
  assert.match(porte.texte_radio, /Porte fermée/);
});

test('phrase au mégaphone : 90 caractères au plus, pas de ton d\'alerte officielle, pas de cri', () => {
  const lots: Decision[] = [DECISION_EVACUATION_EXEMPLE, { ...DECISION_EVACUATION_EXEMPLE, id: 'c', contexte: 'securite', action: 'confiner' }, { id: 'i', action: 'informer' }];
  for (const d of lots) {
    for (const m of missions(d)) {
      assert.ok(m.phrase_megaphone.length <= 90, m.phrase_megaphone);
      assert.ok(estSur(m.phrase_megaphone), m.phrase_megaphone);
      assert.doesNotMatch(m.phrase_megaphone, /alerte|officiel|!/i);
      assert.ok(m.texte_radio.length <= 160);
    }
  }
});

test('rôle PMR : aucun ascenseur en incendie, aide sur place en confinement', () => {
  const m = missions().find((x) => x.agent_id === 'porte-lescot-1')!;
  assert.match(m.role_pmr, /Aucun ascenseur/);
  assert.match(m.role_pmr, /refuge du cinéma/);
  const hors = missions({ ...DECISION_EVACUATION_EXEMPLE, id: 'h', contexte: 'securite' }).find((x) => x.agent_id === 'porte-lescot-1')!;
  assert.match(hors.role_pmr, /Aidez les personnes à mobilité réduite à rejoindre/);
  const conf = missions({ id: 'c', action: 'confiner', contexte: 'securite' }).find((x) => x.agent_id === 'porte-lescot-1')!;
  assert.match(conf.role_pmr, /sur place/);
});

test('agent inconnu ou décision qui enferme : refus', () => {
  const mauvais: Agent = { id: 'z', role: 'agent_porte', poste: { niveau: '0', porte: 'mordor' }, equipement: 'talkie' };
  assert.throws(() => missions(DECISION_EVACUATION_EXEMPLE, [mauvais]), ErreurDecision);
  assert.throws(() => missions({ ...DECISION_EVACUATION_EXEMPLE, action: 'confiner' }), ErreurDecision);
});

test('couverture : signale les postes vides et les agents manquants par zone, sans chiffre hors entrée', () => {
  const c = calculerCouverture(DECISION_EVACUATION_EXEMPLE, AGENTS_EXEMPLE, SORTIES_EXEMPLE);
  assert.equal(c.postes_critiques, 4);
  assert.deepEqual(c.tenus.map((t) => t.poste), ['porte_lescot', 'escalier_cinema']);
  // porte_lescot : le plan demande 2 agents de guidage, 1 présent → 1 manquant ; porte_pont_neuf, croisement_galerie vides.
  assert.deepEqual(c.vides.map((v) => [v.poste, v.manquants]), [['porte_lescot', 1], ['porte_pont_neuf', 1], ['croisement_galerie', 1]]);
  assert.deepEqual(c.manquants_par_zone, { cinema: 2, galerie: 1 });
  assert.equal(c.agents_manquants, 3);
  const sans = calculerCouverture(DECISION_EVACUATION_EXEMPLE, AGENTS_EXEMPLE.filter((a) => a.id !== 'porte-lescot-1'), SORTIES_EXEMPLE);
  assert.ok(sans.vides.some((v) => v.poste === 'porte_lescot' && v.manquants === 2));
  assert.equal(calculerCouverture(DECISION_EVACUATION_EXEMPLE, [], { ...SORTIES_EXEMPLE, postes_critiques: [] }).agents_manquants, 0);
});

test('canal agent : accusé obligatoire, relance, repli oreillette puis fiche imprimable hors réseau', async () => {
  let t = 5_001_000;
  const canal = creerCanalAgent({ transportApp: async () => ({ ok: true, remis: true }), transportVoix: async () => ({ ok: false, erreur: 'radio_coupee' }) });
  const suivi = creerSuivi({ canaux: { agent: canal }, maintenant: () => t, delaiRelanceS: 20 });
  const ms = missions();
  canal.enregistrer(ms, AGENTS_EXEMPLE);
  const paires = ms.map((m) => missionEnNotification(m, AGENTS_EXEMPLE.find((a) => a.id === m.agent_id)!, SORTIES_EXEMPLE));
  suivi.soumettre(paires.map((p) => p.notification), paires.map((p) => p.destinataire));
  await suivi.traiter();
  // téléphone : remis ; oreillette/talkie : radio coupée et pas d'app (repli app joint, ok) → ils sont aussi remis par l'app de repli
  assert.equal(suivi.entree(ms[0]!.id)!.statut, 'remise');
  assert.equal(suivi.sansAccuse().length, ms.length);
  t += 21_000;
  assert.equal(suivi.relancer(), ms.length);
  suivi.accuser(ms[0]!.id);
  assert.equal(suivi.sansAccuse().length, ms.length - 1);
  // repli : sans aucun transport, tout est hors réseau et la fiche est imprimable
  const nu = creerCanalAgent({});
  nu.enregistrer(ms, AGENTS_EXEMPLE);
  const r = await nu.envoyer(paires[0]!.notification, paires[0]!.destinataire);
  assert.equal(r.ok, false);
  assert.equal(r.erreur, 'hors_reseau');
  assert.match(nu.fichesAImprimer()[0]!, /Au mégaphone : /);
  assert.match(ficheImprimable(ms[3]!), /Porte à garder : lescot, ouverte/);
});
