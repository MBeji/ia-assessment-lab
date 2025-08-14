import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportExport } from "@/components/ImportExport";

const impactRank = { H: 3, M: 2, L: 1 } as const;
const effortRank = { L: 1, M: 2, H: 3 } as const;

const Plan = () => {
  const { plan, scorecard, computeScores, generatePlan, assessment, responses, questions, assessments, selectAssessment, getAssessmentScorecard } = useAssessment();
  const [summaries, setSummaries] = useState<Record<string,{score:number; maturity:string}>>({});
  useEffect(()=>{
    const map: Record<string,{score:number; maturity:string}> = {};
    assessments.forEach(a=>{ const sc = getAssessmentScorecard(a.id); if(sc) map[a.id] = { score: sc.globalScore, maturity: sc.maturityLevel }; });
    setSummaries(map);
  }, [assessments, getAssessmentScorecard]);
  const selectorBar = (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan d’action</h1>
        <ImportExport />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium uppercase text-muted-foreground">Mission</label>
        <select className="h-8 rounded border bg-background px-2 text-sm" value={assessment?.id || ''} onChange={e=> { if(e.target.value) selectAssessment(e.target.value); }}>
          <option value="" disabled>{assessments.length? 'Sélectionner...' : 'Aucune mission'}</option>
          {assessments.map(a => { const s = summaries[a.id]; const label = `${a.id.slice(0,6)}${a.completedAt? ' • Archivé':''}${s? ' • '+Math.round(s.score)+'% '+s.maturity:''}`; return <option key={a.id} value={a.id}>{label}</option>; })}
        </select>
        {assessment && assessment.completedAt && <Badge variant="outline">Archivée</Badge>}
        {assessment && !assessment.completedAt && <Badge variant="secondary">Active</Badge>}
      </div>
    </div>
  );
  if (!assessment) {
    return (
      <Layout>
        <SEO title="SynapFlow – Plan d’action" description="Plan d’action priorisé" canonical={window.location.origin + "/plan"} />
        {selectorBar}
        <p className="text-sm text-muted-foreground">Choisissez une mission pour afficher le plan d’action.</p>
      </Layout>
    );
  }
  const sc = scorecard || (()=>{ try { return computeScores(); } catch { return undefined; } })();
  const p = (plan && plan.assessmentId===assessment.id) ? plan : (sc ? generatePlan(sc) : { id:'tmp', assessmentId: assessment.id, items: [] });

  const groups = useMemo(() => {
    const g: Record<string, typeof p.items> = { '0-90j': [], '3-6m': [], '6-12m': [] } as any;
    p.items.forEach(i => g[i.horizon].push(i));
    (Object.keys(g) as (keyof typeof g)[]).forEach(h => g[h].sort((a,b)=> (impactRank[b.impact]-impactRank[a.impact]) || (effortRank[a.effort]-effortRank[b.effort])));
    return g;
  }, [p]);

  const quickWins = p.items.filter(i => (i.impact !== 'L') && (i.effort !== 'H'));

  // Coverage summary
  const totalRelevant = assessment?.selectedDepartments.reduce((acc, d) => acc + questions.filter(q => q.categoryId && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))).length, 0) ?? 0;
  const answeredNonNA = responses.filter(r => assessment && r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && !r.isNA && r.value !== null).length;
  const remaining = Math.max(0, totalRelevant - answeredNonNA);

  return (
    <Layout>
  <SEO title="SynapFlow – Plan d’action" description="Plan d’action priorisé par horizon avec quick wins." canonical={window.location.origin + "/plan"} />
  {selectorBar}
      {remaining > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <Alert>
            <AlertTitle>Plan calculé avec réponses partielles</AlertTitle>
            <AlertDescription>Il reste {remaining} question(s) non répondue(s) (hors N/A). Le plan s’actualisera automatiquement au fur et à mesure.</AlertDescription>
          </Alert>
          <Badge variant="secondary">Questions restantes: {remaining}</Badge>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Quick wins</CardTitle></CardHeader>
        <CardContent>
          {quickWins.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {quickWins.map((i,idx)=>(<li key={idx}>{i.text}</li>))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aucun quick win identifié.</p>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {(['0-90j','3-6m','6-12m'] as const).map(h => (
          <Card key={h}>
            <CardHeader><CardTitle>{h}</CardTitle></CardHeader>
            <CardContent>
              {groups[h].length ? (
                <ol className="list-decimal pl-5 space-y-2">
                  {groups[h].map((i,idx)=>(
                    <li key={idx}>
                      <div className="font-medium">{i.text}</div>
                      <div className="text-xs text-muted-foreground">Impact {i.impact} · Effort {i.effort}</div>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Aucune action.</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={()=> window.print()} variant="outline">Imprimer / PDF</Button>
      </div>
    </Layout>
  );
};

export default Plan;
