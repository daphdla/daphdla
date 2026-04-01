import { DealPriority, DealStage, Sector, SourceType } from "@prisma/client";

export type DealFormData = {
  name: string;
  stage: DealStage;
  priority: DealPriority;
  sector?: Sector;
  country?: string;
  targetRevenue?: number;
  targetEbitda?: number;
  askingPrice?: number;
  sourceType: SourceType;
  sourceName?: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
};

export type DealFilters = {
  stage?: DealStage;
  priority?: DealPriority;
  sector?: Sector;
  search?: string;
};

export const PIPELINE_STAGES: DealStage[] = [
  "SCREENING",
  "FIRST_MEETING",
  "LOI",
  "DUE_DILIGENCE",
  "IC_APPROVED",
  "CLOSING",
  "CLOSED",
  "PASSED",
];
