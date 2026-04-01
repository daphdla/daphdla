"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DealFilters, DealFormData } from "../types";
import { DealStage } from "@prisma/client";

export const dealKeys = {
  all: ["deals"] as const,
  list: (filters?: DealFilters) => [...dealKeys.all, "list", filters] as const,
  detail: (id: string) => [...dealKeys.all, "detail", id] as const,
  pipeline: () => [...dealKeys.all, "pipeline"] as const,
};

export function useDeals(filters?: DealFilters) {
  const params = new URLSearchParams();
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.sector) params.set("sector", filters.sector);
  if (filters?.search) params.set("search", filters.search);

  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: async () => {
      const res = await fetch(`/api/deals?${params}`);
      if (!res.ok) throw new Error("Erreur chargement deals");
      return res.json();
    },
    refetchInterval: 30_000,
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/deals/${id}`);
      if (!res.ok) throw new Error("Deal introuvable");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DealFormData) => {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur création deal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour stage");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}
