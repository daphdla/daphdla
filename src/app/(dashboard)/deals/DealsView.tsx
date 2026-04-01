"use client";

import { useState } from "react";
import { useDeals, useCreateDeal } from "@/features/deals";
import { PipelineBoard } from "@/features/deals";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { DealWithDetails } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatMillions, formatDate, DEAL_STAGE_COLORS, STAGE_LABELS } from "@/lib/utils";

const SOURCE_OPTIONS = [
  { value: "PROPRIETARY", label: "Propriétaire" },
  { value: "INTERMEDIARY", label: "Intermédiaire" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "CO_INVESTOR", label: "Co-investisseur" },
  { value: "INBOUND", label: "Entrant" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "Haute" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "LOW", label: "Basse" },
];

type ViewMode = "board" | "list";

export function DealsView() {
  const [view, setView] = useState<ViewMode>("board");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithDetails | null>(null);

  const { data: deals = [], isLoading } = useDeals();
  const createDeal = useCreateDeal();

  const [form, setForm] = useState({
    name: "",
    sourceType: "PROPRIETARY",
    priority: "MEDIUM",
    sector: "",
    country: "",
    askingPrice: "",
    probability: "50",
    notes: "",
  });

  const handleCreate = async () => {
    await createDeal.mutateAsync({
      name: form.name,
      sourceType: form.sourceType as "PROPRIETARY",
      priority: form.priority as "HIGH" | "MEDIUM" | "LOW",
      sector: form.sector as never || undefined,
      country: form.country || undefined,
      askingPrice: form.askingPrice ? parseFloat(form.askingPrice) : undefined,
      probability: parseInt(form.probability),
      notes: form.notes || undefined,
      stage: "SCREENING",
    });
    setShowCreate(false);
    setForm({ name: "", sourceType: "PROPRIETARY", priority: "MEDIUM", sector: "", country: "", askingPrice: "", probability: "50", notes: "" });
  };

  const activeDeals = deals.filter((d: DealWithDetails) => !["CLOSED", "PASSED"].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((s: number, d: DealWithDetails) => s + (d.askingPrice ?? 0) * (d.probability / 100), 0);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView("board")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === "board" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Liste
            </button>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{activeDeals.length}</span> deals actifs ·{" "}
            <span className="font-medium font-mono">{formatMillions(totalPipelineValue)}</span> valeur pondérée
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          + Nouveau deal
        </Button>
      </div>

      {/* Views */}
      {isLoading ? (
        <div className="animate-pulse h-96 rounded-xl bg-gray-100" />
      ) : view === "board" ? (
        <PipelineBoard deals={deals} onDealClick={setSelectedDeal} />
      ) : (
        <DealsList deals={deals} onDealClick={setSelectedDeal} />
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nouveau deal"
        description="Ajouter une opportunité au pipeline"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button loading={createDeal.isPending} onClick={handleCreate} disabled={!form.name}>
              Créer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom de la société / opportunité *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ex: TechCo SAS"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Source"
              options={SOURCE_OPTIONS}
              value={form.sourceType}
              onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value }))}
            />
            <Select
              label="Priorité"
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pays"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="France"
            />
            <Input
              label="Prix demandé (M€ VE)"
              type="number"
              step="0.5"
              value={form.askingPrice}
              onChange={(e) => setForm((f) => ({ ...f, askingPrice: e.target.value }))}
              placeholder="ex: 120"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Probabilité de closing: {form.probability}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.probability}
              onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))}
              className="w-full mt-1 accent-primary-600"
            />
          </div>
        </div>
      </Modal>

      {/* Deal detail modal */}
      {selectedDeal && (
        <Modal
          open={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          title={selectedDeal.name}
          size="lg"
          footer={<Button variant="secondary" onClick={() => setSelectedDeal(null)}>Fermer</Button>}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${DEAL_STAGE_COLORS[selectedDeal.stage]}`}>
                {STAGE_LABELS[selectedDeal.stage]}
              </span>
              <Badge variant={selectedDeal.priority === "HIGH" ? "danger" : selectedDeal.priority === "LOW" ? "neutral" : "warning"}>
                {selectedDeal.priority === "HIGH" ? "Haute" : selectedDeal.priority === "LOW" ? "Basse" : "Moyenne"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedDeal.askingPrice && (
                <div>
                  <p className="text-gray-400">Prix demandé</p>
                  <p className="font-semibold font-mono">{formatMillions(selectedDeal.askingPrice)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Probabilité</p>
                <p className="font-semibold">{selectedDeal.probability}%</p>
              </div>
              {selectedDeal.country && (
                <div>
                  <p className="text-gray-400">Pays</p>
                  <p className="font-semibold">{selectedDeal.country}</p>
                </div>
              )}
              {selectedDeal.expectedCloseDate && (
                <div>
                  <p className="text-gray-400">Closing estimé</p>
                  <p className="font-semibold">{formatDate(selectedDeal.expectedCloseDate)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Créé par</p>
                <p className="font-semibold">{selectedDeal.creator.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Date création</p>
                <p className="font-semibold">{formatDate(selectedDeal.createdAt)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────

function DealsList({
  deals,
  onDealClick,
}: {
  deals: DealWithDetails[];
  onDealClick: (deal: DealWithDetails) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {["Nom", "Stage", "Priorité", "Valeur (M€)", "Proba.", "Équipe", "Créé le"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {deals.map((deal) => (
            <tr
              key={deal.id}
              onClick={() => onDealClick(deal)}
              className="hover:bg-primary-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3.5 font-medium text-gray-900">{deal.name}</td>
              <td className="px-4 py-3.5">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${DEAL_STAGE_COLORS[deal.stage]}`}>
                  {STAGE_LABELS[deal.stage]}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={deal.priority === "HIGH" ? "danger" : deal.priority === "LOW" ? "neutral" : "warning"}>
                  {deal.priority === "HIGH" ? "Haute" : deal.priority === "LOW" ? "Basse" : "Moy."}
                </Badge>
              </td>
              <td className="px-4 py-3.5 font-mono text-right">
                {deal.askingPrice ? formatMillions(deal.askingPrice) : "—"}
              </td>
              <td className="px-4 py-3.5 text-right">{deal.probability}%</td>
              <td className="px-4 py-3.5 text-gray-500">
                {deal.assignments.map((a) => a.user.name).join(", ") || deal.creator.name}
              </td>
              <td className="px-4 py-3.5 text-gray-400">{formatDate(deal.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
