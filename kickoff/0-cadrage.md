# 0. Cadrage (21 oct. 2026, soir)

**Brief officiel** (mail participants) : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. You choose the customer and the problem. Use any models, frameworks and tools you like. Deploy your app to our sponsor Aiven's Runtime, and use their managed data infrastructure for your data layer where relevant (PostgreSQL, ClickHouse, Valkey, OpenSearch and more). Strong teams need more than code. Product thinking, design and a credible route to first users all count. »

**Format** : 7 h de code (9h–16h), 8 équipes pitchent à 16h, résultats 17h. Critères Paris non publiés ; proxy Amsterdam : valeur utilisateur, potentiel d'entreprise, avantage mesurable, exécution technique, clarté de la démo, design responsable. Profil visé : « technical builders with founder intent ».

**Ambition** : b) système « wow » (Adem). Une démo qui enchaîne plusieurs briques et montre un agent faire quelque chose d'impossible sans la donnée.

**Équipe** : 4 builders IA et business. Crédits : Anthropic, OpenAI, Vercel AI Gateway, Modal, ElevenLabs, Lovable, Supabase, n8n, Lightdash, Miro.

**Avantage injuste** : aucun terrain imposé. Adem veut du neuf.

## Carte de rejet (chaque agent et chaque critique jugent contre elle)
1. Hors brief : l'agent n'a pas besoin de la donnée (si on retire la base, ça marche encore → perdu). Même test pour l'IA : si on retire l'agent et qu'une requête SQL suffit → perdu.
2. Déjà fait : un produit connu le fait déjà (nommer lequel).
3. Irréalisable en 7 h, ou dépend d'une donnée qu'on ne peut pas obtenir demain matin (API fermée, contrat, scraping lourd).
4. Pas d'effet wow : rien qu'un jury ne retienne au bout de 40 démos.
5. Incompréhensible en 4 lignes par quelqu'un qui ne connaît pas le sujet.
6. Pas d'utilisateur nommable : on ne sait pas qui appeler demain soir pour lui montrer.
7. Interdits d'office : chatbot, dashboard, « plateforme qui aide X », assistant généraliste, extension qui alerte, garde-fou d'agents IA.
8. Interdits propres à ce hack : outil pour développeurs ou pour agents IA (le sujet le plus typique d'un hack d'agents) ; « chat avec tes données » ; RAG sur documents d'entreprise ; agent personnel (mémoire, santé, podcasts).

## Filtres ajoutés par Adem (21 oct., soir, après la salve 2)
9. **Réalisable demain sans rien installer** : la donnée existe déjà et s'obtient par API ou fichier à 9h. Pas de caméra à poser, pas de capteur, pas de tournage par l'équipe, pas de flotte jouée par nous.
10. **Effet wow réel** : un moment de la démo que le jury raconte le soir même (échelle, vitesse, ou une pièce qu'un humain met des semaines à produire, faite devant lui).
11. **Commercialisable à l'échelle d'un fonds** : Accel investit. Il faut un client qui paie déjà ce travail (un salaire, un prestataire, une ligne de budget), un prix, un nombre de clients en Europe, et une donnée qui s'accumule et rend la copie difficile.

## Critères officiels du jury Paris (donnés par Adem, 22 oct., remplacent le proxy Amsterdam)
1. **Problème client et valeur produit** : vrai problème pour un utilisateur clair ; l'adopterait-il ?
2. **Capacité de l'agent** : comportement avancé (raisonnement en plusieurs étapes, autonomie, travail d'équipe, apprentissage), au-delà d'un simple appel.
3. **La donnée au cœur** : le produit dépend-il de la donnée bien utilisée (fraîcheur, échelle, ancrage dans des sources, mémoire), ou n'est-elle qu'un décor ?
4. **Preuve que ça marche** : un résultat mesurable (précision, coût, latence, taux de succès, temps gagné).
5. **Exécution et pitch** : démo soignée et compréhensible, différence nette, route crédible vers les premiers utilisateurs.

## Livrables à rendre
- Nom du projet et pitch en une ligne ; URL hébergée.
- Démo de 3 minutes en MP4.
- La couche de données en action : fichier TXT.
- Comparatifs avant / après (benchmarks) : fichiers.
- Une slide de pitch : lien.
