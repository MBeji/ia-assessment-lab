import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { useAssessment } from '@/context/AssessmentContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// Focused mission answering UI (no template management)
const Mission = () => {
  const { assessment, responses, updateResponse, computeScores } = useAssessment() as any;
  const [localDept, setLocalDept] = useState<string | null>(null);
  useEffect(()=> { if(assessment && !localDept) setLocalDept(assessment.selectedDepartments[0]); }, [assessment, localDept]);
  const categories = assessment?.categoriesSnapshot || [];
  const questions = assessment?.questionsSnapshot || [];
  const ordered = useMemo(()=> categories.flatMap((c:any)=> questions.filter((q:any)=> q.categoryId===c.id)), [categories, questions]);
  if(!assessment) return <Layout><SEO title="Mission" description="Aucune mission active" canonical={window.location.origin+"/mission"} /><p className="p-6 text-sm text-muted-foreground">Aucune mission sélectionnée.</p></Layout>;
  const isAnswered = (qid:string) => !!responses.find((r:any)=> r.assessmentId===assessment.id && r.questionId===qid && (r.isNA || r.value!=null));
  const answeredCount = ordered.filter(q=> isAnswered(q.id)).length;
  const totalNeeded = ordered.length; // simplified
  const pct = totalNeeded? Math.round((answeredCount/totalNeeded)*100):0;
  return (
    <Layout>
      <SEO title="Mission – Questionnaire" description="Saisie des réponses" canonical={window.location.origin+"/mission"} />
      <div className="max-w-5xl mx-auto py-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Mission {assessment.id.slice(0,6)}</h1>
          <div className="text-[11px] text-muted-foreground">Progression: {answeredCount}/{totalNeeded} ({pct}%)</div>
          <div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{width:pct+'%'}} /></div>
        </div>
        <div className="space-y-5">
          {categories.map((cat:any)=> (
            <div key={cat.id} className="border rounded p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-sm">{cat.name}</h2>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <div className="space-y-3">
                {questions.filter((q:any)=> q.categoryId===cat.id).map((q:any)=> {
                  const resp = responses.find((r:any)=> r.assessmentId===assessment.id && r.questionId===q.id && r.departmentId===assessment.selectedDepartments[0]);
                  return (
                    <div key={q.id} className="border rounded p-3 bg-muted/30 text-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-xs mb-1">{q.code}</div>
                          <div className="mb-2 leading-snug">{q.text}</div>
                          {q.guidance && <div className="text-[11px] text-muted-foreground mt-1">{q.guidance}</div>}
                        </div>
                        <div className="flex flex-col gap-1 items-end w-44 text-[11px]">
                          <div className="flex gap-1 flex-wrap">
                            {[0,1,2,3,4,5].map(v=> (
                              <button key={v} onClick={()=> updateResponse({ questionId: q.id, departmentId: assessment.selectedDepartments[0], value: v, isNA:false })} className={`h-7 w-7 border rounded text-xs ${resp && resp.value===v && !resp.isNA ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{v}</button>
                            ))}
                          </div>
                          {q.allowNA && <label className="flex items-center gap-1"><Checkbox checked={resp?.isNA||false} onCheckedChange={(ck)=> updateResponse({ questionId: q.id, departmentId: assessment.selectedDepartments[0], value:null, isNA:!!ck })} /> <span>N/A</span></label>}
                          {resp && !resp.isNA && <div className="text-[10px] text-muted-foreground">Valeur: {resp.value}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-6 flex justify-between items-center flex-wrap gap-3 text-sm">
          <div className="text-[11px] text-muted-foreground">{pct===100? 'Questionnaire complété.' : 'Complétez toutes les questions pour générer des résultats complets.'}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=> { try { computeScores(); } catch{} window.location.href='/missions'; }}>Sauvegarder & Sortir</Button>
            <Button disabled={pct<10} onClick={()=> { try { computeScores(); } catch{} window.location.href='/resultats'; }}>Voir résultats</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Mission;
