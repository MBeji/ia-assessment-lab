import { useMemo, useState, useEffect } from "react";
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

const Questionnaire = () => {
  const nav = useNavigate();
  const { assessment, categories, questions, updateResponse, responses, answeredRatio, computeScores, departments, templateId, templates } = useAssessment();
  const [activeDept, setActiveDept] = useState(assessment?.selectedDepartments[0]);
  const [step, setStep] = useState(0); // category index
  const activeTemplate = useMemo(()=> templates.find(t => t.id === templateId), [templates, templateId]);
  const orgLevel = activeTemplate?.assessmentScope === 'organization';
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
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

  if (!assessment) return <Layout><p>Veuillez démarrer une évaluation depuis l’accueil.</p></Layout>;

  const currentCategory = categories[step];
  const currentList = orgLevel
    ? questions.filter(q => q.categoryId === currentCategory.id)
    : (activeDept ? relevantQuestionsByDept[activeDept][currentCategory.id] : []);

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
            <p className="text-xs text-muted-foreground">Scope: {orgLevel ? 'Organisation' : 'Multi-départements'} · Départements: {assessment.selectedDepartments.join(', ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-56">
              <Progress value={Math.round(answeredRatio()*100)} />
              <p className="text-xs mt-1 text-muted-foreground">Progression globale: {Math.round(answeredRatio()*100)}%</p>
            </div>
            <Button variant="outline" size="sm" onClick={()=> nav('/')}>Terminer plus tard</Button>
          </div>
        </div>
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
              {currentList.map((q) => {
                  const d = assessment.selectedDepartments[0];
                  const resp = respFor(q.id, d);
                  const val = resp?.isNA ? null : (resp?.value ?? null);
                  const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                  const deptName = departments.find(dd=>dd.id===d)?.name || d;
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
                              <RadioGroupItem id={`${q.id}-${d}-${l}`} value={String(l)} />
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
                          <Label htmlFor={`${q.id}-${d}-evidence`}>Preuves (lien ou note, facultatif)</Label>
                          <Input id={`${q.id}-${d}-evidence`} value={resp?.evidence ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, evidence: e.target.value })} placeholder="https://... ou texte" />
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
        <Tabs value={activeDept} onValueChange={(v)=>setActiveDept(v as any)} className="space-y-4">
          <TabsList className="flex-wrap">
            {assessment.selectedDepartments.map(d => (
              <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
            ))}
          </TabsList>
          {assessment.selectedDepartments.map(d => (
            <TabsContent key={d} value={d} className="space-y-4">
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
                  {relevantQuestionsByDept[d][currentCategory.id].map((q) => {
                    const resp = responses.find(r => r.assessmentId === assessment.id && r.departmentId === d && r.questionId === q.id);
                    const val = resp?.isNA ? null : (resp?.value ?? null);
                    const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                    const deptName = departments.find(dd=>dd.id===d)?.name || d;
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
                                <RadioGroupItem id={`${q.id}-${d}-${l}`} value={String(l)} />
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
                            <Label htmlFor={`${q.id}-${d}-evidence`}>Preuves (lien ou note, facultatif)</Label>
                            <Input id={`${q.id}-${d}-evidence`} value={resp?.evidence ?? ''} onChange={(e)=> updateResponse({ questionId: q.id, departmentId: d as any, value: val, isNA: !!resp?.isNA, evidence: e.target.value })} placeholder="https://... ou texte" />
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
            </TabsContent>
          ))}
        </Tabs>
      )}
    </Layout>
  );
};

export default Questionnaire;
