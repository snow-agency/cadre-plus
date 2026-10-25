// Contenu du cahier des charges. Mise en page : build.mjs. Régénérer : npm run build (dans ce dossier).
// Syntaxe des textes : **gras**.

export const meta = {
  titre: "Cahier des charges",
  nom: "Cadre+",
  sousTitre: "Plateforme de jumeau numérique territorial pour le cadre de vie au Bénin",
  version: "Version 1.0 — projet pour discussion",
  date: "25 octobre 2026",
  statut: "Document de travail. Les chiffres présentés par l'application sont des données synthétiques de démonstration.",
  auteur: "Porteur du projet (ingénieur géotechnicien et développeur)",
};

const EXIG = ["ID", "Exigence", "Priorité", "État"];
const EXIG_W = [9, 60, 14, 17];

export const blocs = [
  // ---------------------------------------------------------------- 1
  { t: "h1", text: "1. Contexte et enjeux" },
  { t: "p", text: "**Cadre+ est une plateforme d'aide à la décision qui permet à l'État béninois de diagnostiquer, simuler et arbitrer ses investissements en cadre de vie avant de construire.**" },
  { t: "p", text: "Le Ministère du Cadre de Vie fait face à un possible doublement de la population béninoise dans les prochaines années, à de fortes inégalités d'un territoire à l'autre et à des budgets contraints. Les décisions s'appuient aujourd'hui sur des données dispersées et des outils séparés. Cadre+ réunit l'ensemble sur une base géographique commune : un « jumeau numérique » du territoire, sur lequel on teste une décision avant de l'exécuter." },
  { t: "p", text: "Le projet est une proposition spontanée : aucun cahier des charges n'a été imposé par le ministère. Le présent document en tient lieu et sert de base de discussion avec lui." },
  { t: "p", text: "Chacun des sept défis du ministère trouve sa réponse dans un module dédié :" },
  {
    t: "table", head: ["#", "Défi du ministère", "Module Cadre+"], widths: [6, 52, 42],
    rows: [
      ["1", "Anticiper le doublement de la population", "Prospective 2050"],
      ["2", "Garantir un accès équitable à un bon cadre de vie", "Indice de Cadre de Vie (ICV) et carte des inégalités"],
      ["3", "Optimiser les coûts de mise en place du cadre de vie", "Arbitrage des investissements"],
      ["4", "Organiser la transition des zones précaires vers des zones structurées", "Transition des quartiers"],
      ["5", "Aménager en conservant les espaces naturels, gérer les déchets", "Conception assistée"],
      ["6", "Mobilité, connectivité entre villes, transport multimodal", "Mobilité multimodale"],
      ["7", "Climat, au sens large (pas seulement l'environnement)", "Résilience et climat"],
    ],
  },
  { t: "p", text: "Une application citoyenne relie l'ensemble : la population signale les problèmes et devient un capteur du territoire." },

  // ---------------------------------------------------------------- 2
  { t: "h1", text: "2. Objectifs et périmètre" },
  { t: "p", text: "**L'objectif général est de rendre les arbitrages de cadre de vie visibles, comparables et vérifiables, tout en laissant la décision à l'humain.**" },
  { t: "h2", text: "2.1 Objectifs" },
  {
    t: "table", head: ["Réf.", "Objectif", "Défi(s) traité(s)"], widths: [9, 69, 22],
    rows: [
      ["O1", "Mesurer les inégalités de cadre de vie par un indice objectif, mis à jour, et les cartographier.", "2"],
      ["O2", "Proposer et vérifier un aménagement de parcelle : constructibilité, emplacement du bâtiment, point de collecte des déchets, préservation des espaces naturels, coût estimé.", "3, 5"],
      ["O3", "Répartir un budget entre quartiers de façon optimisée et transparente, avec un réglage explicite entre efficacité et équité.", "2, 3"],
      ["O4", "Anticiper la croissance de la population, les risques climatiques et les besoins de mobilité.", "1, 6, 7"],
      ["O5", "Accompagner la transformation des quartiers précaires sans en chasser les habitants.", "4"],
      ["O6", "Associer la population par un canal de signalement accessible, y compris en connexion faible.", "2, 7"],
    ],
  },
  { t: "h2", text: "2.2 Périmètre de la phase 1 (pilote)" },
  {
    t: "ul", items: [
      "Une **commune pilote** (Abomey-Calavi est proposée à titre d'exemple ; le choix reste à confirmer avec le ministère).",
      "Modules : ICV, Conception assistée, Arbitrage des investissements, Assistant IA, application citoyenne de signalement.",
      "Remplacement des données synthétiques par des données réelles, hébergées sur une base PostgreSQL / PostGIS.",
      "Comptes utilisateurs et rôles, journal d'audit des décisions, barèmes de coûts réels.",
      "Formation des agents et évaluation du pilote sur des indicateurs mesurés.",
    ],
  },
  { t: "h2", text: "2.3 Hors périmètre" },
  {
    t: "ul", items: [
      "Le remplacement d'une étude géotechnique, d'un bureau de contrôle ou de l'avis d'un ingénieur responsable.",
      "La délivrance de permis de construire et la gestion officielle du cadastre.",
      "Toute décision prise automatiquement : l'outil propose et vérifie, un responsable valide.",
      "Le déploiement national et la mobilité interurbaine (phases 2 et 3).",
    ],
  },

  // ---------------------------------------------------------------- 3
  { t: "h1", text: "3. Parties prenantes et utilisateurs" },
  { t: "p", text: "**Les utilisateurs principaux sont les décideurs et les techniciens du ministère et de la commune pilote ; les citoyens y contribuent par signalements.**" },
  {
    t: "table", head: ["Partie prenante", "Intérêt", "Usage de Cadre+"], widths: [26, 34, 40],
    rows: [
      ["Ministre, directeurs", "Arbitrer et justifier les investissements", "Cartes, arbitrage des investissements, avis de l'IA, rapports"],
      ["Direction technique du ministère (urbanistes, ingénieurs)", "Concevoir et valider les aménagements", "Conception assistée, mode manuel, comparaison à l'optimum"],
      ["Mairies, services techniques (commune pilote)", "Exécuter, fournir les données locales", "ICV de la commune, signalements, aménagements"],
      ["Bureaux d'études, ingénieurs-conseils", "Étudier et contrôler", "Évaluation des propositions ; responsabilité finale d'implantation"],
      ["Citoyens", "Signaler un problème, connaître leur quartier", "Application citoyenne (web léger, puis WhatsApp / USSD)"],
      ["Partenaires de données (ANDF, INStaD, gestionnaires de réseaux et de déchets, opérateurs mobiles)", "Cadre de partage clair, usage maîtrisé", "Fournissent les données ; conventions à signer"],
      ["Bailleurs et partenaires techniques (à identifier)", "Projets d'aménagement cohérents et justifiés", "Financement, extension, exigences de pré-validation"],
      ["Porteur du projet, équipe technique", "Construire, maintenir, former", "Administration, évolutions, support"],
    ],
  },

  // ---------------------------------------------------------------- 4
  { t: "h1", text: "4. Principes de conception" },
  { t: "p", text: "**Six principes guident tous les choix, des écrans aux algorithmes.**" },
  {
    t: "ol", items: [
      "**L'humain décide ; l'optimiseur et l'IA proposent.** Chaque module offre le calcul automatique et la modification manuelle, avec vérification des contraintes en direct et comparaison à l'optimum. L'IA relit et conseille, elle ne décide jamais.",
      "**Transparence.** Les formules (ICV, constructibilité, coûts) sont visibles et documentées ; il n'y a pas de boîte noire sur les scores. Les hypothèses de coût sont affichées avec les résultats.",
      "**Données étiquetées.** Toute donnée synthétique est signalée à l'écran (bandeau permanent, fenêtres d'information, réponses de l'IA). Elle n'est jamais présentée comme officielle.",
      "**Aide intégrée.** Chaque fonction a son petit « ? » explicatif et l'application dispose d'un mode d'emploi complet, mis à jour à chaque évolution.",
      "**Le ministère garde la main** sur les données et sur la décision finale ; les données restent exportables dans des formats ouverts.",
      "**Sobriété et ouverture.** Briques libres, interfaces légères, fonctionnement en connexion faible pour le volet citoyen, interface en français.",
    ],
  },

  // ---------------------------------------------------------------- 5
  { t: "h1", text: "5. Exigences fonctionnelles" },
  { t: "p", text: "**Les exigences sont regroupées par module ; l'état indique ce qui existe déjà dans la démonstration.** Priorités : essentielle, importante, souhaitable. « Fait » signifie opérationnel sur données synthétiques." },

  { t: "h2", text: "5.1 Indice de Cadre de Vie (ICV) et carte des inégalités" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["ICV-1", "Calculer, pour chaque quartier, une note de 0 à 100 à partir de huit critères pondérés : accès à l'école, à la santé, à l'eau, électrification, drainage, collecte des déchets, espaces verts, risque d'inondation.", "Essentielle", "Fait"],
      ["ICV-2", "Afficher la carte colorée (rouge à vert) ; au clic, le nom, la note et la population du quartier.", "Essentielle", "Fait"],
      ["ICV-3", "Définir les poids et les conversions en un seul endroit, modifiable et documenté.", "Essentielle", "Fait"],
      ["ICV-4", "Importer les données réelles (recensement, réseaux, cadastre) pour remplacer les valeurs synthétiques.", "Essentielle", "À faire"],
      ["ICV-5", "Justifier chaque critère et chaque poids dans une note méthodologique validée par un comité technique ; tester la sensibilité de l'indice aux poids.", "Essentielle", "À faire"],
      ["ICV-6", "Utiliser les contours administratifs réels des quartiers.", "Importante", "À faire"],
      ["ICV-7", "Suivre l'évolution de l'ICV dans le temps et comparer deux dates.", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.2 Conception assistée" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["CA-1", "Calculer un indice de constructibilité de 0 à 100 (portance du sol 50 %, risque d'inondation 40 %, pente 10 %) avec un verdict : prioritaire (75 et plus), sous conditions (40 à 75), déconseillé (moins de 40).", "Essentielle", "Fait"],
      ["CA-2", "Proposer automatiquement l'emplacement et la taille du bâtiment, au plus près de la voie d'accès, en respectant : retrait de 3 m aux limites, 5 m à la voie, bande tampon de 10 m le long des zones naturelles, 3 m au bâti existant, plafond d'emprise de 40 % ou 25 % selon l'indice.", "Essentielle", "Fait"],
      ["CA-3", "Placer le point de collecte des déchets côté voie, à plus de 3 m du bâtiment et hors bande tampon.", "Essentielle", "Fait"],
      ["CA-4", "Pour une parcelle déconseillée, proposer un bassin de rétention (avec son volume) et un tampon écologique plutôt qu'une construction.", "Importante", "Fait"],
      ["CA-5", "Estimer le coût : fondations selon la portance, drainage périphérique si le risque d'inondation n'est pas faible.", "Essentielle", "Fait"],
      ["CA-6", "Mode manuel : déplacer à la souris ou au clavier, redimensionner, pivoter le bâtiment ; déplacer le point de collecte ; vérification des contraintes en direct (erreurs et avertissements) ; comparaison coût et distance avec l'optimum.", "Essentielle", "Fait"],
      ["CA-7", "Avis d'ingénieur-conseil rédigé par l'IA sur l'aménagement manuel : verdict, corrections chiffrées, points de vigilance.", "Importante", "Fait"],
      ["CA-8", "Importer une parcelle réelle (polygone cadastral, relevé topographique, essais géotechniques) et gérer des formes quelconques.", "Essentielle", "À faire"],
      ["CA-9", "Gérer plusieurs bâtiments, la voirie interne et les réseaux sur une même parcelle ou un lotissement.", "Importante", "À faire"],
      ["CA-10", "Remplacer les barèmes de coûts synthétiques par des prix réels, mis à jour.", "Essentielle", "À faire"],
      ["CA-11", "Exporter le plan d'aménagement (PDF, GeoJSON, DXF).", "Importante", "À faire"],
      ["CA-12", "Optimisation multicritère (coût, accessibilité, ensoleillement, ventilation, espaces verts).", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.3 Arbitrage des investissements" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["AI-1", "Modéliser sept leviers (drainage, électrification, eau, déchets, écoles, santé, espaces verts), chacun améliorant un sous-score d'au plus 25 points, avec rendements décroissants ; le drainage réduit aussi le risque d'inondation.", "Essentielle", "Fait"],
      ["AI-2", "Choisir, par optimisation exacte, l'ensemble de leviers de chaque quartier qui maximise la valeur du plan sous contrainte de budget.", "Essentielle", "Fait"],
      ["AI-3", "Offrir un curseur d'équité entre efficacité pure (0) et priorité forte aux quartiers défavorisés (1).", "Essentielle", "Fait"],
      ["AI-4", "Appliquer une remise de coordination (12 %) quand au moins deux réseaux sont réalisés ensemble dans un quartier.", "Importante", "Fait"],
      ["AI-5", "Trois modes : automatique, mixte (l'utilisateur impose certains quartiers, l'optimiseur complète), manuel ; afficher l'écart avec l'optimum et avec une stratégie naïve.", "Essentielle", "Fait"],
      ["AI-6", "Avis de l'IA sur un plan : forces, faiblesses, équité, ajustements, risques.", "Importante", "Fait"],
      ["AI-7", "Remplacer les coûts unitaires synthétiques par des coûts réels.", "Essentielle", "À faire"],
      ["AI-8", "Phasage pluriannuel des investissements et calendrier de chantiers.", "Importante", "À faire"],
      ["AI-9", "Enregistrer, comparer et exporter des scénarios.", "Importante", "À faire"],
      ["AI-10", "Maintenance prédictive : repérer les ouvrages qui se dégradent avant rupture.", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.4 Prospective 2050" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["PR-1", "Projeter la population par commune et quartier selon trois scénarios (bas, central, haut) à partir des recensements.", "Essentielle", "À faire"],
      ["PR-2", "Mesurer l'étalement urbain des vingt dernières années sur imagerie satellite.", "Importante", "À faire"],
      ["PR-3", "Calculer les besoins induits à chaque horizon : logements, écoles, centres de santé, eau, énergie.", "Essentielle", "À faire"],
      ["PR-4", "Identifier le foncier à réserver et les voies à tracer avant l'occupation spontanée.", "Importante", "À faire"],
    ],
  },

  { t: "h2", text: "5.5 Résilience et climat" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["RC-1", "Cartographier les îlots de chaleur.", "Importante", "À faire"],
      ["RC-2", "Simuler les inondations selon des scénarios de pluie et alerter les quartiers exposés.", "Essentielle", "À faire"],
      ["RC-3", "Calculer le bilan carbone de chaque scénario d'aménagement.", "Importante", "À faire"],
      ["RC-4", "Évaluer la vulnérabilité des ménages : sécurité alimentaire, santé liée à la chaleur et aux inondations.", "Importante", "À faire"],
      ["RC-5", "Encourager les comportements écologiques par des éco-points (tri des déchets, transports collectifs, signalement de dépôts sauvages).", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.6 Mobilité multimodale" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["MO-1", "Reconstituer les déplacements à partir de données mobiles anonymisées et de traces GPS (zémidjans, taxis).", "Importante", "À faire"],
      ["MO-2", "Simuler de nouvelles liaisons : bus interurbains, couloirs dédiés, transport lagunaire (par exemple Cotonou – Porto-Novo), rail, pistes cyclables, pôles d'échange.", "Importante", "À faire"],
      ["MO-3", "Proposer au citoyen un calculateur d'itinéraire multimodal (bus, barque, moto, marche) avec prix et horaires.", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.7 Transition des quartiers" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["TQ-1", "Établir un diagnostic par zone : bâti, foncier, réseaux, risques.", "Essentielle", "À faire"],
      ["TQ-2", "Comparer des scénarios (restructuration sur place, densification maîtrisée, relogement partiel) : coût, durée, nombre de ménages touchés.", "Essentielle", "À faire"],
      ["TQ-3", "Prévoir un volet participatif : les habitants voient les plans et donnent leur avis.", "Importante", "À faire"],
      ["TQ-4", "Articuler avec la régularisation foncière pour éviter que la hausse des prix n'écarte les habitants.", "Importante", "À faire"],
      ["TQ-5", "Suivre l'avancement de la transformation, phase par phase.", "Importante", "À faire"],
    ],
  },

  { t: "h2", text: "5.8 Application citoyenne" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["AC-1", "Signaler un problème (dépôt d'ordures, caniveau bouché, inondation) avec localisation et photo.", "Essentielle", "À faire"],
      ["AC-2", "Consulter l'ICV de son quartier et les projets prévus.", "Importante", "À faire"],
      ["AC-3", "Classer et prioriser automatiquement les signalements (IA, traitement du langage).", "Importante", "À faire"],
      ["AC-4", "Fonctionner en connexion faible (web léger, saisie hors ligne puis synchronisation), puis par WhatsApp et USSD, avec messages vocaux en fon, yoruba, dendi et autres langues.", "Essentielle", "À faire"],
      ["AC-5", "Participer à des consultations publiques.", "Souhaitable", "À faire"],
    ],
  },

  { t: "h2", text: "5.9 Assistant IA" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["IA-1", "Répondre en français à des questions libres, uniquement à partir des données de l'application, en rappelant leur caractère synthétique.", "Importante", "Fait"],
      ["IA-2", "Rédiger un avis d'ingénieur-conseil sur un aménagement ou un plan d'investissement.", "Importante", "Fait"],
      ["IA-3", "Générer une note de synthèse par quartier ou par scénario, exportable.", "Importante", "À faire"],
    ],
  },

  { t: "h2", text: "5.10 Fonctions transverses" },
  {
    t: "table", head: EXIG, widths: EXIG_W, rows: [
      ["PL-1", "Authentification et rôles (administrateur, ministère, mairie, lecture seule).", "Essentielle", "À faire"],
      ["PL-2", "Journal d'audit : qui a décidé quoi, quand, avec quelle version des données.", "Essentielle", "À faire"],
      ["PL-3", "Enregistrement, partage et comparaison de scénarios.", "Importante", "À faire"],
      ["PL-4", "Aide contextuelle (« ? ») sur chaque fonction et mode d'emploi complet dans l'application.", "Importante", "Fait"],
      ["PL-5", "Export des cartes et rapports (PDF, Word) et des données (GeoJSON, CSV).", "Importante", "À faire"],
      ["PL-6", "Bandeau et mentions permanentes signalant les données synthétiques.", "Essentielle", "Fait"],
    ],
  },

  // ---------------------------------------------------------------- 6
  { t: "h1", text: "6. Intelligence artificielle" },
  { t: "p", text: "**L'IA sert à expliquer, relire et trier ; elle ne calcule pas les scores et ne décide jamais.** Les scores (ICV, constructibilité) et les optimisations reposent sur des formules et des algorithmes déterministes, vérifiables et testés." },
  {
    t: "table", head: ["Usage", "Description", "État"], widths: [28, 56, 16],
    rows: [
      ["Assistant conversationnel", "Questions en français sur les quartiers, parcelles et plans ; réponses limitées aux données de l'application.", "Fait"],
      ["Avis sur un aménagement", "Relecture d'un aménagement manuel à partir de son évaluation calculée.", "Fait"],
      ["Avis sur un plan d'investissement", "Lecture critique : équité, risques, ajustements.", "Fait"],
      ["Notes de synthèse", "Rédaction de rapports par quartier ou scénario, avec les chiffres réels.", "À faire"],
      ["Classement des signalements", "Catégorisation et priorisation des signalements citoyens en texte libre.", "À faire"],
      ["Détection du bâti et de l'occupation du sol", "Vision par ordinateur sur imagerie satellite pour alimenter les données.", "À faire"],
      ["Optimisation spatiale avancée", "Placement de plusieurs bâtiments, formes libres, voirie interne.", "À faire"],
      ["Prévisions", "Démographie, inondations : modèles statistiques ou d'apprentissage.", "À faire"],
    ],
  },
  { t: "h2", text: "6.1 Garde-fous" },
  {
    t: "ul", items: [
      "L'IA n'écrit dans aucune donnée et ne déclenche aucune décision ; elle ne reçoit que des évaluations déjà calculées.",
      "Chaque réponse rappelle que les données sont synthétiques tant qu'elles le sont ; le format est du texte brut, court.",
      "Aucune donnée personnelle ne doit lui être envoyée ; le fournisseur étant externe, ses conditions d'utilisation et sa politique de conservation doivent être vérifiées avant toute donnée réelle ou sensible.",
      "L'appel au fournisseur est isolé dans un module unique : changer de fournisseur ne touche pas au reste. Sans IA, l'application continue de fonctionner (message d'erreur explicite).",
      "À mettre en place en phase 1 : journalisation des requêtes IA, jeu de questions de test pour mesurer la qualité des réponses, limitation du débit.",
    ],
  },
  { t: "p", text: "Fournisseur actuel : RodiumAI, passerelle compatible avec le format OpenAI, donnant accès à un modèle Claude. Ce choix est configurable (variables d'environnement) et n'engage pas la suite." },

  // ---------------------------------------------------------------- 7
  { t: "h1", text: "7. Données" },
  { t: "p", text: "**Tant qu'aucune convention de données n'est signée, Cadre+ fonctionne sur des données synthétiques réalistes, toujours étiquetées comme telles.** Cette décision évite qu'une erreur sur des données officielles incomplètes ne ruine la crédibilité d'une démonstration." },
  {
    t: "table", head: ["Source", "Contenu", "Usage", "Statut"], widths: [24, 28, 28, 20],
    rows: [
      ["Données synthétiques (dossier data/)", "8 quartiers d'Abomey-Calavi, 3 parcelles fictives à Togba", "Démonstration, tests", "En place"],
      ["OpenStreetMap", "Fond de carte, routes", "Contexte cartographique", "En place (fond de carte)"],
      ["ANDF (cadastre)", "Parcelles, droits fonciers", "Conception assistée, transition des quartiers", "À négocier"],
      ["INStaD (recensements)", "Population, ménages, projections", "ICV, prospective, arbitrage", "À négocier"],
      ["Gestionnaires de réseaux, déchets, mairies", "Tracés et état des réseaux, collecte", "ICV, arbitrage", "À négocier"],
      ["Essais géotechniques, topographie", "Portance, pente, nappe", "Conception assistée", "À collecter"],
      ["Imagerie Sentinel-2, WorldPop, Open Buildings", "Occupation du sol, bâti, population", "Prospective, détection du bâti", "À intégrer"],
      ["Opérateurs mobiles (données anonymisées)", "Déplacements", "Mobilité", "À négocier"],
      ["Signalements citoyens", "Texte, photo, position", "ICV, priorisation", "Via l'application citoyenne"],
    ],
  },
  { t: "h2", text: "7.1 Règles de gouvernance des données" },
  {
    t: "ul", items: [
      "Le ministère reste propriétaire de ses données ; une convention précise l'usage, la durée, l'anonymisation et la restitution.",
      "Chaque jeu de données porte sa source, sa date et sa version ; le journal d'audit relie chaque décision à la version utilisée.",
      "Les données réelles remplacent les synthétiques sans changer le schéma consommé par l'application : un seul module d'accès aux données est à réécrire.",
      "Un contrôle de qualité (complétude, cohérence, valeurs aberrantes) précède toute publication d'un indice à partir de données réelles.",
      "Hébergement cible : PostgreSQL avec extension PostGIS, sur Neon. Ce service étant hébergé hors du Bénin, la question de la souveraineté des données réelles doit être tranchée avant leur chargement (section 10).",
    ],
  },
  {
    t: "p", text: "**Plan d'accès :** obtenir d'abord de la commune pilote un jeu de données limité (quelques quartiers et parcelles réels) pour valider la chaîne de bout en bout ; formaliser ensuite les conventions avec l'ANDF et l'INStaD. En l'absence de réponse, le pilote continue sur données synthétiques, clairement présentées comme telles.",
  },

  // ---------------------------------------------------------------- 8
  { t: "h1", text: "8. Exigences non fonctionnelles" },
  { t: "p", text: "**Les exigences suivantes conditionnent l'ouverture de la plateforme à des utilisateurs externes.** Les cibles marquées « proposée » sont à valider avec le ministère." },
  {
    t: "table", head: ["Domaine", "Exigence", "Cible / mesure"], widths: [20, 50, 30],
    rows: [
      ["Performance", "Calcul d'un aménagement de parcelle ; calcul d'un plan d'investissement", "Moins de 1 s ; moins de 5 s jusqu'à 150 quartiers (à valider par test de charge). Démonstration : moins de 0,1 s"],
      ["Disponibilité", "Service accessible aux heures ouvrables pendant le pilote", "99 % (cible proposée)"],
      ["Sécurité", "Authentification, rôles, chiffrement des échanges (TLS), secrets hors du dépôt de code, journal d'audit, revue de sécurité avant ouverture externe", "Aucune faille critique ou haute ouverte à la recette"],
      ["Confidentialité", "Minimisation des données personnelles des signalements, consentement, durée de conservation, conformité à la réglementation béninoise sur les données personnelles", "À vérifier avec un juriste (Code du numérique, autorité de protection des données)"],
      ["Accessibilité", "Navigation au clavier, contrastes suffisants, libellés et rôles explicites, aide contextuelle", "WCAG 2.1 niveau AA visé"],
      ["Compatibilité", "Navigateurs récents (Chrome, Edge, Firefox) sur ordinateur portable ; application citoyenne sur téléphone d'entrée de gamme", "Écran 1366 × 768 minimum pour l'outil métier"],
      ["Connexion faible", "Application citoyenne légère, saisie hors ligne puis synchronisation, canaux WhatsApp / USSD", "Page principale légère (cible proposée : moins de 200 Ko)"],
      ["Langues", "Interface en français ; application citoyenne en langues locales (messages vocaux)", "Fon, yoruba, dendi à terme"],
      ["Maintenabilité", "Tests automatisés, décisions d'architecture documentées, documentation à jour", "Voir critères de recette (section 13)"],
      ["Réversibilité", "Export des données en formats ouverts ; aucune dépendance bloquante à un fournisseur", "GeoJSON, CSV ; fournisseur IA interchangeable"],
      ["Observabilité", "Journaux techniques, suivi d'usage, alertes", "Tableau de suivi mensuel du pilote"],
    ],
  },

  // ---------------------------------------------------------------- 9
  { t: "h1", text: "9. Architecture technique" },
  { t: "p", text: "**L'architecture sépare l'interface, le moteur de calcul et l'accès aux données, pour remplacer les données synthétiques par des données réelles sans toucher au reste.**" },
  { t: "fig", file: "architecture.png", caption: "Figure 1 — Architecture de Cadre+ : trait plein = en place, pointillé = prévu.", widthPx: 640 },
  {
    t: "table", head: ["Composant", "Technologie", "Rôle"], widths: [24, 34, 42],
    rows: [
      ["Application web (apps/web)", "Next.js, React, TypeScript, Tailwind CSS, MapLibre GL", "Cartes, modules, aide intégrée, mode d'emploi"],
      ["API (services/api)", "Python, FastAPI, Shapely", "Calculs : ICV, optimiseurs, évaluation manuelle, assistant IA"],
      ["Accès aux données", "Module data_access", "Seul point à réécrire pour brancher la base réelle"],
      ["Base de données (cible)", "PostgreSQL + PostGIS sur Neon", "Données géographiques réelles"],
      ["Scripts de données (data/)", "Python", "Génération des données de démonstration, futurs imports"],
      ["Application citoyenne (prévue)", "Web léger (PWA), puis WhatsApp / USSD", "Signalements, consultation"],
      ["IA", "Passerelle compatible OpenAI (RodiumAI)", "Questions, avis ; isolée dans un module"],
      ["Qualité", "pytest (tests de l'API), Playwright (tests dans un navigateur réel)", "Détection des régressions"],
    ],
  },
  { t: "p", text: "Les choix détaillés sont consignés dans des décisions d'architecture (dossier docs/adr du dépôt) : stack, données synthétiques, intégration de l'IA. L'API est documentée automatiquement (interface interactive générée au format OpenAPI)." },

  // ---------------------------------------------------------------- 10
  { t: "h1", text: "10. Sécurité, responsabilité et gouvernance" },
  { t: "p", text: "**Cadre+ aide à décider ; la responsabilité d'une implantation reste celle de l'ingénieur qui la valide.** Cette limite doit être explicite pour le ministère comme pour les utilisateurs." },
  { t: "h2", text: "10.1 Responsabilité" },
  {
    t: "ul", items: [
      "L'outil ne remplace ni une étude géotechnique, ni un bureau de contrôle, ni un avis d'ingénieur responsable. Toute recommandation d'implantation est validée par un professionnel habilité.",
      "Une mention d'usage (aide à la décision, non garantie) figure dans l'application et dans les contrats.",
      "Le journal d'audit conserve chaque proposition, chaque modification manuelle et la décision finale.",
    ],
  },
  { t: "h2", text: "10.2 Propriété intellectuelle et souveraineté" },
  {
    t: "ul", items: [
      "À arrêter avec le ministère : propriété et licence du code, des modèles de calcul et des données dérivées. Proposition de départ : données et décisions au ministère ; code au porteur, avec droit d'usage pour l'État.",
      "Souveraineté : choisir l'hébergement (national ou non) avant le chargement des données réelles ; prévoir la réversibilité (export complet, documentation d'installation).",
      "Un partenariat avec un bureau d'études ou une école d'ingénieurs est recommandé pour partager la responsabilité technique et la continuité.",
    ],
  },
  { t: "h2", text: "10.3 Sécurité" },
  {
    t: "ul", items: [
      "Secrets (clés d'API) hors du dépôt de code, jamais affichés ; accès par rôles ; échanges chiffrés.",
      "Revue de sécurité du code et de l'infrastructure avant ouverture à des utilisateurs externes, puis à chaque évolution majeure.",
      "Données personnelles des citoyens limitées au strict nécessaire, avec information et consentement.",
    ],
  },
  { t: "h2", text: "10.4 Gouvernance du projet" },
  {
    t: "ul", items: [
      "Comité de pilotage : ministère, commune pilote, partenaires de données, porteur du projet ; réunion mensuelle pendant le pilote.",
      "Comité technique chargé de valider la méthode de l'ICV (critères, poids, sensibilité) et les barèmes de coûts.",
      "Cadre de réception d'une proposition spontanée : à clarifier avec le ministère (convention de partenariat, procédure de commande publique applicable).",
    ],
  },

  // ---------------------------------------------------------------- 11
  { t: "h1", text: "11. Livrables" },
  { t: "p", text: "**Les livrables couvrent le logiciel, les données, la méthode, la formation et l'évaluation.**" },
  {
    t: "table", head: ["Réf.", "Livrable", "Phase"], widths: [9, 74, 17],
    rows: [
      ["L1", "Plateforme web : cartes, modules ICV, Conception assistée, Arbitrage, Assistant IA, aide intégrée, mode d'emploi", "0 (fait), 1"],
      ["L2", "API documentée et suite de tests automatisés", "0 (fait), 1"],
      ["L3", "Jeux de données réelles chargés, scripts d'import, rapport de qualité des données", "1"],
      ["L4", "Note méthodologique : ICV, constructibilité, optimisation des investissements, hypothèses de coût", "1"],
      ["L5", "Application citoyenne de signalement (version web légère)", "1"],
      ["L6", "Comptes, rôles et journal d'audit", "1"],
      ["L7", "Formation des agents et supports de formation", "1"],
      ["L8", "Dossier d'exploitation : installation, sauvegardes, sécurité, supervision", "1"],
      ["L9", "Rapport de recette et rapport d'évaluation du pilote", "1"],
      ["L10", "Modules Prospective 2050, Résilience et climat, Transition des quartiers ; canaux WhatsApp et USSD", "2"],
      ["L11", "Mobilité multimodale interurbaine et plateforme nationale", "3"],
    ],
  },

  // ---------------------------------------------------------------- 12
  { t: "h1", text: "12. Planification par phases" },
  { t: "p", text: "**Le projet avance par phases, chacune conditionnée par une décision : on demande le financement de la phase 1, pas du jumeau numérique national d'un coup.**" },
  { t: "fig", file: "feuille-de-route.png", caption: "Figure 2 — Phases du projet et critères de passage (G0, G1, G2).", widthPx: 640 },
  {
    t: "table", head: ["Phase", "Contenu", "Durée"], widths: [22, 58, 20],
    rows: [
      ["Phase 0 — Démonstration", "ICV, Conception assistée, Arbitrage, Assistant IA sur données synthétiques ; outil de discussion avec le ministère.", "Fait"],
      ["Phase 1 — Pilote", "Commune pilote ; données réelles ; comptes, rôles, audit ; barèmes réels ; application citoyenne de signalement ; formation ; mesure des indicateurs.", "6 à 12 mois"],
      ["Phase 2 — Extension", "Plusieurs communes ; Prospective 2050, Résilience et climat, Transition des quartiers ; WhatsApp, USSD, langues locales ; détection du bâti par satellite.", "À définir"],
      ["Phase 3 — Échelle nationale", "Mobilité multimodale interurbaine ; jumeau numérique national ; hébergement souverain ; exploitation et support durables.", "À définir"],
    ],
  },

  // ---------------------------------------------------------------- 13
  { t: "h1", text: "13. Indicateurs de succès et critères de recette" },
  { t: "h2", text: "13.1 Indicateurs du pilote" },
  { t: "p", text: "**Le pilote est réussi si des indicateurs vérifiables s'améliorent et si les agents formés utilisent l'outil.** Les cibles chiffrées sont à fixer avec le ministère après mesure de la situation de départ." },
  {
    t: "table", head: ["Indicateur", "Définition", "Cible"], widths: [28, 46, 26],
    rows: [
      ["Couverture de l'ICV", "Part des quartiers de la commune pilote avec un ICV calculé sur données réelles", "100 %"],
      ["Ménages concernés", "Ménages couverts par les investissements planifiés avec l'outil", "À fixer"],
      ["Évolution de l'ICV", "Variation de l'ICV moyen pondéré par la population après investissements", "À fixer"],
      ["Délai de traitement", "Jours entre un signalement citoyen et sa prise en charge", "À fixer après mesure"],
      ["Déchets mieux collectés", "Tonnes par mois supplémentaires collectées dans les zones traitées", "À fixer après mesure"],
      ["Temps de préparation d'un arbitrage", "Durée pour produire un scénario d'investissement comparé", "Mesurer la référence, puis fixer"],
      ["Satisfaction", "Note moyenne des agents formés", "4 sur 5 (proposée)"],
      ["Conformité des propositions", "Part des propositions automatiques respectant toutes les contraintes", "100 % (vérifié par tests)"],
    ],
  },
  { t: "h2", text: "13.2 Critères de recette technique" },
  {
    t: "ol", items: [
      "Tous les tests automatisés passent (au jour de la rédaction : 37 tests de l'API et 9 tests dans un navigateur réel), et chaque module nouveau apporte ses tests.",
      "Toute proposition automatique d'aménagement respecte les contraintes (zéro violation) et est acceptée telle quelle par le mode manuel.",
      "Tout plan d'investissement respecte le budget ; le plan optimal n'est jamais moins bon que la stratégie naïve.",
      "Aucun chiffre synthétique n'apparaît sans mention : bandeau, fenêtres d'information, réponses de l'IA.",
      "Chaque fonction a son aide « ? » et le mode d'emploi couvre toutes les fonctions livrées.",
      "La revue de sécurité ne laisse aucune faille critique ou haute ouverte avant ouverture à des utilisateurs externes.",
      "Les données réelles chargées passent le contrôle de qualité défini avec les partenaires.",
    ],
  },

  // ---------------------------------------------------------------- 14
  { t: "h1", text: "14. Risques et mesures de maîtrise" },
  { t: "p", text: "**Les risques majeurs sont l'accès aux données, la responsabilité d'une recommandation et la dépendance à une seule personne.** L'évaluation ci-dessous est initiale." },
  {
    t: "table", head: ["Risque", "Gravité", "Mesure"], widths: [34, 12, 54],
    rows: [
      ["Données réelles inaccessibles, tardives ou incomplètes (cadastre notamment)", "Élevée", "Données synthétiques étiquetées ; jeu limité fourni par la commune pilote ; conventions avec l'ANDF et l'INStaD ; contrôle de qualité."],
      ["Recommandation erronée suivie d'un sinistre : qui est responsable ?", "Élevée", "Outil d'aide à la décision ; validation par un ingénieur responsable ; journal d'audit ; mention d'usage ; assurance à étudier."],
      ["Dépendance à une seule personne", "Élevée", "Documentation, décisions d'architecture, tests ; partenariat avec un bureau d'études ou une école d'ingénieurs ; renfort de l'équipe en phase 1."],
      ["Cadre légal de réception d'une proposition spontanée (commande publique)", "Moyenne", "Contact informel et note d'intention avant la présentation ; convention de partenariat ; avis juridique."],
      ["Méthode de l'ICV jugée arbitraire", "Moyenne", "Justification de chaque critère et poids ; comité technique ; test de sensibilité ; transparence des formules."],
      ["Coûts unitaires inventés pris pour des prix réels", "Moyenne", "Hypothèses affichées avec les résultats ; barèmes réels avant toute décision."],
      ["Confidentialité et dépendance au fournisseur IA", "Moyenne", "Aucune donnée sensible envoyée ; module d'accès isolé ; conditions du fournisseur vérifiées ; solution de repli."],
      ["Données synthétiques présentées comme réelles", "Moyenne", "Étiquetage permanent à l'écran et dans les réponses de l'IA."],
      ["Faible adoption par les agents", "Moyenne", "Formation, aide intégrée, ateliers sur cas concrets, référent métier."],
      ["Connexion faible côté citoyens", "Moyenne", "Application légère, saisie hors ligne, WhatsApp et USSD."],
    ],
  },

  // ---------------------------------------------------------------- 15
  { t: "h1", text: "15. Ressources et budget" },
  { t: "p", text: "**Le budget n'est pas chiffré dans cette version : les montants restent à établir avec le porteur du projet et le ministère.** Aucun chiffre n'est avancé faute de base fiable ; les postes ci-dessous structurent le chiffrage." },
  { t: "h2", text: "15.1 Équipe cible de la phase 1" },
  {
    t: "table", head: ["Rôle", "Mission", "Situation"], widths: [26, 50, 24],
    rows: [
      ["Chef de projet et référent géotechnique", "Pilotage, méthode, validation des règles d'aménagement", "En place (porteur du projet)"],
      ["Développeur(s) back-end et SIG", "API, optimiseurs, import et qualité des données", "À mobiliser"],
      ["Développeur front-end", "Application web, application citoyenne", "À mobiliser"],
      ["Analyste données et SIG", "Collecte, nettoyage, contrôle de qualité", "À mobiliser"],
      ["Référent métier (ministère, commune)", "Besoins, validation des résultats, relais auprès des agents", "À désigner"],
      ["Appui juridique et sécurité (ponctuel)", "Données personnelles, convention, revue de sécurité", "À mobiliser"],
      ["Formation (ponctuel)", "Supports et ateliers pour les agents", "À mobiliser"],
    ],
  },
  { t: "h2", text: "15.2 Postes de dépense" },
  {
    t: "table", head: ["Poste", "Facteurs de coût", "Montant"], widths: [28, 50, 22],
    rows: [
      ["Personnel", "Effectifs et durée de la phase 1", "À chiffrer"],
      ["Hébergement et infrastructure", "Base de données, serveur d'application, sauvegardes, supervision", "À chiffrer"],
      ["Fournisseur IA", "Volume d'appels, modèle utilisé", "À chiffrer"],
      ["Données", "Acquisition d'imagerie, licences éventuelles, essais géotechniques complémentaires", "À chiffrer"],
      ["Terrain et déplacements", "Collecte, ateliers, formation sur site", "À chiffrer"],
      ["Sécurité, juridique", "Revue de sécurité, avis juridique, assurance", "À chiffrer"],
      ["Matériel et connectivité", "Postes de travail, accès réseau", "À chiffrer"],
    ],
  },

  // ---------------------------------------------------------------- 16
  { t: "h1", text: "16. Annexes" },
  { t: "h2", text: "Annexe A — Formules" },
  { t: "p", text: "**Indice de Cadre de Vie.** Chaque sous-score est ramené entre 0 et 100, puis pondéré :" },
  {
    t: "formula", lines: [
      "ICV = 0,15 × école + 0,15 × santé + 0,15 × eau + 0,15 × électrification",
      "    + 0,15 × drainage + 0,10 × déchets + 0,10 × espaces verts",
      "    + 0,05 × inondation",
    ],
  },
  {
    t: "table", head: ["Critère", "Conversion en note de 0 à 100"], widths: [30, 70],
    rows: [
      ["École", "100 × (1 − temps d'accès / 45 min), minimum 0"],
      ["Santé", "100 × (1 − temps d'accès / 60 min), minimum 0"],
      ["Eau potable", "100 × (1 − temps d'accès / 45 min), minimum 0"],
      ["Électrification", "Taux d'électrification en %"],
      ["Drainage", "Score sur 10, multiplié par 10"],
      ["Collecte des déchets", "Taux de couverture en %"],
      ["Espaces verts", "100 × (part de surface verte / 25 %), plafonné à 100"],
      ["Risque d'inondation", "100 − 10 × (risque sur 10)"],
    ],
  },
  { t: "p", text: "**Indice de constructibilité d'une parcelle.**" },
  {
    t: "formula", lines: [
      "constructibilité = 0,5 × min(100 ; 100 × portance / 200 kPa)",
      "                 + 0,4 × score d'inondation (faible 100 ; moyen 50 ; élevé 10)",
      "                 + 0,1 × (100 − 10 × pente en %)",
    ],
  },
  { t: "p", text: "**Valeur d'un plan d'investissement.** Population × gain d'ICV × facteur d'équité, sommé sur les quartiers :" },
  {
    t: "formula", lines: [
      "facteur d'équité = 1 + équité × (100 − ICV du quartier) / 50",
      "avec équité comprise entre 0 (efficacité pure) et 1 (priorité forte aux quartiers défavorisés)",
    ],
  },

  { t: "h2", text: "Annexe B — Hypothèses de coût de la démonstration" },
  { t: "note", tone: "warn", text: "Ces valeurs sont inventées pour la démonstration. Elles doivent être remplacées par des barèmes réels avant tout usage décisionnel." },
  {
    t: "table", head: ["Poste", "Hypothèse"], widths: [38, 62],
    rows: [
      ["Fondations, portance de 150 kPa et plus", "Semelles isolées : 35 000 FCFA par m² d'emprise"],
      ["Fondations, portance de 90 à 150 kPa", "Semelles filantes profondes ou radier partiel : 60 000 FCFA par m²"],
      ["Fondations, portance inférieure à 90 kPa", "Radier général sur sol amélioré : 95 000 FCFA par m²"],
      ["Drainage périphérique", "25 000 FCFA par mètre linéaire du périmètre du bâtiment, si le risque d'inondation n'est pas faible"],
      ["Investissements : coût par habitant et par point de sous-score", "Drainage 900 ; électrification 600 ; eau 700 ; déchets 250 ; écoles 550 ; santé 700 ; espaces verts (foncier inclus) 800 (FCFA)"],
      ["Investissements : rendements décroissants", "Coût multiplié par (1 + sous-score / 100)"],
      ["Investissements : gain maximal par levier", "25 points de sous-score"],
      ["Investissements : coordination des chantiers", "Remise de 12 % sur le coût cumulé des réseaux (drainage, électricité, eau) si au moins deux sont réalisés dans le même quartier"],
    ],
  },

  { t: "h2", text: "Annexe C — État d'avancement de la démonstration" },
  { t: "p", text: "Au jour de la rédaction, la démonstration comprend la carte de l'ICV, la Conception assistée (automatique et manuelle), l'Arbitrage des investissements (automatique, mixte, manuel), l'Assistant IA, l'aide intégrée et le mode d'emploi, sur données synthétiques. Les autres modules et l'application citoyenne ne sont pas commencés. Les captures ci-dessous montrent l'application réelle." },
  { t: "fig", file: "capture-carte-icv.png", caption: "Figure 3 — Carte de l'ICV des huit quartiers d'Abomey-Calavi (données synthétiques ; les carrés sont illustratifs).", widthPx: 600 },
  { t: "fig", file: "capture-mode-manuel.png", caption: "Figure 4 — Conception assistée en mode manuel : le bâtiment déplacé trop près de la voie est signalé non conforme.", widthPx: 600 },
  { t: "fig", file: "capture-investissements.png", caption: "Figure 5 — Arbitrage des investissements en mode mixte : un quartier décidé à la main, les autres complétés par l'optimiseur.", widthPx: 600 },

  { t: "h2", text: "Annexe D — Glossaire" },
  {
    t: "table", head: ["Terme", "Définition"], widths: [28, 72],
    rows: [
      ["ICV", "Indice de Cadre de Vie : note de 0 à 100 d'un quartier."],
      ["Portance", "Capacité du sol à supporter une charge, en kilopascals (kPa)."],
      ["Emprise, CES", "Surface au sol du bâtiment ; coefficient d'emprise au sol = emprise / surface de la parcelle."],
      ["Retrait", "Distance minimale entre le bâtiment et une limite (parcelle, voie)."],
      ["Bande tampon", "Zone non constructible le long d'un espace naturel."],
      ["Bassin de rétention", "Espace qui retient temporairement l'eau de pluie."],
      ["Levier", "Type de chantier finançable (drainage, eau, électricité, déchets, école, santé, espaces verts)."],
      ["Levier réseau", "Drainage, électrification, eau : chantiers qui passent par la voirie et se coordonnent."],
      ["Jumeau numérique", "Représentation virtuelle du territoire, mise à jour, sur laquelle on simule avant d'agir."],
      ["Données synthétiques", "Données inventées mais réalistes, utilisées en démonstration et toujours étiquetées."],
      ["PostGIS", "Extension de PostgreSQL pour les données géographiques."],
      ["PWA", "Application web légère, installable sur téléphone, utilisable avec une connexion faible."],
    ],
  },

  { t: "h2", text: "Annexe E — Questions ouvertes à trancher avec le ministère" },
  {
    t: "ol", items: [
      "Quelle commune pour le pilote ? Abomey-Calavi est proposée à titre d'exemple.",
      "Quel cadre juridique pour recevoir cette proposition spontanée (convention, commande publique) ?",
      "Quelles données le ministère et la commune peuvent-ils fournir en premier, et à quelles conditions ?",
      "Qui valide la méthode de l'ICV (critères et poids), et selon quel calendrier ?",
      "Quel hébergement pour les données réelles : national ou non ?",
      "Qui détient la propriété intellectuelle du code, des modèles et des données dérivées ?",
      "Quel budget et quel financement pour la phase 1 ?",
      "Quels indicateurs et quelles cibles pour juger le pilote ?",
    ],
  },
];
