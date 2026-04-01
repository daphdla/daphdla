import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Tailwind merge helper ─────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Number formatters ─────────────────────────────────────────────────────

export function formatCurrency(
  value: number,
  currency = "EUR",
  compact = false
): string {
  if (compact) {
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    }
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMillions(value: number, decimals = 1): string {
  return `€${value.toFixed(decimals)}M`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiple(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}x`;
}

// ─── Date helpers ──────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "MM/yyyy");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

// ─── String helpers ────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .trim();
}

// ─── Color helpers for sectors/stages ─────────────────────────────────────

export const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: "bg-blue-100 text-blue-800",
  HEALTHCARE: "bg-green-100 text-green-800",
  FINANCIAL_SERVICES: "bg-purple-100 text-purple-800",
  CONSUMER: "bg-orange-100 text-orange-800",
  INDUSTRIALS: "bg-gray-100 text-gray-800",
  ENERGY: "bg-yellow-100 text-yellow-800",
  REAL_ESTATE: "bg-red-100 text-red-800",
  MEDIA: "bg-pink-100 text-pink-800",
  EDUCATION: "bg-teal-100 text-teal-800",
  OTHER: "bg-slate-100 text-slate-800",
};

export const DEAL_STAGE_COLORS: Record<string, string> = {
  SCREENING: "bg-slate-100 text-slate-700",
  FIRST_MEETING: "bg-blue-100 text-blue-700",
  LOI: "bg-yellow-100 text-yellow-700",
  DUE_DILIGENCE: "bg-orange-100 text-orange-700",
  IC_APPROVED: "bg-purple-100 text-purple-700",
  CLOSING: "bg-indigo-100 text-indigo-700",
  CLOSED: "bg-green-100 text-green-700",
  PASSED: "bg-red-100 text-red-700",
};

export const STAGE_LABELS: Record<string, string> = {
  SCREENING: "Screening",
  FIRST_MEETING: "1er Meeting",
  LOI: "LOI",
  DUE_DILIGENCE: "Due Diligence",
  IC_APPROVED: "IC Approuvé",
  CLOSING: "Closing",
  CLOSED: "Finalisé",
  PASSED: "Passé",
};
