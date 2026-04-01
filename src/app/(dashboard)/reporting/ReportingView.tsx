"use client";

import { usePortfolioSummary, useSectorAllocation, useVintagePerformance } from "@/features/reporting";
import { SectorPieChart } from "@/features/reporting";
import { VintageBarChart } from "@/features/reporting";
import { exportPortfolioToPDF, exportToExcel } from "@/features/reporting";
import { Card, CardHeader, KpiCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMillions, formatMultiple } from "@/lib/utils";
import { useState } from "react";

export function ReportingView() {
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { data: sectorData } = useSectorAllocation();
  const { data: vintageData } = useVintagePerformance();
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // In production this would use real data
      await exportPortfolioToPDF([], "Tous les fonds");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!summary) return;
    setExporting(true);
    try {
      await exportToExcel(
        [
          {
            "AUM Total (M€)": summary.totalAUM.toFixed(1),
            "Capital Investi (M€)": summary.totalInvested.toFixed(1),
            "Valeur Actuelle (M€)": summary.totalCurrentValue.toFixed(1),
            "MOIC": summary.moic.toFixed(2),
            "TVPI": summary.tvpi.toFixed(2),
            "DPI": summary.dpi.toFixed(2),
            "RVPI": summary.rvpi.toFixed(2),
          },
        ],
        "pe-platform-report",
        "Performance"
      );
    } finally {
      setExporting(false);
    }
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-gray-100" />
          <div className="h-72 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          size="sm"
          loading={exporting}
          onClick={handleExportExcel}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Export Excel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={exporting}
          onClick={handleExportPDF}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        >
          Export PDF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="TVPI" value={formatMultiple(summary?.tvpi ?? 0)} subValue="Total Value to Paid-In" />
        <KpiCard label="DPI" value={formatMultiple(summary?.dpi ?? 0)} subValue="Distributions to Paid-In" />
        <KpiCard label="RVPI" value={formatMultiple(summary?.rvpi ?? 0)} subValue="Residual Value to Paid-In" />
        <KpiCard label="MOIC" value={formatMultiple(summary?.moic ?? 0)} subValue="Multiple on Invested Capital" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <Card>
          <CardHeader
            title="Allocation Sectorielle"
            subtitle="Par valeur actuelle"
          />
          {sectorData?.length > 0 ? (
            <SectorPieChart data={sectorData} />
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              Pas de données disponibles
            </div>
          )}
        </Card>

        {/* Vintage Performance */}
        <Card>
          <CardHeader
            title="Performance par Millésime"
            subtitle="MOIC, TRI et DPI par vintage"
          />
          {vintageData?.length > 0 ? (
            <VintageBarChart data={vintageData} />
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              Pas de données disponibles
            </div>
          )}
        </Card>
      </div>

      {/* Fund breakdown */}
      {summary?.funds?.length > 0 && (
        <Card>
          <CardHeader title="Performance par Fonds" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Fonds", "Millésime", "Taille cible", "Appelé", "NAV", "Participations"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.funds.map((fund: {
                  id: string;
                  name: string;
                  vintage: number;
                  targetSize: number;
                  calledCapital: number;
                  committedCapital: number;
                  companyCount: number;
                }) => (
                  <tr key={fund.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{fund.name}</td>
                    <td className="px-4 py-3 text-gray-500">{fund.vintage}</td>
                    <td className="px-4 py-3 font-mono">{formatMillions(fund.targetSize)}</td>
                    <td className="px-4 py-3 font-mono">{formatMillions(fund.calledCapital)}</td>
                    <td className="px-4 py-3 font-mono">{formatMillions(fund.committedCapital)}</td>
                    <td className="px-4 py-3">{fund.companyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
