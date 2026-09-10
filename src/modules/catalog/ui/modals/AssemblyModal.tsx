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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog assembly-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{modalId ? "Edit" : "New"} item</p>
            <h2>{modalId ? "Edit" : "Add"} assembly</h2>
          </div>
          <div className="dialog-header-actions">
            <div className="copy-from-menu">
              <button
                type="button"
                className="secondary-button copy-from-button"
                onClick={() => setCopyFromAssemblyOpen((open) => !open)}
              >
                Copy from
              </button>
              {copyFromAssemblyOpen && (
                <div className="copy-from-options" role="menu">
                  {assemblies
                    .filter((assembly) => assembly.id !== modalId)
                    .map((assembly) => (
                      <button
                        type="button"
                        key={assembly.id}
                        onClick={() => copyAssemblyContentFrom(assembly.id)}
                      >
                        {assembly.name}
                        <small>{assembly.code}</small>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <form onSubmit={onSave}>
          <div className="dialog-form">
            <label>
              Name <span>*</span>
              <input
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter assembly name"
              />
            </label>
            <div className="two-fields">
              <label>
                Code
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Optional code"
                />
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
            <div className="two-fields">
              <label>
                Manufacturer / system
                <input
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  placeholder="e.g. Technal"
                />
              </label>
              <label className="assembly-colour-field">
                Drawing colour
                <span className="assembly-colour-picker">
                  {assemblyColourOptions.map((colour) => (
                    <button
                      type="button"
                      key={colour}
                      className={assemblyColor.toUpperCase() === colour ? "selected" : ""}
                      style={{ backgroundColor: colour }}
                      onClick={() => setAssemblyColor(colour)}
                      aria-label={`Use ${colour} drawing colour`}
                      aria-pressed={assemblyColor.toUpperCase() === colour}
                    />
                  ))}
                  <code>{assemblyColor.toUpperCase()}</code>
                </span>
              </label>
            </div>

            <fieldset className="assembly-values-section">
              <legend>Values</legend>
              <p>
                These values are supplied automatically by each window on the canvas and can be
                used directly in material formulas. Editable defaults are applied to newly placed
                openings; calculated values remain read-only.
              </p>
              <div className="assembly-values-grid">
                {assemblyFormulaValuesForEditor.map((value) => {
                  const setDefault = (change: Partial<AssemblyCanvasDefaults>) =>
                    setAssemblyCanvasDefaults((current) => ({ ...current, ...change }));
                  const defaultSetting =
                    value.name === "Width" ? (
                      <label>
                        Default setting
                        <input
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
                      <label>
                        Default setting
                        <input
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <label>
                        Default setting
                        <select
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
                      <span className="calculated-default">Calculated / read-only</span>
                    );
                  return (
                    <div key={value.name}>
                      <b>{value.label}</b>
                      <code>{value.name}</code>
                      <small>{value.description}</small>
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
              <div className="frame-type-table" role="table" aria-label="Assembly frame types">
                <div className="frame-type-header" role="row">
                  <span>Type</span>
                  <span>Condition</span>
                  <span aria-label="Actions" />
                </div>
                {frameTypes.map((row) => (
                  <div className="frame-type-row" role="row" key={row.id}>
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
                    />
                    <button
                      type="button"
                      className="remove-frame-type"
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
                className="add-frame-type"
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
              <div className="frame-type-table" role="table" aria-label="Assembly naming rules">
                <div className="frame-type-header" role="row">
                  <span>Name</span>
                  <span>Condition</span>
                  <span aria-label="Actions" />
                </div>
                {nameRules.map((row) => (
                  <div className="frame-type-row" role="row" key={row.id}>
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
                    />
                    <button
                      type="button"
                      className="remove-frame-type"
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
                className="add-frame-type"
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
                  <section className="join-property-match-section" key={kind}>
                    <strong>{title}</strong>
                    <div className="join-property-match-table" role="table" aria-label={title}>
                      <div className="join-property-match-header" role="row">
                        <span>Type property</span>
                        <span>Assembly type</span>
                        <span aria-label="Actions" />
                      </div>
                      {rows.map((row) => (
                        <div className="join-property-match-row" role="row" key={row.id}>
                          <select
                            value={row.property}
                            onChange={(event) =>
                              updateJoinPropertyMatch(kind, row.id, {
                                property: event.target.value,
                              })
                            }
                            aria-label="Property to match"
                          >
                            {properties.map((property) => (
                              <option key={property.value} value={property.value}>
                                {property.label}
                              </option>
                            ))}
                          </select>
                          <div className="join-match-assemblies">
                            {assemblies.map((assembly) => (
                              <label key={assembly.id}>
                                <input
                                  type="checkbox"
                                  checked={row.withAssemblyIds.includes(assembly.id)}
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
                            {!assemblies.length && <small>Save an assembly type first.</small>}
                          </div>
                          <button
                            type="button"
                            className="delete-join-property"
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
                      className="add-frame-type"
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
                    className="join-modification-table"
                    role="table"
                    aria-label="FYn join modification formulas"
                  >
                    <div className="join-modification-header" role="row">
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
                          className="join-modification-row"
                          role="row"
                          key={modification.materialId}
                        >
                          <span>
                            <b>{material?.code ?? modification.materialId}</b>
                            <small>{material?.name ?? "Material"}</small>
                          </span>
                          {(["topFormula", "bottomFormula", "leftFormula", "rightFormula"] as const).map(
                            (field) => (
                              <input
                                key={field}
                                className="assembly-formula-input"
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

            <section className="assembly-reference">
              <div>
                <strong>Reference photo</strong>
                <small>
                  Upload a product photo to keep with this assembly. It is used as a visual
                  reference, not as a freehand drawing.
                </small>
              </div>
              <input
                type="file"
                accept="image/*"
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
                  className="assembly-reference-preview"
                />
              )}
              <div className="assembly-drawing-note">
                <strong>Technical drawing</strong>
                <small>
                  This is defined by the assembly type. Send a reference drawing when you need it
                  changed.
                </small>
              </div>
            </section>
          </div>

          <div className="dialog-footer">
            {modalId ? (
              <>
                <span className={`assembly-autosave-status ${assemblyAutoSaveStatus}`}>
                  {assemblyAutoSaveStatus === "saving"
                    ? "Saving changes…"
                    : workspaceSaveStatus === "error"
                    ? "Save failed"
                    : "Saved"}
                </span>
                <button type="button" className="primary-button" onClick={onClose}>
                  Exit
                </button>
              </>
            ) : (
              <>
                <button type="button" className="secondary-button" onClick={onClose}>
                  Cancel
                </button>
                <button className="primary-button" type="submit">
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
