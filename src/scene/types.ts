// Format de scene.json (superset du scene.json de la maquette reports/maquettes/chatelet-3d : la vue 3D d'Adem le lit sans changement).
// Repère : mètres, origine au centre du Forum, x vers l'est, z vers le sud (z de la scène = y des contraintes), niveau n à l'altitude n × etage.
import type { EtatContrainte, TypeContrainte } from './contrainte.ts';

export interface Niveau {
  niveau: number; // 0 à -5
  altitude_m: number;
  /** true = le niveau est peu ou pas documenté dans OpenStreetMap : sa géométrie est complétée par des liaisons estimées. */
  estime: boolean;
  raison: string;
  nb_objets_osm: number;
}

export interface Porte {
  id: string;
  type: Extract<TypeContrainte, 'porte' | 'sortie'>;
  k: string; // valeur du tag OSM entrance
  n: string;
  x: number;
  z: number;
  l: number[]; // [niveau]
  largeur_m: number;
  etat: EtatContrainte;
  /** true = largeur (ou niveau) non documentés dans OSM, valeur par défaut posée par nous. */
  estime: boolean;
}

export interface Bouche {
  id: string;
  type: 'bouche_metro';
  k: 'metro' | 'rer';
  n: string;
  x: number;
  z: number;
  l: number[];
  largeur_m: number;
  etat: EtatContrainte;
  estime: boolean;
}

export interface LienVertical {
  id: string;
  type: 'escalier' | 'escalator' | 'ascenseur';
  l: number[]; // niveaux reliés (min..max)
  n: string;
  d?: string; // sens de l'escalator (conveying) si connu
  x?: number; // ascenseur : position (lue par la vue 3D de la maquette)
  z?: number;
  p: number[]; // tracé aplati [x,z,x,z,...] (un polygone pour un ascenseur)
  de: { niveau: number; x: number; z: number };
  vers: { niveau: number; x: number; z: number };
  largeur_m: number;
  etat: EtatContrainte;
  estime: boolean;
}

export interface Sortie {
  id: string;
  genre: 'rue' | 'secours' | 'metro';
  ref: string; // id de la porte ou de la bouche
  niveau: number;
  x: number;
  z: number;
  largeur_m: number;
  etat: EtatContrainte;
  /** true = la sortie débouche sur un lieu non modélisé (intérieur d'une station) : le flux y disparaît. */
  hors_modele: boolean;
  /** Clé de la porte nommée du Forum pour les décideurs (lescot, berger, rambuteau, pont_neuf, saint_eustache, jour, louvre, marguerite_de_navarre, montorgueil). */
  nom_porte?: string;
}

export interface Polygone { k?: string; n?: string; l?: number[]; p: number[] }
export interface Cheminement { k: string; n: string; l: number[]; w: number; p: number[] }

export interface Scene {
  version: 1;
  origine: [number, number];
  etage: number;
  rayon_rues_m: number;
  genere: string; // jamais de date mouvante : provenance des données
  sources: string[];
  niveaux: Niveau[];
  batiments: { h: number; b: number; n: string; k: string; p: number[]; estime?: boolean }[];
  interieur: { k: string; l: number[]; n: string; p: number[] }[];
  chemins: Cheminement[]; // footway/corridor/pedestrian avec niveau
  escalators: LienVertical[];
  escaliers: LienVertical[];
  ascenseurs: LienVertical[];
  portes: Porte[];
  metro: Bouche[];
  sorties: Sortie[];
  rues: { k: string; n: string; w: number; p: number[] }[];
  pietons: { n: string; p: number[] }[];
  // calques de la maquette non alimentés ici (absents des extraits téléchargés)
  quais: unknown[]; voies: unknown[]; incendie: unknown[]; arbres: unknown[]; bancs: unknown[]; bornes: unknown[]; velib: unknown[]; verts: unknown[]; eau: unknown[];
}
