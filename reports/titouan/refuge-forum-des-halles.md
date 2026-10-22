# Refuge : spécification du scénario Forum des Halles (22/10/2026, 10h)

Remplace la version générale de piste-3D-detail.md. Soumission : 15h30 (agenda officiel : 15h, à confirmer).

## Utilisateur et promesse
Le gérant ou le responsable sûreté du Forum des Halles (Paris 1er). Il clique sur les Halles, le lieu est modélisé en 3D. Il injecte un incident (un feu ici, un rassemblement hostile là, telle sortie bouchée), l'agent joue le scénario, mesure l'évacuation et propose des parades. Un exercice de crise sur table, en 3 minutes, au lieu d'un bureau d'études.

## Parcours à l'écran
1. **Choisir le lieu** : une carte 3D de Paris ; le gérant clique sur les Halles (ou dans la zone d'environ 1 km autour). La scène se construit : bâtiments extrudés (OSM + hauteurs BD TOPO), relief, Canopée en volumes simples, intérieur du Forum modélisé à la main (cinéma, galeries, sorties, accès RER).
2. **Régler la situation** : l'heure, la sortie de séance (effectif à calibrer, pas de chiffre inventé), météo facultative.
3. **Poser les incidents** (boîte à outils, un clic sur la scène) :
   - **Feu** : un point, avec propagation.
   - **Zone d'incident d'ordre public** : une zone à éviter qui peut s'étendre (traitée comme un danger fixe, jamais comme des personnes à simuler).
   - **Sortie bouchée** : on clique une sortie.
   - Option : accès RER fermé.
4. **Jouer** : la foule se met en mouvement, curseur de temps (pause, x1, x4, x16), fil d'alertes, jauge de tension (densité).
5. **L'agent propose et teste** : échelonner la sortie des salles, ouvrir une issue, rediriger par un autre itinéraire, déplacer un point de rassemblement ; il relance, compare, justifie.
6. **Écran de score** : temps total, temps du 90e centile, densité maximale, goulots, avant/après ; décision recommandée et consignes en trois lignes pour le personnel.
7. **Mémoire** : la décision et son effet sont enregistrés par site ; au prochain incident semblable, l'agent cite le cas précédent.

## Garde-fous (défensif)
- Les émeutiers ne sont jamais des agents : c'est une zone à éviter, comme un feu. Aucun comportement d'attaquant, aucune optimisation d'une action hostile.
- Libellés neutres dans l'interface et le pitch : « incident d'ordre public », pas « casseurs ». Aucune personne ni plaque réelle à l'écran. Mention permanente : « simulation générée, modèle simplifié, non certifié, aide à la décision ». Indicateur « généré par IA » (règlement européen sur l'IA, art. 50).
- Montrer le libellé au coéquipier qui décide du concept avant le pitch.

## Agents (chacun fait un travail distinct)
- **Scénariste** : transforme les incidents posés par le gérant en paramètres de simulation (zone dangereuse, fermetures, effectif).
- **Analyste** : lit les métriques (ClickHouse), repère les goulots et la cause principale.
- **Optimiseur** : génère N parades, les rejoue, choisit la meilleure et l'explique ; s'appuie sur la mémoire des incidents passés.
Le simulateur est du code, pas un modèle de langage ; tous les chiffres viennent du code.

## Contrats de données (mise à jour)
- Scène : GeoJSON en repère local métrique ; objets : bâtiments {hauteur}, zone praticable, sorties {id, largeur_m, état}, escaliers, accès transport, points de rassemblement.
- Incident : {type:'feu'|'ordre_public'|'sortie_bouchee'|'acces_ferme', position|id, t_debut_s, croissance}.
- Scénario : {scenario_id, site_id, effectif, incidents[], parade:null|{type, parametres}}.
- Ticks (Kafka `sim.ticks`) : {sim_id, scenario_id, variante:'avant'|'apres', t, agent_id, x, y, z, etat}. Danger (`sim.hazard`) : {sim_id, t, cellules[]}. ClickHouse : `ticks`, `hazard`, `runs`(rset_s, t90_s, densite_max, sortie_goulot). Postgres : `sites`, `incidents`, `parades_effets` (la mémoire).

## Données et valeurs (voir recherche/)
- Géométrie : OSM + BD TOPO (licence ODbL / Licence Ouverte 2.0), crédits permanents à l'écran. Google : affichage seulement, jamais d'extraction.
- Valeurs par défaut (document 06) : vitesse libre 1,34 m/s, débit de porte 1,3 pers/s/m, pré-mouvement 30 à 44 s, densité alerte 4 et rouge 5 pers/m2 ; hypothèse à annoncer pour l'alerte d'ordre public.
- Règles ERP (document 05, en cours) : largeurs de sorties et unités de passage pour valider la scène.

## Benchmark pour le jury (critère 4)
30 scénarios = 5 types d'incident x 3 positions x 2 effectifs ; trois systèmes : sans intervention, itinéraire le plus court, parade choisie par l'agent ; 20 graines ; mesures : temps du 90e centile, densité maximale, nombre de sorties saturées ; trois échecs montrés. Une ligne de chiffres sous l'écran avant/après.

## Répartition
- Alexandre : scène 3D (extrusion, Canopée, intérieur), boîte à outils d'incidents, lecture des ticks, curseur de temps, écran de score, fil d'alertes.
- Sullivan : zone praticable à partir de la scène, simulateur (JuPedSim ou modèle maison), feu et zone d'incident, export des ticks, métriques.
- Adem : boucle des agents, Kafka, ClickHouse, Postgres, déploiement Aiven Runtime.
- Titouan : bibliothèque d'incidents, effectifs et seuils réglementaires, benchmark de 30 scénarios, TXT « couche de données », script de démo, pitch, MP4.

## Plan du jour
10:00-11:00 contrats et squelette (scène test, 100 points qui bougent, déploiement sur Aiven) ; 11:00-12:30 scène + simulateur + premier incident de bout en bout ; 12:30-14:00 agents, mémoire, écran de score, benchmark ; 14:00 gel ; 14:00-15:00 vidéo MP4, TXT, diapositive, répétition ; soumission avant 15:15.
