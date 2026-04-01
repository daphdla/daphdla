"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PerformanceByVintage } from "@/types";

interface VintageBarChartProps {
  data: PerformanceByVintage[];
}

export function VintageBarChart({ data }: VintageBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="vintage" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="moic"
          orientation="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}x`}
        />
        <YAxis
          yAxisId="irr"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "moic") return [`${value.toFixed(2)}x`, "MOIC"];
            if (name === "irr") return [`${(value * 100).toFixed(1)}%`, "TRI"];
            if (name === "dpi") return [`${value.toFixed(2)}x`, "DPI"];
            return [value, name];
          }}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          formatter={(v) => ({ moic: "MOIC", irr: "TRI", dpi: "DPI" }[v] ?? v)}
        />
        <ReferenceLine yAxisId="moic" y={2} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
        <Bar yAxisId="moic" dataKey="moic" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="moic" dataKey="dpi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="irr" dataKey="irr" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  );
}
