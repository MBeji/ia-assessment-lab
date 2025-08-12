import { useMemo, useState } from "react";
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
  const { categories, questions, templates, templateId, applyTemplate, addQuestion, updateQuestion, removeQuestion, setDepartmentWeight, departmentWeights, departments } = useAssessment();

  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId);
  const template = useMemo(()=> templates.find(t => t.id === selectedTemplate), [templates, selectedTemplate]);
  const templateQuestions = questions; // current questions reflect the applied template plus edits

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
            <CardTitle>Modèle de questionnaire</CardTitle>
            <CardDescription>Sélectionnez un modèle à éditer ou à appliquer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="tpl">Modèle</Label>
              <select id="tpl" className="w-full h-10 rounded-md border bg-background" value={selectedTemplate} onChange={(e)=> setSelectedTemplate(e.target.value)}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">{template?.description}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={()=> applyTemplate(selectedTemplate, { reset: true })}>Appliquer ce modèle</Button>
            </div>
          </CardContent>
        </Card>
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Questions du modèle</CardTitle>
            <CardDescription>Éditez ou supprimez les questions du modèle actuellement chargé.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateQuestions.length === 0 && <p className="text-sm text-muted-foreground">Aucune question.</p>}
            {templateQuestions.map(q => (
              <div key={q.id} className="border rounded-md p-3 grid md:grid-cols-7 gap-2 items-start">
                <div className="md:col-span-2">
                  <Label>Code</Label>
                  <Input value={q.code} onChange={(e)=> updateQuestion({ id: q.id, code: e.target.value })} />
                </div>
                <div className="md:col-span-3">
                  <Label>Intitulé</Label>
                  <Textarea value={q.text} onChange={(e)=> updateQuestion({ id: q.id, text: e.target.value })} />
                </div>
                <div className="md:col-span-1">
                  <Label>Catégorie</Label>
                  <select className="w-full h-10 rounded-md border bg-background" value={q.categoryId} onChange={(e)=> updateQuestion({ id: q.id, categoryId: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1 flex items-end gap-2">
                  <Button variant="destructive" onClick={()=> removeQuestion(q.id)}>Supprimer</Button>
                </div>
                <div className="md:col-span-7">
                  <Label>Départements concernés</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {departments.map(d => {
                      const checked = q.appliesToDepartments.includes('ALL' as any) || q.appliesToDepartments.includes(d.id as any);
                      return (
                        <label key={d.id} className="text-xs flex items-center gap-1 border rounded px-2 py-1">
                          <input type="checkbox" checked={checked}
                            onChange={(e)=>{
                              const hasAll = q.appliesToDepartments.includes('ALL' as any);
                              let next = hasAll ? [] as any[] : [...q.appliesToDepartments];
                              if (e.target.checked) next = Array.from(new Set([...(next as any), d.id]));
                              else next = (next as any).filter((x:any)=> x!==d.id);
                              updateQuestion({ id: q.id, appliesToDepartments: next.length===departments.length ? ['ALL'] as any : next as any});
                            }} />
                          {d.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
