import { Category, Question } from "@/types";

interface Props {
  critical: { question: Question; department: string; value: number }[];
}

export const HeatmapQuestions: React.FC<Props> = ({ critical }) => {
  if (!critical.length) return <p className="text-sm text-muted-foreground">Aucune question critique (≤ 2) détectée.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2 pr-4">Question</th>
            <th className="py-2 pr-4">Département</th>
            <th className="py-2 pr-4">Score</th>
          </tr>
        </thead>
        <tbody>
          {critical.map((c, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 pr-4">{c.question.code} — {c.question.text}</td>
              <td className="py-2 pr-4">{c.department}</td>
              <td className="py-2 pr-4">
                <span className="px-2 py-1 rounded-md bg-destructive/15 text-destructive">{c.value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
