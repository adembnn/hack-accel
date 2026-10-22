// Événements du scénario : (1) l'événement `contrainte` (geste du juré, ticket #13 : ouvrir/fermer une sortie + menu de
// perturbations C1, B1, B3, B5, D1/D2, D5, F1 du catalogue) ; (2) les conflits entre décideurs (catalogue-decisions-leviers §5).
// Une perturbation est une DONNÉE d'entrée (zone ou issue rendue impraticable), jamais un agent hostile (garde-fou).
import type { EtatResume, Scenario } from './types.ts';
import { PORTES } from './types.ts';
import type { EtatDecisions } from './leviers.ts';
import { PERIMETRE_COUVRE_FEU } from './leviers.ts';

export type CodePerturbation = 'SORTIE' | 'C1' | 'B1' | 'B3' | 'B5' | 'D1' | 'D2' | 'D5' | 'F1';
export const CODES_PERTURBATION: readonly CodePerturbation[] = ['SORTIE', 'C1', 'B1', 'B3', 'B5', 'D1', 'D2', 'D5', 'F1'];

export interface EvenementContrainte {
  type: 'contrainte';
  code: CodePerturbation;
  minute: number;                 // minute d'émission (le juré clique)
  cible?: string;                 // porte, station, escalator, zone…
  etat?: 'ouverte' | 'fermee';    // SORTIE
  duree_min?: number;             // D5 : zone fermée N minutes (1 à 180)
  valeur?: number;                // F1 : retard d'information en minutes (0 à 60)
}

// État des perturbations, conservé dans hors_plan.perturbations (lu par les décideurs, le simulateur et le journal).
export interface EtatPerturbations {
  actives: { code: CodePerturbation; cible: string | null; minute_debut: number; minute_fin: number | null }[];
  portes_bloquees: string[];       // B1 : impossible de les rouvrir
  portes_danger: string[];         // D1/D2 : donnent sur une zone à éviter
  stations_fermees: string[];      // C1
  escalators_arretes: string[];    // B3
  ascenseurs_en_panne: string[];   // B5
  zones_fermees: { zone: string; jusqua: number }[]; // D5
  retard_info_min: number;         // F1
}

export const perturbationsVides = (): EtatPerturbations => ({
  actives: [], portes_bloquees: [], portes_danger: [], stations_fermees: [], escalators_arretes: [], ascenseurs_en_panne: [], zones_fermees: [], retard_info_min: 0,
});

export const lirePerturbations = (e: EtatDecisions): EtatPerturbations => (e.hors_plan.perturbations as EtatPerturbations | undefined) ?? perturbationsVides();

// Zone du périmètre → porte du Forum qui donne dessus (rue_berger → porte Berger, etc.).
const PORTE_DE_ZONE: Record<string, string[]> = { rue_berger: ['berger'], rue_rambuteau: ['rambuteau'], bd_sebastopol: [], passage_des_lingeres: [], place_maurice_quentin: [], allee_andre_breton: [] };

export function validerContrainte(e: EvenementContrainte, sc: Scenario): string[] {
  const r: string[] = [];
  if (e.type !== 'contrainte') r.push('type : « contrainte » attendu');
  if (!CODES_PERTURBATION.includes(e.code)) return [...r, `code inconnu : ${String(e.code)} (menu : ${CODES_PERTURBATION.join(', ')})`];
  if (!Number.isInteger(e.minute) || e.minute < sc.minute_annonce - 60 || e.minute > sc.couvre_feu_debut_minute) r.push(`minute ${e.minute} hors de la fenêtre du scénario`);
  const cibleTexte = typeof e.cible === 'string' && e.cible.length > 0 && e.cible.length <= 60;
  switch (e.code) {
    case 'SORTIE': case 'B1':
      if (!e.cible || !PORTES.includes(e.cible)) r.push(`${e.code} : cible = une des portes ${PORTES.join(', ')}`);
      if (e.code === 'SORTIE' && e.etat !== 'ouverte' && e.etat !== 'fermee') r.push('SORTIE : état « ouverte » ou « fermee » attendu');
      break;
    case 'D1': case 'D2':
      if (!e.cible || !(PERIMETRE_COUVRE_FEU as readonly string[]).includes(e.cible)) r.push(`${e.code} : cible = une zone du périmètre (${PERIMETRE_COUVRE_FEU.join(', ')})`);
      break;
    case 'D5':
      if (!cibleTexte) r.push('D5 : zone cible attendue');
      if (!Number.isInteger(e.duree_min) || (e.duree_min as number) < 1 || (e.duree_min as number) > 180) r.push('D5 : duree_min entier de 1 à 180');
      break;
    case 'F1':
      if (!Number.isInteger(e.valeur) || (e.valeur as number) < 0 || (e.valeur as number) > 60) r.push('F1 : valeur (retard) entier de 0 à 60 minutes');
      break;
    default: // C1, B3, B5
      if (!cibleTexte) r.push(`${e.code} : cible attendue (nom court)`);
  }
  return r;
}

// Réception d'une perturbation : met à jour l'état (donc ce que les décideurs voient à la minute suivante).
export function appliquerContrainte(etat: EtatDecisions, e: EvenementContrainte): EtatDecisions {
  const s = structuredClone(etat);
  const p = lirePerturbations(s);
  const cible = e.cible ?? null;
  const ajout = (l: string[], v: string | undefined) => { if (v && !l.includes(v)) l.push(v); };
  let fin: number | null = null;
  switch (e.code) {
    case 'SORTIE':
      if (e.cible) {
        if (e.etat === 'ouverte') { p.portes_bloquees = p.portes_bloquees.filter((x) => x !== e.cible); }
        s.plan.portes[e.cible] = e.etat === 'ouverte' ? 'ouverte' : 'fermee';
      }
      break;
    case 'B1': ajout(p.portes_bloquees, e.cible); if (e.cible) s.plan.portes[e.cible] = 'fermee'; break;
    case 'C1': ajout(p.stations_fermees, e.cible); break;
    case 'B3': ajout(p.escalators_arretes, e.cible); break;
    case 'B5': ajout(p.ascenseurs_en_panne, e.cible); break;
    case 'D1': case 'D2':
      for (const porte of PORTE_DE_ZONE[e.cible ?? ''] ?? []) ajout(p.portes_danger, porte);
      break;
    case 'D5': fin = e.minute + (e.duree_min ?? 0); if (e.cible) p.zones_fermees.push({ zone: e.cible, jusqua: fin }); break;
    case 'F1': p.retard_info_min = e.valeur ?? 0; break;
  }
  p.actives.push({ code: e.code, cible, minute_debut: e.minute, minute_fin: fin });
  s.hors_plan.perturbations = p;
  return s;
}

// Libellés courts pour l'état envoyé à Jev (pas de chiffres bruts).
export const motsPerturbations = (p: EtatPerturbations): string[] => [
  ...p.portes_bloquees.map((x) => `porte_bloquee:${x}`), ...p.portes_danger.map((x) => `porte_vers_zone_a_eviter:${x}`),
  ...p.stations_fermees.map((x) => `station_fermee:${x}`), ...p.escalators_arretes.map((x) => `escalator_arrete:${x}`),
  ...p.ascenseurs_en_panne.map((x) => `ascenseur_en_panne:${x}`), ...p.zones_fermees.map((z) => `zone_fermee:${z.zone}`),
  ...(p.retard_info_min > 0 ? ['information_tardive'] : []),
];

// ---------- Conflits entre décideurs (catalogue-decisions-leviers §5, points 1 à 3) ----------
export type CodeConflit = 'conflit_metro_qui_ferme' | 'conflit_fermer_vs_confiner' | 'conflit_pic_cinema';

export interface EvenementConflit {
  type: 'conflit';
  code: CodeConflit;
  minute: number;
  acteurs: string[];
  details: Record<string, number | string>;
  resolution: string;           // ce que le code recommande / ce que l'agent garde le droit de faire
}

export const REMPLISSAGE_QUAI_MIN = 10;       // H : durée de remplissage des quais avant la fermeture
export const SEUIL_PIC_CINEMA = 1500;         // H : personnes sortant d'un coup du cinéma qui saturent les escaliers

const decision = (e: EtatDecisions, code: string): unknown => (e.hors_plan.catalogue as Record<string, { valeur: unknown }> | undefined)?.[code]?.valeur;

export function detecterConflits(etat: EtatDecisions, resume: EtatResume, sc: Scenario): EvenementConflit[] {
  const sortie: EvenementConflit[] = [];
  const minute = resume.minute;
  // 1. Évacuer vers un métro qui va fermer : le centre n'aura pas fini de sortir avant (fermeture − remplissage des quais).
  const debit = Object.values(resume.debit_portes).reduce((s, d) => s + d, 0);
  const fermeture = Math.min(sc.stations_fermees_minute, (etat.hors_plan.heure_fermeture_stations as number | undefined) ?? sc.stations_fermees_minute);
  const restant = fermeture - REMPLISSAGE_QUAI_MIN - minute;
  if (resume.dans_le_centre > 0 && debit > 0 && restant >= 0) {
    const necessaires = Math.ceil(resume.dans_le_centre / debit);
    if (necessaires > restant) sortie.push({ type: 'conflit', code: 'conflit_metro_qui_ferme', minute, acteurs: ['directeur', 'prefecture', 'ratp'], details: { minutes_necessaires: necessaires, minutes_disponibles: restant, fermeture_stations_minute: fermeture }, resolution: 'Finir la sortie avant la fermeture moins le remplissage des quais : phaser ou ouvrir plus de portes.' });
  }
  // 2. Fermer le centre (demande P6) vs confiner (S8/D4, ou confinement du plan) : le directeur garde le droit de ne pas exécuter.
  const demandeFermer = decision(etat, 'P6') === true;
  const confine = etat.plan.confinement.actif || decision(etat, 'D4') === true || decision(etat, 'S8') === true;
  if (demandeFermer && confine) sortie.push({ type: 'conflit', code: 'conflit_fermer_vs_confiner', minute, acteurs: ['prefecture', 'directeur'], details: { demande_fermeture: 'P6', confinement: 'actif' }, resolution: 'La demande P6 n\'est pas obligatoire : le directeur peut ne pas l\'exécuter et le dit (aucun texte public ne tranche [?]).' });
  // 3. UGC vide d'un coup (U1 = arrêter) alors que le centre phase, sans décalage D6.
  const ugc = resume.par_zone.ugc?.personnes ?? 0;
  const decalage = Number(decision(etat, 'D6') ?? 0);
  if (decision(etat, 'U1') === 'arreter' && decalage === 0 && ugc >= SEUIL_PIC_CINEMA) sortie.push({ type: 'conflit', code: 'conflit_pic_cinema', minute, acteurs: ['ugc', 'directeur'], details: { personnes_cinema: ugc, seuil: SEUIL_PIC_CINEMA }, resolution: 'Décaler la sortie des séances (D6) ou vider par vagues (U2) pour étaler le pic.' });
  return sortie;
}

