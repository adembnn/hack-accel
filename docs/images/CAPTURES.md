# Captures à prendre pour le README

Toutes en 1600x900, navigateur plein cadre, sans barre d'outils visible, format PNG, enregistrées dans `docs/images/` avec le nom ci-dessous.
Lancer d'abord le serveur (voir « Lancer en local » du README), puis ouvrir la vue 3D de Châtelet (`reports/maquettes/chatelet-3d/index.html`, servie par `serveur.mjs` sur le port 8767 ; chemin exact à confirmer).
`node tools/capture.mjs --demo` peut automatiser une partie des prises (à confirmer).

| Fichier | Page / URL | État à montrer |
|---|---|---|
| `01-regie.png` | vue 3D, style D | Régie complète, lundi 19 oct. 20:00, foule calme, cinéma UGC plein, onglets visibles. Image d'en-tête. |
| `02-jumeau-3d.png` | vue 3D, style D, caméra « Forum » | Coupe du Forum avec les niveaux écartés (0 à -5), portes et escalators visibles. |
| `03-foule.png` | vue 3D | 90 s après le début de l'évacuation, 3 200 personnes en mouvement, compteurs de sortie visibles. |
| `04-contraintes-leviers.png` | vue 3D, calque leviers | Épingles de portes et de bouches de métro, menu de perturbations ouvert (cortège D1 et colis D5 posés), une porte fermée. |
| `05-explorateur.png` | sortie de `node src/explorateur/explorer.mjs` ou page de résultats | Classement des plans sur leur pire variante, 550 runs affichés, le meilleur plan en tête. |
| `06-decisions.png` | vue 3D, onglet Décisions | Après 90 s d'évacuation, onglet Décisions ouvert : une décision recommandée, une à prendre, une prise ; frise des événements en dessous. |
| `07-voix.png` | vue 3D, panneau Directeur | Ordre dit à voix haute et transcrit (« une manifestation arrive rue Berger, ferme la porte Rambuteau »), réponse de l'outil, porte fermée dans la 3D. |
| `08-agents.png` | vue 3D, calque agents | Personnages à rôle (sécurité, pompiers, PC, RATP, police) avec leur dernière consigne ; une personne cliquée, son trajet affiché. |
| `09-cameras.png` | mur de caméras (écran exact à confirmer) | Mur de caméras du site, une caméra sur la zone bouchée. |
| `10-alertes.png` | vue 3D, frise inférieure | Chronologie des alertes avec « zone bouchée » en orange puis rouge, stations fermées dès 20:07. |
