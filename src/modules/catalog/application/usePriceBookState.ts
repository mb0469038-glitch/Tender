import { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction, useEffect, useState, WheelEvent } from "react";
import type { Assembly, Material, Project, Screen } from "../../../domain/types";
import {
  PriceHistorySnapshot,
  TECHNAL_FY_DATABASE,
  TECHNAL_FYN_DATABASE,
  TECHNAL_GY_DATABASE,
  TECHNAL_GYN_DATABASE,
} from "../domain/catalogDefinitions";

type UsePriceBookStateParams = {
  materials: Material[];
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  assemblies: Assembly[];
  setAssemblies: Dispatch<SetStateAction<Assembly[]>>;
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  weightRates: Record<string, number>;
  setWeightRates: Dispatch<SetStateAction<Record<string, number>>>;
  screen: Screen;
};

export function usePriceBookState({
  materials,
  setMaterials,
  assemblies,
  setAssemblies,
  projects,
  setProjects,
  weightRates,
  setWeightRates,
  screen,
}: UsePriceBookStateParams) {
  const [tableZoom, setTableZoom] = useState(100);
  const [selectedPriceMaterialIds, setSelectedPriceMaterialIds] = useState<Set<string>>(new Set());
  const [priceUndoHistory, setPriceUndoHistory] = useState<PriceHistorySnapshot[]>([]);
  const [priceRedoHistory, setPriceRedoHistory] = useState<PriceHistorySnapshot[]>([]);
  const [priceSelectionMode, setPriceSelectionMode] = useState(false);
  const [priceDeleteMode, setPriceDeleteMode] = useState(false);
  const [priceSelectionPending, setPriceSelectionPending] = useState<{ materialId: string; startX: number; startY: number } | null>(null);
  const [priceSelectionDrag, setPriceSelectionDrag] = useState<{ select: boolean } | null>(null);
  const [collapsedPriceTables, setCollapsedPriceTables] = useState<Set<string>>(new Set());
  const [rateMethodMenu, setRateMethodMenu] = useState<{ materialId: string; tableId: string } | null>(null);
  const [stockLengthMenu, setStockLengthMenu] = useState<{ materialId: string; entryId: string } | null>(null);
  const [photoMenuMaterialId, setPhotoMenuMaterialId] = useState<string | null>(null);
  const [moveMaterialId, setMoveMaterialId] = useState<string | null>(null);

  const priceSnapshot = (): PriceHistorySnapshot =>
    JSON.parse(JSON.stringify({ materials, assemblies, projects, weightRates })) as PriceHistorySnapshot;

  const recordPriceChange = () => {
    setPriceUndoHistory((history) => [...history.slice(-24), priceSnapshot()]);
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
    if (!priceUndoHistory.length) return;
    const snapshot = priceUndoHistory[priceUndoHistory.length - 1];
    setPriceUndoHistory((history) => history.slice(0, -1));
    setPriceRedoHistory((history) => [...history, priceSnapshot()]);
    restorePriceSnapshot(snapshot);
  };

  const redoPriceChange = () => {
    if (!priceRedoHistory.length) return;
    const snapshot = priceRedoHistory[priceRedoHistory.length - 1];
    setPriceRedoHistory((history) => history.slice(0, -1));
    setPriceUndoHistory((history) => [...history, priceSnapshot()]);
    restorePriceSnapshot(snapshot);
  };

  // Drag selection effects
  useEffect(() => {
    if (!priceSelectionPending && !priceSelectionDrag) return;
    const stopDragSelection = () => {
      setPriceSelectionPending(null);
      setPriceSelectionDrag(null);
    };
    const onPointerUp = () => stopDragSelection();
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [priceSelectionPending, priceSelectionDrag]);

  useEffect(() => {
    if (!priceSelectionPending) return;
    const onPointerMove = (event: globalThis.PointerEvent) => {
      if (Math.hypot(event.clientX - priceSelectionPending.startX, event.clientY - priceSelectionPending.startY) < 6) return;
      const targetId = priceSelectionPending.materialId;
      const nextMode = !selectedPriceMaterialIds.has(targetId);
      setPriceSelectionMode(true);
      setPriceSelectionDrag({ select: nextMode });
      setSelectedPriceMaterialIds((current) => {
        const next = new Set(current);
        if (nextMode) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      setPriceSelectionPending(null);
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [priceSelectionPending, selectedPriceMaterialIds]);

  useEffect(() => {
    const exitPriceSelectionModes = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPriceSelectionMode(false);
        setPriceDeleteMode(false);
        setSelectedPriceMaterialIds(new Set());
        setPriceSelectionPending(null);
        setPriceSelectionDrag(null);
      }
    };
    window.addEventListener("keydown", exitPriceSelectionModes);
    return () => window.removeEventListener("keydown", exitPriceSelectionModes);
  }, []);

  useEffect(() => {
    const priceHistoryShortcuts = (event: KeyboardEvent) => {
      if (
        screen !== "database" ||
        !(event.ctrlKey || event.metaKey) ||
        ["input", "textarea", "select"].includes((event.target as HTMLElement | null)?.tagName.toLowerCase() ?? "")
      )
        return;
      if (event.key.toLowerCase() === "z") {
        if (event.shiftKey) {
          event.preventDefault();
          redoPriceChange();
        } else {
          event.preventDefault();
          undoPriceChange();
        }
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoPriceChange();
      }
    };
    window.addEventListener("keydown", priceHistoryShortcuts);
    return () => window.removeEventListener("keydown", priceHistoryShortcuts);
  }, [screen, priceUndoHistory, priceRedoHistory]);

  const zoomTable = (event: WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    setTableZoom((zoom) => Math.max(70, Math.min(160, zoom + (event.deltaY < 0 ? 5 : -5))));
  };

  const beginRowDragSelection = (event: ReactPointerEvent<HTMLDivElement>, materialId: string) => {
    if (event.buttons !== 1 || (event.target as HTMLElement | null)?.closest("button, input, select, textarea, a, label, .sketch"))
      return;
    setPriceSelectionPending({ materialId, startX: event.clientX, startY: event.clientY });
  };

  const extendRowDragSelection = (materialId: string) => {
    if (!priceSelectionDrag) return;
    setSelectedPriceMaterialIds((current) => {
      const next = new Set(current);
      if (priceSelectionDrag.select) next.add(materialId);
      else next.delete(materialId);
      return next;
    });
  };

  const togglePriceMaterialSelection = (materialId: string, selected: boolean) => {
    setSelectedPriceMaterialIds((current) => {
      const next = new Set(current);
      if (selected) next.add(materialId);
      else next.delete(materialId);
      return next;
    });
  };

  const movePriceMaterialAfter = (movingId: string, targetId: string) => {
    if (movingId === targetId) return;
    recordPriceChange();
    setMaterials((items) => {
      const moving = items.find((item) => item.id === movingId);
      const withoutMoving = items.filter((item) => item.id !== movingId);
      const targetIndex = withoutMoving.findIndex((item) => item.id === targetId);
      return !moving || targetIndex < 0
        ? items
        : [...withoutMoving.slice(0, targetIndex + 1), moving, ...withoutMoving.slice(targetIndex + 1)];
    });
    setMoveMaterialId(null);
  };

  const movePriceMaterialToTable = (
    movingId: string,
    databaseId: string,
    priceTable: Material["priceTable"],
    companyTableId?: string
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
    setMaterials((items) =>
      items.map((material) =>
        material.rateMethod === "weight" && material.weightRateTableId === tableId
          ? { ...material, cost: Math.max(0, material.weight) * rate }
          : material
      )
    );
  };

  const setMaterialRateMethod = (material: Material, tableId: string, rateMethod: "manual" | "weight") => {
    recordPriceChange();
    const weightRate = weightRates[tableId] ?? 0;
    const targets = priceSelectionMode && selectedPriceMaterialIds.has(material.id) ? selectedPriceMaterialIds : new Set([material.id]);
    setMaterials((items) =>
      items.map((item) => {
        if (!targets.has(item.id)) return item;
        const manualRate = item.rateMethod === "manual" ? item.cost : item.manualRate ?? item.cost;
        return {
          ...item,
          rateMethod,
          manualRate,
          weightRateTableId: rateMethod === "weight" ? tableId : undefined,
          cost: rateMethod === "weight" ? Math.max(0, item.weight) * weightRate : manualRate,
        };
      })
    );
    setRateMethodMenu(null);
  };

  const deletePriceMaterial = (material: Material) => {
    const usedIn = assemblies
      .filter(
        (assembly) =>
          assembly.parts.some((part) => part.materialId === material.id) ||
          assembly.joinModifications?.some((modification) => modification.materialId === material.id)
      )
      .map((assembly) => assembly.name);
    const confirmationMessage = usedIn.length
      ? `Be careful: this material is used in the following assembly type${usedIn.length === 1 ? "" : "s"}: ${usedIn.join(
          ", "
        )}.\n\nDeleting it will remove the material and its formulas from those assemblies.\n\nAre you sure you want to delete ${
          material.name
        }?`
      : `Are you sure you want to delete ${material.name}? This cannot be undone.`;
    if (!confirm(confirmationMessage)) return;
    recordPriceChange();
    setMaterials((items) => items.filter((item) => item.id !== material.id));
    setAssemblies((items) =>
      items.map((assembly) => ({
        ...assembly,
        parts: assembly.parts.filter((part) => part.materialId !== material.id),
        joinModifications: assembly.joinModifications?.filter((modification) => modification.materialId !== material.id),
      }))
    );
  };

  const deleteSelectedPriceMaterials = () => {
    if (!selectedPriceMaterialIds.size) return;
    if (
      !confirm(
        `Delete ${selectedPriceMaterialIds.size} selected material component(s)? This also removes them from their database and cannot be undone.`
      )
    )
      return;
    recordPriceChange();
    const selected = selectedPriceMaterialIds;
    setMaterials((items) => items.filter((item) => !selected.has(item.id)));
    setAssemblies((items) =>
      items.map((assembly) => ({ ...assembly, parts: assembly.parts.filter((part) => !selected.has(part.materialId)) }))
    );
    setProjects((items) =>
      items.map((project) => ({
        ...project,
        items: project.items.filter((item) => item.kind !== "material" || !selected.has(item.sourceId)),
      }))
    );
    setSelectedPriceMaterialIds(new Set());
    setPriceDeleteMode(false);
  };

  return {
    tableZoom,
    setTableZoom,
    zoomTable,
    selectedPriceMaterialIds,
    setSelectedPriceMaterialIds,
    priceUndoHistory,
    priceRedoHistory,
    priceSelectionMode,
    setPriceSelectionMode,
    priceDeleteMode,
    setPriceDeleteMode,
    priceSelectionPending,
    setPriceSelectionPending,
    priceSelectionDrag,
    setPriceSelectionDrag,
    collapsedPriceTables,
    setCollapsedPriceTables,
    rateMethodMenu,
    setRateMethodMenu,
    stockLengthMenu,
    setStockLengthMenu,
    photoMenuMaterialId,
    setPhotoMenuMaterialId,
    moveMaterialId,
    setMoveMaterialId,
    recordPriceChange,
    undoPriceChange,
    redoPriceChange,
    beginRowDragSelection,
    extendRowDragSelection,
    togglePriceMaterialSelection,
    movePriceMaterialAfter,
    movePriceMaterialToTable,
    movePriceMaterialToSolealAccessories,
    setTableWeightRate,
    setMaterialRateMethod,
    deletePriceMaterial,
    deleteSelectedPriceMaterials,
  };
}
