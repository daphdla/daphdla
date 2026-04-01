"use client";

import { useState } from "react";
import { DealStage } from "@prisma/client";
import { cn, formatMillions, DEAL_STAGE_COLORS, STAGE_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useUpdateDealStage } from "../hooks/useDeals";
import { PIPELINE_STAGES } from "../types";
import { DealWithDetails } from "@/types";

interface PipelineBoardProps {
  deals: DealWithDetails[];
  onDealClick: (deal: DealWithDetails) => void;
}

const PRIORITY_DOTS: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-gray-400",
};

export function PipelineBoard({ deals, onDealClick }: PipelineBoardProps) {
  const updateStage = useUpdateDealStage();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dealsByStage = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<DealStage, DealWithDetails[]>
  );

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId && draggingId === dealId) {
      updateStage.mutate({ id: dealId, stage: targetStage });
    }
    setDraggingId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-0">
      {PIPELINE_STAGES.map((stage) => {
        const stageDeals = dealsByStage[stage] ?? [];
        const stageValue = stageDeals.reduce((s, d) => s + (d.askingPrice ?? 0), 0);

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-64"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Stage header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    DEAL_STAGE_COLORS[stage]
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-gray-400 font-medium">{stageDeals.length}</span>
              </div>
              {stageValue > 0 && (
                <span className="text-xs text-gray-400">{formatMillions(stageValue)}</span>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("dealId", deal.id);
                    setDraggingId(deal.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => onDealClick(deal)}
                  className={cn(
                    "bg-white rounded-lg border border-gray-100 p-3 shadow-sm",
                    "hover:shadow-md hover:border-primary-200 transition-all",
                    "cursor-pointer select-none",
                    draggingId === deal.id && "opacity-50 rotate-1"
                  )}
                >
                  {/* Priority + name */}
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", PRIORITY_DOTS[deal.priority])} />
                    <p className="text-sm font-medium text-gray-900 leading-tight">{deal.name}</p>
                  </div>

                  {/* Sector + country */}
                  {(deal.sector || deal.country) && (
                    <p className="mt-1.5 ml-4 text-xs text-gray-400">
                      {[deal.sector, deal.country].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {/* Value */}
                  {deal.askingPrice && (
                    <p className="mt-2 ml-4 text-xs font-semibold text-gray-700 font-mono">
                      {formatMillions(deal.askingPrice)}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-2 ml-4 flex items-center gap-2">
                    <span className="text-xs text-gray-400">{deal.probability}%</span>
                    {deal._count.dueDiligences > 0 && (
                      <span className="text-xs text-gray-400">
                        · {deal._count.dueDiligences} DD
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {stageDeals.length === 0 && (
                <div className="h-16 rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-300">Déposer ici</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
