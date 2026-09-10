import { CSSProperties, Dispatch, PointerEvent as ReactPointerEvent, SetStateAction, WheelEvent } from "react";
import type { Material, ShippingType } from "../../../../domain/types";
import { number } from "../../../../domain/calculations";
import { Icon } from "../../../../design-system/Icon";
import { Sketch } from "../../../../design-system/Sketch";
import { TableMove } from "../../domain/catalogDefinitions";

export type PriceTableProps = {
  title: string;
  note: string;
  rows: Material[];
  section: string;
  databaseId: string;
  prefix: string;
  startAt?: number;
  collapseId?: string;
  companyTableId?: string;
  isStockView: boolean;
  collapsed: boolean;
  onToggleCollapse: (tableId: string) => void;
  weightRate: number;
  onSetTableWeightRate: (tableId: string, rate: number) => void;
  moveMaterialId: string | null;
  onMovePriceMaterialToTable: (movingId: string, databaseId: string, priceTable: Material["priceTable"], companyTableId?: string) => void;
  onMovePriceMaterialToSolealAccessories: (movingId: string) => void;
  onOpenMoveCompanyTable: (table: TableMove) => void;
  onOpenComponent: (databaseId: string, companyTableId?: string, priceTable?: Material["priceTable"], insertAfterMaterialId?: string) => void;
  priceDeleteMode: boolean;
  priceSelectionMode: boolean;
  selectedPriceMaterialIds: Set<string>;
  setSelectedPriceMaterialIds: Dispatch<SetStateAction<Set<string>>>;
  onTogglePriceMaterialSelection: (materialId: string, selected: boolean) => void;
  onBeginRowDragSelection: (event: ReactPointerEvent<HTMLDivElement>, materialId: string) => void;
  onExtendRowDragSelection: (materialId: string) => void;
  onStopDragSelection: () => void;
  assemblyUsage: (materialId: string) => string[];
  rateMethodMenu: { materialId: string; tableId: string } | null;
  setRateMethodMenu: Dispatch<SetStateAction<{ materialId: string; tableId: string } | null>>;
  onSetMaterialRateMethod: (material: Material, tableId: string, rateMethod: "manual" | "weight") => void;
  photoMenuMaterialId: string | null;
  setPhotoMenuMaterialId: Dispatch<SetStateAction<string | null>>;
  setMoveMaterialId: Dispatch<SetStateAction<string | null>>;
  onMovePriceMaterialAfter: (movingId: string, targetId: string) => void;
  onDeletePriceMaterial: (material: Material) => void;
  onOpenModal: (type: "material", id: string) => void;
  stockLengthMenu: { materialId: string; entryId: string } | null;
  setStockLengthMenu: Dispatch<SetStateAction<{ materialId: string; entryId: string } | null>>;
  stockEntriesFor: (material: Material) => { id: string; length: number; quantity: number }[];
  saveStockEntries: (materialId: string, entries: Material["stockEntries"]) => void;
  materials: Material[];
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  recordPriceChange: () => void;
  selectedTargets: (materialId: string) => Set<string>;
  shippingTypes: ShippingType[];
  shippingRateForType: (typeId?: string) => number;
  tableStyle: CSSProperties;
  zoomTable: (event: WheelEvent<HTMLDivElement>) => void;
  makeId: () => string;
  solealAccessoryMaterials: () => Material[];
  solealProfileMaterials: (databaseId: string) => Material[];
};

export function PriceTable({
  title,
  note,
  rows,
  section,
  databaseId,
  prefix,
  startAt = 1,
  collapseId,
  companyTableId,
  isStockView,
  collapsed,
  onToggleCollapse,
  weightRate,
  onSetTableWeightRate,
  moveMaterialId,
  onMovePriceMaterialToTable,
  onMovePriceMaterialToSolealAccessories,
  onOpenMoveCompanyTable,
  onOpenComponent,
  priceDeleteMode,
  priceSelectionMode,
  selectedPriceMaterialIds,
  setSelectedPriceMaterialIds,
  onTogglePriceMaterialSelection,
  onBeginRowDragSelection,
  onExtendRowDragSelection,
  onStopDragSelection,
  assemblyUsage,
  rateMethodMenu,
  setRateMethodMenu,
  onSetMaterialRateMethod,
  photoMenuMaterialId,
  setPhotoMenuMaterialId,
  setMoveMaterialId,
  onMovePriceMaterialAfter,
  onDeletePriceMaterial,
  onOpenModal,
  stockLengthMenu,
  setStockLengthMenu,
  stockEntriesFor,
  saveStockEntries,
  materials,
  setMaterials,
  recordPriceChange,
  selectedTargets,
  shippingTypes,
  shippingRateForType,
  tableStyle,
  zoomTable,
  makeId,
  solealAccessoryMaterials,
  solealProfileMaterials,
}: PriceTableProps) {
  const tableId = collapseId ?? databaseId;
  const insertedMaterialPriceTable: Material["priceTable"] =
    title === "Others" ? "general" : title.includes("profiles") ? "profiles" : "accessories";
  const isSolealAccessoriesTable = databaseId === "soleal-accessories";

  const movableRows = companyTableId
    ? materials.filter((material) => material.companyTableId === companyTableId)
    : isSolealAccessoriesTable
      ? solealAccessoryMaterials()
      : ["technal-gyn", "technal-gy", "technal-fyn", "technal-fy"].includes(databaseId) &&
          insertedMaterialPriceTable === "profiles"
        ? solealProfileMaterials(databaseId)
        : materials.filter(
            (material) =>
              material.databaseId === databaseId &&
              (databaseId !== "markups" ||
                (insertedMaterialPriceTable === "general"
                  ? !material.priceTable || material.priceTable === "general"
                  : material.priceTable === insertedMaterialPriceTable))
          );

  return (
    <section className={`price-book-section ${section} ${isStockView ? "stock-book-section" : ""}`}>
      <header className="price-book-section-header">
        <div>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        <div className="price-book-section-actions">
          <span>{rows.length}</span>
          {moveMaterialId && (
            <button
              type="button"
              className="price-move-here"
              onClick={() =>
                isSolealAccessoriesTable
                  ? onMovePriceMaterialToSolealAccessories(moveMaterialId)
                  : onMovePriceMaterialToTable(moveMaterialId, databaseId, insertedMaterialPriceTable, companyTableId)
              }
            >
              Move selected here
            </button>
          )}
          <button
            type="button"
            className="price-move-here"
            onClick={() =>
              onOpenMoveCompanyTable({
                tableId: companyTableId,
                sourceTableId: companyTableId ? undefined : tableId,
                sourceDatabaseId: companyTableId ? databaseId : "prices",
                name: title,
                referencePrefix: prefix.replace(/-+$/, ""),
                materialIds: movableRows.map((material) => material.id),
              })
            }
          >
            Move table
          </button>
          <button
            type="button"
            className="price-table-toggle"
            onClick={() => onToggleCollapse(tableId)}
            aria-expanded={!collapsed}
          >
            {collapsed ? "Open" : "Close"}
          </button>
          <button type="button" onClick={() => onOpenComponent(databaseId, companyTableId, insertedMaterialPriceTable)}>
            <Icon name="plus" size={13} /> Add component
          </button>
          {!isStockView && (
            <label className="table-weight-rate">
              <span>$/kg</span>
              <input
                aria-label={`Weight rate for ${title}`}
                type="number"
                min="0"
                step="any"
                value={weightRate}
                onChange={(event) => onSetTableWeightRate(tableId, Number(event.target.value))}
              />
            </label>
          )}
        </div>
      </header>
      {!collapsed && (
        <div
          className={`material-list table-zoomable price-book-table ${isStockView ? "stock-book-table" : ""} ${
            priceDeleteMode ? "selection-active" : ""
          } ${priceSelectionMode ? "bulk-selection-active" : ""}`}
          style={tableStyle}
          onWheel={zoomTable}
          role="table"
          aria-label={`${title} ${isStockView ? "stock" : "prices"}`}
        >
          <div className="material-list-header" role="row">
            {priceDeleteMode && (
              <span>
                <input
                  type="checkbox"
                  aria-label={`Select all ${title} materials`}
                  checked={rows.length > 0 && rows.every((material) => selectedPriceMaterialIds.has(material.id))}
                  onChange={(event) =>
                    setSelectedPriceMaterialIds((current) => {
                      const next = new Set(current);
                      rows.forEach((material) => (event.target.checked ? next.add(material.id) : next.delete(material.id)));
                      return next;
                    })
                  }
                />
              </span>
            )}
            <span>Ref.</span>
            <span>Material</span>
            <span>Code</span>
            <span>Used in assembly type</span>
            <span>Unit</span>
            {isStockView ? (
              <>
                <span>Mass</span>
                <span>Stock length</span>
                <span>Qty</span>
              </>
            ) : (
              <>
                <span className="weight-column-heading">kg / unit</span>
                <span>Wastage</span>
                <span>Rate / unit</span>
                <span>Shipping</span>
                <span />
              </>
            )}
          </div>
          {rows.map((material, index) => {
            const usage = assemblyUsage(material.id);
            const usageText = usage.join(", ");
            return (
              <div
                className={`material-list-row ${!isStockView && rateMethodMenu?.materialId === material.id ? "rate-method-open" : ""} ${
                  (priceSelectionMode || priceDeleteMode) && selectedPriceMaterialIds.has(material.id) ? "price-row-selected" : ""
                }`}
                role="row"
                key={material.id}
                data-price-material-id={material.id}
                onPointerDown={(event) => onBeginRowDragSelection(event, material.id)}
                onPointerEnter={() => onExtendRowDragSelection(material.id)}
                onPointerUp={onStopDragSelection}
              >
                {priceDeleteMode && (
                  <span>
                    <input
                      type="checkbox"
                      aria-label={`Select ${material.name}`}
                      checked={selectedPriceMaterialIds.has(material.id)}
                      onChange={(event) => onTogglePriceMaterialSelection(material.id, event.target.checked)}
                    />
                  </span>
                )}
                <span className="price-reference">
                  {prefix}
                  {startAt + index}
                </span>
                <span className={`material-list-name ${moveMaterialId && moveMaterialId !== material.id ? "move-target" : ""}`}>
                  <span className="price-photo-cell">
                    <button
                      type="button"
                      className="price-photo-button"
                      onClick={() =>
                        moveMaterialId
                          ? onMovePriceMaterialAfter(moveMaterialId, material.id)
                          : setPhotoMenuMaterialId((current) => (current === material.id ? null : material.id))
                      }
                      aria-label={`Actions for ${material.name}`}
                    >
                      <Sketch path={material.sketch} label={material.name} />
                    </button>
                    {photoMenuMaterialId === material.id && (
                      <span className="price-photo-menu">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenComponent(databaseId, companyTableId, insertedMaterialPriceTable, material.id);
                            setPhotoMenuMaterialId(null);
                          }}
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoveMaterialId(material.id);
                            setPhotoMenuMaterialId(null);
                          }}
                        >
                          Move
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoMenuMaterialId(null);
                            onDeletePriceMaterial(material);
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </span>
                  <b>{material.name}</b>
                  {material.manufacturer && <small>{material.manufacturer}</small>}
                </span>
                <span>{material.code}</span>
                <span
                  className="assembly-usage"
                  title={usageText || "Not used in an assembly type"}
                  tabIndex={0}
                  aria-label={usageText ? `Used in assembly types: ${usageText}` : "Not used in an assembly type"}
                >
                  {usageText || "Not used"}
                </span>
                <span>{material.unit}</span>
                {isStockView ? (
                  <>
                    <span className="stock-mass-cell">
                      <input
                        className="stock-input"
                        aria-label={`Mass for ${material.name}`}
                        type="number"
                        min="0"
                        step="any"
                        value={material.weight || ""}
                        onChange={(event) =>
                          setMaterials((items) =>
                            items.map((item) =>
                              item.id === material.id
                                ? { ...item, weight: Math.max(0, Number(event.target.value) || 0) }
                                : item
                            )
                          )
                        }
                      />
                      <em>kg</em>
                    </span>
                    {(() => {
                      const stockEntries = stockEntriesFor(material);
                      const updateEntry = (entryId: string, field: "length" | "quantity", value: string) => {
                        const parsed = Math.max(0, Number(value) || 0);
                        saveStockEntries(
                          material.id,
                          stockEntries.map((entry) => (entry.id === entryId ? { ...entry, [field]: parsed } : entry))
                        );
                      };
                      return (
                        <>
                          <span className="stock-cell stock-entry-list">
                            {stockEntries.map((entry) => (
                              <span className="stock-entry-row" key={entry.id}>
                                <input
                                  className="stock-input"
                                  aria-label={`Stock length for ${material.name}`}
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={entry.length || ""}
                                  onChange={(event) => updateEntry(entry.id, "length", event.target.value)}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    setStockLengthMenu({ materialId: material.id, entryId: entry.id });
                                  }}
                                />
                                <em>m</em>
                                {stockLengthMenu?.materialId === material.id && stockLengthMenu.entryId === entry.id && (
                                  <span className="stock-length-menu" role="menu">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        saveStockEntries(material.id, [
                                          ...stockEntries,
                                          { id: makeId(), length: 0, quantity: 0 },
                                        ]);
                                        setStockLengthMenu(null);
                                      }}
                                    >
                                      Add another stock length
                                    </button>
                                    {stockEntries.length > 1 && (
                                      <button
                                        type="button"
                                        className="danger"
                                        onClick={() => {
                                          saveStockEntries(
                                            material.id,
                                            stockEntries.filter((value) => value.id !== entry.id)
                                          );
                                          setStockLengthMenu(null);
                                        }}
                                      >
                                        Delete stock length
                                      </button>
                                    )}
                                  </span>
                                )}
                              </span>
                            ))}
                          </span>
                          <span className="stock-cell stock-entry-list">
                            {stockEntries.map((entry) => (
                              <span className="stock-entry-row" key={entry.id}>
                                <input
                                  className="stock-input"
                                  aria-label={`Stock quantity for ${material.name}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={entry.quantity || ""}
                                  onChange={(event) => updateEntry(entry.id, "quantity", event.target.value)}
                                />
                              </span>
                            ))}
                          </span>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <span className="weight-cell">
                      <input
                        key={material.weight}
                        className="weight-input"
                        aria-label={`Kilograms per unit for ${material.name}`}
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={material.weight}
                        onBlur={(event) => {
                          const weight = Math.max(0, Number(event.target.value) || 0);
                          const targets = selectedTargets(material.id);
                          recordPriceChange();
                          setMaterials((items) =>
                            items.map((value) =>
                              !targets.has(value.id)
                                ? value
                                : {
                                    ...value,
                                    weight,
                                    cost:
                                      value.rateMethod === "weight"
                                        ? weight * (weightRate || 0)
                                        : value.cost,
                                  }
                            )
                          );
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                    </span>
                    <span className="wastage-cell">
                      <input
                        key={material.wastage ?? 0}
                        className="wastage-input"
                        aria-label={`Wastage percentage for ${material.name}`}
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={material.wastage ?? 0}
                        onBlur={(event) => {
                          const wastage = Math.max(0, Number(event.target.value) || 0);
                          const targets = selectedTargets(material.id);
                          recordPriceChange();
                          setMaterials((items) =>
                            items.map((value) => (targets.has(value.id) ? { ...value, wastage } : value))
                          );
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />{" "}
                      <em>%</em>
                    </span>
                    <span
                      className={`price-cell rate-cell ${material.rateMethod === "weight" ? "weight-based" : ""} ${
                        rateMethodMenu?.materialId === material.id ? "rate-method-open" : ""
                      }`}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setRateMethodMenu({ materialId: material.id, tableId });
                      }}
                    >
                      <input
                        key={`${material.rateMethod ?? "manual"}-${material.cost}`}
                        className="price-book-input"
                        aria-label={`Rate per unit for ${material.name}`}
                        title="Right-click to choose Manual or Weight based"
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={material.cost}
                        disabled={material.rateMethod === "weight"}
                        onBlur={(event) => {
                          const cost = Math.max(0, Number(event.target.value) || 0);
                          const targets = selectedTargets(material.id);
                          recordPriceChange();
                          setMaterials((items) =>
                            items.map((value) =>
                              targets.has(value.id)
                                ? {
                                    ...value,
                                    cost,
                                    manualRate: cost,
                                    rateMethod: "manual",
                                    weightRateTableId: undefined,
                                  }
                                : value
                            )
                          );
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />{" "}
                      <em>$</em>
                      {rateMethodMenu?.materialId === material.id && (
                        <div className="rate-method-menu" role="menu">
                          <button type="button" onClick={() => onSetMaterialRateMethod(material, tableId, "manual")}>
                            Manual
                          </button>
                          <button type="button" onClick={() => onSetMaterialRateMethod(material, tableId, "weight")}>
                            Weight based
                          </button>
                        </div>
                      )}
                    </span>
                    <span className="shipping-cell">
                      <select
                        className="shipping-type-select"
                        value={material.shippingTypeId ?? ""}
                        onChange={(event) => {
                          const shippingTypeId = event.target.value || undefined;
                          const shippingPercentage = shippingRateForType(shippingTypeId);
                          const targets = selectedTargets(material.id);
                          recordPriceChange();
                          setMaterials((items) =>
                            items.map((value) => (targets.has(value.id) ? { ...value, shippingTypeId, shippingPercentage } : value))
                          );
                        }}
                        aria-label={`Shipping type for ${material.name}`}
                      >
                        <option value="">No shipping</option>
                        {shippingTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({number(shippingRateForType(type.id))}%)
                          </option>
                        ))}
                      </select>
                    </span>
                    <span className="material-list-actions">
                      <button onClick={() => onOpenModal("material", material.id)} aria-label={`Edit ${material.name}`}>
                        <Icon name="edit" size={13} />
                      </button>
                    </span>
                  </>
                )}
              </div>
            );
          })}
          {!rows.length && <p className="price-book-empty">No materials in this price group yet.</p>}
        </div>
      )}
    </section>
  );
}
