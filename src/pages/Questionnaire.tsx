import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Questionnaire = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { assessment, templateId, templates, setTemplateId, responses, updateResponse, computeScores, generatePlan, addCustomTemplate, exportTemplate, removeCustomTemplate, updateCustomTemplate, duplicateTemplate } = useAssessment() as any;
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState<string|undefined>();
  const onTemplateFile = (file: File) => {
    setImportError(undefined);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const txt = e.target?.result as string;
        const json = JSON.parse(txt);
        const id = addCustomTemplate?.(json);
        if(!id) { setImportError('Fichier invalide'); return; }
        setTemplateId(id); setPreviewTemplate(id); setShowImport(false);
      } catch { setImportError('JSON non valide'); }
    };
    reader.readAsText(file);
  };
  const [editMode, setEditMode] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  // If URL has ?edit=1 enable edit mode on mount
  useEffect(()=> { const params = new URLSearchParams(location.search); if (params.get('edit')==='1') setEditMode(true); }, [location.search]);
  // Track completion auto-advance
  const tplRef = useMemo(()=> templates.find((t:any)=> t.id=== (templateId || templates[0]?.id)), [templates, templateId]);
  useEffect(()=> {
    if(!assessment || !editMode) return;
    const selected = assessment.selectedDepartments;
    const relevantQs = (tplRef?.questions||[]).filter((q:any)=> selected.some((d:string)=> q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d)));
    const answered = responses.filter((r:any)=> r.assessmentId===assessment.id && !r.isNA && r.value!=null).length;
    const totalNeeded = relevantQs.length * (tplRef?.assessmentScope==='organization' ? 1 : selected.length);
    if(totalNeeded>0 && answered>=totalNeeded && !autoAdvance) {
      setAutoAdvance(true);
      try { const sc = computeScores(); generatePlan(sc); } catch {}
      setTimeout(()=> { nav('/resultats'); setTimeout(()=> nav('/plan'), 400); }, 200);
    }
  }, [responses, assessment, editMode, tplRef, autoAdvance, computeScores, generatePlan, nav]);
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
  const isCustom = previewTemplate.startsWith('custom_');
  const [editingQuestionId, setEditingQuestionId] = useState<string|undefined>();
  const [draftQuestion, setDraftQuestion] = useState<any>(null);
  const startEditQuestion = (q:any) => { setEditingQuestionId(q.id); setDraftQuestion({...q}); };
  const cancelEditQuestion = () => { setEditingQuestionId(undefined); setDraftQuestion(null); };
  const saveQuestion = () => {
    if(!isCustom || !draftQuestion) return;
    updateCustomTemplate?.(previewTemplate, (tpl:any)=> {
      tpl.questions = tpl.questions.map((q:any)=> q.id===draftQuestion.id ? draftQuestion : q);
      return tpl;
    });
    setEditingQuestionId(undefined); setDraftQuestion(null);
  };
  const deleteQuestion = (qid:string) => {
    if(!isCustom) return;
    if(!confirm('Supprimer cette question ?')) return;
    updateCustomTemplate?.(previewTemplate, (tpl:any)=> { tpl.questions = tpl.questions.filter((q:any)=> q.id!==qid); return tpl; });
  };
  const addNewQuestion = (catId:string) => {
    if(!isCustom) return;
    const newQ = { id: 'q_'+Math.random().toString(36).slice(2,9), code: 'NEW-'+(Math.random().toString(36).slice(2,5)).toUpperCase(), categoryId: catId, text: 'Nouvelle question', appliesToDepartments: ['ALL'], isAI: true, weight:1, choices:[0,1,2,3,4,5], allowNA:true, references:[], evidenceRequiredThreshold:4, tags:[] };
    updateCustomTemplate?.(previewTemplate, (tpl:any)=> { tpl.questions = [...tpl.questions, newQ]; return tpl; });
    setEditingQuestionId(newQ.id); setDraftQuestion(newQ);
  };
  const addCategory = () => {
    if(!isCustom) return;
    const newC = { id: 'cat_'+Math.random().toString(36).slice(2,8), name: 'Nouvelle catégorie', description: 'Description...' };
    updateCustomTemplate?.(previewTemplate, (tpl:any)=> { tpl.categories = [...tpl.categories, newC]; return tpl; });
  };
  const renameCategory = (cid:string, name:string) => { if(!isCustom) return; updateCustomTemplate?.(previewTemplate, (tpl:any)=> { tpl.categories = tpl.categories.map((c:any)=> c.id===cid? { ...c, name } : c); return tpl; }); };
  const duplicateCurrent = () => { const id = duplicateTemplate?.(previewTemplate); if(id){ setPreviewTemplate(id); setTemplateId(id); } };
  const updateCategoryDescription = (cid:string, description:string) => { if(!isCustom) return; updateCustomTemplate?.(previewTemplate,(tpl:any)=> { tpl.categories = tpl.categories.map((c:any)=> c.id===cid? { ...c, description }: c); return tpl; }); };
  const deleteCategory = (cid:string) => { if(!isCustom) return; if(!confirm('Supprimer cette catégorie et toutes ses questions ?')) return; updateCustomTemplate?.(previewTemplate,(tpl:any)=> { tpl.categories = tpl.categories.filter((c:any)=> c.id!==cid); tpl.questions = tpl.questions.filter((q:any)=> q.categoryId!==cid); return tpl; }); };
  const duplicateQuestion = (qid:string) => { if(!isCustom) return; updateCustomTemplate?.(previewTemplate,(tpl:any)=> { const q = tpl.questions.find((x:any)=> x.id===qid); if(!q) return tpl; const clone={...q, id:'q_'+Math.random().toString(36).slice(2,9), code:q.code+'-COPY'}; const idx = tpl.questions.findIndex((x:any)=> x.id===qid); const copy=[...tpl.questions]; copy.splice(idx+1,0,clone); tpl.questions=copy; return tpl; }); };
  return (
    <Layout>
      <SEO title="SynapFlow – Modèles" description="Parcourir un modèle de questionnaire IA" canonical={window.location.origin + "/questionnaire"} />
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Modèles de questionnaire</h1>
            <p className="text-xs text-muted-foreground">Sélectionnez un modèle et parcourez ses catégories et questions. (Cette page n'est plus utilisée pour la saisie des réponses.)</p>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
              <select className="h-9 border rounded px-2" value={previewTemplate} onChange={e=> setPreviewTemplate(e.target.value)}>
              {templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {tpl?.assessmentScope === 'organization' ? <span className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px]">Organisation</span> : <span className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]">Multi-départements</span>}
            <button className="text-xs underline" onClick={()=> { setTemplateId(previewTemplate); nav('/'); }}>Utiliser ce modèle →</button>
              <div className="flex items-center gap-1 flex-wrap">
                <button className="text-xs underline" onClick={()=> setShowImport(s=> !s)}>{showImport? 'Annuler import':'Importer'}</button>
                <button className="text-xs underline" onClick={()=> exportTemplate?.(previewTemplate)}>Exporter</button>
                {previewTemplate.startsWith('custom_') && <button className="text-xs underline text-destructive" onClick={()=> { if(confirm('Supprimer ce modèle personnalisé ?')) { removeCustomTemplate?.(previewTemplate); setPreviewTemplate(templates[0]?.id); } }}>Supprimer</button>}
                {isCustom && <button className="text-xs underline" onClick={duplicateCurrent}>Dupliquer</button>}
                {!isCustom && <button className="text-xs underline" onClick={()=> { const id=duplicateTemplate?.(previewTemplate); if(id){ setPreviewTemplate(id); setTemplateId(id);} }}>Copier pour éditer</button>}
              </div>
          </div>
          {showImport && (
            <div className="w-full border rounded p-3 bg-muted/40 flex flex-col gap-2 text-[11px]">
              <div className="font-medium">Importer un modèle (JSON)</div>
              <input type="file" accept="application/json" onChange={e=> { const f=e.target.files?.[0]; if(f) onTemplateFile(f); }} />
              {importError && <div className="text-destructive">{importError}</div>}
              <div className="text-muted-foreground">Structure attendue: {`{"name":"...","assessmentScope":"organization|per-department","categories":[],"questions":[]}`}</div>
            </div>
          )}
        </div>
        {(assessment || isCustom) && (
          <div className="flex flex-col gap-2 text-[11px] p-2 rounded border bg-muted/40">
            <div className="flex items-center justify-between">
              <span>{assessment ? `Mission: ${assessment.id.slice(0,6)}` : 'Édition de modèle'}</span>
              {isCustom && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={editMode? 'secondary':'outline'} className="h-6 text-[11px]" onClick={()=> setEditMode(m=> !m)}>{editMode? 'Terminer':'Modifier'}</Button>
                </div>
              )}
            </div>
            {isCustom && !editMode && <span className="text-muted-foreground">Lecture seule. Cliquez "Modifier" pour activer l’édition.</span>}
            {isCustom && editMode && <span className="text-amber-600">Édition active – sauvegarde auto.</span>}
          </div>
        )}
        <div className="text-sm text-muted-foreground">{tpl?.description}</div>
        <div className="space-y-6">
          {allTags.length>0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium">Filtres tags:</span>
              <button onClick={()=> setTagFilter('ALL')} className={`px-2 py-1 rounded border ${tagFilter==='ALL' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>Tous ({tpl?.questions.length||0})</button>
              {allTags.map(tg => {
                const tagStr = String(tg);
                return (
                  <button key={tagStr} onClick={()=> setTagFilter(tagStr)} className={`px-2 py-1 rounded border ${tagFilter===tagStr ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{tagStr}</button>
                );
              })}
              {isCustom && <button onClick={addCategory} className="h-7 px-3 border rounded text-[11px] bg-background ml-2">+ Catégorie</button>}
            </div>
          )}
          {/* Categories */}
          {tpl?.categories.map(cat => {
            const questions = (filteredQuestionsByCat[cat.id]||[]);
            return (
              <div key={cat.id} className="border rounded p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    {isCustom && editMode ? (
                      <>
                        <input value={cat.name} onChange={e=> renameCategory(cat.id, e.target.value)} className="font-semibold text-sm bg-background border rounded px-2 h-7 w-full" />
                        <textarea value={cat.description} onChange={e=> updateCategoryDescription(cat.id, e.target.value)} rows={2} className="text-xs border rounded p-1 w-full" />
                      </>
                    ) : (
                      <>
                        <h2 className="font-semibold text-sm">{cat.name}</h2>
                        <p className="text-xs text-muted-foreground max-w-2xl">{cat.description}</p>
                      </>
                    )}
                  </div>
                  {isCustom && editMode && (
                    <div className="flex flex-col items-end gap-1 text-[10px]">
                      <div className="flex gap-2">
                        <button className="underline" onClick={()=> addNewQuestion(cat.id)}>+ Question</button>
                        <button className="underline text-destructive" onClick={()=> deleteCategory(cat.id)}>Suppr Cat.</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {questions.length===0 && (
                    <div className="text-[11px] text-muted-foreground">Aucune question{tagFilter!=='ALL' && ' pour ce tag'}.</div>
                  )}
                  {questions.map((q:any)=> {
                    const editing = editingQuestionId===q.id;
                    const resp = assessment ? responses.find((r:any)=> r.assessmentId===assessment.id && r.questionId===q.id) : null;
                    return (
                      <div key={q.id} className="text-sm border rounded p-3 bg-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {editing ? (
                              <div className="space-y-2">
                                <input className="w-full text-xs border rounded px-2 h-7" value={draftQuestion?.code||''} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, code:e.target.value}))} />
                                <textarea className="w-full text-xs border rounded p-2" rows={3} value={draftQuestion?.text||''} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, text:e.target.value}))} />
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <label className="flex flex-col gap-1">Poids
                                    <input type="number" min={1} className="h-7 border rounded px-1" value={draftQuestion?.weight||1} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, weight:Number(e.target.value)||1}))} />
                                  </label>
                                  <label className="flex flex-col gap-1">Risque
                                    <select className="h-7 border rounded px-1" value={draftQuestion?.riskLevel||''} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, riskLevel:e.target.value||undefined}))}>
                                      <option value="">(Aucun)</option>
                                      <option value="HIGH">HIGH</option>
                                      <option value="MEDIUM">MEDIUM</option>
                                      <option value="LOW">LOW</option>
                                    </select>
                                  </label>
                                  <label className="flex flex-col gap-1 col-span-2">Guidance
                                    <textarea rows={2} className="border rounded p-1" value={draftQuestion?.guidance||''} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, guidance:e.target.value}))} />
                                  </label>
                                  <label className="flex flex-col gap-1 col-span-2">Tags (séparés par ,)
                                    <input className="h-7 border rounded px-1" value={(draftQuestion?.tags||[]).join(',')} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, tags:e.target.value.split(',').map((x:string)=> x.trim()).filter(Boolean)}))} />
                                  </label>
                                  <label className="flex flex-col gap-1 col-span-2">Barème (séparer par |)
                                    <input className="h-7 border rounded px-1" value={(draftQuestion?.scaleDescriptors||q.scaleDescriptors||[]).join(' | ')} onChange={e=> setDraftQuestion((dq:any)=> ({...dq, scaleDescriptors:e.target.value.split('|').map((s:string)=> s.trim()).filter(Boolean)}))} />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-xs mb-1">{q.code}</div>
                                <div className="text-sm leading-snug">{q.text}</div>
                                {q.guidance && <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{q.guidance}</div>}
                              </>
                            )}
                            <div className="text-[10px] font-medium mt-2 mb-1">Barème indicatif (0→5)</div>
                            <ul className="space-y-1 text-[10px] list-disc pl-4">
                              {(q.scaleDescriptors||[]).map((d:string,idx:number)=>(<li key={idx}><span className="font-semibold">{idx}</span> {d}</li>))}
                            </ul>
                            {q.tags && q.tags.length>0 && !editing && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                                {q.tags.map((tg:string)=>(<span key={tg} className="px-1.5 py-0.5 border rounded bg-background">{tg}</span>))}
                              </div>
                            )}
                            {tpl.assessmentScope==='per-department' && q.appliesToDepartments && q.appliesToDepartments[0] !== 'ALL' && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">{q.appliesToDepartments.map((d:any)=> <span key={d} className="px-1.5 py-0.5 rounded bg-border/40">{d}</span>)}</div>
                            )}
                          </div>
                          {isCustom && editMode && editing && (
                            <div className="flex flex-col gap-2 w-40 text-[11px] items-end">
                              <button className="h-7 px-2 border rounded bg-emerald-600 text-white" onClick={saveQuestion}>Sauver</button>
                              <button className="h-7 px-2 border rounded" onClick={cancelEditQuestion}>Annuler</button>
                            </div>
                          )}
                          {isCustom && editMode && !editing && (
                            <div className="flex flex-col gap-2 w-32 text-[10px] items-end">
                              <div className="flex gap-1 flex-wrap justify-end">
                                <button className="h-6 px-2 border rounded bg-background" onClick={()=> startEditQuestion(q)}>Éditer</button>
                                <button className="h-6 px-2 border rounded bg-background" onClick={()=> { if(confirm('Supprimer cette question ?')) deleteQuestion(q.id); }}>Suppr.</button>
                                <button className="h-6 px-2 border rounded bg-background" onClick={()=> duplicateQuestion(q.id)}>Dupliquer</button>
                              </div>
                            </div>
                          )}
                          {!isCustom && !editing && resp && <div className="text-xs px-2 py-1 rounded bg-background border">{resp.isNA? 'N/A' : resp.value}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Questionnaire;
