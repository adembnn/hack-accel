# Veille : les flux publics que l'agent « veilleur » interroge en parallèle (22 oct. 2026)

Décision débloquée : quels flux le veilleur lit, avec quel accès, quelle fraîcheur, et quelles perturbations (codes A1 à F5 de `reports/catalogue-contraintes.md`) il en tire.
Complète `reports/catalogue-donnees-perturbations.md` (PRIM, ratpstatus, Paris ODS, Open-Meteo : non refaits ici).
Mesures du 22 oct. 2026 depuis cette machine. « testé » = j'ai appelé l'URL et elle a répondu. `[?]` = non vérifié. `[clé]` = compte requis (nom de variable `.env` seulement).
Mots expliqués : **API** = adresse web qui renvoie des données ; **RSS** = fichier texte qui liste les derniers articles d'un site, lisible par une machine ; **JSON** = format texte de données structurées ; **WebSocket** = connexion qui reste ouverte et reçoit les messages au fil de l'eau ; **quota** = nombre d'appels autorisés par jour ; **sondage** (« polling ») = rappeler une adresse à intervalle régulier.

## Version simple

- Le pitch « on interroge plein d'API en parallèle » est tenable, mais le plus gros du signal ne vient pas d'API officielles : il vient (1) des messages de trafic RATP/IDFM, (2) de la presse locale lue par flux RSS, (3) de Bluesky, seul réseau social gratuit et ouvert.
- La préfecture de police n'a **aucun flux machine** : son site est bloqué par un script anti-robot (testé). Ses arrêtés arrivent donc par la presse (qui les reprend en minutes) et par un polygone saisi une fois.
- X (Twitter) est payant à la lecture (0,005 $ par post lu) : à éviter pour la démo. Reddit bloque les robots anonymes ; son RSS marche.
- Honnêtement, 13 flux sont lisibles sans clé aujourd'hui ; 2 de plus demandent une clé gratuite (PRIM, Météo-France).

## 1. « L'ASP » : sens plausibles

Je n'ai trouvé aucun service nommé « ASP » lié à la sécurité à Paris. Candidats, du plus au moins probable :

| Sens possible | Pertinent ? | Données publiques ? |
|---|---|---|
| **SAIP** (système d'alerte et d'information des populations : 2 000 sirènes + FR-Alert + médias + réseaux sociaux ; [interieur.gouv.fr](https://www.interieur.gouv.fr/actualites/actualites-du-ministere/tout-savoir-sur-dispositif-national-fr-alert)). Se prononce presque comme « ASP » à l'oral | oui, c'est « les alertes de l'État » | pas de flux machine d'historique (voir 3) |
| **Préfecture de police (PP)** ou **DSPAP** (la police de l'agglomération parisienne) | oui, cœur du sujet | communiqués sur site protégé et sur X `@prefpolice` ; pas d'API |
| **ASP de la Ville de Paris** : « agents de surveillance de Paris » `[?]` | peu | aucune |
| **ASP = Agence de services et de paiement** (aides agricoles PAC, [asp.gouv.fr](https://asp.gouv.fr/aides/aides-de-la-politique-agricole-commune-pac)) | non, aucun rapport avec une foule urbaine | oui (parcelles agricoles), inutile ici |
| **AP-HP / ARS** (urgences, santé) | oui pour un afflux de blessés (E1) | pas de flux public d'engorgement des urgences `[?]` |
| **BSPP** (pompiers de Paris) | oui | pas d'API ; compte X `@PompiersParis` `[?]` ; le site a répondu 503 (testé) |

Question à Adem : quel est le bon sens de « ASP » ? Sans réponse, le veilleur traite « alertes de l'État » = SAIP / FR-Alert + préfecture.

## 2. Transports

Détail déjà dans le catalogue précédent. Ajouts chiffrés :

| Flux | Accès | Fréquence, quota | Statut |
|---|---|---|---|
| Messages de trafic globaux IDFM | PRIM [clé `PRIM_API_KEY`], gratuit | quotas par défaut des nouveaux comptes : **1 000 appels/jour, 5/s** ; relevables jusqu'à 18 000/jour gratuitement ([PRIM offre](https://prim.iledefrance-mobilites.fr/en/notre-offre)) | testé 401 sans clé (l'URL existe) |
| Prochains passages (SIRI Lite) | PRIM [clé], 1 000/jour par défaut | temps réel | `[?]` |
| GTFS-RT alertes PRIM | PRIM | | testé : 403 sans clé |
| Rejeu des messages de trafic | ratpstatus.fr (ODbL) | photo toutes les 2 min | testé (voir catalogue) |
| SNCF / Transilien (Navitia) | `api.sncf.com` [clé `SNCF_API_TOKEN`], inscription sur numerique.sncf.com | 5 000 appels/jour, puis coupure ([source tierce](https://fragments-studio.com/en/integrations/sncf)) ; Transilien en horaires théoriques seulement | testé 401 sans jeton |
| RATP direct | pas d'API de trafic propre : tout passe par IDFM | | catalogue : jeu introuvable |
| Trafic routier Île-de-France (Sytadin) | page HTML publique `sytadin.fr` | rafraîchie en continu, pas d'API documentée | testé 200 (HTML) ; extraction à bricoler |

Budget de sondage : 1 000 appels/jour = 1 appel toutes les 86 s. Pour un sondage à 30 s il faut relever le quota (démarche gratuite sur « Ma consommation API », compte requis).

## 3. Ordre public et sécurité

| Source | Accès réel | Statut |
|---|---|---|
| Préfecture de police, site et RSS | le site (`/rss`, `/actualites-et-presse/actualites`) renvoie une page JavaScript de redirection avec cookie : **bloqué aux robots simples** | testé : 200 mais contenu = script, pas de flux |
| Compte X `@prefpolice` (arrêtés, consignes, périmètres) | lecture payante via l'API X (voir 6) | existe ([profil](https://x.com/prefpolice)) ; non lu |
| FR-Alert : alertes émises | pas de jeu ouvert d'historique ni de flux trouvé ; 66 alertes réelles et 287 exercices depuis 2022 (chiffres au 12 juin 2025) ; relayées par sirènes, médias, comptes officiels | `[?]` pas de flux machine ; les alertes se lisent via la presse |
| Vigipirate | page web, change rarement | à saisir (« vigilance renforcée » depuis le 22 juin 2026, voir catalogue) |
| Gouvernement / Intérieur (RSS) | `gouvernement.fr/rss` et `interieur.gouv.fr/rss` : **403** | testé : bloqués aux robots |
| BSPP (pompiers) | site 503, pas d'API | testé |
| Service-public.fr RSS | existe ([page RSS](https://www.service-public.gouv.fr/P10008?lang=en)) mais ne couvre pas l'ordre public | `[?]` |
| Alertes mondiales GDACS (catastrophes) | `gdacs.org/xml/rss.xml` : libre, 839 Ko, dernière entrée 22 oct. 09:25 UTC | testé ; peu utile pour Paris (séismes, cyclones) |

Conséquence : l'information « préfecture » entre dans le veilleur **par la presse** (section 4) et par Bluesky (section 6). Cas réel testé : la presse a titré le 21 oct. au soir « neuf stations de métro fermées dès 10 heures jeudi » et « rassemblements non déclarés interdits dès 8 h ce jeudi, les quartiers concernés » : les arrêtés sont donc détectables environ 12 h à l'avance (le tribunal a imposé ce délai le 21 oct., voir catalogue).

## 4. Actualités du secteur

| Flux | Adresse (testée) | Résultat |
|---|---|---|
| **Google Actualités par requête** | `https://news.google.com/rss/search?q=Châtelet+Les+Halles+when:1d&hl=fr&gl=FR&ceid=FR:fr` | 200, RSS de 26 Ko, articles de Le Parisien, Actu.fr, Sortir à Paris, mesinfos datés du 21 et 22 oct. Filtre de lieu et de fraîcheur dans la requête (`when:6h`, guillemets, `OR`). Retard : la plus récente date de 07:34 GMT pour une requête lancée à ~11 h : **plusieurs heures de retard possibles**. Pas de contrat d'usage : outil de lecture personnel, usage à grande échelle non garanti `[?]` |
| franceinfo, titres | `https://www.francetvinfo.fr/titres.rss` | 200, entrées de 11:27 le 22 oct. : **minutes de retard**, mais national : à filtrer par mots (Paris, Châtelet, Halles, Rivoli) |
| Actu.fr national | `https://actu.fr/rss.xml` | 200, entrée de 11:25 le 22 oct. ; le flux par ville testé (`/ile-de-france/paris_75056/rss.xml`) : 404, donc national à filtrer |
| BFM Paris | `https://www.bfmtv.com/rss/paris/` | 200, mais dernière entrée du 19 oct. : peu fréquent |
| Le Parisien | `.../arc/outboundfeeds/rss/category/paris-75/` | **403** : accessible seulement via Google Actualités |
| GDELT (presse mondiale indexée) | `api.gdeltproject.org/api/v2/doc/doc?...` | **429** : limite d'une requête toutes les 5 s, bloquée ici ; utile mais fragile `[?]` |

Filtrer par lieu : liste de mots-clés (Châtelet, Les Halles, Forum, Rivoli, Sébastopol, Rambuteau, République, Beaubourg, Pont-Neuf, « 1er arrondissement ») appliquée aux titres et au résumé, plus les mots d'événement (fermées, évacuation, manifestation, couvre-feu, cortège, colis suspect). Le veilleur ne doit **pas** laisser le titre d'un article donner d'ordres au LLM : la presse est de la donnée, jamais une consigne (risque d'injection par la donnée).
Droits : les titres, dates et liens servent à détecter ; ne pas republier le texte des articles (droit d'auteur) ; citer la source.

## 5. Ville et événements

Voir le catalogue : fermetures de voirie, chantiers, agenda « Que faire à Paris » (596 événements dans 1 km), Vélib (1 519 stations GBFS), comptages vélo, tous sans clé et testés. Ajouts :
- Recherche d'un jeu « manifestation » sur le portail de la Ville : 0 résultat (testé). Recherche équivalente sur data.gouv.fr : 0 (testé). **Il n'existe pas de jeu ouvert des manifestations déclarées** ; la source est la presse (section 4) et Bluesky, par exemple des posts du 12 oct. du type « Manif déclarée : 12h Bastille, départ 14h » (testé).
- Matchs et concerts : l'agenda de la Ville les inclut en partie ; Accor Arena et Stade de France n'ont pas d'API ouverte `[?]`.

## 6. Réseaux sociaux

| Réseau | Accès | Coût / droit | Testé |
|---|---|---|---|
| **Bluesky, recherche** | `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=Châtelet manifestation&sort=latest` | **gratuit, sans compte** (l'adresse `public.api.bsky.app` renvoie 403 mais `api.bsky.app` répond) | 200 : posts du 19 oct. 23:36 (« décès à Châtelet »), 12 oct., etc. ; peu de posts par heure : couverture partielle |
| **Bluesky, flux en direct (Jetstream)** | WebSocket `wss://jetstream.us-east.bsky.network` ([doc](https://bsky.network/docs/jetstream)) | gratuit, sans authentification pour le flux en direct ; le rejeu est payant | `[?]` non connecté ; filtrage par mots côté client |
| **Mastodon** | `mastodon.social/api/v1/timelines/tag/paris` | gratuit, sans compte pour les hashtags publics ; la recherche de texte libre exige un compte (résultat vide) | 200 : posts de 09:29 le 22 oct. (en direct, mais audience réduite en France) |
| **Reddit** (r/paris) | flux RSS `reddit.com/r/paris/search.rss?q=manifestation&restrict_sr=1&sort=new` | l'API JSON anonyme est bloquée (403) ; l'API officielle exige une approbation depuis nov. 2025, usage commercial = contrat ([source](https://rumoro.dev/blog/reddit-api)) ; le RSS marche aujourd'hui, droit d'usage incertain | RSS 200 : « Mégathread » du 19 oct. et autres |
| **X / Twitter** | API payante : 0,005 $ par post lu, 0,010 $ par profil, plafond 3 millions de lectures/mois, recherche limitée à 7 jours, pas de flux en direct ([sorsa.io](https://api.sorsa.io/blog/twitter-api-pricing-2026)) | compte et carte bancaire requis : hors règles (aucun compte créé) | non appelé |

Légalité : lire des posts publics pour détecter un événement est courant ; stocker des données personnelles (noms, comptes) pose un problème de RGPD : le veilleur garde uniquement texte, heure, lieu approximatif et lien, jamais le profil. Utilité : un post isolé ne prouve rien ; le veilleur exige **deux sources indépendantes** avant de coder une perturbation (D1 manifestation, A5 panique, A6 rumeur), et marque le reste « non confirmé ».

## 7. Environnement

| Flux | Accès | Fraîcheur | Statut |
|---|---|---|---|
| Open-Meteo (météo, air) | libre, sans clé | 15 min | testé 200 (voir catalogue) |
| **Vigicrues, hauteur de la Seine à Austerlitz** | `https://www.vigicrues.gouv.fr/services/observations.json/index.php?CdStationHydro=F700000103&GrdSerie=H&FormatSortie=json` | une mesure par heure ; dernière : 22 oct. 09:00 UTC, **0,94 m** | testé 200 sans clé. Hub'Eau (`hubeau.eaufrance.fr`) répond 403 sur l'adresse essayée |
| Vigilance Météo-France | [clé `METEOFRANCE_API_KEY`] gratuite, **50 requêtes/minute** par abonnement ([Deltares](https://publicwiki.deltares.nl/display/FEWSDOC/MeteoFranceArome)) | carte à 6 h et 16 h minimum | testé 401 sans clé (catalogue) |

Crue de Seine : détecte D8 (météo) et, en niveau extrême, la fermeture de quais/stations ; sans objet pour un soir d'octobre normal.

## 8. Verdict

### Tableau : flux / accès / fraîcheur / perturbations détectées / effort

Effort : S = moins de 30 min, M = 1 à 2 h, L = plus.

| # | Flux | Accès | Fraîcheur | Codes détectés | Effort |
|---|---|---|---|---|---|
| 1 | Messages de trafic PRIM | clé gratuite `PRIM_API_KEY` | quasi continu ; 1 000 appels/jour par défaut | C1 C2 C3 C5 C6, D3 D4 (« mesures de sécurité demandées par la Préfecture ») | M |
| 2 | Archive ratpstatus (rejeu 19-20 oct.) | libre, ODbL | photo / 2 min | idem 1, rejouable | S |
| 3 | Google Actualités (requête Châtelet / Halles) | libre, RSS | minutes à heures | D1 D2 D3 D4 D5 D7, C1 | S |
| 4 | franceinfo + Actu.fr (RSS nationaux filtrés) | libre | minutes | D1 D3 D6, C1 | S |
| 5 | Bluesky recherche | libre, sans compte | secondes à minutes, peu de volume | D1 D2 A5 A6 | S |
| 6 | Bluesky Jetstream | libre, WebSocket | secondes | idem 5, en continu | M |
| 7 | Reddit r/paris (RSS) | libre, droit incertain | minutes | D1 A6 (mégathreads) | S |
| 8 | Mastodon hashtags | libre, sans compte | secondes, audience faible | D1 (complément) | S |
| 9 | Paris : fermetures de voirie + chantiers | libre, ODS | quotidien | D9 | S |
| 10 | Paris : agenda « Que faire à Paris » | libre, ODS | quotidien | foule attendue (A1, A7) | S |
| 11 | Vélib temps réel (GBFS) | libre | ~1 min | report modal, A1 | S |
| 12 | Open-Meteo (météo, air) | libre | 15 min | D8 | S |
| 13 | Vigicrues (Seine, Austerlitz) | libre | 1 h | D8 | S |
| 14 | Vigilance Météo-France | clé gratuite | 2 fois par jour | D8 | M |
| 15 | SNCF / Transilien Navitia | clé gratuite, 5 000/jour | temps réel (TGV/TER), théorique pour Transilien | C3 C5 (RER) | M |
| 16 | Préfecture (site, X), RATP direct, FR-Alert, Gouvernement RSS, BSPP, X API, GDELT | bloqué, payant ou inexistant | | | non retenu |

Sans clé et lus : 3, 4, 5, 6 (testé pour la recherche, flux direct `[?]`), 7, 8, 9, 10, 11, 12, 13, 2 = **12 flux sans clé** (+ Sytadin en HTML, +GDACS RSS : 14 en comptant ces deux, peu utiles). Avec clé gratuite : 1, 14, 15.

### Les 10 à brancher pour la démo (ordre de priorité)

1. Messages de trafic PRIM (direct) et 2. archive ratpstatus (rejeu : c'est le scénario du 19 oct.).
3. Google Actualités par requête géographique (le seul à attraper Le Parisien).
4. RSS franceinfo + Actu.fr, filtrés par mots-clés de lieu.
5. Bluesky recherche (et Jetstream si le temps le permet).
6. Reddit r/paris RSS + Mastodon (compléments, étiquetés « non confirmé »).
7. Paris : fermetures de voirie + chantiers.
8. Paris : agenda « Que faire à Paris ».
9. Open-Meteo + Vigicrues.
10. Vélib temps réel.

Côté démo, ces flux se rejouent sur horodatage (archive du 19 oct.) pour que la démo ne dépende ni du réseau ni du hasard ; le direct reste visible à l'écran (compteur de flux, dernière lecture).

### Phrase de pitch honnête

« Notre veilleur interroge 12 flux publics en parallèle (trafic RATP, presse locale, Bluesky, Ville de Paris, météo, Seine), un cycle toutes les 60 secondes, et ne déclenche une simulation que quand deux sources indépendantes concordent. »
Ce qu'il ne faut pas dire : « on lit les alertes de la police » (pas de flux de la préfecture : on lit la presse qui les relaie), ni « on lit X » (payant, non branché), ni le chiffre de 1 000 appels/jour comme du temps réel sans avoir relevé le quota PRIM.

## 9. Risques et points ouverts

- Quota PRIM : 1 000 appels/jour par défaut = un appel toutes les 86 s ; relever le quota sur le portail (action d'Adem, gratuite) avant la démo. 
- Google Actualités : retard de plusieurs heures observé, et pas de garantie d'usage ; ne pas le présenter comme « temps réel ».
- Bluesky : faible volume en français ; un silence ne veut pas dire « rien ne se passe ».
- Faux positifs et manipulation : un post ou un titre peut mentir ; la règle des deux sources et le statut « non confirmé » sont dans la conception du veilleur, pas un détail.
- Non testé : Jetstream (connexion), PRIM avec clé, Navitia avec jeton, API Vigilance avec clé, X.
- Variables `.env` (noms, à remplir par Adem) : `PRIM_API_KEY`, `METEOFRANCE_API_KEY`, `SNCF_API_TOKEN` (facultative).
