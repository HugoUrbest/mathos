"use client";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarData {
  theme: string;
  value: number;
  fullMark: number;
}

export default function MathRadar({ data }: { data: RadarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="theme"
          tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Score"]}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 13 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ r: 4, fill: "#6366f1" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
