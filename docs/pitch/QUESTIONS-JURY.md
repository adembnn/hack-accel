# Les 12 questions difficiles du jury (Accel, Aiven, Iterate)

Réponses en 2 à 3 phrases, à dire telles quelles. Chaque réponse cite le fichier d'où vient le fait. « À vérifier » = nous n'avons pas la preuve ; ne pas affirmer. `[hyp]` = hypothèse publiée comme telle dans nos notes.

## 1. « Est-ce vraiment Châtelet ? »
Les 16 accès voyageurs, leurs numéros, leurs coordonnées et les lignes desservies sont ceux d'Île-de-France Mobilités (jeu ODbL), et le bâti vient d'OpenStreetMap : nous disons « fidèle » pour les accès, « approché » pour les boutiques et le cinéma. Aucun plan par niveau du Forum n'est public ; les plans réels sont privés (`reports/plans-officiels-forum.md`). À vérifier : la précision des niveaux -1 et -2, pauvres dans OpenStreetMap (`README.md`).

## 2. « D'où viennent les données, et ai-je le droit de les utiliser ? »
OpenStreetMap et IDFM sont sous licence ODbL, utilisées et affichées avec attribution ; textures Poly Haven et personnages Kenney sont en CC0 (`README.md`, section Licences). Le plan Westfield/Visioglobe n'a pas de licence ouverte : usage interne de recalage seulement, jamais montré sans accord d'URW (`CLAUDE.md`, décision du 22 oct.). Google sert d'inspiration visuelle, aucune géométrie n'en est extraite (`CLAUDE.md`). À vérifier : la licence du code du dépôt (« à confirmer » dans `README.md`).

## 3. « Pourquoi une société de sécurité paierait-elle ? »
Elle est responsable des crises sur place, pour de nombreux sites, avec une radio et un plan papier ; le 19 oct. le chef de poste a décidé seul pour 3 000 personnes (`demo/SCRIPT.md`). L'exercice d'évacuation tous les 6 mois est obligatoire (Code du travail R4227-39) et aucun outil ne sert à la fois à préparer et à décider en direct (`reports/qui-achete-synthese.md`). À vérifier : aucun appel à une société de sécurité n'a eu lieu ; la décision de cible est née d'un échange avec un juré (`CLAUDE.md`, 22 oct.).

## 4. « Quel prix, et sur quelle base ? »
Nous visons de 9 000 € par an et par site (formule Essentiel) à 24 000 € (formule Pro, type Forum des Halles), entre une licence de simulation (3 à 16 k$) et une alerte de masse (10 à 60 k$ par an) (`reports/qui-achete-3-concurrence-prix.md`). Ce sont des hypothèses, pas des prix acceptés. À vérifier : trois appels prévus (un directeur de centre, un chargé d'affaires Socotec, un organisateur d'événement), non faits (`reports/qui-achete-synthese.md`).

## 5. « Et MassMotion, Pathfinder, Legion, Crowd Dynamics ? »
Ils simulent à froid pour un ingénieur : Pathfinder de 2 640 à 3 960 USD par an, LEGION à partir de 16 330 USD, MassMotion Flow vers 8,5 k$ ; Crowd Dynamics est du conseil, activité actuelle non prouvée (`reports/qui-achete-3-concurrence-prix.md`). Aucun ne compare des plans classés sur le pire cas ni ne reçoit un ordre à la voix le jour J. Réserve honnête : Onhys, en France, a fait presque la même chose et a fermé en nov. 2023 ; sa cause exacte est inconnue (même rapport). À vérifier : nous n'avons pas lu toutes les démos concurrentes.

## 6. « Que fait le LLM, que fait la simulation ? »
La simulation (forces sociales de Helbing, choix de sortie de Lovreglio, départ log-logistique) fait tout le mouvement et tout le classement des plans, sans modèle de langage (`README.md`, `CLAUDE.md`). Claude Sonnet 5.5 comprend les ordres à la voix et rédige les messages ; Claude Haiku 5.5 choisit les intentions d'une trentaine de personnages, et le moteur exécute le déplacement (`CLAUDE.md`, décision « Modèles des agents »). À vérifier : le nombre d'ordres compris (20 sur 20 annoncé, un test de 11 ordres dans le dépôt).

## 7. « Qui est responsable si le plan est mauvais ? »
Le chef de poste valide ; il n'y a pas de mode automatique, il choisit parmi les trois meilleurs (`CLAUDE.md`, explorateur de plans). L'outil s'appuie sur le dispositif existant (issues, alarme, PC sécurité) et ne le remplace pas (`CLAUDE.md`, principe du 22 oct.). Nous le disons : le moteur n'est pas réaliste au-delà de 2 personnes/m², nos alertes rouges sont des seuils, pas des mesures (`reports/validation-moteur-foule.md`). À vérifier : clauses de responsabilité et assurance, non étudiées.

## 8. « Les flux sont-ils vraiment en temps réel ? »
Les fermetures de stations du 19 oct. sont établies par une archive (ratpstatus) : stations du Forum fermées dès environ 20 h 07 (`CLAUDE.md`). La démo rejoue un scénario préparé que le juré peut modifier ; le mode hors réseau fige la graine et met les réponses IA en cache (`demo/SCRIPT.md`). À vérifier : si le flux RATP est lu en direct pendant la démo ou rejoué depuis l'archive ; ne pas dire « en direct » sans l'avoir testé.

## 9. « Cela passe-t-il à d'autres lieux ? »
Nous avons déjà construit un second jumeau, l'Arena (le moteur de foule de l'Arena est fusionné avec un banc d'essai vert, d'après l'historique git), avec le même module de leviers. Un nouveau lieu demande ses sorties, ses niveaux et ses sources de plan : l'intérieur reste saisi ou importé, pas deviné (`reports/qui-achete-3-concurrence-prix.md`). À vérifier : le temps réel pour monter un lieu neuf, et le nom exact de la salle (Adidas Arena selon la consigne, « Accor Arena » dans `CLAUDE.md`).

## 10. « Qu'apporte Aiven, au-delà d'un hébergement ? »
Une mémoire des crises : chaque incident et chaque plan retenu est gardé dans Aiven PostgreSQL et sert à calibrer les suivants, ce qui répond à la mémoire longue du brief (`demo/SCRIPT.md`, étapes 2 et 5). Aiven Runtime héberge l'application dans le même projet que la base, et le `Dockerfile` est prêt (`README.md`, `reports/hackathon-terrain.md`). À vérifier : `README.md` classe encore le déploiement et la mémoire « prévu ». Si le jury demande le service live, montrer le plan B (base locale en conteneur) en le disant.

## 11. « Qui êtes-vous, et pourquoi vous ? »
Adem, Titouan, Sullyvan et Alexandre : quatre builders IA et business, avec des lots séparés (foule, décideurs, Aiven, jumeau 3D) (`CLAUDE.md`, `README.md`). Nous avons fait le jumeau, deux moteurs de foule et 550 simulations en une journée. À vérifier : aucun de nous n'a d'expérience en sécurité privée ni en ingénierie incendie ; le dire, et dire que le premier appel client sert à combler cela.

## 12. « Que faites-vous dans les 90 prochains jours ? »
Proposition à valider par l'équipe, rien de décidé : (1) les trois appels de prix et un pilote de quatre semaines sur un site, idéalement le Forum (`demo/SCRIPT.md`, `reports/qui-achete-synthese.md`) ; (2) corriger le moteur au-delà de 2 personnes/m² (pas de temps de 0,05 s, règle de croisement) et le recaler sur des mesures de terrain (`reports/validation-moteur-foule.md`) ; (3) ajouter les scénarios fréquents qui manquent : zone d'exclusion pour un colis, fumée, fouille puis réouverture par zones (`reports/qui-achete-synthese.md`). À vérifier : l'accord d'URW pour montrer ses plans, et la date officielle d'entrée en vigueur de la Martyn's Law.
