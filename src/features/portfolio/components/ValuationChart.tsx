"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMillions, formatDateShort } from "@/lib/utils";

interface ValuationChartProps {
  data: Array<{
    valuationDate: string | Date;
    nav: number;
  }>;
  investedAmount?: number;
}

export function ValuationChart({ data, investedAmount }: ValuationChartProps) {
  const chartData = data.map((d) => ({
    date: formatDateShort(d.valuationDate),
    nav: d.nav,
    invested: investedAmount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `€${v}M`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatMillions(value),
            name === "nav" ? "NAV" : "Investi",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) => (value === "nav" ? "NAV" : "Capital investi")}
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
        />
        {investedAmount !== undefined && (
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#investedGradient)"
          />
        )}
        <Area
          type="monotone"
          dataKey="nav"
          stroke="#4f46e5"
          strokeWidth={2}
          fill="url(#navGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#4f46e5" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
