import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAssessment } from "@/context/AssessmentContext";

const Questionnaire = () => {
  const nav = useNavigate();
  const { assessment, templateId, templates, setTemplateId } = useAssessment();
  // Always operate in preview/browse mode now
  const [previewTemplate, setPreviewTemplate] = useState(templateId || templates[0]?.id);
  const tpl = useMemo(()=> templates.find(t=> t.id === previewTemplate), [templates, previewTemplate]);
  return (
    <Layout>
      <SEO title="SynapFlow – Modèles" description="Parcourir un modèle de questionnaire IA" canonical={window.location.origin + "/questionnaire"} />
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Modèles de questionnaire</h1>
            <p className="text-xs text-muted-foreground">Sélectionnez un modèle et parcourez ses catégories et questions. (Cette page n'est plus utilisée pour la saisie des réponses.)</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <select className="h-9 border rounded px-2" value={previewTemplate} onChange={e=> setPreviewTemplate(e.target.value)}>
              {templates.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {tpl?.assessmentScope === 'organization' ? <span className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px]">Organisation</span> : <span className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]">Multi-départements</span>}
            <button className="text-xs underline" onClick={()=> { setTemplateId(previewTemplate); nav('/'); }}>Utiliser ce modèle →</button>
          </div>
        </div>
        {assessment && (
          <div className="text-[11px] p-2 rounded border bg-muted/40">
            Questionnaire d'une mission: ouvrez la mission sur la page d'accueil pour consulter les réponses (lecture seule).
          </div>
        )}
        <div className="text-sm text-muted-foreground">{tpl?.description}</div>
        <div className="space-y-4">
          {tpl?.categories.map(cat => (
            <div key={cat.id} className="border rounded p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-sm">{cat.name}</h2>
                  <p className="text-xs text-muted-foreground max-w-2xl">{cat.description}</p>
                </div>
              </div>
              <div className="space-y-3">
                {tpl.questions.filter(q=> q.categoryId===cat.id).map(q => (
                  <div key={q.id} className="text-sm border rounded p-3 bg-muted/30">
                    <div className="font-medium text-xs mb-1">{q.code}</div>
                    <div className="text-sm leading-snug">{q.text}</div>
                    {tpl.assessmentScope==='per-department' && q.appliesToDepartments && q.appliesToDepartments[0] !== 'ALL' && (
                      <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">{q.appliesToDepartments.map((d:any)=> <span key={d} className="px-1.5 py-0.5 rounded bg-border/40">{d}</span>)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Questionnaire;
