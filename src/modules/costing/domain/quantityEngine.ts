import type { Assembly, AssemblyPart, CanvasItem, Material } from "../../../domain/types";
import { calculateFormula, conditionMatches, number } from "../../../domain/calculations";
import { joinedSidesForItem, joinLengthForItem } from "../../projects/domain/joinEngine";

/**
 * The formula/quantity takeoff engine: turning a canvas opening's dimensions,
 * selected options, and join state into the variable bag used by every
 * quantity formula and rule condition, then resolving one assembly part's
 * material quantity for that opening.
 *
 * Relocated out of `App.tsx` (previously closures over `materials`/
 * `assemblies` state) as part of Phase 2 of the modular-monolith refactor —
 * see docs/architecture/OVERVIEW.md. This module intentionally depends on
 * `modules/projects/domain/joinEngine` (costing needs join-derived geometry
 * to compute quantities) — a documented one-directional dependency; nothing
 * in `joinEngine` depends back on this file.
 */

/** Must match the constants of the same name/value in App.tsx. */
const TECHNAL_FYN_DATABASE = "technal-fyn";
const TECHNAL_FY_DATABASE = "technal-fy";
const HINGE_WINDOW_PAGE = "hinge-window";
const FIXED_WINDOW_PAGE = "fixed-window";
const TILT_AND_TURN_PAGE = "tilt-and-turn";
const DIRECT_JOIN_VALUE_ASSEMBLY_IDS = new Set(["hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"]);

export const usesDirectJoinValues = (assembly?: Assembly) => {
  if (!assembly) return false;
  if (DIRECT_JOIN_VALUE_ASSEMBLY_IDS.has(assembly.id)) return true;
  const name = assembly.name.toLowerCase();
  const namedFynWindowType = /^(hinged window|fixed window|tilt and turn)\s*-\s*soleal\s*-\s*fyn$/.test(name);
  return namedFynWindowType || ([TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].includes(assembly.databaseId ?? "")
    && [HINGE_WINDOW_PAGE, FIXED_WINDOW_PAGE, TILT_AND_TURN_PAGE].includes(assembly.assemblyPage ?? ""));
};

/** Duplicated (deliberately) from App.tsx, which keeps its own copy for UI
 * display columns — see App.tsx's `inferGlassThickness`. Pure, no state. */
const inferGlassThickness = (material?: Material) => {
  const layers = [...(material?.options?.join(" ").matchAll(/\b(\d+(?:\.\d+)?)\s*mm\b/gi) ?? [])].map((match) => match[1]);
  const storedLayers = [...(material?.thickness?.matchAll(/\d+(?:\.\d+)?/g) ?? [])].map((match) => match[0]);
  const values = layers.length ? layers : storedLayers;
  if (!values.length) return "";
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return `${number(total)} mm`;
};

export const canvasFormulaValues = (item: CanvasItem, materials: Material[] = []) => {
  const glass = materials.find((material) => material.id === item.glassMaterialId);
  return {
    ...item.parameters,
    NumberOfLeaves: item.leaves ?? 2,
    OpeningType: item.openingType === "door" ? 1 : 0,
    LeafSize: item.leafSize === "big" ? 1 : 0,
    FrameSize: item.frameSize === "big" ? 1 : 0,
    ArchitraveAllowance: item.hasArchitraveAllowance ? 1 : 0,
    Architrave: item.hasArchitrave ? 1 : 0,
    Reinforcement: item.reinforced ? 1 : 0,
    FlyScreen: item.hasFlyScreen ? 1 : 0,
    GlassThickness: Number.parseFloat(inferGlassThickness(glass)) || 0,
    Coating: item.hasCoating ? 1 : 0,
  };
};

export const formulaValuesForItem = (item: CanvasItem, materials: Material[], allItems: CanvasItem[]) => {
  const joinedSides = joinedSidesForItem(item, allItems);
  const joinedCorners = new Set<string>();
  if (joinedSides.includes("top")) { joinedCorners.add("top-left"); joinedCorners.add("top-right"); }
  if (joinedSides.includes("bottom")) { joinedCorners.add("bottom-left"); joinedCorners.add("bottom-right"); }
  if (joinedSides.includes("left")) { joinedCorners.add("top-left"); joinedCorners.add("bottom-left"); }
  if (joinedSides.includes("right")) { joinedCorners.add("top-right"); joinedCorners.add("bottom-right"); }
  return {
    ...canvasFormulaValues(item, materials),
    JoinedUp: joinedSides.includes("top") ? 1 : 0,
    JoinedDown: joinedSides.includes("bottom") ? 1 : 0,
    JoinedLeft: joinedSides.includes("left") ? 1 : 0,
    JoinedRight: joinedSides.includes("right") ? 1 : 0,
    JoinedCorners: joinedCorners.size,
    JoinLength: joinLengthForItem(item, allItems),
  };
};

/** Evaluates whether `assembly.frameTypes` has a matching row for this item —
 * used by the window-join engine's Real-join validation (see joinEngine.ts's
 * `FrameTypeResolver`), kept here because it needs the full materials-aware
 * formula-values bag above. */
export const frameTypeForItem = (item: CanvasItem, assemblies: Assembly[], materials: Material[], allItems: CanvasItem[]) => {
  const assembly = assemblies.find((value) => value.id === item.sourceId);
  const frameType = assembly?.frameTypes?.find((row) => row.type.trim() && conditionMatches(
    row.condition,
    item.inputWidth ?? 1500,
    item.inputHeight ?? 1200,
    formulaValuesForItem(item, materials, allItems),
  ));
  return frameType?.type.trim() || null;
};

export const calculatePartQuantity = (
  item: CanvasItem,
  part: AssemblyPart,
  material: Material,
  assemblies: Assembly[],
  materials: Material[],
  allItems: CanvasItem[],
) => {
  const width = item.inputWidth ?? 1500;
  const height = item.inputHeight ?? 1200;
  const values = formulaValuesForItem(item, materials, allItems);
  const conditionIsTrue = conditionMatches(part.conditionFormula, width, height, values);
  const formula = conditionIsTrue
    ? part.quantityFormula?.trim() || material.quantityFormula?.trim() || String(part.quantity)
    : part.quantityFormulaOtherwise?.trim() || part.quantityFormulaFourPanels?.trim() || "0";
  const base = calculateFormula(formula, width, height, values);
  const assembly = assemblies.find((value) => value.id === item.sourceId);
  const joinSides = joinedSidesForItem(item, allItems);
  const joinFormulas = usesDirectJoinValues(assembly) ? [] : (assembly?.joinModifications ?? []).filter((modification) => modification.materialId === part.materialId).flatMap((modification) => joinSides.map((side) => modification[`${side}Formula`]));
  const joinResults = joinFormulas.map((joinFormula) => calculateFormula(joinFormula.replace(/^[-+]/, ""), item.inputWidth ?? 1500, item.inputHeight ?? 1200, formulaValuesForItem(item, materials, allItems)));
  const joinAdjustment = joinFormulas.reduce((total, joinFormula, index) => total + (joinFormula.trim().startsWith("-") ? -joinResults[index].value : joinResults[index].value), 0);
  const adjustmentFormula = item.materialAdjustments?.[part.materialId]?.trim();
  if (!adjustmentFormula && !joinFormulas.length) return { formula, result: base };
  const subtract = adjustmentFormula?.startsWith("-") ?? false;
  const adjustment = adjustmentFormula ? calculateFormula(adjustmentFormula.replace(/^[-+]/, ""), item.inputWidth ?? 1500, item.inputHeight ?? 1200, formulaValuesForItem(item, materials, allItems)) : { value: 0 };
  const additions = [...joinFormulas, adjustmentFormula].filter(Boolean).map((value) => `(${value})`).join(" + ");
  return { formula: `${formula}${additions ? ` + ${additions}` : ""}`, result: { value: Math.max(0, base.value + joinAdjustment + (subtract ? -adjustment.value : adjustment.value)), error: base.error ?? joinResults.find((result) => result.error)?.error ?? adjustment.error } };
};
