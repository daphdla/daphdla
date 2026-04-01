"use client";

import { cn, formatMillions, formatMultiple, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SECTOR_LABELS, STATUS_LABELS } from "../utils";

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    sector: string;
    country: string;
    status: string;
    logoUrl?: string | null;
    investments: Array<{
      investedAmount: number;
      currentValue: number;
      ownershipPct: number;
    }>;
    moic?: number;
    irr?: number | null;
  };
  onClick?: () => void;
}

const statusVariant: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  ACTIVE: "success",
  EXITED: "neutral",
  WRITTEN_OFF: "danger",
  WATCHLIST: "warning",
};

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  const totalInvested = company.investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = company.investments.reduce((s, i) => s + i.currentValue, 0);
  const moic = company.moic ?? (totalInvested > 0 ? totalCurrent / totalInvested : 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card p-5",
        "hover:shadow-card-hover hover:border-primary-200 transition-all duration-200",
        "cursor-pointer group"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              company.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">
              {company.name}
            </h3>
            <p className="text-xs text-gray-400">{company.country}</p>
          </div>
        </div>
        <Badge variant={statusVariant[company.status] ?? "neutral"}>
          {STATUS_LABELS[company.status] ?? company.status}
        </Badge>
      </div>

      {/* Sector */}
      <p className="text-xs text-gray-500 mb-4">
        {SECTOR_LABELS[company.sector] ?? company.sector}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-400">Investi</p>
          <p className="text-sm font-semibold text-gray-900 font-mono">
            {formatMillions(totalInvested)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Valeur</p>
          <p className="text-sm font-semibold text-gray-900 font-mono">
            {formatMillions(totalCurrent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">MOIC</p>
          <p className={cn(
            "text-sm font-semibold font-mono",
            moic >= 2 ? "text-emerald-600" : moic >= 1 ? "text-gray-900" : "text-red-600"
          )}>
            {formatMultiple(moic)}
          </p>
        </div>
      </div>

      {/* IRR */}
      {company.irr !== null && company.irr !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">TRI Brut</span>
          <span className={cn(
            "text-xs font-semibold font-mono",
            company.irr >= 0.2 ? "text-emerald-600" : company.irr >= 0.1 ? "text-amber-600" : "text-red-600"
          )}>
            {formatPercent(company.irr * 100)}
          </span>
        </div>
      )}
    </div>
  );
}
