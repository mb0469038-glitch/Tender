import { Routes, Route, Navigate } from "react-router-dom";
import type { useAppState } from "../application/useAppState";
import { DashboardScreen } from "../modules/dashboard/ui/DashboardScreen";
import { HomeScreen } from "../modules/home/ui/HomeScreen";
import { PriceBook } from "../modules/catalog/ui/PriceBook/PriceBook";
import { CostingFinancials } from "../modules/costing/ui/CostingFinancials";
import { Library } from "../modules/catalog/ui/Library";
import { AssemblyRouteWrapper } from "./wrappers/AssemblyRouteWrapper";
import { ExcelWorkspace } from "../modules/workspace/ui/ExcelWorkspace";
import { WorkspaceDataLoader } from "./WorkspaceDataLoader";
import { CanvasRouteWrapper } from "./wrappers/CanvasRouteWrapper";
import { ProjectsOrCanvasDispatcher } from "./wrappers/ProjectsOrCanvasDispatcher";
import { ExecutionRouteWrapper } from "./wrappers/ExecutionRouteWrapper";
import { ExecutionWorkspaceRouteWrapper } from "./wrappers/ExecutionWorkspaceRouteWrapper";
import { AdminBackofficeLayout } from "../modules/auth/ui/admin/AdminBackofficeLayout";
import { AdminRouteGuard } from "../modules/auth/ui/AdminRouteGuard";
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
    selectedProjectId,
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
    setActiveProjectYear,
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
      {/* 1. Root & Home Gateway Landing Page */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/login" element={<Navigate to="/home" replace />} />

      {/* 2. Executive Dashboard (Instant load, zero initial workspace fetch) */}
      <Route path="/dashboard" element={<DashboardScreen />} />

      {/* 3. Estimation Service Routes */}
      <Route
        path="/estimation"
        element={<Navigate to={`/estimation/projects/${activeProjectYear || "2026"}`} replace />}
      />
      <Route
        path="/estimation/projects"
        element={<Navigate to={`/estimation/projects/${activeProjectYear || "2026"}`} replace />}
      />

      {/* Year-based projects list (/estimation/projects/2026) OR single-param project opens (/estimation/projects/:id) */}
      <Route
        path="/estimation/projects/:yearOrId"
        element={withLoader(
          <ProjectsOrCanvasDispatcher
            projects={projects}
            activeProjectYear={activeProjectYear}
            setActiveProjectYear={setActiveProjectYear}
            setSelectedProjectId={setSelectedProjectId}
            setSelectedCanvasId={setSelectedCanvasId}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            selectedCanvasId={selectedCanvasId}
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
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
            remove={modals.remove}
          />
        )}
      />

      {/* Nested project opens: /estimation/projects/:year/:id */}
      <Route
        path="/estimation/projects/:year/:id"
        element={withLoader(
          <CanvasRouteWrapper
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
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
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
          />
        )}
      />

      {/* Backwards compatibility for old /home/projects URLs */}
      <Route
        path="/home/projects"
        element={<Navigate to={`/estimation/projects/${activeProjectYear || "2026"}`} replace />}
      />
      <Route
        path="/home/projects/:yearOrId"
        element={withLoader(
          <ProjectsOrCanvasDispatcher
            projects={projects}
            activeProjectYear={activeProjectYear}
            setActiveProjectYear={setActiveProjectYear}
            setSelectedProjectId={setSelectedProjectId}
            setSelectedCanvasId={setSelectedCanvasId}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            selectedCanvasId={selectedCanvasId}
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
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
            remove={modals.remove}
          />
        )}
      />
      <Route
        path="/home/projects/:year/:id"
        element={withLoader(
          <CanvasRouteWrapper
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
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
            setSelectedCanvasId={setSelectedCanvasId}
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
          />
        )}
      />

      {/* Direct /projects/:id and /canvas/:id routes */}
      <Route
        path="/projects/:id"
        element={withLoader(
          <CanvasRouteWrapper
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
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
            setSelectedCanvasId={setSelectedCanvasId}
            interaction={canvasInteraction}
            takeoff={takeoff}
            openModal={modals.openModal}
          />
        )}
      />

      {/* 3. 2D Canvas Takeoff Screen */}
      <Route
        path="/canvas"
        element={withLoader(
          <CanvasRouteWrapper
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
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
            setSelectedCanvasId={setSelectedCanvasId}
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

      {/* 8. Assemblies Routes */}
      <Route
        path="/assemblies"
        element={withLoader(<AssemblyRouteWrapper state={state} />)}
      />
      <Route
        path="/assemblies/:systemOrId"
        element={withLoader(<AssemblyRouteWrapper state={state} />)}
      />
      <Route
        path="/assemblies/:systemOrId/:assemblyId"
        element={withLoader(<AssemblyRouteWrapper state={state} />)}
      />

      {/* 9. Projects Under Execution Routes */}
      <Route
        path="/execution"
        element={withLoader(<ExecutionRouteWrapper state={state} />)}
      />
      <Route
        path="/execution/:projectId"
        element={withLoader(<ExecutionRouteWrapper state={state} />)}
      />

      {/* 10. Execution Workspace Route */}
      <Route
        path="/execution/workspace"
        element={withLoader(<ExecutionWorkspaceRouteWrapper state={state} />)}
      />

      {/* 11. Excel Spreadsheet Route */}
      <Route path="/excel" element={<ExcelWorkspace />} />

      {/* 12. Admin & Access Control (Manage users & roles) */}
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminBackofficeLayout />
          </AdminRouteGuard>
        }
      />
      <Route
        path="/admin/:tab"
        element={
          <AdminRouteGuard>
            <AdminBackofficeLayout />
          </AdminRouteGuard>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
