import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";

const likert = [0,1,2,3,4,5];
const labels: Record<number, string> = {
  0: 'Inexistant', 1: 'Ad hoc', 2: 'Basique', 3: 'Standardisé', 4: 'Intégré/Mesuré', 5: 'Optimisé/Automatisé'
};

const Questionnaire = () => {
  const nav = useNavigate();
  const { assessment, categories, questions, updateResponse, responses, answeredRatio, computeScores, departments } = useAssessment();
  const [activeDept, setActiveDept] = useState(assessment?.selectedDepartments[0]);
  const [step, setStep] = useState(0); // category index

  const relevantQuestionsByDept = useMemo(() => {
    const map: Record<string, Record<string, typeof questions>> = {};
    assessment?.selectedDepartments.forEach(d => {
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
  const currentList = activeDept ? relevantQuestionsByDept[activeDept][currentCategory.id] : [];

  const onSet = (questionId: string, dept: string, value: number | null, isNA: boolean) => {
    updateResponse({ questionId, departmentId: dept as any, value, isNA });
  };

  const respFor = (qid: string) => responses.find(r => r.assessmentId === assessment.id && r.departmentId === activeDept && r.questionId === qid);

  const onResults = () => {
    computeScores();
    nav('/resultats');
  };

  return (
    <Layout>
  <SEO title="SynapFlow – Questionnaire" description="Répondez au questionnaire par département et catégorie." canonical={window.location.origin + "/questionnaire"} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Questionnaire</h1>
          <p className="text-sm text-muted-foreground">Entreprise: {assessment?.orgId?.slice(0,6)} — Départements sélectionnés: {assessment.selectedDepartments.join(', ')}</p>
        </div>
        <div className="w-56">
          <Progress value={Math.round(answeredRatio()*100)} />
          <p className="text-xs mt-1 text-muted-foreground">Progression: {Math.round(answeredRatio()*100)}%</p>
        </div>
      </div>

      {/* Sélecteur synchronisé du département concerné */}
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

      <Tabs value={activeDept} onValueChange={(v)=>setActiveDept(v as any)} className="space-y-4">
        <TabsList className="flex-wrap">
          {assessment.selectedDepartments.map(d => (
            <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
          ))}
        </TabsList>
        {assessment.selectedDepartments.map(d => (
          <TabsContent key={d} value={d} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{currentCategory.name}</CardTitle>
                <CardDescription>{currentCategory.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {relevantQuestionsByDept[d][currentCategory.id].map((q) => {
                  const resp = responses.find(r => r.assessmentId === assessment.id && r.departmentId === d && r.questionId === q.id);
                  const val = resp?.isNA ? null : (resp?.value ?? null);
                  const showEvidence = (val ?? -1) >= q.evidenceRequiredThreshold;
                  const appliesTo = q.appliesToDepartments.includes('ALL') ? assessment.selectedDepartments : q.appliesToDepartments;
                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="font-medium flex flex-col gap-1">
                        <span>{q.code} — {q.text}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Départements concernés:</span>
                          {appliesTo.map(ad => (
                            <Badge key={ad} variant={ad===d ? 'default' : 'secondary'}>{departments.find(dd=>dd.id===ad)?.name || ad}</Badge>
                          ))}
                        </div>
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
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
};

export default Questionnaire;
