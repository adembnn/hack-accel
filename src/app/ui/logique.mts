// Logique pure de l'interface (aucun accès au navigateur) : seuils, état des onglets, perturbations posables,
// lecture du fichier de résultats, alertes dérivées, appels serveur qui ne lèvent jamais d'erreur.
// Les seuils viennent de reports/criteres-jugement-crise.md (Still, guides britanniques).

export const SEUILS = {
  orange: 3, // pers./m² : redline foule mobile de Still (décision d'Adem, 22 oct.)
  rouge: 4, // pers./m² : guides britanniques
  statique: 5, // pers./m² : redline statique de Still
  jaugeMax: 6, // haut de l'échelle de la jauge de tension
} as const;

export type Niveau = 'normal' | 'orange' | 'rouge';
export type NomOnglet = 'directeur' | 'dispositif' | 'agir' | 'simuler' | 'voir';
export const ONGLETS: ReadonlyArray<{ id: NomOnglet; titre: string }> = [
  { id: 'directeur', titre: 'Directeur' },
  { id: 'dispositif', titre: 'Dispositif' },
  { id: 'agir', titre: 'Agir' },
  { id: 'simuler', titre: 'Simuler' },
  { id: 'voir', titre: 'Voir' },
];

export function niveauDensite(densite: number): Niveau {
  if (densite >= SEUILS.rouge) return 'rouge';
  if (densite >= SEUILS.orange) return 'orange';
  return 'normal';
}

/** Jauge de tension : position 0..1 sur l'échelle 0..jaugeMax, avec les repères des seuils sur la même échelle. */
export function jaugeTension(densiteMax: number) {
  const borne = (v: number) => Math.min(1, Math.max(0, v / SEUILS.jaugeMax));
  return {
    position: borne(densiteMax),
    orange: borne(SEUILS.orange),
    rouge: borne(SEUILS.rouge),
    niveau: niveauDensite(densiteMax),
  };
}

// ---------- Résultats : seule source des chiffres ----------

export type SourceResultats = 'simulation' | 'exemple';
export interface PointSerie {
  t: number;
  non_sortis: number;
  densite_max: number;
  densite_lieu?: string;
  personnes_min_sup5: number;
  vers_zone: number;
}
export interface Bilan {
  non_sortis: number;
  personnes_min_sup5: number;
  vers_zone: number;
  temps_evacuation_s: number;
}
export interface Sortie {
  id: string;
  densite: number;
  flux: number;
}
export interface Jalon {
  t: number;
  libelle: string;
  type: 'fait' | 'danger';
}
export interface Resultats {
  source: SourceResultats;
  scenario: string;
  total_personnes: number;
  horizon_s: number;
  interieur_estime: boolean;
  serie: PointSerie[];
  sorties: Record<string, Sortie[]>; // clé = temps (s) du point de série
  avant: Bilan;
  apres: Bilan;
  jalons: Jalon[];
}

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const bilanValide = (b: unknown): b is Bilan => {
  const o = b as Record<string, unknown> | null;
  return !!o && nombre(o.non_sortis) && nombre(o.personnes_min_sup5) && nombre(o.vers_zone) && nombre(o.temps_evacuation_s);
};

/** Valide un fichier de résultats. Retourne null s'il est inexploitable ; toute source autre que « simulation » vaut « exemple ». */
export function lireResultats(brut: unknown): Resultats | null {
  const o = brut as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || !Array.isArray(o.serie)) return null;
  if (!nombre(o.total_personnes) || !nombre(o.horizon_s) || !bilanValide(o.avant) || !bilanValide(o.apres)) return null;
  const serie = (o.serie as PointSerie[]).filter(
    (p) => p && nombre(p.t) && nombre(p.non_sortis) && nombre(p.densite_max) && nombre(p.personnes_min_sup5) && nombre(p.vers_zone),
  );
  if (serie.length === 0) return null;
  return {
    source: o.source === 'simulation' ? 'simulation' : 'exemple',
    scenario: typeof o.scenario === 'string' ? o.scenario : '',
    total_personnes: o.total_personnes,
    horizon_s: o.horizon_s,
    interieur_estime: o.interieur_estime === true,
    serie: [...serie].sort((a, b) => a.t - b.t),
    sorties: (o.sorties as Record<string, Sortie[]>) ?? {},
    avant: o.avant,
    apres: o.apres,
    jalons: Array.isArray(o.jalons) ? (o.jalons as Jalon[]) : [],
  };
}

/** Badge à afficher à côté des chiffres : « EXEMPLE » tant que la source n'est pas une vraie simulation. */
export const badgeSource = (r: Resultats | null): 'EXEMPLE' | null => (r?.source === 'simulation' ? null : 'EXEMPLE');

/** Dernier point de série à t ou avant ; le premier si t précède la série. */
export function pointA(r: Resultats, t: number): PointSerie {
  let res = r.serie[0]!;
  for (const p of r.serie) if (p.t <= t) res = p;
  return res;
}

export function sortiesA(r: Resultats, t: number): Sortie[] {
  return r.sorties[String(pointA(r, t).t)] ?? [];
}

export interface Alerte {
  t: number;
  niveau: Exclude<Niveau, 'normal'>;
  texte: string;
}
/** Fil d'alertes : premier franchissement de chaque seuil de densité dans la série (rien d'autre n'est inventé). */
export function alertesDepuisSerie(serie: ReadonlyArray<PointSerie>): Alerte[] {
  const res: Alerte[] = [];
  for (const niv of ['orange', 'rouge'] as const) {
    const seuil = SEUILS[niv];
    const p = serie.find((x) => x.densite_max >= seuil);
    if (p) {
      const lieu = p.densite_lieu ? ` · ${p.densite_lieu}` : '';
      res.push({ t: p.t, niveau: niv, texte: `Zone bouchée : ${String(p.densite_max).replace('.', ',')} pers./m²${lieu} (seuil ${seuil})` });
    }
  }
  return res.sort((a, b) => a.t - b.t || (a.niveau === 'orange' ? -1 : 1));
}

export function formatT(t: number): string {
  const s = Math.max(0, Math.round(t));
  return `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- Perturbations posables (codes de reports/catalogue-contraintes.md) ----------

export type TypeLieu = 'porte' | 'issue' | 'bouche' | 'escalator' | 'ascenseur';
export type CodePerturbation = 'C1' | 'B1' | 'B3' | 'B5' | 'D1' | 'D2' | 'D5' | 'F1';
export type ModePose = 'lieu' | 'carte' | 'delai';
export interface DefPerturbation {
  code: CodePerturbation;
  nom: string;
  famille: string;
  pose: ModePose;
  typesCible?: ReadonlyArray<TypeLieu>;
}

export const CATALOGUE: ReadonlyArray<DefPerturbation> = [
  { code: 'C1', nom: 'Bouche de métro fermée', famille: 'Transport', pose: 'lieu', typesCible: ['bouche'] },
  { code: 'B1', nom: 'Issue bloquée', famille: 'Infrastructure', pose: 'lieu', typesCible: ['issue', 'porte'] },
  { code: 'B3', nom: 'Escalator arrêté', famille: 'Infrastructure', pose: 'lieu', typesCible: ['escalator'] },
  { code: 'B5', nom: 'Ascenseur en panne', famille: 'Infrastructure', pose: 'lieu', typesCible: ['ascenseur'] },
  { code: 'D1', nom: 'Manifestation', famille: 'Extérieur', pose: 'carte' },
  { code: 'D2', nom: 'Troubles, dégradations', famille: 'Extérieur', pose: 'carte' },
  { code: 'D5', nom: 'Colis suspect', famille: 'Extérieur', pose: 'carte' },
  { code: 'F1', nom: 'Information tardive', famille: 'Organisation', pose: 'delai' },
];

export interface Lieu {
  id: string;
  nom: string;
  type: TypeLieu;
  x: number; // 0..1 sur le plan schématique
  y: number;
}
export interface Perturbation {
  id: string;
  code: CodePerturbation;
  nom: string;
  lieuId?: string;
  x?: number;
  y?: number;
  delai_s?: number;
  libelle: string;
}
export interface Cible {
  lieu?: Lieu;
  x?: number;
  y?: number;
  delai_s?: number;
}

/** Détail de l'événement `contrainte` émis vers le reste de l'application. */
export interface Contrainte {
  etat: 'pose' | 'levee';
  code: CodePerturbation;
  id: string;
  nom: string;
  lieuId?: string;
  position?: { x: number; y: number }; // coordonnées normalisées du plan schématique
  delai_s?: number;
  t: number; // temps simulé du curseur, en secondes
}
export const EVENEMENT_CONTRAINTE = 'contrainte';

export function creerPerturbation(code: CodePerturbation, cible: Cible, seq: number): Perturbation | null {
  const def = CATALOGUE.find((d) => d.code === code);
  if (!def) return null;
  const id = `${code}-${seq}`;
  if (def.pose === 'lieu') {
    if (!cible.lieu || !def.typesCible?.includes(cible.lieu.type)) return null;
    return { id, code, nom: def.nom, lieuId: cible.lieu.id, x: cible.lieu.x, y: cible.lieu.y, libelle: `${def.nom} · ${cible.lieu.nom}` };
  }
  if (def.pose === 'carte') {
    if (!nombre(cible.x) || !nombre(cible.y)) return null;
    return { id, code, nom: def.nom, x: cible.x, y: cible.y, libelle: `${def.nom} (${code})` };
  }
  if (!nombre(cible.delai_s) || cible.delai_s <= 0) return null;
  return { id, code, nom: def.nom, delai_s: cible.delai_s, libelle: `${def.nom} : +${Math.round(cible.delai_s)} s` };
}

/** Perturbation que pose un clic sur un lieu de ce type. */
export const codePourType = (type: TypeLieu): CodePerturbation => ({ porte: 'B1', issue: 'B1', bouche: 'C1', escalator: 'B3', ascenseur: 'B5' } as const)[type];

export function versContrainte(p: Perturbation, etat: Contrainte['etat'], t: number): Contrainte {
  const c: Contrainte = { etat, code: p.code, id: p.id, nom: p.nom, t };
  if (p.lieuId) c.lieuId = p.lieuId;
  if (nombre(p.x) && nombre(p.y)) c.position = { x: p.x, y: p.y };
  if (p.delai_s !== undefined) c.delai_s = p.delai_s;
  return c;
}

/** Compteurs « ouverts / total » des leviers ; un lieu visé par une perturbation active compte comme fermé. */
export function compteursLeviers(lieux: ReadonlyArray<Lieu>, actives: ReadonlyArray<Perturbation>) {
  const fermes = new Set(actives.map((p) => p.lieuId).filter((v): v is string => !!v));
  const res: Partial<Record<TypeLieu, { ouverts: number; total: number }>> = {};
  for (const l of lieux) {
    const c = (res[l.type] ??= { ouverts: 0, total: 0 });
    c.total += 1;
    if (!fermes.has(l.id)) c.ouverts += 1;
  }
  return res;
}

export function lieuLePlusProche(lieux: ReadonlyArray<Lieu>, x: number, y: number, maxDist = 0.04): Lieu | null {
  let best: Lieu | null = null;
  let bd = maxDist;
  for (const l of lieux) {
    const d = Math.hypot(l.x - x, l.y - y);
    if (d <= bd) {
      best = l;
      bd = d;
    }
  }
  return best;
}

// ---------- État des onglets ----------

export interface ContexteOnglets {
  propositionsEnAttente: number;
  decisionsRegistre: number;
  perturbationsActives: number;
  niveau: Niveau;
}
export interface EtatOnglet {
  pastille: number | null;
  ton: 'neutre' | 'ambre' | 'rouge';
}

/** Pastille et ton de chaque onglet : neutre tant que rien ne cloche, ambre = à valider, rouge = danger. */
export function etatOnglet(id: NomOnglet, c: ContexteOnglets): EtatOnglet {
  switch (id) {
    case 'directeur':
      return { pastille: c.propositionsEnAttente || null, ton: c.propositionsEnAttente ? 'ambre' : 'neutre' };
    case 'dispositif':
      return { pastille: c.decisionsRegistre || null, ton: 'neutre' };
    case 'agir':
      return { pastille: c.perturbationsActives || null, ton: c.perturbationsActives ? 'rouge' : 'neutre' };
    case 'simuler':
      return { pastille: null, ton: c.niveau === 'rouge' ? 'rouge' : c.niveau === 'orange' ? 'ambre' : 'neutre' };
    case 'voir':
      return { pastille: null, ton: 'neutre' };
  }
}

export function ongletValide(v: unknown): NomOnglet {
  return ONGLETS.find((o) => o.id === v)?.id ?? 'directeur';
}

// ---------- Appels serveur (/api/directeur, /api/agents) : un serveur absent donne un message, jamais une exception ----------

export type ReponseApi = { ok: true; data: unknown } | { ok: false; message: string };
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export async function appelerApi(chemin: '/api/directeur' | '/api/agents', corps: unknown, fetchImpl: FetchLike, delaiMs = 12000): Promise<ReponseApi> {
  const ctl = new AbortController();
  const minuterie = setTimeout(() => ctl.abort(), delaiMs);
  try {
    const r = await fetchImpl(chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps), signal: ctl.signal });
    if (!r.ok) {
      const absent = r.status === 404 || r.status === 405;
      return { ok: false, message: absent ? `Le serveur ne propose pas encore ${chemin} (code ${r.status}).` : `Le serveur a répondu par une erreur (code ${r.status}) sur ${chemin}.` };
    }
    try {
      return { ok: true, data: await r.json() };
    } catch {
      return { ok: false, message: `Réponse illisible de ${chemin} : le serveur n'a pas renvoyé du JSON.` };
    }
  } catch {
    return {
      ok: false,
      message: ctl.signal.aborted
        ? `Le serveur ne répond pas (délai de ${Math.round(delaiMs / 1000)} s dépassé sur ${chemin}).`
        : `Serveur injoignable : ${chemin} n'est pas démarré. L'écran reste utilisable sans lui.`,
    };
  } finally {
    clearTimeout(minuterie);
  }
}

// ---------- Dispositif de sécurité et propositions au PC sécurité ----------

export interface EntreeDispositif {
  id: string;
  nom: string;
  famille: string;
  role?: string;
  acteur?: string;
  delai_s: number | null;
  certitude: string;
  levier?: string;
}
/** Éléments du dispositif sur lesquels l'outil sait faire une proposition ; le chef de poste valide. */
export const PROPOSABLES: ReadonlyArray<string> = ['alarme-generale', 'lev-doute', 'sonorisation', 'guide-serre-files', 'issues-controle', 'cinema-l', 'liaison-ratp'];

export function phraseDelai(s: number | null | undefined): string {
  if (s == null) return '';
  if (s === 0) return 'effet immédiat';
  return s >= 60 ? `effet après ${Math.round(s / 60)} min` : `effet après ${s} s`;
}
