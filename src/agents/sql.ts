// Alignement des types TypeScript avec le schéma PostgreSQL du lot aiven (infra/schema.sql, lu seulement, jamais modifié) :
// tables rex_crises, lecons, lecons_sources, decisions, tableau_commun. Adaptateurs purs, testés en aller-retour.
// Les noms de colonnes sont en snake_case comme dans le schéma ; les adaptateurs ne touchent ni la base ni le réseau.
import { createHash } from 'node:crypto';
import type { Action, Decideur, EntreeTableau } from './types.ts';
import { ACTEURS_CATALOGUE } from './types.ts';
import type { Lecon, RexCrise, StatutLecon } from './rex.ts';

// ---------- Décideurs : valeurs de decisions.decideur ----------
// Le schéma documente 'securite' (colonne libre, sans CHECK) ; le code utilise 'securite_centre'. L'adaptateur traduit.
export const DECIDEUR_VERS_SQL: Record<Decideur, string> = {
  prefecture: 'prefecture', ratp: 'ratp', securite_centre: 'securite', directeur: 'directeur', ugc: 'ugc', bspp: 'bspp',
};
export const DECIDEURS_SQL: readonly string[] = ACTEURS_CATALOGUE.map((d) => DECIDEUR_VERS_SQL[d]);
export const CHECK_DECIDEUR_SQL = `CHECK (decideur IN (${DECIDEURS_SQL.map((d) => `'${d}'`).join(', ')}))`;
export const decideurDepuisSql = (s: string): Decideur => {
  const d = ACTEURS_CATALOGUE.find((x) => DECIDEUR_VERS_SQL[x] === s);
  if (!d) throw new Error(`decideur SQL inconnu : ${s}`);
  return d;
};

// ---------- decisions : une ligne par levier actionné ----------
export interface LigneDecision {
  run_id: string; minute_simulee: number; decideur: string; levier: string; valeur: unknown; justification: string; score: unknown | null;
}
export function ligneDecision(run_id: string, minute: number, a: Action, justification = '', score: unknown | null = null): LigneDecision {
  return { run_id, minute_simulee: minute, decideur: DECIDEUR_VERS_SQL[a.decideur], levier: a.levier, valeur: a.valeur ?? {}, justification, score };
}
export function lignesDecisions(run_id: string, e: EntreeTableau): LigneDecision[] {
  return e.actions_acceptees.map((a) => ligneDecision(run_id, e.minute, a, (e.lecons_utilisees ?? []).length ? `leçons : ${(e.lecons_utilisees ?? []).join(', ')}` : ''));
}

// ---------- tableau_commun.contenu (jsonb sans schéma côté SQL : on le fige ici) ----------
export interface LigneTableau { run_id: string; auteur: string; genre: 'decision'; contenu: EntreeTableau }
export const ligneTableau = (run_id: string, e: EntreeTableau): LigneTableau => ({ run_id, auteur: DECIDEUR_VERS_SQL[e.decideur], genre: 'decision', contenu: structuredClone(e) });
export const entreeDepuisLigneTableau = (l: LigneTableau): EntreeTableau => ({ ...structuredClone(l.contenu), decideur: decideurDepuisSql(l.auteur) });

// ---------- rex_crises ----------
export interface LigneRex {
  enseigne_id: string; date_incident: string; zone: string; type_incident: string; description: string; decisions_prises: string;
  resultat: string; duree_minutes: number | null; personnes_touchees: number | null; lecons_enseigne: string; etiquettes: string[];
  empreinte: string; id_texte: string;
}
export const slug = (s: string): string => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function empreinteSql(r: RexCrise): string {
  return createHash('sha256').update([r.enseigne, r.date, r.type_incident, r.description].join('|')).digest('hex');
}

export function versLigneRex(r: RexCrise): LigneRex {
  return {
    enseigne_id: slug(r.enseigne), date_incident: r.date.slice(0, 10), zone: r.zone, type_incident: r.type_incident, description: r.description,
    decisions_prises: r.mesures.join(' ; '), resultat: r.efficace === true ? 'efficace' : r.efficace === false ? 'inefficace' : '',
    duree_minutes: r.duree_min, personnes_touchees: r.personnes_touchees ?? null, lecons_enseigne: '', etiquettes: [r.type_incident, r.zone],
    empreinte: empreinteSql(r), id_texte: r.id,
  };
}
export function depuisLigneRex(l: LigneRex, enseigne: string): RexCrise {
  return {
    id: l.id_texte, enseigne, zone: l.zone, type_incident: l.type_incident, date: l.date_incident, duree_min: l.duree_minutes ?? 0,
    ...(l.personnes_touchees !== null ? { personnes_touchees: l.personnes_touchees } : {}), description: l.description,
    mesures: l.decisions_prises ? l.decisions_prises.split(' ; ') : [],
    ...(l.resultat === 'efficace' ? { efficace: true } : l.resultat === 'inefficace' ? { efficace: false } : {}),
  };
}

// ---------- lecons + lecons_sources ----------
export interface LigneLecon {
  scene_id: string; texte: string; etiquettes: string[]; confiance: number | null; auteur: string; statut: StatutLecon;
  provenance: Record<string, unknown>; run_validation: string | null; sources: string[]; id_texte: string;
}
export function versLigneLecon(l: Lecon, scene_id: string): LigneLecon {
  return {
    scene_id, texte: l.enonce, etiquettes: [l.type_incident, l.zone], confiance: null, auteur: l.provenance.auteur, statut: l.statut,
    provenance: { ...l.provenance, contenu: { type_incident: l.type_incident, zone: l.zone, frequence: l.frequence, duree_moyenne_min: l.duree_moyenne_min, duree_max_min: l.duree_max_min, chiffres: l.chiffres } },
    run_validation: l.provenance.validation?.run_id ?? null, sources: [...l.sources], id_texte: l.id,
  };
}
export function depuisLigneLecon(l: LigneLecon): Lecon {
  const c = l.provenance.contenu as { type_incident: string; zone: string; frequence: number; duree_moyenne_min: number; duree_max_min: number; chiffres: Record<string, number> };
  const { contenu: _contenu, ...prov } = l.provenance;
  void _contenu;
  return { id: l.id_texte, type_incident: c.type_incident, zone: c.zone, frequence: c.frequence, duree_moyenne_min: c.duree_moyenne_min, duree_max_min: c.duree_max_min, sources: [...l.sources], enonce: l.texte, chiffres: c.chiffres, statut: l.statut, provenance: prov as Lecon['provenance'] };
}
