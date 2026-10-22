// Retour d'expérience (REX) : les enseignes du Forum renseignent chaque crise passée ; une cellule d'agents (rôle
// « Analyste de leçons ») en tire des leçons, relues avant chaque décision en crise. Les tables rex_crises et lecons
// seront fournies par le lot aiven : ici, une interface de stockage et une version en mémoire.
import { verifierChiffres } from './verificateur.ts';
import { LIMITES, validerRex, empreinteRex, marquerSuspect, tronquer } from './limites.ts';

export type StatutLecon = 'non_verifiee' | 'contradictoire' | 'validee_par_simulation';

export interface RexCrise {
  id: string;
  enseigne: string;
  zone: string;               // zone du Forum (ex. « niveau_-1 », « ugc »), « * » = tout le centre
  type_incident: string;      // ex. « evacuation_cinema », « porte_bloquee », « panne_escalator »
  date: string;               // ISO, texte libre accepté
  duree_min: number;          // durée de l'incident en minutes
  personnes_touchees?: number;
  description: string;
  mesures: string[];          // ce qui a été fait
  efficace?: boolean;         // l'enseigne juge-t-elle la mesure efficace
}

export interface Lecon {
  id: string;
  type_incident: string;
  zone: string;
  frequence: number;          // nombre de REX sources
  duree_moyenne_min: number;
  duree_max_min: number;
  sources: string[];          // ids des REX sources
  enonce: string;             // texte : chaque chiffre doit se retrouver dans `chiffres` ou dans les REX sources
  chiffres: Record<string, number>;
  // Une leçon n'est pas un fait : provenance obligatoire, statut explicite, aucun levier changé tant qu'elle n'est pas validée par simulation.
  statut: StatutLecon;
  provenance: { auteur: string; date: string; run_id?: string; validation?: { run_id: string; meilleure: boolean } };
}

export interface AnalysteLecons { analyser(rex: RexCrise[]): Promise<Lecon[]> }

export interface StockageRex {
  ajouterRex(r: RexCrise): Promise<void>;
  listerRex(): Promise<RexCrise[]>;
  remplacerLecons(l: Lecon[]): Promise<void>;
  listerLecons(): Promise<Lecon[]>;
}

export class StockageRexMemoire implements StockageRex {
  #rex: RexCrise[] = [];
  #lecons: Lecon[] = [];
  async ajouterRex(r: RexCrise): Promise<void> {
    const v = validerRex(r);
    if (!v.ok) throw new Error(`REX rejeté : ${v.erreurs.join(' ; ')}`);
    if (this.#rex.filter((x) => x.enseigne === r.enseigne).length >= LIMITES.rex_par_enseigne) throw new Error(`plus de ${LIMITES.rex_par_enseigne} REX pour l'enseigne ${r.enseigne}`);
    if (this.#rex.some((x) => empreinteRex(x) === empreinteRex(r))) throw new Error('REX en double (même empreinte)');
    this.#rex.push(structuredClone(r));
  }
  async listerRex(): Promise<RexCrise[]> { return structuredClone(this.#rex); }
  async remplacerLecons(l: Lecon[]): Promise<void> { this.#lecons = structuredClone(l); }
  async listerLecons(): Promise<Lecon[]> { return structuredClone(this.#lecons); }
}

const arrondi1 = (n: number): number => Math.round(n * 10) / 10;

// Version déterministe (tests, repli) : regroupe par type d'incident et zone, calcule fréquences et durées.
export class AnalysteDeterministe implements AnalysteLecons {
  async analyser(rex: RexCrise[]): Promise<Lecon[]> {
    const groupes = new Map<string, RexCrise[]>();
    for (const r of rex) {
      const k = `${r.type_incident}|${r.zone}`;
      groupes.set(k, [...(groupes.get(k) ?? []), r]);
    }
    const lecons: Lecon[] = [];
    for (const [k, rs] of [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const [type_incident, zone] = k.split('|');
      const durees = rs.map((r) => r.duree_min);
      const moyenne = arrondi1(durees.reduce((s, d) => s + d, 0) / durees.length);
      const max = Math.max(...durees);
      const jugees = rs.filter((r) => r.efficace !== undefined);
      const efficaces = jugees.filter((r) => r.efficace).length;
      const chiffres: Record<string, number> = { frequence: rs.length, duree_moyenne_min: moyenne, duree_max_min: max };
      let enonce = `${type_incident} en ${zone} : ${rs.length} cas, durée moyenne ${moyenne} min, au plus ${max} min.`;
      if (jugees.length) {
        chiffres.mesures_efficaces = efficaces;
        chiffres.mesures_jugees = jugees.length;
        enonce += ` Mesures jugées efficaces : ${efficaces} sur ${jugees.length}.`;
      }
      // Deux enseignes se contredisent sur une même mesure (efficace / inefficace) : conflit visible, jamais arbitré.
      const verdicts = new Map<string, Set<boolean>>();
      for (const r of jugees) for (const m of r.mesures) verdicts.set(m, (verdicts.get(m) ?? new Set()).add(r.efficace as boolean));
      const contradictoire = [...verdicts.values()].some((v) => v.size > 1);
      lecons.push({ id: `lecon:${type_incident}:${zone}`, type_incident, zone, frequence: rs.length, duree_moyenne_min: moyenne, duree_max_min: max, sources: rs.map((r) => r.id), enonce, chiffres, statut: contradictoire ? 'contradictoire' : 'non_verifiee', provenance: { auteur: 'analyste_deterministe', date: rs.map((r) => r.date).sort().at(-1) ?? '' } });
    }
    return lecons;
  }
}

// Une leçon est valable si ses sources existent et si tous ses chiffres se retrouvent dans ses données.
export function verifierLecon(l: Lecon, rex: RexCrise[]): { ok: boolean; problemes: string[] } {
  const problemes: string[] = [];
  const parId = new Map(rex.map((r) => [r.id, r]));
  const sources = l.sources.map((id) => parId.get(id));
  if (sources.some((s) => !s)) problemes.push('source REX introuvable');
  if (l.sources.length !== l.frequence) problemes.push('fréquence différente du nombre de sources');
  const rapport = verifierChiffres(l.enonce, { chiffres: l.chiffres, rex: sources.filter(Boolean) });
  if (!rapport.ok) problemes.push(`chiffres non retrouvés : ${rapport.non_retrouves.map((n) => n.texte).join(', ')}`);
  return { ok: problemes.length === 0, problemes };
}

// Leçons pertinentes pour une décision : celles des zones occupées (ou « * »), les plus fréquentes d'abord, au plus `max`.
export function leconsPertinentes(lecons: Lecon[], zones: string[], max = 3): Lecon[] {
  return lecons
    .filter((l) => l.zone === '*' || zones.includes(l.zone))
    .sort((a, b) => b.frequence - a.frequence || a.id.localeCompare(b.id))
    .slice(0, max);
}

// Enregistrement d'une leçon : provenance (auteur + sources) obligatoire, statut initial toujours non vérifié.
export function enregistrerLecon(l: Partial<Lecon>): Lecon {
  if (!l.sources?.length || !l.provenance?.auteur) throw new Error('leçon refusée : provenance (sources + auteur) obligatoire');
  if (!l.id || !l.enonce) throw new Error('leçon refusée : id et énoncé obligatoires');
  return { ...(l as Lecon), statut: 'non_verifiee' };
}

// Promotion : seulement si la leçon a été rejouée en simulation ET le plan avec la leçon est meilleur.
export function promouvoir(l: Lecon, o: { simulation: { run_id: string; meilleure: boolean } | null }): Lecon {
  if (l.statut === 'contradictoire') throw new Error('leçon contradictoire : arbitrage humain requis');
  if (!o.simulation) throw new Error('rejeu en simulation requis avant promotion');
  if (!o.simulation.meilleure) throw new Error('la simulation ne montre pas de gain : leçon non promue');
  return { ...l, statut: 'validee_par_simulation', provenance: { ...l.provenance, validation: o.simulation } };
}

// Seules les leçons validées par simulation peuvent influencer les leviers (règle des décideurs) ; les autres restent des indices.
export const peutChangerUnLevier = (l: Lecon): boolean => l.statut === 'validee_par_simulation';

// Assainissement avant tout passage aux décideurs : les champs issus des REX (texte de tiers) sont tronqués, les leçons
// qui ressemblent à une consigne sont écartées (jamais corrigées) et les contradictoires ne sont pas proposées (audit A2/A16).
export function assainirLecons(lecons: Lecon[]): { gardees: Lecon[]; ecartees: { id: string; raisons: string[] }[] } {
  const gardees: Lecon[] = [];
  const ecartees: { id: string; raisons: string[] }[] = [];
  for (const l of lecons) {
    const suspects = marquerSuspect([l.id, l.type_incident, l.zone, l.enonce].join(' '));
    if (suspects.length) { ecartees.push({ id: l.id.slice(0, 60), raisons: suspects }); continue; }
    if (l.statut === 'contradictoire') { ecartees.push({ id: l.id.slice(0, 60), raisons: ['contradictoire'] }); continue; }
    gardees.push({ ...l, id: tronquer(l.id, 120), type_incident: tronquer(l.type_incident, 60), zone: tronquer(l.zone, 60), enonce: tronquer(l.enonce) });
  }
  return { gardees, ecartees };
}
