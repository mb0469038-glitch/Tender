export type Material = {
  id: string;
  name: string;
  code: string;
  supplierCode: string;
  category: string;
  unit: string;
  weight: number;
  rateMethod?: "manual" | "weight";
  manualRate?: number;
  weightRateTableId?: string;
  priceMethod: string;
  cost: number;
  shippingPercentage?: number;
  shippingTypeId?: string;
  options: string[];
  properties: string[];
  sketch: string;
  manufacturer?: string;
  databaseId?: string;
  /** Optional sub-table used inside a separate company database. */
  companyTableId?: string;
  quantityFormula?: string;
  wastage?: number;
  priceTable?: "profiles" | "accessories" | "general";
  thickness?: string;
  description?: string;
};

export type AssemblyPart = {
  id?: string;
  materialId: string;
  quantity: number;
  quantityFormula?: string;
  quantityFormulaOtherwise?: string;
  quantityFormulaFourPanels?: string;
  conditionFormula?: string;
  label?: string;
};

export type JoinModification = {
  materialId: string;
  topFormula: string;
  bottomFormula: string;
  leftFormula: string;
  rightFormula: string;
};

export type FrameType = {
  id: string;
  type: string;
  condition: string;
};
export type AssemblyNameRule = { id: string; name: string; condition: string };
/** A canvas property that this assembly inherits from selected joined assembly types. */
export type JoinPropertyMatch = {
  id: string;
  property: string;
  withAssemblyIds: string[];
};

/** Values copied to a new canvas opening when this assembly is selected. */
export type AssemblyCanvasDefaults = {
  width?: number;
  height?: number;
  leaves?: 1 | 2 | 3 | 4;
  openingType?: "window" | "door";
  leafSize?: "small" | "big";
  frameSize?: "small" | "big";
  hasArchitrave?: boolean;
  hasArchitraveAllowance?: boolean;
  reinforced?: boolean;
  hasCoating?: boolean;
};

export type BreakdownRule = {
  id: string;
  materialId: string;
  property: string;
  operator: string;
  value: string;
  quantityWhenTrue: string;
  quantityOtherwise: string;
  measureFormula: string;
};

export type Assembly = {
  id: string;
  name: string;
  code: string;
  category: string;
  properties: string[];
  parts: AssemblyPart[];
  joinModifications?: JoinModification[];
  frameTypes?: FrameType[];
  nameRules?: AssemblyNameRule[];
  realJoinPropertyMatches?: JoinPropertyMatch[];
  fakeJoinPropertyMatches?: JoinPropertyMatch[];
  /** Source used for a one-time copy of the property-match tables. */
  joinPropertyMatchSource?: string;
  rules: BreakdownRule[];
  sketch: string;
  referenceImage?: string;
  manufacturer?: string;
  databaseId?: string;
  templateSource?: "hinged-fyn";
  color?: string;
  assemblyPage?: string;
  canvasDefaults?: AssemblyCanvasDefaults;
};

export type CanvasItem = {
  id: string;
  sourceId: string;
  kind: "assembly" | "material";
  name: string;
  sketch: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputWidth?: number;
  inputHeight?: number;
  quantity?: number;
  /** Project drawing reference, assigned in item creation order. */
  reference?: number;
  /** Shared customer-facing name for a Real or Fake joined combination. */
  combinationName?: string;
  leaves?: 1 | 2 | 3 | 4;
  openingType?: "window" | "door";
  leafSize?: "small" | "big";
  frameSize?: "small" | "big";
  hasArchitrave?: boolean;
  hasArchitraveAllowance?: boolean;
  reinforced?: boolean;
  hasFlyScreen?: boolean;
  hasCoating?: boolean;
  color?: string;
  glassMaterialId?: string;
  glassLabel?: string;
  parameters?: Record<string, number>;
  assemblyPage?: string;
  materialAdjustments?: Record<string, string>;
  joinedWindowIds?: string[];
  realJoinedWindowIds?: string[];
};

export type WindowCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type ManpowerParameter = "width" | "height" | "area" | "perimeter";
export type ProjectCanvas = {
  id: string;
  name: string;
  items: CanvasItem[];
  /** Labour hours per selected parameter unit, keyed by manpower cost id. */
  manpowerHours?: Record<string, number>;
  manpowerParameter?: ManpowerParameter;
  manpowerItemIds?: string[];
  markupType?: "typeA" | "typeB" | "typeC";
};
export type Project = {
  id: string;
  name: string;
  client: string;
  company?: string;
  location: string;
  year: string;
  items: CanvasItem[];
  canvases?: ProjectCanvas[];
};
export type ComponentDatabase = { id: string; name: string; parent: "technal" | "sidem" };
export type MarkupRate = { id: string; name: string; typeA: number; typeB: number; typeC: number };
export type ManpowerCost = { id: string; name: string; rate: number };
export type ShippingType = { id: string; name: string };
export type ShippingCost = { id: string; name: string; values: Record<string, number> };
export type Screen = "home" | "stock" | "database" | "projects" | "canvas" | "assemblies" | "excel";
export type Modal = { type: "material" | "assembly" | "project"; id?: string } | null;
