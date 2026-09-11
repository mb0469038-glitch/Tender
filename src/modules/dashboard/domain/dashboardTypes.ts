export type RealOpeningItem = {
  id: string;
  name: string;
  projectName: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  areaM2: number;
  perimeterM: number;
  systemName: string;
  glassLabel?: string;
  color?: string;
  leaves?: number;
};

export type RealProjectSummary = {
  id: string;
  name: string;
  client: string;
  location: string;
  year: string;
  itemsCount: number;
  totalGlazingM2: number;
  totalPerimeterM: number;
  primarySystem: string;
};

export type RealSystemShare = {
  system: string;
  areaM2: number;
  percentage: number;
  openingsCount: number;
  color: string;
};

export type RealCatalogCategory = {
  category: string;
  count: number;
  percentage: number;
  color: string;
};

export type RealDashboardSummary = {
  totalProjects: number;
  totalOpenings: number;
  totalGlazingM2: number;
  totalPerimeterM: number;
  totalMaterials: number;
  totalAssemblies: number;
  totalExecutionProjects: number;
  totalMarkupRules: number;
  projects: RealProjectSummary[];
  openings: RealOpeningItem[];
  systemsShare: RealSystemShare[];
  catalogCategories: RealCatalogCategory[];
  manpowerHourlyRates: { name: string; rate: number }[];
};
