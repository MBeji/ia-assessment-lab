import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ActionRule,
  AppStateSnapshot,
  Assessment,
  DepartmentId,
  Organization,
  Plan,
  PlanItem,
  Question,
  ResponseRow,
  Scorecard,
  MaturityLevel,
} from "@/types";
import { DEPT_DEFAULT_WEIGHTS, SEED_CATEGORIES, SEED_DEPARTMENTS, SEED_QUESTIONS, SEED_RULES } from "@/data/seeds";
import { TEMPLATES } from "@/data/templates";

// Simple UUID fallback if uuid package not present
function genId() { try { return uuidv4(); } catch { return Math.random().toString(36).slice(2); } }

const STORAGE_KEY = "audit-ia-state-v1";

interface AssessmentContextValue extends AppStateSnapshot {
  startAssessment: (org: Pick<Organization, "name" | "sector" | "size">, assessor: { name: string; email: string }, selectedDepartments: DepartmentId[], templateId?: string) => void;
  updateResponse: (payload: Omit<ResponseRow, "id" | "assessmentId"> & { id?: string }) => void;
  computeScores: () => Scorecard;
  generatePlan: (scorecard: Scorecard) => Plan;
  setDepartmentWeight: (dept: DepartmentId, weight: number) => void;
  addQuestion: (q: Question) => void;
  resetAll: () => void;
  answeredRatio: () => number; // 0..1
  templates: typeof TEMPLATES;
  setTemplateId: (id: string) => void;
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<AppStateSnapshot["organization"]>();
  const [assessment, setAssessment] = useState<AppStateSnapshot["assessment"]>();
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [categories, setCategories] = useState(SEED_CATEGORIES);
  const [departments, setDepartments] = useState(SEED_DEPARTMENTS);
  const [questions, setQuestions] = useState(SEED_QUESTIONS);
  const [rules, setRules] = useState<ActionRule[]>(SEED_RULES);
  const [departmentWeights, setDepartmentWeights] = useState<AppStateSnapshot["departmentWeights"]>(DEPT_DEFAULT_WEIGHTS);
  const [scorecard, setScorecard] = useState<Scorecard | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [templateId, setTemplateIdState] = useState<string>(TEMPLATES[0]?.id || "");

  // Restore from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: AppStateSnapshot = JSON.parse(raw);
        setOrganization(parsed.organization);
        setAssessment(parsed.assessment);
        setResponses(parsed.responses || []);
        setScorecard(parsed.scorecard);
        setPlan(parsed.plan);
        setCategories(parsed.categories || SEED_CATEGORIES);
        setDepartments(parsed.departments || SEED_DEPARTMENTS);
        setQuestions(parsed.questions || SEED_QUESTIONS);
        setRules(parsed.rules || SEED_RULES);
        setDepartmentWeights(parsed.departmentWeights || DEPT_DEFAULT_WEIGHTS);
  if (parsed.templateId) setTemplateIdState(parsed.templateId);
      } catch {}
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    const snapshot: AppStateSnapshot = {
      organization,
      assessment,
      responses,
      scorecard,
      plan,
      categories,
      departments,
      questions,
      rules,
      departmentWeights,
    templateId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [organization, assessment, responses, scorecard, plan, categories, departments, questions, rules, departmentWeights, templateId]);

  const relevantQuestionIdsByDept = useMemo(() => {
    const map: Record<DepartmentId, string[]> = {
      DG: [], RH: [], DAF: [], CDG: [], MG: [], Sales: [], Marketing: [], Communication: [], Operations: [], IT: [],
    } as Record<DepartmentId, string[]>;
    questions.forEach(q => {
      departments.forEach(d => {
        if (q.appliesToDepartments.includes("ALL") || q.appliesToDepartments.includes(d.id)) {
          map[d.id].push(q.id);
        }
      });
    });
    return map;
  }, [questions, departments]);

  const answeredRatio = () => {
    if (!assessment) return 0;
    const selected = assessment.selectedDepartments;
    const total = selected.reduce((acc, d) => acc + relevantQuestionIdsByDept[d].length, 0);
    if (total === 0) return 0;
    // Only count non-NA answers as progress to avoid 100% when defaults are NA
    const answered = responses.filter(
      r => r.assessmentId === assessment.id && selected.includes(r.departmentId) && !r.isNA && r.value !== null
    ).length;
    return answered / total;
  };

  const startAssessment: AssessmentContextValue["startAssessment"] = (org, assessor, selectedDepartments, selectedTemplateId) => {
    const orgId = genId();
    const now = new Date().toISOString();
    const organization = { id: orgId, name: org.name, sector: org.sector, size: org.size, createdAt: now };
    setOrganization(organization);
    const assessment: Assessment = {
      id: genId(), orgId, assessorName: assessor.name, assessorEmail: assessor.email,
      selectedDepartments, startedAt: now,
    };
    setAssessment(assessment);
    // Apply selected template (or keep current if not provided)
    const tpl = TEMPLATES.find(t => t.id === (selectedTemplateId || templateId)) || TEMPLATES[0];
    if (tpl) {
      setCategories(tpl.categories);
      setQuestions(tpl.questions);
      setRules(tpl.rules);
      setTemplateIdState(tpl.id);
    }
    // Prefill all relevant question/department pairs with default NA responses
    const prefilled: ResponseRow[] = [];
    selectedDepartments.forEach(d => {
      (relevantQuestionIdsByDept[d] || []).forEach(qid => {
        prefilled.push({
          id: genId(),
          assessmentId: assessment.id,
          questionId: qid,
          departmentId: d,
          value: null,
          isNA: true,
        });
      });
    });
    setResponses(prefilled);
    setScorecard(undefined);
    setPlan(undefined);
  };

  const updateResponse: AssessmentContextValue["updateResponse"] = (payload) => {
    if (!assessment) return;
    setResponses(prev => {
      const existingIdx = prev.findIndex(r => r.assessmentId === assessment.id && r.questionId === payload.questionId && r.departmentId === payload.departmentId);
      const base: ResponseRow = {
        id: payload.id || genId(),
        assessmentId: assessment.id,
        questionId: payload.questionId,
        departmentId: payload.departmentId,
        value: payload.value ?? null,
        isNA: payload.isNA,
        comment: payload.comment,
        evidence: payload.evidence,
      };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...base };
        return next;
      }
      return [base, ...prev];
    });
  };

  function maturityFromScore(score: number): MaturityLevel {
    if (score <= 20) return "Initial";
    if (score <= 40) return "Émergent";
    if (score <= 60) return "Développé";
    if (score <= 80) return "Avancé";
    return "Leader";
  }

  const computeScores = (): Scorecard => {
    if (!assessment) throw new Error("Aucune évaluation en cours");
    const selected = assessment.selectedDepartments;

    // Helper: average with weights
    const byDeptByCat: Record<DepartmentId, Record<string, number>> = {} as any;
    const categoryIds = categories.map(c => c.id);
    selected.forEach(d => { byDeptByCat[d] = {}; categoryIds.forEach(cid => (byDeptByCat[d][cid] = 0)); });
    const byDeptByCatDen: Record<DepartmentId, Record<string, number>> = {} as any;
    selected.forEach(d => { byDeptByCatDen[d] = {}; categoryIds.forEach(cid => (byDeptByCatDen[d][cid] = 0)); });

    // aggregate responses
    responses.filter(r => r.assessmentId === assessment.id).forEach(r => {
      if (!selected.includes(r.departmentId)) return;
      const q = questions.find(q => q.id === r.questionId);
      if (!q) return;
      if (r.isNA || r.value === null) return;
      const cat = q.categoryId;
      byDeptByCat[r.departmentId][cat] += (r.value || 0) * (q.weight || 1);
      byDeptByCatDen[r.departmentId][cat] += (q.weight || 1);
    });

    const categoryScores: Record<string, number> = {};
    const departmentScores: Record<DepartmentId, number> = {} as any;

    // per-category score (averaged across departments)
    categories.forEach(cat => {
      let sumPct = 0, count = 0;
      selected.forEach(d => {
        const den = byDeptByCatDen[d][cat.id];
        if (den > 0) {
          const avg = byDeptByCat[d][cat.id] / den; // 0..5
          const pct = (avg / 5) * 100;
          sumPct += pct; count += 1;
        }
      });
      categoryScores[cat.id] = count > 0 ? sumPct / count : 0;
    });

    // per-department score
    selected.forEach(d => {
      let sumPct = 0, count = 0;
      categories.forEach(cat => {
        const den = byDeptByCatDen[d][cat.id];
        if (den > 0) {
          const avg = byDeptByCat[d][cat.id] / den;
          const pct = (avg / 5) * 100;
          sumPct += pct; count += 1;
        }
      });
      departmentScores[d] = count > 0 ? sumPct / count : 0;
    });

    // AI core score: mean of all categories (transverses)
    const aiCoreScore = categories.length ? (
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / categories.length
    ) : 0;

    // global score weighted by department weights
    let wSum = 0, wx = 0;
    selected.forEach(d => { const w = departmentWeights[d] ?? 1; wSum += w; wx += (departmentScores[d] || 0) * w; });
    const globalScore = wSum > 0 ? wx / wSum : 0;

    const sc: Scorecard = {
      id: genId(),
      assessmentId: assessment.id,
      categoryScores,
      departmentScores,
      aiCoreScore,
      globalScore,
      maturityLevel: maturityFromScore(globalScore),
    };
    setScorecard(sc);
    return sc;
  };

  const generatePlan = (sc: Scorecard): Plan => {
    if (!assessment) throw new Error("Aucune évaluation");
    const items: PlanItem[] = [];

    // Build average by category (<=2 triggers)
    const avgByCat: Record<string, number> = {};
    categories.forEach(cat => {
      avgByCat[cat.id] = sc.categoryScores[cat.id] || 0; // already 0..100
    });

    // Category rules: compare to threshold on 0..5 scale => convert
    const pctToLikert = (pct: number) => (pct / 100) * 5;

    rules.forEach(rule => {
      if (rule.scope === "category" && rule.categoryId) {
        const likert = pctToLikert(avgByCat[rule.categoryId] || 0);
        if (likert <= rule.threshold) {
          rule.actions.forEach(a => {
            items.push({ ruleId: rule.id, horizon: a.horizon, text: a.text, impact: a.impact, effort: a.effort, linkedTo: { categoryId: rule.categoryId } });
          });
        }
      }
      if (rule.scope === "question" && rule.questionId) {
        // If any response to that question <= threshold (weighted high?) - simplified: if avg <= threshold
        const q = questions.find(q => q.id === rule.questionId);
        if (!q) return;
        const relevant = responses.filter(r => r.assessmentId === assessment!.id && r.questionId === q.id && !r.isNA && r.value !== null);
        if (relevant.length) {
          const avg = relevant.reduce((a, r) => a + (r.value || 0), 0) / relevant.length;
          if (avg <= rule.threshold) {
            rule.actions.forEach(a => items.push({ ruleId: rule.id, horizon: a.horizon, text: a.text, impact: a.impact, effort: a.effort, linkedTo: { categoryId: q.categoryId, questionId: q.id } }));
          }
        }
      }
    });

    // Sort items by horizon groups later; keep insertion order now
    const plan: Plan = { id: genId(), assessmentId: assessment.id, items };
    setPlan(plan);
    return plan;
  };

  const setDepartmentWeight = (dept: DepartmentId, weight: number) => {
    setDepartmentWeights(prev => ({ ...prev, [dept]: weight }));
  };

  const addQuestion = (q: Question) => {
    setQuestions(prev => [q, ...prev]);
  };

  const resetAll = () => {
    setOrganization(undefined);
    setAssessment(undefined);
    setResponses([]);
    setScorecard(undefined);
    setPlan(undefined);
    setDepartmentWeights(DEPT_DEFAULT_WEIGHTS);
    // keep seeds as-is
  };

  const value: AssessmentContextValue = {
    organization,
    assessment,
    responses,
    scorecard,
    plan,
    categories,
    departments,
    questions,
    rules,
    departmentWeights,
    startAssessment,
    updateResponse,
    computeScores,
    generatePlan,
    setDepartmentWeight,
    addQuestion,
    resetAll,
    answeredRatio,
  templates: TEMPLATES,
  setTemplateId: (id: string) => setTemplateIdState(id),
  templateId,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
};
