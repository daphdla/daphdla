"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortfolioFilters } from "../types";

// ─── Query keys ───────────────────────────────────────────────────────────

export const portfolioKeys = {
  all: ["portfolio"] as const,
  companies: (filters?: PortfolioFilters) => [...portfolioKeys.all, "companies", filters] as const,
  company: (id: string) => [...portfolioKeys.all, "company", id] as const,
  valuations: (companyId: string) => [...portfolioKeys.all, "valuations", companyId] as const,
  kpis: (companyId: string) => [...portfolioKeys.all, "kpis", companyId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────

export function usePortfolioCompanies(filters?: PortfolioFilters) {
  const params = new URLSearchParams();
  if (filters?.sector) params.set("sector", filters.sector);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.fundId) params.set("fundId", filters.fundId);
  if (filters?.search) params.set("search", filters.search);

  return useQuery({
    queryKey: portfolioKeys.companies(filters),
    queryFn: async () => {
      const res = await fetch(`/api/portfolio?${params}`);
      if (!res.ok) throw new Error("Erreur chargement portfolio");
      return res.json();
    },
    // Refresh every 30s for near real-time updates
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: portfolioKeys.company(id),
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/${id}`);
      if (!res.ok) throw new Error("Entreprise introuvable");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useValuations(companyId: string) {
  return useQuery({
    queryKey: portfolioKeys.valuations(companyId),
    queryFn: async () => {
      const res = await fetch(`/api/valuations?companyId=${companyId}`);
      if (!res.ok) throw new Error("Erreur chargement valorisations");
      return res.json();
    },
    enabled: !!companyId,
  });
}

export function useAddValuation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur création valorisation");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.valuations(variables.companyId as string),
      });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

export function useKpiSnapshots(companyId: string) {
  return useQuery({
    queryKey: portfolioKeys.kpis(companyId),
    queryFn: async () => {
      const res = await fetch(`/api/kpis?companyId=${companyId}`);
      if (!res.ok) throw new Error("Erreur chargement KPIs");
      return res.json();
    },
    enabled: !!companyId,
  });
}
