// Test de /api/agents : 3 lots réalistes (situation du 19 oct. : stations fermées, troubles Porte Berger).
// Usage : PORT_MAQUETTE=8767 node test-agents.mjs   (ou URL_API=http://127.0.0.1:8767)
// Vérifie : action de la liste, cible présente dans la perception (null pour attendre/appeler_pc), raison non vide,
// aucune action interdite, un id par agent. Affiche jetons, ms et coût estimé (Haiku 5.5 : 0,10 $/M entrée, 0,50 $/M sortie).
// Code de sortie 0 si tout passe. Le test réel appelle Claude (payant, quelques centimes) : il demande la clé dans .env.
const URL_API = process.env.URL_API || `http://127.0.0.1:${process.env.PORT_MAQUETTE || 8767}`;
const ACTIONS = ['deplacer', 'guider', 'crier', 'bloquer', 'ouvrir', 'appeler_pc', 'attendre'];
const SANS_CIBLE = ['attendre', 'appeler_pc'];
const INTERDITES = /attaqu|frapp|tuer|blesser|incendi|arme|explos|piéger|piege|agress|cibler la foule/i;

const SORTIES_OUVERTES = ['Porte Lescot', 'Porte du Louvre', 'Porte Rambuteau'];
const base = (extra) => ({ stations_fermees: ['Châtelet-Les Halles', 'Les Halles RER'], sorties: SORTIES_OUVERTES, portes_fermees: ['Porte Berger'], ...extra });
const LOTS = [
  { T: 20 * 60, agents: [ // 20h : les stations ferment, premiers troubles rue Berger
    { id: 'a1', role: 'securite', perception: base({ lieu: 'Porte Lescot', densite: 2.1, zone_proche: false, ordre: 'garder les accès ouverts' }) },
    { id: 'a2', role: 'securite', perception: base({ lieu: 'Porte Berger', densite: 3.4, zone_proche: true, ordre: null }) },
    { id: 'a3', role: 'directeur', perception: base({ lieu: 'PC sécurité', densite: 0.5, zone_proche: false, ordre: null, alertes: ['troubles rue Berger'] }) },
    { id: 'a4', role: 'ratp', perception: base({ lieu: 'Châtelet-Les Halles', densite: 4.2, zone_proche: false, ordre: 'station fermée' }) },
    { id: 'a5', role: 'panique', perception: base({ lieu: 'Cinéma, hall', densite: 3.8, zone_proche: false, ordre: null }) },
    { id: 'a6', role: 'parent', perception: base({ lieu: 'Niveau -2', densite: 2.9, zone_proche: false, ordre: null }) },
    { id: 'a7', role: 'filme', perception: base({ lieu: 'Porte Berger', densite: 3.1, zone_proche: true, ordre: null }) },
    { id: 'a8', role: 'pmr', perception: base({ lieu: 'Niveau -1', densite: 1.8, zone_proche: false, ascenseurs_en_service: ['Ascenseur Lescot'], ordre: null }) },
  ] },
  { T: 20 * 60 + 600, agents: [ // 20h10 : évacuation partielle du cinéma
    { id: 'b1', role: 'pompier', perception: base({ lieu: 'Porte Rambuteau', densite: 2.5, zone_proche: false, ordre: 'sécuriser les issues', zones: ['Rue Berger'] }) },
    { id: 'b2', role: 'police', perception: base({ lieu: 'Rue Berger', densite: 3.9, zone_proche: true, ordre: 'tenir le périmètre', zones: ['Rue Berger'] }) },
    { id: 'b3', role: 'chef_de_poste', perception: base({ lieu: 'Niveau -1', densite: 2.7, zone_proche: false, ordre: 'évacuer le niveau -1 par Porte Lescot' }) },
    { id: 'b4', role: 'meneur', perception: base({ lieu: 'Cinéma, sortie salles', densite: 4.4, zone_proche: false, ordre: null }) },
    { id: 'b5', role: 'panique', perception: base({ lieu: 'Porte du Louvre', densite: 5.2, zone_proche: false, ordre: null }) },
    { id: 'b6', role: 'parent', perception: base({ lieu: 'Cinéma, hall', densite: 4.6, zone_proche: false, ordre: null }) },
    { id: 'b7', role: 'securite', perception: base({ lieu: 'Porte du Louvre', densite: 5.0, zone_proche: false, ordre: 'annoncer Porte Lescot' }) },
    { id: 'b8', role: 'pmr', perception: base({ lieu: 'Niveau -2', densite: 2.2, zone_proche: false, ascenseurs_en_service: [], ordre: null }) },
    { id: 'b9', role: 'filme', perception: base({ lieu: 'Place Carrée', densite: 1.2, zone_proche: false, ordre: null }) },
  ] },
  { T: 20 * 60 + 1500, agents: [ // 20h25 : porte Lescot saturée, une issue de secours à décider
    { id: 'c1', role: 'directeur', perception: base({ lieu: 'PC sécurité', densite: 0.6, zone_proche: false, ordre: null, alertes: ['Porte Lescot saturée', 'Issue rue Rambuteau 3 disponible'], sorties: [...SORTIES_OUVERTES, 'Issue rue Rambuteau 3'] }) },
    { id: 'c2', role: 'chef_de_poste', perception: base({ lieu: 'Porte Lescot', densite: 5.4, zone_proche: false, ordre: null, sorties: [...SORTIES_OUVERTES, 'Issue rue Rambuteau 3'] }) },
    { id: 'c3', role: 'securite', perception: base({ lieu: 'Porte Lescot', densite: 5.6, zone_proche: false, ordre: null, sorties: [...SORTIES_OUVERTES, 'Issue rue Rambuteau 3'] }) },
    { id: 'c4', role: 'securite', perception: base({ lieu: 'Issue rue Rambuteau 3', densite: 0.8, zone_proche: false, ordre: null, portes_fermees: ['Porte Berger', 'Issue rue Rambuteau 3'] }) },
    { id: 'c5', role: 'pompier', perception: base({ lieu: 'Niveau -1', densite: 3.3, zone_proche: false, ordre: null }) },
    { id: 'c6', role: 'panique', perception: base({ lieu: 'Porte Lescot', densite: 5.8, zone_proche: false, ordre: null }) },
    { id: 'c7', role: 'meneur', perception: base({ lieu: 'Niveau -2', densite: 3.0, zone_proche: false, ordre: null }) },
    { id: 'c8', role: 'parent', perception: base({ lieu: 'Porte Rambuteau', densite: 2.0, zone_proche: false, ordre: null }) },
    { id: 'c9', role: 'ratp', perception: base({ lieu: 'Les Halles RER', densite: 3.5, zone_proche: false, ordre: 'station fermée' }) },
    { id: 'c10', role: 'pmr', perception: base({ lieu: 'Porte Lescot', densite: 5.0, zone_proche: false, ascenseurs_en_service: ['Ascenseur Lescot'], ordre: null }) },
  ] },
];

let echecs = 0, jetonsTot = 0, coutTot = 0;
const verifier = (lot, rep) => {
  const pb = [];
  const ids = new Set(lot.agents.map((a) => a.id));
  const vus = new Set();
  if (!Array.isArray(rep.decisions)) return ['decisions absent'];
  for (const d of rep.decisions) {
    const a = lot.agents.find((x) => x.id === d.id);
    if (!a) { pb.push(`id inconnu ${d.id}`); continue; }
    vus.add(d.id);
    if (!ACTIONS.includes(d.action)) pb.push(`${d.id}: action « ${d.action} » hors liste`);
    if (typeof d.raison !== 'string' || !d.raison.trim()) pb.push(`${d.id}: raison vide`);
    if (typeof d.message !== 'string') pb.push(`${d.id}: message absent`);
    if (SANS_CIBLE.includes(d.action)) { if (d.cible != null) pb.push(`${d.id}: ${d.action} avec cible « ${d.cible} »`); }
    else if (typeof d.cible !== 'string' || !JSON.stringify(a.perception).includes(d.cible)) pb.push(`${d.id}: cible « ${d.cible} » absente de la perception`);
    if (INTERDITES.test(`${d.message} ${d.raison}`)) pb.push(`${d.id}: texte à action interdite : ${d.message} / ${d.raison}`);
  }
  for (const id of ids) if (!vus.has(id)) pb.push(`${id}: aucune décision`);
  return pb;
};

for (const [i, lot] of LOTS.entries()) {
  let rep;
  try {
    const r = await fetch(`${URL_API}/api/agents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lot) });
    rep = await r.json();
    if (!r.ok) { console.log(`lot ${i + 1} : HTTP ${r.status} ${rep.erreur || ''}`); echecs++; continue; }
  } catch (e) { console.log(`lot ${i + 1} : serveur injoignable (${URL_API}) : ${e.message}`); echecs++; continue; }
  const pb = verifier(lot, rep);
  const j = rep.jetons || {};
  const ent = j.input_tokens || 0, sor = j.output_tokens || 0, lu = j.cache_read_input_tokens || 0, ecr = j.cache_creation_input_tokens || 0;
  const cout = (ent * 0.10 + sor * 0.50 + lu * 0.01 + ecr * 0.125) / 1e6;
  jetonsTot += ent + sor + lu + ecr; coutTot += cout;
  console.log(`lot ${i + 1} (${lot.agents.length} agents) · ${rep.modele || '?'} · ${rep.ms} ms · jetons entrée ${ent} sortie ${sor} cache lu ${lu} écrit ${ecr} · ~${cout.toFixed(5)} $ · ${pb.length ? 'ÉCHEC' : 'ok'}`);
  rep.decisions.forEach((d) => console.log(`   ${d.id} ${d.action}${d.cible ? ' → ' + d.cible : ''}${d.message ? ' · « ' + d.message + ' »' : ''}`));
  pb.forEach((p) => console.log('   ! ' + p));
  if (pb.length) echecs++;
}
console.log(`\ntotal : ${jetonsTot} jetons, ~${coutTot.toFixed(5)} $ · ${echecs ? echecs + ' lot(s) en échec' : 'tout passe'}`);
process.exit(echecs ? 1 : 0);
