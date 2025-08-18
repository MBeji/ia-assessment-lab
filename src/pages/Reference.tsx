import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState, useMemo } from 'react';

const ReferencePage = () => {
  const { templates } = useAssessment();
  const [query, setQuery] = useState('');
  const filtered = useMemo(()=> {
    const ql = query.trim().toLowerCase();
    if(!ql) return templates;
    return templates.filter(t => [t.name, t.description, t.origin, t.whenToUse, t.usageGuidelines, ...(t.strengths||[]), ...(t.limitations||[])].filter(Boolean).some(v => String(v).toLowerCase().includes(ql)) );
  }, [templates, query]);
  return (
    <Layout>
      <SEO title="SynapFlow – Références & Guides" description="Documentation des modèles et guides mission" canonical={window.location.origin + '/reference'} />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Références & Guides</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">Documentation centralisée: modèles de questionnaires, déroulé de mission, MODOP, livrables type et ressources externes.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Recherche..." className="h-9 px-3 rounded border bg-background text-sm w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 order-last lg:order-first">
          <nav aria-label="Sommaire" className="text-sm sticky top-20 space-y-4">
            <div>
              <div className="font-semibold text-xs uppercase mb-1 text-muted-foreground">Modèles</div>
              <ul className="space-y-1">
                {templates.map(t => (<li key={t.id}><a className="hover:underline" href={'#'+t.id}>{t.name}</a></li>))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-xs uppercase mb-1 text-muted-foreground">Mission</div>
              <ul className="space-y-1">
                <li><a href="#mission-processus" className="hover:underline">Processus</a></li>
                <li><a href="#mission-modop" className="hover:underline">MODOP</a></li>
                <li><a href="#mission-livrables" className="hover:underline">Livrables</a></li>
                <li><a href="#mission-ressources" className="hover:underline">Ressources</a></li>
              </ul>
            </div>
          </nav>
        </aside>
        <main className="lg:col-span-3 space-y-10">
          <section id="models" aria-labelledby="models-title">
            <h2 id="models-title" className="text-2xl font-semibold mb-3">Descriptif des modèles</h2>
            <p className="text-sm text-muted-foreground mb-4">Origine, usages recommandés et différenciateurs. {query && <span className="font-medium text-foreground">{filtered.length}</span>} modèle(s) correspondant(s).</p>
            <div className="space-y-6">
              {filtered.map(t => (
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
              {!filtered.length && <p className="text-sm text-muted-foreground">Aucun modèle ne correspond à la recherche.</p>}
            </div>
          </section>
          <section id="mission-processus" aria-labelledby="mission-processus-title">
            <h2 id="mission-processus-title" className="text-2xl font-semibold mb-2">Déroulé d'une mission</h2>
            <p className="text-sm text-muted-foreground mb-4">Étapes recommandées pour conduire un audit de maturité IA de bout en bout.</p>
            <Accordion type="single" collapsible className="w-full">
              {[
                { k:'1', t:"Étape 1 — Préparation & cadrage", items:["Définir périmètre, objectifs business et départements.","Identifier sponsor & parties prenantes, jalons, RACI.","Valider cadre confidentialité & RGPD."] },
                { k:'2', t:"Étape 2 — Collecte d'informations", items:["Entretiens ciblés (DG, métiers, IT, data).","Cartographier cas d'usage existants & pipeline.","Préparer référentiels (catégories, règles, pondérations)."] },
                { k:'3', t:"Étape 3 — Administration du questionnaire", items:["Expliquer échelle 0–5 + N/A.","Collecter commentaires & preuves si score élevé.","Assurer ≥80% réponses non N/A."] },
                { k:'4', t:"Étape 4 — Consolidation & scoring", items:["Exclure N/A des moyennes.","Calculer scores catégorie/département/global.","Identifier forces/faiblesses & questions critiques (≤2)."] },
                { k:'5', t:"Étape 5 — Plan d'action priorisé", items:["Générer plan via règles (catégories faibles, questions critiques).","Ordonnancer impact⇢effort; isoler quick wins.","Valider faisabilité & assigner responsables."] },
                { k:'6', t:"Étape 6 — Restitution & décision", items:["Restituer scores & insights clés.","Partager recommandations / risques / hypothèses.","Aligner sponsor & départements sur priorisation."] },
                { k:'7', t:"Étape 7 — Suivi & itérations", items:["Suivi mensuel actions & KPIs d'impact.","Ré‑audit ciblé après 3–6 mois.","Mettre à jour règles & questionnaire."] },
              ].map(step => (
                <AccordionItem key={step.k} value={step.k}>
                  <AccordionTrigger>{step.t}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-1">
                      {step.items.map((li,i)=>(<li key={i}>{li}</li>))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          <section id="mission-modop" aria-labelledby="mission-modop-title">
            <h2 id="mission-modop-title" className="text-2xl font-semibold mb-2">MODOP rapides</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Avant lancement:</strong> Périmètre validé, sponsor nommé, planning partagé, risques RGPD couverts.</li>
              <li><strong>Pendant collecte:</strong> Sessions planifiées, échelle expliquée, preuves encouragées.</li>
              <li><strong>Qualité des données:</strong> ≥80% réponses non N/A, commentaires pour scores 0–1.</li>
              <li><strong>Scoring:</strong> Vérifier pondérations, exclure N/A, cohérence inter‑départements.</li>
              <li><strong>Plan:</strong> Quick wins identifiés, responsables/échéances, dépendances notées.</li>
            </ul>
          </section>
          <section id="mission-livrables" aria-labelledby="mission-livrables-title">
            <h2 id="mission-livrables-title" className="text-2xl font-semibold mb-2">Livrables types</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Note de cadrage (objectifs, périmètre, jalons, RACI).</li>
              <li>Scorecard détaillée (CSV/JSON) + synthèse exécutive.</li>
              <li>Plan d'action priorisé (0–90j, 3–6m, 6–12m) avec responsables.</li>
              <li>Annexes: preuves clés, hypothèses, risques & mitigations.</li>
            </ul>
          </section>
          <section id="mission-ressources" aria-labelledby="mission-ressources-title">
            <h2 id="mission-ressources-title" className="text-2xl font-semibold mb-2">Ressources externes</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><a className="underline" href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noreferrer noopener">NIST AI Risk Management Framework</a></li>
              <li><a className="underline" href="https://www.iso.org/standard/83908.html" target="_blank" rel="noreferrer noopener">ISO/IEC 42001</a> &nbsp;|&nbsp; <a className="underline" href="https://www.iso.org/standard/77223.html" target="_blank" rel="noreferrer noopener">ISO/IEC 23894</a></li>
              <li><a className="underline" href="https://artificial-intelligence-act.eu/" target="_blank" rel="noreferrer noopener">EU AI Act Portal</a></li>
              <li><a className="underline" href="https://arxiv.org/abs/1810.03993" target="_blank" rel="noreferrer noopener">Model Cards</a> / <a className="underline" href="https://arxiv.org/abs/1803.09010" target="_blank" rel="noreferrer noopener">Datasheets</a></li>
              <li><a className="underline" href="https://ml-ops.org/" target="_blank" rel="noreferrer noopener">MLOps Community</a> / <a className="underline" href="https://en.wikipedia.org/wiki/CRISP-DM" target="_blank" rel="noreferrer noopener">CRISP‑DM</a></li>
            </ul>
          </section>
        </main>
      </div>
    </Layout>
  );
};

export default ReferencePage;
