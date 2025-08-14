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
import { upsertAssessment as supaUpsertAssessment, upsertResponses as supaUpsertResponses, listAssessments as supaListAssessments, fetchResponses as supaFetchResponses, saveScorePlan as supaSaveScorePlan } from '@/lib/supabaseStorage';
import { TEMPLATES } from "@/data/templates";

// Simple UUID fallback if uuid package not present
function genId() { try { return uuidv4(); } catch { return Math.random().toString(36).slice(2); } }

const STORAGE_KEY = "audit-ia-state-v1";
const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

interface AssessmentContextValue extends AppStateSnapshot {
  startAssessment: (org: Pick<Organization, "name" | "sector" | "size">, assessor: { name: string; email: string }, selectedDepartments: DepartmentId[], templateId?: string) => void;
  selectAssessment: (id: string) => void;
  closeAssessment: (id: string) => void;
  deleteAssessment: (id: string) => void;
  updateResponse: (payload: Omit<ResponseRow, "id" | "assessmentId"> & { id?: string }) => void;
  computeScores: () => Scorecard;
  generatePlan: (scorecard: Scorecard) => Plan;
  setDepartmentWeight: (dept: DepartmentId, weight: number) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (q: Partial<Question> & { id: string }) => void;
  removeQuestion: (id: string) => void;
  resetAll: () => void;
  answeredRatio: () => number; // 0..1
  getAssessmentProgress: (id: string) => { answered: number; total: number; ratio: number };
  getAssessmentScorecard: (id: string) => Scorecard | undefined;
  templates: typeof TEMPLATES;
  setTemplateId: (id: string) => void;
  templateId: string;
  applyTemplate: (id: string, options?: { reset?: boolean }) => void;
  exportAssessment: (id: string) => void;
  syncAssessment?: (id: string) => Promise<void>;
  pullAssessments?: () => Promise<void>;
  syncState?: { status: 'idle' | 'saving'; lastSyncAt?: string };
}
import { exportJSON } from "@/lib/export";

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<AppStateSnapshot["organization"]>();
  const [assessments, setAssessments] = useState<AppStateSnapshot["assessments"]>([]);
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
  const [syncState, setSyncState] = useState<{ status: 'idle' | 'saving'; lastSyncAt?: string }>({ status: 'idle' });
  const syncDebounceRef = React.useRef<any>();

  // Restore from localStorage
  useEffect(() => {
  const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: AppStateSnapshot = JSON.parse(raw);
  setOrganization(parsed.organization);
  setAssessments(parsed.assessments || []);
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
    // Inject a fictive archived mission if none present
    setAssessments(prev => {
      if (prev.some(a => a.id === 'demo_assessment')) return prev;
      const now = new Date().toISOString();
      const demo: Assessment = {
        id: 'demo_assessment',
        orgId: 'demo_org',
        assessorName: 'Demo',
        assessorEmail: 'demo@example.com',
        selectedDepartments: ['DG'] as any,
        startedAt: now,
        updatedAt: now,
        completedAt: now,
        templateId: TEMPLATES[0]?.id,
        categoriesSnapshot: TEMPLATES[0]?.categories,
        questionsSnapshot: TEMPLATES[0]?.questions,
        rulesSnapshot: TEMPLATES[0]?.rules,
      };
      return [demo, ...prev];
    });
  }, []);

  // Persist to localStorage
  useEffect(() => {
    const snapshot: AppStateSnapshot = {
  organization,
  assessments,
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
  }, [organization, assessments, assessment, responses, scorecard, plan, categories, departments, questions, rules, departmentWeights, templateId]);

  // Initial remote pull if Supabase
  useEffect(()=>{ if(!USE_SUPABASE) return; (async()=>{ try {
      const remote = await supaListAssessments();
      if(remote.length) setAssessments(remote);
    } catch{} })(); }, []);

  // Periodic background sync every 60s for active assessment
  useEffect(()=>{
  const id = setInterval(()=>{ if(assessment && USE_SUPABASE) syncAssessmentInternal(assessment.id); }, 60000);
    return ()=> clearInterval(id);
  }, [assessment]);

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

  const getAssessmentProgress = (id: string) => {
    const a = assessments.find(a => a.id === id) || (assessment && assessment.id === id ? assessment : undefined);
    if (!a) return { answered: 0, total: 0, ratio: 0 };
    const cats = a.categoriesSnapshot || categories;
    const qs = a.questionsSnapshot || questions;
    const total = a.selectedDepartments.reduce((acc, d) => acc + qs.filter(q => (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d)) ).length, 0);
    if (!total) return { answered: 0, total: 0, ratio: 0 };
    const answered = responses.filter(r => r.assessmentId === id && a.selectedDepartments.includes(r.departmentId) && !r.isNA && r.value !== null).length;
    return { answered, total, ratio: answered / total };
  };

  const startAssessment: AssessmentContextValue["startAssessment"] = (org, assessor, selectedDepartments, selectedTemplateId) => {
    const orgId = genId();
    const now = new Date().toISOString();
    const organization = { id: orgId, name: org.name, sector: org.sector, size: org.size, createdAt: now };
    setOrganization(organization);
    const assessment: Assessment = {
      id: genId(), orgId, assessorName: assessor.name, assessorEmail: assessor.email,
      selectedDepartments, startedAt: now, updatedAt: now,
    };
    setAssessment(assessment);
    setAssessments(prev => [assessment, ...prev]);
    // Apply selected template (or keep current if not provided)
    const tpl = TEMPLATES.find(t => t.id === (selectedTemplateId || templateId)) || TEMPLATES[0];
    if (tpl) {
  setCategories(tpl.categories);
  setQuestions(tpl.questions);
  setRules(tpl.rules);
      setTemplateIdState(tpl.id);
  // snapshot for historical integrity
  setAssessments(prev => prev.map(a => a.id===assessment.id ? { ...a, templateId: tpl.id, categoriesSnapshot: tpl.categories, questionsSnapshot: tpl.questions, rulesSnapshot: tpl.rules } : a));
  setAssessment(a => a ? { ...a, templateId: tpl.id } : a);
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
  // trigger debounced cloud sync if enabled
  if (USE_SUPABASE) {
    setSyncState(s => ({ ...s, status: 'saving' }));
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(()=> { if (assessment) syncAssessmentInternal(assessment.id); }, 1200);
  }
  // stamp updatedAt
  setAssessment(a => a ? { ...a, updatedAt: new Date().toISOString() } : a);
  setAssessments(prev => prev.map(a => a.id===assessment.id ? { ...a, updatedAt: new Date().toISOString() } : a));
  };

  function maturityFromScore(score: number): MaturityLevel {
    if (score <= 20) return "Initial";
    if (score <= 40) return "Émergent";
    if (score <= 60) return "Développé";
    if (score <= 80) return "Avancé";
    return "Leader";
  }

  const getAssessmentScorecard = (id: string): Scorecard | undefined => {
    // If current assessment and score already calculated, reuse
    if (assessment && assessment.id === id) {
      try { return scorecard || computeScores(); } catch { return undefined; }
    }
    const a = assessments.find(a => a.id === id);
    if (!a) return undefined;
    const cats = a.categoriesSnapshot || categories;
    const qs = a.questionsSnapshot || questions;
    const selected = a.selectedDepartments;
    const rs = responses.filter(r => r.assessmentId === id);
    if (!qs.length || !cats.length) return undefined;
    const byDeptByCat: Record<DepartmentId, Record<string, number>> = {} as any;
    const byDeptByCatDen: Record<DepartmentId, Record<string, number>> = {} as any;
    selected.forEach(d => { byDeptByCat[d] = {}; byDeptByCatDen[d] = {}; cats.forEach(c=>{byDeptByCat[d][c.id]=0; byDeptByCatDen[d][c.id]=0;}); });
    rs.forEach(r => {
      if (!selected.includes(r.departmentId)) return;
      if (r.isNA || r.value === null) return;
      const q = qs.find(qq => qq.id === r.questionId); if (!q) return;
      byDeptByCat[r.departmentId][q.categoryId] += (r.value||0) * (q.weight||1);
      byDeptByCatDen[r.departmentId][q.categoryId] += (q.weight||1);
    });
    const categoryScores: Record<string, number> = {};
    const departmentScores: Record<DepartmentId, number> = {} as any;
    cats.forEach(cat => {
      let sumPct=0,count=0; selected.forEach(d=>{ const den=byDeptByCatDen[d][cat.id]; if(den>0){ const avg=byDeptByCat[d][cat.id]/den; sumPct += (avg/5)*100; count++; } });
      categoryScores[cat.id] = count? sumPct/count : 0;
    });
    selected.forEach(d => {
      let sumPct=0,count=0; cats.forEach(cat=>{ const den=byDeptByCatDen[d][cat.id]; if(den>0){ const avg=byDeptByCat[d][cat.id]/den; sumPct += (avg/5)*100; count++; }});
      departmentScores[d] = count? sumPct/count : 0;
    });
    const aiCoreScore = cats.length ? (Object.values(categoryScores).reduce((a,b)=>a+b,0)/cats.length) : 0;
    let wSum=0, wx=0; selected.forEach(d => { const w=departmentWeights[d]??1; wSum+=w; wx += (departmentScores[d]||0)*w;});
    const globalScore = wSum? wx/wSum : 0;
    return {
      id: `sc-${id}`,
      assessmentId: id,
      categoryScores,
      departmentScores,
      aiCoreScore,
      globalScore,
      maturityLevel: maturityFromScore(globalScore),
    };
  };

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

  const updateQuestion = (q: Partial<Question> & { id: string }) => {
    setQuestions(prev => prev.map(qq => (qq.id === q.id ? ({ ...qq, ...q } as Question) : qq)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    // Also remove any responses for that question
    setResponses(prev => prev.filter(r => r.questionId !== id));
  };

  const applyTemplate: AssessmentContextValue["applyTemplate"] = (id, options) => {
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    if (options?.reset) {
      setOrganization(undefined);
      setAssessment(undefined);
      setResponses([]);
      setScorecard(undefined);
      setPlan(undefined);
    }
    setCategories(tpl.categories);
    setQuestions(tpl.questions);
    setRules(tpl.rules);
    setTemplateIdState(tpl.id);
    if (assessment) {
      setAssessments(prev => prev.map(a => a.id===assessment.id ? { ...a, templateId: tpl.id } : a));
      setAssessment(a => a ? { ...a, templateId: tpl.id } : a);
    }
  };
  const selectAssessment = (id: string) => {
    const a = assessments.find(a => a.id === id);
    if (!a) return;
    setAssessment(a);
    // restore snapshots if needed
    if (a.categoriesSnapshot && a.questionsSnapshot) {
      setCategories(a.categoriesSnapshot);
      setQuestions(a.questionsSnapshot);
    }
    if (a.rulesSnapshot) setRules(a.rulesSnapshot as any);
    if (a.templateId) setTemplateIdState(a.templateId);
    // Invalidate current scorecard/plan so they recompute for the selected assessment
    setScorecard(undefined);
    setPlan(undefined);
    // If using remote storage, fetch responses for this assessment (they may not be in local state yet)
    if (USE_SUPABASE) {
      (async () => {
        try {
          const remoteRs = await supaFetchResponses(a.id);
          if (remoteRs.length) {
            setResponses(prev => {
              // remove any stale responses for this assessment before adding fresh ones
              const without = prev.filter(r => r.assessmentId !== a.id);
              return [...without, ...remoteRs];
            });
            // force recompute by clearing scorecard again (component using computeScores will regenerate)
            setScorecard(undefined);
            setPlan(undefined);
          }
        } catch (e) {
          // silent: failure just means results will appear empty
        }
      })();
    }
  };

  const closeAssessment = (id: string) => {
    setAssessments(prev => prev.map(a => a.id===id ? { ...a, completedAt: new Date().toISOString() } : a));
    if (assessment?.id === id) setAssessment(a => a ? { ...a, completedAt: new Date().toISOString() } : a);
    if (USE_SUPABASE) setTimeout(()=> syncAssessmentInternal(id), 400);
  };

  const exportAssessment = (id: string) => {
    const a = assessments.find(a => a.id === id) || (assessment && assessment.id === id ? assessment : undefined);
    if (!a) return;
    const cats = a.categoriesSnapshot || categories;
    const qs = a.questionsSnapshot || questions;
    const rs = responses.filter(r => r.assessmentId === a.id);
    let sc: Scorecard | undefined = undefined;
    if (assessment && assessment.id === a.id && scorecard) sc = scorecard;
    let pl: Plan | undefined = undefined;
    if (assessment && assessment.id === a.id && plan) pl = plan;
    const payload = {
      assessment: a,
      categories: cats,
      questions: qs,
      responses: rs,
      scorecard: sc,
      plan: pl,
      templateId: a.templateId,
    };
    exportJSON(payload, `assessment-${a.id.slice(0,6)}.json`);
  };

  const deleteAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
    setResponses(prev => prev.filter(r => r.assessmentId !== id));
    if (assessment?.id === id) {
      setAssessment(undefined);
      setScorecard(undefined);
      setPlan(undefined);
    }
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

  const syncAssessmentInternal = async (id: string) => {
    if(!USE_SUPABASE) return;
    const a = assessments.find(x=>x.id===id) || (assessment?.id===id ? assessment : undefined);
    if(!a) return;
    setSyncState(s => ({ ...s, status: 'saving' }));
    await supaUpsertAssessment(a);
    const rs = responses.filter(r => r.assessmentId === id);
    if (rs.length) await supaUpsertResponses(rs);
    if (scorecard || plan) await supaSaveScorePlan(id, scorecard, plan);
    setSyncState({ status: 'idle', lastSyncAt: new Date().toISOString() });
  };

  const value: AssessmentContextValue = {
  organization,
  assessments,
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
  updateQuestion,
  removeQuestion,
    resetAll,
    answeredRatio,
  getAssessmentProgress,
  getAssessmentScorecard,
  templates: TEMPLATES,
  setTemplateId: (id: string) => setTemplateIdState(id),
  templateId,
  applyTemplate,
  selectAssessment,
  closeAssessment,
  deleteAssessment,
  exportAssessment,
  syncAssessment: async (id: string) => { await syncAssessmentInternal(id); },
  pullAssessments: async () => { if(!USE_SUPABASE) return; const remote = await supaListAssessments(); setAssessments(remote); },
  syncState,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
};
