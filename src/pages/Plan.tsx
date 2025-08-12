import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportExport } from "@/components/ImportExport";

const impactRank = { H: 3, M: 2, L: 1 } as const;
const effortRank = { L: 1, M: 2, H: 3 } as const;

const Plan = () => {
  const { plan, scorecard, computeScores, generatePlan } = useAssessment();
  const sc = scorecard || computeScores();
  const p = plan || generatePlan(sc);

  const groups = useMemo(() => {
    const g: Record<string, typeof p.items> = { '0-90j': [], '3-6m': [], '6-12m': [] } as any;
    p.items.forEach(i => g[i.horizon].push(i));
    (Object.keys(g) as (keyof typeof g)[]).forEach(h => g[h].sort((a,b)=> (impactRank[b.impact]-impactRank[a.impact]) || (effortRank[a.effort]-effortRank[b.effort])));
    return g;
  }, [p]);

  const quickWins = p.items.filter(i => (i.impact !== 'L') && (i.effort !== 'H'));

  return (
    <Layout>
      <SEO title="Audit IA – Plan d’action" description="Plan d’action priorisé par horizon avec quick wins." canonical={window.location.origin + "/plan"} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Plan d’action priorisé</h1>
        <ImportExport />
      </div>
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
