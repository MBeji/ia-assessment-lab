import React from 'react';
import { PlanItem, Question } from '@/types';

interface Props {
  items: PlanItem[];
  questions: Question[];
}

// Simple matrix counts actions per (tag, horizon). Horizons fixed ordering.
export const TagHorizonHeatmap: React.FC<Props> = ({ items, questions }) => {
  const horizons: string[] = ['0-90j','3-6m','6-12m'];
  const qById: Record<string, Question> = {}; questions.forEach(q=> qById[q.id]=q);
  const tagSet = new Set<string>();
  items.forEach(it => { const q = it.linkedTo?.questionId ? qById[it.linkedTo.questionId] : undefined; (q?.tags||[]).forEach(t=> tagSet.add(t)); });
  const tags = Array.from(tagSet).sort();
  if (!tags.length) return <p className="text-xs text-muted-foreground">Aucun tag présent dans les actions.</p>;
  const matrix: Record<string, Record<string, number>> = {}; // tag -> horizon -> count
  tags.forEach(t => { matrix[t] = {}; horizons.forEach(h => matrix[t][h] = 0); });
  items.forEach(it => { const q = it.linkedTo?.questionId ? qById[it.linkedTo.questionId] : undefined; if(!q) return; (q.tags||[]).forEach(t => { if(matrix[t]) matrix[t][it.horizon] = (matrix[t][it.horizon]||0)+1; }); });
  // Compute max for color intensity
  let max = 0; tags.forEach(t => horizons.forEach(h => { const v = matrix[t][h]; if (v>max) max=v; }));
  const color = (v:number): React.CSSProperties => {
    if (max===0) return { background: 'var(--muted)' };
    const ratio = v / max; // 0..1
    return { background: `hsl(var(--primary-h) var(--primary-s) / ${0.15 + 0.55*ratio})` };
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left">
            <th className="p-2 font-medium">Tag</th>
            {horizons.map(h => <th key={h} className="p-2 font-medium whitespace-nowrap">{h}</th>)}
            <th className="p-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {tags.map(tag => {
            const rowTotal = horizons.reduce((s,h)=> s + (matrix[tag][h]||0), 0);
            return (
              <tr key={tag} className="border-t">
                <td className="p-2 align-top font-medium whitespace-nowrap">{tag}</td>
                {horizons.map(h => {
                  const v = matrix[tag][h]||0;
                  return (
                    <td key={h} className="p-1 align-top text-center">
                      <div className="min-w-[34px] h-7 flex items-center justify-center rounded text-[10px]" style={color(v)}>{v||''}</div>
                    </td>
                  );
                })}
                <td className="p-2 align-top text-center font-semibold">{rowTotal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
