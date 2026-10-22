// Événement `contrainte` : ce que le juré (ou un agent) pose sur le lieu — une porte fermée, une bouche de métro
// bloquée, un escalator arrêté. Format proposé par Titouan sur le ticket #7 :
//   { id, type, niveau, x, y, largeur_m, etat: 'ouverte' | 'fermee' | 'bloquee' }
// Repère : mètres, origine au centre du Forum (48,8620 N ; 2,3470 E), x vers l'est, y vers le sud (= axe z de la scène 3D).
// Niveau : entier, 0 = rue / rez-de-chaussée, -1 à -5 = niveaux souterrains du Forum.

export type TypeContrainte =
  | 'porte' // porte intérieure ou entrée de bâtiment
  | 'sortie' // sortie de secours / sortie du Forum vers la rue
  | 'bouche_metro' // bouche de métro ou entrée RER (la station elle-même n'est pas modélisée)
  | 'escalier'
  | 'escalator'
  | 'ascenseur'
  | 'barrage'; // obstacle libre posé par le juré (cordon, camion, foule dense), sans élément d'origine

export type EtatContrainte = 'ouverte' | 'fermee' | 'bloquee';

export interface Contrainte {
  id: string;
  type: TypeContrainte;
  niveau: number;
  x: number;
  y: number;
  largeur_m: number;
  etat: EtatContrainte;
}

export const TYPES_CONTRAINTE: readonly TypeContrainte[] = [
  'porte', 'sortie', 'bouche_metro', 'escalier', 'escalator', 'ascenseur', 'barrage',
];
export const ETATS_CONTRAINTE: readonly EtatContrainte[] = ['ouverte', 'fermee', 'bloquee'];

/** Renvoie la liste des problèmes (vide = événement valide). */
export function validerContrainte(c: unknown): string[] {
  const p: string[] = [];
  if (typeof c !== 'object' || c === null) return ['la contrainte doit être un objet'];
  const o = c as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id === '') p.push('id manquant');
  if (!TYPES_CONTRAINTE.includes(o.type as TypeContrainte)) p.push(`type inconnu : ${String(o.type)}`);
  if (!Number.isInteger(o.niveau)) p.push('niveau doit être un entier');
  if (typeof o.x !== 'number' || !Number.isFinite(o.x)) p.push('x invalide');
  if (typeof o.y !== 'number' || !Number.isFinite(o.y)) p.push('y invalide');
  if (typeof o.largeur_m !== 'number' || !(o.largeur_m > 0)) p.push('largeur_m doit être > 0');
  if (!ETATS_CONTRAINTE.includes(o.etat as EtatContrainte)) p.push(`etat inconnu : ${String(o.etat)}`);
  return p;
}

export type EcouteurContrainte = (c: Contrainte) => void;

/** Petit bus d'événements sans dépendance (marche dans Node et dans le navigateur). Nom d'événement : `contrainte`. */
export class BusContraintes {
  #ecouteurs: EcouteurContrainte[] = [];
  journal: Contrainte[] = [];

  /** S'abonne ; renvoie la fonction de désabonnement. */
  sur(nom: 'contrainte', f: EcouteurContrainte): () => void {
    if (nom !== 'contrainte') throw new Error(`événement inconnu : ${nom}`);
    this.#ecouteurs.push(f);
    return () => {
      this.#ecouteurs = this.#ecouteurs.filter((e) => e !== f);
    };
  }

  /** Publie une contrainte (validée) à tous les abonnés et la garde dans le journal. */
  emettre(c: Contrainte): void {
    const pb = validerContrainte(c);
    if (pb.length) throw new Error(`contrainte invalide : ${pb.join(', ')}`);
    this.journal.push({ ...c });
    for (const f of this.#ecouteurs) f({ ...c });
  }
}
