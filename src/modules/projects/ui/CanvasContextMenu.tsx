import type { Dispatch, SetStateAction } from "react";
import type { CanvasItem, Project } from "../../../domain/types";
import { MAX_OPENING_DIMENSION } from "../../../domain/windowJoins";
import { Icon } from "../../../design-system/Icon";
import type { useCanvasInteraction } from "../application/useCanvasInteraction";

export type CanvasContextMenuProps = {
  canvas: ReturnType<typeof useCanvasInteraction>;
  contextItem: CanvasItem;
  contextCombinationSize: number;
  contextIsFlyScreen: boolean;
  contextIsHingeWindow: boolean;
  contextIsFixedWindow: boolean;
  contextIsTiltAndTurn: boolean;
  contextSupportsFynLeafSize: boolean;
  contextSupportsOpeningType: boolean;
  updateProject: (updater: (project: Project) => Project) => void;
  setSelectedItemId: Dispatch<SetStateAction<string | null>>;
};

export function CanvasContextMenu({
  canvas,
  contextItem,
  contextCombinationSize,
  contextIsFlyScreen,
  contextIsHingeWindow,
  contextIsFixedWindow,
  contextIsTiltAndTurn,
  contextSupportsFynLeafSize,
  contextSupportsOpeningType,
  updateProject,
  setSelectedItemId,
}: CanvasContextMenuProps) {
  if (!canvas.contextMenu) return null;

  return (
    <section
      className="absolute z-[8] w-[320px] p-3 border border-[#4a585e] rounded-[7px] bg-[#262d31] text-[#e9f1f2] shadow-[0_14px_32px_rgba(0,0,0,0.38)]"
      style={{ left: canvas.contextMenu.x, top: canvas.contextMenu.y }}
      aria-label={`Actions for ${contextItem.name}`}
    >
      <div className="flex items-end justify-between gap-2 mb-2.5">
        <div className="grid min-w-0 gap-[3px]">
          <label
            htmlFor={`opening-name-${contextItem.id}`}
            className="text-[#b9c9cc] text-[9px] font-extrabold uppercase"
          >
            Item name
          </label>
          <input
            id={`opening-name-${contextItem.id}`}
            key={contextItem.name}
            defaultValue={contextItem.name}
            className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#e9fbfd] text-xs font-extrabold hover:border-[#56aeb8] hover:bg-[#13181b] focus:border-[#56aeb8] focus:bg-[#13181b] focus:outline-none"
            onFocus={() => canvas.setOpeningNameError("")}
            onBlur={(event) => canvas.renameCanvasItem(contextItem.id, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.currentTarget.value = contextItem.name;
                canvas.setOpeningNameError("");
                event.currentTarget.blur();
              }
            }}
            aria-describedby={canvas.openingNameError ? "opening-name-error" : undefined}
          />
        </div>
        {contextCombinationSize > 1 && (
          <>
            <div className="grid min-w-0 gap-[3px]">
              <label
                htmlFor={`combination-name-${contextItem.id}`}
                className="text-[#b9c9cc] text-[9px] font-extrabold uppercase"
              >
                Combination name
              </label>
              <input
                id={`combination-name-${contextItem.id}`}
                key={contextItem.combinationName ?? ""}
                defaultValue={contextItem.combinationName ?? "Combination"}
                className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#e9fbfd] text-xs font-extrabold hover:border-[#56aeb8] hover:bg-[#13181b] focus:border-[#56aeb8] focus:bg-[#13181b] focus:outline-none"
                onFocus={() => canvas.setOpeningNameError("")}
                onBlur={(event) =>
                  canvas.renameCombination(contextItem.id, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    event.currentTarget.value = contextItem.combinationName ?? "";
                    canvas.setOpeningNameError("");
                    event.currentTarget.blur();
                  }
                }}
                aria-describedby={canvas.openingNameError ? "opening-name-error" : undefined}
              />
            </div>
            <button
              type="button"
              className="shrink-0 min-h-[28px] px-2 border border-[#d5a55b] rounded bg-[#503e22] text-[#ffe0a6] text-[10px] font-extrabold cursor-pointer hover:bg-[#68502a] focus-visible:outline-2 focus-visible:outline-[#ffd17c] focus-visible:outline-offset-2"
              onClick={() => canvas.separateWindowFromCombination(contextItem.id)}
            >
              Separate
            </button>
          </>
        )}
      </div>

      {canvas.openingNameError && (
        <p id="opening-name-error" className="-mt-1 mb-2 text-[#ffb5b5] text-[10px] font-bold leading-tight" role="alert">
          {canvas.openingNameError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <label className="grid gap-1 text-[#b9c9cc] text-[10px] font-bold">
          Width (mm)
          <input
            type="number"
            step="1"
            min="200"
            max={MAX_OPENING_DIMENSION}
            defaultValue={contextItem.inputWidth ?? 1500}
            className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-xs focus:border-[#56aeb8] focus:outline-none"
            onBlur={(event) =>
              updateProject((current) => ({
                ...current,
                items: current.items.map((item) =>
                  item.id === contextItem.id
                    ? {
                        ...item,
                        inputWidth: Math.min(
                          MAX_OPENING_DIMENSION,
                          Math.max(200, Math.round(Number(event.target.value) || 200)),
                        ),
                      }
                    : item,
                ),
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
        <label className="grid gap-1 text-[#b9c9cc] text-[10px] font-bold">
          Height (mm)
          <input
            type="number"
            step="1"
            min="200"
            max={MAX_OPENING_DIMENSION}
            defaultValue={contextItem.inputHeight ?? 1200}
            className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-xs focus:border-[#56aeb8] focus:outline-none"
            onBlur={(event) =>
              updateProject((current) => ({
                ...current,
                items: current.items.map((item) =>
                  item.id === contextItem.id
                    ? {
                        ...item,
                        inputHeight: Math.min(
                          MAX_OPENING_DIMENSION,
                          Math.max(200, Math.round(Number(event.target.value) || 200)),
                        ),
                      }
                    : item,
                ),
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
        <label className="grid gap-1 text-[#b9c9cc] text-[10px] font-bold">
          Qty
          <input
            type="number"
            step="1"
            min="1"
            defaultValue={contextItem.quantity ?? 1}
            className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-xs focus:border-[#56aeb8] focus:outline-none"
            onBlur={(event) =>
              canvas.updateCombinationQuantity(contextItem.id, Number(event.target.value))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
        <label className="grid gap-1 text-[#b9c9cc] text-[10px] font-bold">
          Reference
          <input
            key={contextItem.reference ?? "auto"}
            type="number"
            step="1"
            min="1"
            defaultValue={contextItem.reference ?? ""}
            placeholder="Auto"
            className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-xs focus:border-[#56aeb8] focus:outline-none"
            onFocus={() => canvas.setOpeningNameError("")}
            onBlur={(event) =>
              canvas.updateCanvasReference(
                contextItem.id,
                Math.round(Number(event.target.value)),
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.currentTarget.value = String(contextItem.reference ?? "");
                canvas.setOpeningNameError("");
                event.currentTarget.blur();
              }
            }}
            aria-describedby={canvas.openingNameError ? "opening-name-error" : undefined}
          />
        </label>
        {contextItem.kind === "assembly" && (
          <label className="col-span-full grid gap-1 text-[#b9c9cc] text-[10px] font-bold">
            Type
            <select
              value={contextItem.sourceId}
              className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
              onChange={(event) =>
                canvas.changeDrawnWindowType(contextItem.id, event.target.value)
              }
            >
              <option value="">No type (default)</option>
              {contextIsFlyScreen ? (
                <option value="fly-screen-2rail">Fly screen - Soleal - GYn</option>
              ) : contextIsHingeWindow ? (
                <option value="hinged-window-soleal-fyn">
                  Hinged System - Soleal - FYn
                </option>
              ) : contextIsFixedWindow ? (
                <option value="fixed-window">Fixed window - Soleal - FYn</option>
              ) : contextIsTiltAndTurn ? (
                <option value="tilt-and-turn-soleal-fyn">
                  Tilt and Turn - Soleal - FYn
                </option>
              ) : (
                <option value="soleal-gyn-2rail">2 Rail System - Soleal - GYn</option>
              )}
            </select>
          </label>
        )}
        {contextItem.kind === "assembly" && contextItem.sourceId && (
          <section className="col-span-full grid gap-2 mt-0.5 p-2.5 border border-[#536a70] rounded bg-[#1c2529]" aria-label="Window type parameters">
            <strong className="text-[#9ae0dd] text-[10px] font-extrabold tracking-wider uppercase">Type parameters</strong>
            {!contextIsFlyScreen && (
              <>
                {!contextIsTiltAndTurn && !contextIsFixedWindow && (
                  <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                    Number of leaves
                    <select
                      value={contextItem.leaves ?? (contextIsHingeWindow ? 1 : 2)}
                      className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                      onChange={(event) =>
                        canvas.updateRealJoinSettings(contextItem.id, {
                          leaves: Number(event.target.value) as 1 | 2 | 3 | 4,
                        })
                      }
                    >
                      {contextIsHingeWindow ? (
                        <>
                          <option value={1}>1 leaf</option>
                          <option value={2}>2 leaves</option>
                        </>
                      ) : (
                        <>
                          <option value={2}>2 leaves</option>
                          <option value={3}>3 leaves</option>
                          <option value={4}>4 leaves</option>
                        </>
                      )}
                    </select>
                  </label>
                )}
                {contextSupportsFynLeafSize && (
                  <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                    Leaf size
                    <select
                      value={contextItem.leafSize ?? "small"}
                      className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                      onChange={(event) =>
                        canvas.updateRealJoinSettings(contextItem.id, {
                          leafSize: event.target.value as "small" | "big",
                        })
                      }
                    >
                      <option value="small">Small leaf</option>
                      <option value="big">Big leaf</option>
                    </select>
                  </label>
                )}
                {(contextIsHingeWindow || contextIsFixedWindow || contextIsTiltAndTurn) && (
                  <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                    Frame size
                    <select
                      value={contextItem.frameSize ?? "small"}
                      className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                      onChange={(event) =>
                        canvas.updateRealJoinSettings(contextItem.id, {
                          frameSize: event.target.value as "small" | "big",
                        })
                      }
                    >
                      <option value="small">Small frame</option>
                      <option value="big">Big frame</option>
                    </select>
                  </label>
                )}
                {contextSupportsOpeningType && (
                  <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                    Opening type
                    <select
                      value={contextItem.openingType ?? "window"}
                      className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                      onChange={(event) =>
                        canvas.updateRealJoinSettings(contextItem.id, {
                          openingType: event.target.value as "window" | "door",
                        })
                      }
                    >
                      <option value="window">Window</option>
                      <option value="door">Door</option>
                    </select>
                  </label>
                )}
                <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                  Architrave
                  <select
                    value={contextItem.hasArchitrave ? "with" : "without"}
                    className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                    onChange={(event) => {
                      const value = event.target.value === "with";
                      canvas.updateCombinationGlazedSettings(contextItem.id, {
                        hasArchitrave: value,
                      });
                      canvas.updateRealJoinSettings(contextItem.id, {
                        hasArchitrave: value,
                      });
                    }}
                  >
                    <option value="without">Without architrave</option>
                    <option value="with">With architrave</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                  Reinforcement
                  <select
                    value={contextItem.reinforced ? "reinforced" : "not-reinforced"}
                    className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                    onChange={(event) =>
                      canvas.updateRealJoinSettings(contextItem.id, {
                        reinforced: event.target.value === "reinforced",
                      })
                    }
                  >
                    <option value="not-reinforced">Not reinforced</option>
                    <option value="reinforced">Reinforced</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
                  Architrave allowance
                  <select
                    value={contextItem.hasArchitraveAllowance ? "with" : "without"}
                    className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                    onChange={(event) => {
                      const value = event.target.value === "with";
                      canvas.updateCombinationGlazedSettings(contextItem.id, {
                        hasArchitraveAllowance: value,
                      });
                      canvas.updateRealJoinSettings(contextItem.id, {
                        hasArchitraveAllowance: value,
                      });
                    }}
                  >
                    <option value="without">Without architrave allowance</option>
                    <option value="with">With architrave allowance</option>
                  </select>
                </label>
              </>
            )}
            <label className="grid gap-1 text-[#c8d8da] text-[10px] font-bold">
              Coating
              <select
                value={contextItem.hasCoating ? "with" : "without"}
                className="w-full h-[31px] px-1.5 py-1 border border-[#586970] rounded bg-[#171c1f] text-[#f3fbfb] text-[11px] focus:border-[#56aeb8] focus:outline-none cursor-pointer"
                onChange={(event) =>
                  canvas.updateRealJoinSettings(contextItem.id, {
                    hasCoating: event.target.value === "with",
                  })
                }
              >
                <option value="without">Without coating</option>
                <option value="with">With coating</option>
              </select>
            </label>
          </section>
        )}
      </div>

      <button
        type="button"
        className="flex items-center justify-center w-full min-h-[34px] mt-3.5 px-0 border border-[#56aeb8] rounded bg-[#174f59] text-[#e9fbfd] text-xs font-extrabold tracking-tight hover:border-[#76cfda] hover:bg-[#216976] focus-visible:outline-2 focus-visible:outline-[#9debf2] focus-visible:outline-offset-2 cursor-pointer transition-colors"
        onClick={() => {
          canvas.setItemMaterialPanelId(contextItem.id);
          canvas.setTakeoffPanel("material");
          canvas.setContextMenu(null);
        }}
      >
        Material
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1.5 w-full min-h-[32px] mt-1.5 border border-[#9c4f4f] rounded bg-[#4f2929] text-[#ffd9d9] text-xs font-extrabold hover:bg-[#6b3030] cursor-pointer transition-colors"
        onClick={() => {
          canvas.deleteCanvasItem(contextItem.id);
          setSelectedItemId(null);
          canvas.setContextMenu(null);
        }}
      >
        <Icon name="trash" size={15} /> Delete item
      </button>
    </section>
  );
}
