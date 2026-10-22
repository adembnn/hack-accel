// Test de fumée Claude Haiku : UN SEUL petit appel (une question à choix de trois options, un état de quelques mots).
// À lancer UNE fois par Titouan, jamais par un agent :
//   node --env-file=.env src/agents/smoke-claude.mts --oui-payant
// Prérequis : ANTHROPIC_API_KEY et MODE_PAYANT=oui dans l'environnement (par exemple dans .env, le temps du test).
// Refuse de tourner sans --oui-payant et sans clé. Écrit la réponse dans le cache de rejeu scellé fixtures/claude/smoke.json.
import { MODELE_DECIDEURS, TransportRejeuTypee, cleDeRequete } from './decisions-typees.ts';
import type { RequeteTypee } from './decisions-typees.ts';
import { TransportClaudeHaiku, modeleDecideurs } from './claude-decideurs.ts';

const args = process.argv.slice(2);
if (!args.includes('--oui-payant')) {
  console.error('Refus : ce script fait un appel PAYANT (une fraction de centime). Relance avec --oui-payant après accord d\'Adem.');
  process.exit(2);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Refus : ANTHROPIC_API_KEY absente de l\'environnement (mets-la dans .env, puis lance avec --env-file=.env).');
  process.exit(2);
}

const requete: RequeteTypee = {
  model: modeleDecideurs() || MODELE_DECIDEURS,
  state: { densite: 'critique', tendance: 'monte' },
  questions: {
    plan: {
      type: 'choice',
      instructions: 'Quelle décision globale prendre pour le centre ?',
      criteria: { rester_ouvert: 'Aucun risque', fermer_par_etapes: 'Fermer par niveaux', fermer: 'Tout fermer' },
    },
  },
};

// L'autorisation vient du drapeau --oui-payant (vérifié plus haut) ; MODE_PAYANT=oui doit aussi être dans l'environnement (garde commune).
const transport = new TransportClaudeHaiku({ autorise_payant: args.includes('--oui-payant'), plafond_appels: 1, max_tokens: 300 });
const reponse = await transport.envoyer(requete);
new TransportRejeuTypee('fixtures/claude/smoke.json').enregistrer(requete, reponse);
console.log(`Modèle : ${requete.model} ; clé de cache : ${cleDeRequete(requete)}`);
console.log('Réponse :', JSON.stringify(reponse.answers));
console.log(`Jetons : entrée ${reponse.usage?.input_tokens ?? '?'}, sortie ${reponse.usage?.output_tokens ?? '?'}`);
console.log('Enregistré dans fixtures/claude/smoke.json (rejeu sans réseau ensuite).');
