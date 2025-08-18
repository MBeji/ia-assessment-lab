import { ActionRule, Category, DepartmentId, Question, QuestionnaireTemplate } from "@/types";
import { SEED_CATEGORIES, SEED_QUESTIONS, SEED_RULES } from "@/data/seeds";

const ALL: (DepartmentId | "ALL")[] = ["ALL"]; 

// Template 1: current core IA maturity model
export const TEMPLATE_CORE_V1: QuestionnaireTemplate = {
  id: "core_v1",
  name: "Modèle IA Core",
  description: "Cadre IA core (stratégie, données, MLOps/LLMOps, GenAI, sécurité, conformité, adoption, ROI).",
  assessmentScope: "per-department",
  categories: SEED_CATEGORIES,
  questions: SEED_QUESTIONS,
  rules: SEED_RULES,
  origin: "Interne – synthèse meilleures pratiques data/IA d'entreprise et frameworks génériques (strategy, data, MLOps, governance).",
  whenToUse: "Première évaluation globale multi‑dimensions IA/GenAI dans une organisation cherchant un panorama équilibré.",
  strengths: ["Couverture large des piliers essentiels","Adapté à un kick‑off de transformation IA","Compatible analyses par département"],
  limitations: ["Moins profond sur conformité détaillée réglementaire","Ne remplace pas une évaluation dédiée du risque"],
  usageGuidelines: "Noter chaque question 0–5. Utiliser NA si non applicable. Générer le plan puis suivre l'amélioration et la couverture des risques élevés." 
};

// Template 2: Transversal 360 model from user spec
const TRANSVERSAL_CATEGORIES: Category[] = [
  { id: "TRANSVERSAL", name: "Module transversal", description: "Bonnes pratiques communes à toutes les directions." },
  { id: "DG", name: "Direction Générale", description: "Gouvernance exécutive et pilotage." },
  { id: "RH", name: "Ressources Humaines", description: "Processus RH et analytics." },
  { id: "DAF", name: "Finance – DAF", description: "ERP, clôture, trésorerie et contrôles." },
  { id: "CDG", name: "Contrôle de Gestion", description: "Analytique, planification, performance." },
  { id: "MG", name: "Moyens Généraux / Achats", description: "Facilities, achats, énergie et ESG." },
  { id: "Sales", name: "Ventes", description: "Performance commerciale et outils." },
  { id: "Marketing", name: "Marketing", description: "CDP, automation, expérimentation." },
  { id: "Communication", name: "Communication", description: "Stratégie éditoriale et gestion de crise." },
  { id: "Operations", name: "Opérations", description: "Production, qualité, supply et IoT." },
  { id: "IT", name: "DSI / IT", description: "Architecture, sécurité, data et MLOps." },
];

const q = (id: string, code: string, text: string, categoryId: string, applies: (DepartmentId|"ALL")[], isAI = false, riskLevel?: 'LOW'|'MEDIUM'|'HIGH', tags?: string[]): Question => ({
  id,
  code,
  text,
  categoryId,
  appliesToDepartments: applies,
  isAI,
  weight: 1,
  choices: [0,1,2,3,4,5],
  allowNA: true,
  references: [],
  evidenceRequiredThreshold: 4,
  riskLevel,
  tags,
});

const TRANSVERSAL_QUESTIONS: Question[] = [
  // Module transversal (ALL)
  q("TR-01","TR-01","Stratégie digitale formalisée, alignée au plan d’entreprise, objectifs et feuilles de route approuvés.","TRANSVERSAL",ALL,false),
  q("TR-02","TR-02","Portefeuille de cas d’usage digital priorisé avec business cases et sponsors.","TRANSVERSAL",ALL,false),
  q("TR-03","TR-03","Gouvernance (comité digital/IA), rôles et responsabilités clairement définis.","TRANSVERSAL",ALL,false),
  q("TR-04","TR-04","Culture et conduite du changement: plan d’acculturation, rituels, ambassadeurs.","TRANSVERSAL",ALL,false),
  q("TR-05","TR-05","Compétences: référentiel de compétences digitales/IA, plan de formation, mesure d’adoption.","TRANSVERSAL",ALL,false),
  q("TR-06","TR-06","Gouvernance des données: ownership, qualité, catalogage, glossaire, référentiels.","TRANSVERSAL",ALL,false),
  { ...q("TR-07","TR-07","Sécurité et conformité: contrôle des accès, RGPD, gestion des risques, audits.","TRANSVERSAL",ALL,false,'HIGH',["Security","Compliance"]), guidance: "Ex: IAM centralisé, MFA, revues d'accès périodiques, registre traitements RGPD, cartographie risques cyber/IA, audits internes récents.", scaleDescriptors: [
    "Aucun contrôle formalisé / ad hoc.",
    "Contrôles basiques (mots de passe) mais non revus.",
    "Processus partiels: quelques revues d'accès et registre partiel.",
    "IAM structuré + registre RGPD complet, revues périodiques.",
    "Gestion des risques intégrée, audits récurrents, KPIs sécurité suivis.",
    "Optimisation continue, automatisation (Just-In-Time access), couverture exhaustive." ] },
  q("TR-08","TR-08","Architecture et intégration: cloud, API‑first, intégrations entre systèmes clés.","TRANSVERSAL",ALL,false),
  q("TR-09","TR-09","Pilotage de la valeur: objectifs, KPI, ROI et bénéfices mesurés post‑déploiement.","TRANSVERSAL",ALL,false),
  q("TR-10","TR-10","Excellence opérationnelle: process mining/lean, automatisation là où pertinent.","TRANSVERSAL",ALL,false),
  { ...q("TR-11","TR-11","[IA] IA responsable: principes éthiques, DPIA/Risques IA, biais et explicabilité.","TRANSVERSAL",ALL,true,'HIGH',["AI Ethics","Risk"]), guidance: "Attendus: principes publiés, registres DPIA complétés, méthodologie d'audit biais, seuils explicabilité / trace des décisions.", scaleDescriptors: [
    "Aucun principe / aucune considération explicite.",
    "Principes évoqués informellement, pas de mise en œuvre.",
    "Principes rédigés, DPIA ponctuels, contrôle biais manuel.",
    "Cadre responsable établi (policies, DPIA systématiques, métriques biais).",
    "Explicabilité/biais intégrés pipelines CI/CD, reporting régulier.",
    "Amélioration continue data éthique, audits externes, benchmarks public." ] },
  { ...q("TR-12","TR-12","[IA] Cycle de vie des modèles: dataOps/MLOps, monitoring, drift, réentraînement.","TRANSVERSAL",ALL,true,'MEDIUM',["MLOps","Lifecycle"]), guidance: "Présence: pipelines CI/CD modèles, monitoring dérive data/performance, triggers de réentraînement documentés, rollback automatisé.", scaleDescriptors: [
    "Déploiements manuels, pas de suivi.",
    "Scripts isolés, monitoring basique (logs).",
    "Pipelines partiels (build/deploy), métriques performance suivies.",
    "CI/CD complet + monitoring dérive et alertes.",
    "Feature store, tests biais/robustesse automatiques, rollback rapide.",
    "Optimisation continue, auto-retraining gouverné, audit complet traçable." ] },

  // DG
  q("DG-01","DG-01","Sponsoring visible de la DG pour le digital/IA, avec objectifs publics.","DG",["DG"],true),
  q("DG-02","DG-02","Arbitrage et financement de portefeuilles digitaux/IA basés sur la valeur.","DG",["DG"],true),
  q("DG-03","DG-03","KPI exécutifs transverses (expérience client, productivité, time‑to‑market).","DG",["DG"],false),
  q("DG-04","DG-04","Gestion des risques numériques/IA intégrée au dispositif global de risques.","DG",["DG"],true),
  q("DG-05","DG-05","Écosystème: partenariats tech/startups, veille et benchmark réguliers.","DG",["DG"],false),
  q("DG-06","DG-06","[IA] Appétence et cadre de risque IA définis (use cases sensibles, garde‑fous).","DG",["DG"],true),
  q("DG-07","DG-07","Acculturation C‑suite: sessions régulières, immersions, mises en situation data/IA.","DG",["DG"],true),
  q("DG-08","DG-08","Décisions data‑driven: instances de décision appuyées sur données et analyses.","DG",["DG"],false),

  // RH
  q("RH-01","RH-01","SIRH intégré (Core HR, Paie, Temps/Activité) avec workflows numériques.","RH",["RH"],false),
  q("RH-02","RH-02","Dossiers salariés et analytics (turnover, absentéisme, DEI) accessibles en libre‑service sécurisé.","RH",["RH"],false),
  q("RH-03","RH-03","Recrutement digitalisé (ATS, e‑assessment), time‑to‑hire mesuré et optimisé.","RH",["RH"],false),
  q("RH-04","RH-04","Formation/Learning: LXP, catalogue digital, suivi des compétences et des parcours.","RH",["RH"],false),
  q("RH-05","RH-05","[IA] Chatbots/assistants RH pour questions courantes et onboarding, satisfaction mesurée.","RH",["RH"],true),
  q("RH-06","RH-06","[IA] IA de sourcing/screening avec contrôle des biais, audit régulier et consentement.","RH",["RH"],true),
  q("RH-07","RH-07","[IA] People analytics prédictif (attrition/skills), actions préventives documentées.","RH",["RH"],true),
  q("RH-08","RH-08","Gouvernance données RH: confidentialité, minimisation, contrôles d’accès, traçabilité.","RH",["RH"],false),

  // DAF
  q("DAF-01","DAF-01","ERP intégré (P2P, O2C, R2R) avec référentiels harmonisés.","DAF",["DAF"],false),
  q("DAF-02","DAF-02","Clôture accélérée (fast close), automations/RPA en place, qualité des écritures.","DAF",["DAF"],false),
  q("DAF-03","DAF-03","FP&A driver‑based: modèles opérationnels et scénarios standardisés.","DAF",["DAF"],false),
  q("DAF-04","DAF-04","Trésorerie: cash forecasting, visibilité multi‑banques, contrôles.","DAF",["DAF"],false),
  q("DAF-05","DAF-05","[IA] Prévisions financières IA (revenus, OPEX, cash) avec backtesting/erreurs suivies.","DAF",["DAF"],true),
  q("DAF-06","DAF-06","[IA] Détection d’anomalies/fraude, alerte précoce et enquête formalisée.","DAF",["DAF"],true),
  q("DAF-07","DAF-07","Contrôles internes ITGC/SoD, auditabilité des transformations de données.","DAF",["DAF"],false),
  q("DAF-08","DAF-08","Data lineage et piste d’audit de bout en bout (source → reporting).","DAF",["DAF"],false),

  // CDG
  q("CDG-01","CDG-01","Modèle analytique par inducteurs (ABM/ABC), versioning des hypothèses.","CDG",["CDG"],false),
  q("CDG-02","CDG-02","Processus budgétaire et rolling forecast orchestrés dans un outil dédié.","CDG",["CDG"],false),
  q("CDG-03","CDG-03","Self‑service BI sécurisé, catalogue de rapports certifiés.","CDG",["CDG"],false),
  q("CDG-04","CDG-04","Planification par scénarios, sensibilité, stress tests documentés.","CDG",["CDG"],false),
  q("CDG-05","CDG-05","Profitabilité par client/produit/canal, décisions pricing outillées.","CDG",["CDG"],false),
  q("CDG-06","CDG-06","[IA] Prévisions IA sur drivers clés (volume, mix, coûts), suivi des écarts.","CDG",["CDG"],true),
  q("CDG-07","CDG-07","Qualité des axes analytiques et référentiels, contrôles automatiques.","CDG",["CDG"],false),
  q("CDG-08","CDG-08","Rituels de performance (QBR/MBR) centrés données avec plans d’action.","CDG",["CDG"],false),

  // MG
  q("MG-01","MG-01","GMAO/CMMS pour parc/actifs, ordres de travail et SLA pilotés.","MG",["MG"],false),
  q("MG-02","MG-02","IoT capteurs (énergie, sécurité, confort), tableaux de bord en temps réel.","MG",["MG"],false),
  q("MG-03","MG-03","Stratégie maintenance préventive vs corrective, stocks pièces optimisés.","MG",["MG"],false),
  q("MG-04","MG-04","Gestion des espaces (CAFM), taux d’occupation et workspace analytics.","MG",["MG"],false),
  q("MG-05","MG-05","Procure‑to‑Pay digitalisé (demandes, validations, e‑signature).","MG",["MG"],false),
  q("MG-06","MG-06","[IA] Maintenance prédictive (vibrations, anomalies), réduction des arrêts non planifiés.","MG",["MG"],true),
  q("MG-07","MG-07","[IA] Optimisation énergétique par IA, objectifs carbone suivis.","MG",["MG"],true),
  q("MG-08","MG-08","ESG reporting (scope 1/2/3) et conformité (ex: CSRD) outillés.","MG",["MG"],false),

  // Sales
  q("SL-01","SL-01","CRM adopté (>90% des opportunités), hygiène des données (complet/à jour).","Sales",["Sales"],false),
  q("SL-02","SL-02","Méthodologie de vente (MEDDIC/BANT) standardisée et outillée.","Sales",["Sales"],false),
  q("SL-03","SL-03","Pipeline et forecast disciplinés, précision mesurée vs réalisé.","Sales",["Sales"],false),
  q("SL-04","SL-04","Intégration omnicanale (web, email, téléphone, retail, partenaires).","Sales",["Sales"],false),
  q("SL-05","SL-05","Sales enablement: playbooks, contenus, onboarding mesuré par la performance.","Sales",["Sales"],false),
  q("SL-06","SL-06","[IA] Lead scoring/priorisation IA, uplift avéré sur conversion.","Sales",["Sales"],true),
  q("SL-07","SL-07","[IA] Copilot commercial (rédaction emails, résumés d’appels), adoption suivie.","Sales",["Sales"],true),
  q("SL-08","SL-08","[IA] Next Best Action / pricing dynamique avec garde‑fous de conformité.","Sales",["Sales"],true),

  // Marketing
  q("MK-01","MK-01","Base client unifiée/CDP, consentements RGPD, identités résolues.","Marketing",["Marketing"],false),
  q("MK-02","MK-02","Segmentation/ciblage multi‑canal, cohérence des audiences.","Marketing",["Marketing"],false),
  q("MK-03","MK-03","Marketing automation (nurturing, triggers), mesure de délivrabilité.","Marketing",["Marketing"],false),
  q("MK-04","MK-04","Expérimentation (A/B, multivarié), gouvernance des tests et du savoir.","Marketing",["Marketing"],false),
  q("MK-05","MK-05","Attribution multi‑touch, ROI média/reporting fiables.","Marketing",["Marketing"],false),
  q("MK-06","MK-06","[IA] Personnalisation IA (reco, offres), lift incrémental mesuré.","Marketing",["Marketing"],true),
  q("MK-07","MK-07","[IA] Génération assistée de contenus (texte/visuel) avec garde‑fous de marque.","Marketing",["Marketing"],true),
  q("MK-08","MK-08","DAM (assets), workflows d’approbation et conformité de marque.","Marketing",["Marketing"],false),

  // Communication
  q("COM-01","COM-01","Stratégie éditoriale, lignes éditoriales et calendrier partagés.","Communication",["Communication"],false),
  q("COM-02","COM-02","Orchestration owned/earned/paid, gouvernance des canaux.","Communication",["Communication"],false),
  q("COM-03","COM-03","Social listening/veille, insights actionnables sur la réputation.","Communication",["Communication"],false),
  q("COM-04","COM-04","Gestion de crise: protocoles, simulations, temps de réponse mesuré.","Communication",["Communication"],false),
  q("COM-05","COM-05","Brand tracking et sondages de notoriété perçue.","Communication",["Communication"],false),
  q("COM-06","COM-06","[IA] Analyse de sentiment/veille IA, alertes et priorisation automatiques.","Communication",["Communication"],true),
  q("COM-07","COM-07","[IA] Assistance IA à la rédaction/modération, conformité et validation.","Communication",["Communication"],true),
  q("COM-08","COM-08","Accessibilité (RGAA/WCAG) et inclusion des contenus numériques.","Communication",["Communication"],false),

  // Operations
  q("OPS-01","OPS-01","Cartographie/standardisation des processus clés, BPM et ownership.","Operations",["Operations"],false),
  q("OPS-02","OPS-02","Intégration MES/SCADA/SCM/PLM, continuité numérique.","Operations",["Operations"],false),
  q("OPS-03","OPS-03","Qualité: QMS numérique, non‑conformités, CAPA suivies.","Operations",["Operations"],false),
  q("OPS-04","OPS-04","Performance temps réel (OEE, délais, rebut), résolution structurée.","Operations",["Operations"],false),
  q("OPS-05","OPS-05","Automatisation/RPA sur tâches répétitives, bénéfices mesurés.","Operations",["Operations"],false),
  q("OPS-06","OPS-06","IoT/traçabilité (lots, capteurs), visibilité bout‑en‑bout.","Operations",["Operations"],false),
  q("OPS-07","OPS-07","[IA] Prévision de la demande/planification IA, service level et stocks optimisés.","Operations",["Operations"],true),
  q("OPS-08","OPS-08","[IA] Maintenance/qualité prédictive, réduction rebuts et arrêts.","Operations",["Operations"],true),

  // IT
  q("IT-01","IT-01","Stratégie cloud/hybride, modularité et sécurité intégrées.","IT",["IT"],false),
  q("IT-02","IT-02","API management, intégrations event‑driven, catalogue d’API.","IT",["IT"],false),
  q("IT-03","IT-03","DevOps/CI‑CD, tests automatisés, time‑to‑market réduit.","IT",["IT"],false),
  q("IT-04","IT-04","Data platform (lakehouse), catalogage, gouvernance et accès data.","IT",["IT"],false),
  q("IT-05","IT-05","Sécurité Zero Trust, gestion des identités et secrets, pentests réguliers.","IT",["IT"],false),
  q("IT-06","IT-06","[IA] MLOps: registry, feature store, monitoring, déploiements contrôlés.","IT",["IT"],true),
  q("IT-07","IT-07","[IA] Gouvernance IA: sandbox, jeux de données de référence, revues de modèles.","IT",["IT"],true),
  q("IT-08","IT-08","FinOps/observabilité: coûts, performance, SLO/SLA.","IT",["IT"],false),
];

const TRANSVERSAL_RULES: ActionRule[] = [
  // Minimal ruleset; plan generation stays functional
  { id: "R-TR-LOW", scope: "category", categoryId: "TRANSVERSAL", threshold: 2, actions: [
    { horizon: "0-90j", text: "Formaliser la stratégie digitale/IA et un comité de gouvernance.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Prioriser un portefeuille de cas d’usage avec KPI et sponsors.", impact: "H", effort: "M" },
    { horizon: "6-12m", text: "Déployer un cadre d’IA responsable et MLOps de base.", impact: "M", effort: "M" },
  ]},
  { id: "R-IT-LOW", scope: "category", categoryId: "IT", threshold: 2, actions: [
    { horizon: "0-90j", text: "Établir des fondations cloud, IAM et CI/CD.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Mettre en place une plateforme data/IA et des garde‑fous GenAI.", impact: "H", effort: "M" },
  ]},
];

export const TEMPLATE_TRANSVERSAL_V1: QuestionnaireTemplate = {
  id: "transversal_v1",
  name: "Modèle Transversal 360",
  description: "Questionnaire transversal par direction (DG, RH, DAF, etc.) incluant un module commun.",
  assessmentScope: "per-department",
  categories: TRANSVERSAL_CATEGORIES,
  questions: TRANSVERSAL_QUESTIONS,
  rules: TRANSVERSAL_RULES,
  origin: "Consolidation interne multi‑fonctions inspirée de frameworks digitaux et pratiques opérationnelles.",
  whenToUse: "Cartographier la maturité digitale/IA par direction métier et aligner priorités transverses.",
  strengths: ["Vision granulaire par département","Module commun pour comparabilité","Détection de variances inter‑départements"],
  limitations: ["Temps de collecte plus long si nombreuses directions","Moins adapté si structure très centralisée"],
  usageGuidelines: "Sélectionner les départements concernés. Noter. Filtrer par tags pour focaliser (sécurité, MLOps...). Exploiter la heatmap Tag×Horizon pour équilibrer les actions." 
};

// Template 3: Gartner-inspired capabilities model (organization-level)
const GARTNER_CATEGORIES: Category[] = [
  { id: "VISION_STRATEGY", name: "Vision & Stratégie", description: "Ambition, alignement, risques, feuille de route et gouvernance." },
  { id: "OPERATING_PORTFOLIO", name: "Operating Model & Portfolio", description: "Intake, priorisation, operating model et portefeuille." },
  { id: "PEOPLE_SKILLS", name: "People & Skills", description: "Compétences, formations, communautés, staffing et culture." },
  { id: "DATA_ANALYTICS", name: "Data & Analytics Readiness", description: "Gouvernance, qualité, lineage, accès et self‑service." },
  { id: "TECH_ARCH", name: "Technology & Architecture", description: "Plateforme IA, intégrations, observabilité/FinOps et sécurité." },
  { id: "LIFECYCLE_MLOPS", name: "Lifecycle, MLOps/LLMOps", description: "Versioning, CI/CD, monitoring, évaluation et documentation." },
  { id: "GOV_RISK_SEC", name: "Gouvernance, Risques, Sécurité & Conformité", description: "IA responsable, EU AI Act, DPIA et sécurité IA." },
  { id: "VALUE_CULTURE", name: "Valeur, Résultats, Culture & Adoption", description: "ROI, time‑to‑value, adoption et gouvernance des métriques." },
];

const gq = (id: string, code: string, text: string, categoryId: string): Question => ({
  id,
  code,
  text,
  categoryId,
  appliesToDepartments: ALL,
  isAI: true,
  weight: 1,
  choices: [0,1,2,3,4,5],
  allowNA: true,
  references: [],
  evidenceRequiredThreshold: 4,
});

const GARTNER_QUESTIONS: Question[] = [
  // Vision & Stratégie
  gq("GRT-VS-01","VS-01","Une stratégie IA formalisée, approuvée par la direction, définit périmètre, objectifs mesurables et principes directeurs.","VISION_STRATEGY"),
  gq("GRT-VS-02","VS-02","Des priorités d’investissement IA (thèses d’usage) sont définies par domaines (client, opérations, risques) avec critères d’arbitrage clairs.","VISION_STRATEGY"),
  gq("GRT-VS-03","VS-03","L’appétence et la tolérance au risque IA sont définies, avec exemples de cas acceptés/refusés.","VISION_STRATEGY"),
  gq("GRT-VS-04","VS-04","Une feuille de route IA 12–24 mois existe avec jalons, dépendances data/tech et capacité planifiée.","VISION_STRATEGY"),
  gq("GRT-VS-05","VS-05","Une politique « build vs buy vs partner » pour solutions IA/LLM est documentée et appliquée.","VISION_STRATEGY"),
  gq("GRT-VS-06","VS-06","Les objectifs IA sont reliés aux objectifs d’entreprise (OKR), avec sponsors identifiés.","VISION_STRATEGY"),
  gq("GRT-VS-07","VS-07","Les impacts ESG/éthiques de l’IA sont considérés dans les décisions (inclusion, impacts environnementaux, sociaux).","VISION_STRATEGY"),

  // Operating Model & Portfolio
  gq("GRT-OP-01","OP-01","Un processus d’intake/priorisation des cas d’usage IA est standardisé, avec un comité et des critères objectivés (impact, faisabilité, risque).","OPERATING_PORTFOLIO"),
  gq("GRT-OP-02","OP-02","Un operating model IA (hub‑and‑spoke/fédéré) clarifie rôles et responsabilités (métier, data, IT, sécurité, juridique).","OPERATING_PORTFOLIO"),
  gq("GRT-OP-03","OP-03","La gestion de produit IA (discovery→delivery→run) utilise des gates et livrables standard (charte, BRD, plan de tests).","OPERATING_PORTFOLIO"),
  gq("GRT-OP-04","OP-04","Le portefeuille des cas IA est suivi (valeur, risques, statut) et revu à cadence régulière.","OPERATING_PORTFOLIO"),
  gq("GRT-OP-05","OP-05","Un processus d’industrialisation/transfert vers le run est défini (SLO/SLA, ownership, support).","OPERATING_PORTFOLIO"),
  gq("GRT-OP-06","OP-06","Les leçons apprises et bonnes pratiques sont capitalisées dans une base de connaissances accessible.","OPERATING_PORTFOLIO"),
  gq("GRT-OP-07","OP-07","Les relations fournisseurs/éditeurs IA (LLM, RAG, MLOps) sont gérées (contrats, évaluation, performance).","OPERATING_PORTFOLIO"),

  // People & Skills
  gq("GRT-PS-01","PS-01","Un référentiel de compétences IA par rôle (dirigeants, managers, métiers, IT/DS/MLE) est défini et tenu à jour.","PEOPLE_SKILLS"),
  gq("GRT-PS-02","PS-02","Des parcours de formation IA/GenAI basés sur les rôles existent, avec évaluation et taux de complétion suivis.","PEOPLE_SKILLS"),
  gq("GRT-PS-03","PS-03","Une communauté de pratique (DS/MLE/Prompt) active partage patterns, revues de modèles et retours d’expérience.","PEOPLE_SKILLS"),
  gq("GRT-PS-04","PS-04","Les équipes produits IA sont pluridisciplinaires, stables et dotées d’une gouvernance claire (product owner, tech lead).","PEOPLE_SKILLS"),
  gq("GRT-PS-05","PS-05","Un plan de recrutement/partenariats pour talents IA est en place, avec indicateurs de rétention et diversité.","PEOPLE_SKILLS"),
  gq("GRT-PS-06","PS-06","Des politiques d’usage responsable par les employés (do/don’t, cas concrets) sont diffusées et comprises.","PEOPLE_SKILLS"),
  gq("GRT-PS-07","PS-07","Du temps/budget est alloué à l’expérimentation (POC, hackathons) avec objectifs d’apprentissage.","PEOPLE_SKILLS"),

  // Data & Analytics
  gq("GRT-DA-01","DA-01","La gouvernance des données d’entraînement/inférence (propriétaires, stewards, glossaire, catalogage) est effective.","DATA_ANALYTICS"),
  gq("GRT-DA-02","DA-02","La qualité des données est gérée par règles, scores DQ, SLA et alertes (train/infer).","DATA_ANALYTICS"),
  gq("GRT-DA-03","DA-03","Le lineage et la traçabilité des datasets/features sont documentés et auditables.","DATA_ANALYTICS"),
  gq("GRT-DA-04","DA-04","Un feature store ou des datasets certifiés “golden” existent avec réutilisation mesurée.","DATA_ANALYTICS"),
  gq("GRT-DA-05","DA-05","L’accès aux données est sécurisé (RBAC/ABAC), avec minimisation des PII et anonymisation/pseudonymisation.","DATA_ANALYTICS"),
  gq("GRT-DA-06","DA-06","L’usage de données synthétiques est encadré (politique, outils, validation de similarité/fuites).","DATA_ANALYTICS"),
  gq("GRT-DA-07","DA-07","Les utilisateurs métiers disposent d’un self‑service analytics gouverné (catalogue, rôles, garde‑fous).","DATA_ANALYTICS"),

  // Technology & Architecture
  gq("GRT-TA-01","TA-01","Une plateforme IA unifiée existe (LLM gateway, vector DB, registry de modèles, orchestrateur, pipelines).","TECH_ARCH"),
  gq("GRT-TA-02","TA-02","Les intégrations sont API‑first/event‑driven avec contrats de données et SLO documentés.","TECH_ARCH"),
  gq("GRT-TA-03","TA-03","L’observabilité/FinOps IA mesure latence, erreurs, coûts (tokens, compute) par cas d’usage.","TECH_ARCH"),
  gq("GRT-TA-04","TA-04","Des capacités multi‑cloud/multi‑LLM et de réversibilité sont prévues (portabilité, conteneurs).","TECH_ARCH"),
  gq("GRT-TA-05","TA-05","Des environnements dev/test/prod cloisonnés existent avec contrôles d’accès et journaux.","TECH_ARCH"),
  gq("GRT-TA-06","TA-06","Les secrets/clefs (API/LLM) sont gérés de façon sécurisée avec rotation et politiques d’usage.","TECH_ARCH"),
  gq("GRT-TA-07","TA-07","Les cas temps réel/edge/on‑prem sont pris en charge si requis (latence, souveraineté).","TECH_ARCH"),

  // Lifecycle, MLOps/LLMOps
  gq("GRT-ML-01","ML-01","Le versioning du code, des données, des modèles et des prompts est en place (reproductibilité).","LIFECYCLE_MLOPS"),
  gq("GRT-ML-02","ML-02","Des pipelines CI/CD incluent tests fonctionnels, robustesse, biais/sûreté et gates d’approbation.","LIFECYCLE_MLOPS"),
  gq("GRT-ML-03","ML-03","Le monitoring en production suit dérive data/model, qualité de réponse LLM, hallucinations et sécurité.","LIFECYCLE_MLOPS"),
  gq("GRT-ML-04","ML-04","L’évaluation continue (A/B, champion‑challenger) et les rollbacks sont maîtrisés.","LIFECYCLE_MLOPS"),
  gq("GRT-ML-05","ML-05","Les boucles de feedback et la supervision humaine (HITL/HOTL) sont définies, avec labeling et réentraînement.","LIFECYCLE_MLOPS"),
  gq("GRT-ML-06","ML-06","Un banc d’évaluation GenAI (factualité, toxicité, jailbreak) et du red teaming sont en place.","LIFECYCLE_MLOPS"),
  gq("GRT-ML-07","ML-07","La documentation cycle de vie (model cards, datasheets, changelog de prompts) est systématique.","LIFECYCLE_MLOPS"),

  // Gouvernance, Risques, Sécurité & Conformité
  gq("GRT-GR-01","GR-01","Une politique d’IA responsable est adoptée (équité, explicabilité, sécurité, supervision).","GOV_RISK_SEC"),
  gq("GRT-GR-02","GR-02","Les cas d’usage sont classés selon l’EU AI Act et les obligations correspondantes sont respectées.","GOV_RISK_SEC"),
  gq("GRT-GR-03","GR-03","Des DPIA/analyses d’impact IA sont réalisées quand requis, avec registres et approbations.","GOV_RISK_SEC"),
  gq("GRT-GR-04","GR-04","Les exigences d’explicabilité sont définies par cas; les méthodes et seuils sont documentés.","GOV_RISK_SEC"),
  gq("GRT-GR-05","GR-05","La sécurité IA couvre prompt injection/exfiltration, filtrage de contenu et isolation de contexte.","GOV_RISK_SEC"),
  gq("GRT-GR-06","GR-06","La gestion d’incidents IA (détection, réponse, RCA, communication) est opérationnelle.","GOV_RISK_SEC"),
  gq("GRT-GR-07","GR-07","La due diligence fournisseurs (LLM/outils) et les clauses IP/DPA sont en place et revues périodiquement.","GOV_RISK_SEC"),

  // Valeur, Résultats, Culture & Adoption
  gq("GRT-VA-01","VA-01","Chaque cas d’usage dispose d’un business case avec baseline et KPI de succès avant lancement.","VALUE_CULTURE"),
  gq("GRT-VA-02","VA-02","Les bénéfices post‑déploiement sont mesurés et revus périodiquement (valeur, risques, qualité).","VALUE_CULTURE"),
  gq("GRT-VA-03","VA-03","Le time‑to‑value et le débit du pipeline d’initiatives sont suivis; les goulots sont traités.","VALUE_CULTURE"),
  gq("GRT-VA-04","VA-04","L’adoption utilisateur (usage, satisfaction, productivité) est mesurée et pilotée par actions.","VALUE_CULTURE"),
  gq("GRT-VA-05","VA-05","Un plan de conduite du changement (comms, formation, support, champions) est exécuté.","VALUE_CULTURE"),
  gq("GRT-VA-06","VA-06","Les KPI et métriques IA sont gouvernés (définitions, ownership, auditabilité).","VALUE_CULTURE"),
  gq("GRT-VA-07","VA-07","Des règles “kill/scale” et la décommission des cas à faible valeur sont appliquées.","VALUE_CULTURE"),
];

const GARTNER_RULES: ActionRule[] = [
  { id: "R-GRT-VS-LOW", scope: "category", categoryId: "VISION_STRATEGY", threshold: 2, actions: [
    { horizon: "0-90j", text: "Formaliser une stratégie IA avec OKR et tolérance au risque.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Définir une feuille de route 12–24 mois et la politique build/buy/partner.", impact: "H", effort: "M" },
  ]},
  { id: "R-GRT-ML-LOW", scope: "category", categoryId: "LIFECYCLE_MLOPS", threshold: 2, actions: [
    { horizon: "0-90j", text: "Mettre en place versioning modèles/données/prompts et CI/CD avec gates.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Installer monitoring dérive et banc d’évaluation GenAI.", impact: "H", effort: "M" },
  ]},
];

export const TEMPLATE_GARTNER_V1: QuestionnaireTemplate = {
  id: "gartner_v1",
  name: "Modèle Gartner (capabilities)",
  description: "Questionnaire IA inspiré du modèle Gartner par capacités, au niveau organisation.",
  assessmentScope: "organization",
  categories: GARTNER_CATEGORIES,
  questions: GARTNER_QUESTIONS,
  rules: GARTNER_RULES,
  origin: "Inspiration des publications Gartner sur AI Maturity / Data & Analytics capabilities (simplifié).",
  whenToUse: "Cadrage stratégique top‑management, priorisation macro des capacités à renforcer.",
  strengths: ["Structure capabilities claire","Focus stratégie / gouvernance","Lecture exécutive"],
  limitations: ["Moins granulaire opérationnel MLOps","Pas de détail par département"],
  usageGuidelines: "Approche organisationnelle unique. Utiliser pour revue de portefeuille et alignement sur investissements structurants." 
};

// (Final aggregated TEMPLATES export is appended after all template declarations.)

// -------------------------------------------------------------
// NEW TEMPLATE 4: NIST AI Risk Management Framework (GOVERN, MAP, MEASURE, MANAGE)
// -------------------------------------------------------------
// Scope: organization-wide assessment of AI risk management capabilities.
// References: NIST AI RMF 1.0 (Functions & Categories) - kept concise (8 Q / function = 32 Q total light set)

const NIST_CATEGORIES: Category[] = [
  { id: "NIST_GOVERN", name: "GOVERN", description: "Culture, policies, roles, accountability pour la gestion des risques IA." },
  { id: "NIST_MAP", name: "MAP", description: "Compréhension du contexte, use cases, parties prenantes et risques." },
  { id: "NIST_MEASURE", name: "MEASURE", description: "Méthodes d’évaluation (validité, dérive, biais, sécurité)." },
  { id: "NIST_MANAGE", name: "MANAGE", description: "Traitement des risques, réponse, amélioration continue." },
];

const nistQ = (id: string, code: string, text: string, categoryId: string, refs: string[]): Question => ({
  id,
  code,
  text,
  categoryId,
  appliesToDepartments: ALL,
  isAI: true,
  weight: 1,
  choices: [0,1,2,3,4,5],
  allowNA: true,
  references: refs,
  evidenceRequiredThreshold: 4,
});

const NIST_QUESTIONS: Question[] = [
  // GOVERN (culture, policies, roles)
  nistQ("NIST-GOV-01","GOV-01","Politique d’IA responsable approuvée, couvrant équité, explicabilité, sécurité, confidentialité.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-02","GOV-02","Rôles & responsabilités IA (business, data, sécurité, juridique) formalisés et communiqués.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-03","GOV-03","Processus de supervision (comité) surveillant risques critiques et plans d’atténuation.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-04","GOV-04","Mécanismes de signalement d’incidents / préoccupations IA disponibles et suivis.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-05","GOV-05","Inventaire / registre des systèmes IA avec métadonnées (usage, owner, risque, données).","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-06","GOV-06","Culture du risque: formations et campagnes de sensibilisation autour des risques IA.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-07","GOV-07","Alignement ESG / impacts sociétaux analysés pour cas sensibles.","NIST_GOVERN",["NIST: GOVERN"]),
  nistQ("NIST-GOV-08","GOV-08","Indicateurs de performance & de risque IA revus périodiquement.","NIST_GOVERN",["NIST: GOVERN"]),
  // MAP
  nistQ("NIST-MAP-01","MAP-01","Processus d’identification des parties prenantes & usages IA avec classification du risque.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-02","MAP-02","Analyse du contexte réglementaire / conformité (RGPD, sectoriel) pour chaque cas IA.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-03","MAP-03","Évaluation des impacts potentiels (sécurité, biais, droits fondamentaux) pré-projet.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-04","MAP-04","Documentation initiale (objectifs, hypothèses, données) standardisée.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-05","MAP-05","Analyse des dépendances & interactions systèmes (chaîne de valeur, LLM externes).","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-06","MAP-06","Critères d’acceptation de performance & de tolérance au risque définis avant développement.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-07","MAP-07","Procédure pour intégrer retours utilisateurs / parties prenantes dans la conception.","NIST_MAP",["NIST: MAP"]),
  nistQ("NIST-MAP-08","MAP-08","Identification des données sensibles & obligations associées (PII, propriété, licences).","NIST_MAP",["NIST: MAP"]),
  // MEASURE
  nistQ("NIST-MEAS-01","MEAS-01","Tests de robustesse, performance, biais et explicabilité systématiques.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-02","MEAS-02","Métriques d’incertitude / calibration suivies quand pertinent.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-03","MEAS-03","Évaluation factuelle & toxicité pour systèmes GenAI / LLM.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-04","MEAS-04","Surveillance dérive data/model & alertes déclenchées.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-05","MEAS-05","Documentation (model cards, datasheets) complète et accessible.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-06","MEAS-06","Evaluation continue (A/B, champion-challenger) planifiée.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-07","MEAS-07","Analyse de sécurité IA (prompt injection, exfiltration) intégrée aux tests.","NIST_MEASURE",["NIST: MEASURE"]),
  nistQ("NIST-MEAS-08","MEAS-08","Procédures de reproductibilité & traçabilité validées (versioning complet).","NIST_MEASURE",["NIST: MEASURE"]),
  // MANAGE
  nistQ("NIST-MAN-01","MAN-01","Plan de réponse aux incidents IA (détection, tri, réaction, RCA).","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-02","MAN-02","Processus d’atténuation / contournement en production (rollback, kill switch).","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-03","MAN-03","Mise à jour / réentraînement planifiés selon triggers mesurés (drift, performances).","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-04","MAN-04","Gestion des fournisseurs / tiers (évaluation, SLA risques IA).","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-05","MAN-05","Cycle d’amélioration continue (post-mortems IA, leçons capitalisées).","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-06","MAN-06","Suivi de la valeur & recalibrage business case post-déploiement.","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-07","MAN-07","Contrôles d’accès & gestion des secrets modèles/LLM maintenus à jour.","NIST_MANAGE",["NIST: MANAGE"]),
  nistQ("NIST-MAN-08","MAN-08","Archivage / retrait sécurisé des modèles obsolètes & données associées.","NIST_MANAGE",["NIST: MANAGE"]),
];

const NIST_RULES: ActionRule[] = [
  { id: "R-NIST-GOV-LOW", scope: "category", categoryId: "NIST_GOVERN", threshold: 2, actions: [
    { horizon: "0-90j", text: "Établir politique IA responsable & registre des systèmes.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Mettre en place comité gouvernance & formation risques IA.", impact: "H", effort: "M" },
  ]},
  { id: "R-NIST-MEAS-LOW", scope: "category", categoryId: "NIST_MEASURE", threshold: 2, actions: [
    { horizon: "0-90j", text: "Standardiser tests biais/robustesse & versioning complet.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Déployer monitoring dérive & banc évaluation GenAI.", impact: "H", effort: "M" },
  ]},
];

export const TEMPLATE_NIST_AIRMF_V1: QuestionnaireTemplate = {
  id: "nist_aimrf_v1",
  name: "NIST AI RMF (v1)",
  description: "Cadre NIST AI RMF (GOVERN, MAP, MEASURE, MANAGE) – gestion des risques IA.",
  assessmentScope: "organization",
  categories: NIST_CATEGORIES,
  questions: NIST_QUESTIONS,
  rules: NIST_RULES,
  origin: "NIST AI Risk Management Framework 1.0 (résumé fonctionnel).",
  whenToUse: "Évaluer la gouvernance et la maîtrise des risques IA avant audit externe ou mise en conformité EU AI Act.",
  strengths: ["Orientation risques structurée","Lien naturel avec conformité et sûreté IA","Met focus sur cycle de vie"],
  limitations: ["Ne couvre pas en profondeur valeur business / adoption","Version light – non exhaustive"],
  usageGuidelines: "Impliquer risk/compliance/security. Croiser avec inventaire des systèmes IA. Prioriser mesures gouvernance & monitoring." 
};

// -------------------------------------------------------------
// NEW TEMPLATE 5: ISO/IEC 42001 (AI Management System) LIGHT
// -------------------------------------------------------------
// Focus on management system clauses adapted for AI governance.

const ISO42001_CATEGORIES: Category[] = [
  { id: "ISO_CONTEXT", name: "Contexte", description: "Contexte organisationnel, parties intéressées, portée du SGIA." },
  { id: "ISO_LEADERSHIP", name: "Leadership", description: "Engagement direction, rôles, politique IA." },
  { id: "ISO_PLANNING", name: "Planification", description: "Risques & opportunités, objectifs et plan d’action." },
  { id: "ISO_SUPPORT", name: "Support", description: "Ressources, compétences, communication, documentation." },
  { id: "ISO_OPERATION", name: "Opérations", description: "Conception, acquisition données, développement & contrôle." },
  { id: "ISO_PERFORMANCE", name: "Évaluation Performance", description: "Monitoring, audit interne, revue de direction." },
  { id: "ISO_IMPROVEMENT", name: "Amélioration", description: "Non-conformités, actions correctives, amélioration continue." },
  { id: "ISO_RESPONSIBLE", name: "IA Responsable", description: "Éthique, impacts, transparence, surveillance humaine." },
];

const isoQ = (id: string, code: string, text: string, categoryId: string, refs: string[]): Question => ({
  id,
  code,
  text,
  categoryId,
  appliesToDepartments: ALL,
  isAI: true,
  weight: 1,
  choices: [0,1,2,3,4,5],
  allowNA: true,
  references: refs,
  evidenceRequiredThreshold: 4,
});

const ISO42001_QUESTIONS: Question[] = [
  isoQ("ISO-CONTEXT-01","CTX-01","Portée du système de management IA définie (procédures, exclusions).", "ISO_CONTEXT", ["ISO42001: 4"]),
  isoQ("ISO-CONTEXT-02","CTX-02","Parties intéressées & exigences pertinentes identifiées.", "ISO_CONTEXT", ["ISO42001: 4.2"]),
  isoQ("ISO-LEAD-01","LEAD-01","Engagement de la direction et politique IA signée et communiquée.", "ISO_LEADERSHIP", ["ISO42001: 5"]),
  isoQ("ISO-LEAD-02","LEAD-02","Rôles, responsabilités & autorités SGIA attribués.", "ISO_LEADERSHIP", ["ISO42001: 5.3"]),
  isoQ("ISO-PLAN-01","PLAN-01","Risques & opportunités IA identifiés (registre), plans de traitement définis.", "ISO_PLANNING", ["ISO42001: 6.1"]),
  isoQ("ISO-PLAN-02","PLAN-02","Objectifs IA mesurables établis, indicateurs suivis.", "ISO_PLANNING", ["ISO42001: 6.2"]),
  isoQ("ISO-SUP-01","SUP-01","Compétences & formations IA tracées (matrice, registres).", "ISO_SUPPORT", ["ISO42001: 7.2"]),
  isoQ("ISO-SUP-02","SUP-02","Documentation SGIA contrôlée (versioning, accès).", "ISO_SUPPORT", ["ISO42001: 7.5"]),
  isoQ("ISO-OP-01","OP-01","Processus de conception/développement IA documentés (revues, validation).", "ISO_OPERATION", ["ISO42001: 8"]),
  isoQ("ISO-OP-02","OP-02","Gestion des données (qualité, licences, protection) intégrée au cycle de vie.", "ISO_OPERATION", ["ISO42001: 8.2"]),
  isoQ("ISO-PERF-01","PERF-01","Surveillance & mesures de performance IA (KPI) réalisées et revues.", "ISO_PERFORMANCE", ["ISO42001: 9.1"]),
  isoQ("ISO-PERF-02","PERF-02","Audits internes du SGIA planifiés et réalisés.", "ISO_PERFORMANCE", ["ISO42001: 9.2"]),
  isoQ("ISO-IMP-01","IMP-01","Traitement des non-conformités & actions correctives tracés.", "ISO_IMPROVEMENT", ["ISO42001: 10.2"]),
  isoQ("ISO-IMP-02","IMP-02","Amélioration continue démontrée (revues, mise à jour politique/objectifs).", "ISO_IMPROVEMENT", ["ISO42001: 10.3"]),
  isoQ("ISO-RESP-01","RESP-01","Évaluations d’impact éthique / droits fondamentaux effectuées pour cas sensibles.", "ISO_RESPONSIBLE", ["ISO42001: Annexe A"],),
  isoQ("ISO-RESP-02","RESP-02","Transparence & surveillance humaine définies (HITL/HOTL).", "ISO_RESPONSIBLE", ["ISO42001: Annexe A"]),
];

const ISO42001_RULES: ActionRule[] = [
  { id: "R-ISO-LEAD-LOW", scope: "category", categoryId: "ISO_LEADERSHIP", threshold: 2, actions: [
    { horizon: "0-90j", text: "Formaliser politique IA & rôles SGIA.", impact: "H", effort: "M" },
    { horizon: "3-6m", text: "Déployer registre risques/opportunités & objectifs mesurables.", impact: "H", effort: "M" },
  ]},
  { id: "R-ISO-RESP-LOW", scope: "category", categoryId: "ISO_RESPONSIBLE", threshold: 2, actions: [
    { horizon: "0-90j", text: "Mettre en place évaluations d’impact éthique & transparence.", impact: "H", effort: "M" },
  ]},
];

export const TEMPLATE_ISO_42001_V1: QuestionnaireTemplate = {
  id: "iso_42001_v1",
  name: "ISO/IEC 42001 (light)",
  description: "Système de management IA – clauses clés ISO/IEC 42001 (version light).",
  assessmentScope: "organization",
  categories: ISO42001_CATEGORIES,
  questions: ISO42001_QUESTIONS,
  rules: ISO42001_RULES,
  origin: "Draft public ISO/IEC 42001 (AI Management System) – sélection de clauses clés.",
  whenToUse: "Pré‑diagnostic avant lancement d’un programme de conformité / certification SGIA.",
  strengths: ["Aligné management system","Favorise structuration processus","Complément à audits ISO existants"],
  limitations: ["Version light, ne constitue pas un audit complet","Moins orienté performance produit IA"],
  usageGuidelines: "Cartographier pratiques existantes vs exigences. Alimenter backlog de mise en conformité (politiques, registres, audits)." 
};

// -------------------------------------------------------------
// NEW TEMPLATE 6: EU AI Act Readiness (Obligations par exigences clés)
// -------------------------------------------------------------

const EUAI_CATEGORIES: Category[] = [
  { id: "EU_RISK_MGMT", name: "Gestion des Risques", description: "Système de gestion des risques pour cas d’usage IA." },
  { id: "EU_DATA_GOV", name: "Gouvernance Données", description: "Qualité, pertinence et documentation des données." },
  { id: "EU_TECH_DOC", name: "Documentation Technique", description: "Dossier technique & enregistrement." },
  { id: "EU_TRANSPARENCY", name: "Transparence", description: "Informations utilisateurs & étiquetage." },
  { id: "EU_HUMAN", name: "Supervision Humaine", description: "Conception & mesures pour supervision efficace." },
  { id: "EU_ROBUSTNESS", name: "Robustesse & Cyber", description: "Résilience, sécurité, précision, logs." },
  { id: "EU_POSTMARKET", name: "Surveillance Post-Marché", description: "Suivi usage réel, incidents, retrait." },
];

const euQ = (id: string, code: string, text: string, categoryId: string, refs: string[]): Question => ({
  id,
  code,
  text,
  categoryId,
  appliesToDepartments: ALL,
  isAI: true,
  weight: 1,
  choices: [0,1,2,3,4,5],
  allowNA: true,
  references: refs,
  evidenceRequiredThreshold: 4,
});

const EUAI_QUESTIONS: Question[] = [
  euQ("EU-RISK-01","RISK-01","Processus structuré de gestion des risques IA (identification → traitement → réévaluation).","EU_RISK_MGMT",["EU AI Act: Art 9"]),
  euQ("EU-RISK-02","RISK-02","Classification des cas IA (interdit, haut risque, limité, minimal) maintenue à jour.","EU_RISK_MGMT",["EU AI Act: Titre II"]),
  euQ("EU-DATA-01","DATA-01","Datasets d’entraînement/test/validation documentés (sources, biais potentiels).","EU_DATA_GOV",["EU AI Act: Art 10"]),
  euQ("EU-DATA-02","DATA-02","Contrôles qualité & représentativité (mesures de biais) exécutés et archivés.","EU_DATA_GOV",["EU AI Act: Art 10"]),
  euQ("EU-DOC-01","DOC-01","Dossier technique complet (architecture, métriques, gestion risques).","EU_TECH_DOC",["EU AI Act: Art 11"],),
  euQ("EU-DOC-02","DOC-02","Registre / enregistrement des systèmes haut risque préparé / soumis.","EU_TECH_DOC",["EU AI Act: Art 51"]),
  euQ("EU-TRANS-01","TRANS-01","Informations utilisateurs (limitations, données, supervision) fournies clairement.","EU_TRANSPARENCY",["EU AI Act: Art 13"]),
  euQ("EU-TRANS-02","TRANS-02","Étiquetage adéquat pour contenus générés (deepfake, IA générative).","EU_TRANSPARENCY",["EU AI Act: Art 52"]),
  euQ("EU-HUM-01","HUM-01","Mesures de supervision humaine définies (intervention, override, compréhension).","EU_HUMAN",["EU AI Act: Art 14"]),
  euQ("EU-HUM-02","HUM-02","Formation des opérateurs/superviseurs sur limitations & risques.","EU_HUMAN",["EU AI Act: Art 14"]),
  euQ("EU-ROB-01","ROB-01","Tests de robustesse, précision & cybersécurité planifiés et rejoués périodiquement.","EU_ROBUSTNESS",["EU AI Act: Art 15"]),
  euQ("EU-ROB-02","ROB-02","Journalisation (logs) suffisante pour traçabilité & audits.","EU_ROBUSTNESS",["EU AI Act: Art 12"]),
  euQ("EU-PM-01","PM-01","Plan de surveillance post-marché (collecte incidents, métriques usage réel).","EU_POSTMARKET",["EU AI Act: Art 61"]),
  euQ("EU-PM-02","PM-02","Procédures de rapport d’incidents graves & retrait mises en œuvre.","EU_POSTMARKET",["EU AI Act: Art 62"]),
];

const EUAI_RULES: ActionRule[] = [
  { id: "R-EU-RISK-LOW", scope: "category", categoryId: "EU_RISK_MGMT", threshold: 2, actions: [
    { horizon: "0-90j", text: "Établir classification cas IA & processus gestion risques.", impact: "H", effort: "M" },
  ]},
  { id: "R-EU-ROB-LOW", scope: "category", categoryId: "EU_ROBUSTNESS", threshold: 2, actions: [
    { horizon: "0-90j", text: "Mettre en place tests robustesse & journalisation centralisée.", impact: "H", effort: "M" },
  ]},
];

export const TEMPLATE_EU_AI_ACT_V1: QuestionnaireTemplate = {
  id: "eu_ai_act_v1",
  name: "EU AI Act Readiness (light)",
  description: "Préparation conformité EU AI Act – exigences clés (version light).",
  assessmentScope: "organization",
  categories: EUAI_CATEGORIES,
  questions: EUAI_QUESTIONS,
  rules: EUAI_RULES,
};

// Final export of all templates (ordering: general → transversal → capabilities → frameworks)
export const TEMPLATES: QuestionnaireTemplate[] = [
  TEMPLATE_CORE_V1,
  TEMPLATE_TRANSVERSAL_V1,
  TEMPLATE_GARTNER_V1,
  TEMPLATE_NIST_AIRMF_V1,
  TEMPLATE_ISO_42001_V1,
  TEMPLATE_EU_AI_ACT_V1,
];
