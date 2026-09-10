import type {
  Assembly,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ManpowerCost,
  MarkupRate,
  Material,
  Project,
  Screen,
  ShippingCost,
  ShippingType,
} from "../domain/types";
import { Icon } from "../design-system/Icon";
import { PriceBook } from "../modules/catalog/ui/PriceBook/PriceBook";
import { CostingFinancials } from "../modules/costing/ui/CostingFinancials";
import { Library } from "../modules/catalog/ui/Library";
import { AssemblyLibrary } from "../modules/catalog/ui/AssemblyLibrary";
import { ProjectsScreen } from "../modules/projects/ui/ProjectsScreen";
import { CanvasScreen } from "../modules/projects/ui/CanvasScreen";
import { ExcelWorkspace } from "../modules/workspace/ui/ExcelWorkspace";
import type { usePriceBookState } from "../modules/catalog/application/usePriceBookState";
import type { useModalManager } from "../modules/catalog/application/useModalManager";
import type { useCanvasInteraction } from "../modules/projects/application/useCanvasInteraction";
import type { useCanvasTakeoff } from "../modules/projects/application/useCanvasTakeoff";

export type AppScreensProps = {
  screen: Screen;
  activeDatabaseId: string;
  activeAssemblySystem: "technal" | "sidem";
  companyDatabases: CompanyDatabase[];
  companyPriceTables: CompanyPriceTable[];
  movedOriginalPriceTableIds: string[];
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  assemblies: Assembly[];
  componentDatabases: ComponentDatabase[];
  weightRates: Record<string, number>;
  setWeightRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  shippingTypes: ShippingType[];
  setShippingTypes: React.Dispatch<React.SetStateAction<ShippingType[]>>;
  shippingRateForType: (typeId?: string) => number;
  shippingRateForMaterial: (material: Material) => number;
  markupRates: MarkupRate[];
  setMarkupRates: React.Dispatch<React.SetStateAction<MarkupRate[]>>;
  manpowerCurrency: string;
  setManpowerCurrency: React.Dispatch<React.SetStateAction<string>>;
  manpowerCosts: ManpowerCost[];
  setManpowerCosts: React.Dispatch<React.SetStateAction<ManpowerCost[]>>;
  shippingCosts: ShippingCost[];
  setShippingCosts: React.Dispatch<React.SetStateAction<ShippingCost[]>>;
  priceBook: ReturnType<typeof usePriceBookState>;
  modals: ReturnType<typeof useModalManager>;
  activeDatabase: { eyebrow: string; title: string; description: string };
  filtered: Material[];
  materialView: "list" | "cards";
  setMaterialView: (v: "list" | "cards") => void;
  setMaterialDatabaseOverride: (id: string | null) => void;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  assemblyTypeFilter: string;
  setAssemblyTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  solealAccessoryMaterials: () => Material[];
  solealProfileMaterials: (databaseId: string) => Material[];
  materialDatabaseReference: (material: Material) => string;
  activeProjectYear: string;
  projects: Project[];
  selectedProject?: Project;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string>>;
  selectedCanvasId: string;
  setSelectedCanvasId: React.Dispatch<React.SetStateAction<string>>;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setScreen: (screen: Screen) => void;
  updateProject: (updater: (project: Project) => Project) => void;
  undoCanvasChange: () => void;
  redoCanvasChange: () => void;
  undoProjectHistory: Project[];
  redoProjectHistory: Project[];
  canvasInteraction: ReturnType<typeof useCanvasInteraction>;
  takeoff: ReturnType<typeof useCanvasTakeoff>;
};

export function AppScreens({
  screen,
  activeDatabaseId,
  activeAssemblySystem,
  companyDatabases,
  companyPriceTables,
  movedOriginalPriceTableIds,
  materials,
  setMaterials,
  assemblies,
  componentDatabases,
  weightRates,
  setWeightRates,
  shippingTypes,
  setShippingTypes,
  shippingRateForType,
  shippingRateForMaterial,
  markupRates,
  setMarkupRates,
  manpowerCurrency,
  setManpowerCurrency,
  manpowerCosts,
  setManpowerCosts,
  shippingCosts,
  setShippingCosts,
  priceBook,
  modals,
  activeDatabase,
  filtered,
  materialView,
  setMaterialView,
  setMaterialDatabaseOverride,
  search,
  setSearch,
  assemblyTypeFilter,
  setAssemblyTypeFilter,
  solealAccessoryMaterials,
  solealProfileMaterials,
  materialDatabaseReference,
  activeProjectYear,
  projects,
  selectedProject,
  setSelectedProjectId,
  selectedCanvasId,
  setSelectedCanvasId,
  selectedItemId,
  setSelectedItemId,
  setScreen,
  updateProject,
  undoCanvasChange,
  redoCanvasChange,
  undoProjectHistory,
  redoProjectHistory,
  canvasInteraction,
  takeoff,
}: AppScreensProps) {
  return (
    <>
      {(screen === "database" || screen === "stock") &&
        (activeDatabaseId === "prices" ||
        companyDatabases.some((database) => database.id === activeDatabaseId) ? (
          <PriceBook
            view={screen === "stock" ? "stock" : "prices"}
            materials={materials}
            setMaterials={setMaterials}
            assemblies={assemblies}
            companyDatabases={companyDatabases}
            companyPriceTables={companyPriceTables}
            movedOriginalPriceTableIds={movedOriginalPriceTableIds}
            activeDatabaseId={activeDatabaseId}
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
            tableStyle={{}}
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
        ) : screen === "database" && activeDatabaseId === "costing-financials" ? (
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
        ) : screen === "database" ? (
          <Library
            type="material"
            activeDatabaseId={activeDatabaseId}
            activeDatabase={activeDatabase}
            filtered={filtered}
            setMaterials={setMaterials}
            openModal={modals.openModal}
            setMaterialDatabaseOverride={setMaterialDatabaseOverride}
            search={search}
            setSearch={setSearch}
            tableZoom={priceBook.tableZoom}
            tableStyle={{}}
            zoomTable={priceBook.zoomTable}
            materialView={materialView}
            setMaterialView={setMaterialView}
            remove={modals.remove}
          />
        ) : null)}

      {screen === "assemblies" && (
        <AssemblyLibrary
          activeAssemblySystem={activeAssemblySystem}
          activeDatabaseId={activeDatabaseId}
          componentDatabases={componentDatabases}
          search={search}
          setSearch={setSearch}
          assemblies={assemblies}
          openModal={modals.openModal}
          remove={modals.remove}
        />
      )}

      {screen === "projects" && (
        <ProjectsScreen
          activeProjectYear={activeProjectYear}
          projects={projects}
          openModal={modals.openModal}
          remove={modals.remove}
          onOpenProject={(projectId, canvasId) => {
            setSelectedProjectId(projectId);
            setSelectedCanvasId(canvasId);
            setScreen("canvas");
          }}
        />
      )}

      {screen === "canvas" && selectedProject && (
        <CanvasScreen
          project={selectedProject}
          materials={materials}
          assemblies={assemblies}
          onNavigateToProjects={() => setScreen("projects")}
          onOpenProjectDetails={() => modals.openModal("project", selectedProject.id)}
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
        />
      )}

      {screen === "excel" && <ExcelWorkspace />}
    </>
  );
}
