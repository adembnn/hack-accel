# Standards de code

Lu par l'agent de revue (`code-review`, axe Standards), pas par l'implémenteur. Jugements que l'outillage ne peut pas trancher ; ce qui est mécanique va dans un lint ou un hook, pas ici.

## Ce qui fait refuser une revue

1. **Valeur fausse ou décorative** : une donnée affichée qui ne vient pas de la base ou du flux réel ; une étape d'agent qu'on pourrait remplacer par une requête ; un résultat d'IA non borné par le code.
2. **Secret ou identifiant dans le code** : clés, URL de base avec mot de passe, webhooks. Tout vient de `process.env`.
3. **Erreur avalée** : un `catch` qui ne fait que logger, ou rien. Soit on remonte, soit on dégrade explicitement (mode démo, cache).
4. **Appel au modèle sans garde** : pas de délai maximal, pas de repli (cache de démo), pas de borne sur la sortie. Voir `demo/parcours.json` (mode `?demo=1`).
5. **Hors couture** : un lot qui appelle l'intérieur d'un autre lot au lieu de son interface déclarée dans le ticket.
6. **Commentaire qui répète le code**, abstraction utilisée une fois, test qui recopie l'implémentation.
7. **Texte visible par l'utilisateur** avec des tics d'IA (voir `creatif-anti-slop` dans les règles globales) ou en franglais : l'interface est en français ou en anglais, pas les deux.

## Conventions (jugement, pas lint)

- Identifiants de code en anglais ; commentaires, commits, tickets et messages en français.
- Un module = un dossier de lot, avec un fichier d'entrée (`index.ts`) qui est la seule chose que les autres lots importent (module profond, petite interface : `codebase-design`).
- Les valeurs qui règlent la démo (délais, seuils, tailles d'échantillon, couleurs) vivent dans un fichier de tokens, pas en dur.
- Un test par couture, un test par étape de démo ; pas de test pour le reste tant que la démo n'est pas couverte.
- Les sorties de l'agent qui vont devant le jury citent leur source (ligne, événement, horodatage).
