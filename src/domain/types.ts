export type StockEntry = {
  id: string;
  length: number;
  quantity: number;
};

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
  /** Physical length of one stocked bar/item, in metres. */
  stockLength?: number;
  /** Current on-hand quantity for stock control. */
  stockQuantity?: number;
  /** Individual stocked lengths and their quantities. */
  stockEntries?: StockEntry[];
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
/** Operational projects are independent of tender-estimation drawings. */
export type ExecutionProjectFile = {
  id: string;
  name: string;
  /** `optimization` and `material-order` are retained for existing saved projects. */
  type: "folder" | "optimization" | "material-order" | "optimization-material-order" | "excel";
  parentId: string | null;
  createdAt: string;
  /** Legacy upload fields retained to preserve saved data. Excel archiving is disabled. */
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt?: string;
  /** Independent copy of every data source used by the Stock page at workspace creation. */
  stockSnapshot?: {
    materials: Material[];
    assemblies: Assembly[];
    componentDatabases: ComponentDatabase[];
    companyDatabases: CompanyDatabase[];
    companyPriceTables: CompanyPriceTable[];
    /** Hidden/moved standard Stock tables at the time this workspace was created. */
    movedOriginalPriceTableIds?: string[];
    capturedAt: string;
  };
  /** Saved inputs and results for the independent cutting-optimization page. */
  optimization?: {
    stockLength: number;
    kerf: number;
    trim: number;
    arrangements: number;
    cuts: OptimizationCut[];
    result?: OptimizationResult;
    recommendation?: StockLengthRecommendation;
    recommendationMinimum?: number;
    recommendationMaximum?: number;
    recommendationIncrement?: number;
  };
};
export type ExecutionProject = {
  id: string;
  name: string;
  client: string;
  company?: string;
  location: string;
  createdAt: string;
  files: ExecutionProjectFile[];
};
export type ComponentDatabase = { id: string; name: string; parent: "technal" | "sidem" };
export type CompanyDatabase = { id: string; name: string };
export type CompanyPriceTable = { id: string; companyDatabaseId: string; name: string; referencePrefix: string };
export type MarkupRate = { id: string; name: string; typeA: number; typeB: number; typeC: number };
export type ManpowerCost = { id: string; name: string; rate: number };
export type ShippingType = { id: string; name: string };
export type ShippingCost = { id: string; name: string; values: Record<string, number> };
export type Screen = "home" | "stock" | "database" | "projects" | "execution-projects" | "execution-project-detail" | "execution-workspace" | "canvas" | "assemblies" | "excel";
export type Modal = { type: "material" | "assembly" | "project" | "executionProject"; id?: string } | null;
import type { OptimizationCut, OptimizationResult, StockLengthRecommendation } from "../modules/execution/domain/cuttingOptimizer";
