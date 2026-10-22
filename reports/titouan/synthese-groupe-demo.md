# Synthèse du groupe démo (22/10/2026)

Sources : 4 agents (Sonnet), recherches courtes. Ce qui est marqué (mémoire) n'a pas été vérifié aujourd'hui.

## 1. Le « shell » commun : une interface de rejeu façon jeu de stratégie
À construire tout de suite, indépendamment du domaine choisi : carte (MapLibre) + points animés (deck.gl) + HUD.
- Pile : MapLibre GL (fond minimal embarqué) + deck.gl (ScatterplotLayer, TripsLayer pour les traînées, quelques arcs au plus) + Vite, dans un seul Dockerfile exposant un port HTTP (Aiven Runtime : HTTPS 443 en entrée, HTTP seulement, WebSocket non documenté).
- Mode par défaut : rejeu précalculé. Fichier de ticks binaire compressé (positions quantifiées, un état par tick), chargé une fois, interpolé côté navigateur. Ordre de grandeur : 5 000 agents x 600 ticks = 12 Mo avant compression. Mode « live » en option par SSE (message de maintien toutes les 15 s), avec bascule automatique vers le rejeu si le flux se tait plus de 5 s.
- Éléments du HUD par ordre de priorité (temps estimé) : fil d'alertes (20 min), écran de score avant/après (30), jauge globale avec détail au survol (30), panneau unique sélection-action (40), curseur de vitesse (45), aperçu fantôme d'une décision (90, exige un état rejouable), frise de rejeu (60), brouillard de guerre (à couper en premier).
- Règle : information et action sur le même écran ; un seul flux de bout en bout ; écran de score en dernier dans la démo.
- Performance : 60 images par seconde attendues pour 5 000 points (doc deck.gl, marge très large) ; à mesurer sur le portable et le projecteur dès le départ (prototype de 5 000 points en 30 minutes).
- Plan B : build local, MP4 de 90 secondes, partage 4G, test plein écran sur l'écran de projection.

## 2. Preuve mesurable (critère 4) : benchmark en une heure
30 scénarios étiquetés avec une règle réussite/échec automatique, trois systèmes (base naïve, modèle seul, agent complet), trois passages chacun, mesurer réussite, coût par succès, latence p50/p95, appels d'outils, et trois échecs réels expliqués. Livrer results.csv, baseline.csv, une capture du tableau et le script. Affichage : une ligne de chiffres sous l'écran scindé avant/après.

## 3. TXT « couche de données en action » (10 lignes)
Projet ; fraîcheur (délai mesuré) ; échelle (volume, débit) ; un paragraphe par service Aiven (rôle, pourquoi pas l'alternative) ; ancrage (chaque réponse cite sa source) ; mémoire (fait appris hier, utile aujourd'hui) ; preuve (3 chiffres) ; limites ; ce qui était décoratif et a été retiré.

## 4. Domaines faits pour un bac à sable de stratégie (preuve de paiement d'abord)
| Domaine | Preuve de paiement | Donnée publique | Wow | Note |
|---|---|---|---|---|
| Ports et trafic maritime | Kpler a racheté MarineTraffic en 2023 (mémoire), Windward coté (mémoire), projet ESA ARRIVAL-X (budget public) | Flux AIS gratuit (AISstream, mémoire, clé probable), OSM, météo marine | Navires en mouvement, retard, 3 plans d'allocation de quai, heures d'attente évitées | Données en continu pour Kafka ; point à vérifier : volume AIS et historique rejouable |
| Implantation de commerces | GrowthFactor : 5,2 M$ de seed en mars 2026, 1 M$ de revenu récurrent, 30 clients ; LocateAI ~18 M$ ; SiteZeus | OSM, Overture, GTFS | 5 magasins posés, cannibalisation simulée, l'agent choisit | Preuve de paiement la plus fraîche ; marché occupé ; demande modélisée donc preuve difficile |
| Data centers et réseau électrique | GridCARE : 64 M$ en série A en mai 2026 ; VoltaGrid : 1 Md$ en mai 2026 | OSM, éCO2mix, ENTSO-E | Où brancher 200 MW dans 18 mois, 4 scénarios | Faisabilité moyenne, modèle de capacité approximatif |
| Recharge de véhicules électriques | Stable 14 M$ (2022), petites levées | OSM, IRVE | 50 bornes posées, files d'attente simulées | Preuves anciennes ou petites ; taille de marché à vérifier |
| Transport public | Remix ~18 800 $/an dans un contrat (2018) | GTFS, GTFS-RT | Bus en mouvement, incident, 3 plans de réaffectation | Très faisable ; risque de monétisation faible |
| Événements, foules, stades | Peu de preuve : produits existants (INCONTROL, Legion), aucune levée récente trouvée | OSM, GTFS | Foule qui s'écoule, 4 plans d'ouverture de portes | Ne satisfait pas le filtre « preuve de paiement » d'Adem |
Écartés : aviation, sport, urbanisme, secours, climat (interdits ou preuves absentes).

## 5. Lecture
- Le shell (section 1) sert n'importe quel domaine : le domaine fournit un générateur de ticks, un jeu de scénarios et une règle de score.
- Selon le filtre zéro d'Adem (preuve de paiement), les foules et événements (Refuge) sont le maillon faible ; les ports et l'implantation de commerces sont les mieux placés ; les data centers sont portés par un thème chaud côté investisseurs.
- Aucune taille de marché supérieure à 100 M€/an n'a été vérifiée pour les trois premiers.
