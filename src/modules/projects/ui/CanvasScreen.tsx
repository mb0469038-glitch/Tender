import {
  type CSSProperties,
  useRef,
} from "react";
import { money, number, unitPriceWithShipping } from "../../../domain/calculations";
import type { Assembly, CanvasItem, Material, Project } from "../../../domain/types";
import {
  allJoinedWindowGroup,
  realJoinSegments,
  windowCornerPoint,
  windowCorners,
} from "../../../domain/windowJoins";
import { Icon } from "../../../design-system/Icon";
import { Sketch } from "../../../design-system/Sketch";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TECHNAL_ASSEMBLY_ID,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
  inferGlassThickness,
} from "../../catalog/domain/catalogDefinitions";
import {
  flyScreenAssembly,
  tiltAndTurnAssembly,
} from "../../catalog/domain/technalSeed";
import {
  TWO_SLIDER_DOOR_SKETCH,
  assemblyDefaultColor,
  defaultAssemblyCanvasDefaults,
} from "../domain/projectDefaults";
import { sellingPriceFromDirectCost } from "../../costing/domain/pricing";
import { TechnicalSymbol } from "./TechnicalSymbol";
import { CanvasContextMenu } from "./CanvasContextMenu";
import type { useCanvasInteraction } from "../application/useCanvasInteraction";
import type { useCanvasTakeoff } from "../application/useCanvasTakeoff";

export type CanvasScreenProps = {
  project: Project;
  materials: Material[];
  assemblies: Assembly[];
  onNavigateToProjects: () => void;
  onOpenProjectDetails: () => void;
  updateProject: (updater: (project: Project) => Project) => void;
  undoCanvasChange: () => void;
  redoCanvasChange: () => void;
  undoProjectHistory: Project[];
  redoProjectHistory: Project[];
  shippingRateForMaterial: (material: Material) => number;
  materialDatabaseReference: (material: Material) => string;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCanvasId: string;
  interaction: ReturnType<typeof useCanvasInteraction>;
  takeoff: ReturnType<typeof useCanvasTakeoff>;
};

export function CanvasScreen({
  project,
  materials,
  assemblies,
  onNavigateToProjects,
  onOpenProjectDetails,
  updateProject,
  undoCanvasChange,
  redoCanvasChange,
  undoProjectHistory,
  redoProjectHistory,
  shippingRateForMaterial,
  materialDatabaseReference,
  selectedItemId,
  setSelectedItemId,
  selectedCanvasId,
  interaction: canvas,
  takeoff,
}: CanvasScreenProps) {
  const takeoffPanelRef = useRef<HTMLElement | null>(null);

  const contextItem = canvas.contextMenu
    ? project.items.find((item) => item.id === canvas.contextMenu?.itemId) ?? null
    : null;
  const contextCombinationGroup = contextItem
    ? allJoinedWindowGroup(project.items, contextItem.id)
    : new Set<string>();
  const contextCombinationSize = contextItem ? contextCombinationGroup.size : 1;
  const contextIsFlyScreen =
    contextItem?.assemblyPage === FLY_SCREEN_PAGE || contextItem?.sourceId === "fly-screen-2rail";
  const contextIsHingeWindow =
    contextItem?.assemblyPage === HINGE_WINDOW_PAGE || contextItem?.sourceId === "hinged-window-soleal-fyn";
  const contextIsFixedWindow =
    contextItem?.assemblyPage === FIXED_WINDOW_PAGE || contextItem?.sourceId === "fixed-window";
  const contextIsTiltAndTurn =
    contextItem?.assemblyPage === TILT_AND_TURN_PAGE || contextItem?.sourceId === "tilt-and-turn-soleal-fyn";
  const contextSupportsOpeningType =
    contextItem?.sourceId === "soleal-gyn-2rail" || contextItem?.sourceId === "hinged-window-soleal-fyn";
  const contextSupportsFynLeafSize =
    contextItem?.sourceId === "hinged-window-soleal-fyn" ||
    contextItem?.sourceId === "fixed-window" ||
    contextItem?.sourceId === "tilt-and-turn-soleal-fyn";

  const usedGlassList: { material?: Material; openings: string[] }[] = Array.from(
    new Map<string, { material?: Material; openings: string[] }>(
      project.items
        .filter((item: CanvasItem) => Boolean(item.glassMaterialId))
        .map((item: CanvasItem) => [
          item.glassMaterialId!,
          {
            material: materials.find((m) => m.id === item.glassMaterialId),
            openings: project.items
              .filter((v: CanvasItem) => v.glassMaterialId === item.glassMaterialId)
              .map((v: CanvasItem) => v.name),
          },
        ]),
    ).values(),
  );

  return (
    <section className="p-8 max-[900px]:p-6 max-[700px]:p-5">
      <div className="flex justify-between items-end mb-5 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-3.5">
        <div>
          <button
            className="border-0 bg-transparent p-0 text-[#28716e] text-[13px] font-bold cursor-pointer hover:underline inline-flex items-center gap-1 mb-2"
            onClick={onNavigateToProjects}
          >
            ← Projects
          </button>
          <h1 className="m-0 text-[#11262a] text-[28px] font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1.5 mb-0 text-[#6e8488] text-[13px]">
            {[project.client, project.company, project.location].filter(Boolean).join(" · ") ||
              "No project details"}
          </p>
        </div>
        <button
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] transition-colors cursor-pointer"
          onClick={onOpenProjectDetails}
        >
          <Icon name="edit" size={16} /> Project details
        </button>
      </div>
      <div
        className={`canvas-layout ${canvas.inspectorCollapsed ? "inspector-collapsed" : ""} ${
          canvas.canvasExpanded ? "canvas-expanded" : ""
        }`}
        style={{ gridTemplateColumns: "minmax(620px, 1fr)" }}
        onPointerMove={canvas.resizeInspector}
        onPointerUp={() => canvas.setInspectorResize(null)}
        onPointerLeave={() => canvas.setInspectorResize(null)}
      >
        <div className="canvas-workspace">
          <div className="canvas-toolbar" role="toolbar" aria-label="Technical drawing tools">
            <div className="canvas-action-stack">
              <button
                onClick={undoCanvasChange}
                disabled={!undoProjectHistory.length}
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
              <button
                onClick={redoCanvasChange}
                disabled={!redoProjectHistory.length}
                title="Redo (Ctrl+Y)"
              >
                Redo
              </button>
              <button onClick={() => canvas.setDrawingView({ x: 0, y: 0, zoom: 1 })}>
                Fit drawing
              </button>
              <button
                className="canvas-expand-button"
                onClick={() => canvas.setCanvasExpanded((expanded) => !expanded)}
              >
                {canvas.canvasExpanded ? "Exit full canvas" : "Full canvas"}
              </button>
              <label className="canvas-markup-picker">
                <span>Markup type</span>
                <select
                  value={takeoff.selectedMarkupType}
                  onChange={(event) =>
                    canvas.setCanvasMarkupType(event.target.value as "typeA" | "typeB" | "typeC")
                  }
                  aria-label="Markup type for this opening"
                >
                  <option value="typeA">Type A</option>
                  <option value="typeB">Type B</option>
                  <option value="typeC">Type C</option>
                </select>
              </label>
            </div>
            {canvas.joinModeItemId && (
              <>
                <span className="toolbar-divider" />
                <span className="join-mode-hint">
                  {canvas.joinFeedback || "Drag a corner to join. Real joins are detected automatically."}
                </span>
                <button className="join-mode-explode" onClick={canvas.explodeJoinedOpening}>
                  Explode combination
                </button>
                <button
                  className="join-mode-exit"
                  onClick={() => {
                    canvas.setJoinModeItemId(null);
                    canvas.setInteraction(null);
                    canvas.setCanvasPreviewItems(null);
                    canvas.setJoinStretchMeasurement(null);
                    canvas.joinResizeCommitRef.current = false;
                    canvas.setJoinFeedback("");
                  }}
                >
                  Exit join
                </button>
              </>
            )}
            <div className="window-tool-grid">
              <button
                className={`drawing-tool-window ${canvas.drawingMode === "two-rail" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setDrawingMode("two-rail");
                  canvas.setCursorWindowPreview(null);
                }}
                title="Move the window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="2" y="2" width="48" height="28" />
                  <rect x="6" y="6" width="18" height="20" />
                  <rect x="28" y="6" width="18" height="20" />
                  <path d="M26 2V30M8 22H20M32 10H44" />
                </svg>
                <span>2 Rail System</span>
              </button>
              <button
                className={`drawing-tool-window ${canvas.drawingMode === "fly-screen" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setDrawingMode("fly-screen");
                  canvas.setCursorWindowPreview(null);
                }}
                title="Move the fly screen with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="2" y="2" width="48" height="28" />
                  <rect x="6" y="6" width="40" height="20" />
                  <path d="M14 6V26M22 6V26M30 6V26M38 6V26M6 11H46M6 16H46M6 21H46" />
                </svg>
                <span>Fly screen</span>
              </button>
              <button
                className={`drawing-tool-window ${canvas.drawingMode === "hinge-window" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setDrawingMode("hinge-window");
                  canvas.setCursorWindowPreview(null);
                }}
                title="Move the hinged window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="2" y="2" width="48" height="28" />
                  <rect x="6" y="5" width="19" height="22" />
                  <rect x="27" y="5" width="19" height="22" />
                  <path d="M6 5L25 16L6 27M46 5L27 16L46 27" strokeDasharray="5 3" />
                  <path d="M26 3V29" />
                </svg>
                <span>Hinged System</span>
              </button>
              <button
                className={`drawing-tool-window ${canvas.drawingMode === "fixed-window" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setDrawingMode("fixed-window");
                  canvas.setCursorWindowPreview(null);
                }}
                title="Move the fixed window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="2" y="2" width="48" height="28" />
                  <rect x="6" y="6" width="40" height="20" />
                  <path d="M20 16H32M26 10V22" />
                </svg>
                <span>Fixed window</span>
              </button>
              <button
                className={`drawing-tool-window ${canvas.drawingMode === "tilt-and-turn" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setDrawingMode("tilt-and-turn");
                  canvas.setCursorWindowPreview(null);
                }}
                title="Move the Tilt and Turn window with your cursor, then click to place it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="2" y="2" width="48" height="28" />
                  <rect x="6" y="6" width="40" height="20" />
                  <path d="M6 6L46 16M6 26L26 6L46 26M6 26L46 16" strokeDasharray="5 3" />
                </svg>
                <span>Tilt and Turn</span>
              </button>
              <button
                className={`drawing-tool-window glass-add-tool ${canvas.takeoffPanel === "glassLibrary" ? "selected" : ""}`}
                onClick={() => {
                  canvas.setTakeoffPanel((panel) => (panel === "glassLibrary" ? null : "glassLibrary"));
                  canvas.setGlassRemovalMode(false);
                  canvas.setDrawingMode("select");
                  canvas.setJoinModeItemId(null);
                  canvas.setInteraction(null);
                }}
                title="Choose glass, then click window areas to apply it"
              >
                <svg className="toolbar-window-preview" viewBox="0 0 52 32" aria-hidden="true">
                  <rect x="6" y="3" width="40" height="26" />
                  <path d="M17 21L26 12M21 24L30 15M30 19L37 12M34 22L41 15" />
                </svg>
                <span>Glass</span>
              </button>
            </div>
            {(canvas.drawingMode === "two-rail" ||
              canvas.drawingMode === "fly-screen" ||
              canvas.drawingMode === "hinge-window" ||
              canvas.drawingMode === "fixed-window" ||
              canvas.drawingMode === "tilt-and-turn") && (
              <span className="tool-instruction">Move cursor, then click to place</span>
            )}
            <section
              className="absolute top-3.5 right-[18px] w-[270px] border border-[#5a7479] rounded-[5px] bg-[#263237] text-[#eaf5f6] overflow-hidden shadow-lg"
              aria-label="Drawing cost summary"
            >
              <header className="p-[7px_9px] bg-[#40545a] text-[#f1ffff] text-[11px] uppercase font-bold tracking-wide">
                <strong>Cost summary</strong>
              </header>
              <div className="flex justify-between gap-2.5 p-[5px_9px] border-t border-[#425459] text-[10px]">
                <span className="text-[#c6d9da]">Material takeoff</span>
                <b className="text-[#8fe1dc] whitespace-nowrap">{money(takeoff.materialTakeoffTotal)}</b>
              </div>
              <div className="flex justify-between gap-2.5 p-[5px_9px] border-t border-[#425459] text-[10px]">
                <span className="text-[#c6d9da]">Glass takeoff</span>
                <b className="text-[#8fe1dc] whitespace-nowrap">{money(takeoff.glassTakeoffTotal)}</b>
              </div>
              <div className="flex justify-between gap-2.5 p-[5px_9px] border-t border-[#425459] text-[10px]">
                <span className="text-[#c6d9da]">Manpower</span>
                <b className="text-[#8fe1dc] whitespace-nowrap">{money(takeoff.manpowerTotal)}</b>
              </div>
              <div className="flex justify-between gap-2.5 p-[7px_9px] border-t-2 border-[#8fe1dc] bg-[#263237] text-white text-[11px] font-extrabold">
                <span className="text-[#e9ffff]">Direct cost</span>
                <b className="text-[#e9ffff] whitespace-nowrap">{money(takeoff.directCost)}</b>
              </div>
              <div className="flex justify-between gap-2.5 p-[7px_9px] border-t-2 border-[#8fe1dc] bg-[#263237] text-white text-[11px] font-extrabold">
                <span className="text-[#e9ffff] text-[11px]">
                  Selling cost · {takeoff.selectedMarkupName} ({number(takeoff.selectedMarkupRate)}%)
                </span>
                <b className="text-[#e9ffff] whitespace-nowrap">
                  {money(
                    sellingPriceFromDirectCost(takeoff.directCost, takeoff.selectedMarkupRate),
                  )}
                </b>
              </div>
            </section>
            <div className="absolute right-[18px] bottom-4 flex items-center gap-1 p-0">
              <button
                className={`min-h-[30px] px-[9px] border rounded-[4px] text-[11px] font-extrabold cursor-pointer transition-colors ${
                  canvas.takeoffPanel === "material"
                    ? "border-[#187b82] bg-[#d7f0ed] text-[#126b6d]"
                    : "border-[#b9ced0] bg-white text-[#315c60] hover:bg-slate-50"
                }`}
                onClick={() => {
                  canvas.setItemMaterialPanelId(null);
                  canvas.setTakeoffPanel((panel) => (panel === "material" ? null : "material"));
                }}
              >
                Material
              </button>
              <button
                className={`min-h-[30px] px-[9px] border rounded-[4px] text-[11px] font-extrabold cursor-pointer transition-colors ${
                  canvas.takeoffPanel === "glass"
                    ? "border-[#187b82] bg-[#d7f0ed] text-[#126b6d]"
                    : "border-[#b9ced0] bg-white text-[#315c60] hover:bg-slate-50"
                }`}
                onClick={() =>
                  canvas.setTakeoffPanel((panel) => (panel === "glass" ? null : "glass"))
                }
              >
                Glass
              </button>
              <button
                className={`min-h-[30px] px-[9px] border rounded-[4px] text-[11px] font-extrabold cursor-pointer transition-colors ${
                  canvas.takeoffPanel === "manpower"
                    ? "border-[#187b82] bg-[#d7f0ed] text-[#126b6d]"
                    : "border-[#b9ced0] bg-white text-[#315c60] hover:bg-slate-50"
                }`}
                onClick={() =>
                  canvas.setTakeoffPanel((panel) => (panel === "manpower" ? null : "manpower"))
                }
              >
                Manpower
              </button>
            </div>
            {canvas.selectedGlassMaterialId && (
              <div className="absolute right-[18px] bottom-[55px] max-w-[330px] p-[7px_10px] border border-[#55b5bb] rounded-[5px] bg-[#174f59] text-[#e9fbfd] text-[11px] font-extrabold">
                Glass assignment active:{" "}
                {materials.find((material) => material.id === canvas.selectedGlassMaterialId)?.name ??
                  "Selected glass"}
                . Click a window area to apply it.
              </div>
            )}
            {canvas.glassRemovalMode && (
              <div className="absolute right-[18px] bottom-[55px] max-w-[330px] p-[7px_10px] border border-[#d27777] rounded-[5px] bg-[#542b2b] text-[#ffe2e2] text-[11px] font-extrabold">
                Glass removal active: click a glass-filled window to remove its glass. Press Escape
                to exit.
              </div>
            )}
          </div>
          <button
            type="button"
            className={`canvas-left-panel-toggle ${canvas.leftCanvasPanelOpen ? "selected" : ""}`}
            style={{ "--left-panel-width": `${canvas.leftCanvasPanelWidth}px` } as CSSProperties}
            onClick={() => canvas.setLeftCanvasPanelOpen((open) => !open)}
            aria-label={canvas.leftCanvasPanelOpen ? "Close left canvas panel" : "Open left canvas panel"}
            title={canvas.leftCanvasPanelOpen ? "Close panel" : "Open panel"}
          >
            ⌄
          </button>
          <svg
            className={`project-canvas technical-workspace ${
              canvas.drawingMode === "pan" ? "pan-active" : ""
            } ${canvas.selectedGlassMaterialId ? "glass-carrying" : ""} ${
              canvas.glassRemovalMode ? "glass-removing" : ""
            }`}
            viewBox={`${canvas.drawingView.x} ${canvas.drawingView.y} ${
              9000 / canvas.drawingView.zoom
            } ${5600 / canvas.drawingView.zoom}`}
            onPointerDown={canvas.canvasDown}
            onPointerMove={canvas.canvasMove}
            onPointerUp={canvas.canvasUp}
            onPointerLeave={() => {
              canvas.canvasUp();
              canvas.setCursorWindowPreview(null);
              canvas.setGlassCursor(null);
            }}
            onDoubleClick={canvas.canvasDoubleClick}
            onWheel={canvas.canvasWheel}
            onDragStart={(event) => event.preventDefault()}
            onContextMenu={canvas.openItemContextMenu}
            aria-label="Technical project drawing workspace"
          >
            <defs>
              <pattern id="technical-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M100 0H0V100"
                  fill="none"
                  stroke="#9baeb5"
                  strokeOpacity="0.42"
                  strokeWidth="2"
                />
              </pattern>
              <pattern
                id="technical-subgrid"
                width="500"
                height="500"
                patternUnits="userSpaceOnUse"
              >
                <rect width="500" height="500" fill="url(#technical-grid)" />
                <path
                  d="M500 0H0V500"
                  fill="none"
                  stroke="#c3d2d7"
                  strokeOpacity="0.52"
                  strokeWidth="3"
                />
              </pattern>
            </defs>
            <rect
              x="-1000000"
              y="-1000000"
              width="2000000"
              height="2000000"
              fill="url(#technical-subgrid)"
            />
            {canvas.visibleCanvasItems.map((item) => (
              <g key={item.id}>
                <TechnicalSymbol
                  item={item}
                  selected={selectedItemId === item.id}
                  dimensionTextSize={Math.min(360, 140 / canvas.drawingView.zoom)}
                  glassName={materials.find((material) => material.id === item.glassMaterialId)?.name}
                  drawingName={`${item.combinationName ?? item.name} · Qty ${item.quantity ?? 1}`}
                  drawingReference={item.reference}
                  onJoin={() => {
                    setSelectedItemId(item.id);
                    canvas.setJoinModeItemId(item.id);
                    canvas.setInteraction(null);
                    canvas.setJoinFeedback(
                      "Automatic 1 mm corner alignment is active. Move or stretch the opening to join.",
                    );
                    canvas.setDrawingMode("select");
                  }}
                />
                {selectedItemId === item.id && !canvas.joinModeItemId && (
                  <g data-resize-id={item.id}>
                    <rect
                      x={item.x + (item.inputWidth ?? 1500) - 50}
                      y={item.y + (item.inputHeight ?? 1200) - 50}
                      width="100"
                      height="100"
                      className="resize-handle"
                    />
                  </g>
                )}
              </g>
            ))}
            {realJoinSegments(canvas.displayedCanvasItems).map((segment) => (
              <line
                key={segment.id}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                className="real-join-line"
                style={{ stroke: segment.color }}
              />
            ))}
            {canvas.joinModeItemId &&
              [...canvas.visibleCanvasItems]
                .sort(
                  (a, b) =>
                    Number(a.id === canvas.joinModeItemId) -
                    Number(b.id === canvas.joinModeItemId),
                )
                .flatMap((item) =>
                  windowCorners.map((corner) => {
                    const point = windowCornerPoint(item, corner);
                    return (
                      <circle
                        key={`${item.id}-${corner}`}
                        data-join-anchor
                        data-join-item-id={item.id}
                        data-join-corner={corner}
                        cx={point.x}
                        cy={point.y}
                        r="72"
                        className={`join-anchor ${
                          item.id === canvas.joinModeItemId ? "active" : ""
                        }`}
                      />
                    );
                  }),
                )}
            {canvas.joinModeItemId && (
              <text
                x={canvas.drawingView.x + 180}
                y={canvas.drawingView.y + 220}
                className="join-mode-canvas-label"
              >
                COMBINATION JOIN MODE — Real or Fake is detected automatically · double-click blank
                area or press Esc to exit
              </text>
            )}
            {canvas.cursorWindowPreview && (
              <g className="placement-preview">
                <TechnicalSymbol
                  item={{
                    id: "cursor-window",
                    sourceId:
                      canvas.drawingMode === "fly-screen"
                        ? "fly-screen-2rail"
                        : canvas.drawingMode === "tilt-and-turn"
                        ? "tilt-and-turn-soleal-fyn"
                        : "",
                    kind: "assembly",
                    name:
                      canvas.drawingMode === "fly-screen"
                        ? "Fly screen - Soleal - GYn"
                        : canvas.drawingMode === "tilt-and-turn"
                        ? "Tilt and Turn - Soleal - FYn"
                        : canvas.drawingMode === "hinge-window"
                        ? "Hinge window"
                        : canvas.drawingMode === "fixed-window"
                        ? "Fixed window"
                        : "2 rail window",
                    sketch:
                      canvas.drawingMode === "fly-screen"
                        ? flyScreenAssembly.sketch
                        : canvas.drawingMode === "tilt-and-turn"
                        ? tiltAndTurnAssembly.sketch
                        : canvas.drawingMode === "hinge-window"
                        ? "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82"
                        : canvas.drawingMode === "fixed-window"
                        ? "M12 8H88V92H12ZM18 14H82V86H18ZM40 50H60M50 40V60"
                        : TWO_SLIDER_DOOR_SKETCH,
                    x: canvas.cursorWindowPreview.x,
                    y: canvas.cursorWindowPreview.y,
                    width: 170,
                    height: 130,
                    inputWidth: 1500,
                    inputHeight: 1200,
                    leaves:
                      canvas.drawingMode === "hinge-window" ||
                      canvas.drawingMode === "tilt-and-turn"
                        ? 1
                        : 2,
                    color:
                      canvas.drawingMode === "fly-screen"
                        ? "#718b72"
                        : canvas.drawingMode === "tilt-and-turn"
                        ? assemblies.find((assembly) => assembly.id === "tilt-and-turn-soleal-fyn")
                            ?.color ?? assemblyDefaultColor("tilt-and-turn-soleal-fyn")
                        : "#d9e8ea",
                    assemblyPage:
                      canvas.drawingMode === "fly-screen"
                        ? FLY_SCREEN_PAGE
                        : canvas.drawingMode === "tilt-and-turn"
                        ? TILT_AND_TURN_PAGE
                        : canvas.drawingMode === "hinge-window"
                        ? HINGE_WINDOW_PAGE
                        : canvas.drawingMode === "fixed-window"
                        ? FIXED_WINDOW_PAGE
                        : TWO_RAIL_WINDOW_PAGE,
                  }}
                  selected={false}
                  dimensionTextSize={Math.min(360, 140 / canvas.drawingView.zoom)}
                />
              </g>
            )}
          </svg>
          {canvas.leftCanvasPanelOpen && (
            <aside
              className="canvas-left-panel"
              style={
                {
                  "--left-panel-width": `${canvas.leftCanvasPanelWidth}px`,
                  width: canvas.leftCanvasPanelWidth,
                } as CSSProperties
              }
              aria-label="Drawing items"
            >
              <div
                className="canvas-left-panel-resize"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  canvas.leftCanvasPanelResizeRef.current = {
                    startX: event.clientX,
                    startWidth: canvas.leftCanvasPanelWidth,
                  };
                }}
                onPointerMove={(event) => {
                  const resize = canvas.leftCanvasPanelResizeRef.current;
                  if (!resize) return;
                  canvas.setLeftCanvasPanelWidth(
                    Math.max(280, Math.min(720, resize.startWidth + event.clientX - resize.startX)),
                  );
                }}
                onPointerUp={() => {
                  canvas.leftCanvasPanelResizeRef.current = null;
                }}
                onPointerCancel={() => {
                  canvas.leftCanvasPanelResizeRef.current = null;
                }}
                role="separator"
                aria-label="Resize drawing items panel"
              />
              <header>
                <button
                  onClick={() => canvas.setLeftCanvasPanelOpen(false)}
                  aria-label="Close drawing items panel"
                >
                  ×
                </button>
              </header>
              <div className="canvas-left-panel-tabs">
                <button
                  className={canvas.leftCanvasPanelTab === "items" ? "selected" : ""}
                  onClick={() => canvas.setLeftCanvasPanelTab("items")}
                >
                  Drawn items
                </button>
                <button
                  className={canvas.leftCanvasPanelTab === "glass" ? "selected" : ""}
                  onClick={() => canvas.setLeftCanvasPanelTab("glass")}
                >
                  Used glass
                </button>
              </div>
              {canvas.leftCanvasPanelTab === "items" ? (
                <div className="drawn-opening-list">
                  {project.items
                    .filter((item) => item.kind === "assembly")
                    .map((item) => {
                      const assembly = canvas.assemblyForCanvasItem(item);
                      const isSlider =
                        item.assemblyPage === TWO_RAIL_WINDOW_PAGE ||
                        [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId);
                      const isFlyScreen =
                        item.assemblyPage === FLY_SCREEN_PAGE || item.sourceId === "fly-screen-2rail";
                      const isHinged =
                        item.assemblyPage === HINGE_WINDOW_PAGE ||
                        item.sourceId === "hinged-window-soleal-fyn";
                      const isFixed =
                        item.assemblyPage === FIXED_WINDOW_PAGE || item.sourceId === "fixed-window";
                      const isTiltAndTurn =
                        item.assemblyPage === TILT_AND_TURN_PAGE ||
                        item.sourceId === "tilt-and-turn-soleal-fyn";
                      const panelCount = isSlider ? item.leaves ?? 2 : item.leaves ?? 1;
                      const panelLabel = `${panelCount} ${panelCount === 1 ? "panel" : "panels"}`;
                      const defaults = { ...defaultAssemblyCanvasDefaults, ...assembly?.canvasDefaults };
                      const parameters = [
                        ...(isFlyScreen
                          ? []
                          : isSlider && (item.leaves ?? 2) !== defaults.leaves
                          ? [panelLabel]
                          : []),
                        ...((isHinged || isFixed || isTiltAndTurn) && item.leafSize !== defaults.leafSize
                          ? [`${item.leafSize === "big" ? "Big" : "Small"} leaf`]
                          : []),
                        ...((isHinged || isFixed || isTiltAndTurn) &&
                        item.frameSize !== defaults.frameSize
                          ? [`${item.frameSize === "big" ? "Big" : "Small"} frame`]
                          : []),
                        ...(!isFlyScreen &&
                        Boolean(item.hasArchitrave) !== Boolean(defaults.hasArchitrave)
                          ? [item.hasArchitrave ? "With architrave" : "Without architrave"]
                          : []),
                        ...(!isFlyScreen && Boolean(item.reinforced) !== Boolean(defaults.reinforced)
                          ? [item.reinforced ? "Reinforced" : "Not reinforced"]
                          : []),
                        ...(!isFlyScreen &&
                        Boolean(item.hasArchitraveAllowance) !==
                          Boolean(defaults.hasArchitraveAllowance)
                          ? [
                              item.hasArchitraveAllowance
                                ? "With architrave allowance"
                                : "Without architrave allowance",
                            ]
                          : []),
                        ...(Boolean(item.hasCoating) !== Boolean(defaults.hasCoating)
                          ? [item.hasCoating ? "With coating" : "Without coating"]
                          : []),
                      ];
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`drawn-opening-row ${selectedItemId === item.id ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedItemId(item.id);
                            canvas.setDrawingMode("select");
                          }}
                        >
                          <b>
                            {item.combinationName ?? item.name} · Qty {item.quantity ?? 1}
                          </b>
                          <span>
                            {panelLabel} ·{" "}
                            {item.sourceId ? assembly?.name ?? "No assembly type" : "No assembly type"}
                          </span>
                          <small>
                            {parameters.length
                              ? parameters.join(" · ")
                              : item.sourceId
                              ? "Using assembly defaults"
                              : "Using default drawing values"}
                          </small>
                        </button>
                      );
                    })}
                  {!project.items.some((item) => item.kind === "assembly") && (
                    <p className="drawn-opening-empty">No drawn openings yet.</p>
                  )}
                </div>
              ) : (
                <div className="used-glass-list">
                  {usedGlassList.map(({ material, openings }) => (
                    <div className="used-glass-row" key={material?.id ?? openings.join("-")}>
                      {material && <Sketch path={material.sketch} label={material.name} />}
                      <div>
                        <b>{material?.name ?? "Saved glass"}</b>
                        <span className="used-glass-summary">
                          {[inferGlassThickness(material) || "No thickness", material?.description]
                            .filter(Boolean)
                            .join("-")}{" "}
                          ({money(material?.cost ?? 0)})
                        </span>
                        <small>{material?.options?.[0] || "No composition entered"}</small>
                      </div>
                    </div>
                  ))}
                  {!project.items.some((item) => item.glassMaterialId) && (
                    <p className="drawn-opening-empty">No glass is assigned yet.</p>
                  )}
                </div>
              )}
            </aside>
          )}
          {canvas.interaction?.type === "joinResize" && canvas.joinStretchMeasurement && (
            <div
              className="join-stretch-measurement"
              style={{
                left: canvas.joinStretchMeasurement.clientX + 18,
                top: canvas.joinStretchMeasurement.clientY + 18,
              }}
            >
              <b>
                {canvas.joinStretchMeasurement.axis
                  ? `Δ${canvas.joinStretchMeasurement.axis.toUpperCase()}`
                  : "Stretch"}
              </b>
              <strong>
                {canvas.joinStretchMeasurement.input || canvas.joinStretchMeasurement.amount} mm
              </strong>
              <small>
                {canvas.joinStretchMeasurement.input
                  ? "Typed distance · click to apply"
                  : canvas.joinStretchMeasurement.axis
                  ? "Type a distance or click to apply"
                  : "Move horizontally or vertically"}
              </small>
            </div>
          )}
          {(canvas.selectedGlassMaterialId || canvas.glassRemovalMode) && canvas.glassCursor && (
            <div
              className={`glass-carrying-cursor ${canvas.glassRemovalMode ? "removing" : ""}`}
              style={{ left: canvas.glassCursor.x + 16, top: canvas.glassCursor.y + 16 }}
            >
              <svg viewBox="0 0 36 28" aria-hidden="true">
                <rect x="3" y="2" width="30" height="24" />
                <path d="M10 20L18 12M14 23L22 15" />
              </svg>
              <span>
                {canvas.glassRemovalMode
                  ? "Remove glass"
                  : materials.find((material) => material.id === canvas.selectedGlassMaterialId)
                      ?.name ?? "Glass"}
              </span>
            </div>
          )}
          {canvas.contextMenu && contextItem && (
            <CanvasContextMenu
              canvas={canvas}
              contextItem={contextItem}
              contextCombinationSize={contextCombinationSize}
              contextIsFlyScreen={contextIsFlyScreen}
              contextIsHingeWindow={contextIsHingeWindow}
              contextIsFixedWindow={contextIsFixedWindow}
              contextIsTiltAndTurn={contextIsTiltAndTurn}
              contextSupportsFynLeafSize={contextSupportsFynLeafSize}
              contextSupportsOpeningType={contextSupportsOpeningType}
              updateProject={updateProject}
              setSelectedItemId={setSelectedItemId}
            />
          )}
          <div
            className="flex items-center gap-1.5 flex-wrap shrink-0 h-[47px] m-0 px-2 py-1.5 border-t border-[#cedddd] bg-[#e9eeee]"
            role="tablist"
            aria-label="Project canvases"
          >
            {(project.canvases ?? [{ id: "opening-1", name: "Opening 1", items: project.items }]).map(
              (c) => (
                <div
                  key={c.id}
                  className={`flex overflow-hidden border rounded-[5px] bg-white ${
                    c.id === selectedCanvasId
                      ? "border-[#218c92] shadow-[inset_0_-2px_#218c92]"
                      : "border-[#bfd4d5]"
                  }`}
                >
                  <button
                    role="tab"
                    aria-selected={c.id === selectedCanvasId}
                    className="min-h-[30px] px-2.5 border-0 bg-transparent text-[#385c60] text-xs font-extrabold cursor-pointer"
                    onClick={() => canvas.selectProjectCanvas(c.id)}
                  >
                    {c.name}
                  </button>
                  <button
                    className="w-[30px] min-h-[30px] border-0 border-l border-[#d6e4e4] bg-transparent text-[#317873] grid place-items-center cursor-pointer hover:bg-[#f0f6f6]"
                    onClick={() => canvas.renameProjectCanvas(c.id)}
                    title="Rename canvas"
                  >
                    <Icon name="edit" size={12} />
                  </button>
                </div>
              ),
            )}
            <button
              className="flex items-center gap-1 min-h-[31px] px-2.5 border border-dashed border-[#79b5b0] rounded-[5px] bg-white text-[#16716b] text-xs font-extrabold cursor-pointer hover:bg-[#f0f8f7]"
              onClick={canvas.addProjectCanvas}
            >
              <Icon name="plus" size={14} /> New opening
            </button>
          </div>
          {canvas.takeoffPanel && (
            <section
              ref={takeoffPanelRef}
              className="canvas-takeoff-panel"
              style={
                {
                  width: canvas.takeoffPanelWidth,
                  "--takeoff-panel-width": `${canvas.takeoffPanelWidth}px`,
                } as CSSProperties
              }
            >
              <div
                className="takeoff-panel-resize"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  canvas.takeoffResizeWidth.current = canvas.takeoffPanelWidth;
                  canvas.takeoffResizeRef.current = {
                    startX: event.clientX,
                    startWidth: canvas.takeoffPanelWidth,
                  };
                }}
                onPointerMove={(event) => {
                  const resize = canvas.takeoffResizeRef.current;
                  if (!resize) return;
                  const width = Math.max(
                    260,
                    Math.min(720, resize.startWidth + resize.startX - event.clientX),
                  );
                  canvas.takeoffResizeWidth.current = width;
                  canvas.setTakeoffPanelWidth(width);
                }}
                onPointerUp={() => {
                  canvas.setTakeoffPanelWidth(canvas.takeoffResizeWidth.current);
                  canvas.takeoffResizeRef.current = null;
                }}
                onPointerCancel={() => {
                  canvas.setTakeoffPanelWidth(canvas.takeoffResizeWidth.current);
                  canvas.takeoffResizeRef.current = null;
                }}
              />
              <header>
                <strong>
                  {canvas.takeoffPanel === "material"
                    ? takeoff.itemMaterialPanel
                      ? `${takeoff.itemMaterialPanel.name}: takeoff`
                      : "Material takeoff"
                    : canvas.takeoffPanel === "glassLibrary"
                    ? "Glass library"
                    : canvas.takeoffPanel === "glass"
                    ? "Glass takeoff"
                    : "Manpower"}
                </strong>
                {canvas.takeoffPanel === "material" && takeoff.itemMaterialPanel && (
                  <button
                    className="ml-auto px-3 min-w-[70px] min-h-[30px] border border-[#63cdd2] rounded bg-[#15535d] text-[#edffff] text-xs font-extrabold cursor-pointer hover:brightness-110"
                    onClick={() => {
                      if (!canvas.editingItemMaterial) canvas.setTakeoffPanelWidth(620);
                      canvas.setEditingItemMaterial((editing) => !editing);
                    }}
                  >
                    {canvas.editingItemMaterial ? "Done" : "Modify"}
                  </button>
                )}
                {canvas.takeoffPanel !== "glassLibrary" && (
                  <b className="takeoff-header-total">
                    Total:{" "}
                    {money(
                      canvas.takeoffPanel === "manpower"
                        ? takeoff.manpowerTotal
                        : (canvas.takeoffPanel === "material"
                            ? takeoff.itemMaterialPanel
                              ? [...takeoff.itemGlassTakeoff, ...takeoff.itemMaterialTakeoff]
                              : takeoff.materialTakeoff
                            : takeoff.glassTakeoff
                          ).reduce((sum, row) => sum + row.total, 0),
                    )}
                  </b>
                )}
                <button
                  type="button"
                  onClick={() => {
                    canvas.setTakeoffPanel(null);
                    canvas.setItemMaterialPanelId(null);
                    canvas.setEditingItemMaterial(false);
                    if (canvas.takeoffPanel === "glassLibrary")
                      canvas.setSelectedGlassMaterialId(null);
                  }}
                  aria-label="Close takeoff panel"
                >
                  ×
                </button>
              </header>
              {canvas.takeoffPanel === "material" &&
                (takeoff.itemMaterialPanel ? (
                  <div className="grid gap-3.5">
                    <section className="border border-[#516b72] rounded-[5px] p-2.5">
                      <h2 className="m-0 mb-2 text-[#dff8f6] text-sm uppercase tracking-[0.06em] font-bold">Glass</h2>
                      {takeoff.itemGlassTakeoff.length ? (
                        <div className="takeoff-list">
                          {takeoff.itemGlassTakeoff.map(({ material, quantity, total }) => (
                            <div
                              key={material.id}
                              className={`takeoff-row items-center gap-2 ${
                                canvas.editingItemMaterial
                                  ? "!grid !grid-cols-[42px_minmax(0,1fr)_minmax(150px,1fr)_auto]"
                                  : "!grid !grid-cols-[42px_minmax(0,1fr)_auto]"
                              }`}
                            >
                              <Sketch path={material.sketch} label={material.name} />
                              <span>
                                <b>
                                  {material.code} - {material.name}
                                </b>
                                <small>
                                  {number(quantity)} m² ×{" "}
                                  {money(
                                    unitPriceWithShipping(
                                      material,
                                      shippingRateForMaterial(material),
                                    ),
                                  )}
                                  /m²
                                </small>
                                {takeoff.itemMaterialPanel?.materialAdjustments?.[material.id] && (
                                  <small className="text-[#71e4d8] font-extrabold">
                                    Modified:{" "}
                                    {takeoff.itemMaterialPanel.materialAdjustments[material.id]}
                                  </small>
                                )}
                              </span>
                              {canvas.editingItemMaterial && (
                                <input
                                  className="w-full min-h-[30px] bg-[#152125] text-[#f5ffff] border border-[#749499] rounded px-[7px] py-1 text-xs outline-none"
                                  defaultValue={
                                    takeoff.itemMaterialPanel?.materialAdjustments?.[material.id] ??
                                    ""
                                  }
                                  onBlur={(event) =>
                                    updateProject((current) => ({
                                      ...current,
                                      items: current.items.map((item) =>
                                        item.id === takeoff.itemMaterialPanel!.id
                                          ? {
                                              ...item,
                                              materialAdjustments: {
                                                ...item.materialAdjustments,
                                                [material.id]: event.target.value,
                                              },
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                  }}
                                  placeholder="+Area or -Area/2"
                                  aria-label={`Glass adjustment for ${material.name}`}
                                />
                              )}
                              <strong>{money(total)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="takeoff-empty">No glass selected.</p>
                      )}
                    </section>
                    <section className="border border-[#516b72] rounded-[5px] p-2.5">
                      <h2 className="m-0 mb-2 text-[#dff8f6] text-sm uppercase tracking-[0.06em] font-bold">Material</h2>
                      {takeoff.itemMaterialTakeoff.length ? (
                        <div className="takeoff-list">
                          {takeoff.itemMaterialTakeoff.map(
                            ({ material, reference, quantity, total }) => (
                              <div
                                key={material.id}
                                className={`takeoff-row items-center gap-2 ${
                                  canvas.editingItemMaterial
                                    ? "!grid !grid-cols-[42px_minmax(0,1fr)_minmax(150px,1fr)_auto]"
                                    : "!grid !grid-cols-[42px_minmax(0,1fr)_auto]"
                                }`}
                              >
                                <Sketch path={material.sketch} label={material.name} />
                                <span>
                                  <b>
                                    {material.code} - {material.name}
                                  </b>
                                  <small className="material-location">{reference}</small>
                                  <small>
                                    {number(quantity)} {material.unit} ×{" "}
                                    {money(
                                      unitPriceWithShipping(
                                        material,
                                        shippingRateForMaterial(material),
                                      ),
                                    )}
                                  </small>
                                  {takeoff.itemMaterialPanel?.materialAdjustments?.[
                                    material.id
                                  ] && (
                                    <small className="text-[#71e4d8] font-extrabold">
                                      Modified:{" "}
                                      {takeoff.itemMaterialPanel.materialAdjustments[material.id]}
                                    </small>
                                  )}
                                </span>
                                {canvas.editingItemMaterial && (
                                  <input
                                    className="w-full min-h-[30px] bg-[#152125] text-[#f5ffff] border border-[#749499] rounded px-[7px] py-1 text-xs outline-none"
                                    defaultValue={
                                      takeoff.itemMaterialPanel?.materialAdjustments?.[
                                        material.id
                                      ] ?? ""
                                    }
                                    onBlur={(event) =>
                                      updateProject((current) => ({
                                        ...current,
                                        items: current.items.map((item) =>
                                          item.id === takeoff.itemMaterialPanel!.id
                                            ? {
                                                ...item,
                                                materialAdjustments: {
                                                  ...item.materialAdjustments,
                                                  [material.id]: event.target.value,
                                                },
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") event.currentTarget.blur();
                                    }}
                                    placeholder="+Width or -Area/2"
                                    aria-label={`Adjustment for ${material.name}`}
                                  />
                                )}
                                <strong>{money(total)}</strong>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="takeoff-empty">No components for this opening type.</p>
                      )}
                    </section>
                  </div>
                ) : takeoff.materialTakeoff.length ? (
                  <div className="takeoff-list">
                    {takeoff.materialTakeoff.map(
                      ({ material, quantity, total }) =>
                        material && (
                          <div key={material.id} className="takeoff-row glass-takeoff-row">
                            <Sketch path={material.sketch} label={material.name} />
                            <span>
                              <b>
                                {material.code} - {material.name}
                              </b>
                              <small className="material-location">
                                {materialDatabaseReference(material)}
                              </small>
                              <small>
                                {number(quantity)} {material.unit} ×{" "}
                                {money(
                                  unitPriceWithShipping(
                                    material,
                                    shippingRateForMaterial(material),
                                  ),
                                )}
                              </small>
                            </span>
                            <strong>{money(total)}</strong>
                          </div>
                        ),
                    )}
                  </div>
                ) : (
                  <p className="takeoff-empty">Choose a window type to calculate materials.</p>
                ))}
              {canvas.takeoffPanel === "glass" &&
                (takeoff.glassTakeoff.length ? (
                  <div className="takeoff-list">
                    {takeoff.glassTakeoff.map(
                      ({ material, quantity, total }) =>
                        material && (
                          <div key={material.id} className="takeoff-row glass-takeoff-row">
                            <Sketch path={material.sketch} label={material.name} />
                            <span>
                              <b>{material.name}</b>
                              <small className="takeoff-glass-summary">
                                {[
                                  inferGlassThickness(material) || "No thickness",
                                  material.description,
                                ]
                                  .filter(Boolean)
                                  .join("-")}{" "}
                                ({money(material.cost)}/m²)
                              </small>
                              <small className="takeoff-glass-description">
                                {material.options?.[0] || "No composition entered"}
                              </small>
                              <small>{number(quantity)} m²</small>
                            </span>
                            <strong>{money(total)}</strong>
                          </div>
                        ),
                    )}
                  </div>
                ) : (
                  <p className="takeoff-empty">
                    Add glass with the Glass button in the top toolbar to calculate its area.
                  </p>
                ))}
              {canvas.takeoffPanel === "glassLibrary" && (
                <div className="glass-library-picker">
                  <p>
                    Select a glass item, then click each window area on the canvas where it should
                    be used.
                  </p>
                  {materials
                    .filter((material) => material.databaseId === "glass")
                    .map((material) => (
                      <button
                        key={material.id}
                        className={`glass-library-item ${
                          canvas.selectedGlassMaterialId === material.id ? "selected" : ""
                        }`}
                        onClick={() => {
                          canvas.setSelectedGlassMaterialId(material.id);
                          canvas.setGlassRemovalMode(false);
                          canvas.setDrawingMode("select");
                          canvas.setJoinModeItemId(null);
                          canvas.setInteraction(null);
                        }}
                      >
                        <Sketch path={material.sketch} label={material.name} />
                        <span>
                          <b>{material.name}</b>
                          <small className="glass-library-summary">
                            {[
                              inferGlassThickness(material) || "No thickness",
                              material.description,
                            ]
                              .filter(Boolean)
                              .join("-")}{" "}
                            ({money(material.cost)}/m²)
                          </small>
                          <small className="glass-library-composition">
                            {material.options?.[0] || "No composition entered"}
                          </small>
                        </span>
                      </button>
                    ))}
                  {!materials.some((material) => material.databaseId === "glass") && (
                    <p className="takeoff-empty">No glass items are in the library yet.</p>
                  )}
                  <button
                    className={`glass-library-stop ${
                      canvas.glassRemovalMode ? "selected" : ""
                    }`}
                    onClick={() => {
                      canvas.setGlassRemovalMode((active) => !active);
                      canvas.setSelectedGlassMaterialId(null);
                      canvas.setDrawingMode("select");
                      canvas.setJoinModeItemId(null);
                      canvas.setInteraction(null);
                    }}
                  >
                    {canvas.glassRemovalMode ? "Stop removing glass" : "Remove glass"}
                  </button>
                  {canvas.selectedGlassMaterialId && (
                    <button
                      className="glass-library-stop glass-library-stop-assignment"
                      onClick={() => canvas.setSelectedGlassMaterialId(null)}
                    >
                      Stop assigning glass
                    </button>
                  )}
                </div>
              )}
              {canvas.takeoffPanel === "manpower" && (
                <div className="canvas-manpower-editor">
                  <div className="manpower-panel-tabs">
                    <button
                      className={canvas.manpowerPanelTab === "parameters" ? "selected" : ""}
                      onClick={() => canvas.setManpowerPanelTab("parameters")}
                    >
                      Parameters
                    </button>
                    <button
                      className={canvas.manpowerPanelTab === "items" ? "selected" : ""}
                      onClick={() => canvas.setManpowerPanelTab("items")}
                    >
                      Manpower items
                    </button>
                  </div>
                  {canvas.manpowerPanelTab === "parameters" ? (
                    <>
                      <p>
                        Choose the calculation parameter, then enter labour hours per unit. Selected
                        items total:{" "}
                        <b>
                          {number(takeoff.manpowerParameterQuantity)}{" "}
                          {takeoff.manpowerParameterUnit[takeoff.manpowerParameter]}
                        </b>
                        .
                      </p>
                      <div className="manpower-parameter-options">
                        {(["width", "height", "area", "perimeter"] as const).map((parameter) => (
                          <button
                            key={parameter}
                            className={takeoff.manpowerParameter === parameter ? "selected" : ""}
                            onClick={() => canvas.setCanvasManpowerParameter(parameter)}
                          >
                            {parameter === "width"
                              ? "Width"
                              : parameter === "height"
                              ? "Height"
                              : parameter === "area"
                              ? "Area"
                              : "Perimeter"}
                          </button>
                        ))}
                      </div>
                      <div className="manpower-value-headings">
                        <span>Manpower cost</span>
                        <span>Hours / unit</span>
                        <span>Total</span>
                      </div>
                      {takeoff.manpowerRows.map((cost) => (
                        <label key={cost.id}>
                          <span>
                            <b>{cost.name}</b>
                            <small>{money(cost.rate)} / hour</small>
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={cost.hoursPerUnit}
                            onChange={(event) =>
                              canvas.setCanvasManpowerHours(
                                cost.id,
                                Math.max(0, Number(event.target.value) || 0),
                              )
                            }
                            aria-label={`${cost.name} hours per ${
                              takeoff.manpowerParameterUnit[takeoff.manpowerParameter]
                            }`}
                          />
                          <strong>{money(cost.total)}</strong>
                        </label>
                      ))}
                    </>
                  ) : (
                    <>
                      <p>
                        Select the windows, doors, or items included in this drawing’s manpower
                        calculation.
                      </p>
                      <div className="manpower-item-list">
                        {project.items.length ? (
                          project.items.map((item, index) => (
                            <label key={item.id}>
                              <input
                                type="checkbox"
                                checked={takeoff.selectedManpowerItemIds.has(item.id)}
                                onChange={(event) =>
                                  canvas.toggleCanvasManpowerItem(item.id, event.target.checked)
                                }
                              />
                              <span>
                                <b>{item.name}</b>
                                <small>
                                  {item.kind === "assembly"
                                    ? `${item.name} · ${number(
                                        (item.inputWidth ?? item.width) / 1000,
                                      )} × ${number((item.inputHeight ?? item.height) / 1000)} m`
                                    : `Item ${index + 1}`}
                                </small>
                              </span>
                            </label>
                          ))
                        ) : (
                          <p className="takeoff-empty">Draw a window, door, or item first.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
        <aside className="inspector">
          {!canvas.inspectorCollapsed && (
            <div
              className="inspector-resize"
              onPointerDown={canvas.startInspectorResize}
              role="separator"
              aria-label="Resize live material takeoff"
            />
          )}
          <button
            className="inspector-collapse"
            onClick={() => canvas.setInspectorCollapsed((collapsed) => !collapsed)}
            aria-label={
              canvas.inspectorCollapsed
                ? "Expand live material takeoff"
                : "Collapse live material takeoff"
            }
            title={
              canvas.inspectorCollapsed
                ? "Expand live material takeoff"
                : "Collapse live material takeoff"
            }
          >
            <Icon name="arrow" size={16} />
          </button>
          <div className="inspector-content">
            <section className="live-materials takeoff-table">
              <div className="inspector-section-heading">
                <h2>Material takeoff</h2>
                <span>{takeoff.materialTakeoff.length}</span>
              </div>
              {takeoff.materialTakeoff.length ? (
                <div className="takeoff-list">
                  {takeoff.materialTakeoff.map(
                    ({ material, quantity, total, formulas }) =>
                      material && (
                        <div key={material.id} className="takeoff-row">
                          <span>
                            <b>{material.name}</b>
                            <small className="material-location">
                              {materialDatabaseReference(material)}
                            </small>
                            <small>
                              {number(quantity)} {material.unit} ×{" "}
                              {money(
                                unitPriceWithShipping(
                                  material,
                                  shippingRateForMaterial(material),
                                ),
                              )}
                            </small>
                          </span>
                          <strong>{money(total)}</strong>
                          {formulas.map((formula) => (
                            <i
                              key={formula.label}
                              className={
                                formula.isError ? "formula-tag formula-error" : "formula-tag"
                              }
                            >
                              {formula.label}
                            </i>
                          ))}
                        </div>
                      ),
                  )}
                </div>
              ) : (
                <p className="takeoff-empty">Choose a window type to calculate materials.</p>
              )}
              {takeoff.materialTakeoff.length > 0 && (
                <div className="takeoff-total">
                  <span>Material total</span>
                  <strong>
                    {money(takeoff.materialTakeoff.reduce((sum, row) => sum + row.total, 0))}
                  </strong>
                </div>
              )}
            </section>
            <section className="takeoff-table glass-takeoff-table">
              <div className="inspector-section-heading">
                <h2>Glass takeoff</h2>
                <span>{takeoff.glassTakeoff.length}</span>
              </div>
              {takeoff.glassTakeoff.length ? (
                <div className="takeoff-list">
                  {takeoff.glassTakeoff.map(
                    ({ material, quantity, total }) =>
                      material && (
                        <div key={material.id} className="takeoff-row">
                          <span>
                            <b>{material.name}</b>
                            <small>
                              {number(quantity)} m² ×{" "}
                              {money(
                                unitPriceWithShipping(
                                  material,
                                  shippingRateForMaterial(material),
                                ),
                              )}
                              /m²
                            </small>
                          </span>
                          <strong>{money(total)}</strong>
                        </div>
                      ),
                  )}
                </div>
              ) : (
                <p className="takeoff-empty">
                  Select glass on a window to calculate its area.
                </p>
              )}
              {takeoff.glassTakeoff.length > 0 && (
                <div className="takeoff-total">
                  <span>Glass total</span>
                  <strong>
                    {money(takeoff.glassTakeoff.reduce((sum, row) => sum + row.total, 0))}
                  </strong>
                </div>
              )}
            </section>
            <section className="takeoff-table manpower-takeoff-table">
              <div className="inspector-section-heading">
                <h2>Manpower</h2>
                <span>{takeoff.manpowerTakeoff.length}</span>
              </div>
              {takeoff.manpowerTakeoff.length ? (
                <div className="takeoff-list">
                  {takeoff.manpowerTakeoff.map((cost) => (
                    <div key={cost.id} className="takeoff-row">
                      <span>
                        <b>{cost.name}</b>
                        <small>
                          {number(cost.hours)} hours × {money(cost.rate)} / hour
                        </small>
                      </span>
                      <strong>{money(cost.total)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="takeoff-empty">Enter hours in the Manpower panel for this drawing.</p>
              )}
              {takeoff.manpowerTakeoff.length > 0 && (
                <div className="takeoff-total">
                  <span>Manpower total</span>
                  <strong>{money(takeoff.manpowerTotal)}</strong>
                </div>
              )}
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
