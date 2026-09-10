import { useMemo } from "react";
import {
  calculateFormula,
  CalculationResult,
  number,
  unitPriceWithShipping,
} from "../../../domain/calculations";
import type {
  Assembly,
  AssemblyPart,
  CanvasItem,
  ManpowerCost,
  MarkupRate,
  Material,
  Project,
  ShippingCost,
  ShippingType,
} from "../../../domain/types";
import { FLY_SCREEN_PAGE, glassAreaForWindow } from "../../catalog/domain/catalogDefinitions";
import { defaultManpowerHours } from "../domain/projectDefaults";

export type CanvasTakeoffItem = {
  material?: Material;
  quantity: number;
  total: number;
  assemblyQuantity: number;
  formulas: { label: string; isError: boolean }[];
};

export type ItemMaterialTakeoffRow = {
  material: Material;
  reference: string;
  quantity: number;
  total: number;
  formula: string;
  isError: boolean;
};

export type ItemGlassTakeoffRow = {
  material: Material;
  quantity: number;
  total: number;
};

type UseCanvasTakeoffParams = {
  project?: Project;
  materials: Material[];
  assemblies: Assembly[];
  selectedCanvasId: string;
  itemMaterialPanelId: string | null;
  calculatePartQuantity: (
    item: CanvasItem,
    part: AssemblyPart,
    material: Material
  ) => { result: CalculationResult; formula: string };
  formulaValuesForItem: (item: CanvasItem) => Record<string, number>;
  materialDatabaseReference: (material: Material) => string;
  shippingRateForMaterial: (material: Material) => number;
  shippingTypes: ShippingType[];
  shippingCosts: ShippingCost[];
  manpowerCosts: ManpowerCost[];
  markupRates: MarkupRate[];
};

export function useCanvasTakeoff({
  project,
  materials,
  assemblies,
  selectedCanvasId,
  itemMaterialPanelId,
  calculatePartQuantity,
  formulaValuesForItem,
  materialDatabaseReference,
  shippingRateForMaterial,
  shippingTypes,
  shippingCosts,
  manpowerCosts,
  markupRates,
}: UseCanvasTakeoffParams) {
  const liveMaterialTotals = useMemo<CanvasTakeoffItem[]>(() => {
    const totals = new Map<
      string,
      { quantity: number; total: number; assemblyQuantity: number; formulas: { label: string; isError: boolean }[] }
    >();

    const add = (
      materialId: string,
      result: CalculationResult,
      formula?: string,
      opening?: string,
      assemblyQuantity = result.value,
      itemQuantity = 1
    ) => {
      const material = materials.find((value) => value.id === materialId);
      if (!material) return;
      const current = totals.get(materialId) ?? { quantity: 0, total: 0, assemblyQuantity: 0, formulas: [] };
      const quantityWithWastage = result.value * Math.max(1, itemQuantity) * (1 + Math.max(0, material.wastage ?? 0) / 100);
      const wastageMultiplier = 1 + Math.max(0, material.wastage ?? 0) / 100;
      const calculation = formula ? `(${formula}) × ${number(wastageMultiplier)}` : "Manual quantity";
      const origin = opening ? `${opening} — ` : "";
      const formulaTag = {
        label: result.error ? `${origin}${calculation}: ${result.error}` : `${origin}${calculation} = ${number(quantityWithWastage)} ${material.unit}`,
        isError: Boolean(result.error),
      };
      const alreadyRecorded = current.formulas.some((entry) => entry.label === formulaTag.label);
      totals.set(materialId, {
        quantity: current.quantity + quantityWithWastage,
        total: current.total + quantityWithWastage * unitPriceWithShipping(material, shippingRateForMaterial(material)),
        assemblyQuantity: current.assemblyQuantity + assemblyQuantity * Math.max(1, itemQuantity),
        formulas: alreadyRecorded ? current.formulas : [...current.formulas, formulaTag],
      });
    };

    project?.items.forEach((item) => {
      const opening = item.kind === "assembly" ? item.name : "Manual material";
      if (item.kind === "material") {
        add(item.sourceId, { value: 1 }, undefined, opening, 1, item.quantity ?? 1);
        return;
      }
      const assembly = assemblies.find((value) => value.id === item.sourceId);
      const parts = assembly
        ? [
            ...assembly.parts,
            ...(assembly.joinModifications ?? [])
              .filter((modification) => !assembly.parts.some((part) => part.materialId === modification.materialId))
              .map((modification) => ({ materialId: modification.materialId, quantity: 0, quantityFormula: "0", label: "Join modification" })),
          ]
        : [];
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
        const adjustment = adjustmentFormula
          ? calculateFormula(adjustmentFormula.replace(/^[-+]/, ""), item.inputWidth ?? 1500, item.inputHeight ?? 1200, formulaValuesForItem(item))
          : { value: 0 };
        add(
          item.glassMaterialId,
          { value: Math.max(0, baseGlassArea + (subtract ? -adjustment.value : adjustment.value)) },
          adjustmentFormula ? `Glass area + (${adjustmentFormula})` : "Glass area",
          opening,
          undefined,
          item.quantity ?? 1
        );
      }
    });

    return [...totals.entries()]
      .map(([materialId, values]) => ({
        material: materials.find((value) => value.id === materialId),
        ...values,
      }))
      .filter((entry) => entry.material && entry.assemblyQuantity > 0);
  }, [project, assemblies, materials, shippingTypes, shippingCosts, calculatePartQuantity, formulaValuesForItem, shippingRateForMaterial]);

  const materialTakeoff = useMemo(() => liveMaterialTotals.filter(({ material }) => material?.databaseId !== "glass"), [liveMaterialTotals]);
  const glassTakeoff = useMemo(() => liveMaterialTotals.filter(({ material }) => material?.databaseId === "glass"), [liveMaterialTotals]);

  const itemMaterialTakeoff = useMemo<ItemMaterialTakeoffRow[]>(() => {
    const item = project?.items.find((value) => value.id === itemMaterialPanelId);
    if (!item || item.kind !== "assembly") return [];
    const assembly = assemblies.find((value) => value.id === item.sourceId);
    if (!assembly) return [];
    const parts = [
      ...assembly.parts.map((part) => ({ part, joinOnly: false })),
      ...(assembly.joinModifications ?? [])
        .filter((modification) => !assembly.parts.some((part) => part.materialId === modification.materialId))
        .map((modification) => ({
          part: { materialId: modification.materialId, quantity: 0, quantityFormula: "0", label: "Join modification" },
          joinOnly: true,
        })),
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
      return [
        {
          material,
          reference: part.label ?? materialDatabaseReference(material),
          quantity,
          total: quantity * unitPriceWithShipping(material, shippingRateForMaterial(material)),
          formula,
          isError: Boolean(calculated.result.error),
        },
      ];
    });
  }, [project, itemMaterialPanelId, assemblies, materials, shippingTypes, shippingCosts, calculatePartQuantity, materialDatabaseReference, shippingRateForMaterial]);

  const itemMaterialPanel = project?.items.find((item) => item.id === itemMaterialPanelId);

  const itemGlassTakeoff = useMemo<ItemGlassTakeoffRow[]>(() => {
    if (!itemMaterialPanel?.glassMaterialId) return [];
    const material = materials.find((value) => value.id === itemMaterialPanel.glassMaterialId);
    if (!material) return [];
    const baseQuantity = glassAreaForWindow(
      itemMaterialPanel.inputWidth ?? 1500,
      itemMaterialPanel.inputHeight ?? 1200,
      itemMaterialPanel.leaves ?? 2
    );
    const adjustmentFormula = itemMaterialPanel.materialAdjustments?.[material.id]?.trim();
    const subtract = adjustmentFormula?.startsWith("-");
    const adjustment = adjustmentFormula
      ? calculateFormula(
          adjustmentFormula.replace(/^[-+]/, ""),
          itemMaterialPanel.inputWidth ?? 1500,
          itemMaterialPanel.inputHeight ?? 1200,
          formulaValuesForItem(itemMaterialPanel)
        )
      : { value: 0 };
    const quantity =
      Math.max(0, baseQuantity + (subtract ? -adjustment.value : adjustment.value)) * Math.max(1, itemMaterialPanel.quantity ?? 1);
    return [
      {
        material,
        quantity,
        total: quantity * unitPriceWithShipping(material, shippingRateForMaterial(material)),
      },
    ];
  }, [itemMaterialPanel, materials, shippingTypes, shippingCosts, formulaValuesForItem, shippingRateForMaterial]);

  const activeCanvas = project?.canvases?.find((canvas) => canvas.id === selectedCanvasId);
  const activeManpowerHours = { ...defaultManpowerHours, ...activeCanvas?.manpowerHours };
  const manpowerParameter = activeCanvas?.manpowerParameter ?? "area";
  const selectedManpowerItemIds = useMemo(
    () =>
      new Set(
        activeCanvas?.manpowerItemIds ??
          project?.items
            .filter((item) => item.assemblyPage !== FLY_SCREEN_PAGE && item.sourceId !== "fly-screen-2rail")
            .map((item) => item.id) ??
          []
      ),
    [activeCanvas, project]
  );
  const manpowerParameterUnit: Record<typeof manpowerParameter, string> = {
    width: "lm",
    height: "lm",
    area: "m²",
    perimeter: "lm",
  };
  const manpowerParameterQuantity = useMemo(
    () =>
      project?.items
        .filter((item) => selectedManpowerItemIds.has(item.id))
        .reduce((total, item) => {
          const width = Math.max(0, item.inputWidth ?? item.width) / 1000;
          const height = Math.max(0, item.inputHeight ?? item.height) / 1000;
          const measure =
            manpowerParameter === "width"
              ? width
              : manpowerParameter === "height"
                ? height
                : manpowerParameter === "area"
                  ? width * height
                  : 2 * (width + height);
          return total + measure * Math.max(1, item.quantity ?? 1);
        }, 0) ?? 0,
    [project, selectedManpowerItemIds, manpowerParameter]
  );

  const manpowerRows = useMemo(
    () =>
      manpowerCosts.map((cost) => {
        const hoursPerUnit = Math.max(0, activeManpowerHours[cost.id] ?? 0);
        const hours = hoursPerUnit * manpowerParameterQuantity;
        return { ...cost, hoursPerUnit, hours, total: hours * cost.rate };
      }),
    [activeManpowerHours, manpowerCosts, manpowerParameterQuantity]
  );

  const manpowerTakeoff = useMemo(() => manpowerRows.filter((cost) => cost.hours > 0), [manpowerRows]);
  const manpowerTotal = useMemo(() => manpowerTakeoff.reduce((total, cost) => total + cost.total, 0), [manpowerTakeoff]);
  const materialTakeoffTotal = useMemo(() => materialTakeoff.reduce((total, row) => total + row.total, 0), [materialTakeoff]);
  const glassTakeoffTotal = useMemo(() => glassTakeoff.reduce((total, row) => total + row.total, 0), [glassTakeoff]);
  const directCost = materialTakeoffTotal + glassTakeoffTotal + manpowerTotal;
  const selectedMarkupType = activeCanvas?.markupType ?? "typeA";
  const selectedMarkupRate = markupRates.reduce((total, markup) => total + markup[selectedMarkupType], 0);
  const selectedMarkupName =
    selectedMarkupType === "typeA" ? "Type A" : selectedMarkupType === "typeB" ? "Type B" : "Type C";

  return {
    liveMaterialTotals,
    materialTakeoff,
    glassTakeoff,
    itemMaterialTakeoff,
    itemGlassTakeoff,
    itemMaterialPanel,
    activeCanvas,
    activeManpowerHours,
    manpowerParameter,
    selectedManpowerItemIds,
    manpowerParameterUnit,
    manpowerParameterQuantity,
    manpowerRows,
    manpowerTakeoff,
    manpowerTotal,
    materialTakeoffTotal,
    glassTakeoffTotal,
    directCost,
    selectedMarkupType,
    selectedMarkupRate,
    selectedMarkupName,
  };
}
