// Borne physique de l'évacuation du Forum des Halles : ce qu'aucun plan ne peut dépasser.
//
// Deux calculs exacts, tous deux des problèmes de flot (donc des programmes linéaires résolus par maxflow.ts) :
//  1. Débit : flot maximal en régime permanent depuis le cinéma vers la rue, porte par porte puis toutes ensemble.
//     La coupe minimale (dualité flot max / coupe min) désigne les arcs qui limitent : le goulot.
//  2. Temps : réseau « étendu dans le temps ». Chaque lieu est recopié à chaque pas de 10 s ; un passage de durée d pas
//     relie (lieu, t) à (lieu', t+d) avec la capacité d'un pas ; attendre relie (lieu, t) à (lieu, t+1) sans limite.
//     Le plus petit horizon T pour lequel le flot maximal atteint toute la demande est le meilleur temps possible.
//
// Hypothèses (voir LISEZMOI.md) : arcs parcourus dans les deux sens ; pas de limite de stockage dans les lieux
// (optimiste, donc un plancher) ; durées des arcs arrondies au pas le plus proche, au moins un pas.

import { fluxMax, type ArcEntree } from './maxflow.ts';

export interface Noeud {
  id: string;
  kind: string;
  name: string;
  level: number;
}
export interface ArcGraphe {
  a: string;
  b: string;
  kind: string;
  time_s: number;
  capacity_ps: number;
}
export interface GrapheForum {
  nodes: Noeud[];
  edges: ArcGraphe[];
}

// Hypothèses sur les portes (SFPE : 1,3 pers/s par mètre de largeur utile).
export const DEBIT_PAR_METRE_PS = 1.3;
export const LARGEUR_PORTE_M = 4;
export const LARGEUR_SECOURS_M = 1.4;
// Le cinéma débouche sur la Rue du Cinéma du niveau -3.
export const SOURCE_CINEMA = 'Z19';
export const PAS_S = 10;

export interface Maillon {
  de: string;
  vers: string;
  niveau_de: number;
  niveau_vers: number;
  capacite_pers_h: number;
  type: 'passage' | 'porte';
}
export interface Borne {
  fermees: string[];
  capacite_par_issue_pers_h: Record<string, number>;
  capacite_totale_pers_h: number;
  goulot: Maillon[];
  t_min_s: number; // Infinity si la demande ne peut pas sortir
}
export interface Options {
  source?: string;
  pas_s?: number;
}

export const debitPorte = (n: Noeud): number =>
  (n.id.includes('secours') ? LARGEUR_SECOURS_M : LARGEUR_PORTE_M) * DEBIT_PAR_METRE_PS;

// Arcs orientés utilisables : les deux sens de chaque arc, sauf si une extrémité est fermée.
function passages(g: GrapheForum, fermees: Set<string>): ArcGraphe[] {
  return g.edges.flatMap((e) => (fermees.has(e.a) || fermees.has(e.b) ? [] : [e, { ...e, a: e.b, b: e.a }]));
}

// Débit permanent source -> rue, avec seulement les `portes` données comme sorties. Rend aussi la coupe minimale.
function debitStatique(g: GrapheForum, fermees: Set<string>, source: string, portes: Noeud[]) {
  const idx = new Map(g.nodes.map((n, i) => [n.id, i]));
  const s = idx.get(source);
  if (s === undefined || fermees.has(source)) return { valeur: 0, goulot: [] as Maillon[] };
  const puits = g.nodes.length;
  const arcs: ArcEntree[] = [];
  const decrit: Maillon[] = [];
  for (const e of passages(g, fermees)) {
    const u = g.nodes[idx.get(e.a)!];
    const v = g.nodes[idx.get(e.b)!];
    arcs.push({ de: idx.get(e.a)!, vers: idx.get(e.b)!, capacite: e.capacity_ps });
    decrit.push({ de: u.name, vers: v.name, niveau_de: u.level, niveau_vers: v.level, capacite_pers_h: e.capacity_ps * 3600, type: 'passage' });
  }
  for (const p of portes) {
    arcs.push({ de: idx.get(p.id)!, vers: puits, capacite: debitPorte(p) });
    decrit.push({ de: p.name, vers: 'rue', niveau_de: p.level, niveau_vers: p.level, capacite_pers_h: debitPorte(p) * 3600, type: 'porte' });
  }
  const r = fluxMax(puits + 1, arcs, s, puits);
  return { valeur: r.valeur, goulot: r.indices_coupe.map((k) => decrit[k]) };
}

// Meilleur temps d'évacuation (en secondes) de `demande` personnes posées en `source` à t = 0, sur le réseau étendu dans le temps.
// `debit_ps` : débit permanent total (borne basse de départ pour la recherche).
export function tempsMin(g: GrapheForum, demande: number, fermees: Set<string>, source: string, pas_s: number, debit_ps: number): number {
  if (demande <= 0) return 0;
  if (debit_ps <= 0 || !g.nodes.some((n) => n.id === source)) return Infinity;
  const N = g.nodes.length;
  const idx = new Map(g.nodes.map((n, i) => [n.id, i]));
  const s = idx.get(source)!;
  const ouvertes = g.nodes.filter((n) => n.kind === 'sortie' && !fermees.has(n.id));
  const statiques = passages(g, fermees).map((e) => ({
    u: idx.get(e.a)!,
    v: idx.get(e.b)!,
    duree: Math.max(1, Math.round(e.time_s / pas_s)),
    cap: e.capacity_ps * pas_s,
  }));

  const faisable = (T: number): boolean => {
    const noeud = (i: number, t: number) => t * N + i;
    const puits = (T + 1) * N;
    const sup = puits + 1;
    const arcs: ArcEntree[] = [{ de: sup, vers: noeud(s, 0), capacite: demande }];
    for (let t = 0; t <= T; t++) {
      if (t < T) for (let i = 0; i < N; i++) arcs.push({ de: noeud(i, t), vers: noeud(i, t + 1), capacite: Infinity });
      for (const a of statiques) if (t + a.duree <= T) arcs.push({ de: noeud(a.u, t), vers: noeud(a.v, t + a.duree), capacite: a.cap });
      for (const p of ouvertes) arcs.push({ de: noeud(idx.get(p.id)!, t), vers: puits, capacite: debitPorte(p) * pas_s });
    }
    return fluxMax(puits + 2, arcs, sup, puits).valeur >= demande - 1e-6;
  };

  // Recherche de l'horizon : on double depuis l'estimation « demande / débit total », puis dichotomie (la faisabilité est monotone en T).
  let hi = Math.max(1, Math.ceil(demande / (debit_ps * pas_s)));
  while (!faisable(hi)) {
    hi *= 2;
    if (hi > 5000) return Infinity; // plus de 13 h : on considère que cela ne sort pas
  }
  let lo = Math.floor(hi / 2); // infaisable (ou 0)
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (faisable(mid)) hi = mid;
    else lo = mid;
  }
  return hi * pas_s;
}

export function bornePhysique(g: GrapheForum, demande: number, fermees: string[] = [], options: Options = {}): Borne {
  const source = options.source ?? SOURCE_CINEMA;
  const pas_s = options.pas_s ?? PAS_S;
  const closed = new Set(fermees);
  const portes = g.nodes.filter((n) => n.kind === 'sortie' && !closed.has(n.id));

  // Capacité de chaque porte seule, puis de toutes ensemble (le total n'est pas la somme : les portes partagent des couloirs).
  const capacite_par_issue_pers_h: Record<string, number> = {};
  for (const p of portes) capacite_par_issue_pers_h[p.id] = debitStatique(g, closed, source, [p]).valeur * 3600;
  const total = debitStatique(g, closed, source, portes);
  return {
    fermees,
    capacite_par_issue_pers_h,
    capacite_totale_pers_h: total.valeur * 3600,
    goulot: total.goulot,
    t_min_s: tempsMin(g, demande, closed, source, pas_s, total.valeur),
  };
}

// Avant / après fermeture : perte de capacité en % et temps supplémentaire.
export function comparerFermeture(g: GrapheForum, demande: number, fermees: string[], options: Options = {}) {
  const avant = bornePhysique(g, demande, [], options);
  const apres = bornePhysique(g, demande, fermees, options);
  const perte_capacite_pct = avant.capacite_totale_pers_h > 0 ? (1 - apres.capacite_totale_pers_h / avant.capacite_totale_pers_h) * 100 : 0;
  return { avant, apres, perte_capacite_pct, t_min_supplement_s: apres.t_min_s - avant.t_min_s };
}
