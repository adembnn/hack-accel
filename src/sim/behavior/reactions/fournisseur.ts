// Client OpenRouter minimal (API compatible OpenAI) + validation stricte de la réponse + cache disque.
// La clé OPENROUTER_API_KEY vient de l'environnement (jamais lue dans un fichier ici). Sans clé : message clair, aucun appel.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDS_REACTIONS } from './catalogue.ts';
import { CONSIGNE, messages, type Profil, type Situation } from './consigne.ts';
import { modele as chercherModele } from './modeles.ts';

export const DOSSIER_CACHE = fileURLToPath(new URL('./cache/', import.meta.url));
const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';

/** Ce que renvoie un fournisseur : le texte brut de la réponse, et le nombre de jetons si connu. */
export interface Brut {
  texte: string;
  jetons_entree?: number;
  jetons_sortie?: number;
}
/** Un fournisseur est une fonction : c'est ce que les tests remplacent par un faux (aucun réseau). */
export type Fournisseur = (modele: string, msgs: ReturnType<typeof messages>) => Promise<Brut>;

export type Statut = 'ok' | 'hors_liste' | 'json_casse' | 'erreur' | 'absent';

export interface Choix {
  action: string;
  issue: string | null;
  intensite: number;
  raison: string;
  statut: Statut;
  /** Ce que le modèle a réellement écrit comme action quand elle est hors liste (consigné). */
  action_brute?: string;
}

export function cleManquante(): boolean {
  return !process.env.OPENROUTER_API_KEY;
}

export const MESSAGE_SANS_CLE =
  "OPENROUTER_API_KEY absente de l'environnement : aucun appel n'est fait. Lancer avec la clé exportée, ou ajouter --hors-ligne pour ne lire que le cache.";

export function fournisseurOpenRouter(): Fournisseur {
  const cle = process.env.OPENROUTER_API_KEY;
  if (!cle) throw new Error(MESSAGE_SANS_CLE);
  return async (id, msgs) => {
    const corps: Record<string, unknown> = {
      model: id,
      messages: msgs,
      temperature: 0,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    };
    if (chercherModele(id)?.raisonnement) corps.reasoning = { enabled: false };
    const rep = await fetch(URL_OPENROUTER, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    });
    if (!rep.ok) throw new Error(`OpenRouter ${rep.status} pour ${id}`);
    const j = (await rep.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      texte: j.choices?.[0]?.message?.content ?? '',
      jetons_entree: j.usage?.prompt_tokens,
      jetons_sortie: j.usage?.completion_tokens,
    };
  };
}

/** Empreinte du cache : modèle, consigne, situation, profil. Change l'un des quatre, l'entrée change. */
export function empreinte(modele: string, profil: Profil, situation: Situation, consigne: string = CONSIGNE): string {
  return createHash('sha256').update(JSON.stringify([modele, consigne, situation, profil])).digest('hex').slice(0, 24);
}

const INVALIDE: Choix = { action: 'autre', issue: null, intensite: 0, raison: '', statut: 'json_casse' };

/** Validation stricte : JSON valide, action de la liste (sinon `autre`, consigné), intensité bornée à [0, 1], raison ≤ 20 mots. */
export function analyserReponse(texte: string, situation: Situation): Choix {
  // Certains modèles entourent le JSON de ```json … ``` : on prend le premier objet entre accolades.
  const debut = texte.indexOf('{');
  const fin = texte.lastIndexOf('}');
  if (debut < 0 || fin <= debut) return { ...INVALIDE };
  let o: unknown;
  try {
    o = JSON.parse(texte.slice(debut, fin + 1));
  } catch {
    return { ...INVALIDE };
  }
  if (typeof o !== 'object' || o === null || typeof (o as Record<string, unknown>).action !== 'string') return { ...INVALIDE };
  const r = o as Record<string, unknown>;
  const action = r.action as string;
  const dansListe = IDS_REACTIONS.includes(action);
  const issues = situation.issues.map((i) => i.id);
  const issue = typeof r.issue === 'string' && issues.includes(r.issue) ? r.issue : null;
  const n = typeof r.intensite === 'number' && Number.isFinite(r.intensite) ? r.intensite : 0.5;
  const mots = typeof r.raison === 'string' ? r.raison.trim().split(/\s+/).filter(Boolean) : [];
  const choix: Choix = {
    action: dansListe ? action : 'autre',
    issue,
    intensite: Math.min(1, Math.max(0, n)),
    raison: mots.slice(0, 20).join(' '),
    statut: dansListe ? 'ok' : 'hors_liste',
  };
  if (!dansListe) choix.action_brute = action;
  return choix;
}

export interface OptionsReaction {
  modele: string;
  profil: Profil;
  situation: Situation;
  /** Absent en mode hors ligne. */
  fournisseur?: Fournisseur;
  horsLigne?: boolean;
  dossierCache?: string;
}

export interface Resultat {
  choix: Choix;
  /** Vrai si la réponse venait du cache, faux si elle vient d'un appel qu'on vient de faire. */
  du_cache: boolean;
  jetons_entree?: number;
  jetons_sortie?: number;
}

interface EntreeCache extends Brut {
  modele: string;
  profil: string;
  situation: string;
  date: string;
}

function cheminCache(dossier: string, cle: string): string {
  return join(dossier, `${cle}.json`);
}

export function enCache(o: Pick<OptionsReaction, 'modele' | 'profil' | 'situation' | 'dossierCache'>): boolean {
  return existsSync(cheminCache(o.dossierCache ?? DOSSIER_CACHE, empreinte(o.modele, o.profil, o.situation)));
}

/** Une personne-modèle réagit : cache d'abord, puis appel (jamais en mode hors ligne). Les erreurs réseau ne sont pas mises en cache. */
export async function reagir(o: OptionsReaction): Promise<Resultat> {
  const dossier = o.dossierCache ?? DOSSIER_CACHE;
  const fichier = cheminCache(dossier, empreinte(o.modele, o.profil, o.situation));
  if (existsSync(fichier)) {
    const e = JSON.parse(readFileSync(fichier, 'utf8')) as EntreeCache;
    return { choix: analyserReponse(e.texte, o.situation), du_cache: true, jetons_entree: e.jetons_entree, jetons_sortie: e.jetons_sortie };
  }
  if (o.horsLigne || !o.fournisseur) return { choix: { ...INVALIDE, statut: 'absent' }, du_cache: false };
  let brut: Brut;
  try {
    brut = await o.fournisseur(o.modele, messages(o.profil, o.situation));
  } catch (e) {
    console.error(`  erreur ${o.modele} / ${o.situation.id} / ${o.profil.id} : ${(e as Error).message}`);
    return { choix: { ...INVALIDE, statut: 'erreur' }, du_cache: false };
  }
  mkdirSync(dossier, { recursive: true });
  const entree: EntreeCache = { ...brut, modele: o.modele, profil: o.profil.id, situation: o.situation.id, date: new Date().toISOString() };
  writeFileSync(fichier, JSON.stringify(entree, null, 1));
  return { choix: analyserReponse(brut.texte, o.situation), du_cache: false, jetons_entree: brut.jetons_entree, jetons_sortie: brut.jetons_sortie };
}
