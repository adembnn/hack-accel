// Seule entrée que les autres lots importent (CODING_STANDARDS : un module = un fichier d'entrée).
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
export { creerCerveau, MODELE, type Cerveau, type OptionsCerveau } from './cerveau.ts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
export { decideLotParRegles, decideParRegles } from './regles.ts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
export { ROLES, resoudreRole } from './roles.ts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
export { creerRoute, routeAgents } from './route.ts';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
export { ACTIONS, type Action, type AgentEntree, type Decision, type Lot, type Perception, type ReponseCerveau, type RoleDef } from './types.ts';
