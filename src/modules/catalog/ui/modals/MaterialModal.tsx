import type { ClipboardEvent, FormEvent, PointerEvent } from "react";
import { Icon } from "../../../../design-system/Icon";
import type { Material } from "../../../../domain/types";

export type MaterialModalProps = {
  isOpen: boolean;
  isEdit: boolean;
  isGlass: boolean;
  materialScopeTitle: string;
  materialScopeManufacturer: string;
  materialScopeId: string;
  materialPriceTable?: Material["priceTable"];
  setMaterialPriceTable: (table: Material["priceTable"]) => void;
  formName: string;
  setFormName: (value: string) => void;
  formCode: string;
  setFormCode: (value: string) => void;
  materialCodeError: string;
  setMaterialCodeError: (value: string) => void;
  formCategory: string;
  setFormCategory: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  cost: string;
  setCost: (value: string) => void;
  glassDescription: string;
  setGlassDescription: (value: string) => void;
  glassThickness: string;
  setGlassThickness: (value: string) => void;
  options: string;
  setOptions: (value: string) => void;
  materialSketch: string;
  setMaterialSketch: (value: string) => void;
  materialPenPoints: string[];
  materialDrawStart: (event: PointerEvent<SVGSVGElement>) => void;
  materialDrawMove: (event: PointerEvent<SVGSVGElement>) => void;
  materialDrawEnd: () => void;
  pasteMaterialPhoto: (event: ClipboardEvent<HTMLElement>) => void;
  setMaterialPhoto: (file: File) => void;
  onClose: () => void;
  onSave: (event: FormEvent) => void;
};

export function MaterialModal({
  isOpen,
  isEdit,
  isGlass,
  materialScopeTitle,
  materialScopeManufacturer,
  materialScopeId,
  materialPriceTable,
  setMaterialPriceTable,
  formName,
  setFormName,
  formCode,
  setFormCode,
  materialCodeError,
  setMaterialCodeError,
  formCategory,
  setFormCategory,
  unit,
  setUnit,
  cost,
  setCost,
  glassDescription,
  setGlassDescription,
  glassThickness,
  setGlassThickness,
  options,
  setOptions,
  materialSketch,
  setMaterialSketch,
  materialPenPoints,
  materialDrawStart,
  materialDrawMove,
  materialDrawEnd,
  pasteMaterialPhoto,
  setMaterialPhoto,
  onClose,
  onSave,
}: MaterialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{isEdit ? "Edit" : "New"} item</p>
            <h2>{isEdit ? "Edit" : "Add"} material</h2>
          </div>
          <div className="dialog-header-actions">
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <form onSubmit={onSave}>
          <div className="dialog-form">
            <label>
              {isGlass ? "Glass name / reference" : "Name"} <span>*</span>
              <input
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={isGlass ? "e.g. Double clear glass" : "Enter material name"}
              />
            </label>

            {isGlass ? (
              <section className="glass-form-fields">
                <label>
                  Description
                  <input
                    value={glassDescription}
                    onChange={(e) => setGlassDescription(e.target.value)}
                    placeholder="e.g. Double clear glass"
                  />
                  <small>Short display name for this glass build-up.</small>
                </label>
                <label>
                  Thickness
                  <input
                    required
                    value={glassThickness}
                    onChange={(e) => setGlassThickness(e.target.value)}
                    placeholder="e.g. 24 mm"
                  />
                </label>
                <label>
                  Composition
                  <textarea
                    required
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder={"e.g. 6 mm tempered clear\n12 mm air space\n6 mm tempered clear"}
                    rows={5}
                  />
                  <small>Enter one layer per line.</small>
                </label>
                <section
                  className="material-photo-field"
                  tabIndex={0}
                  onPaste={pasteMaterialPhoto}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.focus();
                  }}
                >
                  <label>
                    Photo <small>(optional)</small>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setMaterialPhoto(file);
                      }}
                    />
                    <small>Choose an image file.</small>
                  </label>
                  <button type="button" className="paste-photo-button">
                    Paste photo (then Ctrl+V)
                  </button>
                  <small className="paste-photo-help">
                    Copy an image, click this button, then press Ctrl+V.
                  </small>
                  {materialSketch.startsWith("data:image/") && (
                    <img className="glass-photo-preview" src={materialSketch} alt="Glass preview" />
                  )}
                </section>
                <label>
                  Price / sqm
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                  />
                </label>
              </section>
            ) : (
              <>
                <div className="two-fields">
                  <label>
                    Code <span>*</span>
                    <input
                      required
                      value={formCode}
                      onChange={(e) => {
                        setFormCode(e.target.value);
                        setMaterialCodeError("");
                      }}
                      placeholder="Required unique code, e.g. GY3808 or A-55"
                      aria-invalid={Boolean(materialCodeError)}
                      aria-describedby={materialCodeError ? "material-code-error" : undefined}
                    />
                    <small>
                      Required. This code must be unique across the whole shared database, including
                      every company tab.
                    </small>
                    {materialCodeError && (
                      <small id="material-code-error" className="field-error" role="alert">
                        {materialCodeError}
                      </small>
                    )}
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

                <p className="database-scope">
                  This material belongs to <b>{materialScopeTitle}</b> ({materialScopeManufacturer}
                  ).
                </p>
                {materialScopeId === "markups" && (
                  <label>
                    General price table
                    <select
                      value={materialPriceTable ?? "general"}
                      onChange={(event) =>
                        setMaterialPriceTable(event.target.value as Material["priceTable"])
                      }
                    >
                      <option value="general">Others</option>
                      <option value="profiles">General ALU profiles</option>
                      <option value="accessories">General ALU accessories</option>
                    </select>
                  </label>
                )}
                <label>
                  Unit
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="m, m², kg, piece"
                  />
                </label>
                <section className="material-edit-summary">
                  <strong>Used in calculations</strong>
                  <span>
                    Unit is used for display. Quantities come from the canvas and assemblies.
                    Central price, wastage, and shipping are managed in Material price and affect
                    project totals.
                  </span>
                  <small>
                    Category, supplier reference, weight, selectable options, and requested
                    properties are reference data only; existing values are kept.
                  </small>
                </section>
                <section
                  className="material-photo-field"
                  tabIndex={0}
                  onPaste={pasteMaterialPhoto}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.focus();
                  }}
                >
                  <label>
                    Photo <small>(optional)</small>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setMaterialPhoto(file);
                      }}
                    />
                    <small>Choose an image file.</small>
                  </label>
                  <button type="button" className="paste-photo-button">
                    Paste photo (then Ctrl+V)
                  </button>
                  <small className="paste-photo-help">
                    Copy an image, click this button, then press Ctrl+V.
                  </small>
                  {materialSketch.startsWith("data:image/") ? (
                    <img
                      className="material-upload-preview"
                      src={materialSketch}
                      alt={`${formName || "Material"} photo`}
                    />
                  ) : (
                    <span className="material-photo-empty">No photo</span>
                  )}
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
                    Use the pen to draw the material shape. This drawing becomes its thumbnail.
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
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Save material
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
