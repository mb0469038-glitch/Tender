import {
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { conditionMatches } from "../../../domain/calculations";
import type {
  Assembly,
  CanvasItem,
  Project,
  ProjectCanvas,
  WindowCorner,
} from "../../../domain/types";
import {
  MAX_OPENING_DIMENSION,
  allJoinedWindowGroup,
  realJoinedWindowGroup,
  windowCornerPoint,
  windowCorners,
} from "../../../domain/windowJoins";
import { makeId } from "../../../shared/kernel/ids";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TECHNAL_ASSEMBLY_ID,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../../catalog/domain/catalogDefinitions";
import {
  flyScreenAssembly,
  tiltAndTurnAssembly,
} from "../../catalog/domain/technalSeed";
import {
  TWO_SLIDER_DOOR_SKETCH,
  assemblyDefaultColor,
  defaultAssemblyCanvasDefaults,
  defaultManpowerHours,
} from "../domain/projectDefaults";
import {
  fullSideTouching,
  realJoinCheck as realJoinCheckPure,
  recheckCombinationJoins as recheckCombinationJoinsPure,
  reconcileRealJoins as reconcileRealJoinsPure,
} from "../domain/joinEngine";

export const JOIN_CAPTURE_DISTANCE_MM = 350;

export type CanvasDrawingMode =
  | "select"
  | "pan"
  | "two-rail"
  | "fly-screen"
  | "hinge-window"
  | "fixed-window"
  | "tilt-and-turn";

export type CanvasInteractionState =
  | { type: "move"; itemId: string; startX: number; startY: number; origins: Record<string, { x: number; y: number }> }
  | { type: "resize"; itemId: string }
  | { type: "joinMove"; itemId: string; startX: number; startY: number; origins: Record<string, { x: number; y: number }> }
  | { type: "joinResize"; itemId: string; corner: WindowCorner; offsetX: number; offsetY: number }
  | { type: "join"; itemId: string; corner: WindowCorner }
  | null;

export type JoinStretchMeasurement = {
  axis: "x" | "y" | null;
  direction: -1 | 1;
  amount: number;
  input: string;
  clientX: number;
  clientY: number;
} | null;

const cloneProject = (value: Project) => JSON.parse(JSON.stringify(value)) as Project;

export type UseCanvasInteractionParams = {
  project?: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  selectedProjectId: string | null;
  updateProject: (updater: (project: Project) => Project) => void;
  undoProjectHistory: Project[];
  redoProjectHistory: Project[];
  setUndoProjectHistory: React.Dispatch<React.SetStateAction<Project[]>>;
  setRedoProjectHistory: React.Dispatch<React.SetStateAction<Project[]>>;
  undoCanvasChange: () => void;
  redoCanvasChange: () => void;
  copiedCanvasItem: CanvasItem | null;
  setCopiedCanvasItem: React.Dispatch<React.SetStateAction<CanvasItem | null>>;
  materials: { id: string; name: string; databaseId?: string }[];
  assemblies: Assembly[];
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCanvasId: string;
  setSelectedCanvasId: React.Dispatch<React.SetStateAction<string>>;
  frameTypeForItem: (item: CanvasItem) => string | null;
  formulaValuesForItem: (item: CanvasItem) => Record<string, number>;
  isCanvasActive: boolean;
};

export function useCanvasInteraction({
  project,
  setProjects,
  selectedProjectId,
  updateProject,
  undoProjectHistory,
  redoProjectHistory,
  setUndoProjectHistory,
  setRedoProjectHistory,
  undoCanvasChange,
  redoCanvasChange,
  copiedCanvasItem,
  setCopiedCanvasItem,
  materials,
  assemblies,
  selectedItemId,
  setSelectedItemId,
  selectedCanvasId,
  setSelectedCanvasId,
  frameTypeForItem,
  formulaValuesForItem,
  isCanvasActive,
}: UseCanvasInteractionParams) {
  const [drawingMode, setDrawingMode] = useState<CanvasDrawingMode>("select");
  const [drawingView, setDrawingView] = useState({ x: 0, y: 0, zoom: 1 });
  const [canvasPreviewItems, setCanvasPreviewItems] = useState<CanvasItem[] | null>(null);
  const [cursorWindowPreview, setCursorWindowPreview] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [openingNameError, setOpeningNameError] = useState("");
  const [referenceConflict, setReferenceConflict] = useState<{ itemId: string; requestedReference: number } | null>(null);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(380);
  const [inspectorResize, setInspectorResize] = useState<{ startX: number; startWidth: number } | null>(null);
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
  const takeoffResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const takeoffResizeWidth = useRef(340);

  const [interaction, setInteraction] = useState<CanvasInteractionState>(null);
  const [joinModeItemId, setJoinModeItemId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState("");
  const [joinStretchMeasurement, setJoinStretchMeasurement] = useState<JoinStretchMeasurement>(null);
  const joinResizeCommitRef = useRef(false);
  const lastWindowClickRef = useRef<{ itemId: string; x: number; y: number; at: number } | null>(null);

  const realJoinCheck = (
    source: CanvasItem,
    target: CanvasItem,
    sourceCorner: WindowCorner,
    targetCorner: WindowCorner,
    canvasItems = project?.items ?? [],
  ) => realJoinCheckPure(source, target, sourceCorner, targetCorner, canvasItems, assemblies, frameTypeForItem);

  const reconcileRealJoins = (items: CanvasItem[]) => reconcileRealJoinsPure(items, assemblies, frameTypeForItem);
  const recheckCombinationJoins = (items: CanvasItem[]) => recheckCombinationJoinsPure(items, assemblies, frameTypeForItem);

  const displayedCanvasItems = useMemo(
    () => canvasPreviewItems ?? project?.items ?? [],
    [canvasPreviewItems, project?.items],
  );
  const visibleCanvasItems = useMemo(
    () => displayedCanvasItems.filter((item) => item.kind === "assembly"),
    [displayedCanvasItems],
  );

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
    if (!project) return;
    const current = (project.canvases ?? []).find((canvas) => canvas.id === canvasId);
    const name = prompt("Canvas name", current?.name ?? "Opening");
    if (!name?.trim()) return;
    updateProject((value) => ({ ...value, canvases: (value.canvases ?? []).map((canvas) => canvas.id === canvasId ? { ...canvas, name: name.trim() } : canvas) }));
  };

  useEffect(() => {
    const canvasKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!isCanvasActive) return;
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
  }, [isCanvasActive, selectedItemId, copiedCanvasItem, project, undoProjectHistory, redoProjectHistory, joinModeItemId]);

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
    if (!project) return;
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
      setInteraction({ type: "pan" as unknown as "move", itemId: "", startX: p.x, startY: p.y, origins: {} }); // internal pan
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
    if (!project) return;
    if (selectedGlassMaterialId || glassRemovalMode) setGlassCursor({ x: event.clientX, y: event.clientY });
    const rawPoint = drawingPoint(event);
    const isPan = interaction && (interaction as { type: string }).type === "pan";
    const p = isPan ? rawPoint : snapCanvasPoint(rawPoint);
    if ((drawingMode === "two-rail" || drawingMode === "fly-screen" || drawingMode === "hinge-window" || drawingMode === "fixed-window" || drawingMode === "tilt-and-turn") && !interaction) {
      setCursorWindowPreview({ x: p.x, y: p.y });
      return;
    }
    if (!interaction) return;
    if (isPan) {
      const panInter = interaction as unknown as { startX: number; startY: number; originX: number; originY: number };
      setDrawingView((view) => ({ ...view, x: (panInter.originX ?? 0) - (p.x - panInter.startX), y: (panInter.originY ?? 0) - (p.y - panInter.startY) }));
      return;
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

  return {
    drawingMode,
    setDrawingMode,
    drawingView,
    setDrawingView,
    canvasPreviewItems,
    setCanvasPreviewItems,
    cursorWindowPreview,
    setCursorWindowPreview,
    contextMenu,
    setContextMenu,
    openingNameError,
    setOpeningNameError,
    referenceConflict,
    setReferenceConflict,
    inspectorCollapsed,
    setInspectorCollapsed,
    inspectorWidth,
    inspectorResize,
    setInspectorResize,
    canvasExpanded,
    setCanvasExpanded,
    takeoffPanel,
    setTakeoffPanel,
    manpowerPanelTab,
    setManpowerPanelTab,
    selectedGlassMaterialId,
    setSelectedGlassMaterialId,
    glassRemovalMode,
    setGlassRemovalMode,
    glassCursor,
    setGlassCursor,
    itemMaterialPanelId,
    setItemMaterialPanelId,
    editingItemMaterial,
    setEditingItemMaterial,
    takeoffPanelWidth,
    setTakeoffPanelWidth,
    leftCanvasPanelOpen,
    setLeftCanvasPanelOpen,
    leftCanvasPanelTab,
    setLeftCanvasPanelTab,
    leftCanvasPanelWidth,
    setLeftCanvasPanelWidth,
    leftCanvasPanelResizeRef,
    takeoffResizeRef,
    takeoffResizeWidth,
    interaction,
    setInteraction,
    joinModeItemId,
    setJoinModeItemId,
    joinFeedback,
    setJoinFeedback,
    joinStretchMeasurement,
    setJoinStretchMeasurement,
    joinResizeCommitRef,
    displayedCanvasItems,
    visibleCanvasItems,
    assemblyForCanvasItem,
    nameRuleForCanvasItem,
    assignedCanvasItemName,
    renameCanvasItem,
    renameCombination,
    updateCombinationQuantity,
    updateCombinationGlazedSettings,
    updateRealJoinSettings,
    nextCanvasReference,
    moveCanvasReference,
    updateCanvasReference,
    shiftReferencesForConflict,
    deleteCanvasItem,
    finishCanvasItemPlacement,
    selectProjectCanvas,
    addProjectCanvas,
    setCanvasManpowerHours,
    setCanvasManpowerParameter,
    setCanvasMarkupType,
    toggleCanvasManpowerItem,
    renameProjectCanvas,
    placeTwoRailWindow,
    placeFlyScreen,
    placeHingeWindow,
    placeFixedWindow,
    placeTiltAndTurn,
    changeDrawnWindowType,
    drawingPoint,
    snapCanvasPoint,
    resizeRealJoinedBoundary,
    canvasDown,
    canvasMove,
    connectJoinModeCorners,
    canvasUp,
    separateWindowFromCombination,
    explodeJoinedOpening,
    canvasDoubleClick,
    canvasWheel,
    openItemContextMenu,
    startInspectorResize,
    resizeInspector,
  };
}
