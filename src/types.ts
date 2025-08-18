// Domain types for the Audit de Maturité IA app
export type DepartmentId =
  | "DG"
  | "RH"
  | "DAF"
  | "CDG"
  | "MG"
  | "Sales"
  | "Marketing"
  | "Communication"
  | "Operations"
  | "IT";

export type MaturityLevel = "Initial" | "Émergent" | "Développé" | "Avancé" | "Leader";

export interface Organization {
  id: string;
  name: string;
  sector: string;
  size: string;
  createdAt: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  code: string;
  text: string;
  categoryId: string;
  appliesToDepartments: (DepartmentId | "ALL")[];
  isAI: boolean;
  weight: number;
  choices: number[]; // [0..5]
  allowNA: boolean;
  references: string[];
  evidenceRequiredThreshold: number; // typically 4
  tags?: string[]; // ex: Gouvernance, Ethique
  riskLevel?: RiskLevel; // optional risk criticality for weighting
  guidance?: string; // clarification / aide pour l'évaluateur
  scaleDescriptors?: string[]; // descriptions niveaux 0..5 (longueur = choices.length)
}

export interface Assessment {
  id: string;
  orgId: string;
  assessorName: string;
  assessorEmail: string;
  selectedDepartments: DepartmentId[];
  startedAt: string;
  updatedAt?: string; // last modification timestamp
  completedAt?: string;
  templateId?: string; // template used
  categoriesSnapshot?: Category[]; // preserve state at creation (for historical integrity)
  questionsSnapshot?: Question[];
  rulesSnapshot?: ActionRule[];
  closedDepartments?: DepartmentId[]; // partiellement clôturés
  categoryWeightsSnapshot?: Record<string, number>; // preserve category weights at time of closure if needed
}

export interface ResponseRow {
  id: string;
  assessmentId: string;
  questionId: string;
  departmentId: DepartmentId;
  value: number | null; // 0..5 or null
  isNA: boolean;
  comment?: string;
  evidence?: string; // URL or text
}

export interface Scorecard {
  id: string;
  assessmentId: string;
  categoryScores: Record<string, number>; // 0-100 by categoryId
  departmentScores: Record<DepartmentId, number>; // 0-100
  aiCoreScore: number; // 0-100
  globalScore: number; // 0-100
  maturityLevel: MaturityLevel;
}

export interface ScoreHistoryEntry {
  ts: string; // ISO
  globalScore: number;
}

export type Horizon = "0-90j" | "3-6m" | "6-12m";
export type ImpactLevel = "H" | "M" | "L";
export type EffortLevel = "H" | "M" | "L";

export interface ActionItemDef {
  horizon: Horizon;
  text: string;
  impact: ImpactLevel;
  effort: EffortLevel;
}

export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export interface ActionRule {
  id: string;
  scope: "category" | "question";
  categoryId?: string;
  questionId?: string;
  threshold: number; // e.g. <=2
  actions: ActionItemDef[];
}

export interface PlanItem {
  id?: string; // unique id (added post-initial design)
  ruleId: string;
  horizon: Horizon;
  text: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  linkedTo: { categoryId?: string; questionId?: string };
  status?: ActionStatus; // workflow state
  priorityScore?: number; // computed composite priority
  deficiency?: number; // 0..1 gap severity
  duplicateGroupId?: string; // group identifier if detected duplicate cluster
  justification?: string; // evidence / rationale required when DONE
  roiScore?: number; // impact/effort ratio
  mergedInto?: string; // id of primary action if merged
  actionType?: string; // classification (Governance, Data, Tech, Process, People, Risk)
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PlanSuggestion {
  id: string;
  text: string;
  rationale: string;
  horizon: Horizon;
  impact: ImpactLevel;
  effort: EffortLevel;
  linkedTo: { categoryId?: string; questionId?: string };
}

export interface Plan {
  id: string;
  assessmentId: string;
  items: PlanItem[];
  executiveSummary?: string; // generated concise summary
  suggestions?: PlanSuggestion[]; // complementary suggestions not yet accepted
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description: string;
  assessmentScope: "per-department" | "organization"; // controls UI grouping
  categories: Category[];
  questions: Question[];
  rules: ActionRule[];
  defaultDepartmentWeights?: Partial<Record<DepartmentId, number>>;
}

export interface AppStateSnapshot {
  assessments?: Assessment[]; // historical list of assessments
  organization?: Organization;
  assessment?: Assessment;
  responses: ResponseRow[];
  scorecard?: Scorecard;
  plan?: Plan;
  categories: Category[];
  departments: Department[];
  questions: Question[];
  rules: ActionRule[];
  departmentWeights: Partial<Record<DepartmentId, number>>; // default 1
  templateId?: string; // which questionnaire template is active
  categoryWeights?: Record<string, number>; // custom poids catégories
  scoreHistories?: Record<string, ScoreHistoryEntry[]>; // par assessment
}
