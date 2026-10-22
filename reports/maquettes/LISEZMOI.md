# Maquettes du rendu « Matrix » (22/10/2026)

Deux fichiers HTML autonomes, sans dépendance : double-clic pour les ouvrir dans un navigateur.

- `maquette-batiment-3d-rotatif.html` : un bâtiment-type complet en fil de fer vert (6 niveaux, cinéma en sous-sol, galerie, 2 cages d'escalier, 2 ascenseurs, 2 escalators, 7 sorties). On le fait tourner à la souris (glisser), zoom à la molette, isolation d'un niveau, vues façade, iso, dessus. Foule en points qui clignotent. Boutons : lancer, incendie niveau -1 (escalier A enfumé, ascenseurs condamnés, personnes à mobilité réduite en attente), parade IA (ouvre une issue de secours niveau -2).
- `maquette-quartier-isometrique.html` : un quartier-type en isométrique avec le cinéma, six sorties, outils d'incident (feu, zone d'incident, sortie bouchée), parade IA, écran de score.

## Direction retenue (Titouan, 22/10)
Style numérique façon Matrix : fil de fer vert sur noir, pluie de caractères discrète, personnes = points qui clignotent (vert en marche, jaune en file, rouge exposé, cyan pour les personnes à mobilité réduite), HUD en police à chasse fixe (outils à gauche, fil d'alertes à droite, score en bas), bandeau permanent « simulation générée, modèle simplifié, non certifié ».

## Ce que c'est et ce que ça n'est pas
- Maquettes de rendu et de comportement, dessinées en canvas 2D avec un petit moteur 3D maison. Bâtiments inventés (pas le Forum des Halles réel), règles de déplacement simplifiées, **valeurs fictives**.
- Le vrai produit utilise les données OSM / BD TOPO (carte 3D réelle, deck.gl) et un vrai simulateur (JuPedSim) ; voir `reports/donnees-3d-forum-des-halles/`.
- Testées par exécution de leur code dans un environnement simulé (aucune erreur sur 3 scénarios chacune) ; **non vérifiées visuellement dans un navigateur par leur auteur** : si un libellé déborde ou un point sort du bâtiment, le signaler.
- Détail réaliste à garder : en cas d'incendie, on n'évacue pas un public par ascenseur ; les ascenseurs sont condamnés et les personnes à mobilité réduite attendent les secours.
