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
    <div
      className="fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]"
      onMouseDown={onClose}
    >
      <section
        className="w-[min(560px,100%)] rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]">
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              {isEdit ? "Edit" : "New"} item
            </p>
            <h2 className="m-0 text-[#1a3539] text-[21px] font-bold">
              {isEdit ? "Edit" : "Add"} material
            </h2>
          </div>
          <div className="flex items-center gap-[9px]">
            <button
              className="grid place-items-center w-8 h-8 p-0 border border-[#cbd9db] rounded-md bg-transparent text-[#4c696d] hover:bg-[#edf4f4] cursor-pointer"
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
                {isGlass ? "Glass name / reference" : "Name"} <span className="text-[#b73030]">*</span>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={isGlass ? "e.g. Double clear glass" : "Enter material name"}
              />
            </label>

            {isGlass ? (
              <section className="grid gap-3 p-3.5 border border-[#bcdedb] rounded-lg bg-[#f4fbfa]">
                <label className="grid gap-1.5 text-[#315c5f] text-xs font-bold">
                  Description
                  <input
                    className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                    value={glassDescription}
                    onChange={(e) => setGlassDescription(e.target.value)}
                    placeholder="e.g. Double clear glass"
                  />
                  <small className="text-[#71878a] font-normal text-xs">Short display name for this glass build-up.</small>
                </label>
                <label className="grid gap-1.5 text-[#315c5f] text-xs font-bold">
                  Thickness
                  <input
                    className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                    required
                    value={glassThickness}
                    onChange={(e) => setGlassThickness(e.target.value)}
                    placeholder="e.g. 24 mm"
                  />
                </label>
                <label className="grid gap-1.5 text-[#315c5f] text-xs font-bold">
                  Composition
                  <textarea
                    className="w-full min-h-[88px] p-2 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d] resize-y"
                    required
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder={"e.g. 6 mm tempered clear\n12 mm air space\n6 mm tempered clear"}
                    rows={5}
                  />
                  <small className="text-[#71878a] font-normal text-xs">Enter one layer per line.</small>
                </label>
                <section
                  className="grid gap-3 p-3 border border-[#c8dfdc] rounded-lg bg-[#f7fbfb] outline-none focus:border-[#3a9d96] focus:ring-2 focus:ring-[#3ba996]/20"
                  tabIndex={0}
                  onPaste={pasteMaterialPhoto}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.focus();
                  }}
                >
                  <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold m-0">
                    <span>
                      Photo <small className="text-[#7a8f92] font-medium">(optional)</small>
                    </span>
                    <input
                      className="w-full text-[11px]"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setMaterialPhoto(file);
                      }}
                    />
                    <small className="text-[#7a8f92] font-medium">Choose an image file.</small>
                  </label>
                  <button
                    type="button"
                    className="self-start min-h-[32px] px-3 border border-[#76aaa5] rounded-md bg-[#e5f4f1] text-[#176c68] text-xs font-bold hover:border-[#247a74] hover:bg-[#d4eeea] cursor-pointer"
                  >
                    Paste photo (then Ctrl+V)
                  </button>
                  <small className="-mt-1.5 text-[#71878a] text-[11px]">
                    Copy an image, click this button, then press Ctrl+V.
                  </small>
                  {materialSketch.startsWith("data:image/") && (
                    <img className="max-w-[130px] max-h-[100px] object-contain border border-[#bfd9d6] rounded-md bg-white" src={materialSketch} alt="Glass preview" />
                  )}
                </section>
                <label className="grid gap-1.5 text-[#315c5f] text-xs font-bold">
                  Price / sqm
                  <input
                    className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
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
                <div className="grid grid-cols-2 max-[620px]:grid-cols-1 gap-2.5">
                  <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                    <span>
                      Code <span className="text-[#b73030]">*</span>
                    </span>
                    <input
                      className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
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
                    <small className="text-[#7a8f92] font-medium text-[11px]">
                      Required. This code must be unique across the whole shared database, including
                      every company tab.
                    </small>
                    {materialCodeError && (
                      <small id="material-code-error" className="text-[#a42f2f] font-bold" role="alert">
                        {materialCodeError}
                      </small>
                    )}
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

                <p className="m-0 p-2.5 px-3 rounded-lg bg-[#eaf5f3] text-[#356a68] text-xs leading-relaxed">
                  This material belongs to <b>{materialScopeTitle}</b> ({materialScopeManufacturer}
                  ).
                </p>
                {materialScopeId === "markups" && (
                  <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                    General price table
                    <select
                      className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
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
                <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold">
                  Unit
                  <input
                    className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] outline-none focus:border-[#27827d]"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="m, m², kg, piece"
                  />
                </label>
                <section className="grid gap-1 p-[11px_12px] border-l-[3px] border-l-[#3c9991] rounded-md bg-[#f1f9f8] text-[#37676a] text-[11px] leading-relaxed [&>strong]:text-[#176c68] [&>strong]:text-xs [&>small]:text-[#71878a] [&>small]:text-[10px]">
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
                  className="grid gap-3 p-3 border border-[#c8dfdc] rounded-lg bg-[#f7fbfb] outline-none focus:border-[#3a9d96] focus:ring-2 focus:ring-[#3ba996]/20"
                  tabIndex={0}
                  onPaste={pasteMaterialPhoto}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.focus();
                  }}
                >
                  <label className="grid gap-1.5 text-[#4c696d] text-xs font-bold m-0">
                    <span>
                      Photo <small className="text-[#7a8f92] font-medium">(optional)</small>
                    </span>
                    <input
                      className="w-full text-[11px]"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setMaterialPhoto(file);
                      }}
                    />
                    <small className="text-[#7a8f92] font-medium">Choose an image file.</small>
                  </label>
                  <button
                    type="button"
                    className="self-start min-h-[32px] px-3 border border-[#76aaa5] rounded-md bg-[#e5f4f1] text-[#176c68] text-xs font-bold hover:border-[#247a74] hover:bg-[#d4eeea] cursor-pointer"
                  >
                    Paste photo (then Ctrl+V)
                  </button>
                  <small className="-mt-1.5 text-[#71878a] text-[11px]">
                    Copy an image, click this button, then press Ctrl+V.
                  </small>
                  {materialSketch.startsWith("data:image/") ? (
                    <img
                      className="w-full min-h-[260px] max-h-[480px] object-contain border border-[#cedede] rounded-md bg-white"
                      src={materialSketch}
                      alt={`${formName || "Material"} photo`}
                    />
                  ) : (
                    <span className="w-full min-h-[260px] grid place-items-center border border-[#cedede] rounded-md bg-white text-[#71878a] text-[11px] text-center">No photo</span>
                  )}
                </section>
                <section className="hidden">
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
          <div className="flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]">
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
              Save material
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
