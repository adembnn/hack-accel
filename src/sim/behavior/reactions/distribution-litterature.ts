// Répartition des réactions par situation, source « littérature ». Chaque fréquence est reliée à une source des rapports du
// dépôt ([lu] = chiffre lu dans la source) ou étiquetée « hypothèse » (réglage à balayer, aucune mesure). Les fréquences d'une
// situation sont normalisées au tirage (leur somme n'a pas besoin de faire exactement 1).
// Choix de fond (instantane-4 §5 : « ne pas coder de panique aveugle ») : la fuite précipitée et la bousculade sont RARES,
// l'entraide est FRÉQUENTE, la recherche d'information retarde le départ de beaucoup de gens.
// Modèle simplifié, non certifié.

export type Frequences = Readonly<Record<string, number>>;

/** Situations jouées par le moteur (mêmes noms que distribution-llm.json). */
export const SITUATIONS_FOULE = ['annonce_sans_menace', 'message_clair', 'agent_qui_guide', 'rumeur', 'issue_bloquee', 'file_longue', 'voisin_qui_tombe'] as const;
export type SituationFoule = (typeof SITUATIONS_FOULE)[number];

export const DISTRIBUTION_LITTERATURE: Readonly<Record<SituationFoule, Frequences>> = {
  // Alarme ou annonce seule, sans menace visible : 48,8 % de retard avec alarme seule contre 28,2 % avec explication
  // (126 vidéos d'incidents réels, PMC10620751, [lu], maths-3 §4.3) -> beaucoup cherchent d'abord l'information.
  annonce_sans_menace: {
    s_informer: 0.4, // hypothèse, ordre de grandeur des 48,8 % de retard [lu]
    suivre_consigne: 0.3, // hypothèse
    finir_son_activite: 0.1, // hypothèse
    revenir_chercher_quelqu_un: 0.08, // hypothèse : 65 % cherchent à évacuer avec d'autres [lu, maths-3 §1.5], dont une minorité retourne les chercher
    suivre_la_foule: 0.07, // hypothèse
    propager_une_info: 0.03, // hypothèse
    se_figer: 0.01, // hypothèse (panique de masse rare)
    fuite_precipitee: 0.01, // hypothèse (panique de masse rare)
  },
  // Message clair : 77 % voient un panneau dynamique et 100 % de ceux qui le voient le suivent (Galea 2014, [lu] résumé, maths-3 §4.4).
  message_clair: {
    suivre_consigne: 0.77, // [lu] Galea 2014
    s_informer: 0.1, // hypothèse
    choisir_seul: 0.05, // hypothèse
    suivre_la_foule: 0.04, // hypothèse
    donner_un_ordre: 0.02, // hypothèse
    aider: 0.02, // hypothèse
  },
  // Agent qui guide : environ 90 % choisissent la porte indiquée (VR métro, Fire Technology 2025, [lu], maths-3 §4.4).
  agent_qui_guide: {
    suivre_consigne: 0.9, // [lu] Fire Technology 2025
    s_informer: 0.04, // hypothèse
    choisir_seul: 0.03, // hypothèse
    suivre_la_foule: 0.02, // hypothèse
    aider: 0.01, // hypothèse
  },
  // Rumeur, sans source officielle : hypothèse (aucun chiffre trouvé, rapport 4 §5).
  rumeur: {
    s_informer: 0.5, // hypothèse
    propager_une_info: 0.15, // hypothèse
    suivre_la_foule: 0.1, // hypothèse
    finir_son_activite: 0.1, // hypothèse
    rester_a_l_abri: 0.05, // hypothèse
    se_figer: 0.04, // hypothèse (rare)
    fuite_precipitee: 0.03, // hypothèse (rare)
    donner_un_ordre: 0.03, // hypothèse
  },
  // Issue trouvée fermée : on repart par la porte familière (affiliation, Sime 1985, [lu] via instantane-4 §2 : +0,795), on suit
  // les autres (suivisme +0,076 par personne, [lu]) ; durée d'hésitation introuvable (maths-3 §3).
  issue_bloquee: {
    s_informer: 0.35, // hypothèse
    choisir_seul: 0.25, // hypothèse, soutenue par la porte familière [lu] Sime 1985
    suivre_la_foule: 0.2, // hypothèse, soutenue par le suivisme [lu] arXiv 2110.11577
    aider: 0.06, // hypothèse
    donner_un_ordre: 0.05, // hypothèse
    bousculer: 0.04, // hypothèse (rare)
    fuite_precipitee: 0.03, // hypothèse (rare)
    propager_une_info: 0.02, // hypothèse
  },
  // File longue (attente > 2 min) : hypothèse ; le suivisme et la porte connue pèsent [lu], la bousculade reste rare.
  file_longue: {
    s_informer: 0.2, // hypothèse
    suivre_la_foule: 0.25, // hypothèse
    choisir_seul: 0.2, // hypothèse
    aider: 0.1, // hypothèse
    suivre_consigne: 0.08, // hypothèse
    rester_a_l_abri: 0.04, // hypothèse
    donner_un_ordre: 0.04, // hypothèse
    propager_une_info: 0.04, // hypothèse
    bousculer: 0.03, // hypothèse (rare)
    fuite_precipitee: 0.02, // hypothèse (rare)
  },
  // Voisin qui tombe : l'entraide domine (hypothèse ; von Krüchten 2017 [lu] pour la vitesse d'un comportement coopératif, maths-3 §1.4).
  voisin_qui_tombe: {
    aider: 0.7, // hypothèse
    s_informer: 0.15, // hypothèse
    donner_un_ordre: 0.07, // hypothèse
    se_figer: 0.05, // hypothèse
    fuite_precipitee: 0.03, // hypothèse (rare)
  },
};

/**
 * Meneurs de la source « littérature » : personnes qui prennent la parole ou l'initiative. HYPOTHÈSE entière (aucune mesure
 * trouvée dans les rapports du dépôt) ; sert à regarder ce que 20 meneurs changent à la foule.
 */
export const MENEUR_LITTERATURE: Frequences = {
  donner_un_ordre: 0.4,
  propager_une_info: 0.2,
  suivre_consigne: 0.2,
  aider: 0.15,
  suivre_la_foule: 0.05,
};
