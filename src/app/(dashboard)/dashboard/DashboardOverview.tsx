"use client";

import { usePortfolioSummary } from "@/features/reporting";
import { KpiCard } from "@/components/ui/Card";
import { formatMillions, formatMultiple, formatPercent } from "@/lib/utils";

// ─── SVG Icons ────────────────────────────────────────────────────────────

const TrendingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function DashboardOverview() {
  const { data: summary, isLoading, error } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
        Erreur de chargement des données. Vérifiez votre connexion.
      </div>
    );
  }

  const kpis = [
    {
      label: "AUM Total",
      value: formatMillions(summary.totalAUM),
      subValue: `${summary.fundCount} fonds`,
      icon: <MoneyIcon />,
    },
    {
      label: "Capital Investi",
      value: formatMillions(summary.totalInvested),
      subValue: `${summary.activeInvestments} participations actives`,
      icon: <BuildingIcon />,
    },
    {
      label: "MOIC Pondéré",
      value: formatMultiple(summary.moic),
      icon: <TrendingIcon />,
    },
    {
      label: "TVPI",
      value: formatMultiple(summary.tvpi),
      subValue: `DPI ${formatMultiple(summary.dpi)} · RVPI ${formatMultiple(summary.rvpi)}`,
      icon: <ChartIcon />,
    },
    {
      label: "Valeur Actuelle",
      value: formatMillions(summary.totalCurrentValue),
      subValue: `vs ${formatMillions(summary.totalInvested)} investi`,
      icon: <TrendingIcon />,
    },
    {
      label: "Distributions",
      value: formatMillions(summary.totalDistributions),
      subValue: `DPI ${formatMultiple(summary.dpi)}`,
      icon: <MoneyIcon />,
    },
    {
      label: "Sorties réalisées",
      value: `${summary.exits}`,
      subValue: `${summary.activeInvestments} actives`,
      icon: <BuildingIcon />,
    },
    {
      label: "Deals actifs",
      value: `${Object.entries(summary.activeDealsByStage ?? {})
        .filter(([s]) => !["CLOSED", "PASSED"].includes(s))
        .reduce((s, [, v]) => s + (v as number), 0)}`,
      subValue: "en pipeline",
      icon: <ChartIcon />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Fund summary */}
      {summary.funds?.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Fonds actifs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.funds.map((fund: {
              id: string;
              name: string;
              vintage: number;
              calledCapital: number;
              targetSize: number;
              committedCapital: number;
              companyCount: number;
            }) => (
              <div
                key={fund.id}
                className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{fund.name}</h3>
                  <span className="text-xs text-gray-400">Vintage {fund.vintage}</span>
                </div>

                {/* Commitment bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Appelé</span>
                    <span>
                      {formatMillions(fund.calledCapital)} /{" "}
                      {formatMillions(fund.committedCapital)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{
                        width: `${fund.committedCapital > 0
                          ? Math.min(100, (fund.calledCapital / fund.committedCapital) * 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  {fund.companyCount} participation{fund.companyCount !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
