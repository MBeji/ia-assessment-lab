import { useMemo, lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Lazy-loaded charts (reduce initial bundle)
const ScoreGauge = lazy(()=> import('@/components/charts/ScoreGauge').then(m=>({ default: m.ScoreGauge })));
const RadarByCategory = lazy(()=> import('@/components/charts/RadarByCategory').then(m=>({ default: m.RadarByCategory })));
const BarByDepartment = lazy(()=> import('@/components/charts/BarByDepartment').then(m=>({ default: m.BarByDepartment })));
const HeatmapQuestions = lazy(()=> import('@/components/charts/HeatmapQuestions').then(m=>({ default: m.HeatmapQuestions })));

const Results = () => {
  const nav = useNavigate();
  const { assessment, categories, departments, responses, computeScores, scorecard, questions, generatePlan, assessments, selectAssessment, getAssessmentScorecard } = useAssessment();
  const archived = assessments.filter(a => a.completedAt);
  const [showArchivePicker, setShowArchivePicker] = useState(false);
  const [summaries, setSummaries] = useState<Record<string,{score:number; maturity:string}>>({});

  // When opening picker, compute summaries (global score + maturity) for archived missions
  useEffect(()=>{
    if(!showArchivePicker) return;
    const map: Record<string,{score:number; maturity:string}> = {};
    archived.forEach(a => {
      const sc = getAssessmentScorecard(a.id);
      if(sc) map[a.id] = { score: sc.globalScore, maturity: sc.maturityLevel };
    });
    setSummaries(map);
  }, [showArchivePicker, archived, getAssessmentScorecard]);

  // If no active assessment, still allow browsing archived ones
  if (!assessment) {
    const scUndefined: any = undefined;
    return (
      <Layout>
        <SEO title="SynapFlow – Résultats" description="Scores par catégorie et département." canonical={window.location.origin + "/resultats"} />
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Résultats</h1>
          {archived.length > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={()=> setShowArchivePicker(s=>!s)}>Missions archivées</Button>
              {showArchivePicker && (
                <div className="absolute z-20 mt-1 w-64 max-h-72 overflow-auto border bg-background rounded shadow">
                  <div className="p-2 text-xs font-medium border-b">Sélectionner une mission</div>
                  {archived.map(a => {
                    const s = summaries[a.id];
                    return (
                      <button key={a.id} className="w-full text-left px-2 py-1 hover:bg-muted text-xs" onClick={()=> { selectAssessment(a.id); setShowArchivePicker(false); }}>
                        {a.id.slice(0,6)} · {a.templateId || 'modèle'}{s && <> · {Math.round(s.score)}% {s.maturity}</>}
                        <span className="block text-[10px] text-muted-foreground">Clôturé {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {archived.length === 0 && <p className="text-sm text-muted-foreground">Aucune mission archivée pour l’instant.</p>}
        {archived.length > 0 && <p className="text-sm text-muted-foreground">Sélectionnez une mission archivée pour afficher ses résultats.</p>}
      </Layout>
    );
  }
  // Recompute scores when switching assessments if needed
  const sc = scorecard || (()=>{ try { return computeScores(); } catch { return undefined; } })();
  const hasValidScorecard = !!sc && Object.keys(sc.categoryScores||{}).length>0;

  const radarData = categories.map(c => ({ category: c.name, score: sc.categoryScores[c.id] || 0 }));
  const barData = assessment.selectedDepartments.map(d => ({ department: d, score: sc.departmentScores[d] || 0 }));

  const critical = useMemo(() => {
    return responses
      .filter(r => r.assessmentId === assessment.id && !r.isNA && (r.value ?? 99) <= 2)
      .map(r => ({
        question: questions.find(q => q.id === r.questionId)!,
        department: departments.find(dd => dd.id === r.departmentId)?.name || r.departmentId,
        value: r.value ?? 0,
      }));
  }, [responses, assessment.id, questions, departments]);

  const topCats = [...categories].sort((a,b)=> (sc.categoryScores[b.id]||0)-(sc.categoryScores[a.id]||0)).slice(0,3);
  const lowCats = [...categories].sort((a,b)=> (sc.categoryScores[a.id]||0)-(sc.categoryScores[b.id]||0)).slice(0,3);

  // Coverage computation: total relevant questions vs answered (non-NA)
  const totalRelevant = assessment.selectedDepartments.reduce((acc, d) => acc + questions.filter(q => q.categoryId && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))).length, 0);
  const answeredNonNA = responses.filter(r => r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && !r.isNA && r.value !== null).length;
  const remaining = Math.max(0, totalRelevant - answeredNonNA);

  // Low coverage categories (<50%) listing
  const lowCoverage = categories.map(cat => {
    const rel = assessment.selectedDepartments.flatMap(d => questions.filter(q => q.categoryId === cat.id && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))))
    const relIds = new Set(rel.map(q=>q.id));
    const ans = responses.filter(r => r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && relIds.has(r.questionId) && !r.isNA && r.value !== null).length;
    const cov = rel.length ? ans / rel.length : 1;
    return { cat, cov };
  }).filter(x => x.cov < 0.5);

  return (
    <Layout>
  <SEO title="SynapFlow – Résultats" description="Scores par catégorie et département, forces/faiblesses." canonical={window.location.origin + "/resultats"} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={()=> setShowArchivePicker(s=>!s)}>Missions archivées</Button>
              {showArchivePicker && (
                <div className="absolute z-20 mt-1 w-64 max-h-72 overflow-auto border bg-background rounded shadow">
                  <div className="p-2 text-xs font-medium border-b">Sélectionner une mission</div>
                  {archived.map(a => { const s = summaries[a.id]; return (
                    <button key={a.id} className="w-full text-left px-2 py-1 hover:bg-muted text-xs" onClick={()=> { selectAssessment(a.id); setShowArchivePicker(false); }}>
                      {a.id.slice(0,6)} · {a.templateId || 'modèle'}{s && <> · {Math.round(s.score)}% {s.maturity}</>}
                      <span className="block text-[10px] text-muted-foreground">Clôturé {new Date(a.completedAt!).toLocaleDateString()}</span>
                    </button>
                  ); })}
                </div>
              )}
            </div>
          )}
        </div>
        {remaining > 0 && (
          <Badge variant="secondary">Questions restantes: {remaining}</Badge>
        )}
      </div>

      {lowCoverage.length > 0 && (
        <div className="mb-4">
          <Alert>
            <AlertTitle>Couverture incomplète</AlertTitle>
            <AlertDescription>
              Certaines catégories ont moins de 50% de réponses non‑N/A:&nbsp;
              {lowCoverage.map(({cat, cov}, i) => (
                <span key={cat.id}>{i>0 && ', '}{cat.name} ({Math.round(cov*100)}%)</span>
              ))}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Score global</CardTitle>
            <CardDescription>Niveau: {sc.maturityLevel}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Chargement graphique...</div>}>
              <ScoreGauge value={sc.globalScore} label="Global" />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Radar par catégorie</CardTitle>
            <CardDescription>Vue 0–100%</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-80 flex items-center justify-center text-xs text-muted-foreground">Chargement radar...</div>}>
              <RadarByCategory data={radarData} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Scores par département</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-72 flex items-center justify-center text-xs text-muted-foreground">Chargement barres...</div>}>
              <BarByDepartment data={barData} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Questions critiques (≤ 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-xs text-muted-foreground">Chargement liste...</div>}>
              <HeatmapQuestions critical={critical} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader><CardTitle>Top forces</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topCats.map(c => (<div key={c.id} className="flex items-center justify-between"><span>{c.name}</span><span className="font-medium">{Math.round(sc.categoryScores[c.id]||0)}%</span></div>))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Faiblesses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {lowCats.map(c => (<div key={c.id} className="flex items-center justify-between"><span>{c.name}</span><span className="font-medium">{Math.round(sc.categoryScores[c.id]||0)}%</span></div>))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
  <Button variant="hero" disabled={!hasValidScorecard} onClick={()=> { if(sc) { generatePlan(sc); nav('/plan'); } }}>Générer le plan d’action</Button>
      </div>
    </Layout>
  );
};

export default Results;
