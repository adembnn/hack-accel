---
name: creatif-anti-slop
description: "À utiliser pour tout brainstorm, idéation, nom de produit, pitch, texte ou design d'interface : force des sorties originales et élimine les clichés d'IA."
---

# Créatif, pas générique

Tu as tendance à converger vers la réponse la plus typique (effondrement de mode). Cinq agents qui reçoivent la même demande donnent cinq fois la même idée : une convergence n'est pas un signal fort. Ce skill t'oblige à sortir de ce mode.

## Avant de produire
1. Vérifie que tu connais le terrain : critères réels (jury, client, utilisateur), ce que l'existant fait déjà, références de goût d'Adem. S'il en manque, pose les questions une par une avant de générer. Sans terrain, toute divergence ne produit que des variantes de la moyenne.
2. Demande ou rappelle 2 à 3 références concrètes qu'Adem aime (sites, jeux, affiches, auteurs) et ce qu'il aime dans chacune.

## Idéation
1. **Échantillonnage verbalisé.** Pour chaque idée, donne la probabilité (0 à 100 %) qu'un autre LLM la propose. Produis au moins 30 idées, dont au moins 10 sous 10 %. Garde surtout celles sous 20 %.
2. **Angles séparés.** Varie au moins entre : contrainte forcée, inversion (point de vue de l'attaquant, du concurrent, de l'utilisateur qui abandonne), avantage injuste d'Adem, regard d'expert du domaine, transfert d'une mécanique d'un autre domaine. Si tu peux lancer des sous-agents, un angle par sous-agent, en contexte neuf.
3. **Une seule longue liste par session**, pour voir et éviter tes propres répétitions.
4. **Test de l'IA décorative** : si on retire l'IA et que l'idée marche encore, dis-le.
5. **Converger avec un critique neuf** qui n'a vu que les critères réels et la liste : il note originalité vs existant, faisabilité, effet en démo, adéquation aux critères, et tue explicitement le reste. Garde 3 idées.
6. **Recommencer plutôt qu'itérer** : pour chaque idée gardée, 3 premiers jets indépendants. Ne retravaille pas un seul jet en boucle.

## Interdits par défaut (à adapter au sujet)
- Idées : chatbot IA, dashboard, « plateforme qui aide X », assistant généraliste, extension qui alerte, garde-fou d'agents IA.
- Texte : « ce n'est pas X, c'est Y », triplets réflexes, « un moment charnière », ton promotionnel (« révolutionnaire », « booste »), « il est important de noter », résumés « en conclusion », accroches dramatiques, tirets cadratins en rafale, emojis dans les titres. Quand tu retires un tic, reformule la phrase : ne le remplace jamais par un autre signe (exemple raté : « · » à la place du tiret).
- Design : Inter, Roboto, Space Grotesk, dégradé violet vers bleu, hero centré à deux boutons, cartes arrondies identiques, grille de fonctionnalités en trois colonnes, emojis comme icônes, micro-animations partout.
- Code : commentaires qui répètent le code, catch qui ne font que logger, abstractions utilisées une fois, tests qui recopient l'implémentation.
Interdire ne suffit pas : donne toujours une cible positive précise (une police, deux couleurs, une seule audace).

## Avant de rendre
- Passe ta production contre les interdits ci-dessus et réécris ce qui tombe dedans.
- Pour un texte, demande-toi quelles « améliorations » un ChatGPT proposerait, puis fais l'inverse.
- Ne présente jamais une note de jury simulé comme une validation : seul un humain réel valide.
