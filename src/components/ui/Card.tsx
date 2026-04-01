import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card p-6",
        hover && "hover:shadow-card-hover transition-shadow duration-200 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;      // % change
  subValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({ label, value, change, subValue, icon, className }: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && (
          <div className="p-2 rounded-lg bg-primary-50 text-primary-600">{icon}</div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900 font-mono">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {subValue && <span className="text-xs text-gray-400">{subValue}</span>}
      </div>
    </Card>
  );
}
