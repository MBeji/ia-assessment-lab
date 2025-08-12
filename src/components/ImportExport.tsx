import { Button } from "@/components/ui/button";
import { exportCSV, exportJSON } from "@/lib/export";
import { useAssessment } from "@/context/AssessmentContext";

export const ImportExport: React.FC = () => {
  const { organization, assessment, responses, scorecard, plan, categories, departments, questions, rules } = useAssessment();

  const onExportAll = () => {
    exportJSON({ organization, assessment, responses, scorecard, plan, categories, departments, questions, rules }, 'audit-ia-export.json');
  };

  const onExportCSV = () => {
    exportCSV(responses, 'responses.csv');
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(t => {
      try {
        const data = JSON.parse(t);
        localStorage.setItem('audit-ia-state-v1', JSON.stringify(data));
        window.location.reload();
      } catch (err) {
        alert('Fichier invalide');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onExportAll} variant="secondary">Exporter JSON</Button>
      <Button onClick={onExportCSV} variant="outline">Exporter Réponses (CSV)</Button>
      <label className="inline-flex items-center gap-2">
        <input type="file" accept="application/json" onChange={onImport} className="hidden" id="import-json" />
        <Button asChild variant="ghost"><label htmlFor="import-json">Importer JSON</label></Button>
      </label>
    </div>
  );
};
