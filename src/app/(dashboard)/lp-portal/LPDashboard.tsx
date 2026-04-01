"use client";

import { useLPDashboard, useLPDistributions } from "@/features/lp-portal";
import { Card, CardHeader, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { exportLPReportToPDF } from "@/features/reporting";
import { Button } from "@/components/ui/Button";
import { formatMillions, formatMultiple, formatDate } from "@/lib/utils";
import { SECTOR_LABELS } from "@/features/portfolio";
import { useState } from "react";

export function LPDashboard() {
  const { data, isLoading, error } = useLPDashboard();
  const [exporting, setExporting] = useState(false);

  const handleExportReport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportLPReportToPDF({
        lpName: "LP",
        fundName: data.fund.name,
        commitment: data.lp.commitmentSize,
        called: data.lp.calledAmount,
        distributed: data.lp.distributedAmount,
        nav: data.metrics.nav,
        tvpi: data.metrics.tvpi,
        dpi: data.metrics.dpi,
        irr: 0, // Would be calculated in production
      });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-amber-800 text-sm">
        <p className="font-semibold mb-1">Portail LP non disponible</p>
        <p>Votre compte n&apos;est pas encore associé à un fonds. Contactez votre gestionnaire.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fund info + export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{data.fund.name}</h2>
          <p className="text-sm text-gray-500">
            Millésime {data.fund.vintage} · Stratégie {data.fund.strategy}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={exporting}
          onClick={handleExportReport}
        >
          Télécharger rapport PDF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Mon engagement" value={formatMillions(data.lp.commitmentSize)} subValue={`Appelé: ${formatMillions(data.lp.calledAmount)}`} />
        <KpiCard label="NAV actuelle" value={formatMillions(data.metrics.nav)} subValue="Valeur résiduelle" />
        <KpiCard label="Distributions" value={formatMillions(data.lp.distributedAmount)} subValue={`DPI: ${formatMultiple(data.metrics.dpi)}`} />
        <KpiCard label="TVPI" value={formatMultiple(data.metrics.tvpi)} subValue={`RVPI: ${formatMultiple(data.metrics.rvpi)}`} />
      </div>

      {/* Engagement progress */}
      <Card>
        <CardHeader title="Engagement" subtitle="Suivi des appels de fonds" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Capital appelé</span>
            <span className="font-semibold font-mono">
              {formatMillions(data.lp.calledAmount)} / {formatMillions(data.lp.commitmentSize)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{
                width: `${data.lp.commitmentSize > 0
                  ? Math.min(100, (data.lp.calledAmount / data.lp.commitmentSize) * 100)
                  : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400">
            Reste à appeler : {formatMillions(data.lp.remainingCommitment)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio companies (read-only) */}
        <Card>
          <CardHeader title="Sociétés en Portefeuille" subtitle="Vue LP (pro-rata)" />
          <div className="space-y-2">
            {data.portfolioCompanies?.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune participation</p>
            ) : (
              data.portfolioCompanies?.map((company: {
                name: string;
                sector: string;
                investedAmount: number;
                currentValue: number;
              }) => (
                <div key={company.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-400">{SECTOR_LABELS[company.sector] ?? company.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-mono">{formatMillions(company.currentValue)}</p>
                    <p className="text-xs text-gray-400">vs {formatMillions(company.investedAmount)} investi</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent distributions */}
        <Card>
          <CardHeader title="Distributions Récentes" />
          <div className="space-y-2">
            {data.recentDistributions?.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune distribution</p>
            ) : (
              data.recentDistributions?.map((d: {
                id: string;
                distributionDate: string;
                amount: number;
                type: string;
              }) => (
                <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{formatDate(d.distributionDate)}</p>
                    <Badge variant="neutral" className="mt-0.5 text-xs">
                      {d.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold font-mono text-emerald-600">
                    +{formatMillions(d.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        Ces informations sont fournies à titre indicatif. Les valorisations sont basées sur les dernières marques disponibles.
        Données confidentielles — usage exclusif du destinataire.
      </p>
    </div>
  );
}
