// Expérience reproductible : mêmes consigne et situation pour des personnes simulées par des modèles de langage
// différents ; on compare leurs choix de réaction. Hors démo en direct : tout passe par le cache disque.
//
//   node src/sim/behavior/reactions/experience.ts                  (appelle OpenRouter pour ce qui n'est pas en cache)
//   node src/sim/behavior/reactions/experience.ts --hors-ligne     (ne lit que le cache, aucune clé nécessaire)
//   options : --appels-max=N (par modèle)  --profils=N (défaut 2)  --modeles=id1,id2  --estimation (coût seul)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { IDS_REACTIONS } from './catalogue.ts';
import { CONSIGNE, messages, PROFILS, SITUATIONS, type Profil, type Situation } from './consigne.ts';
import {
  cleManquante,
  DOSSIER_CACHE,
  enCache,
  fournisseurOpenRouter,
  MESSAGE_SANS_CLE,
  reagir,
  type Choix,
  type Fournisseur,
} from './fournisseur.ts';
import { DATE_VERIFICATION, MODELES, modele as chercherModele, type Modele } from './modeles.ts';

export interface Cas {
  modele: string;
  situation: string;
  profil: string;
  choix: Choix;
}

export interface OptionsExperience {
  modeles?: readonly Modele[];
  /** Nombre maximal d'appels (cas) par modèle. */
  appelsMax?: number;
  nbProfils?: number;
  horsLigne?: boolean;
  estimationSeule?: boolean;
  fournisseur?: Fournisseur;
  dossierCache?: string;
  ecrire?: (ligne: string) => void;
}

const SORTIES_ATTENDUES_TOKENS = 80;

function cases(o: OptionsExperience): { modele: Modele; profil: Profil; situation: Situation }[] {
  const profils = PROFILS.slice(0, o.nbProfils ?? 2);
  const liste: { modele: Modele; profil: Profil; situation: Situation }[] = [];
  for (const modele of o.modeles ?? MODELES) {
    const duModele = SITUATIONS.flatMap((situation) => profils.map((profil) => ({ modele, profil, situation })));
    liste.push(...duModele.slice(0, o.appelsMax ?? duModele.length));
  }
  return liste;
}

/** Coût estimé en dollars des appels qui ne sont pas déjà en cache (≈ 3,5 caractères par jeton, 80 jetons de réponse). */
export function estimerCout(o: OptionsExperience): { appels: number; dollars: number } {
  let appels = 0;
  let dollars = 0;
  for (const c of cases(o)) {
    if (enCache({ modele: c.modele.id, profil: c.profil, situation: c.situation, dossierCache: o.dossierCache })) continue;
    const entree = messages(c.profil, c.situation).reduce((s, m) => s + m.content.length, 0) / 3.5;
    appels++;
    dollars += (entree * c.modele.prix_entree + SORTIES_ATTENDUES_TOKENS * c.modele.prix_sortie) / 1e6;
  }
  return { appels, dollars };
}

type Frequences = Record<string, number>;

/** Fréquence (en %) de chaque réaction parmi les réponses lisibles, et taux de réponses invalides, pour un groupe de cas. */
export function frequences(groupe: readonly Cas[]): { n: number; invalides: number; parReaction: Frequences } {
  const lues = groupe.filter((c) => c.choix.statut !== 'absent');
  const lisibles = lues.filter((c) => c.choix.statut === 'ok' || c.choix.statut === 'hors_liste');
  const parReaction: Frequences = Object.fromEntries(IDS_REACTIONS.map((id) => [id, 0]));
  for (const c of lisibles) parReaction[c.choix.action]++;
  for (const id of IDS_REACTIONS) parReaction[id] = lisibles.length ? (100 * parReaction[id]) / lisibles.length : 0;
  const invalides = lues.length ? (100 * lues.filter((c) => c.choix.statut !== 'ok').length) / lues.length : 0;
  return { n: lues.length, invalides, parReaction };
}

const pct = (v: number): string => (v === 0 ? '.' : v.toFixed(0));
const cellule = (s: string, w: number): string => s.padStart(w);

function tableau(colonnes: { titre: string; cas: readonly Cas[] }[], ecrire: (l: string) => void): void {
  const largeur = 8;
  const freq = colonnes.map((c) => frequences(c.cas));
  ecrire('reaction (% des réponses lisibles)'.padEnd(36) + colonnes.map((c) => cellule(c.titre.slice(0, largeur - 1), largeur)).join(''));
  for (const id of IDS_REACTIONS) ecrire(id.padEnd(36) + freq.map((f) => cellule(pct(f.parReaction[id]), largeur)).join(''));
  ecrire('réponses lues'.padEnd(36) + freq.map((f) => cellule(String(f.n), largeur)).join(''));
  ecrire('invalides (% : hors liste, JSON cassé, erreur)'.padEnd(36).slice(0, 36) + freq.map((f) => cellule(pct(f.invalides), largeur)).join(''));
}

function somme(f: Frequences, ids: readonly string[]): number {
  return ids.reduce((s, id) => s + (f[id] ?? 0), 0);
}

export function imprimerTableaux(tous: readonly Cas[], ecrire: (l: string) => void): void {
  const modelesVus = [...new Set(tous.map((c) => c.modele))];
  const nom = (id: string): string => id.split('/')[1].replace(/-instruct|-\d{4}$|-2507|-2512/g, '');
  ecrire('\n== 1. Par modèle ==');
  tableau(modelesVus.map((id) => ({ titre: nom(id), cas: tous.filter((c) => c.modele === id) })), ecrire);
  const sous = (f: (m: Modele) => boolean): Cas[] => tous.filter((c) => { const m = chercherModele(c.modele); return !!m && f(m); });
  ecrire('\n== 2. Par famille (origine du modèle) et par taille ==');
  tableau(
    [
      { titre: 'chinois', cas: sous((m) => m.origine === 'chinois') },
      { titre: 'américain', cas: sous((m) => m.origine === 'americain') },
      { titre: 'européen', cas: sous((m) => m.origine === 'europeen') },
      { titre: 'grand', cas: sous((m) => m.taille === 'grand') },
      { titre: 'petit', cas: sous((m) => m.taille === 'petit') },
      { titre: 'tous', cas: tous },
    ],
    ecrire,
  );

  const f = frequences(tous).parReaction;
  const fCons = frequences(tous.filter((c) => ['agent_qui_guide', 'message_clair'].includes(c.situation))).parReaction;
  const v = (x: number): string => `${x.toFixed(0)} %`;
  ecrire('\n== 3. Ce que disent les modèles, comparé à la littérature ==');
  ecrire(`Fuite et bousculade (fuite_precipitee, bousculer) : ${v(somme(f, ['fuite_precipitee', 'bousculer']))} observé.`);
  ecrire('  Littérature : la panique de masse est rare, ne pas coder de panique aveugle (reports/instantane-4-decision-humaine.md §5) ; taux publié [?].');
  ecrire(`Entraide (aider, revenir_chercher_quelqu_un, donner_un_ordre) : ${v(somme(f, ['aider', 'revenir_chercher_quelqu_un', 'donner_un_ordre']))} observé.`);
  ecrire('  Littérature : 65 % cherchent d\'autres personnes pour évacuer ensemble, 28,2 % cherchent un membre perdu (reports/maths-3-groupes-avis-consignes.md §1.5) ; l\'entraide est fréquente.');
  ecrire(`Recherche d'information (s_informer, propager_une_info) : ${v(somme(f, ['s_informer', 'propager_une_info']))} observé.`);
  ecrire('  Littérature : elle retarde le départ, délai x 1,5 sans menace visible (hypothèse de depart.ts) ; retard 41,9 % sans guidage contre 20,0 % avec (reports/maths-3 §4.1) ; taux de recherche [?].');
  ecrire(`Attente (se_figer, rester_a_l_abri, finir_son_activite) : ${v(somme(f, ['se_figer', 'rester_a_l_abri', 'finir_son_activite']))} observé.`);
  ecrire('  Littérature : la plupart finissent leur activité avant de partir sans menace visible (délai médian 40,5 s en plancher, depart.ts) ; part exacte [?].');
  ecrire(`Suivre la consigne quand un agent guide ou qu'un message est clair : ${v(fCons.suivre_consigne)} observé.`);
  ecrire('  Littérature : environ 90 % choisissent la sortie indiquée par un agent (Fire Technology 2025, reports/maths-3 §4.4).');
  ecrire('\nLimite : aucun modèle de langage n\'a été comparé à des choix humains réels (instantané 4 §6) ; ceci mesure des différences entre modèles, pas une vérité.');
}

export async function lancerExperience(opts: OptionsExperience = {}): Promise<Cas[]> {
  const o: OptionsExperience = { ...opts };
  const ecrire = o.ecrire ?? ((l: string) => console.log(l));
  const dossier = o.dossierCache ?? DOSSIER_CACHE;
  let fournisseur = o.fournisseur;
  const plan = cases(o);
  const est = estimerCout(o);
  ecrire(`Expérience : ${o.modeles?.length ?? MODELES.length} modèles, ${plan.length} cas (${SITUATIONS.length} situations x ${o.nbProfils ?? 2} profils par modèle), cache ${dossier}`);
  ecrire(`Estimation avant appels : ${est.appels} appels hors cache, environ ${est.dollars.toFixed(4)} $ (prix OpenRouter du ${DATE_VERIFICATION}, ${CONSIGNE.length} caractères de consigne).`);
  if (o.estimationSeule) return [];
  let horsLigne = o.horsLigne ?? false;
  if (!horsLigne && !fournisseur) {
    if (est.appels > 0 && cleManquante()) {
      ecrire(MESSAGE_SANS_CLE);
      horsLigne = true;
    } else if (est.appels > 0) {
      fournisseur = fournisseurOpenRouter();
    }
  }
  const tous: Cas[] = [];
  const parModele = new Map<string, typeof plan>();
  for (const c of plan) parModele.set(c.modele.id, [...(parModele.get(c.modele.id) ?? []), c]);
  // Les modèles sont interrogés en parallèle, les cas d'un même modèle l'un après l'autre.
  const resultats = await Promise.all(
    [...parModele.values()].map(async (liste) => {
      const sortie: Cas[] = [];
      for (const c of liste) {
        const r = await reagir({ modele: c.modele.id, profil: c.profil, situation: c.situation, fournisseur, horsLigne, dossierCache: dossier });
        sortie.push({ modele: c.modele.id, situation: c.situation.id, profil: c.profil.id, choix: r.choix });
      }
      return sortie;
    }),
  );
  for (const r of resultats) tous.push(...r);

  const lus = tous.filter((c) => c.choix.statut !== 'absent');
  if (lus.length === 0) {
    ecrire('\nAucune réponse en cache : rien à comparer. Lancer sans --hors-ligne avec OPENROUTER_API_KEY pour remplir le cache.');
  } else {
    imprimerTableaux(lus, ecrire);
    mkdirSync(dossier, { recursive: true });
    const fichier = join(dossier, 'resultats.json');
    writeFileSync(
      fichier,
      JSON.stringify({ date: new Date().toISOString(), verification_prix: DATE_VERIFICATION, nb_cas: lus.length, frequences: frequences(lus), cas: tous }, null, 1),
    );
    ecrire(`\nRésultats écrits dans ${fichier}`);
  }
  return tous;
}

function lireOption(args: string[], nom: string): string | undefined {
  const i = args.findIndex((a) => a === nom || a.startsWith(`${nom}=`));
  if (i < 0) return undefined;
  return args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const ids = lireOption(args, '--modeles')?.split(',');
  const modeles = ids ? ids.map((id) => chercherModele(id)).filter((m): m is Modele => !!m) : undefined;
  const appelsMax = lireOption(args, '--appels-max');
  const profils = lireOption(args, '--profils');
  await lancerExperience({
    horsLigne: args.includes('--hors-ligne'),
    estimationSeule: args.includes('--estimation'),
    modeles,
    appelsMax: appelsMax ? Number(appelsMax) : undefined,
    nbProfils: profils ? Number(profils) : undefined,
  });
}
