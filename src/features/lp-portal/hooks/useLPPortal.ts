"use client";

import { useQuery } from "@tanstack/react-query";

export function useLPDashboard() {
  return useQuery({
    queryKey: ["lp-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/lp/dashboard");
      if (!res.ok) throw new Error("Erreur chargement portail LP");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

export function useLPCapitalCalls() {
  return useQuery({
    queryKey: ["lp-capital-calls"],
    queryFn: async () => {
      const res = await fetch("/api/lp/capital-calls");
      if (!res.ok) throw new Error("Erreur chargement appels de fonds");
      return res.json();
    },
  });
}

export function useLPDistributions() {
  return useQuery({
    queryKey: ["lp-distributions"],
    queryFn: async () => {
      const res = await fetch("/api/lp/distributions");
      if (!res.ok) throw new Error("Erreur chargement distributions");
      return res.json();
    },
  });
}
