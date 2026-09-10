import { number } from "../../../domain/calculations";
import type { Material, Assembly, Project } from "../../../domain/types";

export const makeId = () => crypto.randomUUID();

export type TableMove = {
  tableId?: string;
  sourceTableId?: string;
  sourceDatabaseId: string;
  name: string;
  referencePrefix: string;
  materialIds: string[];
};

export type ExecutionWorkspacePage = "cutting-list" | "optimization" | "material-order" | "database";

export type PriceHistorySnapshot = {
  materials: Material[];
  assemblies: Assembly[];
  projects: Project[];
  weightRates: Record<string, number>;
};

export const JOIN_CAPTURE_DISTANCE_MM = 350;
export const TECHNAL_MANUFACTURER = "Technal";
export const TECHNAL_ASSEMBLY_ID = "technal-2-slider-window";
export const TECHNAL_2_SLIDER_DATABASE = "technal-2-slider";
export const TECHNAL_GYN_DATABASE = "technal-gyn";
export const TECHNAL_FYN_DATABASE = "technal-fyn";
export const FYN_CADRE_MATERIAL_ID = "excel-hinged-fyn-fy2203";
export const FYN_TRANSOM_MATERIAL_ID = "join-fyn-fy2300";
export const FYN_TRANSOM_CODES = new Set(["FY2300", "TFY2300", "TFY2303", "TFY2308"]);
export const REAL_JOIN_TRANSOM_FORMULA = "(JoinedUp*0.5*Width)+(JoinedDown*0.5*Width)+(JoinedRight*0.5*Height)+(JoinedLeft*0.5*Height)";

export const TECHNAL_GY_DATABASE = "technal-gy";
export const TECHNAL_FY_DATABASE = "technal-fy";
export const SOLEAL_JOINTS_DATABASE = "soleal-joints";
export const TWO_RAIL_WINDOW_PAGE = "two-rail-window";
export const FLY_SCREEN_PAGE = "fly-screen";
export const HINGE_WINDOW_PAGE = "hinge-window";
export const FIXED_WINDOW_PAGE = "fixed-window";
export const TILT_AND_TURN_PAGE = "tilt-and-turn";
export const GLAZED_ALUMINIUM_CATEGORY = "Glazed aluminium doors and windows";
export const GENERAL_ITEM_CODES = new Set(["TCH-MISC", "TCH-SIL"]);

export const standardAssemblyCategory = (assemblyPage?: string) =>
  assemblyPage === FLY_SCREEN_PAGE
    ? "Fly screen"
    : [TWO_RAIL_WINDOW_PAGE, HINGE_WINDOW_PAGE, FIXED_WINDOW_PAGE, TILT_AND_TURN_PAGE].includes(assemblyPage ?? "")
      ? GLAZED_ALUMINIUM_CATEGORY
      : undefined;

export const assemblyColourOptions = ["#25A9AD", "#527FC3", "#E06C75", "#D19A66", "#98C379", "#C678DD", "#56B6C2", "#D9E8EA"];

export const glassReference = (index: number) => `GL${String(index + 1).padStart(2, "0")}`;

export const glassAreaForWindow = (widthMm: number, heightMm: number, _leaves: 1 | 2 | 3 | 4 = 2) => {
  return (Math.max(0, widthMm) * Math.max(0, heightMm)) / 1_000_000;
};

export const ASSEMBLY_FORMULA_VALUES = [
  { name: "Width", label: "Width", description: "Opening width in metres." },
  { name: "Height", label: "Height", description: "Opening height in metres." },
  { name: "Area", label: "Area", description: "Opening area in square metres." },
  { name: "Perimeter", label: "Perimeter", description: "Opening perimeter in metres." },
  { name: "NumberOfLeaves", label: "Number of leaves", description: "2, 3, or 4 from the canvas type settings." },
  { name: "OpeningType", label: "Opening type", description: "0 for window; 1 for door." },
  { name: "LeafSize", label: "Leaf size", description: "0 for small leaf; 1 for big leaf." },
  { name: "FrameSize", label: "Frame size", description: "0 for small frame; 1 for big frame." },
  { name: "ArchitraveAllowance", label: "Architrave allowance", description: "1 with allowance; 0 without." },
  { name: "JoinedUp", label: "Joined up", description: "1 when the top side has a Real join; 0 otherwise." },
  { name: "JoinedDown", label: "Joined down", description: "1 when the bottom side has a Real join; 0 otherwise." },
  { name: "JoinedLeft", label: "Joined left", description: "1 when the left side has a Real join; 0 otherwise." },
  { name: "JoinedRight", label: "Joined right", description: "1 when the right side has a Real join; 0 otherwise." },
  { name: "JoinedCorners", label: "Joined corners", description: "Number of the four window corners on Real-joined sides: 0, 1, 2, 3, or 4." },
  { name: "JoinLength", label: "Join length", description: "Total overlapping join length in metres, including both Real and Fake joins." },
  { name: "Architrave", label: "Architrave", description: "1 with architrave; 0 without." },
  { name: "Reinforcement", label: "Reinforcement", description: "1 reinforced; 0 not reinforced." },
  { name: "FlyScreen", label: "Fly screen", description: "1 with fly screen; 0 without." },
  { name: "GlassThickness", label: "Glass thickness", description: "Selected glass total thickness in mm; 0 when no glass is selected." },
  { name: "Coating", label: "Coating", description: "1 with coating; 0 without." },
] as const;

export const inferGlassThickness = (material?: Material) => {
  const layers = [...(material?.options?.join(" ").matchAll(/\b(\d+(?:\.\d+)?)\s*mm\b/gi) ?? [])].map((match) => match[1]);
  const storedLayers = [...(material?.thickness?.matchAll(/\d+(?:\.\d+)?/g) ?? [])].map((match) => match[0]);
  const values = layers.length ? layers : storedLayers;
  if (!values.length) return "";
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return `${number(total)} mm`;
};

export const databaseDefinitions: Record<string, { title: string; eyebrow: string; description: string }> = {
  markups: { title: "Markups", eyebrow: "Database / Markups", description: "General items and shared components used for tender markups." },
  manpower: { title: "Man power", eyebrow: "Database / Man power", description: "Labour and manpower items used in tender estimating." },
  shipping: { title: "Shipping", eyebrow: "Database / Shipping", description: "Delivery, freight, and shipping items used in tender estimating." },
  "costing-financials": { title: "Costing & Financials", eyebrow: "Database / Costing & Financials", description: "Markups, manpower, and shipping costs used in tender estimating." },
  prices: { title: "Soleal Database", eyebrow: "Database / Soleal", description: "Soleal material prices and components used by assemblies and project costing." },
  glass: { title: "Glass database", eyebrow: "Database / Glass", description: "Create and manage glass-specific materials and components here." },
  [TECHNAL_2_SLIDER_DATABASE]: { title: "2 rail sliding window", eyebrow: "Database / 2 rail sliding window", description: "Materials used only by the 2 rail sliding window component." },
  sidem: { title: "Sidem database", eyebrow: "Database / Sidem", description: "Create and manage Sidem-specific materials and components here." },
  [TECHNAL_GYN_DATABASE]: { title: "Soleal · GYn", eyebrow: "Database / Soleal Doors and Windows / GYn", description: "Soleal GYn aluminium profiles and accessories." },
  [TECHNAL_FYN_DATABASE]: { title: "Soleal · FYn", eyebrow: "Database / Soleal Doors and Windows / FYn", description: "Soleal FYn aluminium profiles and accessories." },
  [TECHNAL_GY_DATABASE]: { title: "Soleal · GY", eyebrow: "Database / Soleal Doors and Windows / GY", description: "Soleal GY aluminium profiles and accessories." },
  [TECHNAL_FY_DATABASE]: { title: "Soleal · FY", eyebrow: "Database / Soleal Doors and Windows / FY", description: "Soleal FY aluminium profiles and accessories." },
  [SOLEAL_JOINTS_DATABASE]: { title: "Soleal · Joints", eyebrow: "Database / Soleal Doors and Windows / Joints", description: "Joints for Soleal doors and windows." },
};
