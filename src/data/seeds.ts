import { Category, Department, DepartmentId, Question, ActionRule } from "@/types";

export const SEED_DEPARTMENTS: Department[] = [
  { id: "DG", name: "Direction Générale" },
  { id: "RH", name: "Ressources Humaines" },
  { id: "DAF", name: "Direction Financière (DAF)" },
  { id: "CDG", name: "Contrôle de Gestion" },
  { id: "MG", name: "Moyens Généraux / Achats" },
  { id: "Sales", name: "Ventes / Sales" },
  { id: "Marketing", name: "Marketing" },
  { id: "Communication", name: "Communication" },
  { id: "Operations", name: "Opérations" },
  { id: "IT", name: "DSI / IT" },
];

export const SEED_CATEGORIES: Category[] = [
  { id: "STRAT_GOV", name: "Stratégie & Gouvernance IA", description: "Pilotage, gouvernance et alignement stratégique." },
  { id: "RESP_AI", name: "IA Responsable & Éthique", description: "Éthique, équité, explicabilité et supervision." },
  { id: "DATA_AI", name: "Données pour l’IA", description: "Qualité, catalogue, gouvernance et réutilisabilité." },
  { id: "MLOPS", name: "MLOps / LLMOps", description: "Ingénierie, CI/CD modèles, monitoring et observabilité." },
  { id: "GENAI", name: "IA Générative", description: "Politiques, RAG, évaluation et sécurité." },
  { id: "SEC_PRIV", name: "Sécurité & Confidentialité", description: "Gestion des risques, accès, secrets et protection." },
  { id: "COMPLIANCE", name: "Conformité & Juridique", description: "EU AI Act, RGPD, IP, contrats et auditabilité." },
  { id: "CHANGE", name: "Adoption & Change", description: "Compétences, communautés, usage et support." },
  { id: "VALUE_ROI", name: "Valeur & ROI", description: "Business cases, KPI, portefeuille et itération." },
  { id: "RISK_BCP", name: "Risques & Continuité", description: "Incidents, résilience, SLO/SLA et plans de repli." },
];

const ALL: (DepartmentId | "ALL")[] = ["ALL"];

export const SEED_QUESTIONS: Question[] = [
  // STRAT_GOV (core)
  { id:"Q-STRAT-01", code:"CORE-STRAT-01", text:"Une politique IA formalisée existe (périmètre, objectifs, principes) approuvée par la DG.", categoryId:"STRAT_GOV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST AI RMF","ISO/IEC 42001"], evidenceRequiredThreshold:4 },
  { id:"Q-STRAT-02", code:"CORE-STRAT-02", text:"Un comité de gouvernance IA actif (rôles, RACI, décisions, arbitrages) fonctionne avec un rythme défini.", categoryId:"STRAT_GOV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["ISO/IEC 42001"], evidenceRequiredThreshold:4 },
  { id:"Q-STRAT-03", code:"CORE-STRAT-03", text:"Une feuille de route IA priorisée, alignée à la stratégie, avec business cases et sponsors, est suivie.", categoryId:"STRAT_GOV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST AI RMF"], evidenceRequiredThreshold:4 },
  { id:"Q-STRAT-04", code:"CORE-STRAT-04", text:"L’appétence et la tolérance au risque IA sont définies (cadre d’acceptation, seuils).", categoryId:"STRAT_GOV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST AI RMF"], evidenceRequiredThreshold:4 },

  // RESP_AI
  { id:"Q-RESP-01", code:"CORE-RESP-01", text:"Des principes d’IA responsable sont adoptés (équité, explicabilité, sécurité, supervision humaine).", categoryId:"RESP_AI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["ISO/IEC 23894"], evidenceRequiredThreshold:4 },
  { id:"Q-RESP-02", code:"CORE-RESP-02", text:"Évaluations d’impact (DPIA/RA IA) réalisées pour les cas sensibles avec plans de mitigation.", categoryId:"RESP_AI", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["ISO/IEC 23894","RGPD"], evidenceRequiredThreshold:4 },
  { id:"Q-RESP-03", code:"CORE-RESP-03", text:"Tests de biais/équité et d’explicabilité intégrés au cycle de vie (rapports, seuils).", categoryId:"RESP_AI", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST AI RMF"], evidenceRequiredThreshold:4 },
  { id:"Q-RESP-04", code:"CORE-RESP-04", text:"Traçabilité et documentation des modèles (model cards/datasheets) systématiques.", categoryId:"RESP_AI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["Model Cards"], evidenceRequiredThreshold:4 },

  // DATA_AI
  { id:"Q-DATA-01", code:"CORE-DATA-01", text:"Ownership, qualité et catalogage des données d’entraînement/inférence sont définis.", categoryId:"DATA_AI", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["DAMA-DMBOK"], evidenceRequiredThreshold:4 },
  { id:"Q-DATA-02", code:"CORE-DATA-02", text:"Lineage et versions des datasets sont gérés (auditables).", categoryId:"DATA_AI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["DCAM"], evidenceRequiredThreshold:4 },
  { id:"Q-DATA-03", code:"CORE-DATA-03", text:"Feature store ou jeux de données IA “golden” disponibles et réutilisables.", categoryId:"DATA_AI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-DATA-04", code:"CORE-DATA-04", text:"Politique de données synthétiques/anonymisation établie et appliquée.", categoryId:"DATA_AI", appliesToDepartments:ALL, isAI:true, weight:0.8, choices:[0,1,2,3,4,5], allowNA:true, references:["RGPD"], evidenceRequiredThreshold:4 },

  // MLOPS
  { id:"Q-MLOPS-01", code:"CORE-MLOPS-01", text:"Versioning code/données/modèles (DVC/MLflow/registry) en place.", categoryId:"MLOPS", appliesToDepartments:ALL, isAI:true, weight:1.3, choices:[0,1,2,3,4,5], allowNA:true, references:["MLOps"], evidenceRequiredThreshold:4 },
  { id:"Q-MLOPS-02", code:"CORE-MLOPS-02", text:"CI/CD pour modèles (tests, déploiements contrôlés, approval gates).", categoryId:"MLOPS", appliesToDepartments:ALL, isAI:true, weight:1.3, choices:[0,1,2,3,4,5], allowNA:true, references:["MLOps"], evidenceRequiredThreshold:4 },
  { id:"Q-MLOPS-03", code:"CORE-MLOPS-03", text:"Monitoring perfs et dérive (data/model), alertes et réentraînement documentés.", categoryId:"MLOPS", appliesToDepartments:ALL, isAI:true, weight:1.3, choices:[0,1,2,3,4,5], allowNA:true, references:["MLOps"], evidenceRequiredThreshold:4 },
  { id:"Q-MLOPS-04", code:"CORE-MLOPS-04", text:"Observabilité LLM (latence, tokens, coût, hallucinations) et garde‑fous actifs.", categoryId:"MLOPS", appliesToDepartments:ALL, isAI:true, weight:1.3, choices:[0,1,2,3,4,5], allowNA:true, references:["LLMOps"], evidenceRequiredThreshold:4 },

  // GENAI
  { id:"Q-GENAI-01", code:"CORE-GENAI-01", text:"Politique GenAI (outils autorisés, cas d’usage, données sensibles) communiquée.", categoryId:"GENAI", appliesToDepartments:ALL, isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-GENAI-02", code:"CORE-GENAI-02", text:"Guides de prompt et bonnes pratiques (RAG, chain‑of‑thought, citations) disponibles.", categoryId:"GENAI", appliesToDepartments:ALL, isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-GENAI-03", code:"CORE-GENAI-03", text:"Évaluation GenAI (hallucination, toxicité, sûreté) avec red teaming régulier.", categoryId:"GENAI", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST"], evidenceRequiredThreshold:4 },
  { id:"Q-GENAI-04", code:"CORE-GENAI-04", text:"RAG industriel (sources vérifiées, citations) et mise à jour des index.", categoryId:"GENAI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["RAG"], evidenceRequiredThreshold:4 },

  // SEC_PRIV
  { id:"Q-SEC-01", code:"CORE-SEC-01", text:"Gestion des accès/secrets aux modèles et aux données d’inférence (Zero Trust).", categoryId:"SEC_PRIV", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["ISO 27001"], evidenceRequiredThreshold:4 },
  { id:"Q-SEC-02", code:"CORE-SEC-02", text:"Protection contre prompt injection/exfiltration, filtrage contenu, rate limiting.", categoryId:"SEC_PRIV", appliesToDepartments:ALL, isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["OWASP"], evidenceRequiredThreshold:4 },
  { id:"Q-SEC-03", code:"CORE-SEC-03", text:"Minimisation des données/PII et chiffrement (train/infer).", categoryId:"SEC_PRIV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["RGPD"], evidenceRequiredThreshold:4 },
  { id:"Q-SEC-04", code:"CORE-SEC-04", text:"Environnements de déploiement cloisonnés et journalisés (audit trail).", categoryId:"SEC_PRIV", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["ISO 27001"], evidenceRequiredThreshold:4 },

  // COMPLIANCE
  { id:"Q-COMP-01", code:"CORE-COMP-01", text:"Classification des cas d’usage vs EU AI Act (risque interdit/élevé/limité/minime).", categoryId:"COMPLIANCE", appliesToDepartments:ALL, isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:["EU AI Act"], evidenceRequiredThreshold:4 },
  { id:"Q-COMP-02", code:"CORE-COMP-02", text:"Respect de la propriété intellectuelle/licences des données et outputs IA.", categoryId:"COMPLIANCE", appliesToDepartments:ALL, isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-COMP-03", code:"CORE-COMP-03", text:"Contrats/DPA et due diligence fournisseur pour services IA/LLM.", categoryId:"COMPLIANCE", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-COMP-04", code:"CORE-COMP-04", text:"Conservation des enregistrements (logs, versions, décisions) pour auditabilité.", categoryId:"COMPLIANCE", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  // CHANGE
  { id:"Q-CHANGE-01", code:"CORE-CHANGE-01", text:"Parcours de formation IA par rôle (dirigeants, managers, métiers, IT).", categoryId:"CHANGE", appliesToDepartments:ALL, isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-CHANGE-02", code:"CORE-CHANGE-02", text:"Communauté IA interne (champions), rituels, partage de retours d’expérience.", categoryId:"CHANGE", appliesToDepartments:ALL, isAI:true, weight:0.8, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-CHANGE-03", code:"CORE-CHANGE-03", text:"Mesure de l’adoption (usage, satisfaction, productivité).", categoryId:"CHANGE", appliesToDepartments:ALL, isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-CHANGE-04", code:"CORE-CHANGE-04", text:"Support/assistance IA (SLA, helpdesk, FAQ, coaching).", categoryId:"CHANGE", appliesToDepartments:ALL, isAI:true, weight:0.8, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  // VALUE_ROI
  { id:"Q-ROI-01", code:"CORE-ROI-01", text:"Business cases IA avec baseline et KPI de succès définis avant lancement.", categoryId:"VALUE_ROI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-ROI-02", code:"CORE-ROI-02", text:"Mesure post‑déploiement des bénéfices (ex: lift, économie, NPS).", categoryId:"VALUE_ROI", appliesToDepartments:ALL, isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-ROI-03", code:"CORE-ROI-03", text:"Cycle itératif rapide (from idea to value) avec kill/scale rules.", categoryId:"VALUE_ROI", appliesToDepartments:ALL, isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-ROI-04", code:"CORE-ROI-04", text:"Portfolio management IA priorisé par impact/risque/effort.", categoryId:"VALUE_ROI", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  // RISK_BCP
  { id:"Q-RISK-01", code:"CORE-RISK-01", text:"Supervision humaine (HITL/HOTL) définie pour cas à impact significatif.", categoryId:"RISK_BCP", appliesToDepartments:ALL, isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:["NIST AI RMF"], evidenceRequiredThreshold:4 },
  { id:"Q-RISK-02", code:"CORE-RISK-02", text:"Plans de repli/fallback (désactivation, bascule manuelle) testés.", categoryId:"RISK_BCP", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-RISK-03", code:"CORE-RISK-03", text:"Gestion d’incidents IA (déclaration, résolution, RCA, comms).", categoryId:"RISK_BCP", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-RISK-04", code:"CORE-RISK-04", text:"Résilience/continuité pour services IA (SLO/SLA, redondance, capacité).", categoryId:"RISK_BCP", appliesToDepartments:ALL, isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  // Department-specific examples
  { id:"Q-DG-01", code:"DG-01", text:"Sponsoring exécutif clair pour l’IA (objectifs publics, suivi trimestriel).", categoryId:"STRAT_GOV", appliesToDepartments:["DG"], isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-DG-02", code:"DG-02", text:"Financement du portefeuille IA basé sur la valeur et le risque, avec revues régulières.", categoryId:"VALUE_ROI", appliesToDepartments:["DG"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-DG-03", code:"DG-03", text:"KPI exécutifs IA (productivité, revenus, risques) intégrés aux comités de direction.", categoryId:"VALUE_ROI", appliesToDepartments:["DG"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-RH-01", code:"RH-01", text:"Usage IA dans le recrutement (screening/sourcing) avec audits biais et consentements.", categoryId:"RESP_AI", appliesToDepartments:["RH"], isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["EU AI Act"], evidenceRequiredThreshold:4 },
  { id:"Q-RH-02", code:"RH-02", text:"Assistants IA RH (FAQ, onboarding) avec garde‑fous de confidentialité.", categoryId:"SEC_PRIV", appliesToDepartments:["RH"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["RGPD"], evidenceRequiredThreshold:4 },
  { id:"Q-RH-03", code:"RH-03", text:"People analytics prédictif (attrition/skills) gouverné et actionnable.", categoryId:"VALUE_ROI", appliesToDepartments:["RH"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-DAF-01", code:"DAF-01", text:"Prévisions financières IA avec backtesting et suivi des erreurs.", categoryId:"VALUE_ROI", appliesToDepartments:["DAF"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-DAF-02", code:"DAF-02", text:"Détection d’anomalies/fraude par IA avec processus d’enquête.", categoryId:"SEC_PRIV", appliesToDepartments:["DAF"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-DAF-03", code:"DAF-03", text:"Contrôles internes et piste d’audit complète des transformations IA vers le reporting.", categoryId:"COMPLIANCE", appliesToDepartments:["DAF"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["SOX/ITGC"], evidenceRequiredThreshold:4 },

  { id:"Q-CDG-01", code:"CDG-01", text:"Prévisions par inducteurs dopées IA (volume/mix/coûts) et suivi des écarts.", categoryId:"VALUE_ROI", appliesToDepartments:["CDG"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-CDG-02", code:"CDG-02", text:"Scénarios et stress tests IA, avec prise de décision outillée.", categoryId:"STRAT_GOV", appliesToDepartments:["CDG"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-CDG-03", code:"CDG-03", text:"Self‑service BI certifié avec insights IA et gouvernance des métriques.", categoryId:"DATA_AI", appliesToDepartments:["CDG"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-MG-01", code:"MG-01", text:"Maintenance prédictive (capteurs, anomalies) avec ROI mesuré.", categoryId:"VALUE_ROI", appliesToDepartments:["MG"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-MG-02", code:"MG-02", text:"Optimisation énergétique IA et objectifs carbone suivis.", categoryId:"VALUE_ROI", appliesToDepartments:["MG"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:["ESG"], evidenceRequiredThreshold:4 },
  { id:"Q-MG-03", code:"MG-03", text:"Risque fournisseurs (IA) et spend analytics outillés.", categoryId:"COMPLIANCE", appliesToDepartments:["MG"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-SALES-01", code:"SALES-01", text:"Lead scoring/priorisation IA avec uplift avéré sur conversion.", categoryId:"VALUE_ROI", appliesToDepartments:["Sales"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-SALES-02", code:"SALES-02", text:"Copilot commercial (emails, résumés d’appels) adopté et mesuré.", categoryId:"CHANGE", appliesToDepartments:["Sales"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["LLMOps"], evidenceRequiredThreshold:4 },
  { id:"Q-SALES-03", code:"SALES-03", text:"Next Best Action/pricing dynamique IA avec garde‑fous de conformité.", categoryId:"COMPLIANCE", appliesToDepartments:["Sales"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-MKT-01", code:"MKT-01", text:"Personnalisation/reco IA avec tests contrôlés et lift incrémental mesuré.", categoryId:"VALUE_ROI", appliesToDepartments:["Marketing"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:["Expérimentation"], evidenceRequiredThreshold:4 },
  { id:"Q-MKT-02", code:"MKT-02", text:"Génération de contenus par IA avec garde‑fous de marque et filtres de sûreté.", categoryId:"GENAI", appliesToDepartments:["Marketing"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["Brand Safety"], evidenceRequiredThreshold:4 },
  { id:"Q-MKT-03", code:"MKT-03", text:"Gestion des consentements/DEI dans le ciblage IA (conformité RGPD).", categoryId:"COMPLIANCE", appliesToDepartments:["Marketing"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:["RGPD"], evidenceRequiredThreshold:4 },

  { id:"Q-COM-01", code:"COM-01", text:"Social listening/sentiment IA avec alertes et seuils d’escalade.", categoryId:"VALUE_ROI", appliesToDepartments:["Communication"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-COM-02", code:"COM-02", text:"Assistance IA à la rédaction/modération avec workflow d’approbation.", categoryId:"GENAI", appliesToDepartments:["Communication"], isAI:true, weight:0.9, choices:[0,1,2,3,4,5], allowNA:true, references:["Brand Safety"], evidenceRequiredThreshold:4 },
  { id:"Q-COM-03", code:"COM-03", text:"Gestion de crise appuyée IA (détection signaux faibles, résumés).", categoryId:"RISK_BCP", appliesToDepartments:["Communication"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-OPS-01", code:"OPS-01", text:"Prévision de la demande/planification IA avec amélioration du service level.", categoryId:"VALUE_ROI", appliesToDepartments:["Operations"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-OPS-02", code:"OPS-02", text:"Maintenance et qualité prédictives (faux positifs maîtrisés, CAPA).", categoryId:"VALUE_ROI", appliesToDepartments:["Operations"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },
  { id:"Q-OPS-03", code:"OPS-03", text:"Traçabilité IoT/vision IA avec revue humaine sur cas ambigus.", categoryId:"RESP_AI", appliesToDepartments:["Operations"], isAI:true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4 },

  { id:"Q-IT-01", code:"IT-01", text:"Plateforme IA (LLM gateway, vector DB, feature store) gérée par l’IT.", categoryId:"MLOPS", appliesToDepartments:["IT"], isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["MLOps"], evidenceRequiredThreshold:4 },
  { id:"Q-IT-02", code:"IT-02", text:"Stack de garde‑fous (PII redaction, policy, content filters) pour GenAI.", categoryId:"SEC_PRIV", appliesToDepartments:["IT"], isAI:true, weight:1.2, choices:[0,1,2,3,4,5], allowNA:true, references:["LLMOps"], evidenceRequiredThreshold:4 },
  { id:"Q-IT-03", code:"IT-03", text:"Observabilité IA (coûts, perfs, drift, sécurité) et FinOps pour modèles/LLM.", categoryId:"MLOPS", appliesToDepartments:["IT"], isAI:true, weight:1.1, choices:[0,1,2,3,4,5], allowNA:true, references:["FinOps"], evidenceRequiredThreshold:4 },
];

export const SEED_RULES: ActionRule[] = [
  { id:"R-RESP-LOW", scope:"category", categoryId:"RESP_AI", threshold:2, actions:[
    { horizon:"0-90j", text:"Adopter un cadre d’IA responsable et une checklist biais/explicabilité pour tous les cas d’usage.", impact:"H", effort:"M" },
    { horizon:"3-6m", text:"Mettre en place des évaluations d’impact (DPIA/RA IA) avec seuils de risque et approbations.", impact:"H", effort:"M" },
    { horizon:"6-12m", text:"Standardiser des model cards/datasheets et audits trimestriels.", impact:"M", effort:"M" }
  ]},
  { id:"R-MLOPS-LOW", scope:"category", categoryId:"MLOPS", threshold:2, actions:[
    { horizon:"0-90j", text:"Mettre un registry modèles + versioning données/modèles; définir environnements dev/test/prod.", impact:"H", effort:"M" },
    { horizon:"3-6m", text:"CI/CD modèles avec tests d’acceptation et approvals; monitoring dérive et alertes.", impact:"H", effort:"M" },
    { horizon:"6-12m", text:"Boucles de réentraînement automatisées avec validation et rollbacks.", impact:"M", effort:"M" }
  ]},
  { id:"R-GENAI-LOW", scope:"category", categoryId:"GENAI", threshold:2, actions:[
    { horizon:"0-90j", text:"Publier une politique GenAI (outils approuvés, données sensibles, do/don’t) et guides de prompt.", impact:"H", effort:"L" },
    { horizon:"3-6m", text:"Mettre en place une passerelle LLM avec redaction PII et content filters.", impact:"H", effort:"M" },
    { horizon:"6-12m", text:"Industrialiser RAG (sources vérifiées, citations) et évaluation continue des réponses.", impact:"M", effort:"M" }
  ]},
  { id:"R-SEC-LOW", scope:"category", categoryId:"SEC_PRIV", threshold:2, actions:[
    { horizon:"0-90j", text:"Durcir IAM/secrets, activer filtrage prompt injection/exfiltration, journaliser l’usage.", impact:"H", effort:"M" },
    { horizon:"3-6m", text:"Classification des données, minimisation PII, chiffrement train/infer.", impact:"H", effort:"M" },
    { horizon:"6-12m", text:"Tests de pénétration ciblés IA et revue périodique des accès.", impact:"M", effort:"M" }
  ]},
  { id:"R-ROI-LOW", scope:"category", categoryId:"VALUE_ROI", threshold:2, actions:[
    { horizon:"0-90j", text:"Formaliser business cases avec baseline et KPI; prioriser 3 cas à fort impact.", impact:"H", effort:"L" },
    { horizon:"3-6m", text:"Mettre en place mesure post‑déploiement et revues valeur trimestrielles.", impact:"H", effort:"M" },
    { horizon:"6-12m", text:"Instaurer règles kill/scale et portefeuille IA dynamique.", impact:"M", effort:"M" }
  ]},
];

export const DEPT_DEFAULT_WEIGHTS: Record<DepartmentId, number> = {
  DG: 1,
  RH: 1,
  DAF: 1,
  CDG: 1,
  MG: 1,
  Sales: 1,
  Marketing: 1,
  Communication: 1,
  Operations: 1,
  IT: 1,
};
