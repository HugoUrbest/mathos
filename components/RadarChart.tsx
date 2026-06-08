"use client";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";

export interface RadarDataPoint {
  theme: string;
  value: number;
  fullMark: number;
  top10?: number;
  top20?: number;
  top50?: number;
}

interface Props {
  data: RadarDataPoint[];
  /** Quels benchmarks afficher */
  showTop?: ("top10" | "top20" | "top50")[];
}

const BENCHMARK_STYLES = {
  top10: { color: "#f59e0b", label: "Top 10%",  dash: "4 2" },
  top20: { color: "#6366f1", label: "Top 20%",  dash: "6 3" },
  top50: { color: "#10b981", label: "Top 50%",  dash: "2 2" },
};

export default function MathRadar({ data, showTop = [] }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="theme" tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />

        {/* Benchmarks en arrière-plan */}
        {showTop.includes("top50") && (
          <Radar name="Top 50%" dataKey="top50" stroke={BENCHMARK_STYLES.top50.color}
            fill="transparent" strokeWidth={1.5}
            strokeDasharray={BENCHMARK_STYLES.top50.dash} dot={false} />
        )}
        {showTop.includes("top20") && (
          <Radar name="Top 20%" dataKey="top20" stroke={BENCHMARK_STYLES.top20.color}
            fill="transparent" strokeWidth={1.5}
            strokeDasharray={BENCHMARK_STYLES.top20.dash} dot={false} />
        )}
        {showTop.includes("top10") && (
          <Radar name="Top 10%" dataKey="top10" stroke={BENCHMARK_STYLES.top10.color}
            fill="transparent" strokeWidth={1.5}
            strokeDasharray={BENCHMARK_STYLES.top10.dash} dot={false} />
        )}

        {/* Ton score */}
        <Radar name="Toi" dataKey="value" stroke="#6366f1" fill="#6366f1"
          fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: "#6366f1" }} />

        <Tooltip
          formatter={(value, name) => [`${value}%`, name]}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 13 }}
        />
        {showTop.length > 0 && (
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
