import {
  CSSProperties,
  ClipboardEvent,
  FormEvent,
  MouseEvent,
  PointerEvent,
  WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RangeDirective, RangesDirective, SheetDirective, SheetsDirective, SpreadsheetComponent } from "@syncfusion/ej2-react-spreadsheet";
import { calculateFormula, conditionMatches, money, number, unitPriceWithShipping } from "./domain/calculations";
import type { CalculationResult } from "./domain/calculations";
import { MAX_OPENING_DIMENSION, allJoinedWindowGroup, realJoinSegments, realJoinedWindowGroup, windowCornerPoint, windowCorners } from "./domain/windowJoins";
import { PermissionGate, hasPermission } from "./shared/permissions/PermissionGate";
import { useSession } from "./modules/auth/ui/SessionContext";
import { ProfileMenu } from "./modules/auth/ui/ProfileMenu";
import { WORKSPACE_PERMISSIONS } from "./modules/workspace-legacy/domain/permissions";
import {
  JOIN_MATCH_PROPERTIES,
  fullSideTouching,
  joinMatchPropertiesForAssembly,
  joinMatchPropertyKeys,
  normalizeCombinationReferences,
  realJoinCheck as realJoinCheckPure,
  reconcileRealJoins as reconcileRealJoinsPure,
  recheckCombinationJoins as recheckCombinationJoinsPure,
  synchronizeCombinationDetails as synchronizeCombinationDetailsPure,
} from "./modules/projects/domain/joinEngine";
import {
  calculatePartQuantity as calculatePartQuantityPure,
  formulaValuesForItem as formulaValuesForItemPure,
  frameTypeForItem as frameTypeForItemPure,
  usesDirectJoinValues,
} from "./modules/costing/domain/quantityEngine";
import { workspaceGateway } from "./modules/workspace/infrastructure/workspaceGateway";
import { persistWorkspaceSnapshot } from "./modules/workspace/application/persistWorkspace";
import { serializeWorkspaceSnapshot } from "./modules/workspace/domain/snapshot";
import type { WorkspaceSnapshotV1 } from "./modules/workspace/domain/snapshot";
import { useCostingState } from "./modules/costing/application/useCostingState";
import { sellingPriceFromDirectCost } from "./modules/costing/domain/pricing";
import { CostingFinancials } from "./modules/costing/ui/CostingFinancials";
import { defaultManpowerCosts, defaultMarkupRates, defaultShippingCosts, defaultShippingTypes } from "./modules/costing/domain/defaults";
import { useMaterialDatabasesState } from "./modules/catalog/application/useMaterialDatabasesState";
import { defaultComponentDatabases } from "./modules/catalog/domain/defaults";
import { useCatalogItemsState } from "./modules/catalog/application/useCatalogItemsState";
import { useProjectsState } from "./modules/projects/application/useProjectsState";
import { optimizeCuts, recommendStockLength } from "./modules/execution/domain/cuttingOptimizer";
import type { OptimizationCut } from "./modules/execution/domain/cuttingOptimizer";
import { CuttingListSpreadsheet } from "./modules/execution/ui/CuttingListSpreadsheet";
import {
  defaultAssemblyCode as defaultAssemblyCodePure,
  materialDatabaseReference as materialDatabaseReferencePure,
  materialFromAssemblyCode as materialFromAssemblyCodePure,
  solealAccessoryMaterials as solealAccessoryMaterialsPure,
  solealProfileMaterials as solealProfileMaterialsPure,
} from "./modules/catalog/domain/materialReference";
import type {
  Assembly,
  AssemblyCanvasDefaults,
  AssemblyPart,
  BreakdownRule,
  CanvasItem,
  ComponentDatabase,
  CompanyDatabase,
  CompanyPriceTable,
  ExecutionProject,
  ExecutionProjectFile,
  FrameType,
  AssemblyNameRule,
  JoinPropertyMatch,
  JoinModification,
  Material,
  MarkupRate,
  ManpowerCost,
  ShippingCost,
  ShippingType,
  Modal,
  Project,
  ProjectCanvas,
  Screen,
  WindowCorner,
} from "./domain/types";
import "./App.css";

const makeId = () => crypto.randomUUID();
type TableMove = { tableId?: string; sourceTableId?: string; sourceDatabaseId: string; name: string; referencePrefix: string; materialIds: string[] };
type ExecutionWorkspacePage = "cutting-list" | "optimization" | "material-order" | "database";
const JOIN_CAPTURE_DISTANCE_MM = 350;
const TECHNAL_MANUFACTURER = "Technal";
const TECHNAL_ASSEMBLY_ID = "technal-2-slider-window";
const TECHNAL_2_SLIDER_DATABASE = "technal-2-slider";
const TECHNAL_GYN_DATABASE = "technal-gyn";
const TECHNAL_FYN_DATABASE = "technal-fyn";
const FYN_CADRE_MATERIAL_ID = "excel-hinged-fyn-fy2203";
const FYN_TRANSOM_MATERIAL_ID = "join-fyn-fy2300";
const FYN_TRANSOM_CODES = new Set(["FY2300", "TFY2300", "TFY2303", "TFY2308"]);
const REAL_JOIN_TRANSOM_FORMULA = "(JoinedUp*0.5*Width)+(JoinedDown*0.5*Width)+(JoinedRight*0.5*Height)+(JoinedLeft*0.5*Height)";
const fynTransomPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAAB/CAYAAADFJtF+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABEdSURBVHhe7Z1dUxpJ34d/DK/DAAJCUESM8SUmajSV3YrZrd2Pst9gj+4vkC+V3WQ3BzF7kCqzqZQmGgQUDS+C8g7DMMAw9wndD06cvTUhm0yevqq6tEbpmaGv6e6Z+Xe3SVVVFQzGBXDaDQwGgcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQhcnB0IXJwdCFycHQxWTUgdSqqkJVVfT7ffr78KmYTKZz/4/BZz6F4Tz18uI4DiaTCSaTif5uVAwth6Io6PV6UBQF/X4f/X4fGBTiRYVCTvWqp0zy08qhFZLjOJjNZpjNZvo7xxm3cjasHP1+H81mE6Ioot1uo9vtotvtAhfI8amneJFoGBKEYLFYwPM8eJ6Hw+GA3W6HzWY79xkjYVg5Op0OEokE4vE48vk8FQVDcvT7fSiKcu4qt1gssFqtMJvNNK+LCn/4M71eD91uF/1+n9YMwwKSWsvtdiMSiSASiSAUCuHatWvw+XzarA2DYeVotVrY3NzE8+fPEYvFUCqVUCqVgEH1DoAW6rAgDocDPM/DarV+UMMMow6arX6/j3a7DUmS0Ov1YLPZqFwcx4HjONq8BYNB3LlzB2tra1hcXMTCwgIikYg2a8NgaDn++OMP/Pnnn0gmk+h0Ouh0Ouh2u+j1epBlGaIootlswmw2QxAEOJ1OeL1eeL1eOJ1OWrjQND0mkwmKotCmqlKpoFwuo9Fo0H0IggC/3w+v1wtRFNFqtTA2Nobl5WUsLy/j1q1buHXrFmZmZoaO2lgYWo6nT5/i6dOnODk5gdfrxdjYGERRRL1eR7VaxdnZGYrFIlwuF6ampjA1NYWJiQlMTk7C6/XSTiOG5DAN7jK63S5arRYkSUI2m0U6ncbJyQnOzs5wdnaGa9eu4ebNm5idnUWpVEKxWITVakU0GkU0GsXNmzeZHF8KSZKwubmJzc1N1Ot1zMzMYGZmBqVSCYVCAfl8HtlsFtlsFoFAALdv38bt27dp4Y2Pj9P+Ay6Qo9PpQBRFiKKIg4MDJJNJ+jOZTCIajWJjYwPr6+t0f71eD36/H36/H3Nzc1hcXEQ0GtUcuXEwP3z48KF2oxFQVRWdTgc2mw2Tk5OYnZ3F9PQ0AECWZbTbbfT7fZhMJkQiESwvL2N1dRUTExPw+XxwOp2wWq2wWq2wWCwfJCIO6WMIggCHwwFJklCtVhEIBLCwsIC5uTm4XC4EAgGEw2FEIhFMTEwgFArB7/fD6XRqD90wGLbmUBQFtVoN9XodiqLA6XTC6XQimUzi3bt3ODw8RLlcRrlcxuzsLB48eID79+9TIYbvVi5CHXrA1mq1IIoiMpkMnj17hmfPniEUCuHBgwf4/vvvYbfbYbfbYbFYaD/G6XRCEATwPK/N2jAY9gkNx3Fwu90IhUIIh8MIBALweDxwOp2w2+2wWq2w2+3geR6CIMDj8cDn88HlctGC/KdEPu9wOOByueDz+eD3++FyuWCz2WCxWGCz2WC32+HxeBAIBBAKhRAIBOD3+yEIAqxWq/awDYVh5cBAEFKYw08iyW0ref5AaoBPRZsnyddkMlGhbDYblcfIT0dhZDlMJhPMZvO5ZkL7VHQ4fQravLSyEUmJGKSfwuRgfLMwORi6MDkYujA5GLowORi6MDk+gVHcCX3NMDkYuhhWDlVV0e12IUkSRFGEJEmQZRm9Xo8+mNKL1RgVZB/kDW6z2USr1YIsyzQ4yMgYVo7+IEyQvBEl8RayLKPf74P7jMG9RAqSms0mfQt8dnaGWq1Gg4OMjGHlUFUVzWYTp6enyOfzKBaLqNVqaLfbUAfhgJ9bEJJ/q9VCoVBgcnwtKIqCYrGIRCKB169f4+XLl3jx4gVevXqFvb09pFIpVCoV9Adxn58iyXATpQ7CB6vVKg4PD/Hq1StsbW3hxYsXePnyJWKxGDKZDEqlEtrttjYrQ2HYV/aSJOH58+f466+/kE6naQGS0MButwuPxwOPx4OVlRX8+OOP2NjY0GZzKUgIYiaTwW+//Ybff/8dsiwjGAzC5/OhVquhVqtBEAQsLi7i5s2bmJ+fx9zcHKamprTZGQbD1hykz3F6eop0Oo1UKoVkMolUKoX3798jn8+j0WjQgJ9RQV68iaKIk5MTJBIJHBwcIJVKIZ1Oo1AooFwuU0GNjGHlMJlMcDqdGB8fx8TEBI3CCgaD8Hg8cDgcsFgsgCZ4eFRYLBYasBwKhRCNRhGJRBAIBCAIAux2+/8MKPraMawcHMdBEASMj49jcnKSBhAHg0G43W4a0DPKWmMYIofP50MoFML09DSmp6cRCATo/pkcXwiO42gc5+rqKlZXV3Hnzh0sLS1hdnYWExMTcLvdMA0GN42i9hh+fuJyuTA5OYmFhQUsLy/j7t27WF9fx+LiIiKRCPx+P+x2+7k4EKNh2A4puWOoVCqQZZluT6VSiMfjSKfTkGUZsixjcXERP/30E3744YdzeVwWkk8mk8GTJ0/w5MkTeDwerK2tYXV1FYIgwOVy0RBFu91OY0gdDgegueMxCoauOcgQADLs4Pbt25ifn8fMzAxCoRBcLtdIaw4MPd9wOp0IhUK4ceMGlpaWcOfOHaysrGB+fv5czWFkDCuHHuRu4t+qysk+hvdFagmj1RRavjk5oBFk1Az3IS7qTwyLYXRJDCuH9sv/3IVwmX1oj0WbjIZh5WB8fpgcDF2YHAxdmBwMXZgcDF2YHAxdmBwMXZgcDF2YHAxdmBwMXZgcDF2YHAxdmBwMXZgcDF2YHCNEG+OhTUbjm5TD9JkXwtHGaXyu/Xxpvjk5hgvrWy20fwvDyqEoCsrlMo6OjhCPx+mos0wmg0KhgGq1CkmSoA6GE4wKdRCC2G63UalUkM/ncXx8TOdEPzo6QjabRblcNvxYWcPK0e/3cXZ2hlgshu3tbbx9+xb7+/tIpVLIZrMoFototVoA/m/dtU+F9B36/T5arRaKxSKOj4+RSCTw5s0b7Ozs0GM4PT2FJEnaLAyFYeVQFAWlUgnJZBJ7e3uIxWIfyCGK4kjm6hjuW2jleP/+PRKJBHZ3d7G7u4uDgwNks1k6nsbI/RLDyqEO5ucoFAp4//49HUidTqdRLBbRbDbR6XSAzzSgqNPpoFqt0mYlHo8jmUwil8vReULY/BxfiOFR9kSORCJB5SCz/IzyFpIIpqoqZFlGrVajciQSCSSTSTq6X5IkKIqizcJQGFYOMurM7/djcnISkUgE169fx/T0NCYnJxEMBiEIAm0KRiWJaWjEWzAYxMzMDKLRKKampuh+vV4vBEGgo/yNiqHlGB8fx/z8PNbX13H//n38/PPPuH//PtbW1jA3N4fx8XFwHDeyAU7kzofjOPh8PiwsLGBjYwMbGxt48OABvvvuOywtLWF6ehp+v5+OkzUq34Qcq6uruHfvHjY2NnD37l0sLS0hGo1ibGwM3GD1xk+RY7jmIXKMjY1hdnYW6+vruHfvHr7//ns6yn5qaorJ8SXhOA4ejwfhcBjT09N00hYyeLnX642sxrgIctfS7/fhcrkQDocxMzODiYkJthjPl2ZYDjKjD5k0ZZRNiR5EDgB0ro7p6Wm6tpvL5WJ9ji+FyWSCzWajc2PwPH9uNp9RdkL/CVVV6QKBbrebzslxmXXkvnYMKwfj88PkYOjC5GDowuRg6MLkYOjC5GDowuRg6HJlORRFQaVSoa+p9/f3EYvFkMvlIIoiFEVBq9VCpVJBNpvF/v4+Xr9+jd3dXSQSCWQyGdRqNfoA6XNi1FgKVVXR6/UgyzKq1Srev3+Pt2/f4s2bN3jz5g1isRhOTk7owj9kQaJcLoe9vT3s7Ozg8PAQhUIBxWJRm/2l+Sg5yuUyUqkUYrEY9vb2sLu7i2w2S4NrJElCtVpFJpPBu3fv8Pfff9MoqXQ6jWq1+q/IgREJMpzHKPK7DIqiUDmOj4+xs7OD7e1t7OzsYG9vj16MnU4H7XYboigim81id3cX29vbNHzg9PRUm/WlMT98+PChduM/0el0aK2RzWZRrVZRr9chCAJ8Ph8EQUCz2USj0cDJyQkODg4Qj8fpUlv9fh92ux2CIEBRFLpcxahSPp/HyckJDRNstVr0MXsoFIKiKPTROnk3opcURYGiKGi325AkCaVSia6SwPM8fUVvsVhgNpuhquoHx/MxSZZleuynp6c4PDxELBZDsVhEuVxGq9WCy+VCIBCAxWKhtQy5YHO5HADAarWi3W7j+vXr2mK8FFeWQ5ZlxONxbG9vI5fLQVEUmM1mjI+PIxgMwuVyodPpoNfroVAoIJlMIhaLodPpoNvtQlVVcBwHjuPQaDRQq9VQr9fpmiUfmxqNBhqNBjKZDA0yrtfrqNfrcDgc8Pv98Hg8dO01Uvi9Xo9KMJx6vR4tqEqlgmKxiHQ6jXg8jsPDQ1gsFhq30e120el00Gq1Pjiuj0n1eh3VahXVahW5XA7xeByxWAy1Wo3GxQaDQYTDYTgcDio7kahQKMBsNsNsNkOSJKyurmqL8VJcWQ5JkrC9vY2trS2cnJzAbDaD53kEg0Fcu3YNbrcb3W4XvV4P6XQau7u72NnZQbfbpQVDYjobjcZIxKjX62g0Gmg2m8hms8jlcjg7O6Pb7XY7vF4vXC4X+kPrrwyLQBKpWbrdLq0xzs7OkM/nkU6ncXh4iHQ6DbPZDLfbDYfDQa94Ike1Wv3gGC+byPdB8shms7T5JtFtHMchHA4jGo2C53l6Lvv7+9jZ2UEul4PFYoHFYoEkSR895/uVJ8av1Wp49OgRHj16hHw+D6/Xi7GxMczNzWF+fh7BYBCSJKHdbiMWi9H+htvthtvths/nQzAYpNXxqNpuUhuVSiWcnp7S6leSJIyPj+PGjRu4fv06XC4XXC4X7Ha7bt/BNJgvnUheqVRQqVRwenqKo6MjHB8fQxAERCIRhMNh8DwPnudhsVhG9sKP1G6kf3d0dESb42AwiLW1Nayvr8Pj8dBj3drawtbWFur1OhYXF7G4uAiHw4H//Oc/2uwvxZXlqNfrePz4MR4/fozj42O6PRAI0Nfm5Cok8ZWZTIaabLVa4XA44HA4wHFX7g/rQgpZlmW0223Ig+U7u90uHA4HxsbG6CI95K3pRWJgkJc6WMtNGdx9iaJIlwhrNpv0TawgCDCbzefeBo+SdrtNa1i73Q6e5+HxeBCJRDA1NQWe52n/KZVK4fDwEACwsrKClZUV8DyPX3/9VZvtpbiSHOog4ntzcxPPnz/H0dERRFFEq9WiV4/NZqNfkCiKtGonbTy5Iq6w2ythGhoKSfZFtptMJiro8Ot0PUnIcRLJFEWheRPIeYz6fC6q1Ww2GxWEhCqQmBFVVWk/hed5LC8vY3l5GTzP45dffjmXz2W5khz9fh+yLCORSCCRSKBYLNK1SC760rvdLv07qW6H0+dA+6Vq90Oan8vUWuSzRGr1gtFz2vxHifZcSCeTfNc2m42eh6qqaLfbaLfbsNvtCIfDCIfDsNlsH73w4ZXlUBSFVq/yYAVovfEZ5OS0hXWFXX4UegV4lf1q8yBot18lz49Buz9c4nwsFgt4nofT6QQ3WJfmY7iyHOpQW0wS2a7N6ipX6efkf32Zl0Er+ZeAfMckkSaTYBo0qRzHnesH2Wy2c/93Wa4kh/bAtAd7EeSAvyR6x3ZVvgY5Lvo5DJGY9I1MJtNHhyteSQ7G/y++7CXN+KphcjB0YXIwdGFyMHRhcjB0YXIwdGFyMHRhcjB0YXIwdGFyMHRhcjB0YXIwdGFyMHRhcjB0YXIwdGFyMHT5LyNFfYH7gt/TAAAAAElFTkSuQmCC";
const fynTransomMaterial: Material = { id: FYN_TRANSOM_MATERIAL_ID, name: "FY2300 - Transom - T small", code: "FY2300", supplierCode: "", category: "Profiles", unit: "lm", weight: 0, priceMethod: "Per lm", cost: 14.9, wastage: 7, options: [], properties: [], sketch: fynTransomPhoto, manufacturer: "Technal", databaseId: TECHNAL_FYN_DATABASE, priceTable: "profiles" };
const fynParcloseMaterials: Material[] = [
  ["591001", "32-30"], ["591002", "29-26"], ["591003", "25-22"], ["591004", "21-18"],
  ["591005", "17-12"], ["591006", "17-12"], ["591007", "11-9"], ["591008", "8-7"],
  ["591009", "6-5"], ["591010", "4-3"], ["591011", "2-1"], ["591012", "<1"],
].map(([numberPart, thickness]) => ({
  id: `excel-hinged-fyn-${numberPart}`,
  name: `${numberPart} - Parclose-${thickness}mm`,
  code: `T${numberPart}`,
  supplierCode: `T${numberPart}`,
  category: "Aluminium profile",
  unit: "lm",
  weight: 0,
  rateMethod: "manual" as const,
  manualRate: 0,
  priceMethod: "Per lm",
  cost: 0,
  wastage: 0,
  options: [],
  properties: ["Width", "Height"],
  sketch: `/materials/fyn-parclose-${numberPart}.png`,
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: TECHNAL_FYN_DATABASE,
  priceTable: "profiles" as const,
}));
const defaultFynJoinModifications = (): JoinModification[] => [
  { materialId: FYN_TRANSOM_MATERIAL_ID, topFormula: "+0.5*Width", bottomFormula: "+0.5*Width", leftFormula: "+0.5*Height", rightFormula: "+0.5*Height" },
  { materialId: FYN_CADRE_MATERIAL_ID, topFormula: "-Width", bottomFormula: "-Width", leftFormula: "-Height", rightFormula: "-Height" },
];
const completeFynJoinModifications = (rows: JoinModification[] = []) => [...defaultFynJoinModifications(), ...rows.filter((row) => ![FYN_TRANSOM_MATERIAL_ID, FYN_CADRE_MATERIAL_ID].includes(row.materialId))];
const TECHNAL_GY_DATABASE = "technal-gy";
const TECHNAL_FY_DATABASE = "technal-fy";
const SOLEAL_JOINTS_DATABASE = "soleal-joints";
const TWO_RAIL_WINDOW_PAGE = "two-rail-window";
const FLY_SCREEN_PAGE = "fly-screen";
const HINGE_WINDOW_PAGE = "hinge-window";
const FIXED_WINDOW_PAGE = "fixed-window";
const TILT_AND_TURN_PAGE = "tilt-and-turn";
const GLAZED_ALUMINIUM_CATEGORY = "Glazed aluminium doors and windows";
const standardAssemblyCategory = (assemblyPage?: string) => assemblyPage === FLY_SCREEN_PAGE
  ? "Fly screen"
  : [TWO_RAIL_WINDOW_PAGE, HINGE_WINDOW_PAGE, FIXED_WINDOW_PAGE, TILT_AND_TURN_PAGE].includes(assemblyPage ?? "")
    ? GLAZED_ALUMINIUM_CATEGORY
    : undefined;
// usesDirectJoinValues relocated to modules/costing/domain/quantityEngine.ts (Phase 2 extraction).
const GENERAL_ITEM_CODES = new Set(["TCH-MISC", "TCH-SIL"]);
const TWO_SLIDER_DOOR_SKETCH = "M8 8H92V92H8ZM50 8V92M8 50H92M14 15H45V85H14ZM55 15H86V85H55M17 48l-7 4 7 4M83 48l7 4-7 4M22 82H41M59 18H78";
const assemblyDefaultColor = (id?: string) => id === "soleal-gyn-2rail" ? "#25a9ad" : id === "soleal-gy-2rail" ? "#527fc3" : "#d9e8ea";
const assemblyColourOptions = ["#25A9AD", "#527FC3", "#E06C75", "#D19A66", "#98C379", "#C678DD", "#56B6C2", "#D9E8EA"];
const glassReference = (index: number) => `GL${String(index + 1).padStart(2, "0")}`;
const glassAreaForWindow = (widthMm: number, heightMm: number, _leaves: 1 | 2 | 3 | 4 = 2) => {
  return (Math.max(0, widthMm) * Math.max(0, heightMm)) / 1_000_000;
};
const ASSEMBLY_FORMULA_VALUES = [
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
const defaultAssemblyCanvasDefaults: AssemblyCanvasDefaults = {
  width: 1500,
  height: 1200,
  leaves: 2,
  openingType: "window",
  leafSize: "small",
  frameSize: "small",
  hasArchitrave: false,
  hasArchitraveAllowance: false,
  reinforced: false,
  hasCoating: false,
};
// JOIN_MATCH_PROPERTIES, joinMatchPropertyKeys, joinMatchPropertiesForAssembly, and
// canvasFormulaValues relocated to modules/projects/domain/joinEngine.ts and
// modules/costing/domain/quantityEngine.ts respectively (Phase 2 extraction).
const inferGlassThickness = (material?: Material) => {
  const layers = [...(material?.options?.join(" ").matchAll(/\b(\d+(?:\.\d+)?)\s*mm\b/gi) ?? [])].map((match) => match[1]);
  const storedLayers = [...(material?.thickness?.matchAll(/\d+(?:\.\d+)?/g) ?? [])].map((match) => match[0]);
  const values = layers.length ? layers : storedLayers;
  if (!values.length) return "";
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return `${number(total)} mm`;
};
const projectYears = ["2026", "2027"] as const;
type PriceHistorySnapshot = {
  materials: Material[];
  assemblies: Assembly[];
  projects: Project[];
  weightRates: Record<string, number>;
};
// defaultMarkupRates/defaultManpowerCosts/defaultShippingTypes/defaultShippingCosts
// relocated to modules/costing/domain/defaults.ts (Phase 4 extraction).
const defaultManpowerHours: Record<string, number> = { fabrication: 4, installation: 5, logistics: 1, store: 1, others: 1 };
const databaseDefinitions: Record<string, { title: string; eyebrow: string; description: string }> = {
  markups: { title: "Markups", eyebrow: "Database / Markups", description: "General items and shared components used for tender markups." },
  manpower: { title: "Man power", eyebrow: "Database / Man power", description: "Labour and manpower items used in tender estimating." },
  shipping: { title: "Shipping", eyebrow: "Database / Shipping", description: "Delivery, freight, and shipping items used in tender estimating." },
  "costing-financials": { title: "Costing & Financials", eyebrow: "Database / Costing & Financials", description: "Markups, manpower, and shipping costs used in tender estimating." },
  prices: { title: "Soleal Database", eyebrow: "Database / Soleal", description: "Soleal material prices and components used by assemblies and project costing." },
  glass: { title: "Glass database", eyebrow: "Database / Glass", description: "Create and manage glass-specific materials and components here." },
  [TECHNAL_2_SLIDER_DATABASE]: { title: "Technal · 2-slider window", eyebrow: "Database / Technal / 2-slider window", description: "Materials used only by the Technal 2-slider window component." },
  sidem: { title: "Sidem database", eyebrow: "Database / Sidem", description: "Create and manage Sidem-specific materials and components here." },
};
databaseDefinitions[TECHNAL_2_SLIDER_DATABASE] = {
  title: "2 rail sliding window",
  eyebrow: "Database / 2 rail sliding window",
  description: "Materials used only by the 2 rail sliding window component.",
};
databaseDefinitions[TECHNAL_GYN_DATABASE] = { title: "Soleal · GYn", eyebrow: "Database / Soleal Doors and Windows / GYn", description: "Soleal GYn aluminium profiles and accessories." };
databaseDefinitions[TECHNAL_FYN_DATABASE] = { title: "Soleal · FYn", eyebrow: "Database / Soleal Doors and Windows / FYn", description: "Soleal FYn aluminium profiles and accessories." };
databaseDefinitions[TECHNAL_GY_DATABASE] = { title: "Soleal · GY", eyebrow: "Database / Soleal Doors and Windows / GY", description: "Soleal GY aluminium profiles and accessories." };
databaseDefinitions[TECHNAL_FY_DATABASE] = { title: "Soleal · FY", eyebrow: "Database / Soleal Doors and Windows / FY", description: "Soleal FY aluminium profiles and accessories." };
databaseDefinitions[SOLEAL_JOINTS_DATABASE] = { title: "Soleal · Joints", eyebrow: "Database / Soleal Doors and Windows / Joints", description: "Joints for Soleal doors and windows." };
// defaultComponentDatabases relocated to modules/catalog/domain/defaults.ts (Phase 5 extraction).
const technalRows = [
  ["TCH-MISC", "Misc items - pan head screw- backing rod", "perimeter", 3],
  ["TCH-SIL", "Weather Silicone", "CEILING(perimeter/2,1)", 4.24],
  ["GY1114", "GY1114 - Dormant Inferieur", "Width", 20.481818181818184],
  ["GY1113", "GY1113 - Dormant", "Width+Height*2", 19.312121212121212],
  ["141021", "Traverse 32mm", "Width*2", 13.327272727272726],
  ["GY1300", "Ouvrant Lateral 24mm", "Height*2", 12.987878787878788],
  ["GY2302", "Ouvrant Central 24mm", "Height*2", 8.26818181818182],
  ["GY4000", "GY4000 - Profile Chicane", "Height*2", 9.89],
  ["431024", "431024 - Bouclier PVC superieur", "Width*2+Height*2", 2.9916666666666667],
  ["431025", "431025 - Bouclier PVC inferieur", "Width*2", 7.92],
  ["821000", "821000 - Bouclier thermique rail", "perimeter", 7.8],
  ["341000", "341000 - Clip Rail", "Width*4+Height*4", 4.02],
  ["391010m", "391010m - Couvre Joint", "Width*2+Height*4", 3.631818181818182],
  ["TAY0002", "TAY0002 - Goupille a vis d=6mm", "8", 0.657],
  ["T401011", "T401011 - Roulette simple", "4", 7.65],
  ["GY3700", "GY3700 - Fermeture 1 point", "2", 30.177000000000003],
  ["GY3705", "GY3705 - Gache dormant peripherique", "2", 5.391],
  ["GY3712", "GY3712 - Cuvette de manoeuvre semi fixe", "1", 34.902],
  ["GY3717", "GY3717 - Poignee tirage a manoeuvre", "1", 37.368],
  ["GY3803", "GY3803 - Talon Central D'etancheite", "1", 10.773000000000001],
  ["GY3804", "GY3804 - Bouchon montant lateral", "2", 4.167],
  ["GY3805", "GY3805 - Bouchon montant central", "2", 3.411],
  ["GY3807", "GY3807 - Bouchon recueil", "1", 2.9160000000000004],
  ["GY3831", "GY3831 - Cale de fermeture", "1", 1.773],
  ["GY3832", "GY3832 - Centreur d'ouvrant", "2", 4.761],
  ["GY3603", "GY3603 - Equerre 11x13.3 rainure", "8", 2.43],
] as const;
const technalMaterials: Material[] = technalRows.map(([code, name, formula, cost]) => ({
  id: `technal-${code.toLowerCase()}`,
  name,
  code,
  supplierCode: code,
  category: "2 rail sliding window",
  unit: "LM",
  weight: 0,
  priceMethod: "Catalog unit price",
  cost,
  options: [],
  properties: ["Width", "Height"],
  sketch: "M18 18H82V82H18Z",
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: GENERAL_ITEM_CODES.has(code) ? "markups" : TECHNAL_GYN_DATABASE,
  quantityFormula: formula,
}));
const technalAssembly: Assembly = {
  id: TECHNAL_ASSEMBLY_ID,
  name: "2 Rail System - Soleal - GYn",
  code: "TECHNAL-2SLD",
  category: GLAZED_ALUMINIUM_CATEGORY,
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: TECHNAL_GYN_DATABASE,
  assemblyPage: TWO_RAIL_WINDOW_PAGE,
  properties: ["Width", "Height"],
  parts: technalRows.map(([code, , formula]) => ({ materialId: `technal-${code.toLowerCase()}`, quantity: 1, quantityFormula: formula })),
  rules: [],
  sketch: "M12 12H88V88H12ZM37 12V88M63 12V88",
};
const flyScreenAssembly: Assembly = {
  id: "fly-screen-2rail",
  name: "Fly screen - Soleal - GYn",
  code: "SOLEAL-GYN-FLY",
  category: "Fly screen",
  manufacturer: "Soleal",
  databaseId: TECHNAL_GYN_DATABASE,
  assemblyPage: FLY_SCREEN_PAGE,
  properties: ["Width", "Height"],
  parts: [],
  rules: [],
  sketch: "M12 12H88V88H12ZM20 20H80V80H20M32 20V80M44 20V80M56 20V80M68 20V80M20 32H80M20 44H80M20 56H80M20 68H80",
};
const tiltAndTurnAssembly: Assembly = {
  id: "tilt-and-turn-soleal-fyn",
  name: "Tilt and Turn - Soleal - FYn",
  code: "SOLEAL-FYN-TILT-TURN",
  category: GLAZED_ALUMINIUM_CATEGORY,
  manufacturer: "Soleal",
  databaseId: TECHNAL_FYN_DATABASE,
  assemblyPage: TILT_AND_TURN_PAGE,
  properties: ["Width", "Height"],
  parts: [
    { label: "T&T-1", materialId: "import-markups-gen-misc-001", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-2", materialId: "import-markups-gen-sil-001", quantity: 1, quantityFormula: "Perimeter/2", quantityFormulaFourPanels: "Perimeter/2" },
    { label: "T&T-3", materialId: "excel-hinged-fyn-fy2203", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-4", materialId: "excel-hinged-fyn-fy2209", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter+2*Height" },
    { label: "T&T-5", materialId: "excel-hinged-fyn-591003", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter+2*Height" },
    { label: "T&T-6", materialId: "import-technal-gyn-391010m", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-7", materialId: "excel-hinged-fyn-410010", quantity: 1, quantityFormula: "Width*4+Height*4", quantityFormulaFourPanels: "Width*4+Height*8" },
    { label: "T&T-8", materialId: "excel-hinged-fyn-as0017", quantity: 1, quantityFormula: "Width*2+Height*2", quantityFormulaFourPanels: "Width*2+Height*4" },
    { label: "T&T-9", materialId: "excel-hinged-fyn-410018", quantity: 1, quantityFormula: "Width*2+Height*2", quantityFormulaFourPanels: "Width*2+Height*3" },
    { label: "T&T-10", materialId: "excel-hinged-fyn-740012", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-11", materialId: "excel-hinged-fyn-fy3653", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "4" },
    { label: "T&T-12", materialId: "excel-hinged-fyn-420022", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-13", materialId: "excel-hinged-fyn-750220", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-14", materialId: "excel-hinged-fyn-940025", quantity: 1, quantityFormula: "IF(Area>1.5,3,4)", quantityFormulaFourPanels: "IF(Area>3,6,4)" },
    { label: "T&T-15", materialId: "excel-hinged-fyn-750201", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-16", materialId: "excel-hinged-fyn-960017", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-17", materialId: "excel-hinged-fyn-960013", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-18", materialId: "excel-hinged-fyn-960010", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-19", materialId: "import-technal-gyn-ay0002", quantity: 1, quantityFormula: "16", quantityFormulaFourPanels: "32" },
  ],
  rules: [],
  sketch: "M12 12H88V88H12ZM50 12V88M18 20L50 50L18 80M82 20L50 50L82 80",
};
const withTechnalSeed = (savedMaterials: Material[], savedAssemblies: Assembly[]) => ({
  materials: fynParcloseMaterials.reduce(
    (items, seed) => items.some((material) => material.id === seed.id || material.code.toLowerCase() === seed.code.toLowerCase()) ? items : [...items, seed],
    savedMaterials,
  ),
  assemblies: [flyScreenAssembly, tiltAndTurnAssembly].reduce(
    (items, seed) => items.some((assembly) => assembly.id === seed.id) ? items : [...items, seed],
    savedAssemblies,
  ),
});
const materialData: Material[] = [
  {
    id: "glass",
    name: "Clear tempered glass",
    code: "GL-001",
    supplierCode: "GL-CT-6",
    category: "Glass",
    unit: "m²",
    weight: 15,
    priceMethod: "Per m²",
    cost: 18.5,
    options: ["Thickness", "Tint"],
    properties: ["Width", "Height", "Thickness"],
    sketch: "M18 15H82V85H18Z",
  },
  {
    id: "profile",
    name: "Aluminium frame profile",
    code: "AL-104",
    supplierCode: "AL-440",
    category: "Aluminium",
    unit: "m",
    weight: 1.25,
    priceMethod: "Per meter",
    cost: 7.8,
    options: ["Finish"],
    properties: ["Length", "Finish"],
    sketch: "M24 16H43V84H24ZM57 16H76V84H57Z",
  },
  {
    id: "bracket",
    name: "Corner bracket",
    code: "HD-018",
    supplierCode: "HD-018",
    category: "Hardware",
    unit: "piece",
    weight: 0.08,
    priceMethod: "Per piece",
    cost: 0.65,
    options: ["Finish"],
    properties: ["Size", "Finish"],
    sketch: "M21 24H79V42H40V78H21Z",
  },
];
const assemblyData: Assembly[] = [
  {
    id: "window",
    name: "Sliding window type 1",
    code: "WN-001",
    category: "Window",
    properties: ["Width", "Height", "Glass type"],
    parts: [
      { materialId: "glass", quantity: 2 },
      { materialId: "profile", quantity: 4 },
      { materialId: "bracket", quantity: 4 },
    ],
    rules: [
      {
        id: "r1",
        materialId: "profile",
        property: "Width",
        operator: ">",
        value: "1500",
        quantityWhenTrue: "4",
        quantityOtherwise: "2",
        measureFormula: "Height",
      },
    ],
    sketch: "M15 13H85V87H15ZM50 13V87",
  },
  {
    id: "door",
    name: "Aluminium swing door",
    code: "DR-001",
    category: "Door",
    properties: ["Width", "Height", "Finish"],
    parts: [
      { materialId: "glass", quantity: 1 },
      { materialId: "profile", quantity: 4 },
      { materialId: "bracket", quantity: 4 },
    ],
    rules: [],
    sketch: "M24 10H76V90H24ZM61 50h2",
  },
];
const projectData: Project[] = [
  {
    id: "project-1",
    name: "Riviera residence",
    client: "Riviera Development",
    company: "Company",
    location: "Lebanon",
    year: "2026",
    items: [
      {
        id: "item-1",
        sourceId: "window",
        kind: "assembly",
        name: "Sliding window type 1",
        sketch: "M15 13H85V87H15ZM50 13V87",
        x: 140,
        y: 110,
        width: 175,
        height: 130,
      },
    ],
  },
];

function Icon({
  name,
  size = 19,
}: {
  name:
  | "plus"
  | "box"
  | "layers"
  | "folder"
  | "copy"
  | "edit"
  | "trash"
  | "pen"
  | "move"
  | "close"
  | "search"
  | "arrow"
  | "warehouse"
  | "order";
  size?: number;
}) {
  const p = {
    plus: <path d="M12 5v14M5 12h14" />,
    box: (
      <>
        <path d="m4 7 8-4 8 4v10l-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4M12 11v10" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="1" />
        <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" />
      </>
    ),
    pen: (
      <>
        <path d="m14 4 6 6M4 20l4-1 11-11-6-6L5 13Z" />
        <path d="m4 20 5-5" />
      </>
    ),
    move: (
      <>
        <path d="M12 3v18M3 12h18" />
        <path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8 3 12l4 4M17 8l4 4-4 4" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    warehouse: (
      <>
        <path d="m3 10 9-6 9 6v10H3Z" />
        <path d="M8 20v-6h8v6M3 10h18" />
      </>
    ),
    order: (
      <>
        <path d="M4 5h16v15H4Z" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {p[name]}
    </svg>
  );
}

function Sketch({ path, label }: { path: string; label: string }) {
  if (path.startsWith("data:image/") || path.startsWith("/materials/")) {
    return <img className="sketch material-photo" src={path} alt={`${label} photo`} />;
  }
  if (label.toLowerCase().includes("tilt and turn")) {
    return <svg className="sketch" viewBox="0 0 100 100" role="img" aria-label={`${label} technical drawing`}>
      <rect width="100" height="100" fill="#f4f8f8" />
      <path d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" stroke="#dbe7e7" strokeWidth=".55" />
      <rect x="14" y="12" width="72" height="76" fill="#eff6f5" stroke="#176c68" strokeWidth="2.8" />
      <rect x="20" y="18" width="60" height="64" fill="none" stroke="#53817e" strokeWidth="1.7" />
      <path d="M20 18L80 51M20 82L50 18L80 82M20 82L80 51" fill="none" stroke="#6b7f7e" strokeWidth="2.2" strokeDasharray="8 6" />
    </svg>;
  }
  return (
    <svg
      className="sketch"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} drawing`}
    >
      <rect width="100" height="100" fill="#f4f8f8" />
      <path
        d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100"
        stroke="#dbe7e7"
        strokeWidth=".55"
      />
      <path
        d={path}
        fill="rgba(140,207,196,.35)"
        stroke="#176c68"
        strokeWidth="2"
      />
    </svg>
  );
}

function TechnicalSymbol({ item, selected, dimensionTextSize, glassName, drawingName, drawingReference, onJoin }: { item: CanvasItem; selected: boolean; dimensionTextSize: number; glassName?: string; drawingName?: string; drawingReference?: number; onJoin?: () => void }) {
  const width = item.inputWidth ?? 1500;
  const height = item.inputHeight ?? 1200;
  const name = item.name.toLowerCase();
  const isFlyScreen = item.assemblyPage === FLY_SCREEN_PAGE || item.sourceId === "fly-screen-2rail" || name.includes("fly screen");
  const isHingeWindow = item.assemblyPage === HINGE_WINDOW_PAGE || item.sourceId === "hinged-window-soleal-fyn" || name.includes("hinged window");
  const isFixedWindow = item.assemblyPage === FIXED_WINDOW_PAGE || item.sourceId === "fixed-window" || name.includes("fixed window");
  const isTiltAndTurn = item.assemblyPage === TILT_AND_TURN_PAGE || item.sourceId === "tilt-and-turn-soleal-fyn" || name.includes("tilt and turn");
  const isDoor = name.includes("door") || name.includes("hinge");
  const isSlider = !isFlyScreen && !isFixedWindow && !isTiltAndTurn
    && (item.assemblyPage === TWO_RAIL_WINDOW_PAGE || [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId) || name.includes("slider") || name.includes("sld") || name.includes("soleal"));
  // These are real millimetre dimensions. They stay the same while the opening grows.
  const frame = Math.min(55, width / 6, height / 6);
  const sash = Math.min(42, width / 8, height / 8);
  const mullion = Math.min(38, width / 10);
  const leafCount = isSlider ? (item.leaves === 3 || item.leaves === 4 ? item.leaves : 2) : 1;
  const clearWidth = Math.max(1, width - frame * 2 - mullion * (leafCount - 1));
  const glassWidth = clearWidth / leafCount;
  const glassHeight = Math.max(1, height - frame * 2 - sash * 2);
  const glassNameText = item.glassMaterialId ? glassName || item.glassLabel || "Glass" : "";
  const glassNameTextSize = Math.max(20, Math.min(78, Math.min(glassWidth, glassHeight) / 8));
  // Keep the item name and Qty label proportional to the opening area, while
  // preventing a long label from overflowing the available drawing width.
  const drawingNameTextSize = Math.max(24, Math.min(120, Math.sqrt(width * height) / 10, ((width - frame * 2) * 1.45) / Math.max(12, drawingName?.length ?? 12)));
  // The previous 84 mm marker is increased by 100 mm, then grows with opening area.
  const referenceDiameter = Math.max(184, Math.min(360, Math.sqrt(width * height) / 7));
  const referenceRadius = referenceDiameter / 2;
  const referenceX = Math.max(frame + referenceRadius, width - frame - referenceRadius);
  const referenceY = frame + referenceRadius;
  const sliderLeaves = Array.from({ length: leafCount }, (_, index) => {
    const sashX = frame + index * (glassWidth + mullion);
    return { sashX, glassX: sashX + sash, glassY: frame + sash };
  });
  const hingeLeafCount = isHingeWindow && item.leaves === 2 ? 2 : 1;
  const hingeLeafWidth = Math.max(1, (width - frame * 2) / hingeLeafCount);
  const hingeLeaves = Array.from({ length: hingeLeafCount }, (_, index) => {
    const sashX = frame + index * hingeLeafWidth;
    return { sashX, glassX: sashX + sash, glassY: frame + sash };
  });
  return (
    <g data-item-id={item.id} className={selected ? "technical-item selected" : "technical-item"} onDoubleClick={onJoin} onDoubleClickCapture={onJoin}>
      <svg x={item.x} y={item.y} width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ "--window-colour": item.color ?? assemblyDefaultColor(item.sourceId) } as CSSProperties} aria-label={`${item.name}, ${width} by ${height} millimetres`}>
        {isFlyScreen ? <>
          <rect x="0" y="0" width={width} height={height} className="tech-frame" />
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-mesh" />
          {Array.from({ length: 9 }, (_, index) => <path key={index} d={`M${frame + ((width - frame * 2) * (index + 1)) / 10} ${frame}V${height - frame}M${frame} ${frame + ((height - frame * 2) * (index + 1)) / 10}H${width - frame}`} className="tech-mesh-line" />)}
        </> : isSlider ? <>
          <rect x="0" y="0" width={width} height={height} className="tech-frame" />
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-void" />
          {sliderLeaves.map(({ sashX, glassX, glassY }, index) => <g key={index}>
            <rect x={sashX} y={frame} width={glassWidth} height={height - frame * 2} className="tech-sash" />
            <rect x={glassX} y={glassY} width={Math.max(1, glassWidth - sash * 2)} height={glassHeight} className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"} />
            {glassNameText && <text x={glassX + 100} y={glassY + 100} textAnchor="start" className="tech-glass-name" style={{ fontSize: glassNameTextSize }}>{glassNameText}</text>}
            {index % 2 === 0 ? <>
              <path d={`M${sashX + glassWidth * .25} ${height / 2}H${sashX + glassWidth * .75}`} className="tech-direction" />
              <path d={`M${sashX + glassWidth * .75} ${height / 2}l-${sash * .6} -${sash * .45}M${sashX + glassWidth * .75} ${height / 2}l-${sash * .6} ${sash * .45}`} className="tech-direction" />
            </> : <>
              <path d={`M${sashX + glassWidth * .75} ${height / 2}H${sashX + glassWidth * .25}`} className="tech-direction" />
              <path d={`M${sashX + glassWidth * .25} ${height / 2}l${sash * .6} -${sash * .45}M${sashX + glassWidth * .25} ${height / 2}l${sash * .6} ${sash * .45}`} className="tech-direction" />
            </>}
          </g>)}
          {sliderLeaves.slice(1).map(({ sashX }, index) => <rect key={`mullion-${index}`} x={sashX - mullion} y={frame} width={mullion} height={height - frame * 2} className="tech-mullion" />)}
          <path d={`M${frame} ${frame + sash}H${width - frame}M${frame} ${height - frame - sash}H${width - frame}`} className="tech-profile" />
        </> : isTiltAndTurn ? <>
          <rect x="0" y="0" width={width} height={height} className="tech-frame" />
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-sash" />
          <rect x={frame + sash} y={frame + sash} width={Math.max(1, width - (frame + sash) * 2)} height={Math.max(1, height - (frame + sash) * 2)} className={item.glassMaterialId ? "tech-tilt-glass tech-glass-selected" : "tech-tilt-glass"} />
          {glassNameText && <text x={frame + sash + 100} y={frame + sash + 100} textAnchor="start" className="tech-glass-name" style={{ fontSize: glassNameTextSize }}>{glassNameText}</text>}
          <path d={`M${frame} ${frame}L${width - frame} ${height * .52}M${frame} ${height - frame}L${width / 2} ${frame}L${width - frame} ${height - frame}M${frame} ${height - frame}L${width - frame} ${height * .52}`} className="tech-hinge-direction" />
        </> : isHingeWindow ? <>
          <rect x="0" y="0" width={width} height={height} className="tech-frame" />
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-void" />
          {hingeLeaves.map(({ sashX, glassX, glassY }, index) => <g key={index}>
            <rect x={sashX} y={frame} width={hingeLeafWidth} height={height - frame * 2} className="tech-sash" />
            <rect x={glassX} y={glassY} width={Math.max(1, hingeLeafWidth - sash * 2)} height={glassHeight} className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"} />
            {glassNameText && <text x={glassX + 100} y={glassY + 100} textAnchor="start" className="tech-glass-name" style={{ fontSize: glassNameTextSize }}>{glassNameText}</text>}
            <path d={index === 0 ? `M${sashX + hingeLeafWidth - sash} ${height / 2}L${sashX + sash} ${frame + sash}M${sashX + hingeLeafWidth - sash} ${height / 2}L${sashX + sash} ${height - frame - sash}` : `M${sashX + sash} ${height / 2}L${sashX + hingeLeafWidth - sash} ${frame + sash}M${sashX + sash} ${height / 2}L${sashX + hingeLeafWidth - sash} ${height - frame - sash}`} className="tech-hinge-direction" />
          </g>)}
        </> : isFixedWindow ? <>
          <rect x="0" y="0" width={width} height={height} className="tech-frame" />
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"} />
          {glassNameText && <text x={frame + 100} y={frame + 100} textAnchor="start" className="tech-glass-name" style={{ fontSize: glassNameTextSize }}>{glassNameText}</text>}
          <path d={`M${width / 2 - Math.min(width, height) / 12} ${height / 2}H${width / 2 + Math.min(width, height) / 12}M${width / 2} ${height / 2 - Math.min(width, height) / 12}V${height / 2 + Math.min(width, height) / 12}`} className="tech-profile" />
        </> : isDoor ? <>
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-door" />
          <path d={`M${frame} ${height - frame}V${frame}M${frame} ${height - frame}A${width - frame * 2} ${height - frame * 2} 0 0 1 ${width - frame} ${frame}`} className="tech-profile" />
          <circle cx={width - frame * 1.8} cy={height / 2} r={Math.max(8, sash / 5)} className="tech-hardware" />
        </> : <>
          <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-glass" />
          <path d={`M${frame} ${height / 2}H${width - frame}M${width / 2} ${frame}V${height - frame}`} className="tech-profile" />
        </>}
        {drawingName && <text x={width / 2} y={height - frame - Math.max(20, sash * .65)} textAnchor="middle" className="tech-type-label" style={{ fontSize: drawingNameTextSize }}>{drawingName}</text>}
        {drawingReference && <g className="drawing-reference-marker"><circle cx={referenceX} cy={referenceY} r={referenceRadius} /><text x={referenceX} y={referenceY + referenceDiameter * .18} textAnchor="middle" style={{ fontSize: referenceDiameter * .58 }}>{drawingReference}</text></g>}
      </svg>
      <line x1={item.x} y1={item.y + height + 100} x2={item.x + width} y2={item.y + height + 100} className="dimension-line" />
      <text x={item.x + width / 2} y={item.y + height + 185} textAnchor="middle" className="dimension-text" style={{ fontSize: dimensionTextSize }}>{number(width)} mm</text>
      <text x={item.x - 75} y={item.y + height / 2} textAnchor="middle" className="dimension-text" style={{ fontSize: dimensionTextSize }} transform={`rotate(-90 ${item.x - 75} ${item.y + height / 2})`}>{number(height)} mm</text>
    </g>
  );
}

function App() {
  const { permissions } = useSession();
  const [screen, setScreen] = useState<Screen>("home");
  const initialSeed = withTechnalSeed(materialData, assemblyData);
  const { materials, setMaterials, assemblies, setAssemblies } = useCatalogItemsState(initialSeed.materials, initialSeed.assemblies);
  const {
    projects, setProjects,
    selectedProjectId, setSelectedProjectId,
    selectedCanvasId, setSelectedCanvasId,
    selectedItemId, setSelectedItemId,
    copiedCanvasItem, setCopiedCanvasItem,
    undoProjectHistory, setUndoProjectHistory,
    redoProjectHistory, setRedoProjectHistory,
  } = useProjectsState(projectData);
  const [executionProjects, setExecutionProjects] = useState<ExecutionProject[]>([]);
  const [selectedExecutionProjectId, setSelectedExecutionProjectId] = useState("");
  const [executionFolderId, setExecutionFolderId] = useState<string | null>(null);
  const [selectedExecutionWorkspaceId, setSelectedExecutionWorkspaceId] = useState("");
  const [executionWorkspacePage, setExecutionWorkspacePage] = useState<ExecutionWorkspacePage>("cutting-list");
  const [workspaceStockDatabaseId, setWorkspaceStockDatabaseId] = useState("prices");
  const [workspaceStockSearch, setWorkspaceStockSearch] = useState("");
  const [workspaceStockAssemblyType, setWorkspaceStockAssemblyType] = useState("");
  const [workspaceOptimizationError, setWorkspaceOptimizationError] = useState("");
  const [newExecutionItemType, setNewExecutionItemType] = useState<"folder" | "optimization-material-order" | null>(null);
  const [newExecutionItemName, setNewExecutionItemName] = useState("");
  const [executionNewMenuOpen, setExecutionNewMenuOpen] = useState(false);
  const {
    markupRates, setMarkupRates,
    manpowerCurrency, setManpowerCurrency,
    manpowerCosts, setManpowerCosts,
    shippingTypes, setShippingTypes,
    shippingCosts, setShippingCosts,
    shippingRateForType, shippingRateForMaterial,
  } = useCostingState();
  const [modal, setModal] = useState<Modal>(null);
  const [materialDatabaseOverride, setMaterialDatabaseOverride] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assemblyTypeFilter, setAssemblyTypeFilter] = useState("");
  const [materialView, setMaterialView] = useState<"list" | "cards">("list");
  const [tableZoom, setTableZoom] = useState(100);
  const [selectedPriceMaterialIds, setSelectedPriceMaterialIds] = useState<Set<string>>(new Set());
  const [priceUndoHistory, setPriceUndoHistory] = useState<PriceHistorySnapshot[]>([]);
  const [priceRedoHistory, setPriceRedoHistory] = useState<PriceHistorySnapshot[]>([]);
  const [priceSelectionMode, setPriceSelectionMode] = useState(false);
  const [priceDeleteMode, setPriceDeleteMode] = useState(false);
  const [priceSelectionPending, setPriceSelectionPending] = useState<{ materialId: string; startX: number; startY: number } | null>(null);
  const [priceSelectionDrag, setPriceSelectionDrag] = useState<{ select: boolean } | null>(null);
  const [collapsedPriceTables, setCollapsedPriceTables] = useState<Set<string>>(new Set());
  const [databaseOpen, setDatabaseOpen] = useState(true);
  const [assembliesOpen, setAssembliesOpen] = useState(true);
  const [activeAssemblySystem, setActiveAssemblySystem] = useState<"technal" | "sidem">("technal");
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [activeProjectYear, setActiveProjectYear] = useState("2026");
  const [activeDatabaseId, setActiveDatabaseId] = useState("prices");
  const {
    componentDatabases, setComponentDatabases,
    weightRates, setWeightRates,
    companyDatabases, setCompanyDatabases,
    companyPriceTables, setCompanyPriceTables,
    movedOriginalPriceTableIds, setMovedOriginalPriceTableIds,
  } = useMaterialDatabasesState();
  const [rateMethodMenu, setRateMethodMenu] = useState<{ materialId: string; tableId: string } | null>(null);
  const [stockLengthMenu, setStockLengthMenu] = useState<{ materialId: string; entryId: string } | null>(null);
  const [newDatabaseParent, setNewDatabaseParent] = useState<"technal" | "sidem" | null>(null);
  const [newDatabaseName, setNewDatabaseName] = useState("");
  const [newCompanyDatabaseOpen, setNewCompanyDatabaseOpen] = useState(false);
  const [newCompanyDatabaseName, setNewCompanyDatabaseName] = useState("");
  const [newCompanyDatabaseError, setNewCompanyDatabaseError] = useState("");
  const [newCompanyTableFor, setNewCompanyTableFor] = useState<CompanyDatabase | null>(null);
  const [newCompanyTableName, setNewCompanyTableName] = useState("");
  const [newCompanyTableReference, setNewCompanyTableReference] = useState("");
  const [newCompanyTableError, setNewCompanyTableError] = useState("");
  const [moveCompanyTable, setMoveCompanyTable] = useState<TableMove | null>(null);
  const [moveCompanyTableTargetId, setMoveCompanyTableTargetId] = useState("");
  const [companyMaterialTableId, setCompanyMaterialTableId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"select" | "pan" | "two-rail" | "fly-screen" | "hinge-window" | "fixed-window" | "tilt-and-turn">("select");
  const [drawingView, setDrawingView] = useState({ x: 0, y: 0, zoom: 1 });
  const [canvasPreviewItems, setCanvasPreviewItems] = useState<CanvasItem[] | null>(null);
  const [cursorWindowPreview, setCursorWindowPreview] = useState<{ x: number; y: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [openingNameError, setOpeningNameError] = useState("");
  const [referenceConflict, setReferenceConflict] = useState<{ itemId: string; requestedReference: number } | null>(null);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [canvasExpanded, setCanvasExpanded] = useState(false);
  const [takeoffPanel, setTakeoffPanel] = useState<"material" | "glass" | "glassLibrary" | "manpower" | null>(null);
  const [manpowerPanelTab, setManpowerPanelTab] = useState<"parameters" | "items">("parameters");
  const [selectedGlassMaterialId, setSelectedGlassMaterialId] = useState<string | null>(null);
  const [glassRemovalMode, setGlassRemovalMode] = useState(false);
  const [glassCursor, setGlassCursor] = useState<{ x: number; y: number } | null>(null);
  const [itemMaterialPanelId, setItemMaterialPanelId] = useState<string | null>(null);
  const [editingItemMaterial, setEditingItemMaterial] = useState(false);
  const [takeoffPanelWidth, setTakeoffPanelWidth] = useState(340);
  const [leftCanvasPanelOpen, setLeftCanvasPanelOpen] = useState(false);
  const [leftCanvasPanelTab, setLeftCanvasPanelTab] = useState<"items" | "glass">("items");
  const [leftCanvasPanelWidth, setLeftCanvasPanelWidth] = useState(340);
  const leftCanvasPanelResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const continuePanelResize = (event: globalThis.PointerEvent) => {
      if (!(event.buttons & 1)) {
        leftCanvasPanelResizeRef.current = null;
        takeoffResizeRef.current = null;
        return;
      }
      const leftResize = leftCanvasPanelResizeRef.current;
      if (leftResize) {
        setLeftCanvasPanelWidth(Math.max(280, Math.min(720, leftResize.startWidth + event.clientX - leftResize.startX)));
      }
      const takeoffResize = takeoffResizeRef.current;
      if (takeoffResize) {
        const width = Math.max(260, Math.min(720, takeoffResize.startWidth + takeoffResize.startX - event.clientX));
        takeoffResizeWidth.current = width;
        setTakeoffPanelWidth(width);
      }
    };
    const stopPanelResize = () => {
      leftCanvasPanelResizeRef.current = null;
      takeoffResizeRef.current = null;
    };
    window.addEventListener("pointermove", continuePanelResize);
    window.addEventListener("pointerup", stopPanelResize);
    window.addEventListener("pointercancel", stopPanelResize);
    window.addEventListener("blur", stopPanelResize);
    return () => {
      window.removeEventListener("pointermove", continuePanelResize);
      window.removeEventListener("pointerup", stopPanelResize);
      window.removeEventListener("pointercancel", stopPanelResize);
      window.removeEventListener("blur", stopPanelResize);
    };
  }, []);

  useEffect(() => {
    if (!selectedGlassMaterialId && !glassRemovalMode) return;
    const cancelGlassAssignment = () => {
      setSelectedGlassMaterialId(null);
      setGlassRemovalMode(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelGlassAssignment();
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if ((event.target as Element | null)?.closest("button")) cancelGlassAssignment();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [selectedGlassMaterialId, glassRemovalMode]);
  useEffect(() => {
    if (!priceSelectionPending && !priceSelectionDrag) return;
    const stopDragSelection = () => {
      setPriceSelectionPending(null);
      setPriceSelectionDrag(null);
    };
    const continueDragSelection = (event: globalThis.PointerEvent) => {
      const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-price-material-id]");
      const materialId = row?.dataset.priceMaterialId;
      if (priceSelectionPending) {
        if (Math.hypot(event.clientX - priceSelectionPending.startX, event.clientY - priceSelectionPending.startY) < 12) return;
        const selected = new Set<string>([priceSelectionPending.materialId]);
        if (materialId) selected.add(materialId);
        setSelectedPriceMaterialIds(selected);
        setPriceSelectionMode(true);
        setPriceDeleteMode(false);
        setPriceSelectionDrag({ select: true });
        setPriceSelectionPending(null);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
      if (!priceSelectionDrag || !materialId) return;
      setSelectedPriceMaterialIds((current) => {
        const next = new Set(current);
        if (priceSelectionDrag.select) next.add(materialId); else next.delete(materialId);
        return next;
      });
    };
    window.addEventListener("pointermove", continueDragSelection);
    window.addEventListener("pointerup", stopDragSelection);
    window.addEventListener("pointercancel", stopDragSelection);
    return () => {
      window.removeEventListener("pointermove", continueDragSelection);
      window.removeEventListener("pointerup", stopDragSelection);
      window.removeEventListener("pointercancel", stopDragSelection);
    };
  }, [priceSelectionPending, priceSelectionDrag]);
  useEffect(() => {
    const exitPriceSelectionModes = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!priceSelectionMode && !priceDeleteMode && !priceSelectionPending && !priceSelectionDrag)) return;
      event.preventDefault();
      setPriceSelectionMode(false);
      setPriceDeleteMode(false);
      setPriceSelectionPending(null);
      setPriceSelectionDrag(null);
      setSelectedPriceMaterialIds(new Set());
    };
    window.addEventListener("keydown", exitPriceSelectionModes);
    return () => window.removeEventListener("keydown", exitPriceSelectionModes);
  }, [priceSelectionMode, priceDeleteMode, priceSelectionPending, priceSelectionDrag]);
  useEffect(() => {
    const priceHistoryShortcuts = (event: KeyboardEvent) => {
      if (screen !== "database" || activeDatabaseId !== "prices" || !(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoPriceChange(); else undoPriceChange();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoPriceChange();
      }
    };
    window.addEventListener("keydown", priceHistoryShortcuts);
    return () => window.removeEventListener("keydown", priceHistoryShortcuts);
  }, [screen, activeDatabaseId, priceUndoHistory, priceRedoHistory, materials, assemblies, projects, weightRates]);
  const takeoffPanelRef = useRef<HTMLElement | null>(null);
  const takeoffResizeWidth = useRef(340);
  const takeoffResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const [inspectorResize, setInspectorResize] = useState<{ startX: number; startWidth: number } | null>(null);
  const [interaction, setInteraction] = useState<
    | { type: "move"; itemId: string; startX: number; startY: number; origins: Record<string, { x: number; y: number }> }
    | { type: "resize"; itemId: string }
    | { type: "joinMove"; itemId: string; startX: number; startY: number; origins: Record<string, { x: number; y: number }> }
    | { type: "joinResize"; itemId: string; corner: WindowCorner; offsetX: number; offsetY: number }
    | { type: "join"; itemId: string; corner: WindowCorner }
    | { type: "pan"; startX: number; startY: number; originX: number; originY: number }
    | null
  >(null);
  const [joinModeItemId, setJoinModeItemId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState("");
  const [joinStretchMeasurement, setJoinStretchMeasurement] = useState<{ axis: "x" | "y" | null; direction: -1 | 1; amount: number; input: string; clientX: number; clientY: number } | null>(null);
  const joinResizeCommitRef = useRef(false);
  const lastWindowClickRef = useRef<{ itemId: string; x: number; y: number; at: number } | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [assemblyColor, setAssemblyColor] = useState("#25a9ad");
  const [assemblyCanvasDefaults, setAssemblyCanvasDefaults] = useState<AssemblyCanvasDefaults>(defaultAssemblyCanvasDefaults);
  const [formClient, setFormClient] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [partIds, setPartIds] = useState<string[]>([]);
  const [partMaterialIds, setPartMaterialIds] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState("piece");
  const [priceMethod, setPriceMethod] = useState("Per piece");
  const [materialPriceTable, setMaterialPriceTable] = useState<Material["priceTable"]>("general");
  const [cost, setCost] = useState("0");
  const [materialQuantityFormula, setMaterialQuantityFormula] = useState("1");
  const [materialCodeError, setMaterialCodeError] = useState("");
  const [formulaValidationError, setFormulaValidationError] = useState("");
  const [options, setOptions] = useState("");
  const [glassDescription, setGlassDescription] = useState("");
  const [glassThickness, setGlassThickness] = useState("");
  const [rules, setRules] = useState<BreakdownRule[]>([]);
  const [partQuantities, setPartQuantities] = useState<Record<string, number>>({});
  const [partFormulas, setPartFormulas] = useState<Record<string, string>>({});
  const [partFourPanelFormulas, setPartFourPanelFormulas] = useState<Record<string, string>>({});
  const [partConditions, setPartConditions] = useState<Record<string, string>>({});
  const [activeConditionMaterialId, setActiveConditionMaterialId] = useState<string | null>(null);
  const [activeFormulaField, setActiveFormulaField] = useState<{ materialId: string; field: "true" | "false" } | null>(null);
  const [formulaEditBackup, setFormulaEditBackup] = useState<{ materialId: string; field: "true" | "false"; value: string } | null>(null);
  const [conditionEditBackup, setConditionEditBackup] = useState<{ materialId: string; value: string } | null>(null);
  const [partLabels, setPartLabels] = useState<Record<string, string>>({});
  const [photoMenuMaterialId, setPhotoMenuMaterialId] = useState<string | null>(null);
  const [moveMaterialId, setMoveMaterialId] = useState<string | null>(null);
  const [insertAfterMaterialId, setInsertAfterMaterialId] = useState<string | null>(null);
  const [insertMaterialCode, setInsertMaterialCode] = useState("");
  const [priceInsertAfterMaterialId, setPriceInsertAfterMaterialId] = useState<string | null>(null);
  const [joinModifications, setJoinModifications] = useState<JoinModification[]>([]);
  const [frameTypes, setFrameTypes] = useState<FrameType[]>([]);
  const [nameRules, setNameRules] = useState<AssemblyNameRule[]>([]);
  const [realJoinPropertyMatches, setRealJoinPropertyMatches] = useState<JoinPropertyMatch[]>([]);
  const [fakeJoinPropertyMatches, setFakeJoinPropertyMatches] = useState<JoinPropertyMatch[]>([]);
  const updateJoinPropertyMatch = (kind: "real" | "fake", id: string, change: Partial<JoinPropertyMatch>) => {
    const update = (rows: JoinPropertyMatch[]) => rows.map((row) => row.id === id ? { ...row, ...change } : row);
    if (kind === "real") setRealJoinPropertyMatches(update);
    else setFakeJoinPropertyMatches(update);
  };
  const addJoinPropertyMatch = (kind: "real" | "fake", property = "hasArchitrave") => {
    const row = { id: makeId(), property, withAssemblyIds: [] };
    if (kind === "real") setRealJoinPropertyMatches((rows) => [...rows, row]);
    else setFakeJoinPropertyMatches((rows) => [...rows, row]);
  };
  const removeJoinPropertyMatch = (kind: "real" | "fake", id: string) => {
    if (kind === "real") setRealJoinPropertyMatches((rows) => rows.filter((row) => row.id !== id));
    else setFakeJoinPropertyMatches((rows) => rows.filter((row) => row.id !== id));
  };
  const [newPartCode, setNewPartCode] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [workspaceSaveStatus, setWorkspaceSaveStatus] = useState<"saving" | "saved" | "error">("saved");
  const [recentWorkspaceSaves, setRecentWorkspaceSaves] = useState<string[]>([]);
  const [fynAssemblyMaterialTemplateVersion, setFynAssemblyMaterialTemplateVersion] = useState(0);
  const workspaceSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const workspaceSaveVersion = useRef(0);
  const workspaceRefreshInProgress = useRef(false);
  const [materialSketch, setMaterialSketch] = useState("");
  const [materialPenPoints, setMaterialPenPoints] = useState<string[]>([]);
  const [assemblyReferenceImage, setAssemblyReferenceImage] = useState("");
  const assemblyAutoSaveReady = useRef(false);
  const [assemblyAutoSaveStatus, setAssemblyAutoSaveStatus] = useState<"saved" | "saving">("saved");
  const [assemblyColumnWidths, setAssemblyColumnWidths] = useState([170, 54, 190, 330, 260, 390]);
  const [assemblyColumnResize, setAssemblyColumnResize] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [copyFromAssemblyOpen, setCopyFromAssemblyOpen] = useState(false);
  const priceSnapshot = (): PriceHistorySnapshot => JSON.parse(JSON.stringify({ materials, assemblies, projects, weightRates })) as PriceHistorySnapshot;
  const recordPriceChange = () => {
    setPriceUndoHistory((history) => [...history, priceSnapshot()].slice(-100));
    setPriceRedoHistory([]);
  };
  const restorePriceSnapshot = (snapshot: PriceHistorySnapshot) => {
    setMaterials(snapshot.materials);
    setAssemblies(snapshot.assemblies);
    setProjects(snapshot.projects);
    setWeightRates(snapshot.weightRates);
    setSelectedPriceMaterialIds(new Set());
    setPriceSelectionMode(false);
    setPriceDeleteMode(false);
  };
  const undoPriceChange = () => {
    const previous = priceUndoHistory[priceUndoHistory.length - 1];
    if (!previous) return;
    setPriceRedoHistory((history) => [...history, priceSnapshot()].slice(-100));
    setPriceUndoHistory((history) => history.slice(0, -1));
    restorePriceSnapshot(previous);
  };
  const redoPriceChange = () => {
    const next = priceRedoHistory[priceRedoHistory.length - 1];
    if (!next) return;
    setPriceUndoHistory((history) => [...history, priceSnapshot()].slice(-100));
    setPriceRedoHistory((history) => history.slice(0, -1));
    restorePriceSnapshot(next);
  };
  const project =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const displayedCanvasItems = canvasPreviewItems ?? project?.items ?? [];
  const visibleCanvasItems = useMemo(() => {
    const padding = 250;
    const right = drawingView.x + 9000 / drawingView.zoom;
    const bottom = drawingView.y + 5600 / drawingView.zoom;
    return displayedCanvasItems.filter((item) => {
      const itemRight = item.x + (item.inputWidth ?? 1500);
      const itemBottom = item.y + (item.inputHeight ?? 1200);
      return itemRight >= drawingView.x - padding && item.x <= right + padding && itemBottom >= drawingView.y - padding && item.y <= bottom + padding;
    });
  }, [displayedCanvasItems, drawingView]);
  const contextItem =
    project?.items.find((item) => item.id === contextMenu?.itemId) ?? null;
  const contextCombinationSize = contextItem && project ? allJoinedWindowGroup(project.items, contextItem.id).size : 1;
  const contextIsFlyScreen = contextItem?.assemblyPage === FLY_SCREEN_PAGE || contextItem?.sourceId === "fly-screen-2rail";
  const assemblyFormulaValuesForEditorBase = modal?.type === "assembly" && modal.id === "fly-screen-2rail"
    ? ASSEMBLY_FORMULA_VALUES.filter((value) => ["Width", "Height", "Area", "Perimeter", "Coating"].includes(value.name))
    : ASSEMBLY_FORMULA_VALUES.filter((value) => {
      if (value.name === "NumberOfLeaves") return !["fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
      if (value.name === "OpeningType") return ["soleal-gyn-2rail", "hinged-window-soleal-fyn"].includes(modal?.id ?? "");
      if (value.name === "LeafSize") return ["hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
      if (value.name === "FrameSize") return ["hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
      if (value.name === "ArchitraveAllowance") return [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail", "hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
      if (["JoinedUp", "JoinedDown", "JoinedLeft", "JoinedRight"].includes(value.name)) return usesDirectJoinValues(assemblies.find((assembly) => assembly.id === modal?.id));
      if (value.name === "JoinedCorners") return usesDirectJoinValues(assemblies.find((assembly) => assembly.id === modal?.id));
      if (value.name === "FlyScreen") return ![TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail", "hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
      return true;
    });
  const assemblyFormulaValuesForEditor = assemblyFormulaValuesForEditorBase.some((value) => value.name === "JoinLength")
    ? assemblyFormulaValuesForEditorBase
    : [...assemblyFormulaValuesForEditorBase, { name: "JoinLength", label: "Join length", description: "Total overlapping join length in metres, including both Real and Fake joins." }];
  const contextIsHingeWindow = contextItem?.assemblyPage === HINGE_WINDOW_PAGE || contextItem?.sourceId === "hinged-window-soleal-fyn";
  const contextSupportsOpeningType = contextItem?.sourceId === "soleal-gyn-2rail" || contextItem?.sourceId === "hinged-window-soleal-fyn";
  const contextIsFixedWindow = contextItem?.assemblyPage === FIXED_WINDOW_PAGE || contextItem?.sourceId === "fixed-window";
  const contextIsTiltAndTurn = contextItem?.assemblyPage === TILT_AND_TURN_PAGE || contextItem?.sourceId === "tilt-and-turn-soleal-fyn";
  const contextSupportsFynLeafSize = contextItem?.sourceId === "hinged-window-soleal-fyn" || contextItem?.sourceId === "fixed-window" || contextItem?.sourceId === "tilt-and-turn-soleal-fyn";
  // Window-join graph + frame-type + formula/quantity engines relocated to
  // modules/projects/domain/joinEngine.ts and modules/costing/domain/quantityEngine.ts
  // (Phase 2 extraction). These are thin wrappers binding today's component
  // state to the pure, explicit-parameter versions — see docs/architecture/OVERVIEW.md.
  const frameTypeForItem = (item: CanvasItem) => frameTypeForItemPure(item, assemblies, materials, project?.items ?? []);
  const realJoinCheck = (source: CanvasItem, target: CanvasItem, sourceCorner: WindowCorner, targetCorner: WindowCorner, canvasItems = project?.items ?? []) =>
    realJoinCheckPure(source, target, sourceCorner, targetCorner, canvasItems, assemblies, frameTypeForItem);
  const reconcileRealJoins = (items: CanvasItem[]) => reconcileRealJoinsPure(items, assemblies, frameTypeForItem);
  const recheckCombinationJoins = (items: CanvasItem[]) => recheckCombinationJoinsPure(items, assemblies, frameTypeForItem);
  const synchronizeCombinationDetails = (items: CanvasItem[]) => synchronizeCombinationDetailsPure(items, assemblies);
  const formulaValuesForItem = (item: CanvasItem) => formulaValuesForItemPure(item, materials, project?.items ?? []);
  const calculatePartQuantity = (item: CanvasItem, part: AssemblyPart, material: Material) =>
    calculatePartQuantityPure(item, part, material, assemblies, materials, project?.items ?? []);
  const activeDatabase = databaseDefinitions[activeDatabaseId] ?? (() => {
    const database = componentDatabases.find((item) => item.id === activeDatabaseId);
    const parentName = database?.parent === "technal" ? "Technal" : "Sidem";
    return { title: `${parentName} · ${database?.name ?? "Component"}`, eyebrow: `Database / ${parentName}`, description: `Materials used only by the ${database?.name ?? "selected"} component.` };
  })();
  const materialScopeId = materialDatabaseOverride ?? activeDatabaseId;
  const materialScopeTitle = materialScopeId === "sidem" ? "Sidem" : databaseDefinitions[materialScopeId]?.title ?? activeDatabase.title;
  const materialScopeManufacturer = materialScopeId === "markups" ? "General" : materialScopeId === "manpower" ? "Man power" : materialScopeId === "shipping" ? "Shipping" : materialScopeId === "sidem" ? "Sidem" : "Technal";
  const liveMaterialTotals = useMemo(() => {
    const totals = new Map<string, { quantity: number; total: number; assemblyQuantity: number; formulas: { label: string; isError: boolean }[] }>();
    const add = (materialId: string, result: CalculationResult, formula?: string, opening?: string, assemblyQuantity = result.value, itemQuantity = 1) => {
      const material = materials.find((value) => value.id === materialId);
      if (!material) return;
      const current = totals.get(materialId) ?? { quantity: 0, total: 0, assemblyQuantity: 0, formulas: [] };
      const quantityWithWastage = result.value * Math.max(1, itemQuantity) * (1 + Math.max(0, material.wastage ?? 0) / 100);
      const wastageMultiplier = 1 + Math.max(0, material.wastage ?? 0) / 100;
      const calculation = formula ? `(${formula}) × ${number(wastageMultiplier)}` : "Manual quantity";
      const origin = opening ? `${opening} — ` : "";
      const formulaTag = { label: result.error ? `${origin}${calculation}: ${result.error}` : `${origin}${calculation} = ${number(quantityWithWastage)} ${material.unit}`, isError: Boolean(result.error) };
      const alreadyRecorded = current.formulas.some((entry) => entry.label === formulaTag.label);
      totals.set(materialId, { quantity: current.quantity + quantityWithWastage, total: current.total + quantityWithWastage * unitPriceWithShipping(material, shippingRateForMaterial(material)), assemblyQuantity: current.assemblyQuantity + assemblyQuantity * Math.max(1, itemQuantity), formulas: alreadyRecorded ? current.formulas : [...current.formulas, formulaTag] });
    };
    project?.items.forEach((item) => {
      const opening = item.kind === "assembly" ? item.name : "Manual material";
      if (item.kind === "material") {
        add(item.sourceId, { value: 1 }, undefined, opening, 1, item.quantity ?? 1);
        return;
      }
      const assembly = assemblies.find((value) => value.id === item.sourceId);
      const parts = assembly ? [
        ...assembly.parts,
        ...(assembly.joinModifications ?? [])
          .filter((modification) => !assembly.parts.some((part) => part.materialId === modification.materialId))
          .map((modification) => ({ materialId: modification.materialId, quantity: 0, quantityFormula: "0", label: "Join modification" })),
      ] : [];
      parts.forEach((part) => {
        const material = materials.find((value) => value.id === part.materialId);
        if (!material) return;
        const calculated = calculatePartQuantity(item, part, material);
        const assemblyCalculated = calculatePartQuantity({ ...item, materialAdjustments: undefined }, part, material);
        if (part.label === "Join modification" && assemblyCalculated.result.value <= 0) return;
        add(part.materialId, calculated.result, calculated.formula, opening, assemblyCalculated.result.value, item.quantity ?? 1);
      });
      if (item.glassMaterialId) {
        const baseGlassArea = glassAreaForWindow(item.inputWidth ?? 1500, item.inputHeight ?? 1200, item.leaves ?? 2);
        const adjustmentFormula = item.materialAdjustments?.[item.glassMaterialId]?.trim();
        const subtract = adjustmentFormula?.startsWith("-");
        const adjustment = adjustmentFormula ? calculateFormula(adjustmentFormula.replace(/^[-+]/, ""), item.inputWidth ?? 1500, item.inputHeight ?? 1200, formulaValuesForItem(item)) : { value: 0 };
        add(item.glassMaterialId, { value: Math.max(0, baseGlassArea + (subtract ? -adjustment.value : adjustment.value)) }, adjustmentFormula ? `Glass area + (${adjustmentFormula})` : "Glass area", opening, undefined, item.quantity ?? 1);
      }
    });
    return [...totals.entries()]
      .map(([materialId, values]) => ({
        material: materials.find((value) => value.id === materialId),
        ...values,
      }))
      .filter((entry) => entry.material && entry.assemblyQuantity > 0);
  }, [project, assemblies, materials, shippingTypes, shippingCosts]);
  const materialTakeoff = liveMaterialTotals.filter(({ material }) => material?.databaseId !== "glass");
  const glassTakeoff = liveMaterialTotals.filter(({ material }) => material?.databaseId === "glass");
  const itemMaterialTakeoff = useMemo(() => {
    const item = project?.items.find((value) => value.id === itemMaterialPanelId);
    if (!item || item.kind !== "assembly") return [];
    const assembly = assemblies.find((value) => value.id === item.sourceId);
    if (!assembly) return [];
    const parts = [
      ...assembly.parts.map((part) => ({ part, joinOnly: false })),
      ...(assembly.joinModifications ?? [])
        .filter((modification) => !assembly.parts.some((part) => part.materialId === modification.materialId))
        .map((modification) => ({ part: { materialId: modification.materialId, quantity: 0, quantityFormula: "0", label: "Join modification" }, joinOnly: true })),
    ];
    return parts.flatMap(({ part }) => {
      const material = materials.find((value) => value.id === part.materialId);
      if (!material) return [];
      const calculated = calculatePartQuantity(item, part, material);
      const assemblyCalculated = calculatePartQuantity({ ...item, materialAdjustments: undefined }, part, material);
      if (assemblyCalculated.result.value <= 0) return [];
      const quantity = calculated.result.value * Math.max(1, item.quantity ?? 1) * (1 + Math.max(0, material.wastage ?? 0) / 100);
      const wastageMultiplier = 1 + Math.max(0, material.wastage ?? 0) / 100;
      const formula = `(${calculated.formula}) × ${number(wastageMultiplier)} = ${number(quantity)} ${material.unit}`;
      return [{ material, reference: part.label ?? materialDatabaseReference(material), quantity, total: quantity * unitPriceWithShipping(material, shippingRateForMaterial(material)), formula, isError: Boolean(calculated.result.error) }];
    });
  }, [project, itemMaterialPanelId, assemblies, materials, shippingTypes, shippingCosts]);
  const itemMaterialPanel = project?.items.find((item) => item.id === itemMaterialPanelId);
  const itemGlassTakeoff = useMemo(() => {
    if (!itemMaterialPanel?.glassMaterialId) return [];
    const material = materials.find((value) => value.id === itemMaterialPanel.glassMaterialId);
    if (!material) return [];
    const baseQuantity = glassAreaForWindow(itemMaterialPanel.inputWidth ?? 1500, itemMaterialPanel.inputHeight ?? 1200, itemMaterialPanel.leaves ?? 2);
    const adjustmentFormula = itemMaterialPanel.materialAdjustments?.[material.id]?.trim();
    const subtract = adjustmentFormula?.startsWith("-");
    const adjustment = adjustmentFormula ? calculateFormula(adjustmentFormula.replace(/^[-+]/, ""), itemMaterialPanel.inputWidth ?? 1500, itemMaterialPanel.inputHeight ?? 1200, formulaValuesForItem(itemMaterialPanel)) : { value: 0 };
    const quantity = Math.max(0, baseQuantity + (subtract ? -adjustment.value : adjustment.value)) * Math.max(1, itemMaterialPanel.quantity ?? 1);
    return [{ material, quantity, total: quantity * unitPriceWithShipping(material, shippingRateForMaterial(material)) }];
  }, [itemMaterialPanel, materials, shippingTypes, shippingCosts]);
  const activeCanvas = project?.canvases?.find((canvas) => canvas.id === selectedCanvasId);
  const activeManpowerHours = { ...defaultManpowerHours, ...activeCanvas?.manpowerHours };
  const manpowerParameter = activeCanvas?.manpowerParameter ?? "area";
  const selectedManpowerItemIds = new Set(activeCanvas?.manpowerItemIds ?? project?.items.filter((item) => item.assemblyPage !== FLY_SCREEN_PAGE && item.sourceId !== "fly-screen-2rail").map((item) => item.id) ?? []);
  const manpowerParameterUnit: Record<typeof manpowerParameter, string> = { width: "lm", height: "lm", area: "m²", perimeter: "lm" };
  const manpowerParameterQuantity = project?.items
    .filter((item) => selectedManpowerItemIds.has(item.id))
    .reduce((total, item) => {
      const width = Math.max(0, item.inputWidth ?? item.width) / 1000;
      const height = Math.max(0, item.inputHeight ?? item.height) / 1000;
      const measure = manpowerParameter === "width" ? width : manpowerParameter === "height" ? height : manpowerParameter === "area" ? width * height : 2 * (width + height);
      return total + measure * Math.max(1, item.quantity ?? 1);
    }, 0) ?? 0;
  const manpowerRows = useMemo(() => manpowerCosts.map((cost) => {
    const hoursPerUnit = Math.max(0, activeManpowerHours[cost.id] ?? 0);
    const hours = hoursPerUnit * manpowerParameterQuantity;
    return { ...cost, hoursPerUnit, hours, total: hours * cost.rate };
  }), [activeManpowerHours, manpowerCosts, manpowerParameterQuantity]);
  const manpowerTakeoff = manpowerRows.filter((cost) => cost.hours > 0);
  const manpowerTotal = manpowerTakeoff.reduce((total, cost) => total + cost.total, 0);
  const materialTakeoffTotal = materialTakeoff.reduce((total, row) => total + row.total, 0);
  const glassTakeoffTotal = glassTakeoff.reduce((total, row) => total + row.total, 0);
  const directCost = materialTakeoffTotal + glassTakeoffTotal + manpowerTotal;
  const selectedMarkupType = activeCanvas?.markupType ?? "typeA";
  const selectedMarkupRate = markupRates.reduce((total, markup) => total + markup[selectedMarkupType], 0);
  const selectedMarkupName = selectedMarkupType === "typeA" ? "Type A" : selectedMarkupType === "typeB" ? "Type B" : "Type C";

  useEffect(() => {
    workspaceGateway.loadSnapshot()
      .then((snapshot) => {
        if (snapshot) {
          const saved = JSON.parse(snapshot) as {
            materials: Material[];
            assemblies: Assembly[];
            projects: Project[];
            executionProjects?: ExecutionProject[];
            componentDatabases?: ComponentDatabase[];
            weightRates?: Record<string, number>;
            markupRates?: MarkupRate[];
            manpowerCurrency?: string;
            manpowerCosts?: ManpowerCost[];
            shippingTypes?: ShippingType[];
            shippingCosts?: ShippingCost[];
            fynAssemblyMaterialTemplateVersion?: number;
            companyDatabases?: CompanyDatabase[];
            companyPriceTables?: CompanyPriceTable[];
            movedOriginalPriceTableIds?: string[];
          };
          const seeded = withTechnalSeed(saved.materials ?? materialData, saved.assemblies ?? assemblyData);
          const fynTransomMaterialIds = new Set(seeded.materials.filter((material) => FYN_TRANSOM_CODES.has(material.code)).map((material) => material.id));
          setMaterials(
            [...seeded.materials.map((material) => ({
              ...material,
              supplierCode: material.supplierCode ?? "",
              unit: material.unit ?? "piece",
              weight: material.weight ?? 0,
              rateMethod: material.rateMethod ?? "manual",
              manualRate: material.manualRate ?? (material.rateMethod === "manual" || !material.rateMethod ? material.cost ?? 0 : undefined),
              priceMethod: material.priceMethod ?? "Per piece",
              cost: material.cost ?? 0,
              shippingPercentage: material.shippingPercentage ?? 0,
              options: material.options ?? [],
              properties: material.properties ?? [],
              sketch: material.code === "FY2300" ? fynTransomPhoto : material.sketch,
              databaseId: GENERAL_ITEM_CODES.has(material.code)
                ? "markups"
                : material.databaseId === TECHNAL_2_SLIDER_DATABASE
                  ? TECHNAL_GYN_DATABASE
                  : material.databaseId === TECHNAL_FY_DATABASE
                    ? TECHNAL_FYN_DATABASE
                    : material.databaseId ?? (technalMaterials.some((seed) => seed.code === material.code) ? TECHNAL_GYN_DATABASE : undefined),
              quantityFormula: material.quantityFormula ?? technalMaterials.find((seed) => seed.code === material.code)?.quantityFormula,
            })), ...(seeded.materials.some((material) => material.code === "FY2300") ? [] : [fynTransomMaterial])],
          );
          const normalizedAssemblies = seeded.assemblies.map((assembly) => ({
              ...assembly,
              name: assembly.id === "fly-screen-2rail" ? "Fly screen - Soleal - GYn" : assembly.id === "hinged-window-soleal-fyn" ? "Hinged System - Soleal - FYn" : [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id) || /^2 rail(?: sliding window)? - soleal - gyn$/i.test(assembly.name) ? "2 Rail System - Soleal - GYn" : assembly.name,
              code: assembly.id === "fly-screen-2rail" ? "SOLEAL-GYN-FLY" : assembly.code,
              category: assembly.id === "fly-screen-2rail" ? "Fly screen" : assembly.category,
              sketch: assembly.id === "fly-screen-2rail" ? flyScreenAssembly.sketch : assembly.sketch,
              assemblyPage: assembly.id === "fly-screen-2rail" ? FLY_SCREEN_PAGE : assembly.assemblyPage ?? TWO_RAIL_WINDOW_PAGE,
              properties: assembly.id === "fly-screen-2rail"
                ? ["Width", "Height"]
                : assembly.id === "tilt-and-turn-soleal-fyn"
                  ? ASSEMBLY_FORMULA_VALUES.filter((value) => value.name !== "NumberOfLeaves" && value.name !== "FlyScreen" && value.name !== "OpeningType").map((value) => value.name)
                  : (assembly.properties ?? ["Width", "Height"]),
              parts: assembly.parts.map((part) => ({
                ...part,
                label: assembly.id === "fly-screen-2rail" ? undefined : part.label,
                quantityFormula: assembly.id === "fly-screen-2rail"
                  ? part.quantityFormula?.toLowerCase() === "f12" ? "Perimeter" : part.quantityFormula
                  : fynTransomMaterialIds.has(part.materialId) && part.quantityFormula?.includes("JoinedUp*0.5*Width")
                    ? REAL_JOIN_TRANSOM_FORMULA
                    : part.quantityFormula,
                quantityFormulaFourPanels: assembly.id === "fly-screen-2rail" && part.quantityFormulaFourPanels?.toLowerCase() === "f12" ? "Perimeter" : part.quantityFormulaFourPanels,
              })),
              rules: assembly.rules ?? [],
              databaseId: assembly.databaseId === TECHNAL_2_SLIDER_DATABASE
                ? TECHNAL_GYN_DATABASE
                : assembly.databaseId === TECHNAL_FY_DATABASE
                  ? TECHNAL_FYN_DATABASE
                  : assembly.databaseId ?? (assembly.code === technalAssembly.code ? TECHNAL_GYN_DATABASE : undefined),
              joinModifications: usesDirectJoinValues(assembly)
                ? []
                : (assembly.databaseId === TECHNAL_FYN_DATABASE || assembly.databaseId === TECHNAL_FY_DATABASE)
                ? completeFynJoinModifications(assembly.joinModifications)
                : assembly.joinModifications ?? [],
            }));
          const hingedFynFrameTypes = normalizedAssemblies.find((assembly) => assembly.id === "hinged-window-soleal-fyn")?.frameTypes ?? [];
          setAssemblies(normalizedAssemblies.map((assembly) =>
            (["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && !assembly.frameTypes?.length && hingedFynFrameTypes.length)
              ? { ...assembly, frameTypes: hingedFynFrameTypes.map((row) => ({ ...row })) }
              : assembly,
          ));
          setProjects((saved.projects ?? projectData).map((project) => {
            const normalizeItems = (items: CanvasItem[]) => items.map((item) => {
              const isLegacyHinge = item.sourceId === "hinge-window";
              const isHingeWindow = item.assemblyPage === HINGE_WINDOW_PAGE || item.sourceId === "hinged-window-soleal-fyn" || isLegacyHinge;
              const isTiltAndTurn = item.assemblyPage === TILT_AND_TURN_PAGE || item.sourceId === "tilt-and-turn-soleal-fyn";
              const isTwoRailWindow = item.assemblyPage === TWO_RAIL_WINDOW_PAGE || [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId);
              return {
                ...item,
                x: Math.round(item.x),
                y: Math.round(item.y),
                sourceId: isLegacyHinge ? "" : item.sourceId,
                name: isLegacyHinge ? "Hinge window" : item.name,
                sketch: isLegacyHinge ? "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82" : item.sketch,
                inputWidth: Math.round(item.inputWidth ?? 1500),
                inputHeight: Math.round(item.inputHeight ?? 1200),
                quantity: Math.max(1, Math.round(item.quantity ?? 1)),
                openingType: item.openingType ?? "window",
                leafSize: item.leafSize ?? "small",
                frameSize: item.frameSize ?? "small",
                // Fly-screen allowance was renamed to Architrave allowance for two-rail systems.
                hasArchitraveAllowance: item.hasArchitraveAllowance ?? (isTwoRailWindow ? item.hasFlyScreen ?? false : false),
                hasCoating: item.hasCoating ?? false,
                leaves: isHingeWindow ? (item.leaves === 3 || item.leaves === 4 ? 2 : item.leaves ?? 1) : isTiltAndTurn ? 1 : item.leaves,
                assemblyPage: isHingeWindow ? HINGE_WINDOW_PAGE : item.assemblyPage ?? (item.sourceId === "fly-screen-2rail" ? FLY_SCREEN_PAGE : item.kind === "assembly" ? TWO_RAIL_WINDOW_PAGE : undefined),
              };
            });
            const canvases = project.canvases?.length ? project.canvases.map((canvas) => ({ ...canvas, items: normalizeItems(canvas.items) })) : [{ id: "opening-1", name: "Opening 1", items: normalizeItems(project.items) }];
            return { ...project, year: project.year ?? "2026", company: project.company ?? "", location: project.location ?? "Lebanon", canvases, items: canvases[0].items };
          }));
          setExecutionProjects((saved.executionProjects ?? [])
            .filter((project) => project.id && project.name?.trim())
            .map((project) => ({ ...project, files: project.files ?? [] })));
          setComponentDatabases(() => {
            const savedDatabases = saved.componentDatabases ?? [];
            return [...defaultComponentDatabases, ...savedDatabases.filter((item) => item.id !== TECHNAL_2_SLIDER_DATABASE && item.id !== TECHNAL_FY_DATABASE && !defaultComponentDatabases.some((defaultItem) => defaultItem.id === item.id))];
          });
          setWeightRates(saved.weightRates ?? {});
          setMarkupRates(saved.markupRates?.length ? saved.markupRates : defaultMarkupRates);
          setManpowerCurrency(saved.manpowerCurrency || "US Dollar");
          setManpowerCosts(saved.manpowerCosts?.length ? saved.manpowerCosts : defaultManpowerCosts);
          const savedShippingTypes = saved.shippingTypes?.length ? saved.shippingTypes : defaultShippingTypes;
          setShippingTypes(savedShippingTypes);
          setShippingCosts((saved.shippingCosts?.length ? saved.shippingCosts : defaultShippingCosts).map((cost) => {
            const legacyCost = cost as ShippingCost & { percentage?: number };
            const values: Record<string, number> = {};
            savedShippingTypes.forEach((type) => {
              values[type.id] = Math.max(0, Number(legacyCost.values?.[type.id] ?? (type.id === "type-1" ? legacyCost.percentage : 0)) || 0);
            });
            return {
              id: legacyCost.id,
              name: legacyCost.name,
              values,
            };
          }));
          setFynAssemblyMaterialTemplateVersion(saved.fynAssemblyMaterialTemplateVersion ?? 0);
          setCompanyDatabases((saved.companyDatabases ?? []).filter((database) => database.id && database.name?.trim()));
          const savedCompanyTables = (saved.companyPriceTables ?? []).filter((table) => table.id && table.companyDatabaseId && table.name?.trim() && table.referencePrefix?.trim());
          setCompanyPriceTables(savedCompanyTables);
          const migratedMoves = [{ id: "general-others", name: "Others", prefix: "G" }, { id: "general-profiles", name: "General ALU profiles", prefix: "GP" }, { id: "general-accessories", name: "General ALU accessories", prefix: "GA" }]
            .filter((original) => savedCompanyTables.some((table) => table.companyDatabaseId !== "prices" && table.name.trim().toLowerCase() === original.name.toLowerCase() && table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === original.prefix.toLowerCase()))
            .map((original) => original.id);
          setMovedOriginalPriceTableIds([...new Set([...(saved.movedOriginalPriceTableIds ?? []), ...migratedMoves])]);
          setSelectedProjectId(saved.projects?.[0]?.id ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => {
    workspaceGateway.fetchRecentSaves()
      .then(setRecentWorkspaceSaves)
      .catch((error) => console.error("Could not load recent workspace saves.", error));
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => items.map((assembly) => {
      if (assembly.databaseId !== TECHNAL_FYN_DATABASE || usesDirectJoinValues(assembly)) return assembly;
      const joinModifications = completeFynJoinModifications(assembly.joinModifications);
      return JSON.stringify(joinModifications) === JSON.stringify(assembly.joinModifications ?? []) ? assembly : { ...assembly, joinModifications };
    }));
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Qty is universal for any join, so it is not saved as an assembly rule.
    setAssemblies((items) => items.map((assembly) => {
      const realJoinPropertyMatches = assembly.realJoinPropertyMatches?.filter((rule) => rule.property !== "quantity");
      const fakeJoinPropertyMatches = assembly.fakeJoinPropertyMatches?.filter((rule) => rule.property !== "quantity");
      return JSON.stringify(realJoinPropertyMatches) === JSON.stringify(assembly.realJoinPropertyMatches) && JSON.stringify(fakeJoinPropertyMatches) === JSON.stringify(assembly.fakeJoinPropertyMatches)
        ? assembly
        : { ...assembly, realJoinPropertyMatches, fakeJoinPropertyMatches };
    }));
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Migrate existing drawings made before property matching converged on a
    // single value when a Real or Fake join was first created.
    setProjects((current) => current.map((project) => {
      const canvases = project.canvases?.length
        ? project.canvases.map((canvas) => ({ ...canvas, items: synchronizeCombinationDetails(recheckCombinationJoins(canvas.items)) }))
        : undefined;
      const items = canvases?.[0]?.items ?? synchronizeCombinationDetails(recheckCombinationJoins(project.items));
      const next = { ...project, items, ...(canvases ? { canvases } : {}) };
      return JSON.stringify(next) === JSON.stringify(project) ? project : next;
    }));
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Keep saved two-rail assemblies working after the FlyScreen value was renamed.
    setAssemblies((items) => items.map((assembly) => {
      if (assembly.assemblyPage !== TWO_RAIL_WINDOW_PAGE && ![TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id)) return assembly;
      const renameFormulaValue = (value?: string) => value?.replace(/\bFlyScreen\b/gi, "ArchitraveAllowance");
      const parts = assembly.parts.map((part) => ({
        ...part,
        quantityFormula: renameFormulaValue(part.quantityFormula),
        quantityFormulaOtherwise: renameFormulaValue(part.quantityFormulaOtherwise),
        quantityFormulaFourPanels: renameFormulaValue(part.quantityFormulaFourPanels),
        conditionFormula: renameFormulaValue(part.conditionFormula),
      }));
      return JSON.stringify(parts) === JSON.stringify(assembly.parts) ? assembly : { ...assembly, parts };
    }));
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // The standard opening systems share one commercial assembly category.
    setAssemblies((items) => items.map((assembly) => {
      const category = standardAssemblyCategory(assembly.assemblyPage);
      return category && assembly.category !== category ? { ...assembly, category } : assembly;
    }));
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const glazedAssemblyIds = items.filter((assembly) => assembly.category === GLAZED_ALUMINIUM_CATEGORY).map((assembly) => assembly.id);
      return items.map((assembly) => {
        if (assembly.realJoinPropertyMatches !== undefined || assembly.category !== GLAZED_ALUMINIUM_CATEGORY) return assembly;
        const withAssemblyIds = glazedAssemblyIds;
        return {
          ...assembly,
          realJoinPropertyMatches: JOIN_MATCH_PROPERTIES.map((property) => ({ id: `${assembly.id}-real-${property.value}`, property: property.value, withAssemblyIds })),
          fakeJoinPropertyMatches: ["hasArchitrave", "hasArchitraveAllowance"].map((property) => ({ id: `${assembly.id}-fake-${property}`, property, withAssemblyIds })),
        };
      });
    });
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const hinged = items.find((assembly) => assembly.id === "hinged-window-soleal-fyn");
      if (!hinged) return items;
      return items.map((assembly) => ["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && assembly.joinPropertyMatchSource !== hinged.id
        ? {
          ...assembly,
          realJoinPropertyMatches: (hinged.realJoinPropertyMatches ?? []).map((rule) => ({ ...rule, id: `${assembly.id}-real-${rule.property}`, withAssemblyIds: [...rule.withAssemblyIds] })),
          fakeJoinPropertyMatches: (hinged.fakeJoinPropertyMatches ?? []).map((rule) => ({ ...rule, id: `${assembly.id}-fake-${rule.property}`, withAssemblyIds: [...rule.withAssemblyIds] })),
          joinPropertyMatchSource: hinged.id,
        }
        : assembly);
    });
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const hingedFyn = items.find((assembly) => assembly.id === "hinged-window-soleal-fyn");
      if (!hingedFyn || !hingedFyn.parts.length) return items;
      return items.map((assembly) => [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id) || /^2 rail(?: sliding window)? - soleal - gyn$/i.test(assembly.name)
        ? { ...assembly, name: "2 Rail System - Soleal - GYn" }
        : assembly.id === "hinged-window-soleal-fyn"
        ? { ...assembly, name: "Hinged System - Soleal - FYn" }
        : ["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && assembly.templateSource !== "hinged-fyn"
        ? {
          ...assembly,
          parts: hingedFyn.parts.map((part) => ({ ...part })),
          frameTypes: (hingedFyn.frameTypes ?? []).map((frameType) => ({ ...frameType })),
          templateSource: "hinged-fyn",
        }
        : assembly);
    });
  }, [hydrated]);
  useEffect(() => {
    const exitJoinModeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setJoinModeItemId(null);
        setInteraction(null);
        setCanvasPreviewItems(null);
        setJoinStretchMeasurement(null);
        joinResizeCommitRef.current = false;
        setJoinFeedback("");
      }
    };
    window.addEventListener("keydown", exitJoinModeWithEscape);
    return () => window.removeEventListener("keydown", exitJoinModeWithEscape);
  }, []);
  const currentWorkspaceSnapshot = (): WorkspaceSnapshotV1 => ({ materials, assemblies, projects, executionProjects, componentDatabases, weightRates, markupRates, manpowerCurrency, manpowerCosts, shippingTypes, shippingCosts, fynAssemblyMaterialTemplateVersion, companyDatabases, companyPriceTables, movedOriginalPriceTableIds });
  useEffect(() => {
    if (!hydrated) return;
    const version = ++workspaceSaveVersion.current;
    const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
    setWorkspaceSaveStatus("saving");
    const saveTimer = window.setTimeout(() => {
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => workspaceGateway.saveSnapshot(snapshot))
        .then(() => {
          if (version !== workspaceSaveVersion.current) return;
          setWorkspaceSaveStatus("saved");
          // Fire-and-forget: a failure here shouldn't flip the save status to
          // "error" — the save itself already succeeded (matches pre-refactor
          // behavior, unlike the combined chain the Ctrl+S handler uses).
          workspaceGateway.fetchRecentSaves()
            .then(setRecentWorkspaceSaves)
            .catch((error) => console.error("Could not load recent workspace saves.", error));
        })
        .catch((error) => {
          console.error("Could not save the workspace.", error);
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("error");
        });
    }, 600);
    return () => window.clearTimeout(saveTimer);
  }, [materials, assemblies, projects, executionProjects, componentDatabases, weightRates, markupRates, manpowerCurrency, manpowerCosts, shippingTypes, shippingCosts, fynAssemblyMaterialTemplateVersion, companyDatabases, companyPriceTables, movedOriginalPriceTableIds, hydrated]);
  useEffect(() => {
    const refreshWithKeyboard = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "r") return;
      event.preventDefault();
      if (workspaceRefreshInProgress.current) return;
      workspaceRefreshInProgress.current = true;
      if (!hydrated) {
        window.location.reload();
        return;
      }
      const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
      workspaceSaveVersion.current += 1;
      setWorkspaceSaveStatus("saving");
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => persistWorkspaceSnapshot(snapshot, { refreshRecentSaves: false }).then(() => undefined))
        .catch((error) => console.error("Could not save the workspace before refreshing.", error))
        .finally(() => window.location.reload());
    };
    window.addEventListener("keydown", refreshWithKeyboard);
    return () => window.removeEventListener("keydown", refreshWithKeyboard);
  }, [materials, assemblies, projects, executionProjects, componentDatabases, weightRates, markupRates, manpowerCurrency, manpowerCosts, shippingTypes, shippingCosts, fynAssemblyMaterialTemplateVersion, companyDatabases, companyPriceTables, movedOriginalPriceTableIds, hydrated]);
  useEffect(() => {
    const saveCanvasWithKeyboard = (event: KeyboardEvent) => {
      if (screen !== "canvas" || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (!hydrated) return;
      const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
      const version = ++workspaceSaveVersion.current;
      setWorkspaceSaveStatus("saving");
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => persistWorkspaceSnapshot(snapshot))
        .then((recentSaves) => {
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("saved");
          if (recentSaves) setRecentWorkspaceSaves(recentSaves);
        })
        .catch((error) => {
          console.error("Could not save the workspace.", error);
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("error");
        });
    };
    window.addEventListener("keydown", saveCanvasWithKeyboard);
    return () => window.removeEventListener("keydown", saveCanvasWithKeyboard);
  }, [screen, materials, assemblies, projects, executionProjects, componentDatabases, weightRates, markupRates, manpowerCurrency, manpowerCosts, shippingTypes, shippingCosts, fynAssemblyMaterialTemplateVersion, companyDatabases, companyPriceTables, movedOriginalPriceTableIds, hydrated]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter((x) => (activeDatabaseId === "prices" || x.databaseId === activeDatabaseId) && `${x.name} ${x.code}`.toLowerCase().includes(q));
  }, [search, materials, activeDatabaseId]);
  // Material addressing/reference-numbering scheme relocated to
  // modules/catalog/domain/materialReference.ts (Phase 6 extraction).
  const solealAccessoryMaterials = () => solealAccessoryMaterialsPure(materials);
  const solealProfileMaterials = (databaseId: string) => solealProfileMaterialsPure(databaseId, materials);
  const materialFromAssemblyCode = (value: string) => materialFromAssemblyCodePure(value, materials, companyPriceTables);
  const materialDatabaseReference = (material: Material) => materialDatabaseReferencePure(material, materials, companyPriceTables);
  const defaultAssemblyCode = (materialId: string) => defaultAssemblyCodePure(materialId, materials, companyPriceTables);
  const isGlassTable = activeDatabaseId === "glass";
  const tableStyle = {
    "--table-font-size": `${(isGlassTable ? 16 : 10) * (tableZoom / 100)}px`,
    "--table-header-size": `${8 * (tableZoom / 100)}px`,
    "--table-row-height": `${(isGlassTable ? 205 : 50) * (tableZoom / 100)}px`,
    "--table-padding-y": `${7 * (tableZoom / 100)}px`,
    "--table-padding-x": `${10 * (tableZoom / 100)}px`,
    "--table-thumbnail": `${(isGlassTable ? 180 : 32) * (tableZoom / 100)}px`,
    "--table-thumbnail-gap": `${(isGlassTable ? 16 : 8) * (tableZoom / 100)}px`,
    "--table-action-size": `${26 * (tableZoom / 100)}px`,
    "--table-secondary-size": `${(isGlassTable ? 14 : 8) * (tableZoom / 100)}px`,
    "--table-price-input-width": `${62 * (tableZoom / 100)}px`,
  } as CSSProperties;
  const zoomTable = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setTableZoom((current) => Math.max(65, Math.min(140, current + (event.deltaY < 0 ? 5 : -5))));
  };
  const openModal = (
    type: "material" | "assembly" | "project" | "executionProject",
    id?: string,
    newMaterialPriceTable?: Material["priceTable"],
  ) => {
    assemblyAutoSaveReady.current = false;
    setAssemblyAutoSaveStatus("saved");
    setCopyFromAssemblyOpen(false);
    const record =
      type === "material"
        ? materials.find((x) => x.id === id)
        : type === "assembly"
          ? assemblies.find((x) => x.id === id)
          : type === "project"
            ? projects.find((x) => x.id === id)
            : executionProjects.find((x) => x.id === id);
    const material =
      record && "priceMethod" in record ? (record as Material) : undefined;
    const assembly =
      record && "rules" in record ? (record as Assembly) : undefined;
    setFormName(record?.name ?? ((type === "project" || type === "executionProject") ? "Project 1" : ""));
    setFormCode(
      "code" in (record ?? {}) ? (record as Material | Assembly).code : "",
    );
    setMaterialCodeError("");
    setFormCategory(
      "category" in (record ?? {})
        ? (record as Material | Assembly).category
        : type === "assembly"
          ? standardAssemblyCategory(activeDatabaseId) ?? "Assembly"
          : "",
    );
    setFormManufacturer(record && "manufacturer" in record ? record.manufacturer ?? "" : type === "assembly" ? (activeAssemblySystem === "technal" ? "Technal" : "Sidem") : "");
    setAssemblyColor(assembly?.color ?? assemblyDefaultColor(assembly?.id));
    setAssemblyCanvasDefaults({ ...defaultAssemblyCanvasDefaults, ...assembly?.canvasDefaults });
    setRules(assembly?.rules ?? []);
    setFormClient(record && "client" in record ? record.client : (type === "project" || type === "executionProject") ? "Client" : "");
    setFormCompany(record && "company" in record ? record.company ?? "" : (type === "project" || type === "executionProject") ? "Company" : "");
    setFormLocation(record && "location" in record ? record.location ?? "" : (type === "project" || type === "executionProject") ? "Lebanon" : "");
    const editableParts = record && "parts" in record
      ? record.parts.map((part) => ({ id: part.id ?? makeId(), part }))
      : [];
    setPartIds(editableParts.map(({ id }) => id));
    setPartMaterialIds(Object.fromEntries(editableParts.map(({ id, part }) => [id, part.materialId])));
    setPartQuantities(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.quantity]))
        : {},
    );
    setPartFormulas(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.quantityFormula ?? ""]))
        : {},
    );
    setPartFourPanelFormulas(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.quantityFormulaOtherwise ?? part.quantityFormulaFourPanels ?? "0"]))
        : {},
    );
    setPartConditions(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.conditionFormula ?? ""]))
        : {},
    );
    setPartLabels(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.label ?? defaultAssemblyCode(part.materialId)]))
        : {},
    );
    setJoinModifications(record && "joinModifications" in record ? record.joinModifications ?? [] : []);
    setFrameTypes(assembly?.frameTypes ?? []);
    setNameRules(assembly?.nameRules ?? []);
    const joinPropertyNames = new Set<string>(joinMatchPropertiesForAssembly(assembly?.assemblyPage ?? activeDatabaseId, assembly?.id).map((property) => property.value));
    setRealJoinPropertyMatches((assembly?.realJoinPropertyMatches ?? []).filter((rule) => joinPropertyNames.has(rule.property)));
    setFakeJoinPropertyMatches((assembly?.fakeJoinPropertyMatches ?? []).filter((rule) => joinPropertyNames.has(rule.property)));
    setNewPartCode("");
    setMaterialSketch(record && "sketch" in record ? record.sketch : "");
    setAssemblyReferenceImage(assembly?.referenceImage ?? "");
    setUnit(material?.unit ?? "piece");
    setPriceMethod(material?.priceMethod ?? "Per piece");
    setMaterialPriceTable(material?.priceTable ?? newMaterialPriceTable ?? "general");
    setCost(String(material?.cost ?? 0));
    setOptions(material?.options?.join(", ") ?? "");
    setGlassDescription(material?.description ?? "");
    setGlassThickness(inferGlassThickness(material));
    setModal({ type, id });
  };
  const closeModal = () => { assemblyAutoSaveReady.current = false; setModal(null); setMaterialDatabaseOverride(null); setCompanyMaterialTableId(null); };
  const copyAssemblyContentFrom = (sourceId: string) => {
    const source = assemblies.find((assembly) => assembly.id === sourceId);
    if (!source) return;
    if (partIds.length || frameTypes.length || joinModifications.length) {
      if (!confirm(`Replace this assembly's materials, formulas, conditions, Frame types, and join formulas with those from ${source.name}?`)) return;
    }
    const copiedParts = source.parts.map((part) => ({ id: makeId(), part }));
    setPartIds(copiedParts.map((entry) => entry.id));
    setPartMaterialIds(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.materialId])));
    setPartQuantities(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.quantity])));
    setPartFormulas(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.quantityFormula ?? ""])));
    setPartFourPanelFormulas(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.quantityFormulaOtherwise ?? part.quantityFormulaFourPanels ?? "0"])));
    setPartConditions(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.conditionFormula ?? ""])));
    setPartLabels(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.label ?? defaultAssemblyCode(part.materialId)])));
    setFrameTypes((source.frameTypes ?? []).map((frameType) => ({ ...frameType, id: makeId() })));
    setNameRules((source.nameRules ?? []).map((rule) => ({ ...rule, id: makeId() })));
    setRealJoinPropertyMatches((source.realJoinPropertyMatches ?? []).filter((rule) => rule.property !== "quantity").map((rule) => ({ ...rule, id: makeId(), withAssemblyIds: [...rule.withAssemblyIds] })));
    setFakeJoinPropertyMatches((source.fakeJoinPropertyMatches ?? []).filter((rule) => rule.property !== "quantity").map((rule) => ({ ...rule, id: makeId(), withAssemblyIds: [...rule.withAssemblyIds] })));
    setJoinModifications((source.joinModifications ?? []).map((modification) => ({ ...modification })));
    setRules(source.rules.map((rule) => ({ ...rule, id: makeId() })));
    setCopyFromAssemblyOpen(false);
  };
  const addAssemblyPartByCode = (insertAfterId?: string, code = newPartCode, blank = false) => {
    const material = materialFromAssemblyCode(code);
    if (!material) return;
    const partId = makeId();
    setPartIds((ids) => {
      if (!insertAfterId) return [...ids, partId];
      const index = ids.indexOf(insertAfterId);
      return index < 0 ? [...ids, partId] : [...ids.slice(0, index + 1), partId, ...ids.slice(index + 1)];
    });
    setPartMaterialIds((values) => ({ ...values, [partId]: material.id }));
    setPartQuantities((values) => ({ ...values, [partId]: 1 }));
    setPartFormulas((values) => ({ ...values, [partId]: blank ? "" : material.quantityFormula || "1" }));
    setPartFourPanelFormulas((values) => ({ ...values, [partId]: blank ? "" : "0" }));
    setPartConditions((values) => ({ ...values, [partId]: "" }));
    setPartLabels((labels) => ({ ...labels, [partId]: code }));
    setNewPartCode("");
  };
  const moveAssemblyPartAfter = (movingId: string, targetId: string) => {
    if (movingId === targetId) return;
    setPartIds((ids) => {
      const withoutMoving = ids.filter((id) => id !== movingId);
      const targetIndex = withoutMoving.indexOf(targetId);
      return targetIndex < 0 ? ids : [...withoutMoving.slice(0, targetIndex + 1), movingId, ...withoutMoving.slice(targetIndex + 1)];
    });
    setMoveMaterialId(null);
  };
  const setMaterialPhoto = (file: File, confirmReplacement = false) => {
    if (confirmReplacement && materialSketch.startsWith("data:image/") && !window.confirm("A photo already exists. Do you want to replace it?")) return;
    const reader = new FileReader();
    reader.onload = () => setMaterialSketch(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };
  const pasteMaterialPhoto = (event: ClipboardEvent<HTMLElement>) => {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();
    if (!file) return;
    event.preventDefault();
    setMaterialPhoto(file, true);
  };
  const save = (event?: FormEvent, closeAfterSave = true) => {
    event?.preventDefault();
    if (!modal || !formName.trim()) return;
    if (modal.type === "material") {
      const existingMaterial = modal.id ? materials.find((value) => value.id === modal.id) : undefined;
      const targetDatabaseId = existingMaterial?.databaseId ?? materialDatabaseOverride ?? activeDatabaseId;
      const targetManufacturer = existingMaterial?.manufacturer ?? companyDatabases.find((database) => database.id === targetDatabaseId)?.name ?? (targetDatabaseId === "sidem" ? "Sidem" : targetDatabaseId === "markups" ? "General" : "Technal");
      const isGlass = targetDatabaseId === "glass";
      const code = formCode.trim();
      if (!isGlass && !code) {
        setMaterialCodeError("Material code is required. Use the supplier or item reference, for example GY3808 or A-55.");
        return;
      }
      const duplicate = !isGlass && materials.find((material) => material.id !== modal.id && material.code.trim().toLocaleUpperCase() === code.toLocaleUpperCase());
      if (duplicate) {
        setMaterialCodeError(`Code ${code} already belongs to “${duplicate.name}”. Material codes must be unique across Soleal and every company database.`);
        return;
      }
      const item: Material = {
        id: modal.id ?? makeId(),
        name: formName,
        code: code || glassReference(materials.filter((material) => material.databaseId === "glass" && material.id !== modal.id).length),
        supplierCode: existingMaterial?.supplierCode ?? "",
        category: isGlass ? "Glass" : formCategory || "Other",
        unit: isGlass ? "m²" : unit,
        weight: existingMaterial?.weight ?? 0,
        rateMethod: existingMaterial?.rateMethod ?? "manual",
        manualRate: existingMaterial?.manualRate,
        weightRateTableId: existingMaterial?.weightRateTableId,
        priceMethod: isGlass ? "Per m²" : priceMethod,
        cost: Number(cost) || 0,
        shippingPercentage: existingMaterial?.shippingPercentage ?? 0,
        shippingTypeId: existingMaterial?.shippingTypeId,
        options: isGlass
          ? options.split(",").map((x) => x.trim()).filter(Boolean)
          : existingMaterial?.options ?? [],
        thickness: isGlass ? glassThickness.trim() || undefined : existingMaterial?.thickness,
        description: isGlass ? glassDescription.trim() || undefined : existingMaterial?.description,
        properties: existingMaterial?.properties ?? [],
        sketch: materialSketch || "M18 18H82V82H18Z",
        manufacturer: targetManufacturer,
        databaseId: targetDatabaseId,
        companyTableId: existingMaterial?.companyTableId ?? companyMaterialTableId ?? undefined,
        priceTable: targetDatabaseId === "glass" ? undefined : existingMaterial?.priceTable ?? materialPriceTable,
        // Existing formulas are retained for compatibility, but quantities are now defined by the canvas and assemblies.
        quantityFormula: existingMaterial?.quantityFormula ?? "1",
      };
      if (screen === "database" && activeDatabaseId === "prices") recordPriceChange();
      setMaterials((items) => {
        if (modal.id) return items.map((x) => (x.id === modal.id ? item : x));
        const insertIndex = priceInsertAfterMaterialId ? items.findIndex((value) => value.id === priceInsertAfterMaterialId) : -1;
        return insertIndex < 0 ? [item, ...items] : [...items.slice(0, insertIndex + 1), item, ...items.slice(insertIndex + 1)];
      });
      setPriceInsertAfterMaterialId(null);
    }
    if (modal.type === "assembly") {
      const existingAssembly = modal.id ? assemblies.find((value) => value.id === modal.id) : undefined;
      const isTechnalTwoSlider = modal.id === TECHNAL_ASSEMBLY_ID || formCode === technalAssembly.code;
      const assemblyPage = existingAssembly?.assemblyPage ?? (activeDatabaseId === TWO_RAIL_WINDOW_PAGE ? TWO_RAIL_WINDOW_PAGE : activeDatabaseId === FLY_SCREEN_PAGE ? FLY_SCREEN_PAGE : activeDatabaseId === HINGE_WINDOW_PAGE ? HINGE_WINDOW_PAGE : activeDatabaseId === FIXED_WINDOW_PAGE ? FIXED_WINDOW_PAGE : activeDatabaseId === TILT_AND_TURN_PAGE ? TILT_AND_TURN_PAGE : undefined);
      const item: Assembly = {
        id: modal.id ?? makeId(),
        name: formName,
        code: formCode || "Not assigned",
        category: (standardAssemblyCategory(assemblyPage) ?? formCategory) || "Assembly",
        properties: (existingAssembly?.id === "fly-screen-2rail" ? ASSEMBLY_FORMULA_VALUES.slice(0, 4) : ASSEMBLY_FORMULA_VALUES)
          .filter((value) => (existingAssembly?.id ?? modal.id) !== "tilt-and-turn-soleal-fyn" || (value.name !== "NumberOfLeaves" && value.name !== "FlyScreen" && value.name !== "OpeningType"))
          .map((value) => value.name),
        parts: partIds.map((partId) => ({
          id: partId,
          materialId: partMaterialIds[partId],
          quantity: partQuantities[partId] ?? 1,
          quantityFormula: partFormulas[partId]?.trim() || undefined,
          quantityFormulaOtherwise: partFourPanelFormulas[partId]?.trim() || "0",
          conditionFormula: partConditions[partId]?.trim() || undefined,
          label: partLabels[partId]?.trim() || undefined,
        })),
        rules,
        sketch: isTechnalTwoSlider ? TWO_SLIDER_DOOR_SKETCH : materialSketch || "M15 15H85V85H15ZM50 15V85",
        referenceImage: assemblyReferenceImage || undefined,
        manufacturer: formManufacturer.trim() || undefined,
        databaseId: existingAssembly?.databaseId ?? (activeAssemblySystem === "technal" ? activeDatabaseId : "sidem"),
        templateSource: existingAssembly?.templateSource,
        joinModifications: usesDirectJoinValues(existingAssembly)
          ? []
          : (existingAssembly?.databaseId ?? (activeAssemblySystem === "technal" ? activeDatabaseId : "sidem")) === TECHNAL_FYN_DATABASE
          ? completeFynJoinModifications(joinModifications)
          : existingAssembly?.joinModifications ?? [],
        frameTypes: frameTypes.filter((row) => row.type.trim() || row.condition.trim()),
        nameRules: nameRules.filter((row) => row.name.trim()),
        realJoinPropertyMatches: realJoinPropertyMatches.filter((row) => joinMatchPropertyKeys.has(row.property) && row.withAssemblyIds.length),
        fakeJoinPropertyMatches: fakeJoinPropertyMatches.filter((row) => joinMatchPropertyKeys.has(row.property) && row.withAssemblyIds.length),
        color: assemblyColor,
        canvasDefaults: assemblyCanvasDefaults,
        assemblyPage,
      };
      setAssemblies((items) =>
        modal.id
          ? items.map((x) => (x.id === modal.id ? item : x))
          : [item, ...items],
      );
    }
    if (modal.type === "project") {
      const item: Project = modal.id
        ? {
          ...(projects.find((x) => x.id === modal.id) as Project),
          name: formName,
          client: formClient,
          company: formCompany.trim() || undefined,
          location: formLocation,
        }
        : {
          id: makeId(),
          name: formName,
          client: formClient,
          company: formCompany.trim() || undefined,
          location: formLocation,
          year: activeProjectYear,
          items: [],
          canvases: [{ id: "opening-1", name: "Opening 1", items: [] }],
        };
      setProjects((items) =>
        modal.id
          ? items.map((x) => (x.id === modal.id ? item : x))
          : [item, ...items],
      );
      if (!modal.id) {
        setSelectedProjectId(item.id);
        setSelectedCanvasId("opening-1");
        setScreen("canvas");
      }
    }
    if (modal.type === "executionProject") {
      const item: ExecutionProject = {
        id: makeId(),
        name: formName.trim(),
        client: formClient.trim(),
        company: formCompany.trim() || undefined,
        location: formLocation.trim(),
        createdAt: new Date().toISOString(),
        files: [],
      };
      setExecutionProjects((items) => [item, ...items]);
    }
    if (closeAfterSave) closeModal();
  };
  const assemblyAutoSaveKey = modal?.type === "assembly" && modal.id
    ? JSON.stringify({ formName, formCode, formCategory, formManufacturer, assemblyColor, assemblyCanvasDefaults, partIds, partMaterialIds, partQuantities, partFormulas, partFourPanelFormulas, partConditions, partLabels, rules, joinModifications, frameTypes, nameRules, realJoinPropertyMatches, fakeJoinPropertyMatches, materialSketch, assemblyReferenceImage })
    : "";
  useEffect(() => {
    if (modal?.type !== "assembly" || !modal.id) return;
    if (!assemblyAutoSaveReady.current) {
      assemblyAutoSaveReady.current = true;
      return;
    }
    if (!formName.trim()) return;
    setAssemblyAutoSaveStatus("saving");
    const timer = window.setTimeout(() => {
      save(undefined, false);
      setAssemblyAutoSaveStatus("saved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [assemblyAutoSaveKey, modal?.id, modal?.type]);
  const remove = (type: "material" | "assembly" | "project" | "executionProject", id: string) => {
    const requiredPermission =
      type === "material"
        ? WORKSPACE_PERMISSIONS.DELETE_MATERIAL
        : type === "assembly"
          ? WORKSPACE_PERMISSIONS.DELETE_ASSEMBLY
          : type === "project"
            ? WORKSPACE_PERMISSIONS.DELETE_PROJECT
            : WORKSPACE_PERMISSIONS.DELETE_EXECUTION_PROJECT;
    if (!hasPermission(permissions, requiredPermission)) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    if (type === "material") setMaterials((x) => x.filter((v) => v.id !== id));
    if (type === "assembly") setAssemblies((x) => x.filter((v) => v.id !== id));
    if (type === "project") {
      const next = projects.filter((v) => v.id !== id);
      setProjects(next);
      setSelectedProjectId(next[0]?.id ?? "");
      if (!next.length) setScreen("projects");
    }
    if (type === "executionProject") setExecutionProjects((items) => items.filter((item) => item.id !== id));
  };
  const copyExecutionProject = (id: string) => {
    setExecutionProjects((items) => {
      const source = items.find((item) => item.id === id);
      if (!source) return items;
      const idMap = new Map((source.files ?? []).map((file) => [file.id, makeId()]));
      const files = (source.files ?? []).map((file) => ({ ...file, id: idMap.get(file.id)!, parentId: file.parentId ? idMap.get(file.parentId) ?? null : null }));
      return [{ ...source, id: makeId(), name: `${source.name} copy`, createdAt: new Date().toISOString(), files }, ...items];
    });
  };
  const removeExecutionProject = (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setExecutionProjects((items) => items.filter((item) => item.id !== id));
  };
  const openExecutionProject = (id: string) => {
    setSelectedExecutionProjectId(id);
    setExecutionFolderId(null);
    setScreen("execution-project-detail");
  };
  const openExecutionWorkspace = (fileId: string) => {
    setSelectedExecutionWorkspaceId(fileId);
    setExecutionWorkspacePage("cutting-list");
    setWorkspaceStockDatabaseId("prices");
    setWorkspaceStockSearch("");
    setWorkspaceStockAssemblyType("");
    setWorkspaceOptimizationError("");
    setScreen("execution-workspace");
  };
  const createExecutionProjectItem = (event: FormEvent) => {
    event.preventDefault();
    const name = newExecutionItemName.trim();
    if (!name || !newExecutionItemType || !selectedExecutionProjectId) return;
    const createdAt = new Date().toISOString();
    const item: ExecutionProjectFile = {
      id: makeId(),
      name,
      type: newExecutionItemType,
      parentId: executionFolderId,
      createdAt,
      stockSnapshot: newExecutionItemType === "optimization-material-order"
        ? {
          materials: JSON.parse(JSON.stringify(materials)) as Material[],
          assemblies: JSON.parse(JSON.stringify(assemblies)),
          componentDatabases: JSON.parse(JSON.stringify(componentDatabases)),
          companyDatabases: JSON.parse(JSON.stringify(companyDatabases)),
          companyPriceTables: JSON.parse(JSON.stringify(companyPriceTables)),
          movedOriginalPriceTableIds: JSON.parse(JSON.stringify(movedOriginalPriceTableIds)),
          capturedAt: createdAt,
        }
        : undefined,
      optimization: newExecutionItemType === "optimization-material-order"
        ? { stockLength: 6000, kerf: 3, trim: 10, arrangements: 1000, cuts: [], recommendationMinimum: 4000, recommendationMaximum: 8000, recommendationIncrement: 100 }
        : undefined,
    };
    setExecutionProjects((projects) => projects.map((project) => project.id === selectedExecutionProjectId ? { ...project, files: [...(project.files ?? []), item] } : project));
    setNewExecutionItemType(null);
    setNewExecutionItemName("");
  };
  const removeExecutionProjectItem = (id: string) => {
    if (!confirm("Delete this item? Folders and everything inside them will be deleted.")) return;
    setExecutionProjects((projects) => projects.map((project) => {
      if (project.id !== selectedExecutionProjectId) return project;
      const deletedIds = new Set([id]);
      let foundChild = true;
      while (foundChild) {
        foundChild = false;
        (project.files ?? []).forEach((item) => {
          if (item.parentId && deletedIds.has(item.parentId) && !deletedIds.has(item.id)) {
            deletedIds.add(item.id);
            foundChild = true;
          }
        });
      }
      return { ...project, files: (project.files ?? []).filter((item) => !deletedIds.has(item.id)) };
    }));
  };
  const cloneProject = (value: Project) => JSON.parse(JSON.stringify(value)) as Project;
  const updateProject = (change: (value: Project) => Project) => {
    if (!project) return;
    setUndoProjectHistory((history) => [...history, cloneProject(project)].slice(-100));
    setRedoProjectHistory([]);
    setProjects((items) =>
      items.map((p) => {
        if (p.id !== project.id) return p;
        const changed = change(p);
        return { ...changed, items: normalizeCombinationReferences(synchronizeCombinationDetails(recheckCombinationJoins(changed.items))) };
      }),
    );
  };
  const undoCanvasChange = () => {
    const previous = undoProjectHistory[undoProjectHistory.length - 1];
    if (!previous || !project) return;
    setRedoProjectHistory((history) => [...history, cloneProject(project)].slice(-100));
    setUndoProjectHistory((history) => history.slice(0, -1));
    setProjects((items) => items.map((item) => item.id === project.id ? cloneProject(previous) : item));
    setSelectedItemId(null);
  };
  const redoCanvasChange = () => {
    const next = redoProjectHistory[redoProjectHistory.length - 1];
    if (!next || !project) return;
    setUndoProjectHistory((history) => [...history, cloneProject(project)].slice(-100));
    setRedoProjectHistory((history) => history.slice(0, -1));
    setProjects((items) => items.map((item) => item.id === project.id ? cloneProject(next) : item));
    setSelectedItemId(null);
  };
  const assemblyForCanvasItem = (item: CanvasItem) => {
    const directAssembly = assemblies.find((value) => value.id === item.sourceId);
    const pageAssemblies = assemblies.filter((value) => value.assemblyPage === item.assemblyPage);
    const candidates = [directAssembly, ...pageAssemblies, assemblies.find((value) => value.id === TECHNAL_ASSEMBLY_ID), assemblies.find((value) => value.id === "soleal-gyn-2rail")]
      .filter((value, index, values): value is Assembly => Boolean(value) && values.findIndex((candidate) => candidate?.id === value?.id) === index);
    return candidates.find((value) => value.nameRules?.some((rule) => rule.name.trim())) ?? directAssembly ?? candidates[0];
  };
  const nameRuleForCanvasItem = (item: CanvasItem) => {
    const assembly = assemblyForCanvasItem(item);
    return assembly?.nameRules?.find((value) => value.name.trim() && (!value.condition.trim() || conditionMatches(value.condition, item.inputWidth ?? 1500, item.inputHeight ?? 1200, formulaValuesForItem(item))));
  };
  const assignedCanvasItemName = (item: CanvasItem, currentProject: Project) => {
    const rule = nameRuleForCanvasItem(item);
    const symbol = rule?.name.trim().toUpperCase();
    if (!symbol) return item.name;
    const allItems = [...currentProject.items, ...(currentProject.canvases ?? []).flatMap((canvas) => canvas.items)].filter((value, index, values) => values.findIndex((candidate) => candidate.id === value.id) === index && value.id !== item.id);
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Treat older references such as W01 as reserved too, while generating the new W-01 format.
    const usedNumbers = new Set(allItems.flatMap((value) => {
      const match = value.name.trim().match(new RegExp(`^${escapedSymbol}-?(\\d+)$`, "i"));
      return match ? [Number(match[1])] : [];
    }).filter((number) => Number.isSafeInteger(number) && number > 0));
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) nextNumber += 1;
    return `${symbol}-${String(nextNumber).padStart(2, "0")}`;
  };
  const renameCanvasItem = (itemId: string, requestedName: string) => {
    if (!project) return;
    const name = requestedName.trim().toUpperCase();
    if (!name) {
      setOpeningNameError("Enter an opening reference.");
      return;
    }
    const allItems = [...project.items, ...(project.canvases ?? []).flatMap((canvas) => canvas.items)]
      .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index && item.id !== itemId);
    if (allItems.some((item) => item.name.trim().toUpperCase() === name)) {
      setOpeningNameError(`${name} is already used in this project.`);
      return;
    }
    setOpeningNameError("");
    updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === itemId ? { ...item, name } : item) }));
  };
  const renameCombination = (itemId: string, requestedName: string) => {
    const name = requestedName.trim();
    if (!name) {
      setOpeningNameError("Enter a combination name.");
      return;
    }
    updateProject((current) => {
      const group = allJoinedWindowGroup(current.items, itemId);
      return { ...current, items: current.items.map((item) => group.has(item.id) ? { ...item, combinationName: name } : item) };
    });
    setOpeningNameError("");
  };
  const updateCombinationQuantity = (itemId: string, requestedQuantity: number) => {
    updateProject((current) => {
      const group = allJoinedWindowGroup(current.items, itemId);
      const quantity = Math.max(1, Math.round(requestedQuantity || 1));
      return { ...current, items: current.items.map((item) => group.has(item.id) ? { ...item, quantity } : item) };
    });
  };
  const updateCombinationGlazedSettings = (itemId: string, settings: Partial<Pick<CanvasItem, "hasArchitrave" | "hasArchitraveAllowance">>) => {
    updateProject((current) => {
      const selected = current.items.find((item) => item.id === itemId);
      const property = Object.keys(settings)[0];
      const directNeighbours = selected ? current.items.filter((item) => item.id !== selected.id && ((selected.joinedWindowIds ?? []).includes(item.id) || (item.joinedWindowIds ?? []).includes(selected.id))) : [];
      const selectedRules = assemblies.find((assembly) => assembly.id === selected?.sourceId)?.fakeJoinPropertyMatches ?? [];
      const matchingNeighbourIds = new Set(directNeighbours.filter((neighbour) => {
        const selectedMatchesNeighbour = selectedRules.some((rule) => rule.property === property && rule.withAssemblyIds.includes(neighbour.sourceId));
        const neighbourRules = assemblies.find((assembly) => assembly.id === neighbour.sourceId)?.fakeJoinPropertyMatches ?? [];
        return selectedMatchesNeighbour || neighbourRules.some((rule) => rule.property === property && rule.withAssemblyIds.includes(selected?.sourceId ?? ""));
      }).map((item) => item.id));
      return {
        ...current,
        items: current.items.map((item) => item.id === itemId || matchingNeighbourIds.has(item.id) ? { ...item, ...settings } : item),
      };
    });
  };
  const updateRealJoinSettings = (itemId: string, settings: Partial<Pick<CanvasItem, "leaves" | "openingType" | "leafSize" | "frameSize" | "hasArchitrave" | "hasArchitraveAllowance" | "reinforced" | "hasCoating">>) => {
    updateProject((current) => {
      const selected = current.items.find((item) => item.id === itemId);
      const property = Object.keys(settings)[0];
      const directNeighbours = selected ? current.items.filter((item) => item.id !== selected.id && ((selected.realJoinedWindowIds ?? []).includes(item.id) || (item.realJoinedWindowIds ?? []).includes(selected.id))) : [];
      const selectedRules = assemblies.find((assembly) => assembly.id === selected?.sourceId)?.realJoinPropertyMatches ?? [];
      const matchingNeighbourIds = new Set(directNeighbours.filter((neighbour) => {
        const selectedMatchesNeighbour = selectedRules.some((rule) => rule.property === property && rule.withAssemblyIds.includes(neighbour.sourceId));
        const neighbourRules = assemblies.find((assembly) => assembly.id === neighbour.sourceId)?.realJoinPropertyMatches ?? [];
        const neighbourMatchesSelected = neighbourRules.some((rule) => rule.property === property && rule.withAssemblyIds.includes(selected?.sourceId ?? ""));
        return selectedMatchesNeighbour || neighbourMatchesSelected;
      }).map((item) => item.id));
      return { ...current, items: current.items.map((item) => item.id === itemId || matchingNeighbourIds.has(item.id) ? { ...item, ...settings } : item) };
    });
  };
  const nextCanvasReference = (currentProject: Project, excludeItemId?: string) => {
    const allItems = [...currentProject.items, ...(currentProject.canvases ?? []).flatMap((canvas) => canvas.items)]
      .filter((item, index, items) => item.id !== excludeItemId && items.findIndex((candidate) => candidate.id === item.id) === index);
    const usedReferences = new Set(allItems.map((item) => item.reference).filter((reference): reference is number => typeof reference === "number" && Number.isSafeInteger(reference) && reference > 0));
    let nextReference = 1;
    while (usedReferences.has(nextReference)) nextReference += 1;
    return nextReference;
  };
  const moveCanvasReference = (itemId: string, requestedReference: number) => {
    if (!project) return;
    const allItems = [...project.items, ...(project.canvases ?? []).flatMap((canvas) => canvas.items)]
      .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
    const currentReference = allItems.find((item) => item.id === itemId)?.reference;
    const movingGroup = allJoinedWindowGroup(project.items, itemId);
    const move = (items: CanvasItem[]) => items.map((item) => {
      if (movingGroup.has(item.id)) return { ...item, reference: requestedReference };
      if (item.reference === undefined) return item;
      if (currentReference === undefined && item.reference >= requestedReference) return { ...item, reference: item.reference + 1 };
      if (currentReference !== undefined && requestedReference < currentReference && item.reference >= requestedReference && item.reference < currentReference) return { ...item, reference: item.reference + 1 };
      if (currentReference !== undefined && requestedReference > currentReference && item.reference > currentReference && item.reference <= requestedReference) return { ...item, reference: item.reference - 1 };
      return item;
    });
    setUndoProjectHistory((history) => [...history, cloneProject(project)].slice(-100));
    setRedoProjectHistory([]);
    setProjects((projects) => projects.map((current) => current.id === project.id
      ? { ...current, items: move(current.items), canvases: current.canvases?.map((canvas) => ({ ...canvas, items: move(canvas.items) })) }
      : current));
  };
  const updateCanvasReference = (itemId: string, requestedReference: number) => {
    if (!Number.isSafeInteger(requestedReference) || requestedReference < 1) {
      setOpeningNameError("Reference must be a whole number greater than zero.");
      return;
    }
    const movingGroup = project ? allJoinedWindowGroup(project.items, itemId) : new Set([itemId]);
    const allItems = [...(project?.items ?? []), ...(project?.canvases ?? []).flatMap((canvas) => canvas.items)]
      .filter((item, index, items) => !movingGroup.has(item.id) && items.findIndex((candidate) => candidate.id === item.id) === index);
    const targetReference = Math.min(requestedReference, allItems.length + 1);
    if (requestedReference > allItems.length + 1) {
      setOpeningNameError("");
      moveCanvasReference(itemId, targetReference);
      return;
    }
    if (allItems.some((item) => item.reference === targetReference)) {
      setReferenceConflict({ itemId, requestedReference: targetReference });
      return;
    }
    setOpeningNameError("");
    moveCanvasReference(itemId, targetReference);
  };
  const shiftReferencesForConflict = () => {
    if (!referenceConflict || !project) return;
    const { itemId, requestedReference } = referenceConflict;
    moveCanvasReference(itemId, requestedReference);
    setOpeningNameError("");
    setReferenceConflict(null);
  };
  const deleteCanvasItem = (itemId: string) => {
    if (!project) return;
    const deletedReference = project.items.find((item) => item.id === itemId)?.reference;
    const referenceStillUsed = deletedReference !== undefined && project.items.some((item) => item.id !== itemId && item.reference === deletedReference);
    const removeAndCloseGap = (items: CanvasItem[]) => items
      .filter((item) => item.id !== itemId)
      .map((item) => !referenceStillUsed && deletedReference !== undefined && item.reference !== undefined && item.reference > deletedReference ? { ...item, reference: item.reference - 1 } : item);
    setUndoProjectHistory((history) => [...history, cloneProject(project)].slice(-100));
    setRedoProjectHistory([]);
    setProjects((projects) => projects.map((current) => current.id === project.id
      ? { ...current, items: recheckCombinationJoins(removeAndCloseGap(current.items)), canvases: current.canvases?.map((canvas) => ({ ...canvas, items: removeAndCloseGap(canvas.items) })) }
      : current));
  };
  const finishCanvasItemPlacement = (itemId: string) => {
    setProjects((projects) => projects.map((value) => value.id !== selectedProjectId ? value : { ...value, items: value.items.map((item) => item.id === itemId ? { ...item, name: assignedCanvasItemName(item, value), reference: nextCanvasReference(value, item.id) } : item) }));
    setSelectedItemId(itemId);
    setCursorWindowPreview(null);
    setDrawingMode("select");
    if (joinModeItemId) {
      setJoinModeItemId(itemId);
      setInteraction(null);
      setJoinFeedback("New window selected for Join mode. Automatic 1 mm corner alignment is active.");
    }
  };
  useEffect(() => {
    setUndoProjectHistory([]);
    setRedoProjectHistory([]);
  }, [selectedProjectId]);
  const selectProjectCanvas = (canvasId: string) => {
    if (!project || canvasId === selectedCanvasId) return;
    updateProject((current) => {
      const canvases = current.canvases ?? [{ id: "opening-1", name: "Opening 1", items: current.items }];
      const nextCanvases = canvases.map((canvas) => canvas.id === selectedCanvasId ? { ...canvas, items: current.items } : canvas);
      const next = nextCanvases.find((canvas) => canvas.id === canvasId);
      return { ...current, canvases: nextCanvases, items: next?.items ?? [] };
    });
    setSelectedCanvasId(canvasId);
    setSelectedItemId(null);
  };
  const addProjectCanvas = () => {
    if (!project) return;
    const canvases = project.canvases ?? [{ id: "opening-1", name: "Opening 1", items: project.items }];
    const canvas: ProjectCanvas = { id: makeId(), name: `Opening ${canvases.length + 1}`, items: [], manpowerHours: { ...defaultManpowerHours } };
    updateProject((current) => ({ ...current, canvases: [...canvases.map((value) => value.id === selectedCanvasId ? { ...value, items: current.items } : value), canvas], items: [] }));
    setSelectedCanvasId(canvas.id);
    setSelectedItemId(null);
  };
  const setCanvasManpowerHours = (costId: string, hours: number) => {
    if (!project) return;
    updateProject((current) => {
      const canvases = current.canvases ?? [{ id: "opening-1", name: "Opening 1", items: current.items }];
      return {
        ...current,
        canvases: canvases.map((canvas) => canvas.id === selectedCanvasId
          ? { ...canvas, items: current.items, manpowerHours: { ...canvas.manpowerHours, [costId]: hours } }
          : canvas),
      };
    });
  };
  const setCanvasManpowerParameter = (parameter: "width" | "height" | "area" | "perimeter") => {
    updateProject((current) => {
      const canvases = current.canvases ?? [{ id: "opening-1", name: "Opening 1", items: current.items }];
      return { ...current, canvases: canvases.map((canvas) => canvas.id === selectedCanvasId ? { ...canvas, items: current.items, manpowerParameter: parameter } : canvas) };
    });
  };
  const setCanvasMarkupType = (markupType: "typeA" | "typeB" | "typeC") => {
    updateProject((current) => {
      const canvases = current.canvases ?? [{ id: "opening-1", name: "Opening 1", items: current.items }];
      return { ...current, canvases: canvases.map((canvas) => canvas.id === selectedCanvasId ? { ...canvas, items: current.items, markupType } : canvas) };
    });
  };
  const toggleCanvasManpowerItem = (itemId: string, selected: boolean) => {
    updateProject((current) => {
      const canvases = current.canvases ?? [{ id: "opening-1", name: "Opening 1", items: current.items }];
      return {
        ...current,
        canvases: canvases.map((canvas) => {
          if (canvas.id !== selectedCanvasId) return canvas;
          const ids = new Set(canvas.manpowerItemIds ?? []);
          if (selected) ids.add(itemId); else ids.delete(itemId);
          return { ...canvas, items: current.items, manpowerItemIds: [...ids] };
        }),
      };
    });
  };
  const renameProjectCanvas = (canvasId: string) => {
    const current = (project.canvases ?? []).find((canvas) => canvas.id === canvasId);
    const name = prompt("Canvas name", current?.name ?? "Opening");
    if (!name?.trim()) return;
    updateProject((value) => ({ ...value, canvases: (value.canvases ?? []).map((canvas) => canvas.id === canvasId ? { ...canvas, name: name.trim() } : canvas) }));
  };
  const openNewDatabase = (parent: "technal" | "sidem") => {
    setNewDatabaseName("");
    setNewDatabaseParent(parent);
  };
  const saveNewDatabase = (event: FormEvent) => {
    event.preventDefault();
    if (!newDatabaseParent || !newDatabaseName.trim()) return;
    const database: ComponentDatabase = { id: makeId(), name: newDatabaseName.trim(), parent: newDatabaseParent };
    setComponentDatabases((items) => [...items, database]);
    setActiveDatabaseId(database.id);
    setScreen("database");
    setNewDatabaseParent(null);
  };
  useEffect(() => {
    const canvasKeyboardShortcuts = (event: KeyboardEvent) => {
      if (screen !== "canvas") return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redoCanvasChange(); else undoCanvasChange();
        return;
      }
      if (modifier && key === "y") {
        event.preventDefault();
        redoCanvasChange();
        return;
      }
      if (modifier && key === "c" && selectedItemId) {
        const item = project?.items.find((value) => value.id === selectedItemId);
        if (!item) return;
        event.preventDefault();
        setCopiedCanvasItem(cloneProject({ ...project!, items: [item] }).items[0]);
        return;
      }
      if (modifier && key === "v" && copiedCanvasItem) {
        event.preventDefault();
        const item: CanvasItem = {
          ...copiedCanvasItem,
          id: makeId(),
          x: copiedCanvasItem.x + 200,
          y: copiedCanvasItem.y + 200,
          joinedWindowIds: [],
          realJoinedWindowIds: [],
        };
        updateProject((current) => ({ ...current, items: [...current.items, item] }));
        finishCanvasItemPlacement(item.id);
        return;
      }
      if (!selectedItemId || (event.key !== "Delete" && event.key !== "Backspace")) return;
      event.preventDefault();
      deleteCanvasItem(selectedItemId);
      setSelectedItemId(null);
    };
    window.addEventListener("keydown", canvasKeyboardShortcuts);
    return () => window.removeEventListener("keydown", canvasKeyboardShortcuts);
  }, [screen, selectedItemId, copiedCanvasItem, project, undoProjectHistory, redoProjectHistory, joinModeItemId]);
  const placeTwoRailWindow = (x: number, y: number) => {
    if (!project) return;
    const defaults = defaultAssemblyCanvasDefaults;
    const item: CanvasItem = { id: makeId(), sourceId: "", kind: "assembly", name: "2 rail window", sketch: TWO_SLIDER_DOOR_SKETCH, x, y, width: 170, height: 130, inputWidth: defaults.width, inputHeight: defaults.height, leaves: defaults.leaves, openingType: defaults.openingType, leafSize: defaults.leafSize, frameSize: defaults.frameSize, hasArchitrave: defaults.hasArchitrave, hasArchitraveAllowance: defaults.hasArchitraveAllowance, reinforced: defaults.reinforced, hasCoating: defaults.hasCoating, color: "#d9e8ea", assemblyPage: TWO_RAIL_WINDOW_PAGE };
    updateProject((current) => ({ ...current, items: [...current.items, item] }));
    finishCanvasItemPlacement(item.id);
  };
  const placeFlyScreen = (x: number, y: number) => {
    if (!project) return;
    const defaults = defaultAssemblyCanvasDefaults;
    const item: CanvasItem = { id: makeId(), sourceId: "", kind: "assembly", name: "Fly screen", sketch: flyScreenAssembly.sketch, x, y, width: 170, height: 130, inputWidth: defaults.width, inputHeight: defaults.height, hasCoating: defaults.hasCoating, color: "#d9e8ea", assemblyPage: FLY_SCREEN_PAGE };
    updateProject((current) => ({ ...current, items: [...current.items, item] }));
    finishCanvasItemPlacement(item.id);
  };
  const placeHingeWindow = (x: number, y: number) => {
    if (!project) return;
    const defaults = defaultAssemblyCanvasDefaults;
    const item: CanvasItem = { id: makeId(), sourceId: "", kind: "assembly", name: "Hinge window", sketch: "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82", x, y, width: 170, height: 130, inputWidth: defaults.width, inputHeight: defaults.height, leaves: defaults.leaves, openingType: defaults.openingType, leafSize: defaults.leafSize, frameSize: defaults.frameSize, hasArchitrave: defaults.hasArchitrave, hasArchitraveAllowance: defaults.hasArchitraveAllowance, reinforced: defaults.reinforced, hasCoating: defaults.hasCoating, color: "#d9e8ea", assemblyPage: HINGE_WINDOW_PAGE };
    updateProject((current) => ({ ...current, items: [...current.items, item] }));
    finishCanvasItemPlacement(item.id);
  };
  const placeFixedWindow = (x: number, y: number) => {
    if (!project) return;
    const defaults = defaultAssemblyCanvasDefaults;
    const item: CanvasItem = { id: makeId(), sourceId: "", kind: "assembly", name: "Fixed window", sketch: "M12 8H88V92H12ZM18 14H82V86H18ZM40 50H60M50 40V60", x, y, width: 170, height: 130, inputWidth: defaults.width, inputHeight: defaults.height, leaves: 1, openingType: "window", leafSize: defaults.leafSize, frameSize: defaults.frameSize, hasArchitrave: defaults.hasArchitrave, hasArchitraveAllowance: defaults.hasArchitraveAllowance, reinforced: defaults.reinforced, hasCoating: defaults.hasCoating, color: "#d9e8ea", assemblyPage: FIXED_WINDOW_PAGE };
    updateProject((current) => ({ ...current, items: [...current.items, item] }));
    finishCanvasItemPlacement(item.id);
  };
  const placeTiltAndTurn = (x: number, y: number) => {
    if (!project) return;
    const defaults = defaultAssemblyCanvasDefaults;
    const item: CanvasItem = { id: makeId(), sourceId: "", kind: "assembly", name: "Tilt and turn", sketch: tiltAndTurnAssembly.sketch, x, y, width: 170, height: 130, inputWidth: defaults.width, inputHeight: defaults.height, leaves: 1, openingType: defaults.openingType, leafSize: defaults.leafSize, frameSize: defaults.frameSize, hasArchitrave: defaults.hasArchitrave, hasArchitraveAllowance: defaults.hasArchitraveAllowance, reinforced: defaults.reinforced, hasCoating: defaults.hasCoating, color: "#d9e8ea", assemblyPage: TILT_AND_TURN_PAGE };
    updateProject((current) => ({ ...current, items: [...current.items, item] }));
    finishCanvasItemPlacement(item.id);
  };
  const changeDrawnWindowType = (itemId: string, assemblyId: string) => {
    if (!assemblyId) {
      updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === itemId ? item.assemblyPage === FLY_SCREEN_PAGE ? { ...item, sourceId: "", sketch: flyScreenAssembly.sketch, color: "#d9e8ea" } : item.assemblyPage === HINGE_WINDOW_PAGE ? { ...item, sourceId: "", sketch: "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82", color: "#d9e8ea" } : item.assemblyPage === FIXED_WINDOW_PAGE ? { ...item, sourceId: "", sketch: "M12 8H88V92H12ZM18 14H82V86H18ZM40 50H60M50 40V60", color: "#d9e8ea" } : { ...item, sourceId: "", sketch: TWO_SLIDER_DOOR_SKETCH, color: "#d9e8ea" } : item) }));
      return;
    }
    const assembly = assemblies.find((item) => item.id === assemblyId);
    if (!assembly) return;
    const defaults = { ...defaultAssemblyCanvasDefaults, ...assembly.canvasDefaults };
    updateProject((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, sourceId: assembly.id, sketch: assembly.sketch, color: assembly.color ?? assemblyDefaultColor(assembly.id), assemblyPage: assembly.assemblyPage ?? item.assemblyPage, inputWidth: defaults.width, inputHeight: defaults.height, leaves: assembly.id === "fixed-window" || assembly.id === "tilt-and-turn-soleal-fyn" ? 1 : defaults.leaves, openingType: assembly.id === "fixed-window" ? "window" as const : defaults.openingType, leafSize: defaults.leafSize, frameSize: defaults.frameSize, hasArchitrave: defaults.hasArchitrave, hasArchitraveAllowance: defaults.hasArchitraveAllowance, reinforced: defaults.reinforced, hasCoating: defaults.hasCoating };
        return updated;
      }),
    }));
  };
  const drawingPoint = (event: PointerEvent<SVGSVGElement> | WheelEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (matrix) {
      const screenPoint = event.currentTarget.createSVGPoint();
      screenPoint.x = event.clientX;
      screenPoint.y = event.clientY;
      const drawingPosition = screenPoint.matrixTransform(matrix.inverse());
      return { x: drawingPosition.x, y: drawingPosition.y };
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 9000 / drawingView.zoom;
    const height = 5600 / drawingView.zoom;
    return { x: drawingView.x + ((event.clientX - rect.left) / rect.width) * width, y: drawingView.y + ((event.clientY - rect.top) / rect.height) * height };
  };
  const snapCanvasPoint = (point: { x: number; y: number }) => ({ x: Math.round(point.x), y: Math.round(point.y) });
  const resizeRealJoinedBoundary = (items: CanvasItem[], itemId: string, side: "left" | "right" | "top" | "bottom", requestedBoundary: number) => {
    const selected = items.find((item) => item.id === itemId);
    if (!selected) return items;
    const group = allJoinedWindowGroup(items, itemId);
    const horizontal = side === "left" || side === "right";
    const oldBoundary = side === "left" ? selected.x
      : side === "right" ? selected.x + (selected.inputWidth ?? 1500)
        : side === "top" ? selected.y
          : selected.y + (selected.inputHeight ?? 1200);
    const members = items.filter((item) => group.has(item.id));
    let minimum = -MAX_OPENING_DIMENSION * 20;
    let maximum = MAX_OPENING_DIMENSION * 2;
    members.forEach((item) => {
      const start = horizontal ? item.x : item.y;
      const end = start + (horizontal ? (item.inputWidth ?? 1500) : (item.inputHeight ?? 1200));
      if (Math.abs(end - oldBoundary) <= 1) {
        minimum = Math.max(minimum, start + 200);
        maximum = Math.min(maximum, start + MAX_OPENING_DIMENSION);
      }
      if (Math.abs(start - oldBoundary) <= 1) {
        minimum = Math.max(minimum, end - MAX_OPENING_DIMENSION);
        maximum = Math.min(maximum, end - 200);
      }
    });
    const boundary = Math.round(Math.max(minimum, Math.min(maximum, requestedBoundary)));
    return items.map((item) => {
      if (!group.has(item.id)) return item;
      const start = horizontal ? item.x : item.y;
      const size = horizontal ? (item.inputWidth ?? 1500) : (item.inputHeight ?? 1200);
      const end = start + size;
      if (Math.abs(end - oldBoundary) <= 1) return horizontal
        ? { ...item, inputWidth: boundary - item.x }
        : { ...item, inputHeight: boundary - item.y };
      if (Math.abs(start - oldBoundary) <= 1) return horizontal
        ? { ...item, x: boundary, inputWidth: end - boundary }
        : { ...item, y: boundary, inputHeight: end - boundary };
      return item;
    });
  };
  useEffect(() => {
    if (interaction?.type !== "joinResize" || !joinStretchMeasurement?.axis || !project) return;
    const typeStretchLength = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (!/^\d$/.test(event.key) && event.key !== "Backspace") return;
      event.preventDefault();
      const input = event.key === "Backspace" ? joinStretchMeasurement.input.slice(0, -1) : `${joinStretchMeasurement.input}${event.key}`.replace(/^0+(?=\d)/, "");
      const amount = Math.min(MAX_OPENING_DIMENSION, Math.max(0, Number(input) || 0));
      const item = project.items.find((value) => value.id === interaction.itemId);
      if (!item) return;
      const originalCorner = windowCornerPoint(item, interaction.corner);
      const boundary = (joinStretchMeasurement.axis === "x" ? originalCorner.x : originalCorner.y) + joinStretchMeasurement.direction * amount;
      const isLeft = interaction.corner.endsWith("left");
      const isTop = interaction.corner.startsWith("top");
      const side = joinStretchMeasurement.axis === "x" ? (isLeft ? "left" : "right") : (isTop ? "top" : "bottom");
      setCanvasPreviewItems(resizeRealJoinedBoundary(project.items, item.id, side, boundary));
      setJoinStretchMeasurement((current) => current ? { ...current, amount, input } : current);
    };
    window.addEventListener("keydown", typeStretchLength);
    return () => window.removeEventListener("keydown", typeStretchLength);
  }, [interaction, joinStretchMeasurement, project]);
  const canvasDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button === 2) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setContextMenu(null);
    const p = snapCanvasPoint(drawingPoint(event));
    if (interaction?.type === "joinResize") {
      joinResizeCommitRef.current = true;
      return;
    }
    const target = event.target as SVGElement;
    const resizeId = target.closest("[data-resize-id]")?.getAttribute("data-resize-id");
    const itemId = target.closest("[data-item-id]")?.getAttribute("data-item-id");
    const joinAnchor = target.closest("[data-join-anchor]");
    const joinItemId = joinAnchor?.getAttribute("data-join-item-id");
    const joinCorner = joinAnchor?.getAttribute("data-join-corner") as WindowCorner | null;
    if (joinModeItemId && joinItemId && joinCorner) {
      const activeItem = project.items.find((value) => value.id === joinModeItemId);
      const activeCorner = activeItem
        ? windowCorners
          .map((corner) => ({ corner, point: windowCornerPoint(activeItem, corner) }))
          .map((entry) => ({ ...entry, distance: Math.hypot(entry.point.x - p.x, entry.point.y - p.y) }))
          .filter((entry) => entry.distance <= 100)
          .sort((a, b) => a.distance - b.distance)[0]
        : undefined;
      const resizeItem = activeCorner && activeItem ? activeItem : project.items.find((value) => value.id === joinItemId);
      const resizeCorner = activeCorner?.corner ?? joinCorner;
      if (resizeItem) {
        const cornerPoint = activeCorner?.point ?? windowCornerPoint(resizeItem, resizeCorner);
        setSelectedItemId(resizeItem.id);
        setJoinModeItemId(resizeItem.id);
        joinResizeCommitRef.current = false;
        setJoinStretchMeasurement({ axis: null, direction: 1, amount: 0, input: "", clientX: event.clientX, clientY: event.clientY });
        setInteraction({ type: "joinResize", itemId: resizeItem.id, corner: resizeCorner, offsetX: cornerPoint.x - p.x, offsetY: cornerPoint.y - p.y });
      }
      return;
    }
    if (glassRemovalMode && itemId && event.button === 0) {
      const item = project.items.find((value) => value.id === itemId);
      if (item?.kind === "assembly" && item.glassMaterialId) {
        updateProject((current) => ({
          ...current,
          items: current.items.map((value) => value.id === itemId ? { ...value, glassMaterialId: undefined, glassLabel: undefined } : value),
        }));
      }
      setSelectedItemId(itemId);
      return;
    }
    if (selectedGlassMaterialId && itemId && event.button === 0) {
      const glass = materials.find((material) => material.id === selectedGlassMaterialId && material.databaseId === "glass");
      const item = project.items.find((value) => value.id === itemId);
      if (glass && item?.kind === "assembly") {
        updateProject((current) => ({
          ...current,
          items: current.items.map((value) => value.id === itemId ? { ...value, glassMaterialId: glass.id, glassLabel: glass.name } : value),
        }));
        setSelectedItemId(itemId);
        return;
      }
    }
    if (itemId && event.button === 0) {
      const lastClick = lastWindowClickRef.current;
      const isDoubleClick = lastClick?.itemId === itemId && Date.now() - lastClick.at < 520 && Math.hypot(lastClick.x - p.x, lastClick.y - p.y) < 100 / drawingView.zoom;
      if (isDoubleClick) {
        lastWindowClickRef.current = null;
        setSelectedItemId(itemId);
        setJoinModeItemId(itemId);
        setInteraction(null);
        setJoinFeedback("Automatic 1 mm corner alignment is active. Move or stretch the opening to join.");
        setDrawingMode("select");
        return;
      }
      lastWindowClickRef.current = { itemId, x: p.x, y: p.y, at: Date.now() };
    } else lastWindowClickRef.current = null;
    if (resizeId) {
      setSelectedItemId(resizeId);
      setInteraction({ type: "resize", itemId: resizeId });
      return;
    }
    if (drawingMode === "pan" || event.button === 1) {
      setInteraction({ type: "pan", startX: p.x, startY: p.y, originX: drawingView.x, originY: drawingView.y });
      return;
    }
    if (drawingMode === "two-rail" && !itemId) {
      placeTwoRailWindow(p.x, p.y);
      return;
    }
    if (drawingMode === "fly-screen" && !itemId) {
      placeFlyScreen(p.x, p.y);
      return;
    }
    if (drawingMode === "hinge-window" && !itemId) {
      placeHingeWindow(p.x, p.y);
      return;
    }
    if (drawingMode === "fixed-window" && !itemId) {
      placeFixedWindow(p.x, p.y);
      return;
    }
    if (drawingMode === "tilt-and-turn" && !itemId) {
      placeTiltAndTurn(p.x, p.y);
      return;
    }
    if (itemId) {
      const item = project.items.find((value) => value.id === itemId);
      if (item) {
        setSelectedItemId(itemId);
        const joining = Boolean(joinModeItemId);
        if (joining) setJoinModeItemId(itemId);
        const group = allJoinedWindowGroup(project.items, itemId);
        const origins = Object.fromEntries(project.items.filter((value) => group.has(value.id)).map((value) => [value.id, { x: value.x, y: value.y }]));
        setInteraction(joining ? { type: "joinMove", itemId, startX: p.x, startY: p.y, origins } : { type: "move", itemId, startX: p.x, startY: p.y, origins });
      }
    } else setSelectedItemId(null);
  };
  const canvasMove = (event: PointerEvent<SVGSVGElement>) => {
    if (selectedGlassMaterialId || glassRemovalMode) setGlassCursor({ x: event.clientX, y: event.clientY });
    const rawPoint = drawingPoint(event);
    const p = interaction?.type === "pan" ? rawPoint : snapCanvasPoint(rawPoint);
    if ((drawingMode === "two-rail" || drawingMode === "fly-screen" || drawingMode === "hinge-window" || drawingMode === "fixed-window" || drawingMode === "tilt-and-turn") && !interaction) {
      setCursorWindowPreview({ x: p.x, y: p.y });
      return;
    }
    if (!interaction) return;
    if (interaction.type === "pan") {
      setDrawingView((view) => ({ ...view, x: interaction.originX - (p.x - interaction.startX), y: interaction.originY - (p.y - interaction.startY) }));
    }
    if (interaction.type === "move" && Math.hypot(p.x - interaction.startX, p.y - interaction.startY) > 35 / drawingView.zoom) setCanvasPreviewItems(project.items.map((item) => {
      const origin = interaction.origins[item.id];
      return origin ? { ...item, x: origin.x + p.x - interaction.startX, y: origin.y + p.y - interaction.startY } : item;
    }));
    if (interaction.type === "joinMove" && Math.hypot(p.x - interaction.startX, p.y - interaction.startY) >= 1) {
      let moveX = p.x - interaction.startX;
      let moveY = p.y - interaction.startY;
      const movingIds = new Set(Object.keys(interaction.origins));
      const candidates = project.items.filter((item) => !movingIds.has(item.id)).flatMap((item) => windowCorners.map((corner) => ({ ...windowCornerPoint(item, corner), itemId: item.id })));
      const movingCorners = project.items.filter((item) => movingIds.has(item.id)).flatMap((item) => {
        const origin = interaction.origins[item.id];
        return windowCorners.map((corner) => ({ ...windowCornerPoint({ ...item, x: origin.x + moveX, y: origin.y + moveY }, corner), itemId: item.id }));
      });
      const match = movingCorners.flatMap((corner) => candidates.map((candidate) => ({ corner, candidate, distance: Math.hypot(candidate.x - corner.x, candidate.y - corner.y) }))).filter((candidate) => candidate.distance <= JOIN_CAPTURE_DISTANCE_MM / drawingView.zoom).sort((a, b) => a.distance - b.distance)[0];
      if (match) {
        moveX += match.candidate.x - match.corner.x;
        moveY += match.candidate.y - match.corner.y;
        setJoinFeedback("Corner snapped. Drag the opposite corner to stretch and match the second corner.");
      }
      setCanvasPreviewItems(project.items.map((item) => {
        const origin = interaction.origins[item.id];
        return origin ? { ...item, x: origin.x + moveX, y: origin.y + moveY } : item;
      }));
    }
    if (interaction.type === "resize") {
      const resizedWidth = resizeRealJoinedBoundary(project.items, interaction.itemId, "right", p.x);
      setCanvasPreviewItems(resizeRealJoinedBoundary(resizedWidth, interaction.itemId, "bottom", p.y));
    }
    if (interaction.type === "joinResize") {
      const item = project.items.find((value) => value.id === interaction.itemId);
      if (item) {
        const originalCorner = windowCornerPoint(item, interaction.corner);
        const cursorPoint = { x: p.x + interaction.offsetX, y: p.y + interaction.offsetY };
        if (joinStretchMeasurement?.input) {
          setJoinStretchMeasurement((current) => current ? { ...current, clientX: event.clientX, clientY: event.clientY } : current);
          return;
        }
        const axis = Math.abs(cursorPoint.x - originalCorner.x) >= Math.abs(cursorPoint.y - originalCorner.y) ? "x" : "y";
        const targetCorner = project.items
          .filter((value) => value.id !== item.id)
          .flatMap((value) => windowCorners.map((corner) => windowCornerPoint(value, corner)))
          .filter((corner) => Math.hypot(corner.x - originalCorner.x, corner.y - originalCorner.y) > 1)
          .map((corner) => ({
            ...corner,
            distance: axis === "x" ? Math.abs(corner.x - cursorPoint.x) : Math.abs(corner.y - cursorPoint.y),
            crossDistance: axis === "x" ? Math.abs(corner.y - originalCorner.y) : Math.abs(corner.x - originalCorner.x),
          }))
          .filter((corner) => corner.distance <= JOIN_CAPTURE_DISTANCE_MM / drawingView.zoom && corner.crossDistance <= 1)
          .sort((a, b) => a.distance - b.distance)[0];
        const point = targetCorner ?? cursorPoint;
        const isLeft = interaction.corner.endsWith("left");
        const isTop = interaction.corner.startsWith("top");
        const delta = (axis === "x" ? point.x - originalCorner.x : point.y - originalCorner.y);
        const direction: -1 | 1 = delta < 0 ? -1 : 1;
        setJoinStretchMeasurement({ axis, direction, amount: Math.abs(Math.round(delta)), input: "", clientX: event.clientX, clientY: event.clientY });
        if (targetCorner) setJoinFeedback(`${axis === "x" ? "Horizontal" : "Vertical"} corner snapped. Click again to keep the stretched size.`);
        setCanvasPreviewItems(resizeRealJoinedBoundary(project.items, item.id, axis === "x" ? (isLeft ? "left" : "right") : (isTop ? "top" : "bottom"), axis === "x" ? point.x : point.y));
      }
    }
    if (interaction.type === "join") {
      const movingItem = project?.items.find((item) => item.id === interaction.itemId);
      if (!movingItem) return;
      const snapDistance = JOIN_CAPTURE_DISTANCE_MM / drawingView.zoom;
      const targetCorner = project.items
        .filter((item) => item.id !== interaction.itemId && p.x >= item.x - snapDistance && p.x <= item.x + (item.inputWidth ?? 1500) + snapDistance && p.y >= item.y - snapDistance && p.y <= item.y + (item.inputHeight ?? 1200) + snapDistance)
        .flatMap((item) => windowCorners.map((corner) => ({ ...windowCornerPoint(item, corner), itemId: item.id, corner })))
        .map((corner) => ({ ...corner, distance: Math.hypot(corner.x - p.x, corner.y - p.y) }))
        .filter((corner) => corner.distance <= snapDistance)
        .sort((a, b) => a.distance - b.distance)[0];
      const targetItem = targetCorner ? project.items.find((item) => item.id === targetCorner.itemId) : undefined;
      const realCheck = targetCorner && targetItem ? realJoinCheck(movingItem, targetItem, interaction.corner, targetCorner.corner) : undefined;
      const isRealJoin = Boolean(realCheck?.valid);
      if (targetCorner) setJoinFeedback(isRealJoin ? realCheck!.message : `Fake join created — ${realCheck?.message ?? "canvas layout only."}`);
      const canJoin = Boolean(targetCorner);
      const destination = targetCorner ?? p;
      const offset = windowCornerPoint({ ...movingItem, x: 0, y: 0 }, interaction.corner);
      const movingGroup = allJoinedWindowGroup(project.items, interaction.itemId);
      const targetGroup = targetItem ? realJoinedWindowGroup(project.items, targetItem.id) : new Set<string>();
      const moveX = destination.x - (movingItem.x + offset.x);
      const moveY = destination.y - (movingItem.y + offset.y);
      setCanvasPreviewItems(project.items.map((item) => {
          if (movingGroup.has(item.id)) return {
            ...item,
            x: item.x + moveX,
            y: item.y + moveY,
            joinedWindowIds: item.id === interaction.itemId && canJoin ? [...new Set([...(item.joinedWindowIds ?? []), targetCorner!.itemId])] : item.joinedWindowIds,
            realJoinedWindowIds: isRealJoin ? [...new Set([...(item.realJoinedWindowIds ?? []), ...targetGroup])] : item.realJoinedWindowIds,
          };
          if (canJoin && targetGroup.has(item.id)) return {
            ...item,
            joinedWindowIds: item.id === targetCorner!.itemId ? [...new Set([...(item.joinedWindowIds ?? []), interaction.itemId])] : item.joinedWindowIds,
            realJoinedWindowIds: isRealJoin ? [...new Set([...(item.realJoinedWindowIds ?? []), ...movingGroup])] : item.realJoinedWindowIds,
          };
          return item;
        }));
    }
  };
  const connectJoinModeCorners = (items: CanvasItem[]) => {
    if (!interaction || (interaction.type !== "joinMove" && interaction.type !== "joinResize")) return items;
    const source = items.find((item) => item.id === interaction.itemId);
    if (!source) return items;
    const matches = windowCorners.flatMap((sourceCorner) => {
      const sourcePoint = windowCornerPoint(source, sourceCorner);
      return items.filter((item) => item.id !== source.id).flatMap((target) => windowCorners.map((targetCorner) => ({ sourceCorner, target, targetCorner, distance: Math.hypot(sourcePoint.x - windowCornerPoint(target, targetCorner).x, sourcePoint.y - windowCornerPoint(target, targetCorner).y) })));
    }).filter((match) => match.distance <= 2);
    const joinedTargets = new Set<string>();
    let next = items;
    matches.forEach(({ sourceCorner, target, targetCorner }) => {
      if (joinedTargets.has(target.id)) return;
      joinedTargets.add(target.id);
      const currentSource = next.find((item) => item.id === source.id)!;
      const currentTarget = next.find((item) => item.id === target.id)!;
      const existingSourceGroup = realJoinedWindowGroup(next, currentSource.id);
      if (existingSourceGroup.has(currentTarget.id)) return;
      const existingTargetGroup = realJoinedWindowGroup(next, currentTarget.id);
      const result = realJoinCheck(currentSource, currentTarget, sourceCorner, targetCorner, next);
      if (result.valid) {
        next = next.map((item) => {
          if (existingSourceGroup.has(item.id)) {
            const touchingTargets = [...existingTargetGroup].filter((id) => {
              const candidate = next.find((value) => value.id === id);
              return Boolean(candidate && fullSideTouching(item, candidate));
            });
            return { ...item, joinedWindowIds: [...new Set([...(item.joinedWindowIds ?? []), ...touchingTargets])], realJoinedWindowIds: [...new Set([...(item.realJoinedWindowIds ?? []), ...touchingTargets])] };
          }
          if (existingTargetGroup.has(item.id)) {
            const touchingSources = [...existingSourceGroup].filter((id) => {
              const candidate = next.find((value) => value.id === id);
              return Boolean(candidate && fullSideTouching(item, candidate));
            });
            return { ...item, joinedWindowIds: [...new Set([...(item.joinedWindowIds ?? []), ...touchingSources])], realJoinedWindowIds: [...new Set([...(item.realJoinedWindowIds ?? []), ...touchingSources])] };
          }
          return item;
        });
      } else {
        next = next.map((item) => item.id === currentSource.id ? { ...item, joinedWindowIds: [...new Set([...(item.joinedWindowIds ?? []), currentTarget.id])] } : item.id === currentTarget.id ? { ...item, joinedWindowIds: [...new Set([...(item.joinedWindowIds ?? []), currentSource.id])] } : item);
      }
      setJoinFeedback(result.valid ? result.message : `Fake join created — ${result.message}`);
    });
    return next;
  };
  const canvasUp = () => {
    if (interaction?.type === "joinResize" && !joinResizeCommitRef.current) return;
    if (canvasPreviewItems && project) updateProject((current) => ({ ...current, items: reconcileRealJoins(connectJoinModeCorners(canvasPreviewItems)) }));
    joinResizeCommitRef.current = false;
    setCanvasPreviewItems(null);
    setInteraction(null);
    setJoinStretchMeasurement(null);
  };
  useEffect(() => {
    if (interaction?.type !== "joinResize") return;
    const confirmStretchWithEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      joinResizeCommitRef.current = true;
      canvasUp();
    };
    window.addEventListener("keydown", confirmStretchWithEnter);
    return () => window.removeEventListener("keydown", confirmStretchWithEnter);
  }, [interaction, canvasPreviewItems, project]);
  const separateWindowFromCombination = (itemId: string) => {
    updateProject((current) => {
      const group = allJoinedWindowGroup(current.items, itemId);
      const members = current.items.filter((item) => group.has(item.id));
      const combinationReference = Math.min(...members.map((item) => item.reference ?? Number.MAX_SAFE_INTEGER));
      // The separated opening takes the next position after its combination;
      // every later reference moves forward to preserve drawing order.
      return {
        ...current,
        items: current.items.map((item) => item.id === itemId
          ? { ...item, reference: combinationReference + 1, joinedWindowIds: [], realJoinedWindowIds: [] }
          : {
            ...item,
            reference: item.reference !== undefined && !group.has(item.id) && item.reference >= combinationReference + 1 ? item.reference + 1 : item.reference,
            joinedWindowIds: (item.joinedWindowIds ?? []).filter((id) => id !== itemId),
            realJoinedWindowIds: (item.realJoinedWindowIds ?? []).filter((id) => id !== itemId),
          }),
      };
    });
    if (joinModeItemId) setJoinModeItemId(itemId);
    setInteraction(null);
    setCanvasPreviewItems(null);
    setJoinStretchMeasurement(null);
    joinResizeCommitRef.current = false;
    setJoinFeedback("Window separated from the Combination.");
    setContextMenu(null);
  };
  const explodeJoinedOpening = () => {
    if (!joinModeItemId || !project) return;
    const group = allJoinedWindowGroup(project.items, joinModeItemId);
    if (group.size < 2) {
      setJoinFeedback("This window is not part of a Combination.");
      return;
    }
    updateProject((current) => {
      const members = current.items.filter((item) => group.has(item.id));
      const combinationReference = Math.min(...members.map((item) => item.reference ?? Number.MAX_SAFE_INTEGER));
      const addedReferences = members.length - 1;
      return {
        ...current,
        items: current.items.map((item) => group.has(item.id)
          ? { ...item, reference: combinationReference + members.findIndex((member) => member.id === item.id), joinedWindowIds: [], realJoinedWindowIds: [] }
          : item.reference !== undefined && item.reference >= combinationReference + 1
            ? { ...item, reference: item.reference + addedReferences }
            : item),
      };
    });
    setJoinFeedback("Combination exploded into separate windows.");
  };
  const canvasDoubleClick = (event: MouseEvent<SVGSVGElement>) => {
    const itemId = (event.target as SVGElement).closest("[data-item-id]")?.getAttribute("data-item-id");
    if (!itemId) {
      setJoinModeItemId(null);
      setInteraction(null);
      setJoinFeedback("");
      return;
    }
    event.preventDefault();
    setSelectedItemId(itemId);
    setJoinModeItemId(itemId);
    setInteraction(null);
    setJoinFeedback("Automatic 1 mm corner alignment is active. Move or stretch the opening to join.");
    setDrawingMode("select");
  };
  const canvasWheel = (event: WheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const p = drawingPoint(event);
    setDrawingView((view) => {
      const nextZoom = Math.max(0.35, Math.min(3, view.zoom * (event.deltaY > 0 ? 0.88 : 1.14)));
      const ratio = nextZoom / view.zoom;
      return { zoom: nextZoom, x: p.x - (p.x - view.x) / ratio, y: p.y - (p.y - view.y) / ratio };
    });
  };
  const openItemContextMenu = (event: MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    const target = event.target as SVGElement;
    const itemId = target.closest("[data-item-id]")?.getAttribute("data-item-id");
    if (!itemId) {
      setContextMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedItemId(itemId);
    setContextMenu({ itemId, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  const startInspectorResize = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setInspectorResize({ startX: event.clientX, startWidth: inspectorWidth });
  };
  const resizeInspector = (event: PointerEvent<HTMLDivElement>) => {
    if (!inspectorResize) return;
    setInspectorWidth(Math.max(220, Math.min(520, inspectorResize.startWidth - (event.clientX - inspectorResize.startX))));
  };
  const materialPoint = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return `${((event.clientX - rect.left) / rect.width) * 100},${((event.clientY - rect.top) / rect.height) * 100}`;
  };
  const materialDrawStart = (event: PointerEvent<SVGSVGElement>) => setMaterialPenPoints([materialPoint(event)]);
  const materialDrawMove = (event: PointerEvent<SVGSVGElement>) => {
    if (materialPenPoints.length) setMaterialPenPoints((points) => [...points, materialPoint(event)]);
  };
  const materialDrawEnd = () => setMaterialPenPoints([]);
  const openPriceComponent = (databaseId: string, priceTable?: Material["priceTable"], insertAfterMaterialId?: string) => {
    setMaterialDatabaseOverride(databaseId);
    setPriceInsertAfterMaterialId(insertAfterMaterialId ?? null);
    openModal("material", undefined, priceTable);
  };
  const openCompanyTableMaterial = (databaseId: string, tableId: string, priceTable: Material["priceTable"] = "profiles", insertAfterMaterialId?: string) => {
    setCompanyMaterialTableId(tableId);
    openPriceComponent(databaseId, priceTable, insertAfterMaterialId);
  };
  const movePriceMaterialAfter = (movingId: string, targetId: string) => {
    if (movingId === targetId) return;
    recordPriceChange();
    setMaterials((items) => {
      const moving = items.find((item) => item.id === movingId);
      const withoutMoving = items.filter((item) => item.id !== movingId);
      const targetIndex = withoutMoving.findIndex((item) => item.id === targetId);
      return !moving || targetIndex < 0 ? items : [...withoutMoving.slice(0, targetIndex + 1), moving, ...withoutMoving.slice(targetIndex + 1)];
    });
    setMoveMaterialId(null);
  };
  const movePriceMaterialToTable = (
    movingId: string,
    databaseId: string,
    priceTable: Material["priceTable"],
    companyTableId?: string,
  ) => {
    recordPriceChange();
    setMaterials((items) => {
      const moving = items.find((item) => item.id === movingId);
      if (!moving) return items;
      const withoutMoving = items.filter((item) => item.id !== movingId);
      const moved = { ...moving, databaseId, priceTable, companyTableId };
      let lastIndex = -1;
      withoutMoving.forEach((item, index) => {
        if (item.databaseId === databaseId && item.priceTable === priceTable) lastIndex = index;
      });
      return lastIndex < 0 ? [...withoutMoving, moved] : [...withoutMoving.slice(0, lastIndex + 1), moved, ...withoutMoving.slice(lastIndex + 1)];
    });
    setMoveMaterialId(null);
  };
  const movePriceMaterialToSolealAccessories = (movingId: string) => {
    const moving = materials.find((item) => item.id === movingId);
    if (!moving) return;
    const solealDatabases = [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE];
    const databaseId = solealDatabases.includes(moving.databaseId ?? "") ? moving.databaseId! : TECHNAL_GYN_DATABASE;
    movePriceMaterialToTable(movingId, databaseId, "accessories");
  };
  const setTableWeightRate = (tableId: string, value: number) => {
    recordPriceChange();
    const rate = Math.max(0, value || 0);
    setWeightRates((rates) => ({ ...rates, [tableId]: rate }));
    setMaterials((items) => items.map((material) => material.rateMethod === "weight" && material.weightRateTableId === tableId
      ? { ...material, cost: Math.max(0, material.weight) * rate }
      : material));
  };
  const setMaterialRateMethod = (material: Material, tableId: string, rateMethod: "manual" | "weight") => {
    recordPriceChange();
    const weightRate = weightRates[tableId] ?? 0;
    const targets = priceSelectionMode && selectedPriceMaterialIds.has(material.id)
      ? selectedPriceMaterialIds
      : new Set([material.id]);
    setMaterials((items) => items.map((item) => {
      if (!targets.has(item.id)) return item;
      const manualRate = item.rateMethod === "manual" ? item.cost : item.manualRate ?? item.cost;
      return {
        ...item,
        rateMethod,
        manualRate,
        weightRateTableId: rateMethod === "weight" ? tableId : undefined,
        cost: rateMethod === "weight" ? Math.max(0, item.weight) * weightRate : manualRate,
      };
    }));
    setRateMethodMenu(null);
  };
  const deletePriceMaterial = (material: Material) => {
    const usedIn = assemblies.filter((assembly) => assembly.parts.some((part) => part.materialId === material.id) || assembly.joinModifications?.some((modification) => modification.materialId === material.id)).map((assembly) => assembly.name);
    const confirmationMessage = usedIn.length
      ? `Be careful: this material is used in the following assembly type${usedIn.length === 1 ? "" : "s"}: ${usedIn.join(", ")}.\n\nDeleting it will remove the material and its formulas from those assemblies.\n\nAre you sure you want to delete ${material.name}?`
      : `Are you sure you want to delete ${material.name}? This cannot be undone.`;
    if (!confirm(confirmationMessage)) return;
    recordPriceChange();
    setMaterials((items) => items.filter((item) => item.id !== material.id));
    setAssemblies((items) => items.map((assembly) => ({
      ...assembly,
      parts: assembly.parts.filter((part) => part.materialId !== material.id),
      joinModifications: assembly.joinModifications?.filter((modification) => modification.materialId !== material.id),
    })));
  };
  const togglePriceMaterialSelection = (materialId: string, selected: boolean) => {
    setSelectedPriceMaterialIds((current) => {
      const next = new Set(current);
      if (selected) next.add(materialId);
      else next.delete(materialId);
      return next;
    });
  };
  const deleteSelectedPriceMaterials = () => {
    if (!selectedPriceMaterialIds.size) return;
    if (!confirm(`Delete ${selectedPriceMaterialIds.size} selected material component(s)? This also removes them from their database and cannot be undone.`)) return;
    recordPriceChange();
    const selected = selectedPriceMaterialIds;
    setMaterials((items) => items.filter((item) => !selected.has(item.id)));
    setAssemblies((items) => items.map((assembly) => ({ ...assembly, parts: assembly.parts.filter((part) => !selected.has(part.materialId)) })));
    setProjects((items) => items.map((project) => ({ ...project, items: project.items.filter((item) => item.kind !== "material" || !selected.has(item.sourceId)) })));
    setSelectedPriceMaterialIds(new Set());
    setPriceDeleteMode(false);
  };
  const insertConditionToken = (materialId: string, token: string) => {
    setPartConditions((conditions) => ({ ...conditions, [materialId]: `${conditions[materialId] ?? ""}${token}` }));
    setActiveConditionMaterialId(materialId);
  };
  const insertFormulaValue = (materialId: string, field: "true" | "false", value: string) => {
    const update = field === "true" ? setPartFormulas : setPartFourPanelFormulas;
    update((formulas) => ({ ...formulas, [materialId]: `${formulas[materialId] ?? ""}${value}` }));
    setActiveFormulaField({ materialId, field });
  };
  const beginFormulaEdit = (materialId: string, field: "true" | "false", initialValue: string) => {
    const current = field === "true" ? partFormulas[materialId] ?? initialValue : partFourPanelFormulas[materialId] ?? initialValue;
    setFormulaEditBackup({ materialId, field, value: current });
    setActiveFormulaField({ materialId, field });
    if (field === "true") setPartFormulas((values) => ({ ...values, [materialId]: current }));
    else setPartFourPanelFormulas((values) => ({ ...values, [materialId]: current }));
  };
  const cancelFormulaEdit = (materialId: string, field: "true" | "false") => {
    if (formulaEditBackup?.materialId !== materialId || formulaEditBackup.field !== field) return;
    if (field === "true") setPartFormulas((values) => ({ ...values, [materialId]: formulaEditBackup.value }));
    else setPartFourPanelFormulas((values) => ({ ...values, [materialId]: formulaEditBackup.value }));
  };
  const startAssemblyColumnResize = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setAssemblyColumnResize({ index, startX: event.clientX, startWidth: assemblyColumnWidths[index] });
  };
  const resizeAssemblyColumn = (event: PointerEvent<HTMLDivElement>) => {
    if (!assemblyColumnResize) return;
    const minimumWidths = [125, 54, 130, 145, 145, 245];
    setAssemblyColumnWidths((widths) => widths.map((width, index) => index === assemblyColumnResize.index
      ? Math.max(minimumWidths[index], Math.min(900, assemblyColumnResize.startWidth + event.clientX - assemblyColumnResize.startX))
      : width));
  };
  const openNewCompanyDatabase = () => {
    setNewCompanyDatabaseName("");
    setNewCompanyDatabaseError("");
    setNewCompanyDatabaseOpen(true);
  };
  const saveNewCompanyDatabase = (event: FormEvent) => {
    event.preventDefault();
    const name = newCompanyDatabaseName.trim();
    if (!name) {
      setNewCompanyDatabaseError("Enter a company database name.");
      return;
    }
    if (["Soleal", ...companyDatabases.map((database) => database.name)].some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      setNewCompanyDatabaseError(`A database named “${name}” already exists.`);
      return;
    }
    const database = { id: `company-${makeId()}`, name };
    setCompanyDatabases((databases) => [...databases, database]);
    setActiveDatabaseId(database.id);
    setNewCompanyDatabaseOpen(false);
  };
  const companyTableReferencePrefix = (value: string) => value.trim().replace(/\s+/g, "").replace(/-+$/, "");
  const openNewCompanyTable = (database: CompanyDatabase) => {
    setNewCompanyTableFor(database);
    setNewCompanyTableName("");
    setNewCompanyTableReference("");
    setNewCompanyTableError("");
  };
  const saveNewCompanyTable = (event: FormEvent) => {
    event.preventDefault();
    if (!newCompanyTableFor) return;
    const name = newCompanyTableName.trim();
    const referencePrefix = companyTableReferencePrefix(newCompanyTableReference);
    if (!name || !referencePrefix) {
      setNewCompanyTableError("Enter both a table name and a material reference.");
      return;
    }
    const referenceExists = companyPriceTables.some((table) => table.referencePrefix.toLowerCase() === referencePrefix.toLowerCase());
    if (referenceExists) {
      setNewCompanyTableError(`Material reference “${referencePrefix}” already exists. Use a unique reference.`);
      return;
    }
    setCompanyPriceTables((tables) => [...tables, { id: `company-table-${makeId()}`, companyDatabaseId: newCompanyTableFor.id, name, referencePrefix }]);
    setNewCompanyTableFor(null);
  };
  const openMoveCompanyTable = (table: TableMove) => {
    const firstTarget = [{ id: "prices", name: "Soleal" }, ...companyDatabases].find((database) => database.id !== table.sourceDatabaseId);
    if (!firstTarget) return;
    setMoveCompanyTable(table);
    setMoveCompanyTableTargetId(firstTarget.id);
  };
  const saveMoveCompanyTable = (event: FormEvent) => {
    event.preventDefault();
    if (!moveCompanyTable || !moveCompanyTableTargetId || moveCompanyTable.sourceDatabaseId === moveCompanyTableTargetId) return;
    const targetTableId = moveCompanyTable.tableId ?? `company-table-${makeId()}`;
    if (moveCompanyTable.tableId) {
      setCompanyPriceTables((tables) => tables.map((table) => table.id === targetTableId
        ? { ...table, companyDatabaseId: moveCompanyTableTargetId }
        : table));
    } else {
      setCompanyPriceTables((tables) => [...tables, { id: targetTableId, companyDatabaseId: moveCompanyTableTargetId, name: moveCompanyTable.name, referencePrefix: moveCompanyTable.referencePrefix }]);
      if (moveCompanyTable.sourceTableId) setMovedOriginalPriceTableIds((ids) => ids.includes(moveCompanyTable.sourceTableId!) ? ids : [...ids, moveCompanyTable.sourceTableId!]);
    }
    setMaterials((items) => items.map((material) => (moveCompanyTable.tableId ? material.companyTableId === targetTableId : moveCompanyTable.materialIds.includes(material.id))
      ? { ...material, databaseId: moveCompanyTableTargetId, companyTableId: targetTableId }
      : material));
    setActiveDatabaseId(moveCompanyTableTargetId);
    setMoveCompanyTable(null);
  };

  const PriceBook = ({ view = "prices" }: { view?: "prices" | "stock" }) => {
    const isStockView = view === "stock";
    const stockEntriesFor = (material: Material) => material.stockEntries?.length
      ? material.stockEntries
      : [{ id: "default", length: material.stockLength ?? 0, quantity: material.stockQuantity ?? 0 }];
    const saveStockEntries = (materialId: string, entries: Material["stockEntries"]) => {
      if (!entries?.length) return;
      setMaterials((items) => items.map((material) => material.id === materialId
        ? { ...material, stockEntries: entries, stockLength: entries[0].length, stockQuantity: entries[0].quantity }
        : material));
    };
    const companyDatabase = companyDatabases.find((database) => database.id === activeDatabaseId);
    const hasLegacyMovedOthers = companyPriceTables.some((table) => table.companyDatabaseId !== "prices" && table.name.trim().toLowerCase() === "others" && table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === "g");
    const assemblyUsageByMaterial = new Map<string, string[]>();
    assemblies.forEach((assembly) => {
      assembly.parts.forEach((part) => {
        const names = assemblyUsageByMaterial.get(part.materialId) ?? [];
        if (!names.includes(assembly.name)) names.push(assembly.name);
        assemblyUsageByMaterial.set(part.materialId, names);
      });
    });
    const assemblyUsage = (materialId: string) => assemblyUsageByMaterial.get(materialId) ?? [];
    const assemblyTypeNames = [...new Set(assemblies.filter((assembly) => assembly.parts.length > 0).map((assembly) => assembly.name))].sort((a, b) => a.localeCompare(b));
    const matchesAssemblyTypeFilter = (material: Material) => !assemblyTypeFilter || assemblyUsage(material.id).includes(assemblyTypeFilter);
    const rowsFor = (databaseId: string) => filtered.filter((material) => material.databaseId === databaseId && matchesAssemblyTypeFilter(material));
    const generalRowsFor = (group: "others" | "profiles" | "accessories") => rowsFor("markups").filter((material) =>
      group === "others"
        ? !material.priceTable || material.priceTable === "general"
        : material.priceTable === group,
    );
    const groupedRowsFor = (databaseId: string, group: "profiles" | "accessories", legacyProfileCount = 7) => {
      const allRows = materials.filter((material) => material.databaseId === databaseId);
      const legacyProfileIds = new Set(allRows.filter((material) => !material.priceTable).slice(0, legacyProfileCount).map((material) => material.id));
      return rowsFor(databaseId).filter((material) => material.priceTable === group || (!material.priceTable && (group === "profiles" ? legacyProfileIds.has(material.id) : !legacyProfileIds.has(material.id))));
    };
    const selectedTargets = (materialId: string) => priceSelectionMode && selectedPriceMaterialIds.has(materialId)
      ? selectedPriceMaterialIds
      : new Set([materialId]);
    const beginRowDragSelection = (event: PointerEvent<HTMLDivElement>, materialId: string) => {
      // Editable controls must always keep their normal click-and-type behavior.
      // Drag selection begins from the rest of the row (reference, name, code, etc.).
      if (priceDeleteMode || event.button !== 0 || (event.target as HTMLElement).closest("input, select, textarea, button, [contenteditable='true']")) return;
      if (!priceSelectionMode) {
        setPriceSelectionPending({ materialId, startX: event.clientX, startY: event.clientY });
        return;
      }
      const select = !selectedPriceMaterialIds.has(materialId);
      setSelectedPriceMaterialIds((current) => {
        const next = new Set(current);
        if (select) next.add(materialId); else next.delete(materialId);
        return next;
      });
      setPriceSelectionDrag({ select });
    };
    const extendRowDragSelection = (materialId: string) => {
      if (!priceSelectionDrag) return;
      setSelectedPriceMaterialIds((current) => {
        const next = new Set(current);
        if (priceSelectionDrag.select) next.add(materialId); else next.delete(materialId);
        return next;
      });
    };
    const PriceTable = ({ title, note, rows, section, databaseId, prefix, startAt = 1, collapseId, companyTableId }: { title: string; note: string; rows: Material[]; section: string; databaseId: string; prefix: string; startAt?: number; collapseId?: string; companyTableId?: string }) => {
      const tableId = collapseId ?? databaseId;
      const collapsed = collapsedPriceTables.has(tableId);
      const insertedMaterialPriceTable: Material["priceTable"] = title === "Others" ? "general" : title.includes("profiles") ? "profiles" : "accessories";
      const isSolealAccessoriesTable = databaseId === "soleal-accessories";
      const newMaterialDatabaseId = isSolealAccessoriesTable ? TECHNAL_GYN_DATABASE : databaseId;
      const weightRate = weightRates[tableId] ?? 0;
      const movableRows = companyTableId
        ? materials.filter((material) => material.companyTableId === companyTableId)
        : isSolealAccessoriesTable
          ? solealAccessoryMaterials()
          : [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].includes(databaseId) && insertedMaterialPriceTable === "profiles"
            ? solealProfileMaterials(databaseId)
            : materials.filter((material) => material.databaseId === databaseId && (databaseId !== "markups" || (insertedMaterialPriceTable === "general" ? !material.priceTable || material.priceTable === "general" : material.priceTable === insertedMaterialPriceTable)));
      const openComponent = (insertAfterMaterialId?: string) => companyTableId
        ? openCompanyTableMaterial(databaseId, companyTableId, insertedMaterialPriceTable, insertAfterMaterialId)
        : openPriceComponent(newMaterialDatabaseId, insertedMaterialPriceTable, insertAfterMaterialId);
      const toggle = () => setCollapsedPriceTables((current) => {
        const next = new Set(current);
        if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
        return next;
      });
      return (
        <section className={`price-book-section ${section} ${isStockView ? "stock-book-section" : ""}`}>
          <header className="price-book-section-header">
            <div><h2>{title}</h2><p>{note}</p></div>
                <div className="price-book-section-actions"><span>{rows.length}</span>{moveMaterialId && <button type="button" className="price-move-here" onClick={() => isSolealAccessoriesTable ? movePriceMaterialToSolealAccessories(moveMaterialId) : movePriceMaterialToTable(moveMaterialId, databaseId, insertedMaterialPriceTable, companyTableId)}>Move selected here</button>}<button type="button" className="price-move-here" onClick={() => openMoveCompanyTable({ tableId: companyTableId, sourceTableId: companyTableId ? undefined : tableId, sourceDatabaseId: companyTableId ? databaseId : "prices", name: title, referencePrefix: prefix.replace(/-+$/, ""), materialIds: movableRows.map((material) => material.id) })}>Move table</button><button type="button" className="price-table-toggle" onClick={toggle} aria-expanded={!collapsed}>{collapsed ? "Open" : "Close"}</button><button type="button" onClick={() => openComponent()}><Icon name="plus" size={13} /> Add component</button>{!isStockView && <label className="table-weight-rate"><span>$/kg</span><input aria-label={`Weight rate for ${title}`} type="number" min="0" step="any" value={weightRate} onChange={(event) => setTableWeightRate(tableId, Number(event.target.value))} /></label>}</div>
          </header>
          {!collapsed && <div className={`material-list table-zoomable price-book-table ${isStockView ? "stock-book-table" : ""} ${priceDeleteMode ? "selection-active" : ""} ${priceSelectionMode ? "bulk-selection-active" : ""}`} style={tableStyle} onWheel={zoomTable} role="table" aria-label={`${title} ${isStockView ? "stock" : "prices"}`}>
            <div className="material-list-header" role="row">{priceDeleteMode && <span><input type="checkbox" aria-label={`Select all ${title} materials`} checked={rows.length > 0 && rows.every((material) => selectedPriceMaterialIds.has(material.id))} onChange={(event) => setSelectedPriceMaterialIds((current) => { const next = new Set(current); rows.forEach((material) => event.target.checked ? next.add(material.id) : next.delete(material.id)); return next; })} /></span>}<span>Ref.</span><span>Material</span><span>Code</span><span>Used in assembly type</span><span>Unit</span>{isStockView ? <><span>Mass</span><span>Stock length</span><span>Qty</span></> : <><span className="weight-column-heading">kg / unit</span><span>Wastage</span><span>Rate / unit</span><span>Shipping</span><span /></>}</div>
            {rows.map((material, index) => {
              const usage = assemblyUsage(material.id);
              const usageText = usage.join(", ");
              return <div className={`material-list-row ${!isStockView && rateMethodMenu?.materialId === material.id ? "rate-method-open" : ""} ${(priceSelectionMode || priceDeleteMode) && selectedPriceMaterialIds.has(material.id) ? "price-row-selected" : ""}`} role="row" key={material.id} data-price-material-id={material.id} onPointerDown={(event) => beginRowDragSelection(event, material.id)} onPointerEnter={() => extendRowDragSelection(material.id)} onPointerUp={() => { setPriceSelectionPending(null); setPriceSelectionDrag(null); }}>
                {priceDeleteMode && <span><input type="checkbox" aria-label={`Select ${material.name}`} checked={selectedPriceMaterialIds.has(material.id)} onChange={(event) => togglePriceMaterialSelection(material.id, event.target.checked)} /></span>}
                <span className="price-reference">{prefix}{startAt + index}</span>
                <span className={`material-list-name ${moveMaterialId && moveMaterialId !== material.id ? "move-target" : ""}`}><span className="price-photo-cell"><button type="button" className="price-photo-button" onClick={() => moveMaterialId ? movePriceMaterialAfter(moveMaterialId, material.id) : setPhotoMenuMaterialId((current) => current === material.id ? null : material.id)} aria-label={`Actions for ${material.name}`}><Sketch path={material.sketch} label={material.name} /></button>{photoMenuMaterialId === material.id && <span className="price-photo-menu"><button type="button" onClick={() => { openComponent(material.id); setPhotoMenuMaterialId(null); }}>Insert</button><button type="button" onClick={() => { setMoveMaterialId(material.id); setPhotoMenuMaterialId(null); }}>Move</button><button type="button" onClick={() => { setPhotoMenuMaterialId(null); deletePriceMaterial(material); }}>Delete</button></span>}</span><b>{material.name}</b>{material.manufacturer && <small>{material.manufacturer}</small>}</span>
                <span>{material.code}</span><span className="assembly-usage" title={usageText || "Not used in an assembly type"} tabIndex={0} aria-label={usageText ? `Used in assembly types: ${usageText}` : "Not used in an assembly type"}>{usageText || "Not used"}</span><span>{material.unit}</span>{isStockView ? <><span className="stock-mass-cell"><input className="stock-input" aria-label={`Mass for ${material.name}`} type="number" min="0" step="any" value={material.weight || ""} onChange={(event) => setMaterials((items) => items.map((item) => item.id === material.id ? { ...item, weight: Math.max(0, Number(event.target.value) || 0) } : item))} /><em>kg</em></span>{(() => {
                  const stockEntries = stockEntriesFor(material);
                  const updateEntry = (entryId: string, field: "length" | "quantity", value: string) => {
                    const parsed = Math.max(0, Number(value) || 0);
                    saveStockEntries(material.id, stockEntries.map((entry) => entry.id === entryId ? { ...entry, [field]: parsed } : entry));
                  };
                  return <><span className="stock-cell stock-entry-list">{stockEntries.map((entry) => <span className="stock-entry-row" key={entry.id}><input className="stock-input" aria-label={`Stock length for ${material.name}`} type="number" min="0" step="any" value={entry.length || ""} onChange={(event) => updateEntry(entry.id, "length", event.target.value)} onContextMenu={(event) => { event.preventDefault(); setStockLengthMenu({ materialId: material.id, entryId: entry.id }); }} /><em>m</em>{stockLengthMenu?.materialId === material.id && stockLengthMenu.entryId === entry.id && <span className="stock-length-menu" role="menu"><button type="button" onClick={() => { saveStockEntries(material.id, [...stockEntries, { id: makeId(), length: 0, quantity: 0 }]); setStockLengthMenu(null); }}>Add another stock length</button>{stockEntries.length > 1 && <button type="button" className="danger" onClick={() => { saveStockEntries(material.id, stockEntries.filter((value) => value.id !== entry.id)); setStockLengthMenu(null); }}>Delete stock length</button>}</span>}</span>)}</span><span className="stock-cell stock-entry-list">{stockEntries.map((entry) => <span className="stock-entry-row" key={entry.id}><input className="stock-input" aria-label={`Stock quantity for ${material.name}`} type="number" min="0" step="1" value={entry.quantity || ""} onChange={(event) => updateEntry(entry.id, "quantity", event.target.value)} /></span>)}</span></>;
                })()}</> : <><span className="weight-cell"><input key={material.weight} className="weight-input" aria-label={`Kilograms per unit for ${material.name}`} type="number" min="0" step="any" defaultValue={material.weight} onBlur={(event) => { const weight = Math.max(0, Number(event.target.value) || 0); const targets = selectedTargets(material.id); recordPriceChange(); setMaterials((items) => items.map((value) => !targets.has(value.id) ? value : { ...value, weight, cost: value.rateMethod === "weight" ? weight * (weightRates[value.weightRateTableId ?? tableId] ?? 0) : value.cost })); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></span>
                <span className="wastage-cell"><input key={material.wastage ?? 0} className="wastage-input" aria-label={`Wastage percentage for ${material.name}`} type="number" min="0" step="any" defaultValue={material.wastage ?? 0} onBlur={(event) => { const wastage = Math.max(0, Number(event.target.value) || 0); const targets = selectedTargets(material.id); recordPriceChange(); setMaterials((items) => items.map((value) => targets.has(value.id) ? { ...value, wastage } : value)); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> <em>%</em></span>
                <span className={`price-cell rate-cell ${material.rateMethod === "weight" ? "weight-based" : ""} ${rateMethodMenu?.materialId === material.id ? "rate-method-open" : ""}`} onContextMenu={(event) => { event.preventDefault(); setRateMethodMenu({ materialId: material.id, tableId }); }}><input key={`${material.rateMethod ?? "manual"}-${material.cost}`} className="price-book-input" aria-label={`Rate per unit for ${material.name}`} title="Right-click to choose Manual or Weight based" type="number" min="0" step="any" defaultValue={material.cost} disabled={material.rateMethod === "weight"} onBlur={(event) => { const cost = Math.max(0, Number(event.target.value) || 0); const targets = selectedTargets(material.id); recordPriceChange(); setMaterials((items) => items.map((value) => targets.has(value.id) ? { ...value, cost, manualRate: cost, rateMethod: "manual", weightRateTableId: undefined } : value)); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> <em>$</em>{rateMethodMenu?.materialId === material.id && <div className="rate-method-menu" role="menu"><button type="button" onClick={() => setMaterialRateMethod(material, tableId, "manual")}>Manual</button><button type="button" onClick={() => setMaterialRateMethod(material, tableId, "weight")}>Weight based</button></div>}</span>
                <span className="shipping-cell"><select className="shipping-type-select" value={material.shippingTypeId ?? ""} onChange={(event) => { const shippingTypeId = event.target.value || undefined; const shippingPercentage = shippingRateForType(shippingTypeId); const targets = selectedTargets(material.id); recordPriceChange(); setMaterials((items) => items.map((value) => targets.has(value.id) ? { ...value, shippingTypeId, shippingPercentage } : value)); }} aria-label={`Shipping type for ${material.name}`}><option value="">No shipping</option>{shippingTypes.map((type) => <option key={type.id} value={type.id}>{type.name} ({number(shippingRateForType(type.id))}%)</option>)}</select></span><span className="material-list-actions"><button onClick={() => openModal("material", material.id)} aria-label={`Edit ${material.name}`}><Icon name="edit" size={13} /></button></span></>}
              </div>;
            })}
            {!rows.length && <p className="price-book-empty">No materials in this price group yet.</p>}
          </div>}
        </section>
      );
    };
    return <div className={isStockView ? "stock-book" : undefined}>
      <section className="page-heading">
        <div><h1>{isStockView ? "Stock" : companyDatabase ? `${companyDatabase.name} Database` : "Soleal Database"}</h1><p className="intro">{isStockView ? "The same material tables as the estimation database, showing stock length and available quantity." : companyDatabase ? `Organize ${companyDatabase.name} materials within the shared estimating database. These tables use the same estimating controls as Soleal.` : "Manage Soleal materials, profiles, accessories, and their central pricing for estimating."}</p></div>
        <button type="button" className="primary-button" onClick={() => openNewCompanyTable(companyDatabase ?? { id: "prices", name: "Soleal" })}><Icon name="plus" /> Add table</button>
      </section>
      <section className="library-panel price-book-panel">
        <div className="toolbar">
          <label className="search-field"><Icon name="search" size={17} /><span className="sr-only">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${companyDatabase ? `${companyDatabase.name} database` : "Soleal database"}`} /></label>
          <label className="assembly-type-filter"><span>Assembly type</span><select value={assemblyTypeFilter} onChange={(event) => setAssemblyTypeFilter(event.target.value)}><option value="">All assembly types</option>{assemblyTypeNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <span className="item-count">{filtered.length} materials</span><span className="table-zoom-readout">Table {tableZoom}% · Ctrl + scroll</span><button className="price-history-button" type="button" onClick={undoPriceChange} disabled={!priceUndoHistory.length}>Undo</button><button className="price-history-button" type="button" onClick={redoPriceChange} disabled={!priceRedoHistory.length}>Redo</button><button className={`delete-selected-button ${priceDeleteMode ? "selection-active" : ""}`} type="button" onClick={() => { if (!priceDeleteMode) { setPriceDeleteMode(true); setPriceSelectionMode(false); setPriceSelectionPending(null); setPriceSelectionDrag(null); setSelectedPriceMaterialIds(new Set()); return; } if (selectedPriceMaterialIds.size) deleteSelectedPriceMaterials(); else setPriceDeleteMode(false); }}><Icon name="trash" size={14} /> {priceDeleteMode ? selectedPriceMaterialIds.size ? `Delete selected (${selectedPriceMaterialIds.size})` : "Exit delete" : "Delete"}</button>
        </div>
        {companyDatabase ? <>{companyPriceTables.filter((table) => table.companyDatabaseId === companyDatabase.id).map((table) => <PriceTable key={table.id} title={table.name} note={`Materials in this ${companyDatabase.name} table.`} rows={rowsFor(companyDatabase.id).filter((material) => material.companyTableId === table.id)} section="price-technal" databaseId={companyDatabase.id} prefix={`${table.referencePrefix}-`} collapseId={table.id} companyTableId={table.id} />)}{!companyPriceTables.some((table) => table.companyDatabaseId === companyDatabase.id) && <p className="price-book-empty">No tables yet. Use Add table to create the first {companyDatabase.name} material table.</p>}</> : <>{companyPriceTables.filter((table) => table.companyDatabaseId === "prices").map((table) => <PriceTable key={table.id} title={table.name} note="Materials in this shared Soleal database table." rows={rowsFor("prices").filter((material) => material.companyTableId === table.id)} section="price-technal" databaseId="prices" prefix={`${table.referencePrefix}-`} collapseId={table.id} companyTableId={table.id} />)}{!movedOriginalPriceTableIds.includes("general-others") && !hasLegacyMovedOthers && <PriceTable title="Others" note="Miscellaneous general items." rows={generalRowsFor("others")} section="price-general" databaseId="markups" prefix="G-" collapseId="general-others" />}
        {!movedOriginalPriceTableIds.includes("general-profiles") && <PriceTable title="General ALU profiles" note="General aluminium profiles." rows={generalRowsFor("profiles")} section="price-general" databaseId="markups" prefix="GP-" collapseId="general-profiles" />}
        {!movedOriginalPriceTableIds.includes("general-accessories") && <PriceTable title="General ALU accessories" note="General aluminium accessories." rows={generalRowsFor("accessories")} section="price-general" databaseId="markups" prefix="GA-" collapseId="general-accessories" />}
        {!movedOriginalPriceTableIds.includes("gyn-profiles") && <PriceTable title="GYn · ALU profiles" note="Soleal GYn aluminium profiles." rows={groupedRowsFor(TECHNAL_GYN_DATABASE, "profiles")} section="price-technal" databaseId={TECHNAL_GYN_DATABASE} prefix="GYn-" collapseId="gyn-profiles" />}
        {!movedOriginalPriceTableIds.includes("gy-profiles") && <PriceTable title="GY · ALU profiles" note="Soleal GY aluminium profiles." rows={groupedRowsFor(TECHNAL_GY_DATABASE, "profiles")} section="price-technal" databaseId={TECHNAL_GY_DATABASE} prefix="GY-" collapseId="gy-profiles" />}
        {!movedOriginalPriceTableIds.includes("fyn-profiles") && <PriceTable title="FYn · ALU profiles" note="Soleal FYn aluminium profiles." rows={groupedRowsFor(TECHNAL_FYN_DATABASE, "profiles")} section="price-technal" databaseId={TECHNAL_FYN_DATABASE} prefix="FYn-" collapseId="fyn-profiles" />}
        {!movedOriginalPriceTableIds.includes("fy-profiles") && <PriceTable title="FY · ALU profiles" note="Soleal FY aluminium profiles." rows={groupedRowsFor(TECHNAL_FY_DATABASE, "profiles")} section="price-technal" databaseId={TECHNAL_FY_DATABASE} prefix="FY-" collapseId="fy-profiles" />}
        {!movedOriginalPriceTableIds.includes("soleal-accessories") && <PriceTable title="Accessories" note="Accessories for all Soleal doors and windows systems." rows={[TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].flatMap((databaseId) => groupedRowsFor(databaseId, "accessories"))} section="price-technal" databaseId="soleal-accessories" prefix="A-" collapseId="soleal-accessories" />}
        {!movedOriginalPriceTableIds.includes("soleal-joints") && <PriceTable title="Joints" note="Joints for all Soleal doors and windows systems." rows={rowsFor(SOLEAL_JOINTS_DATABASE)} section="price-technal" databaseId={SOLEAL_JOINTS_DATABASE} prefix="J-" collapseId="soleal-joints" />}</>}
      </section>
    </div>;
  };

  // CostingFinancials relocated to modules/costing/ui/CostingFinancials.tsx (Phase 10 extraction).

  const ExcelWorkspace = () => {
    const sampleRows = [
      { Item: "Aluminium profile", Quantity: 24, UnitPrice: 18.5, Total: "=B2*C2" },
      { Item: "Glass panel", Quantity: 12, UnitPrice: 42, Total: "=B3*C3" },
      { Item: "Installation", Quantity: 8, UnitPrice: 30, Total: "=B4*C4" },
    ];
    return (
      <section className="excel-page" aria-labelledby="excel-page-title">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Standalone test area</p>
            <h1 id="excel-page-title">Excel</h1>
            <p>Syncfusion Spreadsheet is running independently from your tender workspace.</p>
          </div>
        </header>
        <div className="excel-workspace">
          <SpreadsheetComponent
            aria-label="Excel spreadsheet test workspace"
            showRibbon
            showFormulaBar
            showSheetTabs
            allowEditing
            allowUndoRedo
          >
            <SheetsDirective>
              <SheetDirective name="Test Sheet" selectedRange="A1:D4">
                <RangesDirective>
                  <RangeDirective dataSource={sampleRows} startCell="A1" />
                </RangesDirective>
              </SheetDirective>
            </SheetsDirective>
          </SpreadsheetComponent>
        </div>
      </section>
    );
  };

  const AmaHome = () => (
    <main className="ama-home" aria-labelledby="ama-home-title">
      <section className="ama-home-content">
        <div className="ama-wordmark">
          <img className="ama-company-logo" src="/brand/atelier-moderne-logo.png" alt="L’Atelier Moderne de l’Aluminium" />
        </div>
        <p className="eyebrow">Internal operations</p>
        <h1 id="ama-home-title">AMA Team Workspace</h1>
        <p className="ama-home-intro">Choose a workspace for your team.</p>
        <div className="ama-service-list">
          <button className="ama-service-card" type="button" onClick={() => setScreen("database")}>
            <span className="ama-service-icon"><Icon name="box" size={34} /></span>
            <span><b>Estimation Service</b><small>Prepare estimates and quotations for clients</small></span>
            <Icon name="arrow" size={20} />
          </button>
          <button className="ama-service-card" type="button" onClick={() => { setSidebarCollapsed(false); setActiveDatabaseId("prices"); setScreen("stock"); }}>
            <span className="ama-service-icon ama-stock-order-icon"><Icon name="warehouse" size={26} /><Icon name="order" size={20} /></span>
            <span><b>AMA Stock</b><small>Manage internal stock</small></span>
            <Icon name="arrow" size={20} />
          </button>
          <button
            className="ama-service-card"
            type="button"
            onClick={() => {
              setSidebarCollapsed(false);
              setScreen("execution-projects");
            }}
          >
            <span className="ama-service-icon"><Icon name="folder" size={30} /></span>
            <span><b>Projects Under Execution</b><small>Create, manage, and track company projects</small></span>
            <Icon name="arrow" size={20} />
          </button>
        </div>
      </section>
    </main>
  );

  const Library = ({ type }: { type: "material" | "assembly" }) => {
    const isPriceBook = type === "material" && activeDatabaseId === "prices";
    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">
              {type === "material"
                ? activeDatabase.eyebrow
                : "Product component library"}
            </p>
            <h1>{type === "material" ? activeDatabase.title : "Assemblies"}</h1>
            <p className="intro">
              {type === "material"
                ? activeDatabase.description
                : "Larger components built from one or more materials."}
            </p>
          </div>
          {!isPriceBook && <button className="primary-button" onClick={() => { if (activeDatabaseId === "glass") setMaterialDatabaseOverride("glass"); openModal(type); }}>
            <Icon name="plus" /> {activeDatabaseId === "glass" ? "Add glass" : `Add ${type}`}
          </button>}
        </section>
        <section className="library-panel">
          <div className="toolbar">
            <label className="search-field">
              <Icon name="search" size={17} />
              <span className="sr-only">Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${type}s`}
              />
            </label>
            <span className="item-count">
              {filtered.length} {type}s
            </span>
            {type === "material" && <span className="table-zoom-readout">Table {tableZoom}% · Ctrl + scroll</span>}
            {type === "material" && !isPriceBook && <div className="view-switch" role="group" aria-label="Material view">
              <button className={materialView === "list" ? "selected" : ""} onClick={() => setMaterialView("list")}>List</button>
              <button className={materialView === "cards" ? "selected" : ""} onClick={() => setMaterialView("cards")}>Cards</button>
            </div>}
          </div>
          {type === "material" && (materialView === "list" || isPriceBook) ? <div className={`material-list table-zoomable ${activeDatabaseId === "glass" ? "glass-price-list" : ""}`} style={tableStyle} onWheel={zoomTable} role="table" aria-label={isPriceBook ? "Central price book" : "Materials"}>
            <div className="material-list-header" role="row">{isPriceBook ? <><span>Material</span><span>Code</span><span>Component database</span><span>Unit</span><span>Rate / unit</span><span /></> : activeDatabaseId === "glass" ? <><span>Glass and composition</span><span>Thickness</span><span>Unit</span><span>Rate / sqm</span><span>Actions</span></> : <><span>Material</span><span>Code</span><span>Category</span><span>Unit</span><span>Quantity formula</span><span>Actions</span></>}</div>
            {filtered.map((item) => {
              const material = item as Material;
              return <div className="material-list-row" role="row" key={material.id}>
                <span className="material-list-name"><Sketch path={material.sketch} label={material.name} /><b>{material.name}</b>{activeDatabaseId === "glass" && <>{material.description && <small className="glass-description">{material.description}</small>}{material.options?.[0] && <small className="glass-composition" title={material.options[0]}>{material.options[0]}</small>}</>}{activeDatabaseId !== "glass" && material.manufacturer && <small>{material.manufacturer}</small>}</span>
                {!isPriceBook && activeDatabaseId === "glass" && <span className="glass-thickness">{inferGlassThickness(material) || "—"}</span>}
                {isPriceBook ? <><span>{material.code}</span><span>{material.category}</span><span>{material.unit}</span><span><input className="price-book-input" aria-label={`Price for ${material.name}`} type="number" min="0" step="any" defaultValue={material.cost} onBlur={(event) => setMaterials((items) => items.map((value) => value.id === material.id ? { ...value, cost: Math.max(0, Number(event.target.value) || 0) } : value))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> $</span><span /></> : <><span>{material.code}</span><span>{material.category}</span><span>{material.unit}</span><span className="formula-cell">{activeDatabaseId === "glass" ? `${money(material.cost)} / m²` : material.quantityFormula || "No formula"}</span><span className="material-list-actions"><button onClick={() => openModal("material", material.id)} aria-label={`Edit ${material.name}`}><Icon name="edit" size={15} /></button><PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_MATERIAL}><button className="danger" onClick={() => remove("material", material.id)} aria-label={`Delete ${material.name}`}><Icon name="trash" size={15} /></button></PermissionGate></span></>}
              </div>;
            })}
          </div> : <div className="material-grid">
            {filtered.map((item) => (
              <article className="material-card" key={item.id}>
                <div className="card-art">
                  <Sketch path={item.sketch} label={item.name} />
                </div>
                <div className="card-content">
                  <div className="material-meta">
                    <span>{item.category}</span>
                    <span>{item.code}</span>
                    {item.manufacturer && <span>{item.manufacturer}</span>}
                  </div>
                  <h2>{item.name}</h2>
                  {type === "material" ? (
                    <div className="property-chips">
                      {(item as Material).properties.map((p) => (
                        <span key={p}>{p}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="parts-summary">
                      {(item as unknown as Assembly).parts.length} material types
                    </p>
                  )}
                  <div className="card-actions">
                    <button onClick={() => openModal(type, item.id)}>
                      <Icon name="edit" size={15} /> Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => remove(type, item.id)}
                    >
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <button className="add-card" onClick={() => openModal(type)}>
              <span>
                <Icon name="plus" size={22} />
              </span>
              <strong>Add a {type}</strong>
              <small>
                {type === "material"
                  ? "Create a reusable material"
                  : "Combine materials into an assembly"}
              </small>
            </button>
          </div>}
        </section>
      </>
    );
  };
  const AssemblyLibrary = () => {
    const systemName = activeAssemblySystem === "technal" ? "Technal" : "Sidem";
    const isTwoRailWindowPage = activeDatabaseId === TWO_RAIL_WINDOW_PAGE;
    const isFlyScreenPage = activeDatabaseId === FLY_SCREEN_PAGE;
    const isHingeWindowPage = activeDatabaseId === HINGE_WINDOW_PAGE;
    const isFixedWindowPage = activeDatabaseId === FIXED_WINDOW_PAGE;
    const isTiltAndTurnPage = activeDatabaseId === TILT_AND_TURN_PAGE;
    const activeAssemblyDatabase = componentDatabases.find((database) => database.id === activeDatabaseId);
    const activeSubcategory = activeAssemblyDatabase?.parent === activeAssemblySystem ? activeAssemblyDatabase.name : undefined;
    const assemblyCategoryName = isTwoRailWindowPage ? "2 rail system" : isFlyScreenPage ? "Fly screen" : isHingeWindowPage ? "Hinged system" : isFixedWindowPage ? "Fixed window" : isTiltAndTurnPage ? "Tilt and Turn" : activeSubcategory ?? systemName;
    const assemblyQuery = search.trim().toLowerCase();
    const systemAssemblies = assemblies.filter((assembly) =>
      (isTwoRailWindowPage
        ? assembly.assemblyPage === TWO_RAIL_WINDOW_PAGE
        : isFlyScreenPage
          ? assembly.assemblyPage === FLY_SCREEN_PAGE
          : isHingeWindowPage
            ? assembly.assemblyPage === HINGE_WINDOW_PAGE
            : isFixedWindowPage
              ? assembly.assemblyPage === FIXED_WINDOW_PAGE
              : isTiltAndTurnPage
                ? assembly.assemblyPage === TILT_AND_TURN_PAGE
                : activeSubcategory ? assembly.databaseId === activeDatabaseId : assembly.manufacturer?.toLowerCase() === systemName.toLowerCase())
      && `${assembly.name} ${assembly.code}`.toLowerCase().includes(assemblyQuery),
    );
    return <>
      <section className="page-heading">
        <div><p className="eyebrow">Assemblies / {assemblyCategoryName}</p><h1>{assemblyCategoryName} assemblies</h1><p className="intro">Reusable technical components that calculate material quantities from their formulas.</p></div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_ASSEMBLY}>
          <button className="primary-button" onClick={() => openModal("assembly")}><Icon name="plus" /> {isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage ? "Add type" : "Add assembly"}</button>
        </PermissionGate>
      </section>
      <section className="library-panel">
        <div className="toolbar"><label className="search-field"><Icon name="search" size={17} /><span className="sr-only">Search assemblies</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assemblies" /></label><span className="item-count">{systemAssemblies.length} assemblies</span></div>
        <div className={`material-grid ${isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage ? "assembly-type-grid" : ""}`}>
          {systemAssemblies.map((assembly) => <article className="material-card" key={assembly.id}><div className="card-art"><Sketch path={assembly.sketch} label={assembly.name} /></div><div className="card-content"><h2>{assembly.name}</h2><div className="card-actions"><button onClick={() => openModal("assembly", assembly.id)}><Icon name="edit" size={15} /> Edit</button><PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_ASSEMBLY}><button className="danger" onClick={() => remove("assembly", assembly.id)}><Icon name="trash" size={15} /> Delete</button></PermissionGate></div></div></article>)}
          {!systemAssemblies.length && <p className="price-book-empty">No {assemblyCategoryName} assemblies yet. Add one to start building reusable components.</p>}
        </div>
      </section>
    </>;
  };
  const Projects = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Estimation workspace</p>
          <h1>Estimation Projects</h1>
          <p className="intro">
            Create a new project, manage its details, and open its layout
            canvas to add assemblies and drawings.
          </p>
        </div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_PROJECT}>
          <button className="primary-button" onClick={() => openModal("project")}>
            <Icon name="plus" /> New project
          </button>
        </PermissionGate>
      </section>
      <section className="project-list">
        {projects.filter((p) => p.year === activeProjectYear).map((p) => (
          <article className="project-card" key={p.id}>
            <div>
              <p className="eyebrow">{[p.client, p.company, p.location].filter(Boolean).join(" · ") || "No project details"}</p>
              <h2>{p.name}</h2>
              <p>
                {p.items.length} placed technical components
                drawings
              </p>
            </div>
            <div className="project-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setSelectedCanvasId("opening-1");
                  setScreen("canvas");
                }}
              >
                Open canvas <Icon name="arrow" size={16} />
              </button>
              <button
                className="icon-button"
                onClick={() => openModal("project", p.id)}
                aria-label={`Edit ${p.name}`}
              >
                <Icon name="edit" />
              </button>
              <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_PROJECT}>
                <button
                  className="icon-button danger-icon"
                  onClick={() => remove("project", p.id)}
                  aria-label={`Delete ${p.name}`}
                >
                  <Icon name="trash" />
                </button>
              </PermissionGate>
            </div>
          </article>
        ))}
      </section>
    </>
  );
  const ExecutionProjects = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operational workspace</p>
          <h1>Projects Under Execution</h1>
          <p className="intro">This workspace is separate from tender estimates, assemblies, and drawings.</p>
        </div>
        <button className="primary-button" onClick={() => openModal("executionProject")}>
          <Icon name="plus" /> New project
        </button>
      </section>
      <section className="project-list">
        {executionProjects.length ? executionProjects.map((project) => (
          <article className="project-card" key={project.id}>
            <div>
              <p className="eyebrow">{[project.client, project.company, project.location].filter(Boolean).join(" · ") || "No project details"}</p>
              <h2>{project.name}</h2>
              <p>Created {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.createdAt))}</p>
            </div>
            <div className="project-actions">
              <button className="primary-button" onClick={() => openExecutionProject(project.id)}>
                Open project <Icon name="arrow" size={16} />
              </button>
              <button className="secondary-button" onClick={() => copyExecutionProject(project.id)}>
                <Icon name="copy" size={16} /> Copy project
              </button>
              <button className="icon-button danger-icon" onClick={() => removeExecutionProject(project.id)} aria-label={`Delete ${project.name}`}>
                <Icon name="trash" />
              </button>
            </div>
          </article>
        )) : <p className="price-book-empty">No projects under execution yet. Create one to start tracking it here.</p>}
      </section>
    </>
  );
  const ExecutionProjectFiles = () => {
    const project = executionProjects.find((item) => item.id === selectedExecutionProjectId);
    if (!project) return <ExecutionProjects />;
    const files = project.files ?? [];
    // Retain legacy uploads in saved data without displaying them in the tools workspace.
    const currentItems = files.filter((item) => item.type !== "excel" && item.parentId === executionFolderId);
    const itemTypeLabel = (type: ExecutionProjectFile["type"]) => type === "folder" ? "Folder" : type === "optimization-material-order" ? "Optimization & material order" : type === "optimization" ? "Optimization" : type === "material-order" ? "Material order" : "Excel file";
    const folderPath: ExecutionProjectFile[] = [];
    let folder = executionFolderId ? files.find((item) => item.id === executionFolderId && item.type === "folder") : undefined;
    const visited = new Set<string>();
    while (folder && !visited.has(folder.id)) {
      visited.add(folder.id);
      folderPath.unshift(folder);
      const parentId = folder.parentId;
      folder = parentId ? files.find((item) => item.id === parentId && item.type === "folder") : undefined;
    }
    return (
      <>
        <section className="page-heading execution-file-heading">
          <div>
            <button className="back-button" type="button" onClick={() => { setExecutionFolderId(null); setScreen("execution-projects"); }}>All projects</button>
            <p className="eyebrow">Project files</p>
            <h1>{project.name}</h1>
            <p className="intro">{[project.client, project.company, project.location].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="execution-new-menu">
            <button className="primary-button" type="button" onClick={() => setExecutionNewMenuOpen((open) => !open)} aria-expanded={executionNewMenuOpen}>
              <Icon name="plus" size={16} /> New
            </button>
            {executionNewMenuOpen && <div className="execution-new-options" role="menu">
              <button type="button" onClick={() => { setNewExecutionItemName("New folder"); setNewExecutionItemType("folder"); setExecutionNewMenuOpen(false); }}><Icon name="folder" size={17} /><span><b>Folder</b><small>Organize project files</small></span></button>
              <button type="button" onClick={() => { setNewExecutionItemName("New optimization and material order"); setNewExecutionItemType("optimization-material-order"); setExecutionNewMenuOpen(false); }}><Icon name="box" size={17} /><span><b>Optimization &amp; material order</b><small>Create one combined project file</small></span></button>
            </div>}
          </div>
        </section>
        <section className="file-explorer-panel">
          <nav className="file-breadcrumbs" aria-label="Folder path">
            <button type="button" onClick={() => setExecutionFolderId(null)}>Project files</button>
            {folderPath.map((item) => <button type="button" key={item.id} onClick={() => setExecutionFolderId(item.id)}><span>/</span>{item.name}</button>)}
          </nav>
          <div className="file-explorer-list" role="table" aria-label={`${project.name} files`}>
            <div className="file-explorer-header" role="row"><span>Name</span><span>Type</span><span>Created</span><span>Actions</span></div>
            {currentItems.map((item) => <div className="file-explorer-row" role="row" key={item.id}>
              {item.type === "folder" ? <button className="file-name-button" type="button" onDoubleClick={() => setExecutionFolderId(item.id)} onClick={() => setExecutionFolderId(item.id)}><Icon name="folder" size={20} /><b>{item.name}</b></button> : item.type === "optimization-material-order" ? <button className="file-name-button" type="button" onClick={() => openExecutionWorkspace(item.id)}><Icon name="box" size={20} /><b>{item.name}</b></button> : <span className="file-name"><Icon name="box" size={20} /><b>{item.name}</b></span>}
              <span>{itemTypeLabel(item.type)}</span>
              <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.createdAt))}</span>
              <button className="icon-button danger-icon" type="button" onClick={() => removeExecutionProjectItem(item.id)} aria-label={`Delete ${item.name}`}><Icon name="trash" /></button>
            </div>)}
            {!currentItems.length && <div className="file-explorer-empty">This folder is empty. Use New to create a folder or an optimization and material-order file.</div>}
          </div>
        </section>
      </>
    );
  };
  const ExecutionProjectsApp = () => (
    <div className="execution-projects-app">
      <aside className="execution-projects-sidebar">
        <button className="execution-projects-brand" type="button" onClick={() => setScreen("home")} aria-label="Return to AMA services">
          <Icon name="folder" size={22} />
          <span>AMA<br />Projects</span>
        </button>
        <nav aria-label="Projects navigation">
          <button className="active" type="button" onClick={() => { setExecutionFolderId(null); setScreen("execution-projects"); }}><Icon name="folder" /> <span>Projects</span></button>
        </nav>
      </aside>
      <div className="execution-projects-content">
        <header className="execution-projects-topbar">
          <span>{screen === "execution-project-detail" ? executionProjects.find((project) => project.id === selectedExecutionProjectId)?.name ?? "Projects" : "Projects"}</span>
          <ProfileMenu />
        </header>
        <main>{screen === "execution-project-detail" ? <ExecutionProjectFiles /> : <ExecutionProjects />}</main>
      </div>
      {modal?.type === "executionProject" && (
        <div className="dialog-backdrop" onMouseDown={closeModal}>
          <section className="material-dialog" role="dialog" aria-modal="true" aria-labelledby="execution-project-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">New project</p>
                <h2 id="execution-project-dialog-title">Add project</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeModal} aria-label="Close"><Icon name="close" /></button>
            </div>
            <form onSubmit={save}>
              <div className="dialog-form">
                <label>Project name <span>*</span><input autoFocus required value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="Project 1" /></label>
                <label>Client name <span>*</span><input required value={formClient} onChange={(event) => setFormClient(event.target.value)} placeholder="Client" /></label>
                <label>Company name <small>(optional)</small><input value={formCompany} onChange={(event) => setFormCompany(event.target.value)} placeholder="Company" /></label>
                <label>Location <span>*</span><input required value={formLocation} onChange={(event) => setFormLocation(event.target.value)} placeholder="Lebanon" /></label>
              </div>
              <div className="dialog-footer">
                <button className="secondary-button" type="button" onClick={closeModal}>Cancel</button>
                <button className="primary-button" type="submit">Create project</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {newExecutionItemType && (
        <div className="dialog-backdrop" onMouseDown={() => setNewExecutionItemType(null)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="new-project-item-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">Project files</p><h2 id="new-project-item-title">New {newExecutionItemType === "folder" ? "folder" : "optimization and material-order file"}</h2></div><button className="icon-button" type="button" onClick={() => setNewExecutionItemType(null)} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={createExecutionProjectItem}>
              <div className="dialog-form"><label>{newExecutionItemType === "folder" ? "Folder" : "Optimization and material-order file"} name <span>*</span><input autoFocus required value={newExecutionItemName} onChange={(event) => setNewExecutionItemName(event.target.value)} onFocus={(event) => event.currentTarget.select()} /></label></div>
              <div className="dialog-footer"><button className="secondary-button" type="button" onClick={() => setNewExecutionItemType(null)}>Cancel</button><button className="primary-button" type="submit">Create</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
  const ExecutionWorkspaceApp = () => {
    const project = executionProjects.find((item) => item.id === selectedExecutionProjectId);
    const workspace = project?.files.find((item) => item.id === selectedExecutionWorkspaceId && item.type === "optimization-material-order");
    if (!project || !workspace) return <ExecutionProjectsApp />;
    const pages: { id: ExecutionWorkspacePage; label: string; description: string }[] = [
      { id: "cutting-list", label: "Cutting list", description: "Prepare and review the cutting list for this project." },
      { id: "optimization", label: "Optimization", description: "Plan the best use of material lengths and reduce waste." },
      { id: "material-order", label: "Material order", description: "Prepare the materials required for this project." },
      { id: "database", label: "Database", description: "Manage the materials and reference data used by this workspace." },
    ];
    const currentPage = pages.find((page) => page.id === executionWorkspacePage) ?? pages[0];
    const stockSnapshot = workspace.stockSnapshot;
    // This page never reads or writes the live Stock page.  It uses only the
    // copy saved inside this workspace when the file was created.
    const snapshotMaterials = stockSnapshot?.materials ?? [];
    const snapshotAssemblies = stockSnapshot?.assemblies ?? [];
    const snapshotCompanyDatabases = stockSnapshot?.companyDatabases ?? [];
    const snapshotCompanyPriceTables = stockSnapshot?.companyPriceTables ?? [];
    const snapshotMovedOriginalPriceTableIds = stockSnapshot?.movedOriginalPriceTableIds ?? [];
    const stockTabs = [{ id: "prices", label: "Soleal Database" }, ...snapshotCompanyDatabases.map((database) => ({ id: database.id, label: `${database.name} Database` }))];
    const activeWorkspaceStockDatabase = stockTabs.some((tab) => tab.id === workspaceStockDatabaseId) ? workspaceStockDatabaseId : "prices";
    const assemblyUsageByMaterial = new Map<string, string[]>();
    snapshotAssemblies.forEach((assembly) => assembly.parts.forEach((part) => {
      const usage = assemblyUsageByMaterial.get(part.materialId) ?? [];
      if (!usage.includes(assembly.name)) usage.push(assembly.name);
      assemblyUsageByMaterial.set(part.materialId, usage);
    }));
    const snapshotAssemblyTypeNames = [...new Set(snapshotAssemblies.filter((assembly) => assembly.parts.length > 0).map((assembly) => assembly.name))].sort((a, b) => a.localeCompare(b));
    const stockSearch = workspaceStockSearch.trim().toLocaleLowerCase();
    const snapshotRowsFor = (databaseId: string) => snapshotMaterials.filter((material) => material.databaseId === databaseId
      && (!workspaceStockAssemblyType || (assemblyUsageByMaterial.get(material.id) ?? []).includes(workspaceStockAssemblyType))
      && (!stockSearch || [material.name, material.code, material.category, material.manufacturer].filter(Boolean).join(" ").toLocaleLowerCase().includes(stockSearch)));
    const snapshotGeneralRowsFor = (group: "others" | "profiles" | "accessories") => snapshotRowsFor("markups").filter((material) => group === "others" ? !material.priceTable || material.priceTable === "general" : material.priceTable === group);
    const snapshotGroupedRowsFor = (databaseId: string, group: "profiles" | "accessories", legacyProfileCount = 7) => {
      const allRows = snapshotMaterials.filter((material) => material.databaseId === databaseId);
      const legacyProfileIds = new Set(allRows.filter((material) => !material.priceTable).slice(0, legacyProfileCount).map((material) => material.id));
      return snapshotRowsFor(databaseId).filter((material) => material.priceTable === group || (!material.priceTable && (group === "profiles" ? legacyProfileIds.has(material.id) : !legacyProfileIds.has(material.id))));
    };
    const snapshotHasLegacyMovedOthers = snapshotCompanyPriceTables.some((table) => table.companyDatabaseId !== "prices" && table.name.trim().toLowerCase() === "others" && table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === "g");
    const stockTables = activeWorkspaceStockDatabase === "prices"
      ? [
        ...snapshotCompanyPriceTables.filter((table) => table.companyDatabaseId === "prices").map((table) => ({ id: `company-${table.id}`, title: table.name, note: "Materials in this shared Soleal database table.", rows: snapshotRowsFor("prices").filter((material) => material.companyTableId === table.id), prefix: `${table.referencePrefix}-`, section: "price-technal" })),
        ...(!snapshotMovedOriginalPriceTableIds.includes("general-others") && !snapshotHasLegacyMovedOthers ? [{ id: "general-others", title: "Others", note: "Miscellaneous general items.", rows: snapshotGeneralRowsFor("others"), prefix: "G-", section: "price-general" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("general-profiles") ? [{ id: "general-profiles", title: "General ALU profiles", note: "General aluminium profiles.", rows: snapshotGeneralRowsFor("profiles"), prefix: "GP-", section: "price-general" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("general-accessories") ? [{ id: "general-accessories", title: "General ALU accessories", note: "General aluminium accessories.", rows: snapshotGeneralRowsFor("accessories"), prefix: "GA-", section: "price-general" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("gyn-profiles") ? [{ id: "gyn-profiles", title: "GYn · ALU profiles", note: "Soleal GYn aluminium profiles.", rows: snapshotGroupedRowsFor(TECHNAL_GYN_DATABASE, "profiles"), prefix: "GYn-", section: "price-technal" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("gy-profiles") ? [{ id: "gy-profiles", title: "GY · ALU profiles", note: "Soleal GY aluminium profiles.", rows: snapshotGroupedRowsFor(TECHNAL_GY_DATABASE, "profiles"), prefix: "GY-", section: "price-technal" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("fyn-profiles") ? [{ id: "fyn-profiles", title: "FYn · ALU profiles", note: "Soleal FYn aluminium profiles.", rows: snapshotGroupedRowsFor(TECHNAL_FYN_DATABASE, "profiles"), prefix: "FYn-", section: "price-technal" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("fy-profiles") ? [{ id: "fy-profiles", title: "FY · ALU profiles", note: "Soleal FY aluminium profiles.", rows: snapshotGroupedRowsFor(TECHNAL_FY_DATABASE, "profiles"), prefix: "FY-", section: "price-technal" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("soleal-accessories") ? [{ id: "soleal-accessories", title: "Accessories", note: "Accessories for all Soleal doors and windows systems.", rows: [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].flatMap((databaseId) => snapshotGroupedRowsFor(databaseId, "accessories")), prefix: "A-", section: "price-technal" }] : []),
        ...(!snapshotMovedOriginalPriceTableIds.includes("soleal-joints") ? [{ id: "soleal-joints", title: "Joints", note: "Joints for all Soleal doors and windows systems.", rows: snapshotRowsFor(SOLEAL_JOINTS_DATABASE), prefix: "J-", section: "price-technal" }] : []),
      ]
      : snapshotCompanyPriceTables.filter((table) => table.companyDatabaseId === activeWorkspaceStockDatabase).map((table) => ({ id: table.id, title: table.name, note: `Materials in this ${snapshotCompanyDatabases.find((database) => database.id === activeWorkspaceStockDatabase)?.name ?? "company"} table.`, rows: snapshotRowsFor(activeWorkspaceStockDatabase).filter((material) => material.companyTableId === table.id), prefix: `${table.referencePrefix}-`, section: "price-technal" }));
    const stockMaterialCount = new Set(stockTables.flatMap((table) => table.rows.map((material) => material.id))).size;
    const stockEntriesFor = (material: Material) => material.stockEntries?.length
      ? material.stockEntries
      : [{ id: "default", length: material.stockLength ?? 0, quantity: material.stockQuantity ?? 0 }];
    const saveWorkspaceStockEntries = (materialId: string, entries: { id: string; length: number; quantity: number }[]) => {
      if (!entries.length) return;
      setExecutionProjects((projects) => projects.map((item) => item.id !== project.id ? item : {
        ...item,
        files: item.files.map((file) => file.id !== workspace.id || !file.stockSnapshot ? file : {
          ...file,
          stockSnapshot: {
            ...file.stockSnapshot,
            materials: file.stockSnapshot.materials.map((material) => material.id !== materialId ? material : {
              ...material,
              stockEntries: entries,
              stockLength: entries[0].length,
              stockQuantity: entries[0].quantity,
            }),
          },
        }),
      }));
    };
    const saveWorkspaceMaterialMass = (materialId: string, value: string) => {
      const weight = Math.max(0, Number(value) || 0);
      setExecutionProjects((projects) => projects.map((item) => item.id !== project.id ? item : {
        ...item,
        files: item.files.map((file) => file.id !== workspace.id || !file.stockSnapshot ? file : {
          ...file,
          stockSnapshot: {
            ...file.stockSnapshot,
            materials: file.stockSnapshot.materials.map((material) => material.id === materialId ? { ...material, weight } : material),
          },
        }),
      }));
    };
    const matchWorkspaceStockWithCurrent = () => {
      if (!confirm(`Match ${workspace.name} with the current Stock page? This replaces this workspace's saved stock tables, quantities, and mass with the current Stock values.`)) return;
      const capturedAt = new Date().toISOString();
      setExecutionProjects((projects) => projects.map((item) => item.id !== project.id ? item : {
        ...item,
        files: item.files.map((file) => file.id !== workspace.id ? file : {
          ...file,
          stockSnapshot: {
            materials: JSON.parse(JSON.stringify(materials)) as Material[],
            assemblies: JSON.parse(JSON.stringify(assemblies)),
            componentDatabases: JSON.parse(JSON.stringify(componentDatabases)),
            companyDatabases: JSON.parse(JSON.stringify(companyDatabases)),
            companyPriceTables: JSON.parse(JSON.stringify(companyPriceTables)),
            movedOriginalPriceTableIds: JSON.parse(JSON.stringify(movedOriginalPriceTableIds)),
            capturedAt,
          },
        }),
      }));
      setWorkspaceStockDatabaseId("prices");
      setWorkspaceStockSearch("");
      setWorkspaceStockAssemblyType("");
    };
    const profileMaterials = (() => {
      const all = snapshotMaterials.filter((material) => material.databaseId !== "glass");
      const lengthMaterials = all.filter((material) => ["m", "lm"].includes(material.unit.toLowerCase()));
      return (lengthMaterials.length ? lengthMaterials : all).sort((left, right) => `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`));
    })();
    const optimization = workspace.optimization ?? { stockLength: 6000, kerf: 3, trim: 10, arrangements: 1000, cuts: [], recommendationMinimum: 4000, recommendationMaximum: 8000, recommendationIncrement: 100 };
    const updateWorkspaceOptimization = (changes: Partial<NonNullable<ExecutionProjectFile["optimization"]>>) => setExecutionProjects((projects) => projects.map((item) => item.id !== project.id ? item : {
      ...item,
      files: item.files.map((file) => file.id !== workspace.id ? file : { ...file, optimization: { ...optimization, ...changes } }),
    }));
    const optimizationCutForMaterial = (material?: Material): OptimizationCut => ({
      id: makeId(),
      openingName: "",
      profileId: material?.id ?? "",
      profileName: material?.name ?? "",
      profileCode: material?.code ?? "",
      length: 0,
      quantity: 1,
      angle: 90,
    });
    const setOptimizationCuts = (cuts: OptimizationCut[]) => updateWorkspaceOptimization({ cuts, result: undefined, recommendation: undefined });
    const updateOptimizationCut = (cutId: string, changes: Partial<OptimizationCut>) => setOptimizationCuts(optimization.cuts.map((cut) => cut.id === cutId ? { ...cut, ...changes } : cut));
    const WorkspaceCuttingListPage = () => <section className="workspace-cutting-list-page">
      <CuttingListSpreadsheet profileCatalog={profileMaterials.map((material) => ({ code: material.code, name: material.name, photo: material.sketch }))} />
    </section>;
    const generateWorkspaceOptimization = () => {
      try {
        const result = optimizeCuts(optimization);
        updateWorkspaceOptimization({ result, recommendation: undefined });
        setWorkspaceOptimizationError("");
      } catch (error) {
        setWorkspaceOptimizationError(error instanceof Error ? error.message : "Unable to generate the optimization.");
      }
    };
    const findWorkspaceBestStockLength = () => {
      try {
        const recommendation = recommendStockLength({
          minimum: optimization.recommendationMinimum ?? 4000,
          maximum: optimization.recommendationMaximum ?? 8000,
          increment: optimization.recommendationIncrement ?? 100,
          kerf: optimization.kerf,
          trim: optimization.trim,
          cuts: optimization.cuts,
        });
        if (!recommendation) throw new Error("No stock length in this range can fit every required cut.");
        updateWorkspaceOptimization({ recommendation });
        setWorkspaceOptimizationError("");
      } catch (error) {
        setWorkspaceOptimizationError(error instanceof Error ? error.message : "Unable to find a stock-length recommendation.");
      }
    };
    const WorkspaceOptimizationPage = () => <section className="workspace-optimizer">
      <section className="workspace-optimizer-settings">
        <div><p className="eyebrow">Cutting optimization</p><h2>Generate the best cutting plan</h2><p>Enter the required cuts in millimeters. The engine keeps each profile separate and tries up to the selected number of arrangements per profile.</p></div>
        <div className="workspace-optimizer-settings-grid">
          <label>Stock length <span>mm</span><input type="number" min="1" step="1" value={optimization.stockLength || ""} onChange={(event) => updateWorkspaceOptimization({ stockLength: Math.max(0, Number(event.target.value) || 0), result: undefined, recommendation: undefined })} /></label>
          <label>Saw kerf <span>mm</span><input type="number" min="0" step="0.1" value={optimization.kerf || ""} onChange={(event) => updateWorkspaceOptimization({ kerf: Math.max(0, Number(event.target.value) || 0), result: undefined, recommendation: undefined })} /></label>
          <label>End trim <span>mm</span><input type="number" min="0" step="0.1" value={optimization.trim || ""} onChange={(event) => updateWorkspaceOptimization({ trim: Math.max(0, Number(event.target.value) || 0), result: undefined, recommendation: undefined })} /></label>
          <label>Search depth<select value={optimization.arrangements} onChange={(event) => updateWorkspaceOptimization({ arrangements: Number(event.target.value), result: undefined, recommendation: undefined })}><option value={100}>Fast · 100 arrangements</option><option value={1000}>Standard · 1,000 arrangements</option><option value={5000}>Deep · 5,000 arrangements</option></select></label>
        </div>
      </section>
      <section className="workspace-cut-list">
        <header><div><h2>Required cuts</h2><p>Use the profiles from this workspace’s independent Stock snapshot.</p></div><button type="button" className="secondary-button" onClick={() => { if (!profileMaterials.length) { setWorkspaceOptimizationError("No profiles are available in this workspace Stock snapshot."); return; } setOptimizationCuts([...optimization.cuts, optimizationCutForMaterial(profileMaterials[0])]); }}><Icon name="plus" size={15} /> Add cut</button></header>
        <div className="workspace-cut-grid" role="table"><div className="workspace-cut-grid-header" role="row"><span>Opening / item</span><span>Profile</span><span>Cut length</span><span>Qty</span><span>Angle</span><span /></div>{optimization.cuts.map((cut) => <div className="workspace-cut-grid-row" role="row" key={cut.id}><span><input aria-label="Opening or item" value={cut.openingName} placeholder="e.g. Window A" onChange={(event) => updateOptimizationCut(cut.id, { openingName: event.target.value })} /></span><span><select aria-label="Profile" value={cut.profileId} onChange={(event) => { const material = profileMaterials.find((item) => item.id === event.target.value); updateOptimizationCut(cut.id, { profileId: material?.id ?? "", profileName: material?.name ?? "", profileCode: material?.code ?? "" }); }}><option value="">Choose profile</option>{profileMaterials.map((material) => <option key={material.id} value={material.id}>{material.code} · {material.name}</option>)}</select></span><span className="workspace-cut-length"><input aria-label="Cut length in millimeters" type="number" min="0.1" step="0.1" value={cut.length || ""} onChange={(event) => updateOptimizationCut(cut.id, { length: Math.max(0, Number(event.target.value) || 0) })} /><em>mm</em></span><span><input aria-label="Quantity" type="number" min="1" step="1" value={cut.quantity || ""} onChange={(event) => updateOptimizationCut(cut.id, { quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) })} /></span><span><select aria-label="Cut angle" value={cut.angle} onChange={(event) => updateOptimizationCut(cut.id, { angle: Number(event.target.value) as 45 | 90 })}><option value={90}>90°</option><option value={45}>45°</option></select></span><span><button className="icon-button danger" type="button" aria-label="Delete cut" onClick={() => setOptimizationCuts(optimization.cuts.filter((item) => item.id !== cut.id))}><Icon name="trash" size={15} /></button></span></div>)}{!optimization.cuts.length && <p className="workspace-cut-empty">Add the first required cut to generate an optimization.</p>}</div>
        {workspaceOptimizationError && <p className="workspace-optimization-error" role="alert">{workspaceOptimizationError}</p>}
        <div className="workspace-optimizer-actions"><button type="button" className="primary-button" onClick={generateWorkspaceOptimization}><Icon name="box" size={16} /> Generate optimized plan</button><button type="button" className="secondary-button" onClick={findWorkspaceBestStockLength}>Find best stock length</button></div>
      </section>
      <section className="workspace-stock-advisor"><div><b>Best stock length advisor</b><span>Tests the selected range with the fast optimizer, then you can use the recommended length for the full arrangement search.</span></div><label>Minimum<input type="number" min="1" step="100" value={optimization.recommendationMinimum ?? 4000} onChange={(event) => updateWorkspaceOptimization({ recommendationMinimum: Math.max(0, Number(event.target.value) || 0) })} /></label><label>Maximum<input type="number" min="1" step="100" value={optimization.recommendationMaximum ?? 8000} onChange={(event) => updateWorkspaceOptimization({ recommendationMaximum: Math.max(0, Number(event.target.value) || 0) })} /></label><label>Step<input type="number" min="1" step="10" value={optimization.recommendationIncrement ?? 100} onChange={(event) => updateWorkspaceOptimization({ recommendationIncrement: Math.max(1, Number(event.target.value) || 100) })} /></label>{optimization.recommendation && <div className="workspace-stock-recommendation"><strong>{number(optimization.recommendation.length)} mm recommended</strong><span>{optimization.recommendation.result.bars.length} bars · {number(optimization.recommendation.result.utilization, 1)}% utilization</span><button type="button" onClick={() => updateWorkspaceOptimization({ stockLength: optimization.recommendation!.length, result: undefined })}>Use this length</button></div>}</section>
      {optimization.result && <section className="workspace-optimization-result"><header><div><p className="eyebrow">Optimized result</p><h2>Cutting plan</h2><p>{optimization.result.minimumProven ? "The lower bound was reached for every profile." : `Best result after up to ${optimization.result.arrangements.toLocaleString()} arrangements per profile.`}</p></div><div className="workspace-optimization-metrics"><span><b>{optimization.result.bars.length}</b>stock bars</span><span><b>{number(optimization.result.utilization, 1)}%</b>utilization</span><span><b>{number(optimization.result.waste / 1000, 2)} m</b>offcut</span></div></header><div className="workspace-bar-list">{optimization.result.bars.map((bar, index) => <article className="workspace-bar" key={bar.id}><div className="workspace-bar-heading"><b>{bar.profileCode || bar.profileName} · Bar {String(index + 1).padStart(2, "0")}</b><span>{number(bar.used, 1)} mm used · {number(bar.waste, 1)} mm offcut</span></div><div className="workspace-bar-visual">{bar.pieces.map((piece) => <span key={piece.id} style={{ width: `${Math.max(2, piece.length / optimization.result!.stockLength * 100)}%` }} title={`${piece.openingName || piece.profileName}: ${number(piece.length)} mm`}>{piece.openingName || piece.profileCode}</span>)}<i style={{ width: `${Math.max(0, bar.waste / optimization.result!.stockLength * 100)}%` }} /></div><p>{bar.pieces.map((piece) => `${piece.openingName || piece.profileCode} · ${number(piece.length)} mm · ${piece.angle}°`).join("  |  ")}</p></article>)}</div></section>}
    </section>;
    return (
      <div className="execution-workspace-app">
        <aside className="execution-workspace-sidebar">
          <button className="execution-projects-brand" type="button" onClick={() => setScreen("execution-project-detail")} aria-label="Return to project files">
            <Icon name="arrow" size={20} />
            <span>Project<br />workspace</span>
          </button>
          <p>{workspace.name}</p>
          <nav aria-label="Workspace pages">
            {pages.map((page) => <button key={page.id} type="button" className={executionWorkspacePage === page.id ? "active" : ""} onClick={() => setExecutionWorkspacePage(page.id)}><Icon name={page.id === "material-order" ? "order" : page.id === "database" ? "layers" : "box"} size={18} /><span>{page.label}</span></button>)}
          </nav>
        </aside>
        <div className={`execution-workspace-content${currentPage.id === "cutting-list" ? " execution-workspace-content--cutting-list" : ""}`}>
          {currentPage.id !== "cutting-list" && <header className="execution-projects-topbar"><span>{workspace.name}</span><ProfileMenu /></header>}
          <main className={`execution-workspace-main${currentPage.id === "cutting-list" ? " execution-workspace-main--cutting-list" : ""}`}>
            {currentPage.id !== "cutting-list" && <>
              <button className="back-button" type="button" onClick={() => setScreen("execution-project-detail")}>Project files</button>
              <p className="eyebrow">{project.name}</p>
              <h1>{currentPage.label}</h1>
              <p className="intro">{currentPage.description}</p>
            </>}
            {currentPage.id === "cutting-list" ? WorkspaceCuttingListPage() : currentPage.id === "optimization" ? WorkspaceOptimizationPage() : currentPage.id === "database" ? stockSnapshot ? (
              <section className="workspace-stock-page">
                <div className="workspace-stock-tabs" role="tablist" aria-label="Workspace stock databases">
                  {stockTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeWorkspaceStockDatabase === tab.id} className={activeWorkspaceStockDatabase === tab.id ? "active" : ""} onClick={() => setWorkspaceStockDatabaseId(tab.id)}>{tab.label}</button>)}
                </div>
                <section className="library-panel price-book-panel workspace-stock-panel">
                  <div className="workspace-stock-notice"><div><b>Stock snapshot</b><span>Captured {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stockSnapshot.capturedAt))}. This is the same Stock table structure, saved independently for {workspace.name}.</span></div><div className="workspace-stock-notice-actions"><strong>{stockMaterialCount} materials</strong><button type="button" onClick={matchWorkspaceStockWithCurrent}>Match with current Stock</button></div></div>
                  <div className="toolbar">
                    <label className="search-field"><Icon name="search" size={17} /><span className="sr-only">Search workspace stock</span><input value={workspaceStockSearch} onChange={(event) => setWorkspaceStockSearch(event.target.value)} placeholder={`Search ${stockTabs.find((tab) => tab.id === activeWorkspaceStockDatabase)?.label ?? "database"}`} /></label>
                    <label className="assembly-type-filter"><span>Assembly type</span><select value={workspaceStockAssemblyType} onChange={(event) => setWorkspaceStockAssemblyType(event.target.value)}><option value="">All assembly types</option>{snapshotAssemblyTypeNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                    <span className="item-count">{stockMaterialCount} materials</span>
                  </div>
                  {stockTables.map((table) => <section className={`price-book-section ${table.section} stock-book-section workspace-stock-section`} key={table.id}>
                    <header className="price-book-section-header"><div><h2>{table.title}</h2><p>{table.note}</p></div><div className="price-book-section-actions"><span>{table.rows.length}</span></div></header>
                    <div className="material-list price-book-table stock-book-table workspace-stock-table" role="table" aria-label={`${table.title} stock`}>
                      <div className="material-list-header" role="row"><span>Ref.</span><span>Profile photo / name</span><span>Profile ref.</span><span>Used in assembly type</span><span>Unit</span><span>Mass / length</span><span>Stock length</span><span>Qty</span></div>
                      {table.rows.map((material, index) => {
                        const entries = stockEntriesFor(material);
                        const updateEntry = (entryId: string, field: "length" | "quantity", value: string) => saveWorkspaceStockEntries(material.id, entries.map((entry) => entry.id === entryId ? { ...entry, [field]: Math.max(0, Number(value) || 0) } : entry));
                        const usageText = (assemblyUsageByMaterial.get(material.id) ?? []).join(", ");
                        return <div className="material-list-row" role="row" key={material.id}>
                          <span className="price-reference">{table.prefix}{index + 1}</span>
                          <span className="material-list-name"><span className="price-photo-cell"><Sketch path={material.sketch} label={material.name} /></span><b>{material.name}</b>{material.manufacturer && <small>{material.manufacturer}</small>}</span>
                          <span>{material.code || "—"}</span><span className="assembly-usage" title={usageText || "Not used in an assembly type"}>{usageText || "Not used"}</span><span>{material.unit}</span><span className="stock-mass-cell"><input className="stock-input" aria-label={`Mass per length for ${material.name}`} type="number" min="0" step="any" value={material.weight || ""} onChange={(event) => saveWorkspaceMaterialMass(material.id, event.target.value)} /><em>{["m", "lm"].includes(material.unit.toLowerCase()) ? "kg/m" : "kg/unit"}</em></span>
                          <span className="stock-cell stock-entry-list">{entries.map((entry) => <span className="stock-entry-row" key={entry.id}><input className="stock-input" aria-label={`Stock length for ${material.name}`} type="number" min="0" step="any" value={entry.length || ""} onChange={(event) => updateEntry(entry.id, "length", event.target.value)} onContextMenu={(event) => { event.preventDefault(); setStockLengthMenu({ materialId: material.id, entryId: entry.id }); }} /><em>m</em>{stockLengthMenu?.materialId === material.id && stockLengthMenu.entryId === entry.id && <span className="stock-length-menu" role="menu"><button type="button" onClick={() => { saveWorkspaceStockEntries(material.id, [...entries, { id: makeId(), length: 0, quantity: 0 }]); setStockLengthMenu(null); }}>Add another stock length</button>{entries.length > 1 && <button type="button" className="danger" onClick={() => { saveWorkspaceStockEntries(material.id, entries.filter((value) => value.id !== entry.id)); setStockLengthMenu(null); }}>Delete stock length</button>}</span>}</span>)}</span>
                          <span className="stock-cell stock-entry-list">{entries.map((entry) => <span className="stock-entry-row" key={entry.id}><input className="stock-input" aria-label={`Stock quantity for ${material.name}`} type="number" min="0" step="1" value={entry.quantity || ""} onChange={(event) => updateEntry(entry.id, "quantity", event.target.value)} /></span>)}</span>
                        </div>;
                      })}
                      {!table.rows.length && <p className="price-book-empty">No materials in this price group yet.</p>}
                    </div>
                  </section>)}
                  {!stockTables.length && <p className="price-book-empty">No tables are saved in this database snapshot.</p>}
                </section>
              </section>
            ) : <section className="execution-workspace-empty"><Icon name="layers" size={34} /><h2>No stock snapshot</h2><p>This workspace was created before stock snapshots were added. Create a new workspace to capture the current Stock page.</p></section> : <section className="execution-workspace-empty"><Icon name={currentPage.id === "material-order" ? "order" : "box"} size={34} /><h2>{currentPage.label}</h2><p>This page is ready for its project tools.</p></section>}
          </main>
        </div>
      </div>
    );
  };
  const Canvas = () =>
    !project ? (
      <Projects />
    ) : (
      <section className="canvas-page">
        <div className="canvas-heading">
          <div>
            <button
              className="back-button"
              onClick={() => setScreen("projects")}
            >
              Projects
            </button>
            <h1>{project.name}</h1>
            <p>{[project.client, project.company, project.location].filter(Boolean).join(" · ") || "No project details"}</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => openModal("project", project.id)}
          >
            <Icon name="edit" size={16} /> Project details
          </button>
        </div>
        <div
          className={`canvas-layout ${inspectorCollapsed ? "inspector-collapsed" : ""} ${canvasExpanded ? "canvas-expanded" : ""}`}
          style={{ gridTemplateColumns: "minmax(620px, 1fr)" }}
          onPointerMove={resizeInspector}
          onPointerUp={() => setInspectorResize(null)}
          onPointerLeave={() => setInspectorResize(null)}
        >
          <div className="canvas-workspace">
            <div
              className="canvas-toolbar"
              role="toolbar"
              aria-label="Technical drawing tools"
            >
              <div className="canvas-action-stack">
                <button onClick={undoCanvasChange} disabled={!undoProjectHistory.length} title="Undo (Ctrl+Z)">Undo</button>
                <button onClick={redoCanvasChange} disabled={!redoProjectHistory.length} title="Redo (Ctrl+Y)">Redo</button>
                <button onClick={() => setDrawingView({ x: 0, y: 0, zoom: 1 })}>Fit drawing</button>
                <button className="canvas-expand-button" onClick={() => setCanvasExpanded((expanded) => !expanded)}>{canvasExpanded ? "Exit full canvas" : "Full canvas"}</button>
                <label className="canvas-markup-picker"><span>Markup type</span><select value={selectedMarkupType} onChange={(event) => setCanvasMarkupType(event.target.value as "typeA" | "typeB" | "typeC")} aria-label="Markup type for this opening"><option value="typeA">Type A</option><option value="typeB">Type B</option><option value="typeC">Type C</option></select></label>
              </div>
              {joinModeItemId && <>
                <span className="toolbar-divider" />
                <span className="join-mode-hint">{joinFeedback || "Drag a corner to join. Real joins are detected automatically."}</span>
                <button className="join-mode-explode" onClick={explodeJoinedOpening}>Explode combination</button>
                <button className="join-mode-exit" onClick={() => { setJoinModeItemId(null); setInteraction(null); setCanvasPreviewItems(null); setJoinStretchMeasurement(null); joinResizeCommitRef.current = false; setJoinFeedback(""); }}>Exit join</button>
              </>}
              <div className="window-tool-grid">
              <button
                className={`drawing-tool-window ${drawingMode === "two-rail" ? "selected" : ""}`}
                onClick={() => { setDrawingMode("two-rail"); setCursorWindowPreview(null); }}
                title="Move the window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="2" y="2" width="48" height="28" /><rect x="6" y="6" width="18" height="20" /><rect x="28" y="6" width="18" height="20" /><path d="M26 2V30M8 22H20M32 10H44" /></svg>
                <span>2 Rail System</span>
              </button>
              <button
                className={`drawing-tool-window ${drawingMode === "fly-screen" ? "selected" : ""}`}
                onClick={() => { setDrawingMode("fly-screen"); setCursorWindowPreview(null); }}
                title="Move the fly screen with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="2" y="2" width="48" height="28" /><rect x="6" y="6" width="40" height="20" /><path d="M14 6V26M22 6V26M30 6V26M38 6V26M6 11H46M6 16H46M6 21H46" /></svg>
                <span>Fly screen</span>
              </button>
              <button
                className={`drawing-tool-window ${drawingMode === "hinge-window" ? "selected" : ""}`}
                onClick={() => { setDrawingMode("hinge-window"); setCursorWindowPreview(null); }}
                title="Move the hinged window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="2" y="2" width="48" height="28" /><rect x="6" y="5" width="19" height="22" /><rect x="27" y="5" width="19" height="22" /><path d="M6 5L25 16L6 27M46 5L27 16L46 27" strokeDasharray="5 3" /><path d="M26 3V29" /></svg>
                <span>Hinged System</span>
              </button>
              <button
                className={`drawing-tool-window ${drawingMode === "fixed-window" ? "selected" : ""}`}
                onClick={() => { setDrawingMode("fixed-window"); setCursorWindowPreview(null); }}
                title="Move the fixed window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="2" y="2" width="48" height="28" /><rect x="6" y="6" width="40" height="20" /><path d="M20 16H32M26 10V22" /></svg>
                <span>Fixed window</span>
              </button>
              <button
                className={`drawing-tool-window ${drawingMode === "tilt-and-turn" ? "selected" : ""}`}
                onClick={() => { setDrawingMode("tilt-and-turn"); setCursorWindowPreview(null); }}
                title="Move the Tilt and Turn window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="2" y="2" width="48" height="28" /><rect x="6" y="6" width="40" height="20" /><path d="M6 6L46 16M6 26L26 6L46 26M6 26L46 16" strokeDasharray="5 3" /></svg>
                <span>Tilt and Turn</span>
              </button>
              <button
                className={`drawing-tool-window glass-add-tool ${takeoffPanel === "glassLibrary" ? "selected" : ""}`}
                onClick={() => { setTakeoffPanel((panel) => panel === "glassLibrary" ? null : "glassLibrary"); setGlassRemovalMode(false); setDrawingMode("select"); setJoinModeItemId(null); setInteraction(null); }}
                title="Choose glass, then click window areas to apply it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true"><rect x="6" y="3" width="40" height="26" /><path d="M17 21L26 12M21 24L30 15M30 19L37 12M34 22L41 15" /></svg>
                <span>Glass</span>
              </button>
              </div>
              {(drawingMode === "two-rail" || drawingMode === "fly-screen" || drawingMode === "hinge-window" || drawingMode === "fixed-window" || drawingMode === "tilt-and-turn") && <span className="tool-instruction">Move cursor, then click to place</span>}
              <section className="canvas-cost-summary" aria-label="Drawing cost summary">
                <header><strong>Cost summary</strong></header>
                <div><span>Material takeoff</span><b>{money(materialTakeoffTotal)}</b></div>
                <div><span>Glass takeoff</span><b>{money(glassTakeoffTotal)}</b></div>
                <div><span>Manpower</span><b>{money(manpowerTotal)}</b></div>
                <div className="direct-cost"><span>Direct cost</span><b>{money(directCost)}</b></div>
                <div className="selling-cost"><span>Selling cost · {selectedMarkupName} ({number(selectedMarkupRate)}%)</span><b>{money(sellingPriceFromDirectCost(directCost, selectedMarkupRate))}</b></div>
              </section>
              <div className="canvas-bottom-tools"><button className={takeoffPanel === "material" ? "selected" : ""} onClick={() => { setItemMaterialPanelId(null); setTakeoffPanel((panel) => panel === "material" ? null : "material"); }}>Material</button><button className={takeoffPanel === "glass" ? "selected" : ""} onClick={() => setTakeoffPanel((panel) => panel === "glass" ? null : "glass")}>Glass</button><button className={takeoffPanel === "manpower" ? "selected" : ""} onClick={() => setTakeoffPanel((panel) => panel === "manpower" ? null : "manpower")}>Manpower</button></div>
              {selectedGlassMaterialId && <div className="glass-assign-hint">Glass assignment active: {materials.find((material) => material.id === selectedGlassMaterialId)?.name ?? "Selected glass"}. Click a window area to apply it.</div>}
              {glassRemovalMode && <div className="glass-assign-hint glass-removal-hint">Glass removal active: click a glass-filled window to remove its glass. Press Escape to exit.</div>}
            </div>
            <button type="button" className={`canvas-left-panel-toggle ${leftCanvasPanelOpen ? "selected" : ""}`} style={{ "--left-panel-width": `${leftCanvasPanelWidth}px` } as CSSProperties} onClick={() => setLeftCanvasPanelOpen((open) => !open)} aria-label={leftCanvasPanelOpen ? "Close left canvas panel" : "Open left canvas panel"} title={leftCanvasPanelOpen ? "Close panel" : "Open panel"}>⌄</button>
            <svg
              className={`project-canvas technical-workspace ${drawingMode === "pan" ? "pan-active" : ""} ${selectedGlassMaterialId ? "glass-carrying" : ""} ${glassRemovalMode ? "glass-removing" : ""}`}
              viewBox={`${drawingView.x} ${drawingView.y} ${9000 / drawingView.zoom} ${5600 / drawingView.zoom}`}
              onPointerDown={canvasDown}
              onPointerMove={canvasMove}
              onPointerUp={canvasUp}
              onPointerLeave={() => { canvasUp(); setCursorWindowPreview(null); setGlassCursor(null); }}
              onDoubleClick={canvasDoubleClick}
              onWheel={canvasWheel}
              onDragStart={(event) => event.preventDefault()}
              onContextMenu={openItemContextMenu}
              aria-label="Technical project drawing workspace"
            >
              <defs>
                <pattern
                  id="technical-grid"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M100 0H0V100"
                    fill="none"
                    stroke="#9baeb5"
                    strokeOpacity="0.42"
                    strokeWidth="2"
                  />
                </pattern>
                <pattern id="technical-subgrid" width="500" height="500" patternUnits="userSpaceOnUse"><rect width="500" height="500" fill="url(#technical-grid)" /><path d="M500 0H0V500" fill="none" stroke="#c3d2d7" strokeOpacity="0.52" strokeWidth="3" /></pattern>
              </defs>
              <rect x="-1000000" y="-1000000" width="2000000" height="2000000" fill="url(#technical-subgrid)" />
                  {visibleCanvasItems.map((item) => (
                    <g key={item.id}>
                  <TechnicalSymbol item={item} selected={selectedItemId === item.id} dimensionTextSize={Math.min(360, 140 / drawingView.zoom)} glassName={materials.find((material) => material.id === item.glassMaterialId)?.name} drawingName={`${item.combinationName ?? item.name} · Qty ${item.quantity ?? 1}`} drawingReference={item.reference} onJoin={() => { setSelectedItemId(item.id); setJoinModeItemId(item.id); setInteraction(null); setJoinFeedback("Automatic 1 mm corner alignment is active. Move or stretch the opening to join."); setDrawingMode("select"); }} />
                  {selectedItemId === item.id && !joinModeItemId && <g data-resize-id={item.id}><rect x={item.x + (item.inputWidth ?? 1500) - 50} y={item.y + (item.inputHeight ?? 1200) - 50} width="100" height="100" className="resize-handle" /></g>}
                </g>
              ))}
              {realJoinSegments(displayedCanvasItems).map((segment) => <line key={segment.id} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} className="real-join-line" style={{ stroke: segment.color }} />)}
              {joinModeItemId && [...visibleCanvasItems].sort((a, b) => Number(a.id === joinModeItemId) - Number(b.id === joinModeItemId)).flatMap((item) => windowCorners.map((corner) => {
                const point = windowCornerPoint(item, corner);
                return <circle key={`${item.id}-${corner}`} data-join-anchor data-join-item-id={item.id} data-join-corner={corner} cx={point.x} cy={point.y} r="72" className={`join-anchor ${item.id === joinModeItemId ? "active" : ""}`} />;
              }))}
              {joinModeItemId && <text x={drawingView.x + 180} y={drawingView.y + 220} className="join-mode-canvas-label">COMBINATION JOIN MODE — Real or Fake is detected automatically · double-click blank area or press Esc to exit</text>}
              {cursorWindowPreview && <g className="placement-preview"><TechnicalSymbol item={{ id: "cursor-window", sourceId: drawingMode === "fly-screen" ? "fly-screen-2rail" : drawingMode === "tilt-and-turn" ? "tilt-and-turn-soleal-fyn" : "", kind: "assembly", name: drawingMode === "fly-screen" ? "Fly screen - Soleal - GYn" : drawingMode === "tilt-and-turn" ? "Tilt and Turn - Soleal - FYn" : drawingMode === "hinge-window" ? "Hinge window" : drawingMode === "fixed-window" ? "Fixed window" : "2 rail window", sketch: drawingMode === "fly-screen" ? flyScreenAssembly.sketch : drawingMode === "tilt-and-turn" ? tiltAndTurnAssembly.sketch : drawingMode === "hinge-window" ? "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82" : drawingMode === "fixed-window" ? "M12 8H88V92H12ZM18 14H82V86H18ZM40 50H60M50 40V60" : TWO_SLIDER_DOOR_SKETCH, x: cursorWindowPreview.x, y: cursorWindowPreview.y, width: 170, height: 130, inputWidth: 1500, inputHeight: 1200, leaves: drawingMode === "hinge-window" || drawingMode === "tilt-and-turn" ? 1 : 2, color: drawingMode === "fly-screen" ? "#718b72" : drawingMode === "tilt-and-turn" ? (assemblies.find((assembly) => assembly.id === "tilt-and-turn-soleal-fyn")?.color ?? assemblyDefaultColor("tilt-and-turn-soleal-fyn")) : "#d9e8ea", assemblyPage: drawingMode === "fly-screen" ? FLY_SCREEN_PAGE : drawingMode === "tilt-and-turn" ? TILT_AND_TURN_PAGE : drawingMode === "hinge-window" ? HINGE_WINDOW_PAGE : drawingMode === "fixed-window" ? FIXED_WINDOW_PAGE : TWO_RAIL_WINDOW_PAGE }} selected={false} dimensionTextSize={Math.min(360, 140 / drawingView.zoom)} /></g>}
            </svg>
            {leftCanvasPanelOpen && <aside className="canvas-left-panel" style={{ "--left-panel-width": `${leftCanvasPanelWidth}px`, width: leftCanvasPanelWidth } as CSSProperties} aria-label="Drawing items"><div className="canvas-left-panel-resize" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); leftCanvasPanelResizeRef.current = { startX: event.clientX, startWidth: leftCanvasPanelWidth }; }} onPointerMove={(event) => { const resize = leftCanvasPanelResizeRef.current; if (!resize) return; setLeftCanvasPanelWidth(Math.max(280, Math.min(720, resize.startWidth + event.clientX - resize.startX))); }} onPointerUp={() => { leftCanvasPanelResizeRef.current = null; }} onPointerCancel={() => { leftCanvasPanelResizeRef.current = null; }} role="separator" aria-label="Resize drawing items panel" /><header><button onClick={() => setLeftCanvasPanelOpen(false)} aria-label="Close drawing items panel">×</button></header><div className="canvas-left-panel-tabs"><button className={leftCanvasPanelTab === "items" ? "selected" : ""} onClick={() => setLeftCanvasPanelTab("items")}>Drawn items</button><button className={leftCanvasPanelTab === "glass" ? "selected" : ""} onClick={() => setLeftCanvasPanelTab("glass")}>Used glass</button></div>{leftCanvasPanelTab === "items" ? <div className="drawn-opening-list">{project.items.filter((item) => item.kind === "assembly").map((item) => {
              const assembly = assemblyForCanvasItem(item);
              const isSlider = item.assemblyPage === TWO_RAIL_WINDOW_PAGE || [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId);
              const isFlyScreen = item.assemblyPage === FLY_SCREEN_PAGE || item.sourceId === "fly-screen-2rail";
              const isHinged = item.assemblyPage === HINGE_WINDOW_PAGE || item.sourceId === "hinged-window-soleal-fyn";
              const isFixed = item.assemblyPage === FIXED_WINDOW_PAGE || item.sourceId === "fixed-window";
              const isTiltAndTurn = item.assemblyPage === TILT_AND_TURN_PAGE || item.sourceId === "tilt-and-turn-soleal-fyn";
              const panelCount = isSlider ? item.leaves ?? 2 : item.leaves ?? 1;
              const panelLabel = `${panelCount} ${panelCount === 1 ? "panel" : "panels"}`;
              const defaults = { ...defaultAssemblyCanvasDefaults, ...assembly?.canvasDefaults };
              const parameters = [
                ...(isFlyScreen ? [] : isSlider && (item.leaves ?? 2) !== defaults.leaves ? [panelLabel] : []),
                ...((isHinged || isFixed || isTiltAndTurn) && item.leafSize !== defaults.leafSize ? [`${item.leafSize === "big" ? "Big" : "Small"} leaf`] : []),
                ...((isHinged || isFixed || isTiltAndTurn) && item.frameSize !== defaults.frameSize ? [`${item.frameSize === "big" ? "Big" : "Small"} frame`] : []),
                ...(!isFlyScreen && Boolean(item.hasArchitrave) !== Boolean(defaults.hasArchitrave) ? [item.hasArchitrave ? "With architrave" : "Without architrave"] : []),
                ...(!isFlyScreen && Boolean(item.reinforced) !== Boolean(defaults.reinforced) ? [item.reinforced ? "Reinforced" : "Not reinforced"] : []),
                ...(!isFlyScreen && Boolean(item.hasArchitraveAllowance) !== Boolean(defaults.hasArchitraveAllowance) ? [item.hasArchitraveAllowance ? "With architrave allowance" : "Without architrave allowance"] : []),
                ...(Boolean(item.hasCoating) !== Boolean(defaults.hasCoating) ? [item.hasCoating ? "With coating" : "Without coating"] : []),
              ];
              return <button type="button" key={item.id} className={`drawn-opening-row ${selectedItemId === item.id ? "selected" : ""}`} onClick={() => { setSelectedItemId(item.id); setDrawingMode("select"); }}><b>{item.combinationName ?? item.name} · Qty {item.quantity ?? 1}</b><span>{panelLabel} · {item.sourceId ? assembly?.name ?? "No assembly type" : "No assembly type"}</span><small>{parameters.length ? parameters.join(" · ") : item.sourceId ? "Using assembly defaults" : "Using default drawing values"}</small></button>;
            })}{!project.items.some((item) => item.kind === "assembly") && <p className="drawn-opening-empty">No drawn openings yet.</p>}</div> : <div className="used-glass-list">{[...new Map(project.items.filter((item) => item.glassMaterialId).map((item) => [item.glassMaterialId!, { material: materials.find((material) => material.id === item.glassMaterialId), openings: project.items.filter((value) => value.glassMaterialId === item.glassMaterialId).map((value) => value.name) }])).values()].map(({ material, openings }) => <div className="used-glass-row" key={material?.id ?? openings.join("-")}>{material && <Sketch path={material.sketch} label={material.name} />}<div><b>{material?.name ?? "Saved glass"}</b><span className="used-glass-summary">{[inferGlassThickness(material) || "No thickness", material?.description].filter(Boolean).join("-")} ({money(material?.cost ?? 0)})</span><small>{material?.options?.[0] || "No composition entered"}</small></div></div>)}{!project.items.some((item) => item.glassMaterialId) && <p className="drawn-opening-empty">No glass is assigned yet.</p>}</div>}</aside>}
            {interaction?.type === "joinResize" && joinStretchMeasurement && <div className="join-stretch-measurement" style={{ left: joinStretchMeasurement.clientX + 18, top: joinStretchMeasurement.clientY + 18 }}><b>{joinStretchMeasurement.axis ? `Δ${joinStretchMeasurement.axis.toUpperCase()}` : "Stretch"}</b><strong>{joinStretchMeasurement.input || joinStretchMeasurement.amount} mm</strong><small>{joinStretchMeasurement.input ? "Typed distance · click to apply" : joinStretchMeasurement.axis ? "Type a distance or click to apply" : "Move horizontally or vertically"}</small></div>}
            {(selectedGlassMaterialId || glassRemovalMode) && glassCursor && <div className={`glass-carrying-cursor ${glassRemovalMode ? "removing" : ""}`} style={{ left: glassCursor.x + 16, top: glassCursor.y + 16 }}><svg viewBox="0 0 36 28" aria-hidden="true"><rect x="3" y="2" width="30" height="24" /><path d="M10 20L18 12M14 23L22 15" /></svg><span>{glassRemovalMode ? "Remove glass" : materials.find((material) => material.id === selectedGlassMaterialId)?.name ?? "Glass"}</span></div>}
            {contextMenu && contextItem && (
              <section className="item-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} aria-label={`Actions for ${contextItem.name}`}>
                <div className="context-menu-heading"><div className="context-opening-name"><label htmlFor={`opening-name-${contextItem.id}`}>Item name</label><input id={`opening-name-${contextItem.id}`} key={contextItem.name} defaultValue={contextItem.name} onFocus={() => setOpeningNameError("")} onBlur={(event) => renameCanvasItem(contextItem.id, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { event.currentTarget.value = contextItem.name; setOpeningNameError(""); event.currentTarget.blur(); } }} aria-describedby={openingNameError ? "opening-name-error" : undefined} /></div>{contextCombinationSize > 1 && <><div className="context-opening-name"><label htmlFor={`combination-name-${contextItem.id}`}>Combination name</label><input id={`combination-name-${contextItem.id}`} key={contextItem.combinationName ?? ""} defaultValue={contextItem.combinationName ?? "Combination"} onFocus={() => setOpeningNameError("")} onBlur={(event) => renameCombination(contextItem.id, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { event.currentTarget.value = contextItem.combinationName ?? ""; setOpeningNameError(""); event.currentTarget.blur(); } }} aria-describedby={openingNameError ? "opening-name-error" : undefined} /></div><button type="button" className="context-separate" onClick={() => separateWindowFromCombination(contextItem.id)}>Separate</button></>}</div>
                {openingNameError && <p id="opening-name-error" className="context-name-error" role="alert">{openingNameError}</p>}
                <div className="context-dimensions">
                  <label>Width (mm)<input type="number" step="1" min="200" max={MAX_OPENING_DIMENSION} defaultValue={contextItem.inputWidth ?? 1500} onBlur={(event) => updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === contextItem.id ? { ...item, inputWidth: Math.min(MAX_OPENING_DIMENSION, Math.max(200, Math.round(Number(event.target.value) || 200))) } : item) }))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>
                  <label>Height (mm)<input type="number" step="1" min="200" max={MAX_OPENING_DIMENSION} defaultValue={contextItem.inputHeight ?? 1200} onBlur={(event) => updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === contextItem.id ? { ...item, inputHeight: Math.min(MAX_OPENING_DIMENSION, Math.max(200, Math.round(Number(event.target.value) || 200))) } : item) }))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>
                  <label>Qty<input type="number" step="1" min="1" defaultValue={contextItem.quantity ?? 1} onBlur={(event) => updateCombinationQuantity(contextItem.id, Number(event.target.value))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>
                  <label>Reference<input key={contextItem.reference ?? "auto"} type="number" step="1" min="1" defaultValue={contextItem.reference ?? ""} placeholder="Auto" onFocus={() => setOpeningNameError("")} onBlur={(event) => updateCanvasReference(contextItem.id, Math.round(Number(event.target.value)))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { event.currentTarget.value = String(contextItem.reference ?? ""); setOpeningNameError(""); event.currentTarget.blur(); } }} aria-describedby={openingNameError ? "opening-name-error" : undefined} /></label>
                  {contextItem.kind === "assembly" && <label className="context-window-type">Type<select value={contextItem.sourceId} onChange={(event) => changeDrawnWindowType(contextItem.id, event.target.value)}><option value="">No type (default)</option>{contextIsFlyScreen ? <option value="fly-screen-2rail">Fly screen - Soleal - GYn</option> : contextIsHingeWindow ? <option value="hinged-window-soleal-fyn">Hinged System - Soleal - FYn</option> : contextIsFixedWindow ? <option value="fixed-window">Fixed window - Soleal - FYn</option> : contextIsTiltAndTurn ? <option value="tilt-and-turn-soleal-fyn">Tilt and Turn - Soleal - FYn</option> : <option value="soleal-gyn-2rail">2 Rail System - Soleal - GYn</option>}</select></label>}
                  {contextItem.kind === "assembly" && contextItem.sourceId && <section className="type-parameters" aria-label="Window type parameters">
                    <strong>Type parameters</strong>
                    {!contextIsFlyScreen && <>
                      {!contextIsTiltAndTurn && !contextIsFixedWindow && <label>Number of leaves<select value={contextItem.leaves ?? (contextIsHingeWindow ? 1 : 2)} onChange={(event) => updateRealJoinSettings(contextItem.id, { leaves: Number(event.target.value) as 1 | 2 | 3 | 4 })}>{contextIsHingeWindow ? <><option value={1}>1 leaf</option><option value={2}>2 leaves</option></> : <><option value={2}>2 leaves</option><option value={3}>3 leaves</option><option value={4}>4 leaves</option></>}</select></label>}
                      {contextSupportsFynLeafSize && <label>Leaf size<select value={contextItem.leafSize ?? "small"} onChange={(event) => updateRealJoinSettings(contextItem.id, { leafSize: event.target.value as "small" | "big" })}><option value="small">Small leaf</option><option value="big">Big leaf</option></select></label>}
                      {(contextIsHingeWindow || contextIsFixedWindow || contextIsTiltAndTurn) && <label>Frame size<select value={contextItem.frameSize ?? "small"} onChange={(event) => updateRealJoinSettings(contextItem.id, { frameSize: event.target.value as "small" | "big" })}><option value="small">Small frame</option><option value="big">Big frame</option></select></label>}
                      {contextSupportsOpeningType && <label>Opening type<select value={contextItem.openingType ?? "window"} onChange={(event) => updateRealJoinSettings(contextItem.id, { openingType: event.target.value as "window" | "door" })}><option value="window">Window</option><option value="door">Door</option></select></label>}
                      <label>Architrave<select value={contextItem.hasArchitrave ? "with" : "without"} onChange={(event) => { const value = event.target.value === "with"; updateCombinationGlazedSettings(contextItem.id, { hasArchitrave: value }); updateRealJoinSettings(contextItem.id, { hasArchitrave: value }); }}><option value="without">Without architrave</option><option value="with">With architrave</option></select></label>
                      <label>Reinforcement<select value={contextItem.reinforced ? "reinforced" : "not-reinforced"} onChange={(event) => updateRealJoinSettings(contextItem.id, { reinforced: event.target.value === "reinforced" })}><option value="not-reinforced">Not reinforced</option><option value="reinforced">Reinforced</option></select></label>
                      <label>Architrave allowance<select value={contextItem.hasArchitraveAllowance ? "with" : "without"} onChange={(event) => { const value = event.target.value === "with"; updateCombinationGlazedSettings(contextItem.id, { hasArchitraveAllowance: value }); updateRealJoinSettings(contextItem.id, { hasArchitraveAllowance: value }); }}><option value="without">Without architrave allowance</option><option value="with">With architrave allowance</option></select></label>
                    </>}
                    <label>Coating<select value={contextItem.hasCoating ? "with" : "without"} onChange={(event) => updateRealJoinSettings(contextItem.id, { hasCoating: event.target.value === "with" })}><option value="without">Without coating</option><option value="with">With coating</option></select></label>
                  </section>}
                </div>
                <button type="button" className="secondary-button" onClick={() => { setItemMaterialPanelId(contextItem.id); setTakeoffPanel("material"); setContextMenu(null); }}>Material</button>
                <button className="context-delete" onClick={() => { deleteCanvasItem(contextItem.id); setSelectedItemId(null); setContextMenu(null); }}><Icon name="trash" size={15} /> Delete item</button>
              </section>
            )}
            <div className="project-canvas-tabs" role="tablist" aria-label="Project canvases">
              {(project.canvases ?? [{ id: "opening-1", name: "Opening 1", items: project.items }]).map((canvas) => <div key={canvas.id} className={`project-canvas-tab ${canvas.id === selectedCanvasId ? "active" : ""}`}><button role="tab" aria-selected={canvas.id === selectedCanvasId} onClick={() => selectProjectCanvas(canvas.id)}>{canvas.name}</button><button className="canvas-rename" onClick={() => renameProjectCanvas(canvas.id)} title="Rename canvas"><Icon name="edit" size={12} /></button></div>)}
              <button className="add-canvas-tab" onClick={addProjectCanvas}><Icon name="plus" size={14} /> New opening</button>
            </div>
            {takeoffPanel && <section ref={takeoffPanelRef} className="canvas-takeoff-panel" style={{ width: takeoffPanelWidth, "--takeoff-panel-width": `${takeoffPanelWidth}px` } as CSSProperties}>
              <div className="takeoff-panel-resize" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); takeoffResizeWidth.current = takeoffPanelWidth; takeoffResizeRef.current = { startX: event.clientX, startWidth: takeoffPanelWidth }; }} onPointerMove={(event) => { const resize = takeoffResizeRef.current; if (!resize) return; const width = Math.max(260, Math.min(720, resize.startWidth + resize.startX - event.clientX)); takeoffResizeWidth.current = width; setTakeoffPanelWidth(width); }} onPointerUp={() => { setTakeoffPanelWidth(takeoffResizeWidth.current); takeoffResizeRef.current = null; }} onPointerCancel={() => { setTakeoffPanelWidth(takeoffResizeWidth.current); takeoffResizeRef.current = null; }} />
              <header><strong>{takeoffPanel === "material" ? itemMaterialPanel ? `${itemMaterialPanel.name}: takeoff` : "Material takeoff" : takeoffPanel === "glassLibrary" ? "Glass library" : takeoffPanel === "glass" ? "Glass takeoff" : "Manpower"}</strong>{takeoffPanel === "material" && itemMaterialPanel && <button className="takeoff-modify" onClick={() => { if (!editingItemMaterial) setTakeoffPanelWidth(620); setEditingItemMaterial((editing) => !editing); }}>{editingItemMaterial ? "Done" : "Modify"}</button>}{takeoffPanel !== "glassLibrary" && <b className="takeoff-header-total">Total: {money(takeoffPanel === "manpower" ? manpowerTotal : (takeoffPanel === "material" ? (itemMaterialPanel ? [...itemGlassTakeoff, ...itemMaterialTakeoff] : materialTakeoff) : glassTakeoff).reduce((sum, row) => sum + row.total, 0))}</b>}<button onClick={() => { setTakeoffPanel(null); setItemMaterialPanelId(null); setEditingItemMaterial(false); if (takeoffPanel === "glassLibrary") setSelectedGlassMaterialId(null); }}>×</button></header>
              {takeoffPanel === "material" && (itemMaterialPanel ? <div className="drawing-takeoff-sections"><section><h2>Glass</h2>{itemGlassTakeoff.length ? <div className="takeoff-list">{itemGlassTakeoff.map(({ material, quantity, total }) => <div key={material.id} className={`takeoff-row drawing-material-row ${editingItemMaterial ? "editing" : ""}`}><Sketch path={material.sketch} label={material.name} /><span><b>{material.code} - {material.name}</b><small>{number(quantity)} m² × {money(unitPriceWithShipping(material, shippingRateForMaterial(material)))}/m²</small>{itemMaterialPanel.materialAdjustments?.[material.id] && <small className="adjustment-note">Modified: {itemMaterialPanel.materialAdjustments[material.id]}</small>}</span>{editingItemMaterial && <input className="material-adjustment-input" defaultValue={itemMaterialPanel.materialAdjustments?.[material.id] ?? ""} onBlur={(event) => updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === itemMaterialPanel.id ? { ...item, materialAdjustments: { ...item.materialAdjustments, [material.id]: event.target.value } } : item) }))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder="+Area or -Area/2" aria-label={`Glass adjustment for ${material.name}`} />}<strong>{money(total)}</strong></div>)}</div> : <p className="takeoff-empty">No glass selected.</p>}</section><section><h2>Material</h2>{itemMaterialTakeoff.length ? <div className="takeoff-list">{itemMaterialTakeoff.map(({ material, reference, quantity, total }) => <div key={material.id} className={`takeoff-row drawing-material-row glass-takeoff-row ${editingItemMaterial ? "editing" : ""}`}><Sketch path={material.sketch} label={material.name} /><span><b>{material.code} - {material.name}</b><small className="material-location">{reference}</small><small>{number(quantity)} {material.unit} × {money(unitPriceWithShipping(material, shippingRateForMaterial(material)))}</small>{itemMaterialPanel.materialAdjustments?.[material.id] && <small className="adjustment-note">Modified: {itemMaterialPanel.materialAdjustments[material.id]}</small>}</span>{editingItemMaterial && <input className="material-adjustment-input" defaultValue={itemMaterialPanel.materialAdjustments?.[material.id] ?? ""} onBlur={(event) => updateProject((current) => ({ ...current, items: current.items.map((item) => item.id === itemMaterialPanel.id ? { ...item, materialAdjustments: { ...item.materialAdjustments, [material.id]: event.target.value } } : item) }))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder="+Width or -Area/2" aria-label={`Adjustment for ${material.name}`} />}<strong>{money(total)}</strong></div>)}</div> : <p className="takeoff-empty">No type selected.</p>}</section></div> : (materialTakeoff.length ? <div className="takeoff-list">{materialTakeoff.map(({ material, quantity, total }) => material && <div key={material.id} className="takeoff-row glass-takeoff-row"><Sketch path={material.sketch} label={material.name} /><span><b>{material.code} - {material.name}</b><small className="material-location">{materialDatabaseReference(material)}</small><small>{number(quantity)} {material.unit} × {money(unitPriceWithShipping(material, shippingRateForMaterial(material)))}</small></span><strong>{money(total)}</strong></div>)}</div> : <p className="takeoff-empty">Choose a window type to calculate materials.</p>))}
              {takeoffPanel === "glass" && (glassTakeoff.length ? <div className="takeoff-list">{glassTakeoff.map(({ material, quantity, total }) => material && <div key={material.id} className="takeoff-row glass-takeoff-row"><Sketch path={material.sketch} label={material.name} /><span><b>{material.name}</b><small className="takeoff-glass-summary">{[inferGlassThickness(material) || "No thickness", material.description].filter(Boolean).join("-")} ({money(material.cost)}/m²)</small><small className="takeoff-glass-description">{material.options?.[0] || "No composition entered"}</small><small>{number(quantity)} m²</small></span><strong>{money(total)}</strong></div>)}</div> : <p className="takeoff-empty">Add glass with the Glass button in the top toolbar to calculate its area.</p>)}
              {takeoffPanel === "glassLibrary" && <div className="glass-library-picker"><p>Select a glass item, then click each window area on the canvas where it should be used.</p>{materials.filter((material) => material.databaseId === "glass").map((material) => <button key={material.id} className={`glass-library-item ${selectedGlassMaterialId === material.id ? "selected" : ""}`} onClick={() => { setSelectedGlassMaterialId(material.id); setGlassRemovalMode(false); setDrawingMode("select"); setJoinModeItemId(null); setInteraction(null); }}><Sketch path={material.sketch} label={material.name} /><span><b>{material.name}</b><small className="glass-library-summary">{[inferGlassThickness(material) || "No thickness", material.description].filter(Boolean).join("-")} ({money(material.cost)}/m²)</small><small className="glass-library-composition">{material.options?.[0] || "No composition entered"}</small></span></button>)}{!materials.some((material) => material.databaseId === "glass") && <p className="takeoff-empty">No glass items are in the library yet.</p>}<button className={`glass-library-stop ${glassRemovalMode ? "selected" : ""}`} onClick={() => { setGlassRemovalMode((active) => !active); setSelectedGlassMaterialId(null); setDrawingMode("select"); setJoinModeItemId(null); setInteraction(null); }}>{glassRemovalMode ? "Stop removing glass" : "Remove glass"}</button>{selectedGlassMaterialId && <button className="glass-library-stop glass-library-stop-assignment" onClick={() => setSelectedGlassMaterialId(null)}>Stop assigning glass</button>}</div>}
              {takeoffPanel === "manpower" && <div className="canvas-manpower-editor"><div className="manpower-panel-tabs"><button className={manpowerPanelTab === "parameters" ? "selected" : ""} onClick={() => setManpowerPanelTab("parameters")}>Parameters</button><button className={manpowerPanelTab === "items" ? "selected" : ""} onClick={() => setManpowerPanelTab("items")}>Manpower items</button></div>{manpowerPanelTab === "parameters" ? <><p>Choose the calculation parameter, then enter labour hours per unit. Selected items total: <b>{number(manpowerParameterQuantity)} {manpowerParameterUnit[manpowerParameter]}</b>.</p><div className="manpower-parameter-options">{(["width", "height", "area", "perimeter"] as const).map((parameter) => <button key={parameter} className={manpowerParameter === parameter ? "selected" : ""} onClick={() => setCanvasManpowerParameter(parameter)}>{parameter === "width" ? "Width" : parameter === "height" ? "Height" : parameter === "area" ? "Area" : "Perimeter"}</button>)}</div><div className="manpower-value-headings"><span>Manpower cost</span><span>Hours / unit</span><span>Total</span></div>{manpowerRows.map((cost) => <label key={cost.id}><span><b>{cost.name}</b><small>{money(cost.rate)} / hour</small></span><input type="number" min="0" step="0.25" value={cost.hoursPerUnit} onChange={(event) => setCanvasManpowerHours(cost.id, Math.max(0, Number(event.target.value) || 0))} aria-label={`${cost.name} hours per ${manpowerParameterUnit[manpowerParameter]}`} /><strong>{money(cost.total)}</strong></label>)}</> : <><p>Select the windows, doors, or items included in this drawing’s manpower calculation.</p><div className="manpower-item-list">{project.items.length ? project.items.map((item, index) => <label key={item.id}><input type="checkbox" checked={selectedManpowerItemIds.has(item.id)} onChange={(event) => toggleCanvasManpowerItem(item.id, event.target.checked)} /><span><b>{item.name}</b><small>{item.kind === "assembly" ? `${item.name} · ${number((item.inputWidth ?? item.width) / 1000)} × ${number((item.inputHeight ?? item.height) / 1000)} m` : `Item ${index + 1}`}</small></span></label>) : <p className="takeoff-empty">Draw a window, door, or item first.</p>}</div></>}</div>}
            </section>}
          </div>
          <aside className="inspector">
            {!inspectorCollapsed && <div className="inspector-resize" onPointerDown={startInspectorResize} role="separator" aria-label="Resize live material takeoff" />}
            <button
              className="inspector-collapse"
              onClick={() => setInspectorCollapsed((collapsed) => !collapsed)}
              aria-label={inspectorCollapsed ? "Expand live material takeoff" : "Collapse live material takeoff"}
              title={inspectorCollapsed ? "Expand live material takeoff" : "Collapse live material takeoff"}
            >
              <Icon name="arrow" size={16} />
            </button>
            <div className="inspector-content">
              <section className="live-materials takeoff-table">
                <div className="inspector-section-heading">
                  <h2>Material takeoff</h2>
                  <span>{materialTakeoff.length}</span>
                </div>
                {materialTakeoff.length ? (
                  <div className="takeoff-list">
                    {materialTakeoff.map(({ material, quantity, total, formulas }) => material && (
                      <div key={material.id} className="takeoff-row">
                        <span><b>{material.name}</b><small className="material-location">{materialDatabaseReference(material)}</small><small>{number(quantity)} {material.unit} × {money(unitPriceWithShipping(material, shippingRateForMaterial(material)))}</small></span><strong>{money(total)}</strong>
                        {formulas.map((formula) => <i key={formula.label} className={formula.isError ? "formula-tag formula-error" : "formula-tag"}>{formula.label}</i>)}
                      </div>
                    ))}
                  </div>
                ) : <p className="takeoff-empty">Choose a window type to calculate materials.</p>}
                {materialTakeoff.length > 0 && <div className="takeoff-total"><span>Material total</span><strong>{money(materialTakeoff.reduce((sum, row) => sum + row.total, 0))}</strong></div>}
              </section>
              <section className="takeoff-table glass-takeoff-table">
                <div className="inspector-section-heading"><h2>Glass takeoff</h2><span>{glassTakeoff.length}</span></div>
                {glassTakeoff.length ? <div className="takeoff-list">{glassTakeoff.map(({ material, quantity, total }) => material && <div key={material.id} className="takeoff-row"><span><b>{material.name}</b><small>{number(quantity)} m² × {money(unitPriceWithShipping(material, shippingRateForMaterial(material)))}/m²</small></span><strong>{money(total)}</strong></div>)}</div> : <p className="takeoff-empty">Select glass on a window to calculate its area.</p>}
                {glassTakeoff.length > 0 && <div className="takeoff-total"><span>Glass total</span><strong>{money(glassTakeoff.reduce((sum, row) => sum + row.total, 0))}</strong></div>}
              </section>
              <section className="takeoff-table manpower-takeoff-table">
                <div className="inspector-section-heading"><h2>Manpower</h2><span>{manpowerTakeoff.length}</span></div>
                {manpowerTakeoff.length ? <div className="takeoff-list">{manpowerTakeoff.map((cost) => <div key={cost.id} className="takeoff-row"><span><b>{cost.name}</b><small>{number(cost.hours)} hours × {money(cost.rate)} / hour</small></span><strong>{money(cost.total)}</strong></div>)}</div> : <p className="takeoff-empty">Enter hours in the Manpower panel for this drawing.</p>}
                {manpowerTakeoff.length > 0 && <div className="takeoff-total"><span>Manpower total</span><strong>{money(manpowerTotal)}</strong></div>}
              </section>
            </div>
          </aside>
        </div>
      </section>
    );
  if (screen === "home") return <AmaHome />;
  if (screen === "execution-workspace") return ExecutionWorkspaceApp();
  if (screen === "execution-projects" || screen === "execution-project-detail") return <ExecutionProjectsApp />;

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button className="brand-mark" type="button" onClick={() => setScreen("home")} aria-label="Return to AMA services">
          <Icon name="box" size={22} />
          <span>
            AMA
            <br />
            {screen === "stock" ? "Stock" : "Estimation"}
          </span>
        </button>
        {screen !== "stock" && <button
          className="sidebar-collapse"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
          title={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
        >
          <Icon name="arrow" size={16} />
        </button>}
        <nav>
          {screen === "stock" ? (
            <button className="active" onClick={() => { setActiveDatabaseId("prices"); setScreen("stock"); }}>
              <Icon name="warehouse" /> <span>Stock</span>
            </button>
          ) : <>
          <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_PROJECTS}>
            <button
              className={screen === "projects" || screen === "canvas" ? "active" : ""}
              onClick={() => { setScreen("projects"); setProjectsOpen((open) => !open); }}
              aria-expanded={projectsOpen}
            >
              <Icon name="folder" /> <span>Projects</span><small className="nav-caret">{projectsOpen ? "âŒ„" : "â€º"}</small>
            </button>
            {projectsOpen && <div className="database-nav project-year-nav">
              {projectYears.map((year) => <button key={year} className={(screen === "projects" || screen === "canvas") && activeProjectYear === year ? "active" : ""} onClick={() => { setActiveProjectYear(year); setScreen("projects"); }}><span>{year}</span></button>)}
            </div>}
          </PermissionGate>
          <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_DATABASE}>
            <button className={screen === "database" ? "active" : ""} onClick={() => { setScreen("database"); setDatabaseOpen((open) => !open); }}>
              <Icon name="box" /> <span>Database</span><small className="nav-caret">{databaseOpen ? "⌄" : "›"}</small>
            </button>
            {databaseOpen && <div className="database-nav">
              <button className={screen === "database" && activeDatabaseId === "prices" ? "active" : ""} onClick={() => { setActiveDatabaseId("prices"); setScreen("database"); }}><span>Material database</span></button>
              <button className={screen === "database" && activeDatabaseId === "glass" ? "active" : ""} onClick={() => { setActiveDatabaseId("glass"); setScreen("database"); }}><span>Glass price</span></button>
              <button className={screen === "database" && activeDatabaseId === "costing-financials" ? "active" : ""} onClick={() => { setActiveDatabaseId("costing-financials"); setScreen("database"); }}><span>Costing &amp; Financials</span></button>
            </div>}
          </PermissionGate>
          <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES}>
            <button className={screen === "assemblies" ? "active" : ""} onClick={() => { setScreen("assemblies"); setAssembliesOpen((open) => !open); }} aria-expanded={assembliesOpen}>
              <Icon name="layers" /> <span>Assemblies</span><small className="nav-caret">{assembliesOpen ? "⌄" : "›"}</small>
            </button>
            {assembliesOpen && <div className="database-nav">
              <button className={screen === "assemblies" && activeDatabaseId === TWO_RAIL_WINDOW_PAGE ? "active" : ""} onClick={() => { setActiveAssemblySystem("technal"); setActiveDatabaseId(TWO_RAIL_WINDOW_PAGE); setScreen("assemblies"); }}><span>2 rail system</span></button>
              <button className={screen === "assemblies" && activeDatabaseId === HINGE_WINDOW_PAGE ? "active" : ""} onClick={() => { setActiveAssemblySystem("technal"); setActiveDatabaseId(HINGE_WINDOW_PAGE); setScreen("assemblies"); }}><span>Hinged system</span></button>
              <button className={screen === "assemblies" && activeDatabaseId === FIXED_WINDOW_PAGE ? "active" : ""} onClick={() => { setActiveAssemblySystem("technal"); setActiveDatabaseId(FIXED_WINDOW_PAGE); setScreen("assemblies"); }}><span>Fixed window</span></button>
              <button className={screen === "assemblies" && activeDatabaseId === FLY_SCREEN_PAGE ? "active" : ""} onClick={() => { setActiveAssemblySystem("technal"); setActiveDatabaseId(FLY_SCREEN_PAGE); setScreen("assemblies"); }}><span>Fly screen</span></button>
              <button className={screen === "assemblies" && activeDatabaseId === TILT_AND_TURN_PAGE ? "active" : ""} onClick={() => { setActiveAssemblySystem("technal"); setActiveDatabaseId(TILT_AND_TURN_PAGE); setScreen("assemblies"); }}><span>Tilt and Turn</span></button>
              <div className="database-nav-parent"><button className={screen === "assemblies" && activeAssemblySystem === "sidem" ? "active" : ""} onClick={() => { setActiveAssemblySystem("sidem"); setActiveDatabaseId("sidem"); setScreen("assemblies"); }}><span>Sidem</span></button><button className="database-add" onClick={() => openNewDatabase("sidem")} aria-label="Add Sidem assembly database" title="Add Sidem assembly database"><Icon name="plus" size={14} /></button></div>
              <div className="database-nav component-nav">{componentDatabases.filter((item) => item.parent === "sidem").map((database) => <button key={database.id} className={screen === "assemblies" && activeAssemblySystem === "sidem" && activeDatabaseId === database.id ? "active" : ""} onClick={() => { setActiveAssemblySystem("sidem"); setActiveDatabaseId(database.id); setScreen("assemblies"); }}><span>{database.name}</span></button>)}</div>
            </div>}
          </PermissionGate>
          <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_EXCEL}>
            <button className={screen === "excel" ? "active" : ""} onClick={() => setScreen("excel")}>
              <Icon name="box" /> <span>Excel</span>
            </button>
          </PermissionGate>
          </>}
        </nav>
        {screen !== "stock" && <div className="sidebar-note">
          <span className={`status-dot ${workspaceSaveStatus}`} /> Local workspace
          <br />
          <small>{workspaceSaveStatus === "saving" ? "Saving changes…" : workspaceSaveStatus === "error" ? "Save failed — changes are still open." : "All changes saved to SQLite."}</small>
          {recentWorkspaceSaves.length > 0 && <ol className="save-history" aria-label="Recent saves">{recentWorkspaceSaves.map((savedAt, index) => <li key={`${savedAt}-${index}`}>Saved {savedAt}</li>)}</ol>}
        </div>}
      </aside>
      <main className="main-content">
        <header className="topbar">
          {screen === "database" || screen === "stock" ? <div className="system-top-actions"><button type="button" className={activeDatabaseId === "prices" ? "active" : ""} onClick={() => setActiveDatabaseId("prices")}>Soleal Database</button>{companyDatabases.map((database) => <button key={database.id} type="button" className={activeDatabaseId === database.id ? "active" : ""} onClick={() => setActiveDatabaseId(database.id)}>{database.name} Database</button>)}{screen === "database" && <button type="button" className="add-system-button" onClick={openNewCompanyDatabase}><Icon name="plus" size={14} /> Add other system</button>}</div> : <div className="breadcrumb">{screen === "canvas" ? "Project canvas" : screen[0].toUpperCase() + screen.slice(1)}</div>}
          <ProfileMenu />
        </header>
        {(screen === "database" || screen === "stock") && (activeDatabaseId === "prices" || companyDatabases.some((database) => database.id === activeDatabaseId) ? <PriceBook view={screen === "stock" ? "stock" : "prices"} /> : screen === "database" && activeDatabaseId === "costing-financials" ? (
          <CostingFinancials
            Icon={Icon}
            search={search}
            setSearch={setSearch}
            tableZoom={tableZoom}
            markupRates={markupRates}
            setMarkupRates={setMarkupRates}
            manpowerCurrency={manpowerCurrency}
            setManpowerCurrency={setManpowerCurrency}
            manpowerCosts={manpowerCosts}
            setManpowerCosts={setManpowerCosts}
            shippingTypes={shippingTypes}
            setShippingTypes={setShippingTypes}
            shippingCosts={shippingCosts}
            setShippingCosts={setShippingCosts}
            setMaterials={setMaterials}
          />
        ) : screen === "database" ? <Library type="material" /> : null)}
        {screen === "assemblies" && <AssemblyLibrary />}
        {screen === "projects" && <Projects />}
        {screen === "canvas" && <Canvas />}
        {screen === "excel" && <ExcelWorkspace />}
      </main>
      {referenceConflict && (
        <div className="dialog-backdrop" onMouseDown={() => setReferenceConflict(null)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="reference-conflict-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">Reference conflict</p><h2 id="reference-conflict-title">Reference {referenceConflict.requestedReference} already exists</h2></div><button className="icon-button" onClick={() => setReferenceConflict(null)} aria-label="Close"><Icon name="close" /></button></div>
            <div className="dialog-form"><p>Choose whether to make room for this number or use a different reference for this item.</p></div>
            <div className="dialog-footer"><button type="button" className="secondary-button" onClick={() => { setReferenceConflict(null); setOpeningNameError("Choose another positive reference number."); }}>Rename</button><button type="button" className="primary-button" onClick={shiftReferencesForConflict}>Shift</button></div>
          </section>
        </div>
      )}
      {modal && (
        <div className="dialog-backdrop" onMouseDown={closeModal}>
          <section
            className={`material-dialog ${modal.type === "assembly" ? "assembly-dialog" : ""}`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">{modal.id ? "Edit" : "New"} item</p>
                <h2>
                  {modal.id ? "Edit" : "Add"} {modal.type === "executionProject" ? "project" : modal.type}
                </h2>
              </div>
              <div className="dialog-header-actions">
                {modal.type === "assembly" && <div className="copy-from-menu"><button type="button" className="secondary-button copy-from-button" onClick={() => setCopyFromAssemblyOpen((open) => !open)}>Copy from</button>{copyFromAssemblyOpen && <div className="copy-from-options" role="menu">{assemblies.filter((assembly) => assembly.id !== modal.id).map((assembly) => <button type="button" key={assembly.id} onClick={() => copyAssemblyContentFrom(assembly.id)}>{assembly.name}<small>{assembly.code}</small></button>)}</div>}</div>}
                <button className="icon-button" onClick={closeModal} aria-label="Close"><Icon name="close" /></button>
              </div>
            </div>
            <form onSubmit={save}>
              <div className="dialog-form">
                <label>
                  {(modal.type === "project" || modal.type === "executionProject") ? "Project name" : modal.type === "material" && (activeDatabaseId === "glass" || materialDatabaseOverride === "glass") ? "Glass name / reference" : "Name"} <span>*</span>
                  <input
                    autoFocus
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={(modal.type === "project" || modal.type === "executionProject") ? "Project 1" : `Enter ${modal.type} name`}
                  />
                </label>
                {modal.type === "material" && (activeDatabaseId === "glass" || materialDatabaseOverride === "glass") && <section className="glass-form-fields">
                  <label>Description<input value={glassDescription} onChange={(e) => setGlassDescription(e.target.value)} placeholder="e.g. Double clear glass" /><small>Short display name for this glass build-up.</small></label>
                  <label>Thickness<input required value={glassThickness} onChange={(e) => setGlassThickness(e.target.value)} placeholder="e.g. 24 mm" /></label>
                  <label>Composition<textarea required value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"e.g. 6 mm tempered clear\n12 mm air space\n6 mm tempered clear"} rows={5} /><small>Enter one layer per line.</small></label>
                  <section className="material-photo-field" tabIndex={0} onPaste={pasteMaterialPhoto} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.focus(); }}><label>Photo <small>(optional)</small><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setMaterialPhoto(file); }} /><small>Choose an image file.</small></label><button type="button" className="paste-photo-button">Paste photo (then Ctrl+V)</button><small className="paste-photo-help">Copy an image, click this button, then press Ctrl+V.</small>{materialSketch.startsWith("data:image/") && <img className="glass-photo-preview" src={materialSketch} alt="Glass preview" />}</section>
                  <label>Price / sqm<input required type="number" min="0" step="any" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" /></label>
                </section>}
                {modal.type !== "project" && modal.type !== "executionProject" && !(modal.type === "material" && (activeDatabaseId === "glass" || materialDatabaseOverride === "glass")) && (
                  <div className="two-fields">
                    <label>
                      Code {modal.type === "material" && <span>*</span>}
                      <input
                        required={modal.type === "material"}
                        value={formCode}
                        onChange={(e) => { setFormCode(e.target.value); setMaterialCodeError(""); }}
                        placeholder={modal.type === "material" ? "Required unique code, e.g. GY3808 or A-55" : "Optional code"}
                        aria-invalid={modal.type === "material" && Boolean(materialCodeError)}
                        aria-describedby={modal.type === "material" && materialCodeError ? "material-code-error" : undefined}
                      />
                      {modal.type === "material" && <small>Required. This code must be unique across the whole shared database, including every company tab.</small>}
                      {modal.type === "material" && materialCodeError && <small id="material-code-error" className="field-error" role="alert">{materialCodeError}</small>}
                    </label>
                    <label>
                      Category
                      <input
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="e.g. Window"
                      />
                    </label>
                  </div>
                )}
                {modal.type === "assembly" && (
                  <div className="two-fields">
                    <label>Manufacturer / system<input value={formManufacturer} onChange={(e) => setFormManufacturer(e.target.value)} placeholder="e.g. Technal" /></label>
                    <label className="assembly-colour-field">Drawing colour<span className="assembly-colour-picker">{assemblyColourOptions.map((colour) => <button type="button" key={colour} className={assemblyColor.toUpperCase() === colour ? "selected" : ""} style={{ backgroundColor: colour }} onClick={() => setAssemblyColor(colour)} aria-label={`Use ${colour} drawing colour`} aria-pressed={assemblyColor.toUpperCase() === colour} />)}<code>{assemblyColor.toUpperCase()}</code></span></label>
                  </div>
                )}
                {modal.type === "material" && !(activeDatabaseId === "glass" || materialDatabaseOverride === "glass") && (
                  <>
                    <p className="database-scope">This material belongs to <b>{materialScopeTitle}</b> ({materialScopeManufacturer}).</p>
                    {materialScopeId === "markups" && <label>
                      General price table
                      <select value={materialPriceTable ?? "general"} onChange={(event) => setMaterialPriceTable(event.target.value as Material["priceTable"])}>
                        <option value="general">Others</option>
                        <option value="profiles">General ALU profiles</option>
                        <option value="accessories">General ALU accessories</option>
                      </select>
                    </label>}
                    <label>Unit<input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="m, m², kg, piece" /></label>
                    <section className="material-edit-summary"><strong>Used in calculations</strong><span>Unit is used for display. Quantities come from the canvas and assemblies. Central price, wastage, and shipping are managed in Material price and affect project totals.</span><small>Category, supplier reference, weight, selectable options, and requested properties are reference data only; existing values are kept.</small></section>
                    {false && <label>
                      Price method
                      <input
                        value={priceMethod}
                        onChange={(e) => setPriceMethod(e.target.value)}
                        placeholder="Per piece, Per meter, Per m²"
                      />
                    </label>}
                    {false && <section className="formula-editor">
                      <div><strong>Quantity formula <span>*</span></strong><small>Saved with this material and used directly for its project quantity.</small></div>
                      <input required value={materialQuantityFormula} onChange={(event) => { setMaterialQuantityFormula(event.target.value); setFormulaValidationError(""); }} placeholder="e.g. Width*2, Height, Perimeter" />
                      <div className="formula-token-row">
                        {["Width", "Height", "Perimeter", "+", "-", "*", "/", "(", ")"].map((token) => <button type="button" key={token} onClick={() => setMaterialQuantityFormula((formula) => `${formula}${formula && !["+", "-", "*", "/", ")"].includes(token) ? " " : ""}${token}`)}>{token}</button>)}
                        <button type="button" onClick={() => setMaterialQuantityFormula("CEILING(Perimeter/2,1)")}>CEILING example</button>
                        <button type="button" onClick={() => setMaterialQuantityFormula("ROUND+(NumberOfLeaves/2)")}>ROUND+ example</button>
                        <button type="button" onClick={() => setMaterialQuantityFormula("ROUND-(NumberOfLeaves/2)")}>ROUND− example</button>
                        <button type="button" onClick={() => setMaterialQuantityFormula("IF(Width>1.5,4,2)")}>IF threshold example</button>
                      </div>
                      <p>Allowed: <b>Width</b>, <b>Height</b>, <b>Perimeter</b>, numbers, +, -, *, /, brackets, <b>CEILING(value, significance)</b>, <b>ROUND+(value)</b> to round up, <b>ROUND-(value)</b> to round down, and <b>IF(condition, true, false)</b>. Dimensions are in metres.</p>
                      {formulaValidationError && <p className="formula-form-error" role="alert">Formula error: {formulaValidationError}</p>}
                    </section>}
                    <section className="material-photo-field" tabIndex={0} onPaste={pasteMaterialPhoto} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.focus(); }}>
                      <label>Photo <small>(optional)</small><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setMaterialPhoto(file); }} /><small>Choose an image file.</small></label>
                      <button type="button" className="paste-photo-button">Paste photo (then Ctrl+V)</button>
                      <small className="paste-photo-help">Copy an image, click this button, then press Ctrl+V.</small>
                      {materialSketch.startsWith("data:image/") ? <img className="material-upload-preview" src={materialSketch} alt={`${formName || "Material"} photo`} /> : <span className="material-photo-empty">No photo</span>}
                    </section>
                    <section className="material-drawing">
                      <div>
                        <strong>Drawing thumbnail</strong>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setMaterialSketch("")}
                        >
                          Clear drawing
                        </button>
                      </div>
                      <p>
                        Use the pen to draw the material shape. This drawing
                        becomes its thumbnail.
                      </p>
                      <svg
                        viewBox="0 0 100 100"
                        className="material-pen-canvas"
                        onPointerDown={materialDrawStart}
                        onPointerMove={materialDrawMove}
                        onPointerUp={materialDrawEnd}
                        onPointerLeave={materialDrawEnd}
                        aria-label="Free drawing canvas for the material thumbnail"
                      >
                        <rect width="100" height="100" fill="#f7faf9" />
                        <path
                          d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100"
                          stroke="#d8e7e6"
                          strokeWidth=".5"
                        />
                        <path
                          d={materialSketch}
                          fill="none"
                          stroke="#176c68"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {materialPenPoints.length > 1 && (
                          <path
                            d={`M${materialPenPoints.join(" L")}`}
                            fill="none"
                            stroke="#176c68"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                    </section>
                  </>
                )}
                {modal.type === "assembly" && (
                  <>
                    <fieldset className="assembly-values-section">
                      <legend>Values</legend>
                      <p>These values are supplied automatically by each window on the canvas and can be used directly in material formulas. Editable defaults are applied to newly placed openings; calculated values remain read-only.</p>
                      <div className="assembly-values-grid">
                        {assemblyFormulaValuesForEditor.map((value) => {
                          const setDefault = (change: Partial<AssemblyCanvasDefaults>) => setAssemblyCanvasDefaults((current) => ({ ...current, ...change }));
                          const defaultSetting = value.name === "Width" ? <label>Default setting<input type="number" min="200" max={MAX_OPENING_DIMENSION} value={assemblyCanvasDefaults.width ?? 1500} onChange={(event) => setDefault({ width: Math.min(MAX_OPENING_DIMENSION, Math.max(200, Number(event.target.value) || 200)) })} /><span>mm</span></label>
                            : value.name === "Height" ? <label>Default setting<input type="number" min="200" max={MAX_OPENING_DIMENSION} value={assemblyCanvasDefaults.height ?? 1200} onChange={(event) => setDefault({ height: Math.min(MAX_OPENING_DIMENSION, Math.max(200, Number(event.target.value) || 200)) })} /><span>mm</span></label>
                            : value.name === "NumberOfLeaves" ? <label>Default setting<select value={assemblyCanvasDefaults.leaves ?? 2} onChange={(event) => setDefault({ leaves: Number(event.target.value) as 1 | 2 | 3 | 4 })}><option value={1}>1 leaf</option><option value={2}>2 leaves</option><option value={3}>3 leaves</option><option value={4}>4 leaves</option></select></label>
                            : value.name === "OpeningType" ? <label>Default setting<select value={assemblyCanvasDefaults.openingType ?? "window"} onChange={(event) => setDefault({ openingType: event.target.value as "window" | "door" })}><option value="window">Window</option><option value="door">Door</option></select></label>
                            : value.name === "LeafSize" ? <label>Default setting<select value={assemblyCanvasDefaults.leafSize ?? "small"} onChange={(event) => setDefault({ leafSize: event.target.value as "small" | "big" })}><option value="small">Small</option><option value="big">Big</option></select></label>
                            : value.name === "FrameSize" ? <label>Default setting<select value={assemblyCanvasDefaults.frameSize ?? "small"} onChange={(event) => setDefault({ frameSize: event.target.value as "small" | "big" })}><option value="small">Small</option><option value="big">Big</option></select></label>
                            : value.name === "ArchitraveAllowance" ? <label>Default setting<select value={assemblyCanvasDefaults.hasArchitraveAllowance ? "with" : "without"} onChange={(event) => setDefault({ hasArchitraveAllowance: event.target.value === "with" })}><option value="without">Without</option><option value="with">With</option></select></label>
                            : value.name === "Architrave" ? <label>Default setting<select value={assemblyCanvasDefaults.hasArchitrave ? "with" : "without"} onChange={(event) => setDefault({ hasArchitrave: event.target.value === "with" })}><option value="without">Without</option><option value="with">With</option></select></label>
                            : value.name === "Reinforcement" ? <label>Default setting<select value={assemblyCanvasDefaults.reinforced ? "with" : "without"} onChange={(event) => setDefault({ reinforced: event.target.value === "with" })}><option value="without">Not reinforced</option><option value="with">Reinforced</option></select></label>
                            : value.name === "Coating" ? <label>Default setting<select value={assemblyCanvasDefaults.hasCoating ? "with" : "without"} onChange={(event) => setDefault({ hasCoating: event.target.value === "with" })}><option value="without">Without</option><option value="with">With</option></select></label>
                            : <span className="calculated-default">Calculated / read-only</span>;
                          return <div key={value.name}><b>{value.label}</b><code>{value.name}</code><small>{value.description}</small>{defaultSetting}</div>;
                        })}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend>Materials used</legend>
                      <p>Click a material photo, then choose <b>Insert</b>. You can insert the same material more than once; each row has its own formulas and IF condition. Use a reference such as <b>GYn2</b>, <b>A-24</b>, or <b>G1</b> only to select the material; once inserted, the assembly keeps its stable material link even if its database reference or location changes.</p>
                      <div className="assembly-material-table" role="table" aria-label="Assembly materials" style={{ "--assembly-material-columns": assemblyColumnWidths.map((width) => `${width}px`).join(" ") } as CSSProperties} onPointerMove={resizeAssemblyColumn} onPointerUp={() => setAssemblyColumnResize(null)} onPointerCancel={() => setAssemblyColumnResize(null)} onKeyDownCapture={(event) => { const target = event.target as HTMLElement; if (event.key === "Enter" && target.matches(".formula-value-editor input, .condition-formula-editor input")) { event.preventDefault(); target.blur(); } }}>
                        <div className="assembly-material-table-header" role="row">{["Assembly code", "Photo", "Material code", "Formula if true", "Formula if false", "IF condition"].map((title, index) => <span key={title}>{title}{index < 5 && <button type="button" className="assembly-column-resize" onPointerDown={(event) => startAssemblyColumnResize(event, index)} aria-label={`Resize ${title} column`} title="Drag to resize column" />}</span>)}</div>
                        {partIds.map((partId) => {
                          const material = materials.find((item) => item.id === partMaterialIds[partId]);
                          if (!material) return null;
                          return <>
                            <div className={`assembly-material-row selected ${moveMaterialId && moveMaterialId !== partId ? "move-target" : ""}`} key={partId} role="row">
                              <div className="assembly-label-field">
                                <output className="assembly-part-reference" aria-label={`Current database reference for ${material.name}`}>{materialDatabaseReference(material)}</output>
                                <button type="button" className="remove-assembly-material" onClick={() => setPartIds((ids) => ids.filter((id) => id !== partId))} aria-label={`Remove ${material.name}`}>×</button>
                              </div>
                              <div className="assembly-photo-cell"><button type="button" className="assembly-photo-button" onClick={() => moveMaterialId ? moveAssemblyPartAfter(moveMaterialId, partId) : setPhotoMenuMaterialId((current) => current === `assembly-${partId}` ? null : `assembly-${partId}`)} aria-label={`Actions for ${material.name}`}><Sketch path={material.sketch} label={material.name} /></button>{photoMenuMaterialId === `assembly-${partId}` && <div className="assembly-photo-menu"><button type="button" onClick={() => { setInsertAfterMaterialId(partId); setInsertMaterialCode(""); setPhotoMenuMaterialId(null); }}>Insert</button><button type="button" onClick={() => { setMoveMaterialId(partId); setPhotoMenuMaterialId(null); }}>Move</button></div>}</div>
                              <div className="assembly-material-code"><b>{material.code}</b><small>{material.name}</small></div>
                              <div className="formula-value-editor"><input className="assembly-formula-input" value={partFormulas[partId] ?? material.quantityFormula ?? "1"} onChange={(event) => setPartFormulas((values) => ({ ...values, [partId]: event.target.value }))} onFocus={() => beginFormulaEdit(partId, "true", material.quantityFormula ?? "1")} onBlur={() => { setActiveFormulaField((active) => active?.materialId === partId && active.field === "true" ? null : active); setFormulaEditBackup(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { cancelFormulaEdit(partId, "true"); event.currentTarget.blur(); } }} placeholder="e.g. Height*2*NumberOfLeaves" aria-label={`Formula if true for ${material.name}`} />{activeFormulaField?.materialId === partId && activeFormulaField.field === "true" && <div className="formula-values-helper" role="note"><b>Values</b>{assemblyFormulaValuesForEditor.map((value) => <button type="button" key={value.name} onMouseDown={(event) => event.preventDefault()} onClick={() => insertFormulaValue(partId, "true", value.name)}>{value.name}</button>)}<b>Round</b><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertFormulaValue(partId, "true", "ROUND+()")}>ROUND+</button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertFormulaValue(partId, "true", "ROUND-()")}>ROUND−</button><small>ROUND+ rounds up; ROUND− rounds down. Example: ROUND+(NumberOfLeaves/2)</small></div>}</div>
                              <div className="formula-value-editor"><input className="assembly-formula-input" value={partFourPanelFormulas[partId] ?? "0"} onChange={(event) => setPartFourPanelFormulas((values) => ({ ...values, [partId]: event.target.value }))} onFocus={() => beginFormulaEdit(partId, "false", "0")} onBlur={() => { setActiveFormulaField((active) => active?.materialId === partId && active.field === "false" ? null : active); setFormulaEditBackup(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { cancelFormulaEdit(partId, "false"); event.currentTarget.blur(); } }} placeholder="0" aria-label={`Formula if false for ${material.name}`} />{activeFormulaField?.materialId === partId && activeFormulaField.field === "false" && <div className="formula-values-helper" role="note"><b>Values</b>{assemblyFormulaValuesForEditor.map((value) => <button type="button" key={value.name} onMouseDown={(event) => event.preventDefault()} onClick={() => insertFormulaValue(partId, "false", value.name)}>{value.name}</button>)}<small>Click a value, then type operators and numbers.</small></div>}</div>
                              <div className="condition-formula-editor"><input className="assembly-formula-input" value={partConditions[partId] ?? ""} onChange={(event) => setPartConditions((values) => ({ ...values, [partId]: event.target.value }))} onFocus={() => { setActiveConditionMaterialId(partId); setConditionEditBackup({ materialId: partId, value: partConditions[partId] ?? "" }); }} onBlur={() => { setActiveConditionMaterialId((active) => active === partId ? null : active); setConditionEditBackup(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { if (conditionEditBackup?.materialId === partId) setPartConditions((values) => ({ ...values, [partId]: conditionEditBackup.value })); event.currentTarget.blur(); } }} placeholder="e.g. Area > 8" aria-label={`IF condition for ${material.name}`} />{activeConditionMaterialId === partId && <div className="condition-helper" role="note"><div><b>Values</b>{assemblyFormulaValuesForEditor.map((value) => <button type="button" key={value.name} onMouseDown={(event) => event.preventDefault()} onClick={() => insertConditionToken(partId, value.name)}>{value.name}</button>)}</div><div><b>Operators</b>{[" = ", " > ", " < ", " >= ", " <= ", " AND ", " OR ", "(", ")"].map((token) => <button type="button" key={token} onMouseDown={(event) => event.preventDefault()} onClick={() => insertConditionToken(partId, token)}>{token.trim() || "space"}</button>)}</div><small>Click tokens to insert them. Example: (Reinforcement = 0) AND (Architrave = 1)</small></div>}</div>
                            </div>
                            {insertAfterMaterialId === partId && <div className="assembly-material-insert-row"><span>Add another material row</span><input value={insertMaterialCode} onChange={(event) => setInsertMaterialCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAssemblyPartByCode(partId, insertMaterialCode, true); setInsertAfterMaterialId(null); } if (event.key === "Escape") setInsertAfterMaterialId(null); }} placeholder="Enter material reference, e.g. A-24" aria-label={`New material below ${material.name}`} /><button type="button" onClick={() => { addAssemblyPartByCode(partId, insertMaterialCode, true); setInsertAfterMaterialId(null); }}>Insert material</button><button type="button" onClick={() => setInsertAfterMaterialId(null)}>Cancel</button></div>}
                          </>;
                        })}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend>Frame types</legend>
                      <p>Set the frame type for this assembly. On the canvas, a Real join is allowed only when both openings resolve to the same frame type. Conditions can use values such as <b>FrameSize</b>, <b>Reinforcement</b>, <b>LeafSize</b>, and <b>Width</b>.</p>
                      <div className="frame-type-table" role="table" aria-label="Assembly frame types">
                        <div className="frame-type-header" role="row"><span>Type</span><span>Condition</span><span aria-label="Actions" /></div>
                        {frameTypes.map((row) => <div className="frame-type-row" role="row" key={row.id}>
                          <input value={row.type} onChange={(event) => setFrameTypes((rows) => rows.map((value) => value.id === row.id ? { ...value, type: event.target.value } : value))} placeholder="e.g. Small reinforced" aria-label="Frame type" />
                          <input value={row.condition} onChange={(event) => setFrameTypes((rows) => rows.map((value) => value.id === row.id ? { ...value, condition: event.target.value } : value))} placeholder="e.g. (FrameSize = 0) AND (Reinforcement = 1)" aria-label={`Condition for ${row.type || "frame type"}`} />
                          <button type="button" className="remove-frame-type" onClick={() => setFrameTypes((rows) => rows.filter((value) => value.id !== row.id))} aria-label={`Remove ${row.type || "frame type"}`}>×</button>
                        </div>)}
                      </div>
                      <button type="button" className="add-frame-type" onClick={() => setFrameTypes((rows) => [...rows, { id: makeId(), type: "", condition: "" }])}>Add type</button>
                    </fieldset>
                    <fieldset>
                      <legend>Names</legend>
                      <p>Set the drawing name symbol and its condition. Enter only the symbol, for example <b>DR</b>. The canvas assigns the number automatically: DR01, DR02.</p>
                      <div className="frame-type-table" role="table" aria-label="Assembly naming rules">
                        <div className="frame-type-header" role="row"><span>Name</span><span>Condition</span><span aria-label="Actions" /></div>
                        {nameRules.map((row) => <div className="frame-type-row" role="row" key={row.id}>
                          <input value={row.name} onChange={(event) => setNameRules((rows) => rows.map((value) => value.id === row.id ? { ...value, name: event.target.value.toUpperCase() } : value))} placeholder="e.g. DR" aria-label="Name symbol" />
                          <input value={row.condition} onChange={(event) => setNameRules((rows) => rows.map((value) => value.id === row.id ? { ...value, condition: event.target.value } : value))} placeholder="e.g. OpeningType = 1" aria-label={`Condition for ${row.name || "name"}`} />
                          <button type="button" className="remove-frame-type" onClick={() => setNameRules((rows) => rows.filter((value) => value.id !== row.id))} aria-label={`Remove ${row.name || "name"}`}>×</button>
                        </div>)}
                      </div>
                      <button type="button" className="add-frame-type" onClick={() => setNameRules((rows) => [...rows, { id: makeId(), name: "", condition: "" }])}>Add name</button>
                    </fieldset>
                    <fieldset>
                      <legend>Property match on joins</legend>
                      <p>Choose which canvas properties this assembly must copy from a joined assembly type. Each rule applies only to the selected join kind and selected assembly types.</p>
                      {(["real", "fake"] as const).map((kind) => {
                        const rows = kind === "real" ? realJoinPropertyMatches : fakeJoinPropertyMatches;
                        const title = kind === "real" ? "Property match when Real join" : "Property match when Fake join";
                        const assemblyForMatch = assemblies.find((assembly) => assembly.id === modal.id);
                        const properties = joinMatchPropertiesForAssembly(assemblyForMatch?.assemblyPage ?? activeDatabaseId, assemblyForMatch?.id ?? modal.id);
                        return <section className="join-property-match-section" key={kind}>
                          <strong>{title}</strong>
                          <div className="join-property-match-table" role="table" aria-label={title}>
                            <div className="join-property-match-header" role="row"><span>Type property</span><span>Assembly type</span><span aria-label="Actions" /></div>
                            {rows.map((row) => <div className="join-property-match-row" role="row" key={row.id}>
                              <select value={row.property} onChange={(event) => updateJoinPropertyMatch(kind, row.id, { property: event.target.value })} aria-label="Property to match">
                                {properties.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
                              </select>
                              <div className="join-match-assemblies">
                                {assemblies.map((assembly) => <label key={assembly.id}><input type="checkbox" checked={row.withAssemblyIds.includes(assembly.id)} onChange={(event) => updateJoinPropertyMatch(kind, row.id, { withAssemblyIds: event.target.checked ? [...row.withAssemblyIds, assembly.id] : row.withAssemblyIds.filter((id) => id !== assembly.id) })} />{assembly.name}</label>)}
                                {!assemblies.length && <small>Save an assembly type first.</small>}
                              </div>
                              <button type="button" className="delete-join-property" onClick={() => removeJoinPropertyMatch(kind, row.id)} aria-label={`Delete ${row.property} match rule`}>Delete property</button>
                            </div>)}
                          </div>
                          <button type="button" className="add-frame-type" onClick={() => addJoinPropertyMatch(kind, properties[0]?.value)}>Add property</button>
                        </section>;
                      })}
                    </fieldset>
                    {(assemblies.find((assembly) => assembly.id === modal.id)?.databaseId === TECHNAL_FYN_DATABASE && !usesDirectJoinValues(assemblies.find((assembly) => assembly.id === modal.id))) && <fieldset>
                      <legend>Join modification table</legend>
                      <p>These formulas are added to the normal material formula only when the opening has a Real join on that side.</p>
                      <div className="join-modification-table" role="table" aria-label="FYn join modification formulas">
                        <div className="join-modification-header" role="row"><span>Material</span><span>Top join</span><span>Bottom join</span><span>Left join</span><span>Right join</span></div>
                        {(joinModifications.length ? joinModifications : defaultFynJoinModifications()).map((modification) => {
                          const material = materials.find((item) => item.id === modification.materialId);
                          return <div className="join-modification-row" role="row" key={modification.materialId}>
                            <span><b>{material?.code ?? modification.materialId}</b><small>{material?.name ?? "Material"}</small></span>
                            {(["topFormula", "bottomFormula", "leftFormula", "rightFormula"] as const).map((field) => <input key={field} className="assembly-formula-input" value={modification[field]} onChange={(event) => setJoinModifications((rows) => (rows.length ? rows : defaultFynJoinModifications()).map((row) => row.materialId === modification.materialId ? { ...row, [field]: event.target.value } : row))} aria-label={`${field} for ${material?.code ?? modification.materialId}`} />)}
                          </div>;
                        })}
                      </div>
                    </fieldset>}
                    <section className="assembly-reference">
                      <div><strong>Reference photo</strong><small>Upload a product photo to keep with this assembly. It is used as a visual reference, not as a freehand drawing.</small></div>
                      <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setAssemblyReferenceImage(String(reader.result ?? "")); reader.readAsDataURL(file); }} />
                      {assemblyReferenceImage && <img src={assemblyReferenceImage} alt="Assembly reference" className="assembly-reference-preview" />}
                      <div className="assembly-drawing-note"><strong>Technical drawing</strong><small>This is defined by the assembly type. Send a reference drawing when you need it changed.</small></div>
                    </section>
                  </>
                )}
                {(modal.type === "project" || modal.type === "executionProject") && (
                  <>
                    <label>
                      Client name <span>*</span>
                      <input required value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Client" />
                    </label>
                    <label>
                      Company name <small>(optional)</small>
                      <input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Company" />
                    </label>
                    <label>
                      Location <span>*</span>
                      <input required value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Lebanon" />
                    </label>
                  </>
                )}
              </div>
              <div className="dialog-footer">
                {modal.type === "assembly" && modal.id ? <>
                  <span className={`assembly-autosave-status ${assemblyAutoSaveStatus}`}>{assemblyAutoSaveStatus === "saving" ? "Saving changes…" : workspaceSaveStatus === "error" ? "Save failed" : "Saved"}</span>
                  <button type="button" className="primary-button" onClick={closeModal}>Exit</button>
                </> : <>
                  <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
                  <button className="primary-button" type="submit">{modal.type === "assembly" ? "Create assembly" : modal.type === "executionProject" ? "Create project" : `Save ${modal.type}`}</button>
                </>}
              </div>
            </form>
          </section>
        </div>
      )}
      {newDatabaseParent && (
        <div className="dialog-backdrop" onMouseDown={() => setNewDatabaseParent(null)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">New component database</p><h2>Add to {newDatabaseParent === "technal" ? "Technal" : "Sidem"}</h2></div><button className="icon-button" onClick={() => setNewDatabaseParent(null)} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveNewDatabase}>
              <div className="dialog-form"><label>Component name <span>*</span><input autoFocus required value={newDatabaseName} onChange={(event) => setNewDatabaseName(event.target.value)} placeholder="e.g. 3-slider window" /><small>This creates a separate material database for this component.</small></label></div>
              <div className="dialog-footer"><button type="button" className="secondary-button" onClick={() => setNewDatabaseParent(null)}>Cancel</button><button className="primary-button" type="submit">Create database</button></div>
            </form>
          </section>
        </div>
      )}
      {newCompanyDatabaseOpen && (
        <div className="dialog-backdrop" onMouseDown={() => setNewCompanyDatabaseOpen(false)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="new-company-database-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">Company databases</p><h2 id="new-company-database-title">Add company database</h2></div><button type="button" className="icon-button" onClick={() => setNewCompanyDatabaseOpen(false)} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveNewCompanyDatabase}>
              <div className="dialog-form">
                <label>Company name <span>*</span><input autoFocus required value={newCompanyDatabaseName} onChange={(event) => { setNewCompanyDatabaseName(event.target.value); setNewCompanyDatabaseError(""); }} placeholder="e.g. Sidem, Alustil, or Gutmann" /><small>This creates an organized view in the shared material database. It starts with no tables or materials.</small></label>
                {newCompanyDatabaseError && <p className="field-error">{newCompanyDatabaseError}</p>}
              </div>
              <div className="dialog-footer"><button type="button" className="secondary-button" onClick={() => setNewCompanyDatabaseOpen(false)}>Cancel</button><button type="submit" className="primary-button">Create database</button></div>
            </form>
          </section>
        </div>
      )}
      {newCompanyTableFor && (
        <div className="dialog-backdrop" onMouseDown={() => setNewCompanyTableFor(null)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="new-company-table-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">{newCompanyTableFor.name} Database</p><h2 id="new-company-table-title">Add material table</h2></div><button type="button" className="icon-button" onClick={() => setNewCompanyTableFor(null)} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveNewCompanyTable}>
              <div className="dialog-form">
                <label>Table name <span>*</span><input autoFocus required value={newCompanyTableName} onChange={(event) => { setNewCompanyTableName(event.target.value); setNewCompanyTableError(""); }} placeholder="e.g. Sliding profiles" /></label>
                <label>Material reference <span>*</span><input required value={newCompanyTableReference} onChange={(event) => { setNewCompanyTableReference(event.target.value); setNewCompanyTableError(""); }} placeholder="e.g. SD" /><small>The first material will be numbered <b>{companyTableReferencePrefix(newCompanyTableReference) ? `${companyTableReferencePrefix(newCompanyTableReference)}-1` : "—"}</b>. Existing table references are blocked.</small></label>
                {newCompanyTableError && <p className="field-error">{newCompanyTableError}</p>}
              </div>
              <div className="dialog-footer"><button type="button" className="secondary-button" onClick={() => setNewCompanyTableFor(null)}>Cancel</button><button type="submit" className="primary-button">Add table</button></div>
            </form>
          </section>
        </div>
      )}
      {moveCompanyTable && (
        <div className="dialog-backdrop" onMouseDown={() => setMoveCompanyTable(null)}>
          <section className="material-dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="move-company-table-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header"><div><p className="eyebrow">Move material table</p><h2 id="move-company-table-title">Move {moveCompanyTable.name}</h2></div><button type="button" className="icon-button" onClick={() => setMoveCompanyTable(null)} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveMoveCompanyTable}>
              <div className="dialog-form">
                <label>Move to database page <select value={moveCompanyTableTargetId} onChange={(event) => setMoveCompanyTableTargetId(event.target.value)}>{[{ id: "prices", name: "Soleal" }, ...companyDatabases].filter((database) => database.id !== moveCompanyTable.sourceDatabaseId).map((database) => <option key={database.id} value={database.id}>{database.name} Database</option>)}</select><small>All materials in this table move with it. Assembly links remain unchanged.</small></label>
              </div>
              <div className="dialog-footer"><button type="button" className="secondary-button" onClick={() => setMoveCompanyTable(null)}>Cancel</button><button type="submit" className="primary-button">Move table</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
export default App;
