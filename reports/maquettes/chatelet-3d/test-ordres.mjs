// Vérifie que Claude comprend des ordres précis et multiples du directeur.
// Lance d'abord `node serveur.mjs`, puis `node test-ordres.mjs`. Appel payant : 20 requêtes Sonnet 5.5 (effort bas), quelques centimes.
// Contexte figé : test-contexte.json (lieux et leviers relevés dans la page le 22 oct.).
import { readFileSync } from 'node:fs';
const contexte = JSON.parse(readFileSync(new URL('./test-contexte.json', import.meta.url)));
const URL_API = process.env.URL_API || `http://127.0.0.1:${process.env.PORT_MAQUETTE || 8767}/api/directeur`;

// attendu : liste d'actions qui doivent être présentes (champs comparés seulement s'ils sont donnés) ; ou(...) = une des variantes
const A = (type, o = {}) => ({ type, ...o });
const CAS = [
  ['Deux manifestations arrivent, une rue Berger et une autre rue Rambuteau', [A('zone_poser', { code: 'D1', lieu: 'Rue Berger' }), A('zone_poser', { code: 'D1', lieu: 'Rue Rambuteau' })]],
  ["L'issue de secours rue Berger 11 et la porte du Jour sont fermées", [A('levier', { cible: 'Issue rue Berger 11', action: 'fermer' }), A('levier', { cible: 'Porte du Jour', action: 'fermer' })]],
  ['Des casseurs place Sainte-Opportune, et poste un agent porte Lescot', [A('zone_poser', { code: 'D2', lieu: 'Place Sainte-Opportune' }), A('levier', { cible: 'Porte Lescot', action: 'agent' })]],
  ['La manif rue Berger est terminée', [A('zone_lever', { lieu: 'Rue Berger' })]],
  ['Ferme toutes les bouches de métro', [A('bouches_toutes', { action: 'fermer' })]],
  ['Les ascenseurs de la porte du Louvre sont en panne', [{ ou: [A('ascenseurs', { action: 'fermer', lieu: 'Porte du Louvre' }), A('levier', { cible: 'Ascenseur Porte du Louvre', action: 'fermer' })] }]],
  ['Ferme les trois issues côté piscine', [1, 2, 3].map(i => A('levier', { cible: `Issue côté piscine ${i}`, action: 'fermer' }))],
  ["Annonce : tout le monde sort par la porte Saint-Eustache, puis lance l'évacuation", [A('levier', { cible: 'Porte Saint-Eustache', action: 'annonce' }), A('evacuer')]],
  ['Arrête les escalators et rouvre la porte Rambuteau', [A('escalators', { action: 'arreter' }), A('levier', { cible: 'Porte Rambuteau', action: 'ouvrir' })]],
  ["Un groupe d'une centaine de supporters arrive par la rue Saint-Denis, qu'est-ce qu'on fait ?", [{ ou: [A('zone_poser', { code: 'D1', lieu: 'Rue Saint-Denis' }), A('cortege', { code: 'D1', depart: 'Rue Saint-Denis' })] }, A('conseil')]],
  ['Ferme la porte de Bagnolet', []],
  // ordres précis (lot « ordres précis »)
  ["Un cortège de 2000 personnes part de la place de la République vers le Châtelet, et des casseurs rue Saint-Denis", [A('cortege', { code: 'D1', depart: 'Place de la République', arrivee: 'Place du Châtelet', effectif: 2000 }), { ou: [A('zone_poser', { code: 'D2', lieu: 'Rue Saint-Denis' }), A('cortege', { code: 'D2', depart: 'Rue Saint-Denis' })] }]],
  ['Trois groupes : des syndicats rue de Rivoli, des supporters rue Saint-Denis et des casseurs rue Berger', [{ ou: [A('zone_poser', { code: 'D1', lieu: 'Rue de Rivoli' }), A('cortege', { code: 'D1', depart: 'Rue de Rivoli' })] }, { ou: [A('zone_poser', { code: 'D1', lieu: 'Rue Saint-Denis' }), A('cortege', { code: 'D1', depart: 'Rue Saint-Denis' })] }, { ou: [A('zone_poser', { code: 'D2', lieu: 'Rue Berger' }), A('cortege', { code: 'D2', depart: 'Rue Berger' })] }]],
  ['Ferme toutes les issues rue Berger', [11, 15, 19, 21].map(i => A('levier', { cible: `Issue rue Berger ${i}`, action: 'fermer' }))],
  ['Ferme toutes les portes sauf la porte Lescot', ['Porte Saint-Eustache', 'Porte Berger', 'Porte Marguerite de Navarre', 'Porte du Jour', 'Porte du Louvre', 'Porte du Pont Neuf', 'Porte Rambuteau'].map(n => A('levier', { cible: n, action: 'fermer' }))],
  ['Ferme les accès de métro de la porte Berger', ['Métro Porte Berger 1', 'Métro Porte Berger 2'].map(n => A('levier', { cible: n, action: 'fermer' }))],
  ['Ferme la porte Rambuteau dans 5 minutes', [A('levier', { cible: 'Porte Rambuteau', action: 'fermer', delai_s: 300 })]],
  ["Dans une demi-heure, annonce la sortie par la porte du Louvre, et ferme tout de suite l'issue côté piscine 2", [A('levier', { cible: 'Porte du Louvre', action: 'annonce', delai_s: 1800 }), A('levier', { cible: 'Issue côté piscine 2', action: 'fermer', delai_s: null })]],
  ['Quelles sorties sont fermées ?', [A('etat', { sujet: 'sorties_fermees' })]],
  ['Combien de personnes restent dans le Forum ?', [A('etat', { sujet: 'restants' })]],
];

const colle = (att, x) => Object.entries(att).every(([k, v]) => (x[k] ?? null) === v);
const developper = acts => acts.flatMap(x => x.type === 'levier' ? (x.cibles?.length ? x.cibles : [x.cible]).map(c => ({ ...x, cible: c })) : [x]);
const signe = x => [x.type, x.code, x.lieu, x.cible, x.action, x.depart && 'de ' + x.depart, x.arrivee && 'vers ' + x.arrivee, x.effectif, x.sujet, x.delai_s && x.delai_s + 's'].filter(Boolean).join(':');
let ok = 0, cout = 0;
for (const [texte, attendu] of CAS) {
  let r;
  try {
    const res = await fetch(URL_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte, contexte }) });
    r = await res.json();
    if (!res.ok) { console.log(`ÉCHEC  « ${texte} » : ${res.status} ${r.erreur}`); if (res.status === 503) process.exit(2); continue; }
  } catch (e) { console.log(`ÉCHEC  serveur injoignable (${e.message}) : lance node serveur.mjs`); process.exit(2); }
  const restants = developper(r.actions);
  const manque = attendu.filter(att => {
    const variantes = att.ou || [att];
    const i = restants.findIndex(x => variantes.some(v => colle(v, x)));
    if (i < 0) return true; restants.splice(i, 1); return false;
  });
  const enTrop = restants.filter(x => x.type !== 'conseil');
  const bon = !manque.length && !enTrop.length && (attendu.length || r.incompris.length);
  if (bon) ok++;
  cout += (r.jetons?.input_tokens || 0) * 2e-6 + (r.jetons?.output_tokens || 0) * 10e-6;
  console.log(`${bon ? 'OK    ' : 'ÉCHEC '} « ${texte} » (${r.ms} ms)\n        actions : ${developper(r.actions).map(signe).join(' | ') || '—'}${r.incompris.length ? `\n        incompris : ${r.incompris.join(' ; ')}` : ''}${manque.length ? `\n        manque : ${manque.map(m => signe(m.ou ? m.ou[0] : m)).join(' | ')}` : ''}${enTrop.length ? `\n        en trop : ${enTrop.map(signe).join(' | ')}` : ''}`);
}
console.log(`\n${ok}/${CAS.length} ordres compris correctement · coût estimé ${cout.toFixed(3)} $`);
process.exit(ok === CAS.length ? 0 : 1);
