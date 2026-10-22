// Trente personnages à rôle du Forum des Halles : ce qu'ils voient, ce qu'ils ont le droit de faire, leurs limites.
// Appuyé sur reports/dispositif-securite-existant.md (dispositif.json) : l'outil aide le dispositif en place, il ne le remplace pas.
// Les effectifs réels ne sont pas publics : ces postes sont des types de postes plausibles, pas un organigramme.
import type { Action, Famille, RoleDef } from './types.ts';

const VOIX_FAIBLE = 8;
const VOIX_NORMALE = 15;
const VOIX_FORTE = 30;
const VOIX_SONO = 200;

const LIM_PRIVE = ['Ne peut pas contraindre physiquement : il oriente et invite.', 'Ne ferme jamais une issue de secours.'];

function def(
  id: string, famille: Famille, nom: string, description: string, voit: RoleDef['voit'], actions: Action[],
  limites: string[], portee_voix_m: number, influence: number,
): RoleDef {
  return { id, famille, nom, description, voit, actions, limites, portee_voix_m, influence };
}

const VUE_LOCALE: RoleDef['voit'] = ['zone', 'densite', 'alarme', 'danger', 'blesses', 'issues', 'cibles', 'consigne_pc'];
const VUE_LARGE: RoleDef['voit'] = [...VUE_LOCALE, 'zones'];
const VUE_ETROITE: RoleDef['voit'] = ['zone', 'densite', 'alarme', 'danger', 'issues', 'cibles'];
const VUE_INDIVIDU: RoleDef['voit'] = ['zone', 'densite', 'alarme', 'danger', 'issues', 'cibles', 'consigne_pc'];

export const ROLES: RoleDef[] = [
  // Poste central et direction
  def('pc-chef-poste', 'pc', 'Chef de poste du PC sécurité (SSIAP 3)',
    'Dirige la mise en sécurité depuis le PC : voit les alarmes et les caméras, commande la sonorisation et le déverrouillage des issues.', VUE_LARGE,
    ['crier', 'ouvrir', 'bloquer', 'attendre'],
    ['Ne se déplace pas : il agit par la sonorisation et les commandes.', 'Ne commande que les issues pilotables depuis le PC.', 'Ne décide pas à la place du directeur d’une évacuation générale.'], VOIX_SONO, 1),
  def('directeur-centre', 'directeur', 'Directeur du centre',
    'Responsable du lieu : décide évacuer, confiner ou attendre, après avis du PC et des secours.', VUE_LARGE,
    ['crier', 'ouvrir', 'appeler_pc', 'attendre'],
    ['Ne se déplace pas dans la foule.', 'Ne commande ni les pompiers ni la police : il les informe.', 'Une évacuation générale passe par le PC sécurité.'], VOIX_SONO, 1),

  // Sécurité incendie (SSIAP) et sûreté du centre
  def('ssiap-porte-lescot', 'securite', 'Agent SSIAP 1, poste porte Lescot',
    'Agent de sécurité incendie en poste fixe à une porte : accueille, oriente, lève le doute.', VUE_LOCALE,
    ['guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'], LIM_PRIVE, VOIX_NORMALE, 0.6),
  def('ssiap-porte-berger', 'securite', 'Agent SSIAP 1, poste porte Berger',
    'Agent de sécurité incendie en poste fixe à une porte donnant sur la rue.', VUE_LOCALE,
    ['guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'], LIM_PRIVE, VOIX_NORMALE, 0.6),
  def('ssiap-porte-rambuteau', 'securite', 'Agent SSIAP 1, poste porte Rambuteau',
    'Agent de sécurité incendie en poste fixe à une porte côté Rambuteau.', VUE_LOCALE,
    ['guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'], LIM_PRIVE, VOIX_NORMALE, 0.6),
  def('ssiap-ronde-niveau', 'securite', 'Agent SSIAP 1 en ronde',
    'Agent mobile qui fait les rondes entre les niveaux et lève le doute sur une alarme.', VUE_LOCALE,
    ['deplacer', 'guider', 'crier', 'appeler_pc', 'attendre'],
    [...LIM_PRIVE, 'Se déplace à la vitesse de marche, pas de course dans une foule dense.'], VOIX_NORMALE, 0.6),
  def('ssiap-chef-equipe', 'securite', 'Chef d’équipe SSIAP 2',
    'Coordonne les agents SSIAP, rend compte au PC, accueille les pompiers.', VUE_LARGE,
    ['deplacer', 'guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'], LIM_PRIVE, VOIX_FORTE, 0.75),

  // Pompiers
  def('pompiers-chef-detachement', 'pompiers', 'Chef de détachement des pompiers',
    'Commande l’intervention des secours : fixe le périmètre, ordonne les ouvertures et les évacuations sur le terrain.', VUE_LARGE,
    ['deplacer', 'guider', 'crier', 'bloquer', 'ouvrir', 'appeler_pc', 'attendre'],
    ['Reste sous sa propre chaîne de commandement : l’outil lui propose, il décide.', 'Une consigne d’évacuation ne vise jamais une zone dangereuse.'], VOIX_FORTE, 1),
  def('pompiers-equipier-1', 'pompiers', 'Équipier pompier 1',
    'Équipier du détachement : exécute les ordres de son chef, reconnaît les zones, évacue.', VUE_LOCALE,
    ['deplacer', 'guider', 'crier', 'bloquer', 'ouvrir', 'appeler_pc', 'attendre'],
    ['N’agit que sur ordre du chef de détachement hors urgence vitale.'], VOIX_FORTE, 0.9),
  def('pompiers-equipier-2', 'pompiers', 'Équipier pompier 2',
    'Équipier du détachement chargé de l’évacuation des personnes à mobilité réduite.', VUE_LOCALE,
    ['deplacer', 'guider', 'crier', 'appeler_pc', 'attendre'],
    ['Ne quitte pas la personne qu’il assiste tant que le relais n’est pas pris.'], VOIX_FORTE, 0.9),
  def('pompiers-secouriste', 'pompiers', 'Secouriste pompier',
    'Prend en charge les blessés et malaises dans la foule.', [...VUE_ETROITE, 'blesses'],
    ['deplacer', 'guider', 'appeler_pc', 'attendre'], ['Reste auprès des blessés : ne guide pas la foule.'], VOIX_NORMALE, 0.8),

  // RATP
  def('ratp-agent-chatelet', 'ratp', 'Agent de station, Châtelet',
    'Agent RATP de la station : voit ses quais, ses accès et l’état de la ligne.', VUE_LOCALE,
    ['guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'],
    ['Oriente les clients vers l’accès ouvert le plus proche, sans décider de l’évacuation du Forum.', 'Ne ferme que les accès de sa station.'], VOIX_NORMALE, 0.6),
  def('ratp-agent-leshalles', 'ratp', 'Agent de station, Les Halles',
    'Agent RATP de la station Les Halles : accès vers le Forum et le RER.', VUE_LOCALE,
    ['guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'],
    ['Ne ferme que les accès de sa station.', 'Ne décide pas de l’arrêt des trains : le poste de commande de la ligne le fait.'], VOIX_NORMALE, 0.6),
  def('ratp-chef-ligne', 'ratp', 'Chef de service ligne RER',
    'Relais du poste de commande de la ligne : informe le PC du Forum de l’état des trains et des fermetures.', VUE_ETROITE,
    ['appeler_pc', 'crier', 'attendre'], ['Ne se déplace pas.', 'Ne commande pas les issues du Forum.'], VOIX_FORTE, 0.7),

  // Police
  def('police-brigadier', 'police', 'Brigadier de police nationale',
    'Chef de patrouille : sécurise un secteur, dirige la circulation des personnes en surface.', VUE_LOCALE,
    ['deplacer', 'guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'],
    ['N’entre dans le Forum qu’à la demande du directeur ou en urgence.', 'Ne commande pas les issues du centre.'], VOIX_FORTE, 0.9),
  def('police-patrouille-rue', 'police', 'Patrouille de police, rue',
    'Policiers en surface : canalisent les piétons vers les bouches de métro ouvertes.', VUE_LOCALE,
    ['deplacer', 'guider', 'crier', 'bloquer', 'appeler_pc', 'attendre'], ['Ne commande pas les issues du centre.'], VOIX_FORTE, 0.85),
  def('police-barrage-manif', 'police', 'Policier au barrage de la manifestation',
    'Tient un barrage : empêche l’accès à une zone de trouble ou de défilé.', VUE_ETROITE,
    ['bloquer', 'crier', 'appeler_pc', 'attendre'], ['Reste à son poste : ne quitte pas le barrage sans relève.', 'Ne guide pas la foule du centre.'], VOIX_FORTE, 0.85),
  def('police-cordon-mobile', 'police', 'Gardien de la paix, cordon mobile',
    'Forme avec ses collègues un cordon mobile qui dégage une voie d’évacuation.', VUE_LOCALE,
    ['deplacer', 'guider', 'bloquer', 'crier', 'attendre'], ['Dépend de la présence de collègues pour tenir le cordon.'], VOIX_FORTE, 0.85),
  def('police-bouche-metro', 'police', 'Policier posté à une bouche de métro',
    'Surveille un accès de métro fermé ou saturé et réoriente les passants.', VUE_ETROITE,
    ['guider', 'bloquer', 'crier', 'appeler_pc', 'attendre'], ['Ne rouvre pas un accès fermé par la RATP.'], VOIX_NORMALE, 0.8),

  // Cinéma
  def('cinema-responsable', 'cinema', 'Responsable du cinéma',
    'Responsable de l’exploitation du multiplexe : décide d’interrompre les séances et fait sortir les salles par vagues.', VUE_LARGE,
    ['crier', 'ouvrir', 'appeler_pc', 'attendre'], ['Ne décide que pour ses salles.', 'Interrompre les séances se fait après accord du PC sécurité.'], VOIX_FORTE, 0.8),
  def('cinema-ouvreur-1', 'cinema', 'Ouvreur de salle 1',
    'Personnel de salle : ouvre les issues de sa salle et guide les spectateurs vers la sortie.', VUE_ETROITE,
    ['guider', 'crier', 'ouvrir', 'appeler_pc', 'attendre'], ['N’ouvre que les issues de sa salle.', 'Quitte la salle en dernier.'], VOIX_NORMALE, 0.55),
  def('cinema-ouvreur-2', 'cinema', 'Ouvreur de salle 2',
    'Personnel de salle : guide les spectateurs dans les escaliers de sortie des salles.', VUE_ETROITE,
    ['guider', 'crier', 'ouvrir', 'appeler_pc', 'attendre'], ['N’ouvre que les issues de sa salle.', 'Quitte la salle en dernier.'], VOIX_NORMALE, 0.55),

  // Commerces
  def('commerce-gerant', 'commerce', 'Gérant de boutique',
    'Commerçant : connaît sa surface de vente et ses clients, peut les faire sortir par son arrière-boutique.', VUE_ETROITE,
    ['guider', 'crier', 'appeler_pc', 'attendre'], ['Ne ferme jamais son rideau sur des clients présents.', 'N’a pas de formation à l’évacuation de foule.'], VOIX_NORMALE, 0.35),
  def('commerce-restaurant', 'commerce', 'Responsable de restauration',
    'Dirige l’évacuation de ses clients attablés, sans les mêler à la circulation.', VUE_ETROITE,
    ['guider', 'crier', 'appeler_pc', 'attendre'], ['N’a pas de formation à l’évacuation de foule.'], VOIX_NORMALE, 0.35),
  def('commerce-entretien', 'commerce', 'Agent d’entretien',
    'Personnel présent dans les circulations, qui connaît les issues de service.', VUE_ETROITE,
    ['deplacer', 'guider', 'appeler_pc', 'attendre'], ['Aucune autorité sur la foule.', 'Ne peut ouvrir une issue de service qu’à la demande du PC.'], VOIX_FAIBLE, 0.2),

  // Individus influents dans la foule
  def('individu-parent', 'individu', 'Parent avec enfants',
    'Suit la foule en gardant ses enfants près de lui : cherche la sortie la plus proche et la plus dégagée.', VUE_INDIVIDU,
    ['deplacer', 'crier', 'attendre'], ['Ne guide personne.', 'Évite une issue chargée au-delà de 4 pers./m² s’il en existe une moins chargée.'], VOIX_FAIBLE, 0.1),
  def('individu-touriste', 'individu', 'Touriste',
    'Ne connaît pas les lieux : suit les panneaux, les agents et la foule.', VUE_INDIVIDU,
    ['deplacer', 'attendre'], ['Ne connaît pas les issues non signalées.', 'Suit une consigne claire d’un agent reconnu.'], VOIX_FAIBLE, 0.05),
  def('individu-aine', 'individu', 'Personne âgée à mobilité réduite',
    'Se déplace lentement ; ralentit ceux qui la suivent dans un escalier.', VUE_INDIVIDU,
    ['deplacer', 'crier', 'appeler_pc', 'attendre'], ['Vitesse réduite.', 'Ne monte pas un escalier sans aide.'], VOIX_FAIBLE, 0.1),
  def('individu-meneur', 'individu', 'Personne qui prend les devants',
    'Individu résolu qui entraîne spontanément son entourage dans la direction qu’il choisit.', VUE_INDIVIDU,
    ['deplacer', 'guider', 'crier', 'attendre'],
    ['Aucune autorité formelle : son influence dépend de la confiance de ceux qui l’entourent.', 'Ne peut ni bloquer ni ouvrir une issue.'], VOIX_NORMALE, 0.4),
  def('individu-soignant', 'individu', 'Soignant présent dans la foule',
    'Professionnel de santé en civil : porte secours en cas de malaise, appelle les secours.', [...VUE_INDIVIDU, 'blesses'],
    ['deplacer', 'guider', 'crier', 'appeler_pc', 'attendre'], ['Reste auprès de la personne qu’il aide.', 'Aucune autorité sur la foule.'], VOIX_NORMALE, 0.3),
];

const PAR_ID = new Map(ROLES.map((r) => [r.id, r]));

/** Rôle neutre pour un personnage non référencé : il peut marcher, appeler et attendre, rien de plus. */
export const ROLE_INCONNU: RoleDef = def('individu-inconnu', 'individu', 'Personne inconnue', 'Rôle non référencé : droits minimaux.',
  ['zone', 'densite', 'alarme', 'issues'], ['deplacer', 'appeler_pc', 'attendre'], ['Rôle non référencé : aucune autorité.'], VOIX_FAIBLE, 0.05);

/** Retrouve un rôle par identifiant exact, sinon par famille (premier de la famille), sinon rôle minimal. */
export function resoudreRole(role: string): RoleDef {
  return PAR_ID.get(role) ?? PAR_ID.get(ALIAS_MAQUETTE[role] ?? '') ?? ROLES.find((r) => r.famille === role) ?? ROLE_INCONNU;
}

/** Noms de rôles de la maquette d'Adem (reports/maquettes/chatelet-3d/serveur.mjs) vers nos personnages. */
const ALIAS_MAQUETTE: Record<string, string> = {
  pompier: 'pompiers-chef-detachement',
  chef_de_poste: 'pc-chef-poste',
  meneur: 'individu-meneur',
  panique: 'individu-touriste',
  parent: 'individu-parent',
  filme: 'individu-touriste',
  pmr: 'individu-aine',
};
