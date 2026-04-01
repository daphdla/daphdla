"use client";

import { useQuery } from "@tanstack/react-query";

export const reportingKeys = {
  all: ["reporting"] as const,
  summary: () => [...reportingKeys.all, "summary"] as const,
  fundKpis: (fundId?: string) => [...reportingKeys.all, "fundKpis", fundId] as const,
  sectorAlloc: () => [...reportingKeys.all, "sectorAlloc"] as const,
  vintagePerf: () => [...reportingKeys.all, "vintagePerf"] as const,
};

export function usePortfolioSummary() {
  return useQuery({
    queryKey: reportingKeys.summary(),
    queryFn: async () => {
      const res = await fetch("/api/reporting/summary");
      if (!res.ok) throw new Error("Erreur chargement summary");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useFundKPIs(fundId?: string) {
  const params = fundId ? `?fundId=${fundId}` : "";
  return useQuery({
    queryKey: reportingKeys.fundKpis(fundId),
    queryFn: async () => {
      const res = await fetch(`/api/reporting/kpis${params}`);
      if (!res.ok) throw new Error("Erreur chargement KPIs");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

export function useSectorAllocation() {
  return useQuery({
    queryKey: reportingKeys.sectorAlloc(),
    queryFn: async () => {
      const res = await fetch("/api/reporting/sector-allocation");
      if (!res.ok) throw new Error("Erreur chargement allocation");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useVintagePerformance() {
  return useQuery({
    queryKey: reportingKeys.vintagePerf(),
    queryFn: async () => {
      const res = await fetch("/api/reporting/vintage");
      if (!res.ok) throw new Error("Erreur chargement vintage");
      return res.json();
    },
    staleTime: 60_000,
  });
}
