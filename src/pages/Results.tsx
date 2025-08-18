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
const ScoreHistory = lazy(()=> import('@/components/charts/ScoreHistory').then(m=>({ default: m.ScoreHistory })));
import { Deferred } from '@/components/Deferred';

const Results = () => {
  const nav = useNavigate();
  const { assessment, categories, departments, responses, computeScores, scorecard, questions, generatePlan, plan, assessments, selectAssessment, getAssessmentScorecard, getAssessmentProgress, closeDepartment, reopenDepartment, isDepartmentClosed, getScoreHistory } = useAssessment() as any;
  const allTags = useMemo(()=> Array.from(new Set(questions.flatMap((q:any)=> q.tags||[]))).sort(), [questions]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-3">Résultats
          {assessment && <Badge variant="secondary" className="uppercase tracking-wide">
            {(() => {
              switch(assessment.workflowState){
                case 'INITIE': return 'Initié';
                case 'QUESTIONNAIRE_EN_COURS': return 'Questionnaire';
                case 'QUESTIONNAIRE_TERMINE': return 'Questionnaire terminé';
                case 'RESULTATS_GENERES': return 'Résultats générés';
                case 'PLAN_GENERE': return 'Plan généré';
                case 'ARCHIVE': return 'Archivé';
                default: return '—';
              }
            })()}
          </Badge>}
        </h1>
        {assessment && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {[
              { id: 'INITIE', label: 'Initié' },
              { id: 'QUESTIONNAIRE_EN_COURS', label: 'Questionnaire' },
              { id: 'QUESTIONNAIRE_TERMINE', label: 'Terminé' },
              { id: 'RESULTATS_GENERES', label: 'Résultats' },
              { id: 'PLAN_GENERE', label: 'Plan' },
            ].map(step => {
              const order = ['INITIE','QUESTIONNAIRE_EN_COURS','QUESTIONNAIRE_TERMINE','RESULTATS_GENERES','PLAN_GENERE','ARCHIVE'];
              const currIdx = order.indexOf(assessment.workflowState||'');
              const stepIdx = order.indexOf(step.id);
              const reached = currIdx >= stepIdx;
              const active = assessment.workflowState === step.id;
              return (
                <div key={step.id} className={`flex items-center gap-1 ${active? 'font-semibold':''}`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] border ${reached? 'bg-primary text-primary-foreground border-primary':'bg-muted text-muted-foreground'}`}>{stepIdx+1}</span>
                  <span className={`${!reached? 'text-muted-foreground':''}`}>{step.label}</span>
                  {step.id !== 'PLAN_GENERE' && <span className={`mx-1 h-px w-5 ${reached? 'bg-primary':'bg-muted'}`}></span>}
                </div>
              );
            })}
            {assessment.workflowState==='ARCHIVE' && <div className="flex items-center gap-1 font-semibold">
              <span className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] border bg-neutral-600 text-white border-neutral-600">A</span>
              <span>Archivé</span>
            </div>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium uppercase text-muted-foreground">Mission</label>
        <select
          className="h-8 rounded border bg-background px-2 text-sm min-w-[260px]"
          value={assessment?.id || ''}
          onChange={e => { if(e.target.value) { selectAssessment(e.target.value); } }}
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
          {allTags.length>0 && <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1 max-w-[260px]">
              {allTags.map(tgRaw => {
                const tag = String(tgRaw);
                const active = activeTags.includes(tag);
                return (
                  <button key={tag} type="button" onClick={()=> setActiveTags(a => (active ? a.filter(t=>t!==tag) : [...a, tag]))} className={`px-2 py-0.5 rounded text-[10px] border ${active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{tag}</button>
                );
              })}
              {activeTags.length>0 && <button type="button" onClick={()=> setActiveTags([])} className="px-2 py-0.5 rounded text-[10px] border bg-destructive text-destructive-foreground">Reset</button>}
            </div>
          </div>}
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
  // Recompute every time assessment id changes to avoid stale scorecard
  useEffect(()=>{ if(assessment){ try { computeScores(); } catch{} } }, [assessment?.id, computeScores]);
  const sc = useMemo(()=> {
    if(scorecard && assessment && scorecard.assessmentId===assessment.id) return scorecard;
    try { return assessment ? computeScores() : undefined; } catch { return undefined; }
  }, [scorecard, assessment?.id, computeScores]);
  // Génère le plan si absent mais ne redirige plus automatiquement
  useEffect(()=> {
    if(assessment && sc && (!plan || plan.assessmentId!==assessment.id)) {
      try { generatePlan(sc); } catch {}
    }
  }, [sc, assessment?.id, plan, generatePlan]);
  const hasValidScorecard = !!sc && Object.keys(sc.categoryScores||{}).length>0;

  // Chart datasets (apply tag filter to radar; keep original scoring values, just hide unrelated categories)
  const radarData = sc ? categories
    .filter(c => activeTags.length===0 || questions.some(q => q.categoryId===c.id && (q.tags||[]).some((t:string)=> activeTags.includes(t))))
    .map(c => ({ category: c.name, score: sc.categoryScores[c.id] || 0 })) : [];
  const barData = sc ? assessment.selectedDepartments.map(d => ({
    department: d + (isDepartmentClosed(assessment.id,d) ? ' (Fermé)' : ''),
    score: (sc as any).departmentScores[d] || 0
  })) : [];

  const critical = useMemo(() => {
    return responses
      .filter(r => r.assessmentId === assessment.id && !r.isNA && (r.value ?? 99) <= 2)
      .map(r => ({
        question: questions.find(q => q.id === r.questionId)!,
        department: departments.find(dd => dd.id === r.departmentId)?.name || r.departmentId,
        value: r.value ?? 0,
      }))
      .filter(item => activeTags.length===0 || (item.question.tags||[]).some((t:string)=> activeTags.includes(t)));
  }, [responses, assessment.id, questions, departments, activeTags]);

  const topCats = sc ? [...categories].sort((a,b)=> (sc.categoryScores[b.id]||0)-(sc.categoryScores[a.id]||0)).slice(0,3) : [];
  const lowCats = sc ? [...categories].sort((a,b)=> (sc.categoryScores[a.id]||0)-(sc.categoryScores[b.id]||0)).slice(0,3) : [];
  const history = assessment ? getScoreHistory(assessment.id) : [];

  // Coverage computation: total relevant questions vs answered (non-NA)
  const totalRelevant = assessment.selectedDepartments.reduce((acc, d) => acc + questions.filter(q => q.categoryId && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))).length, 0);
  const answeredNonNA = responses.filter(r => r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && !r.isNA && r.value !== null).length;
  const remaining = Math.max(0, totalRelevant - answeredNonNA);

  // Suppression de la redirection automatique vers le plan — l’utilisateur choisit maintenant.

  // Low coverage categories (<50%) listing
  const lowCoverage = categories.map(cat => {
    const rel = assessment.selectedDepartments.flatMap(d => questions.filter(q => q.categoryId === cat.id && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))))
    const relIds = new Set(rel.map(q=>q.id));
    const ans = responses.filter(r => r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && relIds.has(r.questionId) && !r.isNA && r.value !== null).length;
    const cov = rel.length ? ans / rel.length : 1;
    return { cat, cov };
  }).filter(x => x.cov < 0.5);

  // Enrichment quality metrics (guidance, barèmes, tags, risk coverage)
  const totalQuestions = questions.length || 1; // avoid div/0
  const enrichedGuidance = questions.filter((q:any)=> (q.guidance||'').trim().length>0).length;
  const enrichedBarème = questions.filter((q:any)=> Array.isArray(q.scaleDescriptors) && q.scaleDescriptors.length>=3).length;
  const enrichedTags = questions.filter((q:any)=> (q.tags||[]).length>0).length;
  const pct = (n:number)=> Math.round((n/totalQuestions)*100);
  const highRiskQs = questions.filter((q:any)=> q.riskLevel==='HIGH');
  const highRiskWithGuidance = highRiskQs.filter(q=> (q.guidance||'').trim().length>0).length;
  const answeredHighRiskIds = new Set(responses.filter(r => r.assessmentId===assessment.id && !r.isNA && r.value!==null && highRiskQs.some((q:any)=> q.id===r.questionId)).map(r=> r.questionId));
  const highRiskCoverage = highRiskQs.length ? Math.round( (answeredHighRiskIds.size / highRiskQs.length)*100 ) : 0;
  const missingHighRiskGuidance = highRiskQs.length - highRiskWithGuidance;

  const EnrichmentStat: React.FC<{ label:string; value:number; total?:number; unit?:string; warn?:boolean; helper?:string }> = ({ label, value, total, unit, warn, helper }) => {
    const pctLocal = total!=null ? Math.round((value/total)*100) : undefined;
    return (
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium {warn? 'text-destructive':''}">{label}</span>
          <span className={`font-semibold ${warn? 'text-destructive':'text-foreground'}`}>{value}{unit || (total!=null? ` / ${total}`:'')}{pctLocal!=null? ` (${pctLocal}%)`:''}</span>
        </div>
        {helper && <div className="text-[10px] text-muted-foreground leading-snug">{helper}</div>}
        {total!=null && <div className="h-1.5 rounded bg-muted overflow-hidden"><div style={{width: (pctLocal||0)+'%'}} className={`h-full ${warn? 'bg-destructive':'bg-primary'} transition-all`}></div></div>}
      </div>
    );
  };

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
      {sc && <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Score global</CardTitle>
            <CardDescription>Niveau: {sc.maturityLevel}</CardDescription>
          </CardHeader>
          <CardContent>
            <Deferred height={220}>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Chargement...</div>}>
                <ScoreGauge value={sc.globalScore} label="Global" />
              </Suspense>
            </Deferred>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Radar par catégorie</CardTitle>
            <CardDescription>Vue 0–100% {activeTags.length>0 && '(filtré par tags)'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Deferred height={320}>
              <Suspense fallback={<div className="h-80 flex items-center justify-center text-xs text-muted-foreground">Chargement...</div>}>
                <RadarByCategory data={radarData} />
              </Suspense>
            </Deferred>
          </CardContent>
        </Card>
      </div>}

  {sc && <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Scores par département</CardTitle>
            {activeTags.length>0 && <CardDescription>Filtre visuel tags actif (scores globaux inchangés)</CardDescription>}
          </CardHeader>
          <CardContent>
            <Deferred height={260}>
              <Suspense fallback={<div className="h-72 flex items-center justify-center text-xs text-muted-foreground">Chargement...</div>}>
                <BarByDepartment data={barData} />
              </Suspense>
            </Deferred>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Questions critiques (≤ 2)</CardTitle>
            {activeTags.length>0 && <CardDescription>Filtrées: {activeTags.join(', ')}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Deferred height={220}>
              <Suspense fallback={<div className="text-xs text-muted-foreground">Chargement...</div>}>
                <HeatmapQuestions critical={critical} />
              </Suspense>
            </Deferred>
          </CardContent>
        </Card>
  </div>}

  {assessment && !assessment.completedAt && (
    <div className="mt-6 border rounded p-4 space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Clôture partielle</div>
      <div className="flex flex-wrap gap-2">
        {assessment.selectedDepartments.map((d:string)=> {
          const closed = isDepartmentClosed(assessment.id,d);
          return <button key={d} onClick={()=> closed ? reopenDepartment(assessment.id,d) : closeDepartment(assessment.id,d)} className={`px-3 py-1 rounded text-xs border ${closed? 'bg-secondary':'bg-background hover:bg-accent'}`}>{closed? `Réouvrir ${d}`:`Clôturer ${d}`}</button>;
        })}
        {assessment.selectedDepartments.length===0 && <span className="text-[11px] text-muted-foreground">Aucun département</span>}
      </div>
    </div>
  )}

  {sc && <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Historique du score global</CardTitle>
            <CardDescription>Évolution dans le temps</CardDescription>
          </CardHeader>
          <CardContent>
            <Deferred height={260}>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Chargement...</div>}>
                <ScoreHistory data={history} />
              </Suspense>
            </Deferred>
          </CardContent>
        </Card>
      </div>}

  {sc && <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-6">
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

  {sc && <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Qualité d'enrichissement</CardTitle>
          <CardDescription>Guidance, barèmes, tags & couverture risque</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnrichmentStat label="Questions totales" value={totalQuestions} />
          <EnrichmentStat label="Avec guidance" value={enrichedGuidance} total={totalQuestions} helper="Questions disposant d'une aide contextuelle" />
          <EnrichmentStat label="Avec barème" value={enrichedBarème} total={totalQuestions} helper="Questions avec échelle descriptive (≥3 niveaux)" />
          <EnrichmentStat label="Avec tags" value={enrichedTags} total={totalQuestions} helper="Taxonomie appliquée" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Couverture questions à risque</CardTitle>
          <CardDescription>Focus High Risk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnrichmentStat label="High Risk" value={highRiskQs.length} />
          <EnrichmentStat label="Répondues (≥1 dept)" value={answeredHighRiskIds.size} total={highRiskQs.length} helper="Au moins une réponse non-NA" />
          <EnrichmentStat label="Guidées" value={highRiskWithGuidance} total={highRiskQs.length} />
          <EnrichmentStat label="Manque guidance" value={missingHighRiskGuidance} total={highRiskQs.length} warn={missingHighRiskGuidance>0} />
          <div className="text-[11px] text-muted-foreground">Couverture High Risk: {highRiskCoverage}%</div>
        </CardContent>
      </Card>
    </div>}

      <div className="mt-6 flex justify-end">
        <Button variant="hero" disabled={!hasValidScorecard} onClick={()=> { if(sc) { generatePlan(sc); nav('/plan'); } }}>Voir le plan d’action</Button>
      </div>
    </Layout>
  );
};

export default Results;
