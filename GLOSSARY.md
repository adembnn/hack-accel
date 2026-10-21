# Glossaire

Le vocabulaire commun des quatre orchestrateurs et de leurs sous-agents. Un mot, une définition, les synonymes à éviter. Format : `.claude/skills/domain-modeling/GLOSSARY-FORMAT.md`. Se remplit avec le concept (kickoff) et au fil des tickets ; `domain-modeling` le tient à jour.

## Le harnais (déjà fixé)

- **Lot** : une unité de travail = un ticket GitHub + une branche `lot/<nom>` + des dossiers autorisés + une commande de vérification + une étape du script de démo. Pas « tâche », pas « feature ».
- **Ticket** : l'issue GitHub d'un lot. Pas « issue », pas « carte ».
- **Frontière** : les tickets prêts dont tous les bloquants sont fusionnés. C'est là qu'un orchestrateur se sert.
- **Orchestrateur** : la session Claude Code d'un coéquipier (Opus), qui prend des tickets et lance des sous-agents. Pas « agent principal ».
- **Implémenteur** : sous-agent (Sonnet) qui construit un ticket dans son worktree. **Fusionneur** : `tools/fusionner.mjs` (un lot vert dans `main`) ou, pendant `implement-spec`, le sous-agent qui fusionne un ticket vert dans la branche d’intégration.
- **Vérification** : `node tools/verif.mjs` (lint, types, tests, build). **Verte** = passe, **rouge** = échoue. « Fini » n'existe pas sans vérification verte collée.
- **Preuve** : la sortie de commande collée qui justifie un « ça marche ».
- **Couture** : l'interface entre deux lots (fonction, table, événement, route), écrite dans le ticket avant de coder.
- **Script de démo** : `demo/SCRIPT.md`, 3 minutes, deux colonnes écran | voix. Le critère unique : une tâche qui ne sert aucune étape du script est coupée.
- **État du build** : le message Discord toutes les 10 min (`tools/etat-build.mjs`).
- **Journal** : `journal/*.jsonl`, les actions des agents, local à chaque machine.

## Le produit

_(à remplir dès que le concept est choisi : utilisateur, objets du domaine, événements, sources de données)_
