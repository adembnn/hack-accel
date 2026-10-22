// Plan schématique du Forum des Halles (coordonnées normalisées 0..1). Positions indicatives : la scène 3D du lot
// jumeau-3d les remplacera. Les identifiants des sorties (porte-*, issue-*) sont ceux du fichier de résultats.
import type { Lieu } from './logique.mjs';

export const LIEUX: ReadonlyArray<Lieu> = [
  { id: 'porte-jour', nom: 'Porte du Jour', type: 'porte', x: 0.36, y: 0.1 },
  { id: 'porte-berger', nom: 'Porte Berger', type: 'porte', x: 0.3, y: 0.48 },
  { id: 'porte-rambuteau', nom: 'Porte Rambuteau', type: 'porte', x: 0.635, y: 0.31 },
  { id: 'porte-lescot', nom: 'Porte Lescot', type: 'porte', x: 0.6, y: 0.6 },
  { id: 'porte-pont-neuf', nom: 'Porte du Pont Neuf', type: 'porte', x: 0.48, y: 0.78 },
  { id: 'issue-berger-15', nom: 'Issue Berger 15', type: 'issue', x: 0.4, y: 0.66 },
  { id: 'issue-louvre', nom: 'Issue de secours Nord', type: 'issue', x: 0.52, y: 0.2 },
  { id: 'bouche-rambuteau', nom: 'Bouche Rambuteau', type: 'bouche', x: 0.7, y: 0.22 },
  { id: 'bouche-halles', nom: 'Bouche Les Halles', type: 'bouche', x: 0.2, y: 0.3 },
  { id: 'bouche-chatelet', nom: 'Bouche Châtelet', type: 'bouche', x: 0.52, y: 0.9 },
  { id: 'esc-lescot', nom: 'Escalator Lescot', type: 'escalator', x: 0.54, y: 0.52 },
  { id: 'esc-jour', nom: 'Escalator Jour', type: 'escalator', x: 0.42, y: 0.34 },
  { id: 'asc-berger', nom: 'Ascenseur Berger', type: 'ascenseur', x: 0.34, y: 0.56 },
  { id: 'asc-centre', nom: 'Ascenseur Centre', type: 'ascenseur', x: 0.46, y: 0.46 },
];

export const TITRES_TYPE: Record<Lieu['type'], string> = {
  porte: 'Portes',
  issue: 'Issues',
  bouche: 'Bouches',
  ascenseur: 'Ascens.',
  escalator: 'Escal.',
};

/** Rues tracées sur le plan (polylignes normalisées) avec leur nom. */
export const RUES: ReadonlyArray<{ nom: string; pts: ReadonlyArray<[number, number]>; label: [number, number] }> = [
  { nom: 'rue Berger', pts: [[0.05, 0.42], [0.28, 0.5], [0.5, 0.58]], label: [0.1, 0.4] },
  { nom: 'rue Rambuteau', pts: [[0.55, 0.05], [0.66, 0.3], [0.8, 0.55]], label: [0.72, 0.18] },
  { nom: 'rue Pierre Lescot', pts: [[0.7, 0.45], [0.62, 0.62], [0.5, 0.95]], label: [0.7, 0.72] },
  { nom: 'rue du Louvre', pts: [[0.2, 0.05], [0.4, 0.08], [0.6, 0.05]], label: [0.15, 0.06] },
];
export const EMPREINTE: { x: number; y: number; w: number; h: number } = { x: 0.3, y: 0.15, w: 0.32, h: 0.56 };
