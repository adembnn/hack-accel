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

_(à compléter : utilisateur, objets du domaine, événements, sources de données)_

- **Plan** : la décision d'évacuation à un instant donné (mode, portes ouvertes ou fermées, départ des salles par vagues, agents de guidage, consignes par zone, confinement), produite par les décideurs. Son format fait foi dans `lot/decideurs`. Pas « stratégie », pas « scénario ».
- **Scénario** : la situation de départ que l'on rejoue (graine, heure de l'annonce, fermeture des stations, couvre-feu, population par zone). Un scénario se joue avec un ou plusieurs plans.
- **Porte** : une sortie publique nommée du Forum vers la rue (`lescot`, `berger`, `rambuteau`…). Une porte regroupe une ou plusieurs sorties physiques de la scène. Pas « issue » pour une porte nommée.
- **Issue** : un passage par lequel une personne quitte la zone où elle se trouve (porte, issue de secours, escalator, accès métro), vu par le comportement d'une personne.
- **Zone** : une partie nommée du lieu, `niveau_<n>` (un niveau) ou `salle_<kk>` (une salle du cinéma). Les mêmes noms servent partout entre les lots.
- **Consigne** : ce qu'une zone reçoit (porte conseillée et clarté de 0 à 1). Le texte affiché est un « message ».
- **Intention** : ce que le comportement d'une personne demande au mouvement à chaque pas (sortie visée, vitesse voulue, groupe, état).
- **État résumé** : ce que la simulation rend à chaque minute simulée (personnes dedans et sorties, sorties vers une zone de danger, densité maximale, état par zone, débit des portes, pression).
- **Grille** : les critères qui notent un plan, dans l'ordre décidé par Adem (#15) : non-sortis, zone de danger, écrasement.
- **Graine** : le nombre qui fixe le hasard d'une simulation ; deux plans joués avec la même graine voient les mêmes personnes.
