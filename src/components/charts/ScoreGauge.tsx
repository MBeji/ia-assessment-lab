import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export const ScoreGauge: React.FC<{ value: number; label?: string }> = ({ value, label }) => {
  const data = [{ name: "score", value: Math.max(0, Math.min(100, Math.round(value))) }];
  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={14} data={data} startAngle={90} endAngle={-270}>
          <RadialBar background dataKey="value" fill="hsl(var(--primary))" cornerRadius={14} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-semibold">{Math.round(value)}%</div>
        {label && <div className="text-sm text-muted-foreground mt-1">{label}</div>}
      </div>
    </div>
  );
};
