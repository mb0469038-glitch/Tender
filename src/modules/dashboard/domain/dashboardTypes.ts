export type TrendDirection = "up" | "down" | "neutral";

export type KpiMetric = {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: TrendDirection;
  period: string;
  subtext: string;
};

export type MonthlyTenderDemand = {
  month: string;
  extrusionTons: number;
  glazingAreaM2: number;
  pipelineValueUsd: number;
};

export type FacadeSystemShare = {
  system: string;
  areaM2: number;
  percentage: number;
  extrusionTons: number;
  color: string;
};

export type CuttingOptimizationYield = {
  overallYieldPercent: number;
  kerfWastagePercent: number;
  trimWastagePercent: number;
  reclaimedOffcutsKg: number;
  targetBenchmarkPercent: number;
  standardBarLengthM: number;
};

export type AlloyInventory = {
  alloy: string;
  description: string;
  onHandTons: number;
  allocatedTons: number;
  availableTons: number;
  minSafetyTons: number;
};

export type FacadeTenderProject = {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  envelopeType: string;
  glazingM2: number;
  extrusionTons: number;
  packageValueUsd: number;
  status: "Tender In Review" | "Takeoff in Progress" | "Fabrication" | "Submitted" | "Awarded";
  winProbability: number;
  year: string;
};
