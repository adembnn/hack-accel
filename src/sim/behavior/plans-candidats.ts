// Plans candidats pour la recherche d'un plan meilleur "sur tout" (zone de danger ET t90). Chaque plan n'utilise que des leviers
// réels (messages par salle, phasage, guidage, fermeture d'une porte). Aucune issue de secours légitime n'est fermée :
// seule la rue de la Ferronnerie (qui débouche dans le périmètre interdit) est fermée, et le métro seulement à 400 s,
// juste avant sa fermeture réelle (~20 h 07, 420 s dans la scène). Scène illustrative. Modèle simplifié, non certifié.
import type { Plan } from './types.ts';
import { SALLES } from './simuler.ts';

type Msg = Plan['messages_par_zone'];
const msgs = (issues: string[], clarte: number, t = 0): Msg => SALLES.map((zone, k) => ({ zone, issue_id: issues[k % issues.length], clarte, a_partir_de_s: t }));
const PORTE_FERRO = { id: 'ferronnerie', ouverte: false, a_partir_de_s: 0 };
const PORTE_METRO_400 = { id: 'metro', ouverte: false, a_partir_de_s: 400 };
const ETAPES = (delaiParVague: number, tailleVague: number) => SALLES.map((salle, k) => ({ salle, delai_s: Math.floor(k / tailleVague) * delaiParVague }));
// répartition proportionnelle aux débits (principale 3,1 ; secours 1,6 ; escalators 2,1 ; métro 3,9 pers./s)
const PAR_DEBIT = ['metro', 'principale', 'escalators', 'metro', 'principale', 'secours'];
const SANS_VIGILANCE = ['metro', 'escalators', 'secours', 'metro', 'escalators', 'metro'];

const base = { confinement: false, phasage_salles: [] as Plan['phasage_salles'], guidage: null as Plan['guidage'] };

export const PLANS_CANDIDATS: { nom: string; idee: string; plan: Plan }[] = [
  { nom: 'C1_ferme_ferronnerie_seule', idee: 'Ne ferme que la rue vers la zone interdite ; consigne floue inchangée', plan: { ...base, mode: 'fermer', portes: [PORTE_FERRO], messages_par_zone: msgs(['principale'], 0.5) } },
  { nom: 'C2_repartition_par_debit', idee: 'Un message clair par salle, réparti selon les débits (métro, hall, escalators, secours) ; ferronnerie fermée', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO], messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
  { nom: 'C3_repartition_metro_ferme_400', idee: 'C2 + métro fermé à 400 s (juste avant sa fermeture réelle) pour que personne n\'y entre en cul-de-sac', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
  { nom: 'C4_sans_hall_vigilance', idee: 'Évite le hall (derrière : vigilance) : messages vers métro, escalators, secours', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], messages_par_zone: msgs(SANS_VIGILANCE, 0.9) } },
  { nom: 'C5_repartition_guidage_secours', idee: 'C3 + 8 agents guident vers la sortie de secours (issue sous-utilisée)', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], guidage: { issue_id: 'secours', personnel: 8 }, messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
  { nom: 'C6_repartition_2_vagues_20s', idee: 'C3 + 2 vagues de 3 salles espacées de 20 s', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], phasage_salles: ETAPES(20, 3), messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
  { nom: 'C7_repartition_3_vagues_60s', idee: 'C3 + 3 vagues de 2 salles espacées de 60 s (phasage du plan décideurs)', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], phasage_salles: ETAPES(60, 2), messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
  { nom: 'C8_clarte_maximale', idee: 'C3 avec message très clair (0,97) : effet de la clarté seule', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], messages_par_zone: msgs(PAR_DEBIT, 0.97) } },
  { nom: 'C9_guidage_leger_hall', idee: 'C3 + 4 agents vers le hall principal (le plus gros débit)', plan: { ...base, mode: 'fermer_par_etapes', portes: [PORTE_FERRO, PORTE_METRO_400], guidage: { issue_id: 'principale', personnel: 4 }, messages_par_zone: msgs(PAR_DEBIT, 0.9) } },
];
