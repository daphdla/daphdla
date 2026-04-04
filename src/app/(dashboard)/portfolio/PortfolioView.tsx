"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioCompanies } from "@/features/portfolio";
import { CompanyCard } from "@/features/portfolio";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CompanyStatus, Sector } from "@prisma/client";

const SECTOR_OPTIONS = [
  { value: "", label: "Tous les secteurs" },
  { value: "TECHNOLOGY", label: "Technologie" },
  { value: "HEALTHCARE", label: "Santé" },
  { value: "FINANCIAL_SERVICES", label: "Services Financiers" },
  { value: "CONSUMER", label: "Consommation" },
  { value: "INDUSTRIALS", label: "Industrie" },
  { value: "ENERGY", label: "Énergie" },
  { value: "REAL_ESTATE", label: "Immobilier" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "ACTIVE", label: "Actif" },
  { value: "EXITED", label: "Cédé" },
  { value: "WRITTEN_OFF", label: "Déprécié" },
  { value: "WATCHLIST", label: "Surveillance" },
];

export function PortfolioView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<Sector | "">("");
  const [status, setStatus] = useState<CompanyStatus | "">("");

  const { data: companies, isLoading } = usePortfolioCompanies({
    search: search || undefined,
    sector: (sector as Sector) || undefined,
    status: (status as CompanyStatus) || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Rechercher une société..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <Select
          options={SECTOR_OPTIONS}
          value={sector}
          onChange={(e) => setSector(e.target.value as Sector | "")}
          className="w-48"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value as CompanyStatus | "")}
          className="w-44"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSearch(""); setSector(""); setStatus(""); }}
        >
          Réinitialiser
        </Button>
      </div>

      {/* Count */}
      {!isLoading && companies && (
        <p className="text-sm text-gray-500">
          {companies.length} société{companies.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : companies?.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏢</p>
          <p className="font-medium">Aucune société trouvée</p>
          <p className="text-sm mt-1">Modifiez les filtres ou ajoutez une participation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {companies?.map((company: Parameters<typeof CompanyCard>[0]["company"] & { id: string }) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => router.push(`/portfolio/${company.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
