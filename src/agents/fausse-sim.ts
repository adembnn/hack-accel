// Faux simulateur déterministe pour tester la boucle sans le vrai simulateur (lots #8 / #9).
// Ce n'est PAS un modèle de foule : il écoule des personnes par porte à débit fixe (H) pour que les tests aient des
// effets mesurables (porte fermée = file plus longue, porte vers le périmètre = sortis en danger).
import type { EtatResume, Grille, Plan, Scenario, Simulateur } from './types.ts';
import { NIVEAUX, PORTES, PORTES_VERS_PERIMETRE } from './types.ts';

function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEBIT_PAR_PORTE = 60;   // personnes/minute/porte (H, valeur inventée)
const SURFACE_ZONE = 400;     // m² par zone (H)

export class FauxSimulateur implements Simulateur {
  #scenario: Scenario | null = null;
  #zones: Record<string, number> = {};
  #minute = 0;
  #sortis = 0;
  #danger = 0;
  #debit: Record<string, number> = {};
  #alea: () => number = () => 0;
  appels = 0; // pour vérifier que la boucle appelle bien une fois par minute

  grille(): Grille {
    return { niveaux: [...NIVEAUX], portes: [...PORTES], zones: Object.keys(this.#zones), seuil_densite: 5 };
  }

  initialiser(scenario: Scenario): void {
    this.#scenario = scenario;
    this.#zones = { ...scenario.population };
    this.#minute = scenario.minute_annonce;
    this.#sortis = 0;
    this.#danger = 0;
    this.#debit = {};
    this.#alea = mulberry32(scenario.graine);
    this.appels = 0;
  }

  avancer(plan: Plan, minutes: number): EtatResume {
    if (!this.#scenario) throw new Error('initialiser() d\'abord');
    for (let m = 0; m < minutes; m++) {
      this.appels++;
      this.#minute++;
      const ouvertes = PORTES.filter((p) => plan.portes[p] !== 'fermee');
      const confinees = new Set(plan.confinement.actif ? plan.confinement.zones : []);
      const agents = plan.guidage.reduce((s, g) => s + g.agents, 0);
      const bonus = 1 + Math.min(agents, 40) * 0.01;
      const debits: Record<string, number> = {};
      let capacite = 0;
      for (const p of ouvertes) { debits[p] = Math.round(DEBIT_PAR_PORTE * bonus * (0.95 + 0.1 * this.#alea())); capacite += debits[p]; }
      const parZone = Object.entries(this.#zones).filter(([z, n]) => n > 0 && !confinees.has(z));
      // Salles phasées : elles ne sortent pas avant leur minute de départ.
      const libres = parZone.filter(([z]) => { const ph = plan.phasage_salles.find((s) => s.salle === z); return !ph || this.#minute >= ph.minute_depart; });
      const total = libres.reduce((s, [, n]) => s + n, 0);
      const sortants = Math.min(total, capacite);
      for (const [z, n] of libres) {
        const part = total === 0 ? 0 : Math.round((n / total) * sortants);
        const retire = Math.min(n, part);
        this.#zones[z] = n - retire;
        this.#sortis += retire;
      }
      const partDanger = ouvertes.length ? ouvertes.filter((p) => PORTES_VERS_PERIMETRE.includes(p)).reduce((s, p) => s + debits[p], 0) / capacite : 0;
      this.#danger += Math.round(sortants * (Number.isFinite(partDanger) ? partDanger : 0));
      this.#debit = debits;
    }
    return this.etat();
  }

  etat(): EtatResume {
    const par_zone: EtatResume['par_zone'] = {};
    let dans = 0, dmax = 0;
    for (const [z, n] of Object.entries(this.#zones)) {
      const densite = Math.round((n / SURFACE_ZONE) * 100) / 100;
      par_zone[z] = { personnes: n, densite };
      dans += n; dmax = Math.max(dmax, densite);
    }
    return { minute: this.#minute, dans_le_centre: dans, sortis: this.#sortis, sortis_vers_zone_danger: this.#danger, densite_max: dmax, par_zone, debit_portes: { ...this.#debit } };
  }
}

export function scenarioDeTest(graine = 7): Scenario {
  return {
    graine,
    minute_annonce: 1160,
    stations_fermees_minute: 1320,
    couvre_feu_debut_minute: 1380,
    effectif_securite: 20,
    population: { ugc: 3000, niveau_0: 900, 'niveau_-1': 1200, 'niveau_-2': 800 },
  };
}
