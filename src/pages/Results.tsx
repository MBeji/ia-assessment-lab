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
  const { assessment, categories, departments, responses, computeScores, scorecard, questions, generatePlan, assessments, selectAssessment, getAssessmentScorecard, getAssessmentProgress } = useAssessment();
  const archived = assessments.filter(a => a.completedAt);
  const [summaries, setSummaries] = useState<Record<string,{score:number; maturity:string}>>({});

  // Precompute summaries for all assessments once (lightweight) when component mounts or assessments change
  useEffect(()=>{
    const map: Record<string,{score:number; maturity:string}> = {};
    assessments.forEach(a => {
      const sc = getAssessmentScorecard(a.id);
      if(sc) map[a.id] = { score: sc.globalScore, maturity: sc.maturityLevel };
    });
    setSummaries(map);
  }, [assessments, getAssessmentScorecard]);

  // If no active assessment, still allow browsing archived ones
  // Always show selector bar (even if no current assessment)
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'archived'>('all');
  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'score_desc'|'score_asc'>('date_desc');

  const filteredSorted = useMemo(()=> {
    let list = [...assessments];
    if(filterStatus==='active') list = list.filter(a=> !a.completedAt);
    if(filterStatus==='archived') list = list.filter(a=> !!a.completedAt);
    if(search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.id.toLowerCase().includes(q) || (a.templateId||'').toLowerCase().includes(q));
    }
    list.sort((a,b)=>{
      if(sortBy.startsWith('date')) {
        const da = a.startedAt || a.updatedAt || '';
        const db = b.startedAt || b.updatedAt || '';
        return sortBy==='date_desc' ? (db.localeCompare(da)) : (da.localeCompare(db));
      } else {
        const sa = summaries[a.id]?.score ?? -1;
        const sb = summaries[b.id]?.score ?? -1;
        if(sortBy==='score_desc') return (sb-sa);
        return (sa-sb);
      }
    });
    return list;
  }, [assessments, filterStatus, search, sortBy, summaries]);

  const selectorBar = (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Résultats</h1>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium uppercase text-muted-foreground">Mission</label>
        <select
          className="h-8 rounded border bg-background px-2 text-sm min-w-[260px]"
          value={assessment?.id || ''}
          onChange={e => { if(e.target.value) selectAssessment(e.target.value); }}
        >
          <option value="" disabled>{filteredSorted.length? 'Sélectionner...' : 'Aucune mission'}</option>
          {filteredSorted.map(a => {
            const s = summaries[a.id];
            const prog = getAssessmentProgress(a.id);
            const pct = prog.ratio? Math.round(prog.ratio*100):0;
            const date = a.startedAt ? new Date(a.startedAt).toLocaleDateString() : '';
            const label = `${a.id.slice(0,6)} • ${date}${a.completedAt? ' • Archivé':' • Actif'}${s? ' • '+Math.round(s.score)+'% '+s.maturity:''} • P${pct}%`;
            return <option key={a.id} value={a.id}>{label}</option>;
          })}
        </select>
        {assessment && assessment.completedAt && <Badge variant="outline">Archivée</Badge>}
        {assessment && !assessment.completedAt && <Badge variant="secondary">Active</Badge>}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filtre</span>
          <select className="h-7 rounded border bg-background px-1" value={filterStatus} onChange={e=> setFilterStatus(e.target.value as any)}>
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="archived">Archivées</option>
          </select>
          <span className="text-muted-foreground">Tri</span>
          <select className="h-7 rounded border bg-background px-1" value={sortBy} onChange={e=> setSortBy(e.target.value as any)}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="score_desc">Score ↓</option>
            <option value="score_asc">Score ↑</option>
          </select>
          <input
            placeholder="Recherche id / modèle"
            className="h-7 rounded border bg-background px-2 text-xs w-44"
            value={search}
            onChange={e=> setSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
  if (!assessment) {
    return (
      <Layout>
        <SEO title="SynapFlow – Résultats" description="Scores par catégorie et département." canonical={window.location.origin + "/resultats"} />
        {selectorBar}
        <p className="text-sm text-muted-foreground">Choisissez une mission pour afficher les résultats.</p>
      </Layout>
    );
  }
  // Force a compute after selection if none yet
  useEffect(()=>{ if(assessment && !scorecard) { try { computeScores(); } catch{} } }, [assessment?.id, scorecard, computeScores]);
  // Recompute scores when switching assessments if needed
  const sc = scorecard || (()=>{ try { return computeScores(); } catch { return undefined; } })();
  const hasValidScorecard = !!sc && Object.keys(sc.categoryScores||{}).length>0;

  const radarData = sc ? categories.map(c => ({ category: c.name, score: sc.categoryScores[c.id] || 0 })) : [];
  const barData = sc ? assessment.selectedDepartments.map(d => ({ department: d, score: (sc as any).departmentScores[d] || 0 })) : [];

  const critical = useMemo(() => {
    return responses
      .filter(r => r.assessmentId === assessment.id && !r.isNA && (r.value ?? 99) <= 2)
      .map(r => ({
        question: questions.find(q => q.id === r.questionId)!,
        department: departments.find(dd => dd.id === r.departmentId)?.name || r.departmentId,
        value: r.value ?? 0,
      }));
  }, [responses, assessment.id, questions, departments]);

  const topCats = sc ? [...categories].sort((a,b)=> (sc.categoryScores[b.id]||0)-(sc.categoryScores[a.id]||0)).slice(0,3) : [];
  const lowCats = sc ? [...categories].sort((a,b)=> (sc.categoryScores[a.id]||0)-(sc.categoryScores[b.id]||0)).slice(0,3) : [];

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
      {selectorBar}
      {remaining > 0 && (
        <div className="mb-4 flex justify-end"><Badge variant="secondary">Questions restantes: {remaining}</Badge></div>
      )}

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

      {!sc && (
        <div className="mb-6 text-sm text-muted-foreground">Aucune réponse exploitable encore pour calculer les scores.</div>
      )}
      {sc && <div className="grid md:grid-cols-3 gap-6">
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
      </div>}

  {sc && <div className="grid md:grid-cols-2 gap-6 mt-6">
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
  </div>}

  {sc && <div className="grid md:grid-cols-2 gap-6 mt-6">
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
  </div>}

      <div className="mt-6 flex justify-end">
  <Button variant="hero" disabled={!hasValidScorecard} onClick={()=> { if(sc) { generatePlan(sc); nav('/plan'); } }}>Générer le plan d’action</Button>
      </div>
    </Layout>
  );
};

export default Results;
