### Corps exact d'un ticket (ce que lisent le garde-fou, la vérification et l'état du build)

Publier avec `gh issue create --title "<titre>" --label ready-for-agent --body-file -` (corps par l'entrée standard, jamais une chaîne shell). Corps :

```
**Lot** : `lot/<nom>` · **Dossiers** : `src/<dossier>/` · **Étape de démo** : <numéros>
**Vérification** : `node tools/verif.mjs` et `<commande propre au lot, optionnelle>`

## Ce que ça fait marcher de bout en bout
<2 phrases, côté utilisateur>

## Coutures
<interfaces exposées ou consommées, avec leur forme>

## Critères
- [ ] <critère 1, vérifiable par une commande>
- [ ] <critère 2>

## Bloqué par
- #<numéro> (ou « rien, peut démarrer »)
```

Le premier ticket est toujours le lot 0 (parcours réel de bout en bout sur Aiven Runtime) ; tous les autres le listent dans « Bloqué par ».
