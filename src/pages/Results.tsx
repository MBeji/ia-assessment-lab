import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/charts/ScoreGauge";
import { RadarByCategory } from "@/components/charts/RadarByCategory";
import { BarByDepartment } from "@/components/charts/BarByDepartment";
import { HeatmapQuestions } from "@/components/charts/HeatmapQuestions";

const Results = () => {
  const nav = useNavigate();
  const { assessment, categories, departments, responses, computeScores, scorecard, questions, generatePlan } = useAssessment();

  if (!assessment) return <Layout><p>Veuillez démarrer une évaluation.</p></Layout>;
  const sc = scorecard || computeScores();

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
        <div />
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
            <ScoreGauge value={sc.globalScore} label="Global" />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Radar par catégorie</CardTitle>
            <CardDescription>Vue 0–100%</CardDescription>
          </CardHeader>
          <CardContent>
            <RadarByCategory data={radarData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Scores par département</CardTitle>
          </CardHeader>
          <CardContent>
            <BarByDepartment data={barData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Questions critiques (≤ 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapQuestions critical={critical} />
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
        <Button variant="hero" onClick={()=> { generatePlan(sc); nav('/plan'); }}>Générer le plan d’action</Button>
      </div>
    </Layout>
  );
};

export default Results;
