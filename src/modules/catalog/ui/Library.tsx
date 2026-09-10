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
      <section className="page-heading">
        <div>
          <p className="eyebrow">{type === "material" ? activeDatabase.eyebrow : "Product component library"}</p>
          <h1>{type === "material" ? activeDatabase.title : "Assemblies"}</h1>
          <p className="intro">
            {type === "material"
              ? activeDatabase.description
              : "Larger components built from one or more materials."}
          </p>
        </div>
        {!isPriceBook && (
          <button
            className="primary-button"
            onClick={() => {
              if (activeDatabaseId === "glass") setMaterialDatabaseOverride("glass");
              openModal(type);
            }}
          >
            <Icon name="plus" /> {activeDatabaseId === "glass" ? "Add glass" : `Add ${type}`}
          </button>
        )}
      </section>
      <section className="library-panel">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={17} />
            <span className="sr-only">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${type}s`}
            />
          </label>
          <span className="item-count">
            {filtered.length} {type}s
          </span>
          {type === "material" && <span className="table-zoom-readout">Table {tableZoom}% · Ctrl + scroll</span>}
          {type === "material" && !isPriceBook && (
            <div className="view-switch" role="group" aria-label="Material view">
              <button
                className={materialView === "list" ? "selected" : ""}
                onClick={() => setMaterialView("list")}
              >
                List
              </button>
              <button
                className={materialView === "cards" ? "selected" : ""}
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
          <div className="material-grid">
            {filtered.map((item) => (
              <article className="material-card" key={item.id}>
                <div className="card-art">
                  <Sketch path={item.sketch} label={item.name} />
                </div>
                <div className="card-content">
                  <div className="material-meta">
                    <span>{item.category}</span>
                    <span>{item.code}</span>
                    {item.manufacturer && <span>{item.manufacturer}</span>}
                  </div>
                  <h2>{item.name}</h2>
                  {type === "material" ? (
                    <div className="property-chips">
                      {(item as Material).properties.map((p) => (
                        <span key={p}>{p}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="parts-summary">{(item as unknown as Assembly).parts.length} material types</p>
                  )}
                  <div className="card-actions">
                    <button onClick={() => openModal(type, item.id)}>
                      <Icon name="edit" size={15} /> Edit
                    </button>
                    <button className="danger" onClick={() => remove(type, item.id)}>
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <button className="add-card" onClick={() => openModal(type)}>
              <span>
                <Icon name="plus" size={22} />
              </span>
              <strong>Add a {type}</strong>
              <small>
                {type === "material" ? "Create a reusable material" : "Combine materials into an assembly"}
              </small>
            </button>
          </div>
        )}
      </section>
    </>
  );
}
