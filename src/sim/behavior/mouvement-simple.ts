// Mouvement SIMPLISTE de test (pas le vrai : foule-mouvement fournira le vrai derrière l'interface `Mouvement`).
// Chaque personne marche en ligne droite vers son issue, puis fait la queue ; la file est servie au débit de l'issue.
// Densité d'une zone d'approche = personnes en file / surface. Pression de Helbing : approximation (proxy), pas mesurée.
import type { Intention, Issue, Mouvement, Personne, RetourMouvement, Scene } from './types.ts';

export const DEBIT_PAR_METRE = 1.3; // pers/s par mètre de largeur utile (SFPE, rapport criteres-jugement-crise §1)

interface Etat {
  cible: string | null;
  reste_m: number;
  en_file: boolean;
  sorti: boolean;
  parti: boolean;
  vitesse: number;
}

export function creerMouvementSimple(): Mouvement {
  let issues = new Map<string, Issue>();
  let etats: Etat[] = [];
  let files = new Map<string, number[]>(); // file d'ids, ordre d'arrivée
  let credit = new Map<string, number>(); // débit cumulé non dépensé
  let restantes = 0;

  return {
    init(s: Scene, personnes: Personne[]) {
      issues = new Map(s.issues.map((i) => [i.id, i]));
      etats = personnes.map((p) => ({ cible: null, reste_m: 0, en_file: false, sorti: false, parti: false, vitesse: p.vitesse_m_s }));
      files = new Map(s.issues.map((i) => [i.id, []]));
      credit = new Map(s.issues.map((i) => [i.id, 0]));
      restantes = personnes.length;
    },

    pas(dt, _t, intentions: Intention[], ouvertes) {
      const sorties: RetourMouvement['sorties'] = [];
      const devantFermee: number[] = [];
      const retirer = (id: number, issueId: string) => {
        const f = files.get(issueId)!;
        const k = f.indexOf(id);
        if (k >= 0) f.splice(k, 1);
      };

      // 1. appliquer les intentions
      for (const it of intentions) {
        const e = etats[it.id];
        if (e.sorti) continue;
        if (it.sortie_cible !== e.cible) {
          if (e.cible && e.en_file) retirer(it.id, e.cible);
          const nouvelle = it.sortie_cible ? issues.get(it.sortie_cible) : undefined;
          const premiere = !e.parti;
          e.cible = it.sortie_cible;
          e.en_file = false;
          // première cible : distance de l'issue ; changement de cible : détour latéral de 20 m + 30 % de la distance
          e.parti = nouvelle !== undefined;
          e.reste_m = nouvelle ? (premiere ? nouvelle.distance_m : 20 + 0.3 * nouvelle.distance_m) : 0;
        }
        e.vitesse = it.vitesse_voulue_m_s;
      }

      // 2. marche (seulement les personnes à l'état 'marche')
      for (const it of intentions) {
        const e = etats[it.id];
        if (e.sorti || !e.cible || e.en_file || it.etat !== 'marche') continue;
        e.reste_m -= e.vitesse * dt;
        if (e.reste_m <= 0) {
          e.reste_m = 0;
          if (ouvertes[e.cible] === false) {
            devantFermee.push(it.id);
            e.cible = null; // le comportement redécidera
          } else {
            e.en_file = true;
            files.get(e.cible)!.push(it.id);
          }
        }
      }

      // 3. issues fermées entre-temps : la file se disperse
      for (const [iid, f] of files) {
        if (ouvertes[iid] === false && f.length) {
          for (const id of f) {
            devantFermee.push(id);
            etats[id].en_file = false;
            etats[id].cible = null;
          }
          f.length = 0;
        }
      }

      // 4. service des files
      const densite: Record<string, number> = {};
      const pression: Record<string, number> = {};
      const filePar: Record<string, number> = {};
      for (const [iid, f] of files) {
        const is = issues.get(iid)!;
        const rho = f.length / is.surface_approche_m2;
        // effet « faster-is-slower » (hypothèse de réglage) : au-delà de 4 pers/m², le débit baisse jusqu'à -40 %
        const facteur = rho > 4 ? Math.max(0.6, 1 - 0.1 * (rho - 4)) : 1;
        let c = (credit.get(iid) ?? 0) + (ouvertes[iid] === false ? 0 : DEBIT_PAR_METRE * is.largeur_m * facteur * dt);
        while (c >= 1 && f.length) {
          const id = f.shift()!;
          etats[id].sorti = true;
          etats[id].en_file = false;
          restantes--;
          sorties.push({ id, issue_id: iid });
          c -= 1;
        }
        credit.set(iid, f.length ? c : 0);
        const rho2 = f.length / is.surface_approche_m2;
        densite[iid] = rho2;
        const sigma = 0.15 * Math.max(0, rho2 - 3); // écart-type de vitesse supposé (proxy)
        pression[iid] = rho2 * sigma * sigma;
        filePar[iid] = f.length;
      }
      return { densite_par_zone: densite, pression_par_zone: pression, file_par_issue: filePar, sorties, devant_issue_fermee: devantFermee };
    },

    restantes: () => restantes,
  };
}
