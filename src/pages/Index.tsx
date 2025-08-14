import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/context/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const sectors = ["Services", "Industrie", "Distribution", "Public", "Santé", "Tech"];
const sizes = ["< 100", "100-500", "500-2000", "> 2000"];

const Index = () => {
  const nav = useNavigate();
  const { departments, startAssessment, templates, setTemplateId, assessment, assessments, selectAssessment, closeAssessment, deleteAssessment, getAssessmentProgress, exportAssessment, categories, responses } = useAssessment();
  const [name, setName] = useState("");
  const [sector, setSector] = useState(sectors[0]);
  const [size, setSize] = useState(sizes[0]);
  const [assessorName, setAssessorName] = useState("");
  const [assessorEmail, setAssessorEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(departments.map(d => d.id));
  const [template, setTemplate] = useState<string>(templates[0]?.id || "");
  const activeTemplate = useMemo(()=> templates.find(t => t.id === template), [templates, template]);
  const orgLevel = activeTemplate?.assessmentScope === 'organization';
  const [sortMode, setSortMode] = useState<'updated' | 'started' | 'progress'>('updated');
  const [filterMode, setFilterMode] = useState<'all' | 'open' | 'closed'>('all');
  const sortedFilteredAssessments = [...(assessments||[])].filter(a => {
    if (filterMode==='open') return !a.completedAt; if (filterMode==='closed') return !!a.completedAt; return true;
  }).sort((a,b)=> {
    if (sortMode==='updated') return (new Date(b.updatedAt||b.startedAt).getTime()) - (new Date(a.updatedAt||a.startedAt).getTime());
    if (sortMode==='started') return (new Date(b.startedAt).getTime()) - (new Date(a.startedAt).getTime());
    if (sortMode==='progress') {
      const pa = getAssessmentProgress(a.id).ratio; const pb = getAssessmentProgress(b.id).ratio; return pb - pa;
    }
    return 0;
  });

  const allSelected = selected.length === departments.length;
  const toggleAll = () => setSelected(allSelected ? [] : departments.map(d => d.id));

  // (3) Nettoyage : si on passe en mode organisation, on force un seul département placeholder.
  useEffect(()=> {
    if (orgLevel) {
      if (selected.length !== 1) setSelected([departments[0]?.id]);
    }
  }, [orgLevel, selected.length, departments]);

  const onStart = () => {
    if (!name.trim()) return alert("Veuillez renseigner le nom de l’entreprise.");
    if (!assessorEmail.includes("@")) return alert("Veuillez renseigner un email valide.");
    // For organization-level template we only pass one department (placeholder) so downstream logic stores responses once
    const deptIds = orgLevel ? [selected[0]] : selected;
    startAssessment(
      { name, sector, size },
      { name: assessorName || "", email: assessorEmail },
      deptIds as any,
      template
    );
    nav("/questionnaire");
  };

  const hasOngoing = !!assessment;
  const progressPct = assessment ? Math.round(getAssessmentProgress(assessment.id).ratio * 100) : 0;

  return (
    <Layout>
  <SEO title="SynapFlow – Accueil" description="Auto‑évaluez la maturité IA de votre entreprise par département et générez un plan d’action priorisé." canonical={window.location.origin + "/"} />
      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Audit de Maturité IA</h1>
          <p className="text-lg text-muted-foreground mb-6">Évaluez votre maturité IA par département (stratégie, données, MLOps/LLMOps, GenAI, sécurité, conformité, adoption, ROI) et obtenez un plan d’action priorisé.</p>
          <div className="p-4 rounded-xl" style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-elevated)' }}>
            <p className="text-primary-foreground">Conçu pour ateliers — inspiré NIST AI RMF, ISO/IEC 23894/42001, EU AI Act.</p>
          </div>
          {assessments && assessments.length > 0 && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>Évaluations enregistrées</CardTitle>
                <CardDescription>Reprenez, consultez, exportez ou clôturez.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-xs flex items-center gap-1">Trier
                    <select className="h-7 text-xs border rounded px-1" value={sortMode} onChange={e=> setSortMode(e.target.value as any)}>
                      <option value="updated">Dernière mise à jour</option>
                      <option value="started">Date de début</option>
                      <option value="progress">Progression</option>
                    </select>
                  </label>
                  <label className="text-xs flex items-center gap-1">Filtre
                    <select className="h-7 text-xs border rounded px-1" value={filterMode} onChange={e=> setFilterMode(e.target.value as any)}>
                      <option value="all">Toutes</option>
                      <option value="open">Ouvertes</option>
                      <option value="closed">Clôturées</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {sortedFilteredAssessments.map(a => {
                    const prog = getAssessmentProgress(a.id);
                    const pct = Math.round(prog.ratio * 100);
                    return (
                      <div key={a.id} className="border rounded p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-xs">{a.orgId.slice(0,6)} · {a.templateId || 'modèle'} {a.completedAt && <span className="ml-1 text-[10px] px-1 rounded bg-emerald-600 text-white">Clôturé</span>}</div>
                          <div className="h-2 w-24 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{width: pct+'%'}} /></div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="secondary" onClick={()=> { selectAssessment(a.id); nav('/questionnaire'); }}>Reprendre</Button>
                          <Button size="sm" onClick={()=> { selectAssessment(a.id); nav('/resultats'); }}>Résultats</Button>
                          {!a.completedAt && <Button size="sm" variant="outline" onClick={()=> closeAssessment(a.id)}>Clôturer</Button>}
                          <Button size="sm" variant="ghost" onClick={()=> exportAssessment(a.id)}>Exporter</Button>
                          <Button size="sm" variant="destructive" onClick={()=> { if (confirm('Supprimer cette évaluation ?')) deleteAssessment(a.id); }}>Suppr.</Button>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Démarré: {new Date(a.startedAt).toLocaleDateString()} · {a.updatedAt ? 'Maj: '+ new Date(a.updatedAt).toLocaleDateString() : ''}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1">
                  <Button size="sm" variant="outline" onClick={()=> {
                    if (confirm('Réinitialiser toutes les évaluations ?')) { localStorage.removeItem('audit-ia-state-v1'); window.location.reload(); }
                  }}>Effacer toutes les évaluations</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lancer une évaluation</CardTitle>
            <CardDescription>Renseignez l’entreprise, le modèle et vos coordonnées{orgLevel ? '' : ', puis choisissez les départements'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="org">Entreprise</Label>
                <Input id="org" value={name} onChange={e=>setName(e.target.value)} placeholder="Nom de l’entreprise" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sector">Secteur</Label>
                  <select id="sector" className="w-full h-10 rounded-md border bg-background" value={sector} onChange={e=>setSector(e.target.value)}>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="size">Taille</Label>
                  <select id="size" className="w-full h-10 rounded-md border bg-background" value={size} onChange={e=>setSize(e.target.value)}>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="template">Modèle de questionnaire</Label>
                <select
                  id="template"
                  className="w-full h-10 rounded-md border bg-background"
                  value={template}
                  onChange={(e)=>{ setTemplate(e.target.value); setTemplateId(e.target.value); }}
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">{templates.find(t=>t.id===template)?.description}</p>
                {/* (1) Label explicite du mode */}
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded border ${orgLevel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-emerald-600 text-white border-emerald-600'}`}>{orgLevel ? 'Mode Organisation' : 'Mode Multi‑départements'}</span>
                  <span className="text-muted-foreground">{orgLevel ? 'Une seule série de réponses' : 'Comparaison entre plusieurs départements'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="assessorName">Votre nom</Label>
                  <Input id="assessorName" value={assessorName} onChange={e=>setAssessorName(e.target.value)} placeholder="Nom et prénom" />
                </div>
                <div>
                  <Label htmlFor="assessorEmail">Email</Label>
                  <Input id="assessorEmail" value={assessorEmail} onChange={e=>setAssessorEmail(e.target.value)} placeholder="email@entreprise.com" />
                </div>
              </div>
              {orgLevel ? (
                <div className="space-y-2">
                  <Label>Thèmes couverts</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0,8).map(c => (
                      <span key={c.id} className="text-[11px] px-2 py-1 rounded bg-muted border">{c.name}</span>
                    ))}
                    {categories.length > 8 && <span className="text-[11px] text-muted-foreground">+{categories.length-8} autres</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Modèle organisationnel : une seule série de réponses pour l’ensemble de l’entreprise.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Départements concernés</Label>
                    <button className="text-sm underline" onClick={toggleAll}>{allSelected ? "Tout désélectionner" : "Tout sélectionner"}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selected.includes(d.id)} onCheckedChange={(v)=> setSelected(prev => v ? Array.from(new Set([...prev, d.id])) : prev.filter(x=>x!==d.id))} />
                        <span>{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <Button onClick={onStart} variant="hero" className="w-full">Commencer l’évaluation</Button>
                {assessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Questionnaire (lecture seule)</CardTitle>
                      <CardDescription>Mission active – aperçu des catégories & questions avec valeur</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[480px] overflow-auto pr-2 text-xs">
                      {(assessment.categoriesSnapshot || categories).map(cat => (
                        <div key={cat.id} className="space-y-1">
                          <div className="font-semibold text-[11px]">{cat.name}</div>
                          <ul className="ml-4 list-disc space-y-0.5">
                            {(assessment.questionsSnapshot || []).filter(q=> q.categoryId===cat.id).map(q => {
                              const resp = responses.find(r=> r.assessmentId===assessment.id && r.questionId===q.id);
                              const display = resp ? (resp.isNA ? 'NA' : resp.value ?? '') : '';
                              return <li key={q.id}>{q.code} – {q.text} {display!=='' && <span className="opacity-60">[{display}]</span>}</li>;
                            })}
                          </ul>
                        </div>
                      ))}
                      <div className="text-[10px] text-muted-foreground">Consultation uniquement ici. Modification des réponses désactivée.</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default Index;
