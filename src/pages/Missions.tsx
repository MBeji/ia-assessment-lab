import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, BarChart2, ClipboardList, Edit3, RotateCcw } from 'lucide-react';

const statusLabel = (a: any) => a.completedAt ? 'Clôturée' : 'En cours';

const Missions = () => {
  const { assessments, selectAssessment, getAssessmentProgress, getAssessmentScorecard, exportAssessment, closeAssessment, deleteAssessment, reopenAssessment, plan } = useAssessment() as any;
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'updated'|'score'|'progress'>('updated');
  const [filter, setFilter] = useState<'all'|'open'|'closed'>('all');
  const list = useMemo(()=> {
    return (assessments||[])
      .filter(a => {
        if (filter==='open' && a.completedAt) return false; if (filter==='closed' && !a.completedAt) return false; return true; })
      .filter(a => !query.trim() || a.orgId.toLowerCase().includes(query.toLowerCase()) || (a.templateId||'').toLowerCase().includes(query.toLowerCase()))
      .map(a => ({ a, prog: getAssessmentProgress(a.id), sc: getAssessmentScorecard(a.id) }))
      .sort((x,y)=> {
        if (sort==='updated') return new Date(y.a.updatedAt||y.a.startedAt).getTime() - new Date(x.a.updatedAt||x.a.startedAt).getTime();
        if (sort==='score') return (y.sc?.globalScore||0) - (x.sc?.globalScore||0);
        if (sort==='progress') return y.prog.ratio - x.prog.ratio;
        return 0;
      });
  }, [assessments, query, sort, filter, getAssessmentProgress, getAssessmentScorecard]);
  return (
    <Layout>
      <SEO title="SynapFlow – Missions" description="Liste des évaluations (missions) en cours et clôturées." canonical={window.location.origin + "/missions"} />
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-semibold">Missions</h1>
        <p className="text-sm text-muted-foreground">Toutes les évaluations (en cours et clôturées).</p>
        <div className="flex flex-wrap gap-3 items-end text-xs">
          <div className="flex flex-col gap-1">
            <label>Recherche</label>
            <input className="h-8 border rounded px-2 bg-background" placeholder="ID org ou modèle" value={query} onChange={e=> setQuery(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label>Trier</label>
            <select className="h-8 border rounded px-2 bg-background" value={sort} onChange={e=> setSort(e.target.value as any)}>
              <option value="updated">Dernière maj</option>
              <option value="score">Score global</option>
              <option value="progress">Progression</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label>Filtre</label>
            <select className="h-8 border rounded px-2 bg-background" value={filter} onChange={e=> setFilter(e.target.value as any)}>
              <option value="all">Toutes</option>
              <option value="open">Ouvertes</option>
              <option value="closed">Clôturées</option>
            </select>
          </div>
        </div>
      </div>
  <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map(({a, prog, sc}) => {
          const pct = Math.round(prog.ratio*100);
          return (
            <Card key={a.id} className="relative cursor-pointer transition hover:shadow-sm active:scale-[0.98]" onClick={(e)=> { e.stopPropagation(); selectAssessment(a.id); nav('/questionnaire'); }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">{a.orgId.slice(0,6)} <span className={`text-[10px] px-1 rounded ${a.completedAt ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>{statusLabel(a)}</span></CardTitle>
                <CardDescription className="text-xs flex flex-col gap-0.5">
                  <span>Début: {new Date(a.startedAt).toLocaleDateString()} {a.updatedAt && <span>· Maj {new Date(a.updatedAt).toLocaleDateString()}</span>}</span>
                  {sc && <span>Score: {Math.round(sc.globalScore)}% · Maturité: {sc.maturityLevel}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="h-2 w-full bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{width: pct+'%'}}/></div>
                <p>Progression: {pct}% · Questions: {prog.answered}/{prog.total}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button aria-label="Ouvrir questionnaire" size="icon" variant="secondary" className="h-7 w-7" title="Questionnaire" onClick={(e)=> { e.stopPropagation(); selectAssessment(a.id); nav('/questionnaire'); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button aria-label="Voir résultats" size="icon" variant="outline" className="h-7 w-7" title="Résultats" onClick={(e)=> { e.stopPropagation(); selectAssessment(a.id); nav('/resultats'); }}><BarChart2 className="h-3.5 w-3.5" /></Button>
                  <Button aria-label="Voir plan" size="icon" variant="outline" className="h-7 w-7" title="Plan" onClick={(e)=> { e.stopPropagation(); selectAssessment(a.id); nav('/plan'); }}><ClipboardList className="h-3.5 w-3.5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e)=> e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={()=> { selectAssessment(a.id); exportAssessment(a.id); }}>Exporter</DropdownMenuItem>
                      {!a.completedAt && <DropdownMenuItem onClick={()=> closeAssessment(a.id)}>Clôturer</DropdownMenuItem>}
                      {a.completedAt && <DropdownMenuItem onClick={()=> reopenAssessment(a.id)}><RotateCcw className="h-3 w-3 mr-1" />Réouvrir</DropdownMenuItem>}
                      <DropdownMenuItem onClick={()=> { if(confirm('Supprimer ?')) deleteAssessment(a.id); }}>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!assessments?.length && <p className="text-sm text-muted-foreground">Aucune évaluation enregistrée.</p>}
      </div>
    </Layout>
  );
};

export default Missions;
