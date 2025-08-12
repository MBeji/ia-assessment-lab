import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  data: { department: string; score: number }[];
}

export const BarByDepartment: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" tick={{ fill: 'hsl(var(--foreground))' }} />
          <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--foreground))' }} />
          <Tooltip />
          <Bar dataKey="score" fill="hsl(var(--accent))" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
