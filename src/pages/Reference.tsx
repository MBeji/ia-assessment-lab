import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReferencePage = () => {
  const { templates } = useAssessment();
  return (
    <Layout>
      <SEO title="SynapFlow – Référentiel modèles" description="Documentation des modèles de questionnaire" canonical={window.location.origin + '/reference'} />
      <h1 className="text-2xl font-semibold mb-4">Référentiel des modèles</h1>
      <p className="text-sm text-muted-foreground mb-6">Origine, usage recommandé, forces, limites et guidelines d'application de chaque modèle. Utiliser cette section pour choisir le cadre le plus adapté à votre contexte d'évaluation.</p>
      <div className="space-y-6">
        {templates.map(t => (
          <Card key={t.id} id={t.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.name}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">Scope: {t.assessmentScope==='organization'? 'Organisation':'Départements'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              {t.origin && <div><span className="font-medium">Origine / Source: </span><span className="text-muted-foreground">{t.origin}</span></div>}
              {t.whenToUse && <div><span className="font-medium">Quand le choisir: </span><span className="text-muted-foreground">{t.whenToUse}</span></div>}
              {t.usageGuidelines && <div><span className="font-medium">Guidelines d'usage: </span><span className="text-muted-foreground whitespace-pre-wrap">{t.usageGuidelines}</span></div>}
              {(t.strengths && t.strengths.length>0) && (
                <div>
                  <div className="font-medium mb-1">Points forts</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {t.strengths.map((s,i)=>(<li key={i} className="text-muted-foreground">{s}</li>))}
                  </ul>
                </div>
              )}
              {(t.limitations && t.limitations.length>0) && (
                <div>
                  <div className="font-medium mb-1">Limites / Attention</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {t.limitations.map((s,i)=>(<li key={i} className="text-muted-foreground">{s}</li>))}
                  </ul>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4 text-[11px] mt-2">
                <div className="p-2 rounded border bg-muted/30"><div className="font-semibold mb-1">Catégories</div><div>{t.categories.length}</div></div>
                <div className="p-2 rounded border bg-muted/30"><div className="font-semibold mb-1">Questions</div><div>{t.questions.length}</div></div>
                <div className="p-2 rounded border bg-muted/30"><div className="font-semibold mb-1">Règles d'action</div><div>{t.rules.length}</div></div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <a href={'#'+t.id} className="text-[10px] underline text-muted-foreground">Lien direct</a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default ReferencePage;
