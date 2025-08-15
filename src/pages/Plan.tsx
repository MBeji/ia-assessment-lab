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
  const { plan, scorecard, computeScores, generatePlan, assessment, responses, questions, assessments, selectAssessment, getAssessmentScorecard, getAssessmentProgress, exportPlanCSV, exportPlanXLSX, setPlan, generateExecutiveSummary, generatePlanSuggestions } = useAssessment() as any;
  const [summaries, setSummaries] = useState<Record<string,{score:number; maturity:string}>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'archived'>('all');
  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'score_desc'|'score_asc'>('date_desc');
  const [actionStatusFilter, setActionStatusFilter] = useState<'ALL'|'OPEN'|'IN_PROGRESS'|'DONE'>('ALL');
  const [sortByPriority, setSortByPriority] = useState(true);
  const [kanbanMode, setKanbanMode] = useState(false);
  const [editingJustifId, setEditingJustifId] = useState<string|null>(null);
  useEffect(()=>{
    const map: Record<string,{score:number; maturity:string}> = {};
    assessments.forEach(a=>{ const sc = getAssessmentScorecard(a.id); if(sc) map[a.id] = { score: sc.globalScore, maturity: sc.maturityLevel }; });
    setSummaries(map);
  }, [assessments, getAssessmentScorecard]);
  const filteredSorted = useMemo(()=>{
    let list = [...assessments];
    if(filterStatus==='active') list = list.filter(a=> !a.completedAt);
    if(filterStatus==='archived') list = list.filter(a=> !!a.completedAt);
    if(search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a=> a.id.toLowerCase().includes(q) || (a.templateId||'').toLowerCase().includes(q));
    }
    list.sort((a,b)=>{
      if(sortBy.startsWith('date')) {
        const da = a.startedAt || a.updatedAt || '';
        const db = b.startedAt || b.updatedAt || '';
        return sortBy==='date_desc' ? db.localeCompare(da) : da.localeCompare(db);
      } else {
        const sa = summaries[a.id]?.score ?? -1;
        const sb = summaries[b.id]?.score ?? -1;
        if(sortBy==='score_desc') return sb-sa; return sa-sb;
      }
    });
    return list;
  }, [assessments, filterStatus, search, sortBy, summaries]);

  const selectorBar = (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan d’action</h1>
        <ImportExport />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium uppercase text-muted-foreground">Mission</label>
        <select className="h-8 rounded border bg-background px-2 text-sm min-w-[260px]" value={assessment?.id || ''} onChange={e=> { if(e.target.value) selectAssessment(e.target.value); }}>
          <option value="" disabled>{filteredSorted.length? 'Sélectionner...' : 'Aucune mission'}</option>
          {filteredSorted.map(a => { const s = summaries[a.id]; const prog = getAssessmentProgress(a.id); const pct = prog.ratio? Math.round(prog.ratio*100):0; const date = a.startedAt ? new Date(a.startedAt).toLocaleDateString():''; const label = `${a.id.slice(0,6)} • ${date}${a.completedAt? ' • Archivé':' • Actif'}${s? ' • '+Math.round(s.score)+'% '+s.maturity:''} • P${pct}%`; return <option key={a.id} value={a.id}>{label}</option>; })}
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
          <input placeholder="Recherche id / modèle" className="h-7 rounded border bg-background px-2 text-xs w-44" value={search} onChange={e=> setSearch(e.target.value)} />
        </div>
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
  // Recompute scores when assessment changes
  useEffect(()=>{ if(assessment){ try { computeScores(); } catch{} } }, [assessment?.id, computeScores]);
  const sc = useMemo(()=> {
    if(scorecard && scorecard.assessmentId===assessment?.id) return scorecard;
    try { return assessment ? computeScores() : undefined; } catch { return undefined; }
  }, [scorecard, assessment?.id, computeScores]);
  // Ensure plan regenerated for current assessment
  useEffect(()=>{ if(sc && assessment && (!plan || plan.assessmentId!==assessment.id)) { try { generatePlan(sc); } catch{} } }, [sc?.assessmentId, assessment?.id]);
  const p = useMemo(()=> {
    if(plan && assessment && plan.assessmentId===assessment.id) return plan;
    return sc ? generatePlan(sc) : undefined;
  }, [plan, sc, assessment?.id]);

  const groups = useMemo(() => {
    const filtered = actionStatusFilter==='ALL' ? p.items : p.items.filter(i => (i.status||'OPEN')===actionStatusFilter);
    const g: Record<string, typeof p.items> = { '0-90j': [], '3-6m': [], '6-12m': [] } as any;
    filtered.forEach(i => g[i.horizon].push(i));
    (Object.keys(g) as (keyof typeof g)[]).forEach(h => {
      if (sortByPriority) g[h].sort((a,b)=> (b.priorityScore||0)-(a.priorityScore||0));
      else g[h].sort((a,b)=> (impactRank[b.impact]-impactRank[a.impact]) || (effortRank[a.effort]-effortRank[b.effort]));
    });
    return g;
  }, [p, actionStatusFilter, sortByPriority]);

  const quickWins = p.items.filter(i => (i.impact !== 'L') && (i.effort !== 'H'));
  const completion = p.items.length? Math.round(100 * (p.items.filter(i=> i.status==='DONE').length / p.items.length)) : 0;

  // Coverage summary
  const totalRelevant = assessment?.selectedDepartments.reduce((acc, d) => acc + questions.filter(q => q.categoryId && (q.appliesToDepartments.includes('ALL') || q.appliesToDepartments.includes(d))).length, 0) ?? 0;
  const answeredNonNA = responses.filter(r => assessment && r.assessmentId === assessment.id && assessment.selectedDepartments.includes(r.departmentId) && !r.isNA && r.value !== null).length;
  const remaining = Math.max(0, totalRelevant - answeredNonNA);

  return (
    <Layout>
  <SEO title="SynapFlow – Plan d’action" description="Plan d’action priorisé par horizon avec quick wins." canonical={window.location.origin + "/plan"} />
  {selectorBar}
      {remaining > 0 && sc && (
        <div className="mb-4 flex items-center justify-between">
          <Alert>
            <AlertTitle>Plan calculé avec réponses partielles</AlertTitle>
            <AlertDescription>Il reste {remaining} question(s) non répondue(s) (hors N/A). Le plan s’actualisera automatiquement au fur et à mesure.</AlertDescription>
          </Alert>
          <Badge variant="secondary">Questions restantes: {remaining}</Badge>
        </div>
      )}
      {!sc && (
        <div className="text-sm text-muted-foreground">Aucune donnée exploitable pour générer un plan (aucune réponse notée).</div>
      )}
      {sc && p && <>
        <Card>
          <CardHeader><CardTitle>Quick wins</CardTitle></CardHeader>
          <CardContent>
            {p.items.filter(i => (i.impact !== 'L') && (i.effort !== 'H')).length ? (
              <ul className="list-disc pl-5 space-y-1">
                {p.items.filter(i => (i.impact !== 'L') && (i.effort !== 'H')).map((i,idx)=>(<li key={idx}>{i.text}</li>))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Aucun quick win identifié.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Résumé exécutif</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={()=> generateExecutiveSummary(assessment.id)}>Générer / Mettre à jour</Button>
              {p.executiveSummary ? (
                <pre className="whitespace-pre-wrap text-xs border rounded p-2 bg-muted/40 max-h-64 overflow-auto">{p.executiveSummary}</pre>
              ) : <p className="text-xs text-muted-foreground">Aucun résumé encore.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Progression</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold mb-2">{completion}%</div>
            <div className="text-xs text-muted-foreground">{p.items.filter(i=>i.status==='DONE').length} / {p.items.length} actions terminées</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Suggestions complémentaires</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={()=> generatePlanSuggestions && generatePlanSuggestions(assessment.id)}>Proposer</Button>
                {plan?.suggestions?.length ? <Badge variant="secondary">{plan.suggestions.length} sugg.</Badge> : null}
              </div>
              {plan?.suggestions && plan.suggestions.length>0 ? (
                <ul className="space-y-2 text-xs">
                  {plan.suggestions.map((s:any)=>(
                    <li key={s.id} className="border rounded p-2 bg-muted/30 flex flex-col gap-1">
                      <div className="font-medium">{s.text}</div>
                      <div className="text-[10px] text-muted-foreground">{s.rationale}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        <span>Horizon {s.horizon}</span>
                        <span>Impact {s.impact}</span>
                        <span>Effort {s.effort}</span>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>{
                          setPlan((pl:any)=> pl && pl.assessmentId===assessment.id ? ({ ...pl, items: [...pl.items, { id: s.id, ruleId: 'suggestion', horizon: s.horizon, text: s.text, impact: s.impact, effort: s.effort, linkedTo: s.linkedTo, status: 'OPEN' }], suggestions: pl.suggestions.filter(x=> x.id!==s.id) }) : pl);
                        }}>Ajouter au plan</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-muted-foreground">Aucune suggestion générée pour le moment.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 mt-6 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Filtre actions</span>
            <select value={actionStatusFilter} onChange={e=> setActionStatusFilter(e.target.value as any)} className="h-7 border rounded bg-background px-1">
              <option value="ALL">Toutes</option>
              <option value="OPEN">Ouvertes</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminées</option>
            </select>
          </div>
          <button type="button" onClick={()=> setSortByPriority(s=> !s)} className="h-7 px-2 border rounded bg-background hover:bg-accent">Tri: {sortByPriority? 'Priorité' : 'Impact/Effort'}</button>
          <button type="button" onClick={()=> setKanbanMode(m=> !m)} className="h-7 px-2 border rounded bg-background hover:bg-accent">Vue: {kanbanMode? 'Liste' : 'Kanban'}</button>
          {actionStatusFilter!=='ALL' && <button type="button" onClick={()=> setActionStatusFilter('ALL')} className="h-7 px-2 border rounded bg-background hover:bg-accent">Reset filtre</button>}
        </div>
        {kanbanMode && <KanbanActions plan={p} setPlan={setPlan} />}
        {!kanbanMode && <div className="grid md:grid-cols-3 gap-6 mt-4">
          {(['0-90j','3-6m','6-12m'] as const).map(h => (
            <Card key={h}>
              <CardHeader><CardTitle>{h}</CardTitle></CardHeader>
              <CardContent>
                {groups[h].length ? (
                  <ol className="list-decimal pl-5 space-y-2">
                    {groups[h].map((i,idx)=>(
                      <li key={i.id || idx} className={`space-y-1 ${i.status==='DONE' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className={`font-medium leading-snug flex-1 ${i.status==='DONE'? 'line-through' : ''}`}>
                            {i.text}
                            {i.duplicateGroupId && <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Doublon {i.duplicateGroupId}</span>}
                          </div>
                          <select value={i.status || 'OPEN'} onChange={e=> {
                            const v = e.target.value as any;
                            if (v==='DONE' && !i.justification) { setEditingJustifId(i.id); }
                            setPlan((pl:any)=> pl && pl.assessmentId===assessment.id ? ({ ...pl, items: pl.items.map((x:any)=> x===i? { ...x, status:v }: x) }) : pl);
                          }} className="h-6 text-[11px] border rounded bg-background">
                            <option value="OPEN">Ouvert</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="DONE">Terminé</option>
                          </select>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                          <span>Impact {i.impact}</span>
                          <span>Effort {i.effort}</span>
                          {i.priorityScore!=null && <span>Priorité {i.priorityScore}</span>}
                          {i.roiScore!=null && <span>ROI {i.roiScore}</span>}
                          {i.deficiency!=null && <span>Déficit {(i.deficiency*100).toFixed(0)}%</span>}
                          {i.status && <span>Status {i.status==='OPEN'?'O': i.status==='IN_PROGRESS'?'E':'T'}</span>}
                          {i.status==='DONE' && !i.justification && <span className="text-red-500 font-medium">Justification requise</span>}
                        </div>
                        {editingJustifId===i.id && <div className="mt-1">
                          <textarea className="w-full text-xs border rounded p-1" placeholder="Justification / evidence" value={i.justification||''} onChange={e=> setPlan((pl:any)=> pl && pl.assessmentId===assessment.id ? ({ ...pl, items: pl.items.map((x:any)=> x===i? { ...x, justification:e.target.value } : x) }) : pl)} />
                          <div className="flex justify-end gap-2 mt-1">
                            <Button variant="outline" className="h-6 px-2 py-0 text-[11px]" onClick={()=> setEditingJustifId(null)}>Fermer</Button>
                          </div>
                        </div>}
                      </li>
                    ))}
                  </ol>
                ) : <p className="text-sm text-muted-foreground">Aucune action.</p>}
              </CardContent>
            </Card>
          ))}
        </div>}
      </>}

      {sc && p && <div className="mt-6 flex justify-end gap-2">
  <Button onClick={()=> exportPlanCSV(assessment.id)} variant="outline">CSV</Button>
        <Button onClick={()=> exportPlanXLSX(assessment.id)} variant="outline">XLSX</Button>
        <Button onClick={()=> window.print()} variant="outline">Imprimer / PDF</Button>
      </div>}
    </Layout>
  );
};

export default Plan;

// Kanban actions component
const KanbanActions: React.FC<{ plan: any; setPlan: any }> = ({ plan, setPlan }) => {
  const cols = [
    { key: 'OPEN', title: 'Ouvertes' },
    { key: 'IN_PROGRESS', title: 'En cours' },
    { key: 'DONE', title: 'Terminées' },
  ];
  const buckets: Record<string, any[]> = { OPEN: [], IN_PROGRESS: [], DONE: [] };
  (plan.items||[]).forEach((it:any)=> { const st = it.status || 'OPEN'; if (buckets[st]) buckets[st].push(it); });
  cols.forEach(c => buckets[c.key].sort((a,b)=> (b.priorityScore||0)-(a.priorityScore||0)));
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-4 min-w-[880px]">
        {cols.map(c => (
          <div key={c.key} className="flex-1 min-w-[260px]">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold">
              <span>{c.title}</span><span className="text-muted-foreground">{buckets[c.key].length}</span>
            </div>
            <div className="space-y-2">
              {buckets[c.key].map(card => (
                <div key={card.id} className="border rounded p-2 bg-background shadow-sm">
                  <div className="text-[11px] font-medium leading-snug mb-1 flex flex-wrap gap-1">
                    {card.text}
                    {card.duplicateGroupId && <span className="text-[9px] px-1 rounded bg-amber-200 text-amber-900">D{card.duplicateGroupId.replace('DUP-','')}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2 mb-1">
                    {card.priorityScore!=null && <span>P {card.priorityScore}</span>}
                    {card.roiScore!=null && <span>ROI {card.roiScore}</span>}
                    {card.deficiency!=null && <span>Δ {(card.deficiency*100).toFixed(0)}%</span>}
                  </div>
                  <select value={card.status || 'OPEN'} onChange={e=> {
                    const v = e.target.value;
                    if (v==='DONE' && !card.justification) {
                      // leave status but warn; require justification in list view logic
                    }
                    setPlan((pl:any)=> pl ? ({ ...pl, items: pl.items.map((x:any)=> x===card? { ...x, status:v } : x) }) : pl);
                  }} className="h-6 text-[10px] border rounded bg-background w-full mb-1">
                    <option value="OPEN">Ouverte</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DONE">Terminée</option>
                  </select>
                  {card.status==='DONE' && !card.justification && <div className="text-[10px] text-red-500">Justification requise</div>}
                </div>
              ))}
              {buckets[c.key].length===0 && <div className="text-[11px] text-muted-foreground italic">Aucune</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
