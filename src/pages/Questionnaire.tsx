import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Questionnaire = () => {
  const nav = useNavigate();
  const { assessment, templateId, templates, setTemplateId, responses, updateResponse } = useAssessment() as any;
  const [editMode, setEditMode] = useState(false);
  // Always operate in preview/browse mode now
  const [previewTemplate, setPreviewTemplate] = useState(templateId || templates[0]?.id);
  const tpl = useMemo(()=> templates.find(t=> t.id === previewTemplate), [templates, previewTemplate]);
  const [tagFilter, setTagFilter] = useState<'ALL' | string>('ALL');
  const allTags = useMemo(()=> Array.from(new Set((tpl?.questions||[]).flatMap((q:any)=> q.tags||[]))).sort(), [tpl]);
  const filteredQuestionsByCat = useMemo(()=> {
    if(!tpl) return {} as Record<string, any[]>;
    const map: Record<string, any[]> = {};
    tpl.categories.forEach(c => { map[c.id] = []; });
    tpl.questions.forEach(q => {
      if(tagFilter!=='ALL') {
        if(!(q.tags||[]).includes(tagFilter)) return;
      }
      map[q.categoryId]?.push(q);
    });
    return map;
  }, [tpl, tagFilter]);
  return (
    <Layout>
      <SEO title="SynapFlow – Modèles" description="Parcourir un modèle de questionnaire IA" canonical={window.location.origin + "/questionnaire"} />
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Modèles de questionnaire</h1>
            <p className="text-xs text-muted-foreground">Sélectionnez un modèle et parcourez ses catégories et questions. (Cette page n'est plus utilisée pour la saisie des réponses.)</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <select className="h-9 border rounded px-2" value={previewTemplate} onChange={e=> setPreviewTemplate(e.target.value)}>
              {templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {tpl?.assessmentScope === 'organization' ? <span className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px]">Organisation</span> : <span className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]">Multi-départements</span>}
            <button className="text-xs underline" onClick={()=> { setTemplateId(previewTemplate); nav('/'); }}>Utiliser ce modèle →</button>
          </div>
        </div>
        {assessment && (
          <div className="flex flex-col gap-2 text-[11px] p-2 rounded border bg-muted/40">
            <div className="flex items-center justify-between">
              <span>Mission active: {assessment.id.slice(0,6)}</span>
              <Button size="sm" variant={editMode? 'secondary':'outline'} className="h-6 text-[11px]" onClick={()=> setEditMode(m=> !m)}>{editMode? 'Terminer édition':'Modifier réponses'}</Button>
            </div>
            {!editMode && <span className="text-muted-foreground">Lecture seule. Cliquez "Modifier réponses" pour activer l’édition.</span>}
            {editMode && <span className="text-amber-600">Mode édition activé – vos changements sont sauvegardés automatiquement.</span>}
          </div>
        )}
        <div className="text-sm text-muted-foreground">{tpl?.description}</div>
        <div className="space-y-6">
          {allTags.length>0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium">Filtres tags:</span>
              <button onClick={()=> setTagFilter('ALL')} className={`px-2 py-1 rounded border ${tagFilter==='ALL' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>Tous ({tpl?.questions.length||0})</button>
              {allTags.map(tg => {
                const t = tg as string;
                const count = (tpl?.questions||[]).filter((q:any)=> (q.tags||[]).includes(t)).length;
                return <button key={t} onClick={()=> setTagFilter(t)} className={`px-2 py-1 rounded border ${tagFilter===t? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{t} ({count})</button>;
              })}
            </div>
          )}
          {tpl?.categories.map(cat => {
            const qs = filteredQuestionsByCat[cat.id] || [];
            if(!qs.length) return null;
            return (
            <div key={cat.id} className="border rounded p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-sm">{cat.name}</h2>
                  <p className="text-xs text-muted-foreground max-w-2xl">{cat.description}</p>
                </div>
              </div>
              <div className="space-y-3">
                {qs.map(q => {
                  const resp = assessment ? responses.find((r:any)=> r.assessmentId===assessment.id && r.questionId===q.id) : null;
                  return (
                    <div key={q.id} className="text-sm border rounded p-3 bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-xs mb-1">{q.code}</div>
                          <div className="text-sm leading-snug">{q.text}</div>
                          {q.guidance && <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{q.guidance}</div>}
                          {q.scaleDescriptors && (
                            <div className="mt-2 border rounded bg-background/60 p-2">
                              <div className="text-[10px] font-medium mb-1">Barème indicatif (0→5)</div>
                              <ul className="space-y-1 text-[10px] list-disc pl-4">
                                {q.scaleDescriptors.map((d:string,idx:number)=>(<li key={idx}><span className="font-semibold">{idx}</span> {d}</li>))}
                              </ul>
                            </div>
                          )}
                          {q.tags && q.tags.length>0 && (
                            <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                              {q.tags.map((tg:string)=>(<span key={tg} className="px-1.5 py-0.5 border rounded bg-background">{tg}</span>))}
                            </div>
                          )}
                          {tpl.assessmentScope==='per-department' && q.appliesToDepartments && q.appliesToDepartments[0] !== 'ALL' && (
                            <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">{q.appliesToDepartments.map((d:any)=> <span key={d} className="px-1.5 py-0.5 rounded bg-border/40">{d}</span>)}</div>
                          )}
                        </div>
                        {editMode && assessment && (
                          <div className="flex flex-col gap-1 items-end w-40 text-[11px]">
                            <div className="flex gap-1">
                              {[0,1,2,3,4,5].map(v=> (
                                <button key={v} onClick={()=> updateResponse({ questionId: q.id, departmentId: assessment.selectedDepartments[0], value: v, isNA: false })} className={`h-6 w-6 border rounded text-xs ${resp && resp.value===v && !resp.isNA ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{v}</button>
                              ))}
                            </div>
                            {q.allowNA && <label className="flex items-center gap-1"><Checkbox checked={resp?.isNA || false} onCheckedChange={(ck)=> updateResponse({ questionId: q.id, departmentId: assessment.selectedDepartments[0], value: null, isNA: !!ck })} /> <span>N/A</span></label>}
                          </div>
                        )}
                        {!editMode && resp && <div className="text-xs px-2 py-1 rounded bg-background border">{resp.isNA? 'N/A' : resp.value}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ); })}
        </div>
      </div>
    </Layout>
  );
};

export default Questionnaire;
