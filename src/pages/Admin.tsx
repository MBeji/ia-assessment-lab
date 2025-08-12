import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImportExport } from "@/components/ImportExport";

const Admin = () => {
  const { categories, addQuestion, setDepartmentWeight, departmentWeights, departments } = useAssessment();

  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [weight, setWeight] = useState(1);

  const onAdd = () => {
    if (!code || !text || !categoryId) return alert('Champs requis manquants');
    const q = {
      id: `Q-CUSTOM-${Date.now()}`,
      code,
      text,
      categoryId,
      appliesToDepartments: ['ALL'] as any,
      isAI: true,
      weight: Number(weight) || 1,
      choices: [0,1,2,3,4,5],
      allowNA: true,
      references: [],
      evidenceRequiredThreshold: 4,
    };
    addQuestion(q as any);
    setCode(""); setText("");
    alert('Question ajoutée');
  };

  return (
    <Layout>
      <SEO title="Audit IA – Admin" description="Gérer questions et poids des départements." canonical={window.location.origin + "/admin"} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Administration</h1>
        <ImportExport />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une question</CardTitle>
            <CardDescription>Les nouvelles questions affectent les calculs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={e=>setCode(e.target.value)} placeholder="EX: CUST-01" />
            </div>
            <div>
              <Label htmlFor="text">Intitulé</Label>
              <Textarea id="text" value={text} onChange={e=>setText(e.target.value)} placeholder="Rédigez l’intitulé" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <select id="category" className="w-full h-10 rounded-md border bg-background" value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="weight">Poids</Label>
                <Input id="weight" type="number" step="0.1" value={weight} onChange={e=>setWeight(Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={onAdd}>Ajouter</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poids des départements</CardTitle>
            <CardDescription>Influence le score global.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.map(d => (
              <div key={d.id} className="grid grid-cols-2 items-center gap-3">
                <Label htmlFor={`w-${d.id}`}>{d.name}</Label>
                <Input id={`w-${d.id}`} type="number" step="0.1" value={departmentWeights[d.id] ?? 1} onChange={e=> setDepartmentWeight(d.id as any, Number(e.target.value))} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
