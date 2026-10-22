// Point d'entrée du module d'envoi des consignes (public et personnel).
export * from './types.ts';
export { preparerNotifications, identifiantDecision } from './dispatcher.ts';
export { preparerMissions, calculerCouverture, validerAgents } from './missions.ts';
export { creerSuivi } from './suivi.ts';
export { creerRoute, creerService, routeNotifications } from './route.ts';
export { creerCanalConsole } from './canaux/console.ts';
export { creerBusTelephone, creerCanalTelephoneSimule } from './canaux/telephone-simule.ts';
export { creerCanalWebPush } from './canaux/web-push.ts';
export { creerCanalWalletStub } from './canaux/wallet-pass.ts';
export { creerCanalSms } from './canaux/sms.ts';
export { creerCanalAgent, ficheImprimable, missionEnNotification } from './canaux/agent.ts';
export { validerDecision, ErreurDecision } from './validation.ts';
