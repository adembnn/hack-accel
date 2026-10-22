// Intégrité des caches de rejeu (audit F9, attaque A14) : chaque entrée stocke le sha256 de son contenu,
// recalculé à chaque lecture. Une réponse éditée à la main est détectée et refusée (aucun repli silencieux).
import { createHash } from 'node:crypto';

export function canonique(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonique).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).filter((k) => (v as Record<string, unknown>)[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonique((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

export const empreinteContenu = (v: unknown): string => createHash('sha256').update(canonique(v)).digest('hex');

export interface EntreeScellee<T> { valeur: T; sha256: string }

export const sceller = <T>(valeur: T): EntreeScellee<T> => ({ valeur, sha256: empreinteContenu(valeur) });

export class ErreurCacheCorrompu extends Error {
  cle: string;
  constructor(cle: string, detail: string) { super(`cache de rejeu corrompu (clé ${cle}) : ${detail} ; hash du contenu invalide`); this.cle = cle; }
}

export function ouvrirScelle<T>(entree: unknown, cle: string): T {
  const e = entree as Partial<EntreeScellee<T>> | undefined;
  if (!e || typeof e !== 'object' || typeof e.sha256 !== 'string' || !('valeur' in e)) throw new ErreurCacheCorrompu(cle, 'entrée sans empreinte');
  if (empreinteContenu(e.valeur) !== e.sha256) throw new ErreurCacheCorrompu(cle, 'contenu modifié');
  return e.valeur as T;
}
