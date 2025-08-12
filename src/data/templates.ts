import { ActionRule, Category, DepartmentId, Question, QuestionnaireTemplate } from "@/types";
import { SEED_CATEGORIES, SEED_QUESTIONS, SEED_RULES } from "@/data/seeds";

const ALL: (DepartmentId | "ALL")[] = ["ALL"]; 

// Template 1: current core IA maturity model
export const TEMPLATE_CORE_V1: QuestionnaireTemplate = {
  id: "core_v1",
  name: "Modèle IA Core",
  description: "Cadre IA core (stratégie, données, MLOps/LLMOps, GenAI, sécurité, conformité, adoption, ROI).",
  categories: SEED_CATEGORIES,
  questions: SEED_QUESTIONS,
  rules: SEED_RULES,
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

const q = (id: string, code: string, text: string, categoryId: string, applies: (DepartmentId|"ALL")[], isAI = false): Question => ({
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
});

const TRANSVERSAL_QUESTIONS: Question[] = [
  // Module transversal (ALL)
  q("TR-01","TR-01","Stratégie digitale formalisée, alignée au plan d’entreprise, objectifs et feuilles de route approuvés.","TRANSVERSAL",ALL,false),
  q("TR-02","TR-02","Portefeuille de cas d’usage digital priorisé avec business cases et sponsors.","TRANSVERSAL",ALL,false),
  q("TR-03","TR-03","Gouvernance (comité digital/IA), rôles et responsabilités clairement définis.","TRANSVERSAL",ALL,false),
  q("TR-04","TR-04","Culture et conduite du changement: plan d’acculturation, rituels, ambassadeurs.","TRANSVERSAL",ALL,false),
  q("TR-05","TR-05","Compétences: référentiel de compétences digitales/IA, plan de formation, mesure d’adoption.","TRANSVERSAL",ALL,false),
  q("TR-06","TR-06","Gouvernance des données: ownership, qualité, catalogage, glossaire, référentiels.","TRANSVERSAL",ALL,false),
  q("TR-07","TR-07","Sécurité et conformité: contrôle des accès, RGPD, gestion des risques, audits.","TRANSVERSAL",ALL,false),
  q("TR-08","TR-08","Architecture et intégration: cloud, API‑first, intégrations entre systèmes clés.","TRANSVERSAL",ALL,false),
  q("TR-09","TR-09","Pilotage de la valeur: objectifs, KPI, ROI et bénéfices mesurés post‑déploiement.","TRANSVERSAL",ALL,false),
  q("TR-10","TR-10","Excellence opérationnelle: process mining/lean, automatisation là où pertinent.","TRANSVERSAL",ALL,false),
  q("TR-11","TR-11","[IA] IA responsable: principes éthiques, DPIA/Risques IA, biais et explicabilité.","TRANSVERSAL",ALL,true),
  q("TR-12","TR-12","[IA] Cycle de vie des modèles: dataOps/MLOps, monitoring, drift, réentraînement.","TRANSVERSAL",ALL,true),

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
  categories: TRANSVERSAL_CATEGORIES,
  questions: TRANSVERSAL_QUESTIONS,
  rules: TRANSVERSAL_RULES,
};

export const TEMPLATES: QuestionnaireTemplate[] = [
  TEMPLATE_CORE_V1,
  TEMPLATE_TRANSVERSAL_V1,
];
