// Chronologie des alertes et propositions d'intervention, porté de reports/maquettes/chatelet-3d/alertes.js
// (sans DOM, sans voix : l'affichage lit la chronologie via AfficheurChronologie).
// Seuils décidés par Adem (22 oct.) : orange 3 pers./m², rouge 4 pers./m² pour « zone bouchée » (Still, guides britanniques).
// Durée au-dessus du seuil avant d'alerter (20 s) et seuils des autres alertes : ESTIMÉS, non sourcés.
// Le chef de poste valide ou refuse : rien n'est joué sans lui (validerProposition renvoie l'intervention, ne l'applique pas).
import type { Contrainte, Position } from './types.ts';

export const SEUILS = {
  orange: 3, // pers./m²
  rouge: 4, // pers./m²
  duree_s: 20, // estimé
  cellule_m: 2, // côté de la cellule de mesure (4 m² : 12 personnes = orange, 16 = rouge)
  pas_s: 2, // secondes simulées entre deux détections
  evac_max_s: 600, // temps restant d'évacuation au-delà duquel on alerte (10 min, demande d'Adem)
  visee: 5, // personnes qui hésitent devant une porte fermée : estimé
  ferme_apres: 2, // détections consécutives sans le problème avant de clore l'alerte
} as const;

export type Gravite = 'ok' | 'orange' | 'rouge';
export type TypeEvenement = 'rouge' | 'orange' | 'info' | 'proposition' | 'decision';

/** Gravité d'une densité (pers./m²) : orange à partir de 3, rouge à partir de 4. */
export function graviteDensite(densite: number, s: { orange: number; rouge: number } = SEUILS): Gravite {
  if (densite >= s.rouge) return 'rouge';
  if (densite >= s.orange) return 'orange';
  return 'ok';
}

export interface Personne extends Position { sorti?: boolean; en_cabine?: boolean; porte_visee?: string; hesite?: boolean }
export interface ZoneMobile { id: string; code: 'D1' | 'D2'; x: number; y: number; rayon_m: number }
export interface EtatMonde {
  T: number; // secondes simulées
  personnes: readonly Personne[];
  contraintes: readonly Contrainte[];
  zones: readonly ZoneMobile[];
  sortis: number;
}

// ---------- densité ----------
export interface Cellule { niveau: number; ix: number; iy: number; n: number; densite: number }
const clef = (niveau: number, ix: number, iy: number): string => `${niveau}:${ix}:${iy}`;

/** Densité par cellule carrée de cellule_m (personnes présentes, hors sortis et hors cabines). */
export function densiteParCellule(personnes: readonly Personne[], cellule_m: number = SEUILS.cellule_m): Map<string, Cellule> {
  const m = new Map<string, Cellule>();
  const aire = cellule_m * cellule_m;
  for (const p of personnes) {
    if (p.sorti || p.en_cabine) continue;
    const ix = Math.floor(p.x / cellule_m), iy = Math.floor(p.y / cellule_m);
    const k = clef(p.niveau, ix, iy);
    const c = m.get(k) ?? { niveau: p.niveau, ix, iy, n: 0, densite: 0 };
    c.n++;
    c.densite = c.n / aire;
    m.set(k, c);
  }
  return m;
}

// ---------- chronologie ----------
export interface Proposition {
  txt: string;
  acteur: 'chef de poste' | 'la RATP';
  delai_s: number;
  /** Contraintes à passer à « ouverte » (vide pour un guidage). */
  ouvrir: string[];
  /** Id de porte où poster guide-files et annonce (vide pour une ouverture). */
  guider?: string;
}
export interface Evenement {
  id: number;
  type: TypeEvenement;
  T: number;
  txt: string;
  pos?: Position;
  alerte?: string; // clé de l'alerte parente (propositions)
  proposition?: Proposition;
  etat?: 'ouverte' | 'validee' | 'refusee' | 'caduque';
}

export class Chronologie {
  #evenements: Evenement[] = [];
  #seq = 0;
  /** Insère en gardant l'ordre (T, id) : la chronologie est toujours triée, même si les événements arrivent dans le désordre. */
  ajouter(e: Omit<Evenement, 'id'>): Evenement {
    const ev: Evenement = { ...e, id: ++this.#seq };
    let i = this.#evenements.length;
    while (i > 0 && this.#evenements[i - 1]!.T > ev.T) i--;
    this.#evenements.splice(i, 0, ev);
    return ev;
  }
  get evenements(): readonly Evenement[] { return this.#evenements; }
  trouver(id: number): Evenement | undefined { return this.#evenements.find((e) => e.id === id); }
  vider(): void { this.#evenements = []; }
}

export interface Intervention { ouvrir: string[]; guider?: string; delai_s: number; effet_a: number; txt: string; acteur: string }

/** Valide une proposition : renvoie l'intervention à appliquer à T + délai (ou null si caduque). N'applique rien. */
export function validerProposition(chrono: Chronologie, id: number, T: number): Intervention | null {
  const e = chrono.trouver(id);
  if (!e || e.type !== 'proposition' || e.etat !== 'ouverte' || !e.proposition) return null;
  e.etat = 'validee';
  const p = e.proposition;
  chrono.ajouter({ type: 'decision', T, txt: `${p.acteur === 'chef de poste' ? 'Validé' : `Demande transmise à ${p.acteur}, validée`} : ${p.txt}`, pos: e.pos });
  return { ouvrir: p.ouvrir, guider: p.guider, delai_s: p.delai_s, effet_a: T + p.delai_s, txt: p.txt, acteur: p.acteur };
}
export function refuserProposition(chrono: Chronologie, id: number): boolean {
  const e = chrono.trouver(id);
  if (!e || e.type !== 'proposition' || e.etat !== 'ouverte') return false;
  e.etat = 'refusee';
  return true;
}
/** Applique une intervention aux contraintes (pure). Le guidage est un conseil de routage, il ne change pas les contraintes. */
export function appliquerIntervention(contraintes: readonly Contrainte[], i: Intervention): Contrainte[] {
  return contraintes.map((k) => (i.ouvrir.includes(k.id) ? { ...k, etat: 'ouverte' as const } : { ...k }));
}

/** Interface d'affichage à implémenter côté UI. Aucune logique ici. */
export interface AfficheurChronologie { afficher(evenements: readonly Evenement[], actives: number): void }

// ---------- détection ----------
interface Chaude { depuis: number; dernier: number; n: number }
interface Active { cle: string; gravite: 'orange' | 'rouge'; txt: string; pos: Position; manque: number; evenement: Evenement; propositions: Evenement[] }
const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
const fr = (n: number): string => n.toFixed(1).replace('.', ',');

function propositions(pos: Position, contraintes: readonly Contrainte[]): Proposition[] {
  const out: Proposition[] = [];
  const fermees = contraintes.filter((k) => k.etat !== 'ouverte' && Math.abs(k.niveau - pos.niveau) <= 2);
  fermees.filter((k) => k.type === 'sortie' || k.type === 'porte').map((k) => ({ k, d: dist2(k, pos) })).filter((o) => o.d <= 60).sort((a, b) => a.d - b.d || a.k.id.localeCompare(b.k.id)).slice(0, 2)
    .forEach((o) => out.push({ txt: `Ouvrir ${o.k.id}, à ${Math.round(o.d)} m`, acteur: 'chef de poste', delai_s: 0, ouvrir: [o.k.id] }));
  const bouches = fermees.filter((k) => k.type === 'bouche_metro' && dist2(k, pos) <= 80);
  if (bouches.length) out.push({ txt: `Demander à la RATP de rouvrir ${bouches.length} accès fermés à moins de 80 m`, acteur: 'la RATP', delai_s: 0, ouvrir: bouches.map((b) => b.id).sort() });
  return out;
}

/** Détecteur d'alertes. L'état interne (cellules chaudes, alertes actives) est le seul état mutable ; tout le reste est pur. */
export class DetecteurAlertes {
  readonly chrono = new Chronologie();
  #chaudes = new Map<string, Chaude>();
  #actives = new Map<string, Active>();
  #derniereDetection = -Infinity;
  #pic = 0;

  get actives(): number { return this.#actives.size; }
  get pic_densite(): number { return this.#pic; }

  /** À appeler à chaque pas ; ne détecte qu'une fois tous les pas_s secondes simulées. Renvoie les événements créés. */
  pas(etat: EtatMonde): Evenement[] {
    if (etat.T - this.#derniereDetection < SEUILS.pas_s) return [];
    this.#derniereDetection = etat.T;
    const idAvant = this.chrono.evenements.reduce((m, e) => Math.max(m, e.id), 0);
    const vus = new Set<string>();
    this.#bouchons(etat, vus);
    this.#portesVisees(etat, vus);
    this.#zones(etat, vus);
    for (const a of [...this.#actives.values()]) {
      if (vus.has(a.cle)) continue;
      a.manque++;
      if (a.manque >= SEUILS.ferme_apres) this.#clore(a, etat.T);
    }
    for (const e of this.chrono.evenements) if (e.type === 'proposition' && e.etat === 'ouverte' && e.alerte && !this.#actives.has(e.alerte)) e.etat = 'caduque';
    return this.chrono.evenements.filter((e) => e.id > idAvant);
  }

  #clore(a: Active, T: number): void {
    this.#actives.delete(a.cle);
    for (const p of a.propositions) if (p.etat === 'ouverte') p.etat = 'caduque';
    this.chrono.ajouter({ type: 'info', T, txt: `Résorbé : ${a.txt.split(' : ')[0]}`, pos: a.pos });
  }

  #upsert(cle: string, gravite: 'orange' | 'rouge', txt: string, pos: Position, T: number, props: Proposition[], vus: Set<string>): void {
    vus.add(cle);
    const a = this.#actives.get(cle);
    if (!a) {
      const evenement = this.chrono.ajouter({ type: gravite, T, txt, pos, alerte: cle });
      const propositionsEv = props.map((p) => this.chrono.ajouter({ type: 'proposition', T, txt: p.txt, pos, alerte: cle, proposition: p, etat: 'ouverte' }));
      this.#actives.set(cle, { cle, gravite, txt, pos, manque: 0, evenement, propositions: propositionsEv });
      return;
    }
    a.manque = 0;
    a.pos = pos;
    if (txt !== a.txt) { a.txt = txt; a.evenement.txt = txt; }
    if (gravite === 'rouge' && a.gravite !== 'rouge') {
      a.gravite = 'rouge';
      a.evenement.type = 'rouge';
      this.chrono.ajouter({ type: 'rouge', T, txt: `Aggravation : ${txt}`, pos, alerte: cle });
    }
  }

  #bouchons(etat: EtatMonde, vus: Set<string>): void {
    const T = etat.T, S = SEUILS.cellule_m, aire = S * S;
    const D = densiteParCellule(etat.personnes, S);
    for (const c of D.values()) this.#pic = Math.max(this.#pic, c.densite);
    for (const [k, c] of D) {
      if (graviteDensite(c.densite) === 'ok') continue;
      const h = this.#chaudes.get(k);
      if (h) { h.dernier = T; h.n = c.n; } else this.#chaudes.set(k, { depuis: T, dernier: T, n: c.n });
    }
    for (const [k, h] of [...this.#chaudes]) if (h.dernier < T) this.#chaudes.delete(k); // plus au-dessus du seuil à ce pas
    const murs = [...this.#chaudes].filter(([, h]) => T - h.depuis >= SEUILS.duree_s).map(([k]) => k).sort();
    const set = new Set(murs), faits = new Set<string>();
    const decoder = (k: string): [number, number, number] => { const [l, x, y] = k.split(':').map(Number); return [l!, x!, y!]; };
    for (const k0 of murs) {
      if (faits.has(k0)) continue;
      const pile = [k0], grappe: string[] = [];
      faits.add(k0);
      while (pile.length) {
        const k = pile.pop()!;
        grappe.push(k);
        const [l, ix, iy] = decoder(k);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const k2 = clef(l, ix + dx, iy + dy);
          if (set.has(k2) && !faits.has(k2)) { faits.add(k2); pile.push(k2); }
        }
      }
      let sx = 0, sy = 0, sw = 0, pic = 0, depuis = T;
      const [niveau] = decoder(k0);
      for (const k of grappe) {
        const h = this.#chaudes.get(k)!, [, ix, iy] = decoder(k);
        sx += (ix! + 0.5) * S * h.n; sy += (iy! + 0.5) * S * h.n; sw += h.n;
        pic = Math.max(pic, h.n / aire); depuis = Math.min(depuis, h.depuis);
      }
      const pos: Position = { x: sx / sw, y: sy / sw, niveau };
      let cle: string | null = null;
      for (const a of this.#actives.values()) if (a.cle[0] === 'b' && a.pos.niveau === niveau && dist2(a.pos, pos) < 8) { cle = a.cle; break; }
      cle ??= `b${niveau}:${Math.round(pos.x)}:${Math.round(pos.y)}`;
      const grav = graviteDensite(pic) === 'rouge' ? 'rouge' : 'orange';
      this.#upsert(cle, grav, `Bouchon niveau ${niveau} : ${fr(pic)} pers./m² depuis ${Math.round(T - depuis)} s`, pos, T, propositions(pos, etat.contraintes), vus);
    }
  }

  #portesVisees(etat: EtatMonde, vus: Set<string>): void {
    const par: Record<string, number> = {};
    for (const p of etat.personnes) if (!p.sorti && p.hesite && p.porte_visee) par[p.porte_visee] = (par[p.porte_visee] ?? 0) + 1;
    for (const id of Object.keys(par).sort()) {
      const k = etat.contraintes.find((c) => c.id === id);
      if (!k || k.etat === 'ouverte' || par[id]! < SEUILS.visee) continue;
      const pos: Position = { x: k.x, y: k.y, niveau: k.niveau };
      const props: Proposition[] = [{ txt: `Rouvrir ${k.id}`, acteur: 'chef de poste', delai_s: 0, ouvrir: [k.id] }];
      this.#upsert(`p${id}`, 'orange', `${k.id} fermée mais encore visée : ${par[id]} personnes s'y présentent`, pos, etat.T, props, vus);
    }
  }

  #zones(etat: EtatMonde, vus: Set<string>): void {
    for (const z of etat.zones) for (const k of etat.contraintes) {
      if ((k.type !== 'porte' && k.type !== 'sortie') || k.niveau !== 0) continue;
      const d = dist2(z, k), pos: Position = { x: k.x, y: k.y, niveau: k.niveau };
      if (z.code === 'D2' && d < z.rayon_m + 10) this.#upsert(`z${z.id}:${k.id}`, 'rouge', `Troubles devant ${k.id} : porte bloquée de fait`, pos, etat.T, [], vus);
      else if (z.code === 'D1' && d < z.rayon_m + 25 && k.etat === 'ouverte') {
        this.#upsert(`z${z.id}:${k.id}`, 'orange', `La manifestation touche ${k.id}, encore ouverte`, pos, etat.T, [{ txt: `Poster un guide-files à ${k.id}`, acteur: 'chef de poste', delai_s: 120, ouvrir: [], guider: k.id }], vus);
      }
    }
  }
}
