// Adaptateur 2 : sorties réelles du navgrid (identifiants OSM anonymes) -> issues du lot foule-decision (portes nommées du lot decideurs).
// Les 10 portes du lot decideurs (PORTES) servent d'identifiants d'issue ; chaque sortie praticable du niveau 0 est rattachée à la
// porte nommée la plus proche (ancre = position d'une entrée nommée dans scene.json). Écarts : voir LISEZMOI.md.
import type { Scene as SceneJumeau } from '../scene/types.ts';
import { PORTES, PORTES_VERS_PERIMETRE } from '../agents/types.ts';
import type { Issue, Scene } from '../sim/behavior/types.ts';
import type { Cell } from '../sim/motion/navgrid.ts';
import type { GrilleIntegree } from './grille.ts';

const NOMS_ANCRES: [string, RegExp][] = [
  ['lescot', /porte lescot/i], ['berger', /porte berger/i], ['rambuteau', /porte rambuteau/i], ['pont_neuf', /porte du pont neuf/i],
  ['saint_eustache', /porte saint-eustache/i], ['jour', /porte du jour/i], ['louvre', /porte du louvre/i],
  ['marguerite_de_navarre', /porte marguerite de navarre/i], ['parking_turbigo', /rue de turbigo/i],
];

export interface IssueReelle {
  id: string;
  cellules: Cell[];
  largeur_m: number;
  exits_ids: string[];
}

export interface CarteIssues {
  issues: IssueReelle[];
  /** Portes du lot decideurs sans aucune sortie réelle rattachée (ignorées par la chaîne). */
  portes_sans_sortie: string[];
  /** Ancres trouvées (nom -> position) et ancres absentes de scene.json. */
  ancres: Record<string, { x: number; z: number } | null>;
  sorties_ignorees: string[];
}

export function construireCarte(g: GrilleIntegree, scene: SceneJumeau): CarteIssues {
  const ancres: CarteIssues['ancres'] = {};
  const candidats = [...scene.metro, ...scene.portes];
  for (const [id, re] of NOMS_ANCRES) {
    const hits = candidats.filter((c) => re.test(c.n ?? ''));
    ancres[id] = hits.length ? { x: hits.reduce((s, h) => s + h.x, 0) / hits.length, z: hits.reduce((s, h) => s + h.z, 0) / hits.length } : null;
  }
  const ignorees: string[] = [];
  const groupes = new Map<string, { cells: Cell[]; largeur: number; ids: string[] }>();
  const ajouter = (id: string, c: Cell, largeur: number, sid: string) => {
    const gp = groupes.get(id) ?? { cells: [], largeur: 0, ids: [] };
    gp.cells.push(c); gp.largeur += largeur; gp.ids.push(sid);
    groupes.set(id, gp);
  };
  const rues: { s: (typeof g.ng.sorties)[number]; c: Cell }[] = [];
  for (const s of g.ng.sorties) {
    if (s.etat !== 'ouverte') { ignorees.push(`${s.id} (${s.etat})`); continue; }
    if (!g.dansCadre(s.x, s.y)) { ignorees.push(`${s.id} (hors cadre)`); continue; }
    const c = g.plusProche(g.cellule(s.niveau, s.x, s.y), 12);
    if (!c) { ignorees.push(`${s.id} (aucune cellule praticable à moins de 6 m)`); continue; }
    if (s.genre === 'metro') ajouter('metro', c, s.largeur_m, s.id);
    else rues.push({ s, c });
  }
  // Rue/secours : porte nommée la plus proche ; « canopee » (aucune ancre dans scene.json) = sortie la plus proche du centre du Forum.
  const centre = rues.length ? rues.reduce((a, b) => (Math.hypot(b.s.x - 30, b.s.y - 50) < Math.hypot(a.s.x - 30, a.s.y - 50) ? b : a)) : null;
  for (const { s, c } of rues) {
    if (centre && s === centre.s) { ajouter('canopee', c, s.largeur_m, s.id); continue; }
    let best = 'lescot'; let dmin = Infinity;
    for (const [id, a] of Object.entries(ancres)) {
      if (!a) continue;
      const d = Math.hypot(a.x - s.x, a.z - s.y);
      if (d < dmin) { dmin = d; best = id; }
    }
    ajouter(best, c, s.largeur_m, s.id);
  }
  const issues: IssueReelle[] = [...groupes.entries()].map(([id, gp]) => ({ id, cellules: gp.cells, largeur_m: gp.largeur, exits_ids: gp.ids }));
  return { issues, portes_sans_sortie: PORTES.filter((p) => !groupes.has(p)), ancres, sorties_ignorees: ignorees };
}

/** Scène du lot foule-decision construite depuis les sorties réelles (remplace SCENE_UGC). distance_m est fourni par le moteur. */
export function construireScene(carte: CarteIssues, distances_m: Record<string, number>, metro_ferme_s: number): Scene {
  // Hypothèse : on est entré par l’issue de rue la plus proche des salles (aucune porte d’entrée n’est identifiée dans scene.json).
  const entree = carte.issues.filter((r) => r.id !== "metro").sort((a, b) => (distances_m[a.id] ?? 1e9) - (distances_m[b.id] ?? 1e9))[0]?.id;
  const issues: Issue[] = carte.issues.map((r) => {
    const metro = r.id === 'metro';
    return {
      id: r.id,
      nom: metro ? 'Accès métro et RER' : `Porte ${r.id.replace(/_/g, ' ')}`,
      distance_m: distances_m[r.id] ?? 200,
      largeur_m: Math.max(1, r.largeur_m),
      surface_approche_m2: Math.max(40, 20 * r.largeur_m),
      porte_entree: r.id === entree,
      visible: r.id !== 'parking_turbigo' && !metro, // hypothèse de signalétique
      ouverte: true,
      derriere: PORTES_VERS_PERIMETRE.includes(r.id) ? 'interdite' : 'sur',
      ...(metro ? { devient_cul_de_sac_a_s: metro_ferme_s } : {}),
      zone: metro ? 'metro' : 'rue',
    };
  });
  return { nom: 'Forum des Halles (sorties réelles du navgrid)', issues, surface_salle_m2: 0 };
}
