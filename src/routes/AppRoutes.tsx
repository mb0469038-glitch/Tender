import { Routes, Route, Navigate } from "react-router-dom";
import type { useAppState } from "../application/useAppState";
import { DashboardScreen } from "../modules/dashboard/ui/DashboardScreen";
import { ProjectsScreen } from "../modules/projects/ui/ProjectsScreen";
import { PriceBook } from "../modules/catalog/ui/PriceBook/PriceBook";
import { CostingFinancials } from "../modules/costing/ui/CostingFinancials";
import { Library } from "../modules/catalog/ui/Library";
import { AssemblyLibrary } from "../modules/catalog/ui/AssemblyLibrary";
import { ExcelWorkspace } from "../modules/workspace/ui/ExcelWorkspace";
import { ExecutionProjectsScreen } from "../modules/execution/ui/ExecutionProjectsScreen";
import { WorkspaceDataLoader } from "./WorkspaceDataLoader";
import { CanvasRouteWrapper } from "./wrappers/CanvasRouteWrapper";
import { ExecutionWorkspaceRouteWrapper } from "./wrappers/ExecutionWorkspaceRouteWrapper";
import { getTableStyle } from "../modules/catalog/domain/tableStyles";
import { Icon } from "../design-system/Icon";

export type AppRoutesProps = {
  state: ReturnType<typeof useAppState>;
};

export function AppRoutes({ state }: AppRoutesProps) {
  const {
    materials,
    setMaterials,
    assemblies,
    projects,
    selectedProject,
    setSelectedProjectId,
    selectedCanvasId,
    setSelectedCanvasId,
    selectedItemId,
    setSelectedItemId,
    updateProject,
    undoCanvasChange,
    redoCanvasChange,
    undoProjectHistory,
    redoProjectHistory,
    canvasInteraction,
    takeoff,
    shippingRateForMaterial,
    materialDatabaseReference,
    priceBook,
    modals,
    activeProjectYear,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
    weightRates,
    setWeightRates,
    shippingTypes,
    setShippingTypes,
    shippingRateForType,
    search,
    setSearch,
    assemblyTypeFilter,
    setAssemblyTypeFilter,
    solealAccessoryMaterials,
    solealProfileMaterials,
    markupRates,
    setMarkupRates,
    manpowerCurrency,
    setManpowerCurrency,
    manpowerCosts,
    setManpowerCosts,
    shippingCosts,
    setShippingCosts,
    materialView,
    setMaterialView,
    setMaterialDatabaseOverride,
    activeAssemblySystem,
    componentDatabases,
    execution,
    persistence,
  } = state;

  const withLoader = (element: React.ReactNode) => (
    <WorkspaceDataLoader
      hydrated={persistence.hydrated}
      isLoading={persistence.isLoading}
      loadWorkspaceData={persistence.loadWorkspaceData}
    >
      {element}
    </WorkspaceDataLoader>
  );

  return (
    <Routes>
      {/* Root redirect to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 1. Dashboard Landing Page (Instant load, zero initial workspace fetch) */}
      <Route path="/dashboard" element={<DashboardScreen />} />

      {/* 2. Estimation Service (Home) */}
      <Route
        path="/home"
        element={withLoader(
          <ProjectsScreen
            activeProjectYear={activeProjectYear}
            projects={projects}
            openModal={modals.openModal}
            remove={modals.remove}
            onOpenProject={(projectId, canvasId) => {
              setSelectedProjectId(projectId);
              setSelectedCanvasId(canvasId);
              state.setScreen("canvas");
            }}
          />
        )}
      />
      <Route path="/estimation" element={<Navigate to="/home" replace />} />

      {/* 3. 2D Canvas Takeoff Screen */}
      <Route
        path="/canvas"
        element={withLoader(
          <CanvasRouteWrapper
            selectedProject={selectedProject}
            materials={materials}
            assemblies={assemblies}
            updateProject={updateProject}
            undoCanvasChange={undoCanvasChange}
            redoCanvasChange={redoCanvasChange}
            undoProjectHistory={undoProjectHistory}
            redoProjectHistory={redoProjectHistory}
            shippingRateForMaterial={shippingRateForMaterial}
            materialDatabaseReference={materialDatabaseReference}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            selectedCanvasId={selectedCanvasId}
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
          />
        )}
      />

      {/* 4. AMA Stock Route */}
      <Route
        path="/stock"
        element={withLoader(
          <PriceBook
            view="stock"
            materials={materials}
            setMaterials={setMaterials}
            assemblies={assemblies}
            companyDatabases={companyDatabases}
            companyPriceTables={companyPriceTables}
            movedOriginalPriceTableIds={movedOriginalPriceTableIds}
            activeDatabaseId="prices"
            weightRates={weightRates}
            setWeightRates={setWeightRates}
            shippingTypes={shippingTypes}
            shippingRateForType={shippingRateForType}
            openNewCompanyTable={modals.openNewCompanyTable}
            openMoveCompanyTable={modals.openMoveCompanyTable}
            openCompanyTableMaterial={modals.openCompanyTableMaterial}
            openPriceComponent={modals.openPriceComponent}
            openModal={modals.openModal}
            tableZoom={priceBook.tableZoom}
            zoomTable={priceBook.zoomTable}
            tableStyle={getTableStyle(priceBook.tableZoom, false) as React.CSSProperties}
            search={search}
            setSearch={setSearch}
            assemblyTypeFilter={assemblyTypeFilter}
            setAssemblyTypeFilter={setAssemblyTypeFilter}
            selectedPriceMaterialIds={priceBook.selectedPriceMaterialIds}
            setSelectedPriceMaterialIds={priceBook.setSelectedPriceMaterialIds}
            priceUndoHistory={priceBook.priceUndoHistory}
            priceRedoHistory={priceBook.priceRedoHistory}
            undoPriceChange={priceBook.undoPriceChange}
            redoPriceChange={priceBook.redoPriceChange}
            recordPriceChange={priceBook.recordPriceChange}
            priceDeleteMode={priceBook.priceDeleteMode}
            setPriceDeleteMode={priceBook.setPriceDeleteMode}
            priceSelectionMode={priceBook.priceSelectionMode}
            setPriceSelectionMode={priceBook.setPriceSelectionMode}
            setPriceSelectionPending={priceBook.setPriceSelectionPending}
            setPriceSelectionDrag={priceBook.setPriceSelectionDrag}
            deleteSelectedPriceMaterials={priceBook.deleteSelectedPriceMaterials}
            deletePriceMaterial={priceBook.deletePriceMaterial}
            togglePriceMaterialSelection={priceBook.togglePriceMaterialSelection}
            beginRowDragSelection={priceBook.beginRowDragSelection}
            extendRowDragSelection={priceBook.extendRowDragSelection}
            moveMaterialId={priceBook.moveMaterialId}
            setMoveMaterialId={priceBook.setMoveMaterialId}
            movePriceMaterialAfter={priceBook.movePriceMaterialAfter}
            movePriceMaterialToTable={priceBook.movePriceMaterialToTable}
            movePriceMaterialToSolealAccessories={priceBook.movePriceMaterialToSolealAccessories}
            setTableWeightRate={priceBook.setTableWeightRate}
            setMaterialRateMethod={priceBook.setMaterialRateMethod}
            rateMethodMenu={priceBook.rateMethodMenu}
            setRateMethodMenu={priceBook.setRateMethodMenu}
            stockLengthMenu={priceBook.stockLengthMenu}
            setStockLengthMenu={priceBook.setStockLengthMenu}
            photoMenuMaterialId={priceBook.photoMenuMaterialId}
            setPhotoMenuMaterialId={priceBook.setPhotoMenuMaterialId}
            collapsedPriceTables={priceBook.collapsedPriceTables}
            setCollapsedPriceTables={priceBook.setCollapsedPriceTables}
            solealAccessoryMaterials={solealAccessoryMaterials}
            solealProfileMaterials={solealProfileMaterials}
          />
        )}
      />

      {/* 5. Soleal Database Route */}
      <Route
        path="/database/soleal"
        element={withLoader(
          <PriceBook
            view="prices"
            materials={materials}
            setMaterials={setMaterials}
            assemblies={assemblies}
            companyDatabases={companyDatabases}
            companyPriceTables={companyPriceTables}
            movedOriginalPriceTableIds={movedOriginalPriceTableIds}
            activeDatabaseId="prices"
            weightRates={weightRates}
            setWeightRates={setWeightRates}
            shippingTypes={shippingTypes}
            shippingRateForType={shippingRateForType}
            openNewCompanyTable={modals.openNewCompanyTable}
            openMoveCompanyTable={modals.openMoveCompanyTable}
            openCompanyTableMaterial={modals.openCompanyTableMaterial}
            openPriceComponent={modals.openPriceComponent}
            openModal={modals.openModal}
            tableZoom={priceBook.tableZoom}
            zoomTable={priceBook.zoomTable}
            tableStyle={getTableStyle(priceBook.tableZoom, false) as React.CSSProperties}
            search={search}
            setSearch={setSearch}
            assemblyTypeFilter={assemblyTypeFilter}
            setAssemblyTypeFilter={setAssemblyTypeFilter}
            selectedPriceMaterialIds={priceBook.selectedPriceMaterialIds}
            setSelectedPriceMaterialIds={priceBook.setSelectedPriceMaterialIds}
            priceUndoHistory={priceBook.priceUndoHistory}
            priceRedoHistory={priceBook.priceRedoHistory}
            undoPriceChange={priceBook.undoPriceChange}
            redoPriceChange={priceBook.redoPriceChange}
            recordPriceChange={priceBook.recordPriceChange}
            priceDeleteMode={priceBook.priceDeleteMode}
            setPriceDeleteMode={priceBook.setPriceDeleteMode}
            priceSelectionMode={priceBook.priceSelectionMode}
            setPriceSelectionMode={priceBook.setPriceSelectionMode}
            setPriceSelectionPending={priceBook.setPriceSelectionPending}
            setPriceSelectionDrag={priceBook.setPriceSelectionDrag}
            deleteSelectedPriceMaterials={priceBook.deleteSelectedPriceMaterials}
            deletePriceMaterial={priceBook.deletePriceMaterial}
            togglePriceMaterialSelection={priceBook.togglePriceMaterialSelection}
            beginRowDragSelection={priceBook.beginRowDragSelection}
            extendRowDragSelection={priceBook.extendRowDragSelection}
            moveMaterialId={priceBook.moveMaterialId}
            setMoveMaterialId={priceBook.setMoveMaterialId}
            movePriceMaterialAfter={priceBook.movePriceMaterialAfter}
            movePriceMaterialToTable={priceBook.movePriceMaterialToTable}
            movePriceMaterialToSolealAccessories={priceBook.movePriceMaterialToSolealAccessories}
            setTableWeightRate={priceBook.setTableWeightRate}
            setMaterialRateMethod={priceBook.setMaterialRateMethod}
            rateMethodMenu={priceBook.rateMethodMenu}
            setRateMethodMenu={priceBook.setRateMethodMenu}
            stockLengthMenu={priceBook.stockLengthMenu}
            setStockLengthMenu={priceBook.setStockLengthMenu}
            photoMenuMaterialId={priceBook.photoMenuMaterialId}
            setPhotoMenuMaterialId={priceBook.setPhotoMenuMaterialId}
            collapsedPriceTables={priceBook.collapsedPriceTables}
            setCollapsedPriceTables={priceBook.setCollapsedPriceTables}
            solealAccessoryMaterials={solealAccessoryMaterials}
            solealProfileMaterials={solealProfileMaterials}
          />
        )}
      />

      {/* 6. Glass Database Route */}
      <Route
        path="/database/glass"
        element={withLoader(
          <Library
            type="material"
            activeDatabaseId="glass"
            activeDatabase={{
              title: "Glass Database",
              eyebrow: "Database / Glazing",
              description: "Glass specifications, thicknesses, and unit costs.",
            }}
            filtered={materials.filter((m) => m.category === "glass" || m.databaseId === "glass")}
            setMaterials={setMaterials}
            openModal={modals.openModal}
            setMaterialDatabaseOverride={setMaterialDatabaseOverride}
            search={search}
            setSearch={setSearch}
            tableZoom={priceBook.tableZoom}
            tableStyle={getTableStyle(priceBook.tableZoom, true) as React.CSSProperties}
            zoomTable={priceBook.zoomTable}
            materialView={materialView}
            setMaterialView={setMaterialView}
            remove={modals.remove}
          />
        )}
      />

      {/* 7. Costing & Financials Route */}
      <Route
        path="/database/costing"
        element={withLoader(
          <CostingFinancials
            Icon={Icon}
            search={search}
            setSearch={setSearch}
            tableZoom={priceBook.tableZoom}
            markupRates={markupRates}
            setMarkupRates={setMarkupRates}
            manpowerCurrency={manpowerCurrency}
            setManpowerCurrency={setManpowerCurrency}
            manpowerCosts={manpowerCosts}
            setManpowerCosts={setManpowerCosts}
            shippingTypes={shippingTypes}
            setShippingTypes={setShippingTypes}
            shippingCosts={shippingCosts}
            setShippingCosts={setShippingCosts}
            setMaterials={setMaterials}
          />
        )}
      />

      {/* 8. Assemblies Route */}
      <Route
        path="/assemblies"
        element={withLoader(
          <AssemblyLibrary
            activeAssemblySystem={activeAssemblySystem}
            activeDatabaseId="prices"
            componentDatabases={componentDatabases}
            search={search}
            setSearch={setSearch}
            assemblies={assemblies}
            openModal={modals.openModal}
            remove={modals.remove}
          />
        )}
      />

      {/* 9. Projects Under Execution Route */}
      <Route
        path="/execution"
        element={withLoader(
          <ExecutionProjectsScreen
            embedded
            screen="execution-projects"
            setScreen={state.setScreen}
            executionProjects={execution.executionProjects}
            selectedExecutionProjectId={execution.selectedExecutionProjectId}
            executionFolderId={execution.executionFolderId}
            setExecutionFolderId={execution.setExecutionFolderId}
            executionNewMenuOpen={execution.executionNewMenuOpen}
            setExecutionNewMenuOpen={execution.setExecutionNewMenuOpen}
            newExecutionItemType={execution.newExecutionItemType}
            setNewExecutionItemType={execution.setNewExecutionItemType}
            newExecutionItemName={execution.newExecutionItemName}
            setNewExecutionItemName={execution.setNewExecutionItemName}
            openModal={modals.openModal}
            openExecutionProject={execution.openExecutionProject}
            copyExecutionProject={execution.copyExecutionProject}
            removeExecutionProject={execution.removeExecutionProject}
            openExecutionWorkspace={execution.openExecutionWorkspace}
            createExecutionProjectItem={execution.createExecutionProjectItem}
            removeExecutionProjectItem={execution.removeExecutionProjectItem}
          />
        )}
      />

      {/* 10. Execution Workspace Route */}
      <Route
        path="/execution/workspace"
        element={withLoader(<ExecutionWorkspaceRouteWrapper state={state} />)}
      />

      {/* 11. Excel Spreadsheet Route */}
      <Route path="/excel" element={<ExcelWorkspace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
