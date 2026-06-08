"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { THEME_EMOJIS, Theme } from "@/lib/types";

interface DataPoint {
  theme: string;
  themeKey: Theme;
  avg: number;
  count: number;
}

interface Props {
  data: DataPoint[];
  highlightTheme?: Theme;
}

function barColor(avg: number, highlighted: boolean) {
  if (highlighted) return "#6366f1";
  if (avg >= 60) return "#10b981";
  if (avg >= 40) return "#f59e0b";
  return "#ef4444";
}

// Tooltip personnalisé
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 text-sm">
      <div className="font-semibold text-gray-800">{THEME_EMOJIS[d.themeKey]} {d.theme}</div>
      <div className="text-indigo-600 font-bold">{d.avg}% de réussite</div>
      <div className="text-gray-400 text-xs">{d.count} questions répondues</div>
    </div>
  );
}

export default function ScatterPlot({ data, highlightTheme }: Props) {
  // Tronquer les labels longs pour l'axe X
  const chartData = data.map(d => ({
    ...d,
    shortName: d.theme.length > 7 ? d.theme.slice(0, 6) + "." : d.theme,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
        barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
        {/* Lignes de référence */}
        <ReferenceLine y={60} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.4} />
        <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
        <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {chartData.map((d) => (
            <Cell key={d.themeKey} fill={barColor(d.avg, d.themeKey === highlightTheme)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
