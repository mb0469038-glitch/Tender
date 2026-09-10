import {
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";
import { Icon } from "../../../../design-system/Icon";
import { Sketch } from "../../../../design-system/Sketch";
import type {
  Assembly,
  AssemblyCanvasDefaults,
  AssemblyNameRule,
  FrameType,
  JoinModification,
  JoinPropertyMatch,
  Material,
} from "../../../../domain/types";
import { MAX_OPENING_DIMENSION } from "../../../../domain/windowJoins";
import { makeId } from "../../../../shared/kernel/ids";
import { TECHNAL_FYN_DATABASE } from "../../domain/catalogDefinitions";
import { defaultFynJoinModifications } from "../../domain/technalSeed";
import { joinMatchPropertiesForAssembly } from "../../../projects/domain/joinEngine";
import { usesDirectJoinValues } from "../../../costing/domain/quantityEngine";

export const assemblyColourOptions = [
  "#25A9AD",
  "#527FC3",
  "#E06C75",
  "#D19A66",
  "#98C379",
  "#C678DD",
  "#56B6C2",
  "#D9E8EA",
];

export type AssemblyModalProps = {
  isOpen: boolean;
  modalId?: string;
  formName: string;
  setFormName: (value: string) => void;
  formCode: string;
  setFormCode: (value: string) => void;
  formCategory: string;
  setFormCategory: (value: string) => void;
  formManufacturer: string;
  setFormManufacturer: (value: string) => void;
  assemblyColor: string;
  setAssemblyColor: (value: string) => void;
  copyFromAssemblyOpen: boolean;
  setCopyFromAssemblyOpen: React.Dispatch<React.SetStateAction<boolean>>;
  copyAssemblyContentFrom: (id: string) => void;
  assemblies: Assembly[];
  materials: Material[];
  materialDatabaseReference: (material: Material) => string;
  assemblyFormulaValuesForEditor: { name: string; label: string; description: string }[];
  assemblyCanvasDefaults: AssemblyCanvasDefaults;
  setAssemblyCanvasDefaults: React.Dispatch<React.SetStateAction<AssemblyCanvasDefaults>>;
  assemblyColumnWidths: number[];
  startAssemblyColumnResize: (event: PointerEvent<HTMLButtonElement>, index: number) => void;
  resizeAssemblyColumn: (event: PointerEvent<HTMLDivElement>) => void;
  setAssemblyColumnResize: (value: null) => void;
  partIds: string[];
  setPartIds: React.Dispatch<React.SetStateAction<string[]>>;
  partMaterialIds: Record<string, string>;
  partFormulas: Record<string, string>;
  setPartFormulas: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  partFourPanelFormulas: Record<string, string>;
  setPartFourPanelFormulas: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  partConditions: Record<string, string>;
  setPartConditions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  moveMaterialId: string | null;
  setMoveMaterialId: (id: string | null) => void;
  moveAssemblyPartAfter: (movingId: string, targetId: string) => void;
  photoMenuMaterialId: string | null;
  setPhotoMenuMaterialId: React.Dispatch<React.SetStateAction<string | null>>;
  insertAfterMaterialId: string | null;
  setInsertAfterMaterialId: (id: string | null) => void;
  insertMaterialCode: string;
  setInsertMaterialCode: (value: string) => void;
  addAssemblyPartByCode: (afterId: string, code: string, isInsert?: boolean) => void;
  activeFormulaField: { materialId: string; field: "true" | "false" } | null;
  setActiveFormulaField: React.Dispatch<React.SetStateAction<{ materialId: string; field: "true" | "false" } | null>>;
  beginFormulaEdit: (materialId: string, field: "true" | "false", initialValue: string) => void;
  cancelFormulaEdit: (materialId: string, field: "true" | "false") => void;
  setFormulaEditBackup: (val: null) => void;
  insertFormulaValue: (materialId: string, field: "true" | "false", token: string) => void;
  activeConditionMaterialId: string | null;
  setActiveConditionMaterialId: React.Dispatch<React.SetStateAction<string | null>>;
  conditionEditBackup: { materialId: string; value: string } | null;
  setConditionEditBackup: React.Dispatch<React.SetStateAction<{ materialId: string; value: string } | null>>;
  insertConditionToken: (materialId: string, token: string) => void;
  frameTypes: FrameType[];
  setFrameTypes: React.Dispatch<React.SetStateAction<FrameType[]>>;
  nameRules: AssemblyNameRule[];
  setNameRules: React.Dispatch<React.SetStateAction<AssemblyNameRule[]>>;
  realJoinPropertyMatches: JoinPropertyMatch[];
  fakeJoinPropertyMatches: JoinPropertyMatch[];
  updateJoinPropertyMatch: (kind: "real" | "fake", id: string, change: Partial<JoinPropertyMatch>) => void;
  removeJoinPropertyMatch: (kind: "real" | "fake", id: string) => void;
  addJoinPropertyMatch: (kind: "real" | "fake", defaultProperty?: string) => void;
  activeDatabaseId: string;
  joinModifications: JoinModification[];
  setJoinModifications: React.Dispatch<React.SetStateAction<JoinModification[]>>;
  assemblyReferenceImage: string;
  setAssemblyReferenceImage: (img: string) => void;
  assemblyAutoSaveStatus: "saved" | "saving" | "idle";
  workspaceSaveStatus?: "saved" | "saving" | "error" | "idle";
  onClose: () => void;
  onSave: (event: FormEvent) => void;
};

export function AssemblyModal({
  isOpen,
  modalId,
  formName,
  setFormName,
  formCode,
  setFormCode,
  formCategory,
  setFormCategory,
  formManufacturer,
  setFormManufacturer,
  assemblyColor,
  setAssemblyColor,
  copyFromAssemblyOpen,
  setCopyFromAssemblyOpen,
  copyAssemblyContentFrom,
  assemblies,
  materials,
  materialDatabaseReference,
  assemblyFormulaValuesForEditor,
  assemblyCanvasDefaults,
  setAssemblyCanvasDefaults,
  assemblyColumnWidths,
  startAssemblyColumnResize,
  resizeAssemblyColumn,
  setAssemblyColumnResize,
  partIds,
  setPartIds,
  partMaterialIds,
  partFormulas,
  setPartFormulas,
  partFourPanelFormulas,
  setPartFourPanelFormulas,
  partConditions,
  setPartConditions,
  moveMaterialId,
  setMoveMaterialId,
  moveAssemblyPartAfter,
  photoMenuMaterialId,
  setPhotoMenuMaterialId,
  insertAfterMaterialId,
  setInsertAfterMaterialId,
  insertMaterialCode,
  setInsertMaterialCode,
  addAssemblyPartByCode,
  activeFormulaField,
  setActiveFormulaField,
  beginFormulaEdit,
  cancelFormulaEdit,
  setFormulaEditBackup,
  insertFormulaValue,
  activeConditionMaterialId,
  setActiveConditionMaterialId,
  conditionEditBackup,
  setConditionEditBackup,
  insertConditionToken,
  frameTypes,
  setFrameTypes,
  nameRules,
  setNameRules,
  realJoinPropertyMatches,
  fakeJoinPropertyMatches,
  updateJoinPropertyMatch,
  removeJoinPropertyMatch,
  addJoinPropertyMatch,
  activeDatabaseId,
  joinModifications,
  setJoinModifications,
  assemblyReferenceImage,
  setAssemblyReferenceImage,
  assemblyAutoSaveStatus,
  workspaceSaveStatus,
  onClose,
  onSave,
}: AssemblyModalProps) {
  if (!isOpen) return null;

  const currentAssembly = assemblies.find((assembly) => assembly.id === modalId);

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]"
      onMouseDown={onClose}
    >
      <section
        className="w-[min(1400px,calc(100vw-32px))] min-w-[min(760px,calc(100vw-32px))] max-w-[calc(100vw-32px)] max-h-[calc(100vh-28px)] resize-x overflow-auto rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]">
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              {modalId ? "Edit" : "New"} item
            </p>
            <h2 className="m-0 text-[#1a3539] text-[21px] font-bold">
              {modalId ? "Edit" : "Add"} assembly
            </h2>
          </div>
          <div className="flex items-center gap-[9px]">
            <div className="relative">
              <button
                type="button"
                className="min-h-[34px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
                onClick={() => setCopyFromAssemblyOpen((open) => !open)}
              >
                Copy from
              </button>
              {copyFromAssemblyOpen && (
                <div
                  className="absolute z-30 top-[calc(100%+6px)] right-0 grid min-w-[270px] max-h-[360px] overflow-auto p-[5px] border border-[#9ccbc6] rounded-[7px] bg-white shadow-[0_10px_24px_rgba(24,61,64,0.22)]"
                  role="menu"
                >
                  {assemblies
                    .filter((assembly) => assembly.id !== modalId)
                    .map((assembly) => (
                      <button
                        type="button"
                        className="grid gap-0.5 p-[8px_10px] border-0 rounded-[4px] bg-white text-[#214a4d] text-left text-xs font-bold hover:bg-[#e6f4f1] cursor-pointer transition-colors"
                        key={assembly.id}
                        onClick={() => copyAssemblyContentFrom(assembly.id)}
                      >
                        {assembly.name}
                        <small className="text-[#71878a] font-mono text-[10px] font-semibold">{assembly.code}</small>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button
              className="w-[38px] h-[38px] grid place-items-center rounded-[7px] border-0 bg-transparent text-[#577176] hover:bg-[#edf4f4] transition-colors cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <form onSubmit={onSave}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
              <span>
                Name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter assembly name"
              />
            </label>
            <div className="grid grid-cols-2 max-[620px]:grid-cols-1 gap-2.5">
              <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                Code
                <input
                  className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Optional code"
                />
              </label>
              <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                Category
                <input
                  className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Window"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 max-[620px]:grid-cols-1 gap-2.5">
              <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                Manufacturer / system
                <input
                  className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  placeholder="e.g. Technal"
                />
              </label>
              <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                Drawing colour
                <span className="flex items-center gap-2 flex-wrap min-h-[39px] px-2 border border-[#c8dada] rounded-md bg-white">
                  {assemblyColourOptions.map((colour) => (
                    <button
                      type="button"
                      key={colour}
                      className={`w-6 h-6 p-0 rounded border-2 border-transparent cursor-pointer ${
                        assemblyColor.toUpperCase() === colour ? "ring-2 ring-[#164e52] ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: colour }}
                      onClick={() => setAssemblyColor(colour)}
                      aria-label={`Use ${colour} drawing colour`}
                      aria-pressed={assemblyColor.toUpperCase() === colour}
                    />
                  ))}
                  <code className="ml-auto text-xs text-[#35595d]">{assemblyColor.toUpperCase()}</code>
                </span>
              </label>
            </div>

            <fieldset className="mt-1 p-3.5 border border-[#d9e4e5] rounded-lg bg-[#f7fbfb]">
              <legend className="px-1.5 text-[#4c696d] text-xs font-bold">Values</legend>
              <p className="mt-1 mb-2.5 text-[#71868a] text-xs">
                These values are supplied automatically by each window on the canvas and can be
                used directly in material formulas. Editable defaults are applied to newly placed
                openings; calculated values remain read-only.
              </p>
              <div className="grid grid-cols-2 max-[620px]:grid-cols-1 gap-2">
                {assemblyFormulaValuesForEditor.map((value) => {
                  const setDefault = (change: Partial<AssemblyCanvasDefaults>) =>
                    setAssemblyCanvasDefaults((current) => ({ ...current, ...change }));
                  const defaultSetting =
                    value.name === "Width" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <input
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          type="number"
                          min="200"
                          max={MAX_OPENING_DIMENSION}
                          value={assemblyCanvasDefaults.width ?? 1500}
                          onChange={(event) =>
                            setDefault({
                              width: Math.min(
                                MAX_OPENING_DIMENSION,
                                Math.max(200, Number(event.target.value) || 200),
                              ),
                            })
                          }
                        />
                        <span>mm</span>
                      </label>
                    ) : value.name === "Height" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <input
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          type="number"
                          min="200"
                          max={MAX_OPENING_DIMENSION}
                          value={assemblyCanvasDefaults.height ?? 1200}
                          onChange={(event) =>
                            setDefault({
                              height: Math.min(
                                MAX_OPENING_DIMENSION,
                                Math.max(200, Number(event.target.value) || 200),
                              ),
                            })
                          }
                        />
                        <span>mm</span>
                      </label>
                    ) : value.name === "NumberOfLeaves" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.leaves ?? 2}
                          onChange={(event) =>
                            setDefault({
                              leaves: Number(event.target.value) as 1 | 2 | 3 | 4,
                            })
                          }
                        >
                          <option value={1}>1 leaf</option>
                          <option value={2}>2 leaves</option>
                          <option value={3}>3 leaves</option>
                          <option value={4}>4 leaves</option>
                        </select>
                      </label>
                    ) : value.name === "OpeningType" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.openingType ?? "window"}
                          onChange={(event) =>
                            setDefault({
                              openingType: event.target.value as "window" | "door",
                            })
                          }
                        >
                          <option value="window">Window</option>
                          <option value="door">Door</option>
                        </select>
                      </label>
                    ) : value.name === "LeafSize" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.leafSize ?? "small"}
                          onChange={(event) =>
                            setDefault({
                              leafSize: event.target.value as "small" | "big",
                            })
                          }
                        >
                          <option value="small">Small</option>
                          <option value="big">Big</option>
                        </select>
                      </label>
                    ) : value.name === "FrameSize" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.frameSize ?? "small"}
                          onChange={(event) =>
                            setDefault({
                              frameSize: event.target.value as "small" | "big",
                            })
                          }
                        >
                          <option value="small">Small</option>
                          <option value="big">Big</option>
                        </select>
                      </label>
                    ) : value.name === "ArchitraveAllowance" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.hasArchitraveAllowance ? "with" : "without"}
                          onChange={(event) =>
                            setDefault({ hasArchitraveAllowance: event.target.value === "with" })
                          }
                        >
                          <option value="without">Without</option>
                          <option value="with">With</option>
                        </select>
                      </label>
                    ) : value.name === "Architrave" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.hasArchitrave ? "with" : "without"}
                          onChange={(event) =>
                            setDefault({ hasArchitrave: event.target.value === "with" })
                          }
                        >
                          <option value="without">Without</option>
                          <option value="with">With</option>
                        </select>
                      </label>
                    ) : value.name === "Reinforcement" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.reinforced ? "with" : "without"}
                          onChange={(event) =>
                            setDefault({ reinforced: event.target.value === "with" })
                          }
                        >
                          <option value="without">Not reinforced</option>
                          <option value="with">Reinforced</option>
                        </select>
                      </label>
                    ) : value.name === "Coating" ? (
                      <label className="flex items-center gap-1.5 mt-1 text-[#527072] text-[10px] font-bold">
                        Default setting
                        <select
                          className="min-w-0 flex-1 px-1.5 py-1 h-7 border border-[#bdd8d6] rounded bg-white text-[#174e51] text-[11px] outline-none focus:border-[#27827d]"
                          value={assemblyCanvasDefaults.hasCoating ? "with" : "without"}
                          onChange={(event) =>
                            setDefault({ hasCoating: event.target.value === "with" })
                          }
                        >
                          <option value="without">Without</option>
                          <option value="with">With</option>
                        </select>
                      </label>
                    ) : (
                      <span className="mt-1 px-1.5 py-1 rounded bg-[#edf2f2] text-[#6d7f80] text-[10px] font-bold">Calculated / read-only</span>
                    );
                  return (
                    <div className="grid gap-1 p-2.5 border border-[#d6e7e6] rounded-md bg-white" key={value.name}>
                      <b className="text-[#28575b] text-xs">{value.label}</b>
                      <code className="w-max max-w-full px-1.5 py-0.5 rounded bg-[#e6f3f1] text-[#176c68] font-mono text-[10px] truncate">{value.name}</code>
                      <small className="text-[10px] leading-tight text-[#71878a]">{value.description}</small>
                      {defaultSetting}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend>Materials used</legend>
              <p>
                Click a material photo, then choose <b>Insert</b>. You can insert the same material
                more than once; each row has its own formulas and IF condition. Use a reference such
                as <b>GYn2</b>, <b>A-24</b>, or <b>G1</b> only to select the material; once
                inserted, the assembly keeps its stable material link even if its database
                reference or location changes.
              </p>
              <div
                className="assembly-material-table"
                role="table"
                aria-label="Assembly materials"
                style={
                  {
                    "--assembly-material-columns": assemblyColumnWidths
                      .map((width) => `${width}px`)
                      .join(" "),
                  } as CSSProperties
                }
                onPointerMove={resizeAssemblyColumn}
                onPointerUp={() => setAssemblyColumnResize(null)}
                onPointerCancel={() => setAssemblyColumnResize(null)}
                onKeyDownCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (
                    event.key === "Enter" &&
                    target.matches(".formula-value-editor input, .condition-formula-editor input")
                  ) {
                    event.preventDefault();
                    target.blur();
                  }
                }}
              >
                <div className="assembly-material-table-header" role="row">
                  {[
                    "Assembly code",
                    "Photo",
                    "Material code",
                    "Formula if true",
                    "Formula if false",
                    "IF condition",
                  ].map((title, index) => (
                    <span key={title}>
                      {title}
                      {index < 5 && (
                        <button
                          type="button"
                          className="assembly-column-resize"
                          onPointerDown={(event) => startAssemblyColumnResize(event, index)}
                          aria-label={`Resize ${title} column`}
                          title="Drag to resize column"
                        />
                      )}
                    </span>
                  ))}
                </div>
                {partIds.map((partId) => {
                  const material = materials.find((item) => item.id === partMaterialIds[partId]);
                  if (!material) return null;
                  return (
                    <div key={partId} style={{ display: "contents" }}>
                      <div
                        className={`assembly-material-row selected ${
                          moveMaterialId && moveMaterialId !== partId ? "move-target" : ""
                        }`}
                        role="row"
                      >
                        <div className="assembly-label-field">
                          <output
                            className="assembly-part-reference"
                            aria-label={`Current database reference for ${material.name}`}
                          >
                            {materialDatabaseReference(material)}
                          </output>
                          <button
                            type="button"
                            className="remove-assembly-material"
                            onClick={() => setPartIds((ids) => ids.filter((id) => id !== partId))}
                            aria-label={`Remove ${material.name}`}
                          >
                            ×
                          </button>
                        </div>
                        <div className="assembly-photo-cell">
                          <button
                            type="button"
                            className="assembly-photo-button"
                            onClick={() =>
                              moveMaterialId
                                ? moveAssemblyPartAfter(moveMaterialId, partId)
                                : setPhotoMenuMaterialId((current) =>
                                    current === `assembly-${partId}` ? null : `assembly-${partId}`,
                                  )
                            }
                            aria-label={`Actions for ${material.name}`}
                          >
                            <Sketch path={material.sketch} label={material.name} />
                          </button>
                          {photoMenuMaterialId === `assembly-${partId}` && (
                            <div className="assembly-photo-menu">
                              <button
                                type="button"
                                onClick={() => {
                                  setInsertAfterMaterialId(partId);
                                  setInsertMaterialCode("");
                                  setPhotoMenuMaterialId(null);
                                }}
                              >
                                Insert
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMoveMaterialId(partId);
                                  setPhotoMenuMaterialId(null);
                                }}
                              >
                                Move
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="assembly-material-code">
                          <b>{material.code}</b>
                          <small>{material.name}</small>
                        </div>
                        <div className="formula-value-editor">
                          <input
                            className="assembly-formula-input"
                            value={partFormulas[partId] ?? material.quantityFormula ?? "1"}
                            onChange={(event) =>
                              setPartFormulas((values) => ({
                                ...values,
                                [partId]: event.target.value,
                              }))
                            }
                            onFocus={() =>
                              beginFormulaEdit(partId, "true", material.quantityFormula ?? "1")
                            }
                            onBlur={() => {
                              setActiveFormulaField((active) =>
                                active?.materialId === partId && active.field === "true"
                                  ? null
                                  : active,
                              );
                              setFormulaEditBackup(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                              if (event.key === "Escape") {
                                cancelFormulaEdit(partId, "true");
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder="e.g. Height*2*NumberOfLeaves"
                            aria-label={`Formula if true for ${material.name}`}
                          />
                          {activeFormulaField?.materialId === partId &&
                            activeFormulaField.field === "true" && (
                              <div className="formula-values-helper" role="note">
                                <b>Values</b>
                                {assemblyFormulaValuesForEditor.map((val) => (
                                  <button
                                    type="button"
                                    key={val.name}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => insertFormulaValue(partId, "true", val.name)}
                                  >
                                    {val.name}
                                  </button>
                                ))}
                                <b>Round</b>
                                <button
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => insertFormulaValue(partId, "true", "ROUND+()")}
                                >
                                  ROUND+
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => insertFormulaValue(partId, "true", "ROUND-()")}
                                >
                                  ROUND−
                                </button>
                                <small>
                                  ROUND+ rounds up; ROUND− rounds down. Example:
                                  ROUND+(NumberOfLeaves/2)
                                </small>
                              </div>
                            )}
                        </div>
                        <div className="formula-value-editor">
                          <input
                            className="assembly-formula-input"
                            value={partFourPanelFormulas[partId] ?? "0"}
                            onChange={(event) =>
                              setPartFourPanelFormulas((values) => ({
                                ...values,
                                [partId]: event.target.value,
                              }))
                            }
                            onFocus={() => beginFormulaEdit(partId, "false", "0")}
                            onBlur={() => {
                              setActiveFormulaField((active) =>
                                active?.materialId === partId && active.field === "false"
                                  ? null
                                  : active,
                              );
                              setFormulaEditBackup(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                              if (event.key === "Escape") {
                                cancelFormulaEdit(partId, "false");
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder="0"
                            aria-label={`Formula if false for ${material.name}`}
                          />
                          {activeFormulaField?.materialId === partId &&
                            activeFormulaField.field === "false" && (
                              <div className="formula-values-helper" role="note">
                                <b>Values</b>
                                {assemblyFormulaValuesForEditor.map((val) => (
                                  <button
                                    type="button"
                                    key={val.name}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => insertFormulaValue(partId, "false", val.name)}
                                  >
                                    {val.name}
                                  </button>
                                ))}
                                <small>Click a value, then type operators and numbers.</small>
                              </div>
                            )}
                        </div>
                        <div className="condition-formula-editor">
                          <input
                            className="assembly-formula-input"
                            value={partConditions[partId] ?? ""}
                            onChange={(event) =>
                              setPartConditions((values) => ({
                                ...values,
                                [partId]: event.target.value,
                              }))
                            }
                            onFocus={() => {
                              setActiveConditionMaterialId(partId);
                              setConditionEditBackup({
                                materialId: partId,
                                value: partConditions[partId] ?? "",
                              });
                            }}
                            onBlur={() => {
                              setActiveConditionMaterialId((active) =>
                                active === partId ? null : active,
                              );
                              setConditionEditBackup(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                              if (event.key === "Escape") {
                                if (conditionEditBackup?.materialId === partId)
                                  setPartConditions((values) => ({
                                    ...values,
                                    [partId]: conditionEditBackup.value,
                                  }));
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder="e.g. Area > 8"
                            aria-label={`IF condition for ${material.name}`}
                          />
                          {activeConditionMaterialId === partId && (
                            <div className="condition-helper" role="note">
                              <div>
                                <b>Values</b>
                                {assemblyFormulaValuesForEditor.map((val) => (
                                  <button
                                    type="button"
                                    key={val.name}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => insertConditionToken(partId, val.name)}
                                  >
                                    {val.name}
                                  </button>
                                ))}
                              </div>
                              <div>
                                <b>Operators</b>
                                {[" = ", " > ", " < ", " >= ", " <= ", " AND ", " OR ", "(", ")"].map(
                                  (token) => (
                                    <button
                                      type="button"
                                      key={token}
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => insertConditionToken(partId, token)}
                                    >
                                      {token.trim() || "space"}
                                    </button>
                                  ),
                                )}
                              </div>
                              <small>
                                Click tokens to insert them. Example: (Reinforcement = 0) AND
                                (Architrave = 1)
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                      {insertAfterMaterialId === partId && (
                        <div className="assembly-material-insert-row">
                          <span>Add another material row</span>
                          <input
                            value={insertMaterialCode}
                            onChange={(event) => setInsertMaterialCode(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addAssemblyPartByCode(partId, insertMaterialCode, true);
                                setInsertAfterMaterialId(null);
                              }
                              if (event.key === "Escape") setInsertAfterMaterialId(null);
                            }}
                            placeholder="Enter material reference, e.g. A-24"
                            aria-label={`New material below ${material.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              addAssemblyPartByCode(partId, insertMaterialCode, true);
                              setInsertAfterMaterialId(null);
                            }}
                          >
                            Insert material
                          </button>
                          <button type="button" onClick={() => setInsertAfterMaterialId(null)}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend>Frame types</legend>
              <p>
                Set the frame type for this assembly. On the canvas, a Real join is allowed only
                when both openings resolve to the same frame type. Conditions can use values such
                as <b>FrameSize</b>, <b>Reinforcement</b>, <b>LeafSize</b>, and <b>Width</b>.
              </p>
              <div className="overflow-auto border border-[#c6dada] rounded-md" role="table" aria-label="Assembly frame types">
                <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_34px] gap-2 items-center px-2 py-1.5 bg-[#172126] text-[#eefafa] text-[10px] font-extrabold uppercase" role="row">
                  <span>Type</span>
                  <span>Condition</span>
                  <span aria-label="Actions" />
                </div>
                {frameTypes.map((row) => (
                  <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_34px] gap-2 items-center px-2 py-1.5 border-t border-[#d7e6e5] bg-[#f7fbfb]" role="row" key={row.id}>
                    <input
                      value={row.type}
                      onChange={(event) =>
                        setFrameTypes((rows) =>
                          rows.map((value) =>
                            value.id === row.id ? { ...value, type: event.target.value } : value,
                          ),
                        )
                      }
                      placeholder="e.g. Small reinforced"
                      aria-label="Frame type"
                      className="w-full h-[31px] min-w-0 px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none focus:border-[#56aeb8]"
                    />
                    <input
                      value={row.condition}
                      onChange={(event) =>
                        setFrameTypes((rows) =>
                          rows.map((value) =>
                            value.id === row.id
                              ? { ...value, condition: event.target.value }
                              : value,
                          ),
                        )
                      }
                      placeholder="e.g. (FrameSize = 0) AND (Reinforcement = 1)"
                      aria-label={`Condition for ${row.type || "frame type"}`}
                      className="w-full h-[31px] min-w-0 px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none focus:border-[#56aeb8]"
                    />
                    <button
                      type="button"
                      className="w-7 h-7 p-0 border-0 rounded bg-[#fdebed] text-[#b1313a] text-lg leading-none cursor-pointer flex items-center justify-center hover:bg-[#fbd3d6]"
                      onClick={() => setFrameTypes((rows) => rows.filter((value) => value.id !== row.id))}
                      aria-label={`Remove ${row.type || "frame type"}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 min-h-[31px] px-3 border border-[#76aaa5] rounded-md bg-[#e5f4f1] text-[#176c68] text-xs font-extrabold cursor-pointer hover:bg-[#d5eee9]"
                onClick={() =>
                  setFrameTypes((rows) => [...rows, { id: makeId(), type: "", condition: "" }])
                }
              >
                Add type
              </button>
            </fieldset>

            <fieldset>
              <legend>Names</legend>
              <p>
                Set the drawing name symbol and its condition. Enter only the symbol, for example{" "}
                <b>DR</b>. The canvas assigns the number automatically: DR01, DR02.
              </p>
              <div className="overflow-auto border border-[#c6dada] rounded-md" role="table" aria-label="Assembly naming rules">
                <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_34px] gap-2 items-center px-2 py-1.5 bg-[#172126] text-[#eefafa] text-[10px] font-extrabold uppercase" role="row">
                  <span>Name</span>
                  <span>Condition</span>
                  <span aria-label="Actions" />
                </div>
                {nameRules.map((row) => (
                  <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_34px] gap-2 items-center px-2 py-1.5 border-t border-[#d7e6e5] bg-[#f7fbfb]" role="row" key={row.id}>
                    <input
                      value={row.name}
                      onChange={(event) =>
                        setNameRules((rows) =>
                          rows.map((value) =>
                            value.id === row.id
                              ? { ...value, name: event.target.value.toUpperCase() }
                              : value,
                          ),
                        )
                      }
                      placeholder="e.g. DR"
                      aria-label="Name symbol"
                      className="w-full h-[31px] min-w-0 px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none focus:border-[#56aeb8]"
                    />
                    <input
                      value={row.condition}
                      onChange={(event) =>
                        setNameRules((rows) =>
                          rows.map((value) =>
                            value.id === row.id
                              ? { ...value, condition: event.target.value }
                              : value,
                          ),
                        )
                      }
                      placeholder="e.g. OpeningType = 1"
                      aria-label={`Condition for ${row.name || "name"}`}
                      className="w-full h-[31px] min-w-0 px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none focus:border-[#56aeb8]"
                    />
                    <button
                      type="button"
                      className="w-7 h-7 p-0 border-0 rounded bg-[#fdebed] text-[#b1313a] text-lg leading-none cursor-pointer flex items-center justify-center hover:bg-[#fbd3d6]"
                      onClick={() => setNameRules((rows) => rows.filter((value) => value.id !== row.id))}
                      aria-label={`Remove ${row.name || "name"}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 min-h-[31px] px-3 border border-[#76aaa5] rounded-md bg-[#e5f4f1] text-[#176c68] text-xs font-extrabold cursor-pointer hover:bg-[#d5eee9]"
                onClick={() =>
                  setNameRules((rows) => [...rows, { id: makeId(), name: "", condition: "" }])
                }
              >
                Add name
              </button>
            </fieldset>

            <fieldset>
              <legend>Property match on joins</legend>
              <p>
                Choose which canvas properties this assembly must copy from a joined assembly type.
                Each rule applies only to the selected join kind and selected assembly types.
              </p>
              {(["real", "fake"] as const).map((kind) => {
                const rows = kind === "real" ? realJoinPropertyMatches : fakeJoinPropertyMatches;
                const title =
                  kind === "real"
                    ? "Property match when Real join"
                    : "Property match when Fake join";
                const properties = joinMatchPropertiesForAssembly(
                  currentAssembly?.assemblyPage ?? activeDatabaseId,
                  currentAssembly?.id ?? modalId,
                );
                return (
                  <section className="mt-3.5" key={kind}>
                    <strong className="block mb-1.5 text-[#176c68] text-xs">{title}</strong>
                    <div className="overflow-auto border border-[#c6dada] rounded-md" role="table" aria-label={title}>
                      <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_92px] gap-2 items-center px-2 py-1.5 bg-[#172126] text-[#eefafa] text-[10px] font-extrabold uppercase" role="row">
                        <span>Type property</span>
                        <span>Assembly type</span>
                        <span aria-label="Actions" />
                      </div>
                      {rows.map((row) => (
                        <div className="grid grid-cols-[minmax(170px,0.8fr)_minmax(320px,1.7fr)_92px] gap-2 items-center px-2 py-1.5 border-t border-[#d7e6e5] bg-[#f7fbfb]" role="row" key={row.id}>
                          <select
                            value={row.property}
                            onChange={(event) =>
                              updateJoinPropertyMatch(kind, row.id, {
                                property: event.target.value,
                              })
                            }
                            aria-label="Property to match"
                            className="w-full h-[31px] min-w-0 px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none cursor-pointer focus:border-[#56aeb8]"
                          >
                            {properties.map((property) => (
                              <option key={property.value} value={property.value}>
                                {property.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-1.5 max-h-[98px] overflow-auto p-0.5">
                            {assemblies.map((assembly) => (
                              <label key={assembly.id} className="flex items-center gap-1 px-1.5 py-0.5 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={row.withAssemblyIds.includes(assembly.id)}
                                  className="w-auto m-0"
                                  onChange={(event) =>
                                    updateJoinPropertyMatch(kind, row.id, {
                                      withAssemblyIds: event.target.checked
                                        ? [...row.withAssemblyIds, assembly.id]
                                        : row.withAssemblyIds.filter((id) => id !== assembly.id),
                                    })
                                  }
                                />
                                {assembly.name}
                              </label>
                            ))}
                            {!assemblies.length && <small className="text-[#637b7d] text-[11px]">Save an assembly type first.</small>}
                          </div>
                          <button
                            type="button"
                            className="min-h-[28px] px-2 py-1 border border-[#df9ea5] rounded bg-[#fdebed] text-[#9f2833] text-[10px] font-extrabold leading-tight cursor-pointer hover:bg-[#fbd3d6]"
                            onClick={() => removeJoinPropertyMatch(kind, row.id)}
                            aria-label={`Delete ${row.property} match rule`}
                          >
                            Delete property
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 min-h-[31px] px-3 border border-[#76aaa5] rounded-md bg-[#e5f4f1] text-[#176c68] text-xs font-extrabold cursor-pointer hover:bg-[#d5eee9]"
                      onClick={() => addJoinPropertyMatch(kind, properties[0]?.value)}
                    >
                      Add property
                    </button>
                  </section>
                );
              })}
            </fieldset>

            {currentAssembly?.databaseId === TECHNAL_FYN_DATABASE &&
              !usesDirectJoinValues(currentAssembly) && (
                <fieldset>
                  <legend>Join modification table</legend>
                  <p>
                    These formulas are added to the normal material formula only when the opening
                    has a Real join on that side.
                  </p>
                  <div
                    className="overflow-auto border border-[#c6dada] rounded-md"
                    role="table"
                    aria-label="FYn join modification formulas"
                  >
                    <div className="grid grid-cols-[1.4fr_repeat(4,minmax(130px,1fr))] gap-2 items-center px-2 py-1.5 bg-[#172126] text-[#eefafa] text-[10px] font-extrabold uppercase" role="row">
                      <span>Material</span>
                      <span>Top join</span>
                      <span>Bottom join</span>
                      <span>Left join</span>
                      <span>Right join</span>
                    </div>
                    {(joinModifications.length
                      ? joinModifications
                      : defaultFynJoinModifications()
                    ).map((modification) => {
                      const material = materials.find(
                        (item) => item.id === modification.materialId,
                      );
                      return (
                        <div
                          className="grid grid-cols-[1.4fr_repeat(4,minmax(130px,1fr))] gap-2 items-center px-2 py-1.5 border-t border-[#d7e6e5] bg-[#f7fbfb]"
                          role="row"
                          key={modification.materialId}
                        >
                          <span className="grid gap-0.5 text-[11px]">
                            <b>{material?.code ?? modification.materialId}</b>
                            <small className="text-[#70878a] text-[10px]">{material?.name ?? "Material"}</small>
                          </span>
                          {(["topFormula", "bottomFormula", "leftFormula", "rightFormula"] as const).map(
                            (field) => (
                              <input
                                key={field}
                                className="h-[31px] px-2 py-1 border border-[#c7d9da] rounded bg-white text-[#244a4e] text-[11px] outline-none focus:border-[#56aeb8]"
                                value={modification[field]}
                                onChange={(event) =>
                                  setJoinModifications((rows) =>
                                    (rows.length ? rows : defaultFynJoinModifications()).map((r) =>
                                      r.materialId === modification.materialId
                                        ? { ...r, [field]: event.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                aria-label={`${field} for ${
                                  material?.code ?? modification.materialId
                                }`}
                              />
                            ),
                          )}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              )}

            <section className="grid gap-2.5 p-3.5 border border-[#c8dfdc] rounded-lg bg-[#f7fbfb]">
              <div className="grid gap-1">
                <strong>Reference photo</strong>
                <small className="text-[#71878a] text-[11px] leading-relaxed">
                  Upload a product photo to keep with this assembly. It is used as a visual
                  reference, not as a freehand drawing.
                </small>
              </div>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setAssemblyReferenceImage(String(reader.result ?? ""));
                  reader.readAsDataURL(file);
                }}
              />
              {assemblyReferenceImage && (
                <img
                  src={assemblyReferenceImage}
                  alt="Assembly reference"
                  className="w-full max-h-[190px] object-contain border border-[#cedede] rounded-md bg-white"
                />
              )}
              <div className="grid gap-1 pt-2.5 border-t border-[#dce9e8] text-[#30585b] text-xs">
                <strong>Technical drawing</strong>
                <small className="text-[#71878a] text-[11px] leading-relaxed">
                  This is defined by the assembly type. Send a reference drawing when you need it
                  changed.
                </small>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]">
            {modalId ? (
              <>
                <span
                  className={`mr-auto text-[12px] font-extrabold ${
                    assemblyAutoSaveStatus === "saving" ? "text-[#9a711d]" : "text-[#28736d]"
                  }`}
                >
                  {assemblyAutoSaveStatus === "saving"
                    ? "Saving changes…"
                    : workspaceSaveStatus === "error"
                    ? "Save failed"
                    : "Saved"}
                </span>
                <button
                  type="button"
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
                  onClick={onClose}
                >
                  Exit
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
                  type="submit"
                >
                  Create assembly
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
