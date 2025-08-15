import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface ScoreHistoryChartProps {
  data: { ts: string; globalScore: number }[];
}

export const ScoreHistory: React.FC<ScoreHistoryChartProps> = ({ data }) => {
  if (!data.length) return <div className="text-xs text-muted-foreground">Aucun historique.</div>;
  const formatted = data.map(d => ({
    date: new Date(d.ts).toLocaleDateString(),
    score: Math.round(d.globalScore),
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0,100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip formatter={(v)=> [`${v}%`, 'Score']} />
          <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreHistory;
