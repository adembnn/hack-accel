// Seule entrée que les autres lots importent (CODING_STANDARDS : un module = un fichier d'entrée).
export { creerCerveau, MODELE, type Cerveau, type OptionsCerveau } from './cerveau.ts';
export { decideLotParRegles, decideParRegles } from './regles.ts';
export { ROLES, resoudreRole } from './roles.ts';
export { creerRoute, routeAgents } from './route.ts';
export { ACTIONS, type Action, type AgentEntree, type Decision, type Lot, type Perception, type ReponseCerveau, type RoleDef } from './types.ts';
