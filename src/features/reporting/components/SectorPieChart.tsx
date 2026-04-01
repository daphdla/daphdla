"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatMillions } from "@/lib/utils";
import { SectorAllocation } from "@/types";

const COLORS = [
  "#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6b7280",
];

interface SectorPieChartProps {
  data: SectorAllocation[];
}

const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "Tech",
  HEALTHCARE: "Santé",
  FINANCIAL_SERVICES: "Finance",
  CONSUMER: "Conso",
  INDUSTRIALS: "Industrie",
  ENERGY: "Énergie",
  REAL_ESTATE: "Immobilier",
  MEDIA: "Médias",
  EDUCATION: "Éducation",
  OTHER: "Autre",
};

export function SectorPieChart({ data }: SectorPieChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    name: SECTOR_LABELS[d.sector] ?? d.sector,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="45%"
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
          paddingAngle={2}
        >
          {formatted.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            formatMillions(value),
            name,
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          formatter={(value, entry) => {
            const item = entry.payload as SectorAllocation & { name: string };
            return `${value} (${item.percentage.toFixed(1)}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
