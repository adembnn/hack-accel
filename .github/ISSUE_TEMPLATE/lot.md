---
name: Lot
about: Un lot = une branche + des dossiers + une vérification + une étape du script de démo
labels: ready-for-agent
---

**Lot** : `lot/<nom>` · **Dossiers** : `src/<dossier>/` · **Étape de démo** : <numéros, ex. 2, 3>
**Vérification** : `node tools/verif.mjs` (et la commande propre au lot s'il y en a une)

## Ce que ça fait marcher de bout en bout

<Ce que l'utilisateur voit ou obtient quand ce lot est fini, en 2 phrases.>

## Coutures

<Les interfaces que ce lot expose ou consomme : fonction, table, événement, route, avec leur forme.>

## Critères (l'implémenteur coche chacun dès qu'il passe, avec la sortie de commande en commentaire)

- [ ] Critère 1
- [ ] Critère 2

## Bloqué par

- #<numéro> ou « rien, peut démarrer »
