// Test de fumée Jev : UN SEUL appel minuscule (une question choice à trois options, un état de quelques mots).
// À lancer UNE fois par Titouan, jamais par un agent :
//   node --env-file=.env src/agents/smoke-jev.mts --oui-payant            (passerelle Vercel, AI_GATEWAY_API_KEY)
//   node --env-file=.env src/agents/smoke-jev.mts --oui-payant --direct    (TypeSafe direct, TYPESAFE_API_KEY)
// Refuse de tourner sans --oui-payant et sans clé. Écrit la réponse dans le cache de rejeu fixtures/jev/smoke.json.
import { MODELE_JEV, TransportHttpJev, TransportRejeuJev, cleDeRequete } from './jev.ts';
import type { RequeteJev } from './jev.ts';
import { TransportJevGateway } from './jev-gateway.ts';

const args = process.argv.slice(2);
if (!args.includes('--oui-payant')) {
  console.error('Refus : ce script fait un appel PAYANT (quelques millièmes de centime). Relance avec --oui-payant après accord d\'Adem.');
  process.exit(2);
}
const direct = args.includes('--direct');
const nomCle = direct ? 'TYPESAFE_API_KEY' : 'AI_GATEWAY_API_KEY';
if (!process.env[nomCle]) {
  console.error(`Refus : ${nomCle} absente de l'environnement (mets-la dans .env, puis lance avec --env-file=.env).`);
  process.exit(2);
}

const requete: RequeteJev = {
  model: MODELE_JEV,
  state: { densite: 'critique', tendance: 'monte' },
  questions: {
    plan: {
      type: 'choice',
      instructions: 'Quelle décision globale prendre pour le centre ?',
      criteria: { rester_ouvert: 'Aucun risque', fermer_par_etapes: 'Fermer par niveaux', fermer: 'Tout fermer' },
    },
  },
};

const transport = direct ? new TransportHttpJev({ autorise_payant: true }) : new TransportJevGateway({ autorise_payant: true, plafond_appels: 1 });
const reponse = await transport.envoyer(requete);
new TransportRejeuJev('fixtures/jev/smoke.json').enregistrer(requete, reponse);
console.log(`Backend : ${direct ? 'TypeSafe direct' : 'Vercel AI Gateway'} ; clé de cache : ${cleDeRequete(requete)}`);
console.log('Réponse :', JSON.stringify(reponse.answers));
console.log(`Jetons : entrée ${reponse.usage?.input_tokens ?? '?'}, sortie ${reponse.usage?.output_tokens ?? '?'}`);
console.log('Enregistré dans fixtures/jev/smoke.json (rejeu sans réseau ensuite).');
