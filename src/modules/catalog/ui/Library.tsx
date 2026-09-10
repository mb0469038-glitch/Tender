import { CSSProperties, Dispatch, SetStateAction, WheelEvent } from "react";
import { money } from "../../../domain/calculations";
import type { Assembly, Material } from "../../../domain/types";
import { Icon } from "../../../design-system/Icon";
import { Sketch } from "../../../design-system/Sketch";
import { PermissionGate } from "../../../shared/permissions/PermissionGate";
import { WORKSPACE_PERMISSIONS } from "../../workspace-legacy/domain/permissions";
import { inferGlassThickness } from "../domain/catalogDefinitions";

export type LibraryProps = {
  type: "material" | "assembly";
  activeDatabaseId: string;
  activeDatabase: { eyebrow: string; title: string; description: string };
  filtered: (Material | Assembly)[];
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  openModal: (type: "material" | "assembly", id?: string) => void;
  setMaterialDatabaseOverride: (id: string | null) => void;
  search: string;
  setSearch: (s: string) => void;
  tableZoom: number;
  tableStyle: CSSProperties;
  zoomTable: (e: WheelEvent<HTMLDivElement>) => void;
  materialView: "list" | "cards";
  setMaterialView: (v: "list" | "cards") => void;
  remove: (type: "material" | "assembly", id: string) => void;
};

export function Library({
  type,
  activeDatabaseId,
  activeDatabase,
  filtered,
  setMaterials,
  openModal,
  setMaterialDatabaseOverride,
  search,
  setSearch,
  tableZoom,
  tableStyle,
  zoomTable,
  materialView,
  setMaterialView,
  remove,
}: LibraryProps) {
  const isPriceBook = type === "material" && activeDatabaseId === "prices";

  return (
    <>
      <section className="flex items-end justify-between gap-6 p-[41px_48px_27px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:px-5 max-[700px]:pt-8">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
            {type === "material" ? activeDatabase.eyebrow : "Product component library"}
          </p>
          <h1 className="m-0 text-[#11262a] text-[36px] font-bold tracking-[-0.035em]">
            {type === "material" ? activeDatabase.title : "Assemblies"}
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-[15px] leading-relaxed">
            {type === "material"
              ? activeDatabase.description
              : "Larger components built from one or more materials."}
          </p>
        </div>
        {!isPriceBook && (
          <button
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
            onClick={() => {
              if (activeDatabaseId === "glass") setMaterialDatabaseOverride("glass");
              openModal(type);
            }}
          >
            <Icon name="plus" /> {activeDatabaseId === "glass" ? "Add glass" : `Add ${type}`}
          </button>
        )}
      </section>
      <section className="mx-12 mb-9 p-[18px] border border-[#dfe8e8] rounded-[13px] bg-white shadow-[0_8px_27px_#183f4110] max-[700px]:mx-5">
        <div className="flex items-center justify-between gap-4 pb-[18px] flex-wrap">
          <label className="w-[min(330px,100%)] h-10 flex items-center gap-2 px-3 border border-[#d5e0e1] rounded-[7px] text-[#698086] focus-within:border-[#27827d]">
            <Icon name="search" size={17} />
            <span className="sr-only">Search</span>
            <input
              className="w-full border-0 outline-none bg-transparent text-[#18363a] text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${type}s`}
            />
          </label>
          <span className="text-[#687d81] text-[13px]">
            {filtered.length} {type}s
          </span>
          {type === "material" && (
            <span className="ml-auto text-[#71898c] text-[10px] tabular-nums">
              Table {tableZoom}% · Ctrl + scroll
            </span>
          )}
          {type === "material" && !isPriceBook && (
            <div className="flex gap-1 p-[3px] border border-[#d4e1e2] rounded-[7px] bg-[#f4f8f8]" role="group" aria-label="Material view">
              <button
                className={
                  materialView === "list"
                    ? "min-h-[28px] px-2.5 border-0 rounded-[4px] bg-white text-[#176c68] shadow-[0_1px_3px_rgba(24,65,68,0.14)] text-[11px] font-extrabold cursor-pointer"
                    : "min-h-[28px] px-2.5 border-0 rounded-[4px] bg-transparent text-[#668084] text-[11px] font-extrabold cursor-pointer"
                }
                onClick={() => setMaterialView("list")}
              >
                List
              </button>
              <button
                className={
                  materialView === "cards"
                    ? "min-h-[28px] px-2.5 border-0 rounded-[4px] bg-white text-[#176c68] shadow-[0_1px_3px_rgba(24,65,68,0.14)] text-[11px] font-extrabold cursor-pointer"
                    : "min-h-[28px] px-2.5 border-0 rounded-[4px] bg-transparent text-[#668084] text-[11px] font-extrabold cursor-pointer"
                }
                onClick={() => setMaterialView("cards")}
              >
                Cards
              </button>
            </div>
          )}
        </div>
        {type === "material" && (materialView === "list" || isPriceBook) ? (
          <div
            className={`material-list table-zoomable ${activeDatabaseId === "glass" ? "glass-price-list" : ""}`}
            style={tableStyle}
            onWheel={zoomTable}
            role="table"
            aria-label={isPriceBook ? "Central price book" : "Materials"}
          >
            <div className="material-list-header" role="row">
              {isPriceBook ? (
                <>
                  <span>Material</span>
                  <span>Code</span>
                  <span>Component database</span>
                  <span>Unit</span>
                  <span>Rate / unit</span>
                  <span />
                </>
              ) : activeDatabaseId === "glass" ? (
                <>
                  <span>Glass and composition</span>
                  <span>Thickness</span>
                  <span>Unit</span>
                  <span>Rate / sqm</span>
                  <span>Actions</span>
                </>
              ) : (
                <>
                  <span>Material</span>
                  <span>Code</span>
                  <span>Category</span>
                  <span>Unit</span>
                  <span>Quantity formula</span>
                  <span>Actions</span>
                </>
              )}
            </div>
            {filtered.map((item) => {
              const material = item as Material;
              return (
                <div className="material-list-row" role="row" key={material.id}>
                  <span className="material-list-name">
                    <Sketch path={material.sketch} label={material.name} />
                    <b>{material.name}</b>
                    {activeDatabaseId === "glass" && (
                      <>
                        {material.description && <small className="glass-description">{material.description}</small>}
                        {material.options?.[0] && (
                          <small className="glass-composition" title={material.options[0]}>
                            {material.options[0]}
                          </small>
                        )}
                      </>
                    )}
                    {activeDatabaseId !== "glass" && material.manufacturer && <small>{material.manufacturer}</small>}
                  </span>
                  {!isPriceBook && activeDatabaseId === "glass" && (
                    <span className="glass-thickness">{inferGlassThickness(material) || "—"}</span>
                  )}
                  {isPriceBook ? (
                    <>
                      <span>{material.code}</span>
                      <span>{material.category}</span>
                      <span>{material.unit}</span>
                      <span>
                        <input
                          className="price-book-input"
                          aria-label={`Price for ${material.name}`}
                          type="number"
                          min="0"
                          step="any"
                          defaultValue={material.cost}
                          onBlur={(event) =>
                            setMaterials((items) =>
                              items.map((value) =>
                                value.id === material.id
                                  ? { ...value, cost: Math.max(0, Number(event.target.value) || 0) }
                                  : value
                              )
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                          }}
                        />{" "}
                        $
                      </span>
                      <span />
                    </>
                  ) : (
                    <>
                      <span>{material.code}</span>
                      <span>{material.category}</span>
                      <span>{material.unit}</span>
                      <span className="formula-cell">
                        {activeDatabaseId === "glass"
                          ? `${money(material.cost)} / m²`
                          : material.quantityFormula || "No formula"}
                      </span>
                      <span className="material-list-actions">
                        <button onClick={() => openModal("material", material.id)} aria-label={`Edit ${material.name}`}>
                          <Icon name="edit" size={15} />
                        </button>
                        <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_MATERIAL}>
                          <button
                            className="danger"
                            onClick={() => remove("material", material.id)}
                            aria-label={`Delete ${material.name}`}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </PermissionGate>
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(225px,1fr))] gap-4">
            {filtered.map((item) => (
              <article
                className="min-h-[270px] overflow-hidden border border-[#dfe7e8] rounded-[10px] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8dbdb8] hover:shadow-[0_9px_20px_rgba(23,66,68,0.1)]"
                key={item.id}
              >
                <div className="h-[125px]">
                  <Sketch path={item.sketch} label={item.name} />
                </div>
                <div className="p-[15px]">
                  <div className="flex justify-between gap-2 text-[#6d8488] text-[10px] font-extrabold uppercase tracking-[0.05em]">
                    <span>{item.category}</span>
                    <span>{item.code}</span>
                    {item.manufacturer && <span>{item.manufacturer}</span>}
                  </div>
                  <h2 className="my-2 text-[#1d373b] text-[15px] font-bold leading-snug">{item.name}</h2>
                  {type === "material" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(item as Material).properties.map((p) => (
                        <span key={p} className="px-1.5 py-1 rounded-[5px] bg-[#eff5f5] text-[#41676a] text-[11px] font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-[#63797d] text-xs">{(item as unknown as Assembly).parts.length} material types</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      className="inline-flex items-center gap-1 border-0 bg-transparent text-[#28666a] text-xs font-bold p-0 cursor-pointer hover:underline"
                      onClick={() => openModal(type, item.id)}
                    >
                      <Icon name="edit" size={15} /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 border-0 bg-transparent text-[#a33737] text-xs font-bold p-0 cursor-pointer hover:underline"
                      onClick={() => remove(type, item.id)}
                    >
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <button
              className="min-h-[270px] flex flex-col items-center justify-center p-6 border border-dashed border-[#dfe7e8] rounded-[10px] bg-[#fbfdfd] text-center text-[#426a6d] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8dbdb8] hover:shadow-[0_9px_20px_rgba(23,66,68,0.1)] cursor-pointer"
              onClick={() => openModal(type)}
            >
              <span className="grid place-items-center w-[42px] h-[42px] mb-3 rounded-full bg-[#dff0ed] text-[#176d69]">
                <Icon name="plus" size={22} />
              </span>
              <strong className="text-[#2a4d51] text-sm font-bold">Add a {type}</strong>
              <small className="mt-1 text-[#788d91] text-xs">
                {type === "material" ? "Create a reusable material" : "Combine materials into an assembly"}
              </small>
            </button>
          </div>
        )}
      </section>
    </>
  );
}
