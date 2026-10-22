# 21. Alerter les smartphones des personnes présentes : possible, légal, faisable ?

Recherche du 22 oct. 2026 (Keenable + pages officielles). `[SOURCÉ]` = lu dans la page citée ; `[SUPPOSÉ]` = raisonnement ou connaissance non revérifiée aujourd'hui, à vérifier avant de l'affirmer. Défensif uniquement : aucun envoi réel, aucune clé, aucun appel payant.

Contexte projet (wt-sync, `CLAUDE.md` et `reports/qui-achete-synthese.md`) : Adem veut que chaque individu soit cliquable et reçoive sa consigne en temps réel, « en vrai par notification push sur smartphone (une application dédiée ne se vend pas) ». Le client visé est un exploitant privé (Forum des Halles, cinéma) qui doit déjà prévoir et exercer ses évacuations.

## Réponse courte
1. **L'idée est faisable, mais pas comme FR-Alert.** Un lieu privé ne peut pas utiliser le canal des alertes d'État (cell broadcast) et ne doit pas en imiter l'apparence. Il peut en revanche envoyer des messages **à ses propres clients**, par les canaux que ces clients ont déjà ouverts : billet dans le Wallet, SMS, notification de l'app de l'exploitant, PWA installée.
2. **Le vrai verrou n'est pas technique, c'est l'abonnement** : on ne peut notifier que ceux qui ont, avant l'incident, donné un moyen de les joindre. Une alerte push atteint donc une fraction des présents, jamais tous. Elle est un complément, pas le dispositif.
3. **Pour la démo aujourd'hui** : Web Push réel vers 1 à 4 téléphones de l'équipe en 2 h, avec repli sur un téléphone simulé à l'écran. Au jury, tout le reste est dit « en vrai ».

## 1. FR-Alert, cell broadcast, alertes d'urgence Apple et Android

**Qui émet.** Les préfets (crises départementales ou zonales), les maires (pouvoirs de police) et le Premier ministre (crises nationales) `[SOURCÉ]` https://secourisme.net/spip.php?article167= ; la préfecture de police de Paris l'a aussi déclenché `[SOURCÉ]` https://en.wikipedia.org/wiki/FR-Alert . Les opérateurs mobiles ne font que diffuser par leurs antennes ; le système a été déployé par Intersec `[SOURCÉ]` (Wikipédia, même URL). Opérationnel depuis le 21 juin 2022 `[SOURCÉ]` https://www.interieur.gouv.fr/actualites/actualites-du-ministere/tout-savoir-sur-dispositif-national-fr-alert .

**Technique.** Cell broadcast (diffusion par cellule radio, sans numéro de téléphone) plus SMS géolocalisé en complément pour les téléphones anciens `[SOURCÉ]` https://eena.org/blog/fr-alert-a-european-reference-combining-cell-broadcast-and-location-based-sms . Le cell broadcast n'est pas affecté par la charge du réseau, atteint des cellules en moins de 10 s, et l'émetteur ne sait pas qui a reçu (pas de donnée personnelle, donc conforme RGPD) `[SOURCÉ]` https://en.wikipedia.org/wiki/Cell_Broadcast . Les niveaux les plus élevés ne peuvent pas être désactivés par l'utilisateur `[SOURCÉ]` (même page). Les téléphones éteints ou en mode avion ne reçoivent rien `[SOURCÉ]` (secourisme.net).

**Cadre légal.** FR-Alert s'inscrit dans le code national d'alerte du code de la sécurité intérieure `[SOURCÉ]` (secourisme.net), et transpose l'article 110 du code des communications électroniques européen (directive 2018/1972) : les opérateurs doivent relayer les alertes publiques des autorités `[SOURCÉ]` https://joinup.ec.europa.eu/collection/rolling-plan-ict-standardisation/emergency-communications-and-public-warning-systems-rp2024 . Numéros d'articles exacts du CSI non vérifiés `[SUPPOSÉ]`.

**Un lieu privé peut-il y accéder ?** Aucune source trouvée n'ouvre ce canal à une entreprise ; les seuls déclencheurs listés sont l'État et les maires `[SOURCÉ]`. Conclusion : **non** `[SUPPOSÉ, déduit]`. Seul chemin légitime : demander à la préfecture de déclencher, ce qui est son choix et pas celui du directeur. Les alertes Apple (« Alertes gouvernementales ») et Android (« alertes d'urgence sans fil ») sont le même mécanisme côté téléphone ; aucun accès développeur public `[SUPPOSÉ]`.

**À ne surtout pas imiter** (risque juridique et de confiance) :
- Ne jamais écrire « FR-Alert », « alerte gouvernementale », « alerte extrême », « préfecture », « ministère de l'Intérieur », ni reprendre le logo, le rouge d'alerte, la sirène ou le pictogramme officiels.
- Ne jamais présenter un message du lieu comme émanant des secours ou de l'État. Signer : « Message du Forum des Halles (sécurité) ».
- Textes pénaux à vérifier avec un juriste `[SUPPOSÉ, de mémoire]` : usurpation de signes réservés à l'autorité publique (art. 433-13 du code pénal), fausse information faisant croire à un danger (art. 322-14), mise en danger d'autrui. Non revérifiés aujourd'hui : pages de Légifrance non obtenues par la recherche.
- Leçon Hawaii (13 janv. 2018) : un modèle de message « test » envoyé en réel, sans double validation, a mis 38 minutes à être corrigé (12 min pour un tweet, 25 min de plus pour le correctif sur les téléphones) `[SOURCÉ]` https://variety.com/2018/politics/news/fcc-hawaii-false-missile-alert-1202681524 . La FCC a recommandé d'abandonner « This is not a drill » pendant les exercices `[SOURCÉ]` https://cpr.org/2018/04/11/fcc-on-hawaiis-bogus-alert-dont-say-this-is-not-a-drill-during-drills . À retenir pour le produit : bouton exercice/réel visiblement distinct, double validation du directeur, message de correction prêt à partir en un clic, et jamais d'envoi réel automatique sans décision humaine.

## 2. Canaux utilisables par un lieu privé

| Canal | Atteint qui | Délai de mise en place | Limite principale |
|---|---|---|---|
| Web Push (PWA installée) | ceux qui ont installé la PWA et accepté | 2 h (démo) | installation préalable, surtout sur iPhone |
| Billet Wallet (Apple / Google) | acheteurs en ligne ayant ajouté le billet | dépend de la billetterie | seul l'émetteur du pass peut le modifier |
| App native (APNs / FCM) | ceux qui ont l'app de l'exploitant | app existante : jours ; sinon mois | « une app dédiée ne se vend pas » |
| SMS | ceux dont on a le numéro | 1 à 2 semaines (contrat, expéditeur) | numéro rarement collecté en caisse |
| QR code sièges et portes, Wi-Fi captif | ceux qui scannent ou se connectent | jours | action volontaire de la personne |
| Écrans, sonorisation | tous, sans abonnement | existant | pas personnalisé par personne |
| Bluetooth (balises BLE), NFC | ceux qui ont une app ou un pass | mois | app requise |

**Web Push (PWA).** Depuis iOS/iPadOS 16.4, le Web Push existe, mais sur iPhone seulement pour une web app **ajoutée à l'écran d'accueil** ; la demande de permission doit venir d'un geste de l'utilisateur ; l'abonnement exige une clé VAPID et `userVisibleOnly: true` ; chaque événement push doit afficher une notification, sinon WebKit révoque l'abonnement `[SOURCÉ]` https://openpwa.net/reference/notifications/ios-safari-push et https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados . Sur Android (Chrome), pas d'installation obligatoire `[SUPPOSÉ]`. Les notifications web respectent le mode Concentration (Focus) de l'iPhone `[SOURCÉ]` (openpwa.net) : un téléphone en « Ne pas déranger » ne sonnera pas. Pas de contournement sans app native `[SUPPOSÉ]`. Aucun app store, aucune validation Apple.

**Wallet.** Apple : un pass mis à jour ne fait apparaître un message sur l'écran de verrouillage que si un champ a changé et porte une clé `changeMessage` contenant `%@` ; les champs `alert`/`sound` du push sont ignorés `[SOURCÉ]` https://stackoverflow.com/questions/30507455/will-apples-apns-server-let-me-send-random-push-notifications-to-my-pass-users/30518501 (réponse communautaire, ancienne ; à retester). Google : `TEXT_AND_NOTIFY` pousse une notification, **3 par pass et par 24 h au maximum** `[SOURCÉ]` https://developers.google.com/wallet/tickets/boarding-passes/use-cases/trigger-push-notifications . Pathé Gaumont a lancé le billet de cinéma dans Apple Wallet en 2019 et propose aussi Google Wallet `[SOURCÉ]` https://pathe.com/en/blog/access-to-theaters-has-never-been-easier-with-contactless-tickets-embedded-in-the-iphone-and-apple-watch et https://play.google.com/store/apps/details?hl=en_AU&id=com.brocelia.cgp . **Piège** : le pass est signé par son émetteur (le cinéma ou sa billetterie) ; nous ne pouvons pas le modifier sans lui `[SUPPOSÉ, structure du standard PassKit]`. C'est donc un canal à négocier avec l'exploitant, pas à prendre. Que le pass affiche salle et place : `[SUPPOSÉ]`, à vérifier sur un vrai billet. Message très court, sans contrôle de la mise en forme.

**App native, APNs/FCM, Critical Alerts (iOS).** L'entitlement « Critical Alerts » fait sonner l'iPhone même en silencieux, Concentration ou « Ne pas déranger ». Apple l'accorde pour santé, sécurité, urgence (alarmes domestiques, secours, météo grave, notification d'urgence) ; il faut qu'une notification normale ou « time sensitive » ne suffise pas ; l'utilisateur doit en plus l'accepter ; le délai d'examen est de quelques jours à quelques semaines ; refus fréquents pour justification vague `[SOURCÉ]` https://newly.app/how-to/critical-alerts-entitlement , https://developer.apple.com/forums/thread/106042 , https://dontsnooze.io/blog/ios-critical-alerts-permission-alarm-apps (secteurs favorisés : alerte médicale, sécurité domestique, sécurité publique). Chances qu'Apple l'accorde à une app de lieu privé : incertaines `[SUPPOSÉ]`. Il se demande **par app**, donc par l'exploitant, pas par nous. Le niveau « Time Sensitive » (iOS 15+) traverse Concentration sans l'entitlement `[SOURCÉ partiel]` https://documentation.onesignal.com/docs/en/ios-focus-modes-and-interruption-levels ; disponible pour le Web Push : `[SUPPOSÉ non]`. Android : canal à priorité maximale ; contourner « Ne pas déranger » demande une autorisation que l'utilisateur donne dans les réglages (`ACCESS_NOTIFICATION_POLICY`) `[SOURCÉ]` https://medium.com/@surendar1006/implementing-critical-alerts-on-android-aa49b4d75705 . **Piste produit** : au lieu de vendre une app, fournir une API et un SDK à brancher dans l'app que l'exploitant a déjà (Pathé, UGC, app du centre).

**SMS.** Fournisseurs français : OVHcloud SMS Pro, environ 0,06 € HT le SMS pour 100 unités, dégressif `[SOURCÉ]` https://ovhcloud.com/fr/sms/marketing/sms-response ; Twilio : 0,0798 $ par SMS vers la France `[SOURCÉ]` https://twilio.com/en-us/sms/pricing/fr . 3 200 SMS ≈ 190 à 260 € par envoi `[SUPPOSÉ, calcul]`. Cadre : la CNIL exige le consentement préalable pour la **prospection** par SMS, mais distingue les communications « transactionnelles » nécessaires à l'exécution d'un service `[SOURCÉ]` https://cnil.fr/fr/communication-electronique-quelles-regles ; un SMS de sécurité n'est pas de la prospection `[SUPPOSÉ]`, à faire valider. Limites : le SMS classique se congestionne quand tout le monde appelle `[SOURCÉ]` (cell broadcast page) ; délai de livraison non garanti `[SUPPOSÉ]` ; le numéro n'est connu que pour les achats en ligne ou avec carte d'abonné.

**Wi-Fi captif, QR code.** Le portail captif s'affiche à la connexion (iOS 14+ : fenêtre automatique) `[SOURCÉ]` https://github.com/hgot07/VenueInfoHandler/blob/main/OS-status.md , mais on ne peut pas pousser un message à un téléphone non connecté, et en foule le Wi-Fi sature `[SUPPOSÉ]`. QR code sur chaque siège et chaque porte : sans compte, sans app, pointe vers la page « ma consigne » (salle, rang, sortie) ; c'est le meilleur candidat « abonnement au dernier moment » à tester `[SUPPOSÉ]`.

**Écrans, sonorisation, personnel.** Hors smartphone, atteignent tout le monde et sont déjà imposés : voir section 4.

## 3. Localisation à l'intérieur, RGPD, CNIL

- **Par billet, place, salle** : la donnée est déjà connue de la billetterie ; aucune géolocalisation à collecter. C'est la solution la plus sobre et la plus fiable (pas de GPS en intérieur, qui est imprécis `[SUPPOSÉ]`). Limite : elle dit où la personne devrait être, pas où elle est. Le site contient aussi des gens sans billet.
- **Par Wi-Fi ou BLE** : précision de la zone, mais traitement de données de localisation, plus intrusif ; la CNIL demande consentement et information claire pour la géolocalisation par application `[SOURCÉ]` https://cnil.fr/fr/geolocalisation-applications-mobiles-quelles-regles (page non lue en détail : fetch en erreur, résumé de la recherche seulement). Un code de conduite approuvé par la CNIL pour le commerce existe depuis le 12 fév. 2026 (délibération 2026-013) ; non lu `[SOURCÉ titre seul]` https://cnil.fr/sites/default/files/2026-04/code_de_conduite_alliance_du_commerce.pdf .
- **Par déclaration** : la personne scanne le QR de son siège ou choisit sa salle ; pas de suivi continu, donc le moins risqué.
- **Base légale** (art. 6 du RGPD) : consentement ; ou « sauvegarde des intérêts vitaux » (art. 6.1.d) `[SOURCÉ]` https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2 . Les intérêts vitaux sont d'application étroite (urgence réelle) ; ne pas s'en servir pour justifier une collecte préalable `[SUPPOSÉ]`. Option propre : intérêt légitime ou obligation de sécurité de l'exploitant, plus une information à l'achat du billet. Avis d'un DPO ou d'un avocat nécessaire.
- **Faisable sans consentement préalable** : afficher la consigne de la place sur écrans et haut-parleurs ; utiliser les données de billetterie déjà détenues pour une finalité compatible (sécurité) `[SUPPOSÉ]`. **Pas faisable sans consentement** : suivre la position en continu, constituer des profils, réutiliser les numéros de téléphone pour du marketing.
- **Conservation** : en mode alerte, ne garder que ce qui sert à rejouer l'incident ; supprimer ou anonymiser rapidement, durée à fixer avec le DPO `[SUPPOSÉ]`.
- **Mineurs de moins de 15 ans** : la CNIL recommande le consentement d'un parent pour les traitements optionnels comme la géolocalisation `[SOURCÉ]` https://www.adequacy.app/blog/geolocalisation-enfants-securite-surveillance-rgpd (relayant la CNIL).

## 4. Fiabilité en crise, et place dans le dispositif existant

- **Couverture limitée.** En France, une étude de 2020 mesure 94 % de personnes joignables par cell broadcast ou SMS géolocalisé, contre 74 % par notification push d'application (taux d'équipement en smartphone) `[SOURCÉ]` https://ncbi.nlm.nih.gov/pmc/articles/PMC7545217 . Pour une app de lieu, le chiffre réel sera bien plus bas : seuls les abonnés comptent. Le chiffre de 74 % date de 2020 et a probablement monté `[SUPPOSÉ]`.
- **Réseau.** Hier, 21 oct. 2026, une panne de plusieurs heures du réseau mobile d'Orange et Sosh a coupé appels, SMS et données `[SOURCÉ]` https://journaldeleconomie.fr/jai-retrouve-du-signal-en-pleine-panne-orange-la-methode-meconnue-qui-force-votre-telephone-a-capter-un-reseau-de-secours . Une alerte qui dépend du réseau opérateur ou du Wi-Fi n'est pas garantie. Une foule dense sature les antennes `[SOURCÉ]` (monsmsgratuit.com, article générique). Il faut prévoir un mode dégradé (écrans, sono, personnel) et le dire.
- **Délivrabilité** : téléphone éteint, mode avion, Concentration, notifications refusées, batterie à plat ; push gratuits sans garantie de délai `[SUPPOSÉ]`. Ne jamais vendre « 100 % des personnes prévenues ».
- **Panique par message mal ciblé.** Risque réel : une consigne de sortie différente selon la place, envoyée à tort, peut envoyer des gens vers le danger ou créer un contre-flux. Règles : message court, une seule action, ton calme, pas de majuscules criardes, mêmes mots que la sono, personnes sans billet servies par les écrans, validation humaine avant envoi, envoi par zones testées en exercice. Cohérence avec les enseignements de la science des foules : voir `recherche/06-science-des-foules-et-calibrage.md`.
- **Complément, pas substitut.** Le règlement de sécurité des ERP (arrêté du 25 juin 1980) impose des équipements d'alarme classés en 4 types (art. MS 62) `[SOURCÉ]` https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000020317746 (via l'extrait de la recherche) et, selon les établissements, une sonorisation de sécurité (ECSAV) qui diffuse automatiquement les annonces d'évacuation `[SOURCÉ]` https://def-france.fr/en/ssi/mise-en-securite/systeme-de-sonorisation-de-securite-sss-et-de-confort . Notre notification ne déclenche pas l'alarme SSI, ne la remplace pas, et ne contredit jamais la sono ou le personnel formé. À écrire noir sur blanc dans la doc et dans le pitch.
- **Marché.** En Grande-Bretagne, des éditeurs vendent déjà des systèmes de notification de masse sous la loi de Martyn (Alert Cascade, POLAR, whoot) `[SOURCÉ]` https://einpresswire.com/article/813299798/the-brooks-shopping-centre-implements-alert-cascade-for-martyn-s-law-compliance , https://polar.uk.com/respond , https://whoot.me/martyns-law . La notification seule n'est pas la nouveauté ; la nouveauté est la consigne **par personne, issue de la simulation du lieu**.

## 5. Plan de démo réaliste pour aujourd'hui

**Faisable en 2 heures** (si quelqu'un du lot « sync » ou « ui » la prend ; un ticket = une étape de `demo/SCRIPT.md`) :
1. Mini PWA (3 fichiers : page, `manifest.json`, `sw.js`) avec un bouton « Activer les consignes » (geste utilisateur obligatoire sur iPhone) qui enregistre l'abonnement push et le rattache à un « billet » factice (salle 3, rang F, siège 12).
2. Un petit serveur avec la bibliothèque `web-push` : clés VAPID **générées par nous, dans `.env`**, jamais dans le dépôt ni dans le chat. Il stocke les abonnements (Postgres Aiven) et expose `POST /decision` : le moteur envoie, pour chaque personne, `{titre, sortie, chemin}`.
3. HTTPS public obligatoire pour l'iPhone (Aiven Runtime ou tunnel) `[SUPPOSÉ]` ; iPhone en iOS 16.4 ou plus, PWA ajoutée à l'écran d'accueil avant la démo.
4. Test d'avant-démo seulement avec les téléphones de l'équipe, jamais sur le public ni avec des mots d'alerte officielle. Pas de test en live non annoncé.
5. **Repli sans risque** : si iPhone ou réseau de la salle posent problème, afficher à l'écran un « téléphone simulé » qui reçoit la même consigne par WebSocket, coupe Wi-Fi comprise. Montrer les deux côte à côte : le directeur clique « évacuer », le simulateur et un vrai téléphone affichent des consignes différentes (salle 3 sortie nord, salle 5 sortie sud).

**À dire au jury comme « en vrai »** (ne pas le présenter comme déjà fait) :
- « En vrai, on ne remplace pas l'alarme : on s'ajoute à elle. Les alertes d'État (FR-Alert) restent aux préfets ; nous n'imitons pas leur format. »
- « Nous atteignons ceux qui sont abonnés : billet dans le Wallet, SMS, app de l'exploitant ou QR du siège. Les autres sont servis par les écrans et le personnel. »
- « Le billet Wallet et le SMS passent par la billetterie de l'exploitant ; nous vendons l'API, pas une nouvelle app. »
- « Chaque envoi est décidé et validé par un humain, avec mode exercice distinct (leçon Hawaii). »

## 6. Recommandation par niveau

**Démo aujourd'hui** : Web Push réel sur 1 à 4 téléphones de l'équipe + téléphone simulé en repli ; messages signés du lieu, sans vocabulaire officiel ; un seul message de repli « fin d'exercice ». Pas de SMS réel (coût, numéros), pas de Wallet (émetteur absent), pas d'app native.

**Produit à 3 mois** : (1) API et SDK à brancher sur la billetterie et l'app de l'exploitant (Wallet, push natif, éventuellement Critical Alerts demandé par lui) ; (2) SMS de repli pour les numéros connus, sur base de consentement ou de finalité sécurité validée ; (3) QR par siège et par porte ; (4) connecteurs vers écrans et sono, jamais vers la SSI ; (5) exercices mensuels qui mesurent le taux d'abonnés atteints, argument de vente ; (6) double validation, journal des envois, mode exercice séparé.

## 7. Risques juridiques et éthiques
- Être pris pour une alerte d'État (usurpation, confusion) : vocabulaire, charte et signature à contrôler par un juriste.
- Message erroné ou mal ciblé : panique, blessures, responsabilité de l'exploitant et de l'éditeur ; assurance et clauses à prévoir.
- Fausse sécurité : croire que « le téléphone a prévenu tout le monde ». Mesurer et afficher la couverture réelle.
- RGPD : localisation, numéros de téléphone, mineurs ; sous-traitance (APNs, FCM, opérateurs SMS, hors UE) à documenter.
- Inégalités : personnes sans smartphone, malvoyants, malentendants, mobilité réduite, touristes ne lisant pas le français : prévoir langues, vibrations, pictogrammes, et relais humain.
- Fatigue d'alerte : trop d'exercices poussés au public désensibilisent.
- Données sensibles dans la démo : aucune donnée réelle de visiteurs.

## 8. Huit questions à poser à un exploitant de cinéma ou de centre commercial
1. Quelle part des billets est vendue en ligne, en caisse, par carte d'abonné, et pour combien avez-vous un téléphone ou un e-mail ?
2. Qui émet le billet (vous, un prestataire de billetterie) et peut-on y ajouter un message de sécurité (Apple Wallet, Google Wallet) ?
3. Avez-vous une app, quel taux d'installation, et qui en est le propriétaire technique (comptes Apple et Google) ?
4. Quel est le dispositif d'alarme et de sonorisation de sécurité installé (type d'alarme, ECSAV), et qui peut s'y brancher ou non ?
5. Qui décide d'évacuer, et qui peut valider un envoi vers les clients (une ou deux personnes ; quel délai accepté) ?
6. Que disent aujourd'hui vos consignes aux clients (affichage, annonces), et quelles langues ?
7. Que dit votre DPO sur l'usage des données de billetterie ou de numéros de téléphone pour la sécurité, et quelle durée de conservation ?
8. Que s'est-il passé lors de l'évacuation du 19 oct. au Forum (ce qui a manqué pour prévenir les gens, qui a été informé, comment) ?

## Points à vérifier avant de citer
Articles exacts du code de la sécurité intérieure et du code pénal ; que le pass Wallet de Pathé/UGC porte salle et siège ; disponibilité du niveau « Time Sensitive » en Web Push ; contenu complet de la page CNIL sur la géolocalisation (non récupérée) ; tarif SMS négocié ; fonctionnement de l'entitlement Critical Alerts pour un opérateur de lieu (demande Apple écrite).
