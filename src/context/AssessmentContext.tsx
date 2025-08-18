import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from '@/hooks/use-toast';
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
  PlanSuggestion,
  ImpactLevel,
  EffortLevel,
  Horizon,
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
  reopenAssessment?: (id: string) => void;
  deleteAssessment: (id: string) => void;
  updateResponse: (payload: Omit<ResponseRow, "id" | "assessmentId"> & { id?: string }) => void;
  computeScores: () => Scorecard;
  generatePlan: (scorecard: Scorecard) => Plan;
  setDepartmentWeight: (dept: DepartmentId, weight: number) => void;
  setCategoryWeight: (catId: string, weight: number) => void;
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
  exportPlanCSV: (id: string) => void;
  exportPlanXLSX: (id: string) => void;
  generateExecutiveSummary: (id: string) => string | undefined;
  generatePlanSuggestions?: (id: string) => void;
  closeDepartment: (assessmentId: string, dept: DepartmentId) => void;
  reopenDepartment: (assessmentId: string, dept: DepartmentId) => void;
  isDepartmentClosed: (assessmentId: string, dept: DepartmentId) => boolean;
  getScoreHistory: (assessmentId: string) => { ts: string; globalScore: number }[];
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
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});
  const [scorecard, setScorecard] = useState<Scorecard | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [templateId, setTemplateIdState] = useState<string>(TEMPLATES[0]?.id || "");
  const [syncState, setSyncState] = useState<{ status: 'idle' | 'saving'; lastSyncAt?: string }>({ status: 'idle' });
  const syncDebounceRef = React.useRef<any>();
  const [scoreHistories, setScoreHistories] = useState<Record<string, { ts: string; globalScore: number }[]>>({});

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
  if (parsed.categoryWeights) setCategoryWeights(parsed.categoryWeights);
  if (parsed.scoreHistories) setScoreHistories(parsed.scoreHistories);
      } catch {}
    }
    // Inject demo missions (one closed, one open) if absent
    setAssessments(prev => {
      let next = [...prev];
      const tpl = TEMPLATES[0];
      const now = new Date().toISOString();
      if (!next.some(a => a.id === 'demo_assessment') && tpl) {
        const demo: Assessment = {
          id: 'demo_assessment',
          orgId: 'demo_org',
          assessorName: 'Demo',
          assessorEmail: 'demo@example.com',
          selectedDepartments: ['DG'] as any,
          startedAt: now,
          updatedAt: now,
          completedAt: now,
          templateId: tpl.id,
          categoriesSnapshot: tpl.categories,
          questionsSnapshot: tpl.questions,
          rulesSnapshot: tpl.rules,
        };
        // subset of questions for quick sample
        const demoQuestions = (tpl.questions || []).slice(0, 12);
        setResponses(prevR => ([
          ...prevR,
          ...demoQuestions.map((q, idx) => ({
            id: `demo_resp_${idx}`,
            assessmentId: 'demo_assessment',
            questionId: q.id,
            departmentId: 'DG' as any,
            value: (idx % 5) + 1,
            isNA: false,
          }))
        ]));
        next = [demo, ...next];
      }
      if (!next.some(a => a.id === 'demo_assessment2') && tpl) {
        const demo2: Assessment = {
          id: 'demo_assessment2',
          orgId: 'demo_org2',
          assessorName: 'Exemple',
          assessorEmail: 'exemple@example.com',
          selectedDepartments: ['DG'] as any,
          startedAt: now,
          updatedAt: now,
          templateId: tpl.id,
          categoriesSnapshot: tpl.categories,
          questionsSnapshot: tpl.questions,
          rulesSnapshot: tpl.rules,
        };
        // Fill ALL questions with low values 1 or 2
        const allQs = tpl.questions || [];
        setResponses(prevR => ([
          ...prevR,
          ...allQs.map((q, idx) => ({
            id: `demo2_resp_${idx}`,
            assessmentId: 'demo_assessment2',
            questionId: q.id,
            departmentId: 'DG' as any,
            value: (idx % 2) + 1, // alternates 1 / 2
            isNA: false,
          }))
        ]));
        // Put second demo after first for ordering
        next = [demo2, ...next];
      }
      return next;
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
    categoryWeights,
    scoreHistories,
    templateId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [organization, assessments, assessment, responses, scorecard, plan, categories, departments, questions, rules, departmentWeights, categoryWeights, scoreHistories, templateId]);

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
  if (assessment.closedDepartments && assessment.closedDepartments.includes(payload.departmentId)) return; // frozen
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
    const localCatWeights: Record<string, number> = {};
    cats.forEach(c=> localCatWeights[c.id] = categoryWeights[c.id] ?? 1);
    cats.forEach(cat => {
      let sumPct=0,count=0; selected.forEach(d=>{ const den=byDeptByCatDen[d][cat.id]; if(den>0){ const avg=byDeptByCat[d][cat.id]/den; sumPct += (avg/5)*100; count++; } });
      categoryScores[cat.id] = count? sumPct/count : 0;
    });
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
    const catWeights: Record<string, number> = {};
    categories.forEach(c=> catWeights[c.id] = categoryWeights[c.id] ?? 1);
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
    const catWeights2: Record<string, number> = {};
    categories.forEach(c=> catWeights2[c.id] = categoryWeights[c.id] ?? 1);
    categories.forEach(cat => {
      let sumWeighted = 0, weightSum = 0; // we still compute dept average then average; weights apply later at aggregation stage
      let sumPct = 0, count = 0;
      selected.forEach(d => {
        const den = byDeptByCatDen[d][cat.id];
        if (den > 0) {
          const avg = byDeptByCat[d][cat.id] / den; // 0..5
          const pct = (avg / 5) * 100;
          sumPct += pct; count += 1; sumWeighted += pct; weightSum += 1; // same for now
        }
      });
      categoryScores[cat.id] = count > 0 ? sumPct / count : 0;
    });
    const catWeights3: Record<string, number> = {};
    categories.forEach(c=> catWeights3[c.id] = categoryWeights[c.id] ?? 1);
    categories.forEach(cat => {
      let sumPct = 0, count = 0;
      selected.forEach(d2 => { /* noop for dept weight here */ });
    });
    // compute departmentScores with category weights
    selected.forEach(d => {
      let wSumCat=0, wxCat=0;
      categories.forEach(cat => {
        const den = byDeptByCatDen[d][cat.id];
        if (den > 0) {
          const avg = byDeptByCat[d][cat.id] / den;
          const pct = (avg / 5) * 100;
          const w = catWeights3[cat.id] ?? 1;
          wSumCat += w; wxCat += pct * w;
        }
      });
      departmentScores[d] = wSumCat>0 ? wxCat / wSumCat : 0;
    });
    });

    // AI core score: mean of all categories (transverses)
  // Weighted AI core score
  let wCatSum = 0, wCatX = 0;
  categories.forEach(cat => { const w = categoryWeights[cat.id] ?? 1; wCatSum += w; wCatX += (categoryScores[cat.id]||0)*w; });
  const aiCoreScore = wCatSum>0 ? wCatX / wCatSum : 0;

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
    // push score history entry
    setScoreHistories(prev => {
      const list = prev[assessment.id] || [];
      if (list.length && Math.abs(list[list.length-1].globalScore - sc.globalScore) < 0.01) return prev; // avoid duplicates
      return { ...prev, [assessment.id]: [...list, { ts: new Date().toISOString(), globalScore: sc.globalScore }] };
    });
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
      items.push({ id: genId(), ruleId: rule.id, horizon: a.horizon, text: a.text, impact: a.impact, effort: a.effort, linkedTo: { categoryId: rule.categoryId }, status: 'OPEN' });
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
            const deficiency = (rule.threshold - avg) / rule.threshold; // 0..1
            rule.actions.forEach(a => items.push({ id: genId(), ruleId: rule.id, horizon: a.horizon, text: a.text, impact: a.impact, effort: a.effort, linkedTo: { categoryId: q.categoryId, questionId: q.id }, status: 'OPEN', deficiency: Math.max(0, Math.min(1, deficiency)) }));
          }
        }
      }
    });

  // Add deficiency fallback for category-based if missing
    items.forEach(it => {
      if (it.deficiency == null && it.linkedTo.categoryId) {
        const likert = pctToLikert(avgByCat[it.linkedTo.categoryId] || 0);
        it.deficiency = Math.max(0, Math.min(1, (3 - likert) / 3));
      }
    });
    const impactScore = { H: 3, M: 2, L: 1 } as const;
    const effortInverse = { H: 1, M: 2, L: 3 } as const;
    // Classify actionType & compute enhanced priority (includes risk if question has riskLevel)
    const riskWeight: Record<string, number> = { LOW: 1, MEDIUM: 1.15, HIGH: 1.35 };
    items.forEach(it => {
      const base = impactScore[it.impact] * 2 + effortInverse[it.effort];
      const def = it.deficiency ?? 0.5;
      // Derive risk multiplier from underlying question (if any)
      let riskMultiplier = 1;
      if (it.linkedTo.questionId) {
        const q = questions.find(q=> q.id===it.linkedTo.questionId);
        if (q?.riskLevel) riskMultiplier = riskWeight[q.riskLevel] || 1;
      }
      it.priorityScore = parseFloat((base * (0.5 + def) * riskMultiplier).toFixed(2));
      // ROI potentiel simple = impactScore / (effort numeric)
      const effortNum = { L:1, M:2, H:3 }[it.effort];
      it.roiScore = parseFloat((impactScore[it.impact] / effortNum).toFixed(2));
      // heuristic actionType
      const txt = it.text.toLowerCase();
      if (/gouvern|policy|politique|strat|comité|govern/.test(txt)) it.actionType = 'Governance';
      else if (/donn|data|catalog|qualit|lineage|dataset/.test(txt)) it.actionType = 'Data';
      else if (/mlops|devops|pipeline|plateforme|cloud|infra|monitor|observabil/.test(txt)) it.actionType = 'Tech';
      else if (/process|procès|standard|workflow|industrialisation|intake/.test(txt)) it.actionType = 'Process';
      else if (/compétence|formation|culture|accultur|talent|communaut/.test(txt)) it.actionType = 'People';
      else if (/risque|risk|sécur|security|incident|biais|bias|impact/.test(txt)) it.actionType = 'Risk';
      else it.actionType = 'General';
    });
    // Duplicate grouping via simple token Jaccard
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    const tokensCache: Record<string,string[]> = {};
    const tokenSet = (s:string)=> tokensCache[s] || (tokensCache[s] = normalize(s).split(' ').filter(t=>t.length>2));
    let dupGroup = 0;
    for (let i=0;i<items.length;i++) {
      if (items[i].duplicateGroupId) continue;
      const tA = tokenSet(items[i].text);
      const groupIdx: number[] = [i];
      for (let j=i+1;j<items.length;j++) {
        if (items[j].duplicateGroupId) continue;
        const tB = tokenSet(items[j].text);
        const inter = tA.filter(t=> tB.includes(t));
        const union = Array.from(new Set([...tA,...tB]));
        const jaccard = union.length? inter.length/union.length : 0;
        if (jaccard >= 0.5) groupIdx.push(j);
      }
      if (groupIdx.length>1) {
        const gid = 'DUP-'+(++dupGroup);
        groupIdx.forEach(k => items[k].duplicateGroupId = gid);
      }
    }

    // Sort items by horizon groups later; keep insertion order now
    const plan: Plan = { id: genId(), assessmentId: assessment.id, items };
    setPlan(plan);
    return plan;
  };

  const setDepartmentWeight = (dept: DepartmentId, weight: number) => {
    setDepartmentWeights(prev => ({ ...prev, [dept]: weight }));
  };
  const setCategoryWeight = (catId: string, weight: number) => {
    setCategoryWeights(prev => ({ ...prev, [catId]: weight }));
  };

  const closeDepartment = (assessmentId: string, dept: DepartmentId) => {
    setAssessments(prev => prev.map(a => a.id===assessmentId ? { ...a, closedDepartments: Array.from(new Set([...(a.closedDepartments||[]), dept])) } : a));
    if (assessment?.id === assessmentId) setAssessment(a => a ? { ...a, closedDepartments: Array.from(new Set([...(a.closedDepartments||[]), dept])) } : a);
  };
  const reopenDepartment = (assessmentId: string, dept: DepartmentId) => {
    setAssessments(prev => prev.map(a => a.id===assessmentId ? { ...a, closedDepartments: (a.closedDepartments||[]).filter(d=>d!==dept) } : a));
    if (assessment?.id === assessmentId) setAssessment(a => a ? { ...a, closedDepartments: (a.closedDepartments||[]).filter(d=>d!==dept) } : a);
  };
  const isDepartmentClosed = (assessmentId: string, dept: DepartmentId) => {
    const a = assessments.find(x=>x.id===assessmentId) || (assessment?.id===assessmentId ? assessment : undefined);
    return !!a?.closedDepartments?.includes(dept);
  };

  const exportPlanCSV = (id: string) => {
    const a = assessments.find(x=>x.id===id) || (assessment?.id===id ? assessment : undefined);
    if (!a) return;
    const pl = plan && plan.assessmentId===id ? plan : (scorecard && scorecard.assessmentId===id ? generatePlan(scorecard) : undefined);
    if(!pl) return;
    const headers = ['Horizon','Texte','Impact','Effort','Catégorie','Question','Statut','Priorité','Déficit','DoublonGrp'];
    const rows = pl.items.map(it => [
      it.horizon,
      '"'+(it.text.replace(/"/g,'""'))+'"',
      it.impact,
      it.effort,
      it.linkedTo.categoryId||'',
      it.linkedTo.questionId||'',
      it.status||'',
      it.priorityScore!=null? it.priorityScore: '',
      it.deficiency!=null? it.deficiency.toFixed(2):'',
      it.duplicateGroupId||''
    ]);
    const csv = [headers.join(';'), ...rows.map(r=> r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const ael = document.createElement('a'); ael.href=url; ael.download=`plan-${id.slice(0,6)}.csv`; ael.click(); URL.revokeObjectURL(url);
  };

  const exportPlanXLSX = (id: string) => {
    const a = assessments.find(x=>x.id===id) || (assessment?.id===id ? assessment : undefined);
    if (!a) return;
    const pl = plan && plan.assessmentId===id ? plan : (scorecard && scorecard.assessmentId===id ? generatePlan(scorecard) : undefined);
    if(!pl) return;
    // dynamic import xlsx (avoid upfront cost)
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      // Summary sheet
      const total = pl.items.length;
      const done = pl.items.filter(i=> i.status==='DONE').length;
      const inprog = pl.items.filter(i=> i.status==='IN_PROGRESS').length;
      const open = total - done - inprog;
      const summaryData = [
        ['Assessment', a.id.slice(0,8)],
        ['Template', a.templateId||''],
        ['Total actions', total],
        ['Done', done],
        ['In progress', inprog],
        ['Open', open],
        ['Completion %', total? Math.round(100*done/total):0]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      // Actions sheet
      const actionsHeader = ['ID','Horizon','Texte','Impact','Effort','Statut','Priorité','Déficit','Catégorie','Question','DoublonGrp'];
      const actionsRows = pl.items.map(it => [it.id||'', it.horizon, it.text, it.impact, it.effort, it.status||'', it.priorityScore||'', it.deficiency!=null? (it.deficiency*100).toFixed(0)+'%':'', it.linkedTo.categoryId||'', it.linkedTo.questionId||'', it.duplicateGroupId||'']);
      const wsActions = XLSX.utils.aoa_to_sheet([actionsHeader, ...actionsRows]);
      XLSX.utils.book_append_sheet(wb, wsActions, 'Actions');
      // Criticalities sheet (group by duplicate group / priority)
      const crit = [...pl.items].sort((a,b)=> (b.priorityScore||0)-(a.priorityScore||0)).map(i => [i.id, i.priorityScore, i.deficiency, i.impact, i.effort, i.duplicateGroupId||'', i.text]);
      const wsCrit = XLSX.utils.aoa_to_sheet([['ID','Priorité','Déficit','Impact','Effort','Groupe','Texte'], ...crit]);
      XLSX.utils.book_append_sheet(wb, wsCrit, 'Criticités');
      const fname = `plan-${id.slice(0,6)}.xlsx`;
      XLSX.writeFile(wb, fname);
    }).catch(()=>{});
  };

  const generateExecutiveSummary = (id: string) => {
    const a = assessments.find(x=>x.id===id) || (assessment?.id===id ? assessment : undefined);
    if(!a) return;
    const sc = scorecard && scorecard.assessmentId===id ? scorecard : (a.id===assessment?.id ? scorecard : undefined);
    const pl = plan && plan.assessmentId===id ? plan : undefined;
    if(!sc || !pl) return;
    // Derive top 3 strengths (highest categories) and top 3 gaps (lowest categories)
    const catScores = Object.entries(sc.categoryScores).map(([cid,val])=>({ cid, val }));
    catScores.sort((a,b)=> b.val - a.val);
    const strengths = catScores.slice(0,3);
    const gaps = [...catScores].reverse().slice(0,3);
    // High priority actions (top 5 by priorityScore)
    const high = [...pl.items].sort((a,b)=> (b.priorityScore||0)-(a.priorityScore||0)).slice(0,5);
    const fmtCat = (cid:string)=> (categories.find(c=>c.id===cid)?.name)||cid;
    const lines: string[] = [];
    lines.push(`Mission ${id.slice(0,6)} – Synthèse exécutive`);
    lines.push(`Score global: ${Math.round(sc.globalScore)}% · Maturité: ${sc.maturityLevel}`);
    lines.push(`Forces: ${strengths.map(s=> fmtCat(s.cid)+` (${Math.round(s.val)}%)`).join('; ')}`);
    lines.push(`Faiblesses: ${gaps.map(s=> fmtCat(s.cid)+` (${Math.round(s.val)}%)`).join('; ')}`);
    lines.push(`Actions prioritaires (top 5):`);
    high.forEach((a,i)=> lines.push(`${i+1}. ${a.text} [${a.horizon}] (P=${a.priorityScore ?? '-'}, ROI=${a.roiScore ?? '-'})`));
    const summary = lines.join('\n');
    // persist into plan
    setPlan(prev => prev && prev.assessmentId===id ? { ...prev, executiveSummary: summary } : prev);
    return summary;
  };

  const generatePlanSuggestions = (id: string) => {
    const a = assessments.find(x=>x.id===id) || (assessment?.id===id ? assessment : undefined);
    if(!a) return;
    const sc = scorecard && scorecard.assessmentId===id ? scorecard : (a.id===assessment?.id ? scorecard : undefined);
    if(!sc) return;
    const pl = plan && plan.assessmentId===id ? plan : undefined;
    if(!pl) return;
    // Heuristic: for lowest scoring categories (<55%), propose up to 2 generic improvement suggestions based on low-scoring questions (<3 likert)
    const catScoresArr = Object.entries(sc.categoryScores).sort((a,b)=> a[1]-b[1]);
    const lowCats = catScoresArr.filter(([_,v])=> v < 55).slice(0,4);
    const existingTexts = new Set(pl.items.map(i=> i.text.toLowerCase()));
    const suggestions: PlanSuggestion[] = [];
    lowCats.forEach(([cid, pct]) => {
      const catQuestions = (a.questionsSnapshot||questions).filter(q=> q.categoryId===cid);
      // compute avg per question across depts
      const qScores = catQuestions.map(q => {
        const rs = responses.filter(r => r.assessmentId===a.id && r.questionId===q.id && !r.isNA && r.value!=null);
        const avg = rs.length? rs.reduce((s,r)=> s+(r.value||0),0)/rs.length : 0;
        return { q, avg };
      }).filter(x=> x.avg>0);
      qScores.sort((a,b)=> a.avg - b.avg);
      qScores.slice(0,2).forEach(({q, avg}) => {
        const base = q.text.split(/[:.!?]/)[0].trim();
        if(existingTexts.has(base.toLowerCase())) return;
        const impact: ImpactLevel = 'H';
        const effort: EffortLevel = 'M';
        const horizon: Horizon = pct < 40 ? '0-90j' : '3-6m';
        suggestions.push({
          id: genId(),
          text: `Améliorer ${base}`,
          rationale: `Question faible (${avg.toFixed(1)}/5) dans catégorie à ${Math.round(pct)}%`,
          horizon,
          impact,
          effort,
          linkedTo: { categoryId: cid, questionId: q.id }
        });
      });
    });
    setPlan(prev => prev && prev.assessmentId===id ? { ...prev, suggestions } : prev);
  };

  const getScoreHistory = (assessmentId: string) => scoreHistories[assessmentId] || [];

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
    // If no responses exist locally for this assessment (e.g., demo), prefill NA responses for all relevant question/department pairs
    setResponses(prev => {
      const existing = prev.filter(r => r.assessmentId === a.id);
      if (existing.length > 0) return prev; // nothing to do
      const qs = (a.questionsSnapshot || questions).filter(q => q);
      const depts = a.selectedDepartments;
      const filled: ResponseRow[] = [];
      depts.forEach(d => {
        qs.forEach(q => {
          if (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d)) {
            filled.push({
              id: genId(),
              assessmentId: a.id,
              questionId: q.id,
              departmentId: d,
              value: null,
              isNA: true,
            });
          }
        });
      });
      return [...prev, ...filled];
    });
    // If using remote storage, fetch responses for this assessment (they may not be in local state yet)
    if (USE_SUPABASE) {
      (async () => {
        try {
          const remoteRs = await supaFetchResponses(a.id);
          if (remoteRs.length) {
            setResponses(prev => {
              const without = prev.filter(r => r.assessmentId !== a.id);
              return [...without, ...remoteRs];
            });
            setScorecard(undefined);
            setPlan(undefined);
          }
        } catch (e: any) {
          if (e?.message?.includes('404') || e?.status === 404) {
            console.warn('[supabase] Table responses introuvable ou non accessible (404) – utilisation du mode local uniquement.');
          } else {
            console.warn('[supabase] Échec fetch responses:', e);
          }
        }
      })();
    }
  };

  const closeAssessment = (id: string) => {
    setAssessments(prev => prev.map(a => a.id===id ? { ...a, completedAt: new Date().toISOString() } : a));
    if (assessment?.id === id) setAssessment(a => a ? { ...a, completedAt: new Date().toISOString() } : a);
    if (USE_SUPABASE) setTimeout(()=> syncAssessmentInternal(id), 400);
  try { toast({ title: 'Mission clôturée', description: id.slice(0,6) }); } catch {}
  };

  const reopenAssessment = (id: string) => {
    setAssessments(prev => prev.map(a => a.id===id ? { ...a, completedAt: undefined } : a));
    if (assessment?.id === id) setAssessment(a => a ? { ...a, completedAt: undefined } : a);
    if (USE_SUPABASE) setTimeout(()=> syncAssessmentInternal(id), 400);
  try { toast({ title: 'Mission réouverte', description: id.slice(0,6) }); } catch {}
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
  try { toast({ title: 'Export JSON', description: 'Fichier prêt ('+a.id.slice(0,6)+')' }); } catch {}
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
    setCategoryWeight,
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
  reopenAssessment,
  deleteAssessment,
  exportAssessment,
  exportPlanCSV,
  exportPlanXLSX,
  generateExecutiveSummary,
  generatePlanSuggestions,
  closeDepartment,
  reopenDepartment,
  isDepartmentClosed,
  getScoreHistory,
  categoryWeights,
  scoreHistories,
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
