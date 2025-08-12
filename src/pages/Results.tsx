import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
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

  return (
    <Layout>
      <SEO title="Audit IA – Résultats" description="Scores par catégorie et département, forces/faiblesses." canonical={window.location.origin + "/resultats"} />
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
