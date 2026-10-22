// Données ILLUSTRATIVES pour les tests, les démos et l'écran de la maquette. Ce ne sont pas les plans réels du Forum des Halles :
// les noms de portes viennent du lot décideurs, le reste (salles, zones, rangs, refuge) est inventé pour l'exemple.
import type { Agent, Decision, Destinataire, Sorties } from './types.ts';

export const SORTIES_EXEMPLE: Sorties = {
  portes: ['lescot', 'berger', 'rambuteau', 'pont_neuf', 'saint_eustache', 'canopee'],
  salles: {
    salle_07: { zone: 'cinema', issues: [{ porte: 'lescot', chemin: ['couloir_nord', 'lescot'], rangs: [1, 10] }, { porte: 'pont_neuf', chemin: ['couloir_sud', 'pont_neuf'], rangs: [11, 30] }] },
    salle_08: { zone: 'cinema', issues: [{ porte: 'lescot', chemin: ['couloir_nord', 'lescot'], places: [1, 12] }, { porte: 'pont_neuf', chemin: ['couloir_sud', 'pont_neuf'], places: [13, 40] }] },
  },
  zones: {
    cinema: { portes: ['lescot', 'pont_neuf'], refuge: 'refuge_cinema', ascenseur: true },
    galerie: { portes: ['rambuteau', 'saint_eustache', 'canopee'], refuge: 'refuge_galerie' },
  },
  libelles: { lescot: 'Lescot', pont_neuf: 'Pont-Neuf', saint_eustache: 'Saint-Eustache', salle_07: '7', salle_08: '8', refuge_cinema: 'le refuge du cinéma', refuge_galerie: 'le refuge de la galerie' },
  postes_critiques: [
    { id: 'porte_lescot', type: 'porte', niveau: '-1', zone: 'cinema', porte: 'lescot' },
    { id: 'porte_pont_neuf', type: 'porte', niveau: '-1', zone: 'cinema', porte: 'pont_neuf' },
    { id: 'escalier_cinema', type: 'escalier', niveau: '-1', zone: 'cinema' },
    { id: 'croisement_galerie', type: 'croisement', niveau: '-1', zone: 'galerie' },
  ],
};

export const DECISION_EVACUATION_EXEMPLE: Decision = {
  id: 'dec-exemple-1',
  action: 'evacuer',
  contexte: 'incendie',
  portes: { berger: 'fermee', lescot: 'ouverte', pont_neuf: 'ouverte', rambuteau: 'ouverte', saint_eustache: 'ouverte', canopee: 'ouverte' },
  consignes_par_zone: { galerie: { porte: 'saint_eustache', clarte: 'claire' } },
  messages_par_zone: { galerie: 'Quittez la galerie calmement.' },
  phasage_salles: [{ salle: 'salle_07', minute_depart: 1165 }],
  guidage: [{ point: 'porte_lescot', agents: 2 }],
  minute: 1160,
};

export const AGENTS_EXEMPLE: Agent[] = [
  { id: 'pc-1', role: 'pc', poste: { niveau: '0' }, equipement: 'telephone' },
  { id: 'chef-1', role: 'chef_securite', poste: { niveau: '-1', zone: 'cinema' }, equipement: 'talkie' },
  { id: 'ssiap-1', role: 'ssiap', poste: { niveau: '-1', zone: 'cinema' }, equipement: 'oreillette' },
  { id: 'porte-lescot-1', role: 'agent_porte', poste: { niveau: '-1', porte: 'lescot' }, equipement: 'telephone' },
  { id: 'salle-07-1', role: 'agent_salle', poste: { niveau: '-1', salle: 'salle_07' }, equipement: 'oreillette' },
];

/** Population déterministe de `n` personnes : cinéma (salles 7 et 8, rangs et places variés) et galerie ; 1 sur 25 est PMR, 1 sur 7 parle anglais. */
export function populationExemple(n: number): Destinataire[] {
  const sortie: Destinataire[] = [];
  for (let i = 0; i < n; i++) {
    const cine = i % 3 !== 2;
    sortie.push({
      id: `p${i}`,
      billet: cine ? { salle: i % 2 ? 'salle_07' : 'salle_08', rang: String((i % 30) + 1), place: String((i % 40) + 1) } : undefined,
      zone: cine ? 'cinema' : 'galerie',
      niveau: cine ? '-1' : '0',
      pmr: i % 25 === 0,
      langue: i % 7 === 0 ? 'en' : 'fr',
      canal_prefere: 'telephone-simule',
    });
  }
  return sortie;
}
