"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompany, useValuations } from "@/features/portfolio";
import { ValuationChart } from "@/features/portfolio";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { useAddValuation } from "@/features/portfolio";
import {
  formatMillions,
  formatMultiple,
  formatPercent,
  formatDate,
  SECTOR_COLORS,
} from "@/lib/utils";
import { STATUS_LABELS, INSTRUMENT_LABELS, SECTOR_LABELS } from "@/features/portfolio";

interface CompanyDetailProps {
  id: string;
}

const VALUATION_METHOD_OPTIONS = [
  { value: "COMPARABLE_COMPANIES", label: "Comparables cotés" },
  { value: "DCF", label: "DCF" },
  { value: "COST", label: "Coût" },
  { value: "RECENT_TRANSACTION", label: "Transaction récente" },
  { value: "NAV", label: "Actif net" },
];

export function CompanyDetail({ id }: CompanyDetailProps) {
  const router = useRouter();
  const { data: company, isLoading } = useCompany(id);
  const { data: valuations } = useValuations(id);
  const addValuation = useAddValuation();
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [valuationForm, setValuationForm] = useState({
    nav: "",
    methodology: "COMPARABLE_COMPANIES",
    valuationDate: new Date().toISOString().split("T")[0],
    evMultiple: "",
    ltmEbitda: "",
    notes: "",
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-gray-400">Société introuvable</div>
    );
  }

  const totalInvested = company.investments.reduce(
    (s: number, i: { investedAmount: number }) => s + i.investedAmount, 0
  );
  const totalCurrent = company.investments.reduce(
    (s: number, i: { currentValue: number }) => s + i.currentValue, 0
  );

  const handleAddValuation = async () => {
    await addValuation.mutateAsync({
      companyId: id,
      nav: parseFloat(valuationForm.nav),
      methodology: valuationForm.methodology,
      valuationDate: new Date(valuationForm.valuationDate).toISOString(),
      evMultiple: valuationForm.evMultiple ? parseFloat(valuationForm.evMultiple) : undefined,
      ltmEbitda: valuationForm.ltmEbitda ? parseFloat(valuationForm.ltmEbitda) : undefined,
      notes: valuationForm.notes || undefined,
    });
    setShowValuationModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/portfolio")}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        }
      >
        Retour
      </Button>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-lg">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SECTOR_COLORS[company.sector]}`}>
                  {SECTOR_LABELS[company.sector]}
                </span>
                <span className="text-xs text-gray-400">{company.country}</span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {company.website}
                  </a>
                )}
              </div>
            </div>
          </div>
          <Badge variant={company.status === "ACTIVE" ? "success" : company.status === "EXITED" ? "neutral" : "danger"}>
            {STATUS_LABELS[company.status] ?? company.status}
          </Badge>
        </div>

        {company.description && (
          <p className="mt-4 text-sm text-gray-600">{company.description}</p>
        )}

        {/* Key metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400">Capital investi</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{formatMillions(totalInvested)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Valeur actuelle</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{formatMillions(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">MOIC</p>
            <p className={`text-lg font-bold font-mono ${company.moic >= 2 ? "text-emerald-600" : company.moic >= 1 ? "text-gray-900" : "text-red-600"}`}>
              {formatMultiple(company.moic)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">TRI Brut</p>
            <p className={`text-lg font-bold font-mono ${company.irr >= 0.2 ? "text-emerald-600" : company.irr >= 0.1 ? "text-amber-600" : "text-red-600"}`}>
              {company.irr != null ? formatPercent(company.irr * 100) : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Charts + Investments grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valuation evolution */}
        <Card>
          <CardHeader
            title="Évolution NAV"
            action={
              <Button size="sm" onClick={() => setShowValuationModal(true)}>
                + Valorisation
              </Button>
            }
          />
          {valuations && valuations.length > 0 ? (
            <ValuationChart data={valuations} investedAmount={totalInvested} />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Aucune valorisation enregistrée
            </div>
          )}
        </Card>

        {/* Investments table */}
        <Card>
          <CardHeader title="Instruments" />
          <Table
            keyExtractor={(i) => i.id}
            columns={[
              { key: "fund", header: "Fonds", render: (i) => i.fund?.name ?? "—" },
              {
                key: "instrumentType",
                header: "Type",
                render: (i) => (
                  <span className="text-xs">{INSTRUMENT_LABELS[i.instrumentType] ?? i.instrumentType}</span>
                ),
              },
              {
                key: "ownershipPct",
                header: "Détention",
                align: "right",
                render: (i) => formatPercent(i.ownershipPct),
              },
              {
                key: "entryDate",
                header: "Entrée",
                render: (i) => formatDate(i.entryDate),
              },
            ]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={company.investments as any[]}
          />
        </Card>
      </div>

      {/* KPI Snapshots */}
      {company.kpiSnapshots?.length > 0 && (
        <Card>
          <CardHeader title="KPIs Opérationnels" subtitle="Données trimestrielles" />
          <Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyExtractor={(k: any) => k.id}
            columns={[
              { key: "periodDate", header: "Période", render: (k) => formatDate(k.periodDate) },
              {
                key: "revenue",
                header: "CA (M€)",
                align: "right",
                render: (k) => k.revenue != null ? formatMillions(k.revenue) : "—",
              },
              {
                key: "ebitda",
                header: "EBITDA (M€)",
                align: "right",
                render: (k) => k.ebitda != null ? formatMillions(k.ebitda) : "—",
              },
              {
                key: "ebitdaMargin",
                header: "Marge",
                align: "right",
                render: (k) => k.ebitdaMargin != null ? formatPercent(k.ebitdaMargin) : "—",
              },
              {
                key: "revenueGrowth",
                header: "Croissance",
                align: "right",
                render: (k) => k.revenueGrowth != null ? (
                  <span className={k.revenueGrowth >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {k.revenueGrowth >= 0 ? "+" : ""}{formatPercent(k.revenueGrowth)}
                  </span>
                ) : "—",
              },
              {
                key: "headcount",
                header: "Effectifs",
                align: "right",
                render: (k) => k.headcount?.toLocaleString("fr-FR") ?? "—",
              },
            ]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={company.kpiSnapshots as any[]}
          />
        </Card>
      )}

      {/* Valuation modal */}
      <Modal
        open={showValuationModal}
        onClose={() => setShowValuationModal(false)}
        title="Nouvelle valorisation"
        description="Enregistrer une valorisation NAV pour cette participation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowValuationModal(false)}>
              Annuler
            </Button>
            <Button
              loading={addValuation.isPending}
              onClick={handleAddValuation}
              disabled={!valuationForm.nav}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Date de valorisation"
            type="date"
            value={valuationForm.valuationDate}
            onChange={(e) => setValuationForm((f) => ({ ...f, valuationDate: e.target.value }))}
          />
          <Input
            label="NAV (M€)"
            type="number"
            step="0.1"
            min="0"
            placeholder="ex: 45.5"
            value={valuationForm.nav}
            onChange={(e) => setValuationForm((f) => ({ ...f, nav: e.target.value }))}
          />
          <Select
            label="Méthodologie"
            options={VALUATION_METHOD_OPTIONS}
            value={valuationForm.methodology}
            onChange={(e) => setValuationForm((f) => ({ ...f, methodology: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Multiple EV/EBITDA"
              type="number"
              step="0.1"
              placeholder="ex: 8.5"
              value={valuationForm.evMultiple}
              onChange={(e) => setValuationForm((f) => ({ ...f, evMultiple: e.target.value }))}
            />
            <Input
              label="LTM EBITDA (M€)"
              type="number"
              step="0.1"
              value={valuationForm.ltmEbitda}
              onChange={(e) => setValuationForm((f) => ({ ...f, ltmEbitda: e.target.value }))}
            />
          </div>
          {addValuation.isError && (
            <p className="text-sm text-red-600">{(addValuation.error as Error).message}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
