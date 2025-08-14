import { useMemo, useState, useEffect, useCallback } from "react";
import { schedulePrefetchCharts } from "@/lib/prefetchCharts";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const likert = [0,1,2,3,4,5];
const labels: Record<number, string> = {
  0: 'Inexistant', 1: 'Ad hoc', 2: 'Basique', 3: 'Standardisé', 4: 'Intégré/Mesuré', 5: 'Optimisé/Automatisé'
};

const evidenceHintsByCategory: Record<string, string[]> = {
  VISION_STRATEGY: ["Stratégie IA approuvée (PDF)", "OKR IA", "Feuille de route 12-24m"],
  DATA_FOUNDATION: ["Catalogue de données", "Politique qualité", "Processus gouvernance"],
  LIFECYCLE_MLOPS: ["Pipeline CI/CD YAML", "Model card exemple", "Dashboard monitoring"],
  GOV_RISK_SEC: ["Politique IA responsable", "Registre risques", "Procédure incident"],
  VALUE_CULTURE: ["Business case template", "Mesures adoption", "Plan conduite changement"],
};
const heatColors = ['bg-red-200','bg-orange-200','bg-amber-200','bg-yellow-200','bg-lime-200','bg-emerald-200'];

const Questionnaire = () => {
  const nav = useNavigate();
  const { assessment, categories, questions, updateResponse, responses, answeredRatio, computeScores, departments, templateId, templates, syncState, setTemplateId } = useAssessment() as any;
  const [activeDept, setActiveDept] = useState(assessment?.selectedDepartments[0]);
  const [step, setStep] = useState(0); // category index (org-level only)
  const activeTemplate = useMemo(()=> templates.find(t => t.id === templateId), [templates, templateId]);
  const orgLevel = activeTemplate?.assessmentScope === 'organization';
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const [tableView, setTableView] = useState(false); // vue tableur
  const [focusMode, setFocusMode] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0); // index dans currentList
  const [filterMode, setFilterMode] = useState<'all'|'unanswered'|'missingComment'|'missingEvidence'>('all');
  const [showCoherence, setShowCoherence] = useState(false);
  useEffect(()=> { schedulePrefetchCharts(); }, []);

  // Progress per category (current dept or org)
  const categoryProgress = useMemo(()=>{
    if (!assessment) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    categories.forEach(cat => {
      const catQuestions = orgLevel ? questions.filter(q=>q.categoryId===cat.id) : questions.filter(q=> q.categoryId===cat.id && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(activeDept as any)));
      const answered = catQuestions.filter(q => {
        if (orgLevel) {
          const d = assessment.selectedDepartments[0];
          const r = responses.find(r=> r.assessmentId===assessment.id && r.questionId===q.id && r.departmentId===d);
          return r && !r.isNA && r.value !== null;
        } else {
          const r = responses.find(r=> r.assessmentId===assessment.id && r.questionId===q.id && r.departmentId===activeDept);
          return r && !r.isNA && r.value !== null;
        }
      }).length;
      map[cat.id] = catQuestions.length ? answered / catQuestions.length : 0;
    });
    return map;
  }, [assessment, categories, questions, responses, activeDept, orgLevel]);

  const toggleCollapse = (catId: string) => setCollapsedCats(c => ({ ...c, [catId]: !c[catId] }));

  const relevantQuestionsByDept = useMemo(() => {
    const map: Record<string, Record<string, typeof questions>> = {};
    (assessment?.selectedDepartments || []).forEach(d => {
      const byCat: Record<string, typeof questions> = {} as any;
      categories.forEach(c => {
        byCat[c.id] = questions.filter(q => q.categoryId === c.id && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d)));
      });
      map[d] = byCat;
    });
    return map;
  }, [assessment?.selectedDepartments, categories, questions]);

  if (!assessment) {
    // Preview mode: allow selecting a template and browsing its questions without creating an assessment
    const [previewTemplate, setPreviewTemplate] = useState(templateId || templates[0]?.id);
    const tpl = templates.find(t=> t.id === previewTemplate);
    return (
      <Layout>
        <SEO title="SynapFlow – Modèles" description="Parcourir un modèle de questionnaire IA" canonical={window.location.origin + "/questionnaire"} />
        <div className="max-w-5xl mx-auto space-y-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Parcourir un modèle</h1>
              <p className="text-xs text-muted-foreground">Consultez les catégories & questions sans lancer une mission.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select className="h-9 border rounded px-2" value={previewTemplate} onChange={e=> setPreviewTemplate(e.target.value)}>
                {templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {tpl?.assessmentScope === 'organization' ? <span className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px]">Organisation</span> : <span className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]">Multi-départements</span>}
              <button className="text-xs underline" onClick={()=> { setTemplateId(previewTemplate); nav('/'); }}>Utiliser ce modèle →</button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{tpl?.description}</div>
          <div className="space-y-4">
            {tpl?.categories.map(cat => (
              <div key={cat.id} className="border rounded p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-sm">{cat.name}</h2>
                    <p className="text-xs text-muted-foreground max-w-2xl">{cat.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {tpl.questions.filter(q=> q.categoryId===cat.id).map(q => (
                    <div key={q.id} className="text-sm border rounded p-3 bg-muted/30">
                      <div className="font-medium text-xs mb-1">{q.code}</div>
                      <div className="text-sm leading-snug">{q.text}</div>
                      {tpl.assessmentScope==='per-department' && q.appliesToDepartments && q.appliesToDepartments[0] !== 'ALL' && (
                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">{q.appliesToDepartments.map((d:any)=> <span key={d} className="px-1.5 py-0.5 rounded bg-border/40">{d}</span>)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const currentCategory = categories[step];
  let baseList = orgLevel
    ? questions.filter(q => q.categoryId === currentCategory.id)
    : (activeDept ? relevantQuestionsByDept[activeDept][currentCategory.id] : []);

  // apply filters
  const currentList = baseList.filter(q => {
    if (!assessment) return false;
    const dept = orgLevel ? assessment.selectedDepartments[0] : activeDept!;
    const r = responses.find(r=> r.assessmentId===assessment.id && r.departmentId===dept && r.questionId===q.id);
    if (filterMode==='unanswered') return !(r && !r.isNA && r.value !== null);
    if (filterMode==='missingComment') return r && !r.comment;
    if (filterMode==='missingEvidence') {
      const val = r?.isNA ? null : r?.value;
      const need = (val ?? -1) >= q.evidenceRequiredThreshold;
      return need && !r?.evidence;
    }
    return true;
  });

  // focus safety
  useEffect(()=> { if (focusIndex >= currentList.length) setFocusIndex(0); }, [currentList, focusIndex]);

  // beforeunload warn
  useEffect(()=>{
    const handler = (e: BeforeUnloadEvent) => {
      const pct = Math.round(answeredRatio()*100);
      if (pct < 90) { e.preventDefault(); e.returnValue=''; }
    };
    window.addEventListener('beforeunload', handler);
    return ()=> window.removeEventListener('beforeunload', handler);
  }, [answeredRatio]);

  // keyboard shortcuts for likert + navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!focusMode) return;
    if (['0','1','2','3','4','5','n','N'].includes(e.key)) {
      const q = currentList[focusIndex];
      if (!q || !assessment) return;
      const dept = orgLevel ? assessment.selectedDepartments[0] : activeDept!;
      if (e.key.toLowerCase()==='n') updateResponse({ questionId: q.id, departmentId: dept as any, value: null, isNA: true });
      else updateResponse({ questionId: q.id, departmentId: dept as any, value: Number(e.key), isNA: false });
    }
    if (e.key==='ArrowRight') setFocusIndex(i=> Math.min(currentList.length-1, i+1));
    if (e.key==='ArrowLeft') setFocusIndex(i=> Math.max(0, i-1));
  }, [focusMode, currentList, focusIndex, assessment, activeDept, orgLevel, updateResponse]);
  useEffect(()=>{ window.addEventListener('keydown', handleKey); return ()=> window.removeEventListener('keydown', handleKey); }, [handleKey]);

  // coherence assistant: simple rule compare avg of two groups
  const coherenceFlags = useMemo(()=>{
    if (!assessment) return [] as string[];
    // Example: if GOV_RISK_SEC avg >=4 and LIFECYCLE_MLOPS avg <=2 flag
    const avgCat = (catId: string) => {
      const qs = questions.filter(q=>q.categoryId===catId);
      if(!qs.length) return 0;
      const dept = orgLevel ? assessment.selectedDepartments[0] : activeDept!;
      const vals = qs.map(q=> responses.find(r=> r.assessmentId===assessment.id && r.departmentId===dept && r.questionId===q.id))
        .filter(r=> r && !r.isNA && r.value!==null)
        .map(r=> r!.value as number);
      if(!vals.length) return 0; return vals.reduce((a,b)=>a+b,0)/vals.length;
    };
    const flags: string[] = [];
    const gov = avgCat('GOV_RISK_SEC');
    const ml = avgCat('LIFECYCLE_MLOPS');
    if (gov >=4 && ml <=2) flags.push("Maturité gouvernance élevée mais cycle de vie ML faible — vérifier cohérence." );
    return flags;
  }, [assessment, responses, questions, activeDept, orgLevel]);

  const onSet = (questionId: string, dept: string, value: number | null, isNA: boolean) => {
    updateResponse({ questionId, departmentId: dept as any, value, isNA });
  };

  const respFor = (qid: string, dept?: string) => responses.find(r => r.assessmentId === assessment.id && r.departmentId === (dept || activeDept) && r.questionId === qid);

  const onResults = () => {
    computeScores();
    nav('/resultats');
  };

  return (
    <Layout>
  <SEO title="SynapFlow – Questionnaire" description="Répondez au questionnaire par département et catégorie." canonical={window.location.origin + "/questionnaire"} />
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Questionnaire — {activeTemplate?.name}</h1>
            <p className="text-xs text-muted-foreground">Mode: {orgLevel ? 'Organisation (thèmes seulement)' : 'Par département'} · Départements: {assessment.selectedDepartments.join(', ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-56">
              <Progress value={Math.round(answeredRatio()*100)} />
              <p className="text-xs mt-1 text-muted-foreground">Progression globale: {Math.round(answeredRatio()*100)}%</p>
            </div>
            <div className="text-xs flex items-center gap-1">
              {syncState?.status==='saving' ? <span className="animate-pulse">💾</span> : <span>✅</span>}
              <span>{syncState?.status==='saving' ? 'Sauvegarde...' : syncState?.lastSyncAt ? 'Sauvé' : ''}</span>
            </div>
            <Button variant="outline" size="sm" onClick={()=> nav('/')}>Terminer plus tard</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button className="px-2 py-1 border rounded" onClick={()=> setTableView(v=>!v)}>{tableView ? 'Vue formulaire' : 'Vue tableur'}</button>
          <button className={`px-2 py-1 border rounded ${focusMode?'bg-primary text-primary-foreground':''}`} onClick={()=> setFocusMode(f=>!f)}>{focusMode ? 'Quitter focus' : 'Mode focus'}</button>
          <select className="h-7 border rounded px-1" value={filterMode} onChange={e=> setFilterMode(e.target.value as any)}>
            <option value="all">Toutes</option>
            <option value="unanswered">Non répondues</option>
            <option value="missingComment">Sans commentaire</option>
            <option value="missingEvidence">Preuve manquante</option>
          </select>
          <button className="px-2 py-1 border rounded" onClick={()=> setShowCoherence(c=>!c)}>Cohérence</button>
          {focusMode && <span>Raccourcis: 0–5, N = N/A, ← → navigation</span>}
        </div>
        {showCoherence && coherenceFlags.length>0 && (
          <div className="text-xs mt-2 p-2 rounded border bg-amber-50 text-amber-800">
            {coherenceFlags.map((f,i)=> <div key={i}>⚠️ {f}</div>)}
          </div>
        )}
        {orgLevel && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Catégories">
            {categories.map((c, idx) => {
              const pct = Math.round((categoryProgress[c.id] || 0) * 100);
              return (
                <button key={c.id} onClick={()=> setStep(idx)} className={`px-3 py-1 rounded border text-xs whitespace-nowrap flex flex-col items-start min-w-[120px] ${step===idx ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}> 
                  <span className="font-medium truncate max-w-[100px]">{idx+1}. {c.name}</span>
                  <span className="text-[10px] opacity-80">{pct}%</span>
                  <div className="h-1 w-full bg-border rounded mt-0.5">
                    <div className="h-full bg-green-500 rounded" style={{width: pct + '%'}} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!orgLevel && (
        <div className="flex items-center gap-3 mb-2">
          <Label className="text-sm">Départements concernés</Label>
          <Select value={activeDept} onValueChange={(v)=> setActiveDept(v as any)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choisir un département" />
            </SelectTrigger>
            <SelectContent>
              {assessment.selectedDepartments.map(d => (
                <SelectItem key={d} value={d}>{departments.find(dd=>dd.id===d)?.name || d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

  {orgLevel ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{currentCategory.name}</CardTitle>
                  <CardDescription>{currentCategory.description}</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={()=> toggleCollapse(currentCategory.id)}>{collapsedCats[currentCategory.id] ? 'Déplier' : 'Replier'}</Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Catégorie {step+1}/{categories.length}</span>
                <span>· Progression {Math.round((categoryProgress[currentCategory.id]||0)*100)}%</span>
              </div>
            </CardHeader>
            {!collapsedCats[currentCategory.id] && (
            <CardContent className="space-y-6">
              {focusMode ? currentList.slice(focusIndex, focusIndex+1).map((q,idx) => {
                const absoluteIndex = focusIndex;
                const d = assessment.selectedDepartments[0];
                const resp = respFor(q.id, d);
                const val = resp?.isNA ? null : (resp?.value ?? null);
                const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                const hintList = evidenceHintsByCategory[q.categoryId] || [];
                return (
                  <div key={q.id} className="space-y-4 p-4 border rounded relative focus:ring-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{absoluteIndex+1}. {q.code} — {q.text}</div>
                      <div className="text-[10px]">Question {absoluteIndex+1}/{currentList.length}</div>
                    </div>
                    <div className="grid grid-cols-7 gap-3 items-end">
                      <RadioGroup className="col-span-6 grid grid-cols-7 gap-2" value={resp?.isNA ? 'NA' : (val?.toString() ?? '')} onValueChange={(v)=>{
                        if (v === 'NA') onSet(q.id, d, null, true);
                        else onSet(q.id, d, Number(v), false);
                      }}>
                        {likert.map(l => (
                          <div key={l} className={`flex flex-col items-center ${resp?.value===l ? 'font-semibold' : ''}`}>
                            <RadioGroupItem id={`${q.id}-${d}-${l}`} value={String(l)} className={`h-5 w-5 ${heatColors[l]} border`} />
                            <Label htmlFor={`${q.id}-${d}-${l}`} className="text-[10px] mt-1">{l}</Label>
                          </div>
                        ))}
                        <div className="flex flex-col items-center">
                          <RadioGroupItem id={`${q.id}-${d}-NA`} value={'NA'} />
                          <Label htmlFor={`${q.id}-${d}-NA`} className="text-[10px] mt-1">N/A</Label>
                        </div>
                      </RadioGroup>
                      <div className="col-span-1 text-xs text-muted-foreground">{val !== null && val !== undefined && <span>{labels[val]}</span>}</div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`${q.id}-${d}-comment`}>Commentaire</Label>
                      <Textarea id={`${q.id}-${d}-comment`} value={resp?.comment ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, comment: e.target.value })} />
                    </div>
                    {showEvidence && (
                      <div className="grid gap-2">
                        <Label htmlFor={`${q.id}-${d}-evidence`}>Preuves</Label>
                        <Input id={`${q.id}-${d}-evidence`} value={resp?.evidence ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, evidence: e.target.value })} placeholder={hintList[0] || 'Lien ou note'} />
                        {hintList.length>1 && <div className="text-[10px] text-muted-foreground">Ex: {hintList.join('; ')}</div>}
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <Button size="sm" variant="outline" disabled={focusIndex===0} onClick={()=> setFocusIndex(i=> Math.max(0, i-1))}>← Précédent</Button>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={()=> setFocusMode(false)}>Quitter</Button>
                        {focusIndex < currentList.length-1 ? <Button size="sm" onClick={()=> setFocusIndex(i=> Math.min(currentList.length-1, i+1))}>Suivant →</Button> : <Button size="sm" variant="hero" onClick={onResults}>Résultats</Button>}
                      </div>
                    </div>
                  </div>
                );
              }) : currentList.map((q) => {
                  const d = assessment.selectedDepartments[0];
                  const resp = respFor(q.id, d);
                  const val = resp?.isNA ? null : (resp?.value ?? null);
                  const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                  const deptName = departments.find(dd=>dd.id===d)?.name || d;
                  const hintList = evidenceHintsByCategory[q.categoryId] || [];
                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="font-medium flex flex-col gap-1">
                        <span>{q.code} — {q.text}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-3 items-end">
                        <RadioGroup className="col-span-6 grid grid-cols-7 gap-2" value={resp?.isNA ? 'NA' : (val?.toString() ?? '')} onValueChange={(v)=>{
                          if (v === 'NA') onSet(q.id, d, null, true);
                          else onSet(q.id, d, Number(v), false);
                        }}>
                          {likert.map(l => (
                            <div key={l} className="flex flex-col items-center">
                              <RadioGroupItem id={`${q.id}-${d}-${l}`} value={String(l)} className={`h-5 w-5 ${heatColors[l]} border`} />
                              <Label htmlFor={`${q.id}-${d}-${l}`} className="text-xs mt-1">{l}</Label>
                            </div>
                          ))}
                          <div className="flex flex-col items-center">
                            <RadioGroupItem id={`${q.id}-${d}-NA`} value={'NA'} />
                            <Label htmlFor={`${q.id}-${d}-NA`} className="text-xs mt-1">N/A</Label>
                          </div>
                        </RadioGroup>
                        <div className="col-span-1 text-xs text-muted-foreground">
                          {val !== null && val !== undefined && <span>{labels[val]}</span>}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`${q.id}-${d}-comment`}>Commentaire (facultatif)</Label>
                        <Textarea id={`${q.id}-${d}-comment`} value={resp?.comment ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, comment: e.target.value })} placeholder="Précisions, contexte..." />
                      </div>
                      {showEvidence && (
                        <div className="grid gap-2">
                          <Label htmlFor={`${q.id}-${d}-evidence`}>Preuves (facultatif)</Label>
                          <Input id={`${q.id}-${d}-evidence`} value={resp?.evidence ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, evidence: e.target.value })} placeholder={hintList[0] || 'https://...'} />
                          {hintList.length>1 && <div className="text-[10px] text-muted-foreground">Ex: {hintList.join('; ')}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" disabled={step===0} onClick={()=> setStep(s=>Math.max(0, s-1))}>Précédent</Button>
                  <div className="flex items-center gap-2">
                    {step < categories.length-1 ? (
                      <Button onClick={()=> setStep(s=> Math.min(categories.length-1, s+1))}>Suivant</Button>
                    ) : (
                      <Button variant="hero" onClick={onResults}>Voir les résultats</Button>
                    )}
                  </div>
                </div>
              </CardContent>) }
            </Card>
        </div>
      ) : (
  <Tabs value={activeDept} onValueChange={(v)=>setActiveDept(v as any)} className="space-y-6">
          <TabsList className="flex-wrap">
            {assessment.selectedDepartments.map(d => (
              <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
            ))}
          </TabsList>
          {assessment.selectedDepartments.map(d => (
            <TabsContent key={d} value={d} className="space-y-6">
              {tableView ? (
                <Card>
                  <CardHeader><CardTitle>Vue tableur</CardTitle><CardDescription>Une ligne = question, colonnes = départements</CardDescription></CardHeader>
                  <CardContent className="overflow-auto">
                    <table className="min-w-full text-xs border">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 text-left">Question</th>
                          {assessment.selectedDepartments.map(dep => <th key={dep} className="border px-2 py-1">{dep}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {categories.flatMap(cat => relevantQuestionsByDept[d][cat.id].map(q => {
                          return (
                            <tr key={q.id} className="align-top">
                              <td className="border px-2 py-1 w-[340px]"><div className="font-medium text-[11px]">{q.code}</div><div className="text-[10px] opacity-80">{q.text}</div></td>
                              {assessment.selectedDepartments.map(dep => {
                                const resp = responses.find(r=> r.assessmentId===assessment.id && r.departmentId===dep && r.questionId===q.id);
                                const val = resp?.isNA ? null : resp?.value;
                                return (
                                  <td key={dep} className="border px-1 py-1">
                                    <div className="flex gap-0.5 flex-wrap">
                                      {likert.map(l => (
                                        <button key={l} onClick={()=> updateResponse({ questionId: q.id, departmentId: dep as any, value: l, isNA: false })} className={`h-5 w-5 text-[10px] flex items-center justify-center rounded ${val===l ? 'ring-2 ring-black' : ''} ${heatColors[l]}`}>{l}</button>
                                      ))}
                                      <button onClick={()=> updateResponse({ questionId: q.id, departmentId: dep as any, value: null, isNA: true })} className={`h-5 w-5 text-[9px] flex items-center justify-center rounded border ${resp?.isNA ? 'bg-muted' : ''}`}>NA</button>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ) : categories.map(cat => {
                const catQs = relevantQuestionsByDept[d][cat.id];
                const pct = Math.round((catQs.length ? catQs.filter(q=>{
                  const r = responses.find(r => r.assessmentId===assessment.id && r.departmentId===d && r.questionId===q.id);
                  return r && !r.isNA && r.value !== null; }).length / catQs.length : 0)*100);
                return (
                  <Card key={cat.id}>
                    <CardHeader className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{cat.name}</CardTitle>
                          <CardDescription>{cat.description}</CardDescription>
                        </div>
                        <Button size="sm" variant="ghost" onClick={()=> toggleCollapse(cat.id)}>{collapsedCats[cat.id] ? 'Déplier' : 'Replier'}</Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Progression {pct}%</span>
                        <span>· {catQs.length} q.</span>
                      </div>
                      <div className="h-1 w-full bg-border rounded overflow-hidden"><div className="h-full bg-green-500" style={{width: pct+'%'}}/></div>
                    </CardHeader>
                    {!collapsedCats[cat.id] && (
                    <CardContent className="space-y-6">
                          {catQs.filter(q => {
                            if (filterMode==='unanswered') {
                              const r = responses.find(r=> r.assessmentId===assessment.id && r.departmentId===d && r.questionId===q.id);
                              return !(r && !r.isNA && r.value !== null);
                            }
                            if (filterMode==='missingComment') {
                              const r = responses.find(r=> r.assessmentId===assessment.id && r.departmentId===d && r.questionId===q.id);
                              return r && !r.comment;
                            }
                            if (filterMode==='missingEvidence') {
                              const r = responses.find(r=> r.assessmentId===assessment.id && r.departmentId===d && r.questionId===q.id);
                              const val = r?.isNA ? null : r?.value;
                              const need = (val ?? -1) >= q.evidenceRequiredThreshold;
                              return need && !r?.evidence;
                            }
                            return true;
                          }).map(q => {
                        const resp = responses.find(r => r.assessmentId===assessment.id && r.departmentId===d && r.questionId===q.id);
                        const val = resp?.isNA ? null : (resp?.value ?? null);
                        const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                        const deptName = departments.find(dd=>dd.id===d)?.name || d;
                            const hintList = evidenceHintsByCategory[q.categoryId] || [];
                        return (
                          <div key={q.id} className="space-y-3">
                            <div className="font-medium flex flex-col gap-1">
                              <span>[{deptName}] {q.code} — {q.text}</span>
                            </div>
                            <div className="grid grid-cols-7 gap-3 items-end">
                              <RadioGroup className="col-span-6 grid grid-cols-7 gap-2" value={resp?.isNA ? 'NA' : (val?.toString() ?? '')} onValueChange={(v)=>{
                                if (v === 'NA') onSet(q.id, d, null, true);
                                else onSet(q.id, d, Number(v), false);
                              }}>
                                {likert.map(l => (
                                  <div key={l} className="flex flex-col items-center">
                                    <RadioGroupItem id={`${q.id}-${d}-${l}`} value={String(l)} className={`h-5 w-5 ${heatColors[l]} border`} />
                                    <Label htmlFor={`${q.id}-${d}-${l}`} className="text-xs mt-1">{l}</Label>
                                  </div>
                                ))}
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem id={`${q.id}-${d}-NA`} value={'NA'} />
                                  <Label htmlFor={`${q.id}-${d}-NA`} className="text-xs mt-1">N/A</Label>
                                </div>
                              </RadioGroup>
                              <div className="col-span-1 text-xs text-muted-foreground">
                                {val !== null && val !== undefined && <span>{labels[val]}</span>}
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`${q.id}-${d}-comment`}>Commentaire (facultatif)</Label>
                              <Textarea id={`${q.id}-${d}-comment`} value={resp?.comment ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, comment: e.target.value })} placeholder="Précisions, contexte..." />
                            </div>
                            {showEvidence && (
                              <div className="grid gap-2">
                                <Label htmlFor={`${q.id}-${d}-evidence`}>Preuves (facultatif)</Label>
                                <Input id={`${q.id}-${d}-evidence`} value={resp?.evidence ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, evidence: e.target.value })} placeholder={hintList[0] || 'https://...'} />
                                {hintList.length>1 && <div className="text-[10px] text-muted-foreground">Ex: {hintList.join('; ')}</div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>) }
                  </Card>
                );
              })}
              <div className="flex justify-end">
                <Button variant="hero" onClick={onResults}>Voir les résultats</Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </Layout>
  );
};

export default Questionnaire;
