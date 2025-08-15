import { supabase } from './supabaseClient';
import { Assessment, ResponseRow, Scorecard, Plan } from '@/types';

export async function upsertAssessment(a: Assessment) {
  if(!supabase) return;
  const payload: any = {
    id: a.id,
    org_id: a.orgId,
    assessor_name: a.assessorName,
    assessor_email: a.assessorEmail,
    selected_departments: a.selectedDepartments,
    started_at: a.startedAt,
    updated_at: a.updatedAt || null,
    completed_at: a.completedAt || null,
    template_id: a.templateId || null,
    categories_json: a.categoriesSnapshot || null,
    questions_json: a.questionsSnapshot || null,
    rules_json: a.rulesSnapshot || null,
  };
  await supabase.from('assessments').upsert(payload, { onConflict: 'id' });
}

export async function upsertResponses(rows: ResponseRow[]) {
  if(!supabase || !rows.length) return;
  const mapped = rows.map(r => ({
    id: r.id,
    assessment_id: r.assessmentId,
    question_id: r.questionId,
    department_id: r.departmentId,
    value: r.value,
    is_na: r.isNA,
    comment: r.comment || null,
    evidence: r.evidence || null,
  }));
  const size = 500;
  for (let i=0;i<mapped.length;i+=size) {
    await supabase.from('responses').upsert(mapped.slice(i,i+size), { onConflict: 'id' });
  }
}

export async function listAssessments(): Promise<Assessment[]> {
  if(!supabase) return [];
  const { data, error } = await supabase.from('assessments').select('*').order('started_at', { ascending: false });
  if(error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    assessorName: row.assessor_name,
    assessorEmail: row.assessor_email,
    selectedDepartments: row.selected_departments || [],
    startedAt: row.started_at,
    updatedAt: row.updated_at || undefined,
    completedAt: row.completed_at || undefined,
    templateId: row.template_id || undefined,
    categoriesSnapshot: row.categories_json || undefined,
    questionsSnapshot: row.questions_json || undefined,
    rulesSnapshot: row.rules_json || undefined,
  }));
}

export async function fetchResponses(assessmentId: string): Promise<ResponseRow[]> {
  if(!supabase) return [];
  try {
    const { data, error, status } = await supabase.from('responses').select('*').eq('assessment_id', assessmentId);
    if (error) {
      if (status === 404) {
        console.warn('[supabase] table responses 404 – ignorer');
        return [];
      }
      console.warn('[supabase] fetchResponses erreur:', error.message);
      return [];
    }
    return (data||[]).map((r: any) => ({
      id: r.id,
      assessmentId: r.assessment_id,
      questionId: r.question_id,
      departmentId: r.department_id,
      value: r.value,
      isNA: r.is_na,
      comment: r.comment || undefined,
      evidence: r.evidence || undefined,
    }));
  } catch (e:any) {
    console.warn('[supabase] fetchResponses exception:', e?.message || e);
    return [];
  }
}

export async function saveScorePlan(assessmentId: string, scorecard?: Scorecard, plan?: Plan) {
  if(!supabase) return;
  await supabase.from('scoreplans').upsert({
    assessment_id: assessmentId,
    scorecard: scorecard || null,
    plan: plan || null,
    saved_at: new Date().toISOString(),
  }, { onConflict: 'assessment_id' });
}
