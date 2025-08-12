import { useState } from "react";
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
  const { departments, startAssessment } = useAssessment();
  const [name, setName] = useState("");
  const [sector, setSector] = useState(sectors[0]);
  const [size, setSize] = useState(sizes[0]);
  const [assessorName, setAssessorName] = useState("");
  const [assessorEmail, setAssessorEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(departments.map(d => d.id));

  const allSelected = selected.length === departments.length;
  const toggleAll = () => setSelected(allSelected ? [] : departments.map(d => d.id));

  const onStart = () => {
    if (!name.trim()) return alert("Veuillez renseigner le nom de l’entreprise.");
    if (!assessorEmail.includes("@")) return alert("Veuillez renseigner un email valide.");
    startAssessment(
      { name, sector, size },
      { name: assessorName || "", email: assessorEmail },
      selected as any
    );
    nav("/questionnaire");
  };

  return (
    <Layout>
  <SEO title="SynapFlow – Accueil" description="Auto‑évaluez la maturité IA de votre entreprise par département et générez un plan d’action priorisé." canonical={window.location.origin + "/"} />
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">SynapFlow • Audit de Maturité IA</h1>
          <p className="text-lg text-muted-foreground mb-6">Évaluez votre maturité IA par département (stratégie, données, MLOps/LLMOps, GenAI, sécurité, conformité, adoption, ROI) et obtenez un plan d’action priorisé.</p>
          <div className="p-4 rounded-xl" style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-elevated)' }}>
            <p className="text-primary-foreground">Conçu pour ateliers — inspiré NIST AI RMF, ISO/IEC 23894/42001, EU AI Act.</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lancer une évaluation</CardTitle>
            <CardDescription>Renseignez l’entreprise, les départements et vos coordonnées.</CardDescription>
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
              <div className="pt-2">
                <Button onClick={onStart} variant="hero" className="w-full">Commencer l’évaluation</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default Index;
