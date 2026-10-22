// Préparation des notifications : à partir de la décision du directeur (plan des décideurs), de la population et de
// l'affectation salle/zone → porte, produit pour CHAQUE personne un message court qui correspond à SA place.
// Règles de rédaction : impératif, phrases courtes, aucun chiffre qui ne vienne des données (porte, salle, rang, place),
// libellé « Message du lieu », jamais « alerte officielle » (ce n'est pas une alerte d'État), pas de majuscules criardes.
// Fonction pure et rapide : aucune entrée-sortie, aucun réseau (3 000 destinataires en quelques millisecondes).
import type {
  Consigne,
  Decision,
  Destinataire,
  IssueSalle,
  Langue,
  NiveauUrgence,
  Notification,
  OptionsPreparation,
  Sorties,
  ZoneSortie,
} from './types.ts';
import {
  CORPS_MAX,
  ErreurDecision,
  TITRE_EN,
  TITRE_FR,
  chiffresInventes,
  contientInterdit,
  estSur,
  nettoyerTexte,
  porteOuverte,
  tronquer,
  validerDecision,
} from './validation.ts';

export const EXPIRE_S_DEFAUT = 900;

type Chemin = { porte: string; chemin: string[] };

function joli(id: string): string {
  const t = id.replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function lib(sorties: Sorties, id: string): string {
  return sorties.libelles?.[id] ?? joli(id);
}

/** Sérialisation stable (clés triées) pour dériver un identifiant de décision identique à contenu identique. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

function fnv1a(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Identifiant de la décision : celui fourni, sinon un condensé du contenu (même décision = même identifiant = pas de doublon). */
export function identifiantDecision(decision: Decision): string {
  if (typeof decision.id === 'string' && /^[\w.:-]{1,40}$/.test(decision.id)) return decision.id;
  return `d${fnv1a(stable({ ...decision, id: undefined }))}`;
}

function dansPlage(valeur: string, plage?: [number, number]): boolean {
  if (!plage) return true;
  const n = Number.parseInt(valeur, 10);
  return Number.isFinite(n) && n >= plage[0] && n <= plage[1];
}

function issueConvient(i: IssueSalle, rang: string, place: string): boolean {
  return dansPlage(rang, i.rangs) && dansPlage(place, i.places);
}

/** Choisit la porte et le chemin : issue de la salle selon le rang et la place, sinon consigne de la zone, sinon portes de la zone. */
function choisirPorte(d: Destinataire, decision: Decision, sorties: Sorties, zone: ZoneSortie | undefined): Chemin | null {
  const consigne = decision.consignes_par_zone?.[d.zone];
  const bloquee = consigne?.clarte === 'bloquee' ? consigne.porte : undefined;
  const utilisable = (p: string): boolean => p !== bloquee && porteOuverte(decision, p) && sorties.portes.includes(p);
  const chemin = (p: string, propre?: string[]): Chemin => ({ porte: p, chemin: propre ?? zone?.chemins?.[p] ?? [p] });

  const salle = d.billet ? sorties.salles[d.billet.salle] : undefined;
  if (d.billet && salle) {
    const adaptees = salle.issues.filter((i) => issueConvient(i, d.billet!.rang, d.billet!.place));
    for (const i of [...adaptees, ...salle.issues.filter((i) => !adaptees.includes(i))]) {
      if (utilisable(i.porte)) return chemin(i.porte, i.chemin);
    }
  }
  if (consigne && utilisable(consigne.porte)) return chemin(consigne.porte);
  for (const p of zone?.portes ?? []) if (utilisable(p)) return chemin(p);
  return null;
}

interface Textes {
  titre: string;
  evac: string;
  conf: string;
  info: string;
  infoSeule: string;
  place: (salle: string, rang: string, place: string) => string;
  placeCourte: (salle: string, place: string) => string;
  sortez: (porte: string, via: string) => string;
  via: (etape: string) => string;
  rejoignez: (etape: string) => string;
  marchez: string;
  suivez: string;
  aide: string;
  ascenseurOk: string;
  pasAscenseur: (refuge?: string) => string;
  gardezPlace: string;
  attendez: string;
}

const FR: Textes = {
  titre: TITRE_FR,
  evac: 'Évacuation du lieu.',
  conf: 'Restez à l\'intérieur pour le moment.',
  info: 'Information du lieu.',
  infoSeule: 'Aucune évacuation n\'est demandée pour le moment. Suivez les indications du personnel.',
  place: (s, r, p) => `Salle ${s}, rang ${r}, place ${p} :`,
  placeCourte: (s, p) => `Salle ${s}, place ${p} :`,
  sortez: (porte, via) => `sortez par ${porte}${via}.`,
  via: (e) => `, en passant par ${e}`,
  rejoignez: (e) => `Rejoignez ${e}`,
  marchez: 'Marchez sans courir.',
  suivez: 'Suivez le personnel.',
  aide: 'Demandez l\'aide du personnel si besoin.',
  ascenseurOk: 'L\'ascenseur est utilisable.',
  pasAscenseur: (refuge) =>
    refuge
      ? `ne prenez pas l'ascenseur. Rejoignez ${refuge} et demandez l'aide du personnel.`
      : 'ne prenez pas l\'ascenseur. Restez près de votre place et faites signe au personnel pour être aidé.',
  gardezPlace: 'Gardez votre place.',
  attendez: 'Attendez les indications du personnel.',
};

const EN: Textes = {
  titre: TITRE_EN,
  evac: 'The venue is being evacuated.',
  conf: 'Please stay inside for now.',
  info: 'Venue information.',
  infoSeule: 'No evacuation is requested for now. Follow the staff instructions.',
  place: (s, r, p) => `Hall ${s}, row ${r}, seat ${p}:`,
  placeCourte: (s, p) => `Hall ${s}, seat ${p}:`,
  sortez: (porte, via) => `leave through ${porte}${via}.`,
  via: (e) => `, going through ${e}`,
  rejoignez: (e) => `Head to ${e}`,
  marchez: 'Walk, do not run.',
  suivez: 'Follow the staff.',
  aide: 'Ask the staff for help if needed.',
  ascenseurOk: 'The lift can be used.',
  pasAscenseur: (refuge) =>
    refuge
      ? `do not use the lift. Go to ${refuge} and ask the staff for help.`
      : 'do not use the lift. Stay near your seat and signal the staff to be helped.',
  gardezPlace: 'Keep your seat.',
  attendez: 'Wait for the staff instructions.',
};

const T: Record<Langue, Textes> = { fr: FR, en: EN };

/** Assemble les phrases dans l'ordre et s'arrête avant de dépasser 160 caractères (la première est obligatoire, tronquée si besoin). */
function assembler(obligatoire: string[], optionnelles: string[]): string {
  let texte = obligatoire.filter(Boolean).join(' ');
  if (texte.length > CORPS_MAX) texte = tronquer(texte, CORPS_MAX);
  for (const o of optionnelles) {
    if (!o) continue;
    const essai = `${texte} ${o}`;
    if (essai.length <= CORPS_MAX) texte = essai;
  }
  return texte;
}

function majuscule(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Contexte {
  decision: Decision;
  sorties: Sorties;
  idDecision: string;
  maintenant: number;
  expire_s: number;
  ascenseurInterdit: boolean;
  urgence: NiveauUrgence;
}

function messageZone(d: Destinataire, ctx: Contexte, sources: string[]): string {
  if (d.langue !== 'fr') return '';
  const brut = ctx.decision.messages_par_zone?.[d.zone];
  const propre = nettoyerTexte(brut, 100);
  if (!propre || contientInterdit(propre) || chiffresInventes(propre, sources).length > 0) return '';
  return /[.?]$/.test(propre) ? propre : `${propre}.`;
}

function construire(d: Destinataire, ctx: Contexte): Notification {
  const { decision, sorties } = ctx;
  const t = T[d.langue];
  const zone = sorties.zones[d.zone];
  const action = decision.action;
  const salleTxt = d.billet ? lib(sorties, d.billet.salle) : '';
  const sources: string[] = [salleTxt, d.billet?.rang ?? '', d.billet?.place ?? ''];
  const etiquettePlace = d.billet ? t.place(salleTxt, d.billet.rang, d.billet.place) : '';
  const etiquetteCourte = d.billet ? t.placeCourte(salleTxt, d.billet.place) : '';

  let corps: string;
  let consigne: Omit<Consigne, 'niveau_urgence' | 'expire_s'>;

  if (action === 'evacuer') {
    const sansAscenseur = d.pmr && ctx.ascenseurInterdit;
    const choix = sansAscenseur ? null : choisirPorte(d, decision, sorties, zone);
    if (sansAscenseur) {
      const refuge = zone?.refuge ? lib(sorties, zone.refuge) : undefined;
      sources.push(refuge ?? '');
      const dir = `${d.billet ? `${etiquetteCourte} ` : ''}${d.billet ? t.pasAscenseur(refuge) : majuscule(t.pasAscenseur(refuge))}`;
      corps = assembler([t.evac, dir], [messageZone(d, ctx, sources)]);
      consigne = {
        porte: refuge ? 'refuge' : 'personnel',
        chemin: refuge ? [refuge] : [],
        etape_suivante: refuge ? t.rejoignez(refuge) : t.aide,
      };
    } else if (choix) {
      const porteTxt = lib(sorties, choix.porte);
      const etapes = choix.chemin.map((e) => lib(sorties, e));
      sources.push(porteTxt, ...etapes);
      const via = etapes.length > 1 ? t.via(etapes[0]!) : '';
      const sortez = t.sortez(porteTxt, via);
      const dir = d.billet ? `${etiquettePlace} ${sortez}` : majuscule(sortez);
      const dirSimple = d.billet ? `${etiquettePlace} ${t.sortez(porteTxt, '')}` : majuscule(t.sortez(porteTxt, ''));
      const base = `${t.evac} ${dir}`.length <= CORPS_MAX ? [t.evac, dir] : [dirSimple];
      const aideLift = d.pmr ? [zone?.ascenseur && !ctx.ascenseurInterdit ? t.ascenseurOk : '', t.aide] : [];
      corps = assembler(base, [...aideLift, t.marchez, t.suivez, messageZone(d, ctx, sources)]);
      consigne = { porte: choix.porte, chemin: etapes, etape_suivante: t.rejoignez(etapes[0] ?? porteTxt) };
    } else {
      // Aucune porte exploitable pour cette personne (zone ou salle inconnue) : jamais d'invention, on renvoie vers le personnel.
      corps = assembler([t.evac, `${d.billet ? `${etiquetteCourte} ` : ''}${d.billet ? t.attendez.charAt(0).toLowerCase() + t.attendez.slice(1) : t.attendez}`], []);
      consigne = { porte: 'personnel', chemin: [], etape_suivante: t.aide };
    }
  } else if (action === 'confiner') {
    corps = assembler([t.conf, d.billet ? `${etiquetteCourte} ${t.gardezPlace.charAt(0).toLowerCase()}${t.gardezPlace.slice(1)}` : '', t.attendez], [messageZone(d, ctx, sources)]);
    consigne = { porte: 'sur_place', chemin: [], etape_suivante: t.attendez };
  } else {
    const zoneMsg = messageZone(d, ctx, sources);
    corps = assembler([t.info, zoneMsg || t.infoSeule], zoneMsg ? [t.suivez] : []);
    consigne = { porte: 'sur_place', chemin: [], etape_suivante: t.suivez };
  }

  // Dernier filet : un corps qui ne serait pas sûr (trop long, terme interdit, cri) n'est jamais émis tel quel.
  if (!estSur(corps)) corps = tronquer(nettoyerTexte(corps, CORPS_MAX).replace(/alerte officielle/gi, 'message'), CORPS_MAX);

  return {
    id: `${ctx.idDecision}:${d.id}`,
    destinataire_id: d.id,
    titre: t.titre,
    corps,
    consigne: { ...consigne, niveau_urgence: ctx.urgence, expire_s: ctx.expire_s },
    emis_a: ctx.maintenant,
  };
}

/**
 * Une notification par destinataire, différente par zone, par salle et par place, avec variantes PMR et FR/EN.
 * Refuse (ErreurDecision) une décision qui enferme ou empêche de sortir, ou qui cite une zone ou une porte inconnue.
 */
export function preparerNotifications(
  decision: Decision,
  population: readonly Destinataire[],
  sorties: Sorties,
  options: OptionsPreparation = {},
): Notification[] {
  const diag = validerDecision(decision, sorties);
  if (diag.erreurs.length > 0) throw new ErreurDecision(diag.erreurs);
  const contexte = decision.contexte ?? 'autre';
  const ctx: Contexte = {
    decision,
    sorties,
    idDecision: identifiantDecision(decision),
    maintenant: (options.maintenant ?? Date.now)(),
    expire_s: options.expire_s ?? EXPIRE_S_DEFAUT,
    ascenseurInterdit: decision.ascenseurs_interdits ?? contexte === 'incendie',
    urgence: decision.action === 'evacuer' ? 'urgence' : decision.action === 'confiner' ? 'important' : 'info',
  };
  const vus = new Set<string>();
  const sortie: Notification[] = [];
  for (const d of population) {
    if (vus.has(d.id)) continue; // un destinataire en double ne reçoit qu'une notification
    vus.add(d.id);
    sortie.push(construire(d, ctx));
  }
  return sortie;
}
