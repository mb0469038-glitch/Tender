import { CSSProperties, Dispatch, PointerEvent as ReactPointerEvent, SetStateAction, useMemo, WheelEvent } from "react";
import type {
  Assembly,
  CompanyDatabase,
  CompanyPriceTable,
  Material,
  ShippingType,
} from "../../../../domain/types";
import { Icon } from "../../../../design-system/Icon";
import {
  makeId,
  SOLEAL_JOINTS_DATABASE,
  TableMove,
  TECHNAL_FY_DATABASE,
  TECHNAL_FYN_DATABASE,
  TECHNAL_GY_DATABASE,
  TECHNAL_GYN_DATABASE,
} from "../../domain/catalogDefinitions";
import { PriceTable } from "./PriceTable";

export type PriceBookProps = {
  view?: "prices" | "stock";
  materials: Material[];
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  assemblies: Assembly[];
  companyDatabases: CompanyDatabase[];
  companyPriceTables: CompanyPriceTable[];
  movedOriginalPriceTableIds: string[];
  activeDatabaseId: string;
  weightRates: Record<string, number>;
  setWeightRates: Dispatch<SetStateAction<Record<string, number>>>;
  shippingTypes: ShippingType[];
  shippingRateForType: (typeId?: string) => number;
  openNewCompanyTable: (database: CompanyDatabase) => void;
  openMoveCompanyTable: (table: TableMove) => void;
  openCompanyTableMaterial: (
    databaseId: string,
    tableId: string,
    priceTable?: Material["priceTable"],
    insertAfterMaterialId?: string
  ) => void;
  openPriceComponent: (
    databaseId: string,
    priceTable?: Material["priceTable"],
    insertAfterMaterialId?: string
  ) => void;
  openModal: (type: "material", id: string) => void;
  tableZoom: number;
  zoomTable: (event: WheelEvent<HTMLDivElement>) => void;
  tableStyle: CSSProperties;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  assemblyTypeFilter: string;
  setAssemblyTypeFilter: Dispatch<SetStateAction<string>>;
  selectedPriceMaterialIds: Set<string>;
  setSelectedPriceMaterialIds: Dispatch<SetStateAction<Set<string>>>;
  priceUndoHistory: any[];
  priceRedoHistory: any[];
  undoPriceChange: () => void;
  redoPriceChange: () => void;
  recordPriceChange: () => void;
  priceDeleteMode: boolean;
  setPriceDeleteMode: Dispatch<SetStateAction<boolean>>;
  priceSelectionMode: boolean;
  setPriceSelectionMode: Dispatch<SetStateAction<boolean>>;
  setPriceSelectionPending: Dispatch<SetStateAction<any>>;
  setPriceSelectionDrag: Dispatch<SetStateAction<any>>;
  deleteSelectedPriceMaterials: () => void;
  deletePriceMaterial: (material: Material) => void;
  togglePriceMaterialSelection: (materialId: string, selected: boolean) => void;
  beginRowDragSelection: (event: ReactPointerEvent<HTMLDivElement>, materialId: string) => void;
  extendRowDragSelection: (materialId: string) => void;
  moveMaterialId: string | null;
  setMoveMaterialId: Dispatch<SetStateAction<string | null>>;
  movePriceMaterialAfter: (movingId: string, targetId: string) => void;
  movePriceMaterialToTable: (
    movingId: string,
    databaseId: string,
    priceTable: Material["priceTable"],
    companyTableId?: string
  ) => void;
  movePriceMaterialToSolealAccessories: (movingId: string) => void;
  setTableWeightRate: (tableId: string, value: number) => void;
  setMaterialRateMethod: (material: Material, tableId: string, rateMethod: "manual" | "weight") => void;
  rateMethodMenu: { materialId: string; tableId: string } | null;
  setRateMethodMenu: Dispatch<SetStateAction<{ materialId: string; tableId: string } | null>>;
  stockLengthMenu: { materialId: string; entryId: string } | null;
  setStockLengthMenu: Dispatch<SetStateAction<{ materialId: string; entryId: string } | null>>;
  photoMenuMaterialId: string | null;
  setPhotoMenuMaterialId: Dispatch<SetStateAction<string | null>>;
  collapsedPriceTables: Set<string>;
  setCollapsedPriceTables: Dispatch<SetStateAction<Set<string>>>;
  solealAccessoryMaterials: () => Material[];
  solealProfileMaterials: (databaseId: string) => Material[];
};

export function PriceBook({
  view = "prices",
  materials,
  setMaterials,
  assemblies,
  companyDatabases,
  companyPriceTables,
  movedOriginalPriceTableIds,
  activeDatabaseId,
  weightRates,
  shippingTypes,
  shippingRateForType,
  openNewCompanyTable,
  openMoveCompanyTable,
  openCompanyTableMaterial,
  openPriceComponent,
  openModal,
  tableZoom,
  zoomTable,
  tableStyle,
  search,
  setSearch,
  assemblyTypeFilter,
  setAssemblyTypeFilter,
  selectedPriceMaterialIds,
  setSelectedPriceMaterialIds,
  priceUndoHistory,
  priceRedoHistory,
  undoPriceChange,
  redoPriceChange,
  recordPriceChange,
  priceDeleteMode,
  setPriceDeleteMode,
  priceSelectionMode,
  setPriceSelectionMode,
  setPriceSelectionPending,
  setPriceSelectionDrag,
  deleteSelectedPriceMaterials,
  deletePriceMaterial,
  togglePriceMaterialSelection,
  beginRowDragSelection,
  extendRowDragSelection,
  moveMaterialId,
  setMoveMaterialId,
  movePriceMaterialAfter,
  movePriceMaterialToTable,
  movePriceMaterialToSolealAccessories,
  setTableWeightRate,
  setMaterialRateMethod,
  rateMethodMenu,
  setRateMethodMenu,
  stockLengthMenu,
  setStockLengthMenu,
  photoMenuMaterialId,
  setPhotoMenuMaterialId,
  collapsedPriceTables,
  setCollapsedPriceTables,
  solealAccessoryMaterials,
  solealProfileMaterials,
}: PriceBookProps) {
  const isStockView = view === "stock";

  const stockEntriesFor = (material: Material) =>
    material.stockEntries?.length
      ? material.stockEntries
      : [{ id: "default", length: material.stockLength ?? 0, quantity: material.stockQuantity ?? 0 }];

  const saveStockEntries = (materialId: string, entries: Material["stockEntries"]) => {
    if (!entries?.length) return;
    setMaterials((items) =>
      items.map((material) =>
        material.id === materialId
          ? { ...material, stockEntries: entries, stockLength: entries[0].length, stockQuantity: entries[0].quantity }
          : material
      )
    );
  };

  const companyDatabase = companyDatabases.find((database) => database.id === activeDatabaseId);
  const hasLegacyMovedOthers = companyPriceTables.some(
    (table) =>
      table.companyDatabaseId !== "prices" &&
      table.name.trim().toLowerCase() === "others" &&
      table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === "g"
  );

  const assemblyUsageByMaterial = useMemo(() => {
    const map = new Map<string, string[]>();
    assemblies.forEach((assembly) => {
      assembly.parts.forEach((part) => {
        const names = map.get(part.materialId) ?? [];
        if (!names.includes(assembly.name)) names.push(assembly.name);
        map.set(part.materialId, names);
      });
    });
    return map;
  }, [assemblies]);

  const assemblyUsage = (materialId: string) => assemblyUsageByMaterial.get(materialId) ?? [];
  const assemblyTypeNames = useMemo(
    () =>
      [...new Set(assemblies.filter((assembly) => assembly.parts.length > 0).map((assembly) => assembly.name))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [assemblies]
  );

  const matchesAssemblyTypeFilter = (material: Material) =>
    !assemblyTypeFilter || assemblyUsage(material.id).includes(assemblyTypeFilter);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return materials.filter(
      (m) =>
        !term ||
        [m.name, m.code, m.category, m.supplierCode, m.manufacturer]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
    );
  }, [materials, search]);

  const rowsFor = (databaseId: string) =>
    filtered.filter((material) => material.databaseId === databaseId && matchesAssemblyTypeFilter(material));

  const generalRowsFor = (group: "others" | "profiles" | "accessories") =>
    rowsFor("markups").filter((material) =>
      group === "others" ? !material.priceTable || material.priceTable === "general" : material.priceTable === group
    );

  const groupedRowsFor = (databaseId: string, group: "profiles" | "accessories", legacyProfileCount = 7) => {
    const allRows = materials.filter((material) => material.databaseId === databaseId);
    const legacyProfileIds = new Set(
      allRows
        .filter((material) => !material.priceTable)
        .slice(0, legacyProfileCount)
        .map((material) => material.id)
    );
    return rowsFor(databaseId).filter((material) =>
      material.priceTable === group ||
      (!material.priceTable && (group === "profiles" ? legacyProfileIds.has(material.id) : !legacyProfileIds.has(material.id)))
    );
  };

  const selectedTargets = (materialId: string) =>
    priceSelectionMode && selectedPriceMaterialIds.has(materialId)
      ? selectedPriceMaterialIds
      : new Set([materialId]);

  const toggleCollapse = (tableId: string) =>
    setCollapsedPriceTables((current) => {
      const next = new Set(current);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });

  const handleOpenComponent = (
    databaseId: string,
    companyTableId?: string,
    insertedMaterialPriceTable?: Material["priceTable"],
    insertAfterMaterialId?: string
  ) => {
    if (companyTableId) {
      openCompanyTableMaterial(databaseId, companyTableId, insertedMaterialPriceTable, insertAfterMaterialId);
    } else {
      const newMaterialDatabaseId = databaseId === "soleal-accessories" ? TECHNAL_GYN_DATABASE : databaseId;
      openPriceComponent(newMaterialDatabaseId, insertedMaterialPriceTable, insertAfterMaterialId);
    }
  };

  const renderTable = (params: {
    title: string;
    note: string;
    rows: Material[];
    section: string;
    databaseId: string;
    prefix: string;
    collapseId?: string;
    companyTableId?: string;
  }) => {
    const tableId = params.collapseId ?? params.databaseId;
    return (
      <PriceTable
        key={tableId}
        {...params}
        isStockView={isStockView}
        collapsed={collapsedPriceTables.has(tableId)}
        onToggleCollapse={toggleCollapse}
        weightRate={weightRates[tableId] ?? 0}
        onSetTableWeightRate={setTableWeightRate}
        moveMaterialId={moveMaterialId}
        onMovePriceMaterialToTable={movePriceMaterialToTable}
        onMovePriceMaterialToSolealAccessories={movePriceMaterialToSolealAccessories}
        onOpenMoveCompanyTable={openMoveCompanyTable}
        onOpenComponent={handleOpenComponent}
        priceDeleteMode={priceDeleteMode}
        priceSelectionMode={priceSelectionMode}
        selectedPriceMaterialIds={selectedPriceMaterialIds}
        setSelectedPriceMaterialIds={setSelectedPriceMaterialIds}
        onTogglePriceMaterialSelection={togglePriceMaterialSelection}
        onBeginRowDragSelection={beginRowDragSelection}
        onExtendRowDragSelection={extendRowDragSelection}
        onStopDragSelection={() => {
          setPriceSelectionPending(null);
          setPriceSelectionDrag(null);
        }}
        assemblyUsage={assemblyUsage}
        rateMethodMenu={rateMethodMenu}
        setRateMethodMenu={setRateMethodMenu}
        onSetMaterialRateMethod={setMaterialRateMethod}
        photoMenuMaterialId={photoMenuMaterialId}
        setPhotoMenuMaterialId={setPhotoMenuMaterialId}
        setMoveMaterialId={setMoveMaterialId}
        onMovePriceMaterialAfter={movePriceMaterialAfter}
        onDeletePriceMaterial={deletePriceMaterial}
        onOpenModal={openModal}
        stockLengthMenu={stockLengthMenu}
        setStockLengthMenu={setStockLengthMenu}
        stockEntriesFor={stockEntriesFor}
        saveStockEntries={saveStockEntries}
        materials={materials}
        setMaterials={setMaterials}
        recordPriceChange={recordPriceChange}
        selectedTargets={selectedTargets}
        shippingTypes={shippingTypes}
        shippingRateForType={shippingRateForType}
        tableStyle={tableStyle}
        zoomTable={zoomTable}
        makeId={makeId}
        solealAccessoryMaterials={solealAccessoryMaterials}
        solealProfileMaterials={solealProfileMaterials}
      />
    );
  };

  return (
    <div className={isStockView ? "stock-book" : undefined}>
      <section className="flex items-end justify-between gap-6 p-[41px_48px_27px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:px-5 max-[700px]:pt-8">
        <div>
          <h1 className="m-0 text-[#11262a] text-[36px] font-bold tracking-[-0.035em]">
            {isStockView ? "Stock" : companyDatabase ? `${companyDatabase.name} Database` : "Soleal Database"}
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-[15px] leading-relaxed">
            {isStockView
              ? "The same material tables as the estimation database, showing stock length and available quantity."
              : companyDatabase
                ? `Organize ${companyDatabase.name} materials within the shared estimating database. These tables use the same estimating controls as Soleal.`
                : "Manage Soleal materials, profiles, accessories, and their central pricing for estimating."}
          </p>
        </div>
        <button
          type="button"
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
          onClick={() => openNewCompanyTable(companyDatabase ?? { id: "prices", name: "Soleal" })}
        >
          <Icon name="plus" /> Add table
        </button>
      </section>
      <section className="mx-12 mb-9 p-[18px] border border-[#dfe8e8] rounded-[13px] bg-white shadow-[0_8px_27px_#183f4110] grid gap-3.5 max-[700px]:mx-5">
        <div className="flex items-center justify-between gap-4 pb-[18px] flex-wrap">
          <label className="w-[min(330px,100%)] h-10 flex items-center gap-2 px-3 border border-[#d5e0e1] rounded-[7px] text-[#698086] focus-within:border-[#27827d]">
            <Icon name="search" size={17} />
            <span className="sr-only">Search</span>
            <input
              className="w-full border-0 outline-none bg-transparent text-[#18363a] text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${companyDatabase ? `${companyDatabase.name} database` : "Soleal database"}`}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-[#4c696d] [&>select]:h-10 [&>select]:px-2.5 [&>select]:border [&>select]:border-[#d5e0e1] [&>select]:rounded-[7px] [&>select]:bg-white [&>select]:text-[#18363a]">
            <span>Assembly type</span>
            <select value={assemblyTypeFilter} onChange={(event) => setAssemblyTypeFilter(event.target.value)}>
              <option value="">All assembly types</option>
              {assemblyTypeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="text-[#687d81] text-[13px]">{filtered.length} materials</span>
          <span className="text-[#71898c] text-[10px] tabular-nums">Table {tableZoom}% · Ctrl + scroll</span>
          <button
            className="min-h-[30px] px-[9px] border border-[#a7cfca] rounded-[5px] bg-white text-[#1d6f69] text-[10px] font-extrabold hover:enabled:bg-[#e5f4f1] disabled:border-[#d7e2e1] disabled:bg-[#f4f7f7] disabled:text-[#a2b1b1] disabled:cursor-not-allowed cursor-pointer"
            type="button"
            onClick={undoPriceChange}
            disabled={!priceUndoHistory.length}
          >
            Undo
          </button>
          <button
            className="min-h-[30px] px-[9px] border border-[#a7cfca] rounded-[5px] bg-white text-[#1d6f69] text-[10px] font-extrabold hover:enabled:bg-[#e5f4f1] disabled:border-[#d7e2e1] disabled:bg-[#f4f7f7] disabled:text-[#a2b1b1] disabled:cursor-not-allowed cursor-pointer"
            type="button"
            onClick={redoPriceChange}
            disabled={!priceRedoHistory.length}
          >
            Redo
          </button>
          <button
            className={`flex items-center gap-[5px] min-h-[30px] ml-[5px] px-[9px] border rounded-[5px] text-[10px] font-extrabold cursor-pointer transition-colors ${
              priceDeleteMode
                ? "border-[#d99898] bg-[#fff1f1] text-[#a12e2e] hover:bg-[#fde2e2]"
                : "border-[#a7cfca] bg-white text-[#1d6f69] hover:bg-[#e5f4f1]"
            }`}
            type="button"
            onClick={() => {
              if (!priceDeleteMode) {
                setPriceDeleteMode(true);
                setPriceSelectionMode(false);
                setPriceSelectionPending(null);
                setPriceSelectionDrag(null);
                setSelectedPriceMaterialIds(new Set());
                return;
              }
              if (selectedPriceMaterialIds.size) deleteSelectedPriceMaterials();
              else setPriceDeleteMode(false);
            }}
          >
            <Icon name="trash" size={14} />{" "}
            {priceDeleteMode
              ? selectedPriceMaterialIds.size
                ? `Delete selected (${selectedPriceMaterialIds.size})`
                : "Exit delete"
              : "Delete"}
          </button>
        </div>
        {companyDatabase ? (
          <>
            {companyPriceTables
              .filter((table) => table.companyDatabaseId === companyDatabase.id)
              .map((table) =>
                renderTable({
                  title: table.name,
                  note: `Materials in this ${companyDatabase.name} table.`,
                  rows: rowsFor(companyDatabase.id).filter((material) => material.companyTableId === table.id),
                  section: "price-technal",
                  databaseId: companyDatabase.id,
                  prefix: `${table.referencePrefix}-`,
                  collapseId: table.id,
                  companyTableId: table.id,
                })
              )}
            {!companyPriceTables.some((table) => table.companyDatabaseId === companyDatabase.id) && (
              <p className="m-0 p-[18px] text-[#7b9194] text-[11px] text-center">
                No tables yet. Use Add table to create the first {companyDatabase.name} material table.
              </p>
            )}
          </>
        ) : (
          <>
            {companyPriceTables
              .filter((table) => table.companyDatabaseId === "prices")
              .map((table) =>
                renderTable({
                  title: table.name,
                  note: "Materials in this shared Soleal database table.",
                  rows: rowsFor("prices").filter((material) => material.companyTableId === table.id),
                  section: "price-technal",
                  databaseId: "prices",
                  prefix: `${table.referencePrefix}-`,
                  collapseId: table.id,
                  companyTableId: table.id,
                })
              )}
            {!movedOriginalPriceTableIds.includes("general-others") &&
              !hasLegacyMovedOthers &&
              renderTable({
                title: "Others",
                note: "Miscellaneous general items.",
                rows: generalRowsFor("others"),
                section: "price-general",
                databaseId: "markups",
                prefix: "G-",
                collapseId: "general-others",
              })}
            {!movedOriginalPriceTableIds.includes("general-profiles") &&
              renderTable({
                title: "General ALU profiles",
                note: "General aluminium profiles.",
                rows: generalRowsFor("profiles"),
                section: "price-general",
                databaseId: "markups",
                prefix: "GP-",
                collapseId: "general-profiles",
              })}
            {!movedOriginalPriceTableIds.includes("general-accessories") &&
              renderTable({
                title: "General ALU accessories",
                note: "General aluminium accessories.",
                rows: generalRowsFor("accessories"),
                section: "price-general",
                databaseId: "markups",
                prefix: "GA-",
                collapseId: "general-accessories",
              })}
            {!movedOriginalPriceTableIds.includes("gyn-profiles") &&
              renderTable({
                title: "GYn · ALU profiles",
                note: "Soleal GYn aluminium profiles.",
                rows: groupedRowsFor(TECHNAL_GYN_DATABASE, "profiles"),
                section: "price-technal",
                databaseId: TECHNAL_GYN_DATABASE,
                prefix: "GYn-",
                collapseId: "gyn-profiles",
              })}
            {!movedOriginalPriceTableIds.includes("gy-profiles") &&
              renderTable({
                title: "GY · ALU profiles",
                note: "Soleal GY aluminium profiles.",
                rows: groupedRowsFor(TECHNAL_GY_DATABASE, "profiles"),
                section: "price-technal",
                databaseId: TECHNAL_GY_DATABASE,
                prefix: "GY-",
                collapseId: "gy-profiles",
              })}
            {!movedOriginalPriceTableIds.includes("fyn-profiles") &&
              renderTable({
                title: "FYn · ALU profiles",
                note: "Soleal FYn aluminium profiles.",
                rows: groupedRowsFor(TECHNAL_FYN_DATABASE, "profiles"),
                section: "price-technal",
                databaseId: TECHNAL_FYN_DATABASE,
                prefix: "FYn-",
                collapseId: "fyn-profiles",
              })}
            {!movedOriginalPriceTableIds.includes("fy-profiles") &&
              renderTable({
                title: "FY · ALU profiles",
                note: "Soleal FY aluminium profiles.",
                rows: groupedRowsFor(TECHNAL_FY_DATABASE, "profiles"),
                section: "price-technal",
                databaseId: TECHNAL_FY_DATABASE,
                prefix: "FY-",
                collapseId: "fy-profiles",
              })}
            {!movedOriginalPriceTableIds.includes("soleal-accessories") &&
              renderTable({
                title: "Accessories",
                note: "Accessories for all Soleal doors and windows systems.",
                rows: [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].flatMap(
                  (databaseId) => groupedRowsFor(databaseId, "accessories")
                ),
                section: "price-technal",
                databaseId: "soleal-accessories",
                prefix: "A-",
                collapseId: "soleal-accessories",
              })}
            {!movedOriginalPriceTableIds.includes("soleal-joints") &&
              renderTable({
                title: "Joints",
                note: "Joints for all Soleal doors and windows systems.",
                rows: rowsFor(SOLEAL_JOINTS_DATABASE),
                section: "price-technal",
                databaseId: SOLEAL_JOINTS_DATABASE,
                prefix: "J-",
                collapseId: "soleal-joints",
              })}
          </>
        )}
      </section>
    </div>
  );
}
