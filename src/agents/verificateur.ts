// Vérificateur de chiffres : tout nombre d'une explication ou d'un ordre de service doit se retrouver dans le journal de la boucle.
// Retourne les chiffres non retrouvés. Limite connue (reports/instantane-3 §7) : un nombre écrit en lettres n'est pas détecté.
import type { Journal } from './types.ts';
import { extraireTousNombres, type NombreTrouve } from './nombres.ts';

export interface ChiffreNonRetrouve { texte: string; valeur: number; position: number }
export interface RapportVerification {
  total: number;
  retrouves: number;
  taux: number; // 1 = 100 %
  non_retrouves: ChiffreNonRetrouve[];
  ok: boolean;
}

export interface ValeursJournal { nombres: Set<number>; heures: Set<string> }

// Parcourt le journal (nombres, mais aussi nombres dans les chaînes : « niveau_-2 », « porte 3 »).
// Textes libres de tiers : leurs nombres ne sont JAMAIS des faits (audit F1/A9).
const CLES_TEXTE_LIBRE = new Set(['messages_par_zone', 'texte', 'justification', 'description', 'lecons_enseigne']);

export function valeursDuJournal(journal: unknown): ValeursJournal {
  const nombres = new Set<number>();
  const heures = new Set<string>();
  const ajouter = (n: number) => {
    if (!Number.isFinite(n)) return;
    nombres.add(n);
    nombres.add(Math.abs(n));
    // Les minutes du jour s'écrivent aussi en heures : 1160 → « 19h20 » (le texte dit « 19 h 20 »).
    if (Number.isInteger(n) && n >= 0 && n < 1440) heures.add(`${Math.floor(n / 60)}h${String(n % 60).padStart(2, '0')}`);
  };
  const aller = (v: unknown): void => {
    if (typeof v === 'number') ajouter(v);
    else if (typeof v === 'string') for (const m of v.matchAll(/-?\d+(?:[.,]\d+)?/g)) ajouter(Number(m[0].replace(',', '.')));
    else if (Array.isArray(v)) v.forEach(aller);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (CLES_TEXTE_LIBRE.has(k)) continue; aller(k); aller(x); }
  };
  aller(journal);
  return { nombres, heures };
}

// Extrait les nombres d'un texte français sous toutes leurs écritures (voir nombres.ts).
export function extraireNombres(texte: string): NombreTrouve[] {
  return extraireTousNombres(texte);
}

export function verifierChiffres(texte: string, journal: Journal | unknown): RapportVerification {
  const { nombres, heures } = valeursDuJournal(journal);
  const non_retrouves: ChiffreNonRetrouve[] = [];
  const trouves = extraireNombres(texte);
  let retrouves = 0;
  for (const t of trouves) {
    let ok = false;
    if (t.interdit) {
      non_retrouves.push({ texte: t.texte, valeur: Number.NaN, position: t.position });
      continue;
    }
    if (t.heure !== undefined) {
      // « 22 h » : accepté si 22h00 est dans le journal (1320), ou si le nombre d'heures seul y figure.
      ok = heures.has(t.heure) || (t.heure.endsWith('h00') && nombres.has(Number(t.heure.split('h')[0])));
    } else if (t.valeur !== null) {
      ok = nombres.has(t.valeur);
      // Arrondi déclaré seulement : « 6,5 » accepte 6,48 ; « 12,4 k » accepte 12 400 à 50 près ; jamais l'inverse.
      if (!ok && t.pas) for (const n of nombres) if (Math.abs(n - t.valeur) < t.pas / 2) { ok = true; break; }
      if (!ok && t.decimales > 0) {
        const p = 10 ** t.decimales;
        for (const n of nombres) if (Math.round(n * p) / p === t.valeur) { ok = true; break; }
      }
    }
    if (ok) retrouves++;
    else non_retrouves.push({ texte: t.texte, valeur: t.valeur ?? Number(t.heure!.replace('h', '.')), position: t.position });
  }
  const total = trouves.length;
  return { total, retrouves, taux: total === 0 ? 1 : retrouves / total, non_retrouves, ok: non_retrouves.length === 0 };
}

// Vue du journal restreinte à UNE zone : les nombres propres aux autres zones n'y sont plus (attaque A9 : bon chiffre, mauvaise zone).
export function vueDeZone(journal: Journal, zone: string): Journal {
  const v = structuredClone(journal);
  v.scenario.population = Object.fromEntries(Object.entries(v.scenario.population).filter(([z]) => z === zone));
  v.entrees = v.entrees.map((e) => {
    e.etat.par_zone = Object.fromEntries(Object.entries(e.etat.par_zone).filter(([z]) => z === zone));
    e.synthese.agents_par_zone = Object.fromEntries(Object.entries(e.synthese.agents_par_zone).filter(([z]) => z === zone));
    e.plan.guidage = e.plan.guidage.filter((g) => g.point.includes(zone));
    e.plan.phasage_salles = e.plan.phasage_salles.filter((p) => p.salle === zone);
    e.plan.messages_par_zone = Object.fromEntries(Object.entries(e.plan.messages_par_zone).filter(([z]) => z === zone));
    if (e.plan.consignes_par_zone) e.plan.consignes_par_zone = Object.fromEntries(Object.entries(e.plan.consignes_par_zone).filter(([z]) => z === zone));
    e.plan.confinement.zones = e.plan.confinement.zones.filter((z) => z === zone);
    e.decisions = []; // les décisions mentionnent d'autres zones ; les faits utiles sont dans le plan et la synthèse
    return e;
  });
  return v;
}

export function verifierChiffresZone(texte: string, journal: Journal, zone: string): RapportVerification {
  return verifierChiffres(texte, vueDeZone(journal, zone));
}

// Remplit les champs {{cle}} d'un gabarit à partir de faits ; un champ inconnu est une erreur (jamais de nombre libre).
export function remplirChamps(gabarit: string, faits: Record<string, string | number>): string {
  return gabarit.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, cle: string) => {
    if (!(cle in faits)) throw new Error(`champ inconnu dans le gabarit : {{${cle}}}`);
    return String(faits[cle]);
  });
}
