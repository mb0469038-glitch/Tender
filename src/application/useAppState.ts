import { useMemo, useState } from "react";
import type { Screen, Project, Material } from "../domain/types";
import { useSession } from "../modules/auth/ui/SessionContext";
import { databaseDefinitions } from "../modules/catalog/domain/catalogDefinitions";
import { withTechnalSeed } from "../modules/catalog/domain/technalSeed";
import { materialData, assemblyData } from "../modules/catalog/domain/sampleData";
import { projectData } from "../modules/projects/domain/projectDefaults";
import { useCatalogItemsState } from "../modules/catalog/application/useCatalogItemsState";
import { useProjectsState } from "../modules/projects/application/useProjectsState";
import { useMaterialDatabasesState } from "../modules/catalog/application/useMaterialDatabasesState";
import { useCostingState } from "../modules/costing/application/useCostingState";
import { useExecutionState } from "../modules/execution/application/useExecutionState";
import { usePriceBookState } from "../modules/catalog/application/usePriceBookState";
import { useWorkspacePersistence } from "../modules/workspace/application/useWorkspacePersistence";
import { useModalManager } from "../modules/catalog/application/useModalManager";
import { useCanvasInteraction } from "../modules/projects/application/useCanvasInteraction";
import { useCanvasTakeoff } from "../modules/projects/application/useCanvasTakeoff";
import {
  recheckCombinationJoins as recheckCombinationJoinsPure,
  synchronizeCombinationDetails as synchronizeCombinationDetailsPure,
} from "../modules/projects/domain/joinEngine";
import {
  calculatePartQuantity as calculatePartQuantityPure,
  formulaValuesForItem as formulaValuesForItemPure,
  frameTypeForItem as frameTypeForItemPure,
} from "../modules/costing/domain/quantityEngine";
import {
  materialDatabaseReference as materialDatabaseReferencePure,
  solealAccessoryMaterials as solealAccessoryMaterialsPure,
  solealProfileMaterials as solealProfileMaterialsPure,
} from "../modules/catalog/domain/materialReference";

const cloneProject = (value: Project) => JSON.parse(JSON.stringify(value)) as Project;

export function useAppState() {
  const { permissions } = useSession();
  const [screen, setScreen] = useState<Screen>("projects");
  const initialSeed = useMemo(() => withTechnalSeed(materialData, assemblyData), []);
  const { materials, setMaterials, assemblies, setAssemblies } = useCatalogItemsState(
    initialSeed.materials,
    initialSeed.assemblies
  );
  const {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedCanvasId,
    setSelectedCanvasId,
    selectedItemId,
    setSelectedItemId,
    copiedCanvasItem,
    setCopiedCanvasItem,
    undoProjectHistory,
    setUndoProjectHistory,
    redoProjectHistory,
    setRedoProjectHistory,
  } = useProjectsState(projectData);
  const {
    componentDatabases,
    setComponentDatabases,
    weightRates,
    setWeightRates,
    companyDatabases,
    setCompanyDatabases,
    companyPriceTables,
    setCompanyPriceTables,
    movedOriginalPriceTableIds,
    setMovedOriginalPriceTableIds,
  } = useMaterialDatabasesState();
  const {
    markupRates,
    setMarkupRates,
    manpowerCurrency,
    setManpowerCurrency,
    manpowerCosts,
    setManpowerCosts,
    shippingTypes,
    setShippingTypes,
    shippingCosts,
    setShippingCosts,
    shippingRateForType,
    shippingRateForMaterial,
  } = useCostingState();

  const execution = useExecutionState({
    materials,
    assemblies,
    componentDatabases,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
    setScreen,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [databaseOpen, setDatabaseOpen] = useState(true);
  const [assembliesOpen, setAssembliesOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [activeAssemblySystem, setActiveAssemblySystem] = useState<"technal" | "sidem">("technal");
  const [activeProjectYear, setActiveProjectYear] = useState("2026");
  const [activeDatabaseId, setActiveDatabaseId] = useState("prices");
  const [search, setSearch] = useState("");
  const [assemblyTypeFilter, setAssemblyTypeFilter] = useState("");
  const [materialView, setMaterialView] = useState<"list" | "cards">("list");
  const [materialDatabaseOverride, setMaterialDatabaseOverride] = useState<string | null>(null);
  const [companyMaterialTableId, setCompanyMaterialTableId] = useState<string | null>(null);
  const [priceInsertAfterMaterialId, setPriceInsertAfterMaterialId] = useState<string | null>(null);
  const [fynAssemblyMaterialTemplateVersion, setFynAssemblyMaterialTemplateVersion] = useState(1);

  const priceBook = usePriceBookState({
    materials,
    setMaterials,
    assemblies,
    setAssemblies,
    projects,
    setProjects,
    weightRates,
    setWeightRates,
    screen,
  });

  const persistence = useWorkspacePersistence({
    materials,
    setMaterials,
    assemblies,
    setAssemblies,
    projects,
    setProjects,
    setSelectedProjectId,
    executionProjects: execution.executionProjects,
    setExecutionProjects: execution.setExecutionProjects,
    componentDatabases,
    setComponentDatabases,
    weightRates,
    setWeightRates,
    markupRates,
    setMarkupRates,
    manpowerCurrency,
    setManpowerCurrency,
    manpowerCosts,
    setManpowerCosts,
    shippingTypes,
    setShippingTypes,
    shippingCosts,
    setShippingCosts,
    fynAssemblyMaterialTemplateVersion,
    setFynAssemblyMaterialTemplateVersion,
    companyDatabases,
    setCompanyDatabases,
    companyPriceTables,
    setCompanyPriceTables,
    movedOriginalPriceTableIds,
    setMovedOriginalPriceTableIds,
    screen,
    recheckCombinationJoins: (items) =>
      recheckCombinationJoinsPure(items, assemblies, (item) =>
        frameTypeForItemPure(item, assemblies, materials, selectedProject?.items ?? [])
      ),
    synchronizeCombinationDetails: (items) => synchronizeCombinationDetailsPure(items, assemblies),
  });

  const modals = useModalManager({
    materials,
    setMaterials,
    assemblies,
    setAssemblies,
    projects,
    setProjects,
    executionProjects: execution.executionProjects,
    setExecutionProjects: execution.setExecutionProjects,
    companyDatabases,
    setCompanyDatabases,
    companyPriceTables,
    setCompanyPriceTables,
    componentDatabases,
    setComponentDatabases,
    activeDatabaseId,
    setActiveDatabaseId,
    activeAssemblySystem,
    activeProjectYear: Number(activeProjectYear) || 2026,
    setSelectedProjectId,
    setSelectedCanvasId,
    setScreen,
    screen,
    permissions,
    recordPriceChange: priceBook.recordPriceChange,
    materialDatabaseOverride,
    setMaterialDatabaseOverride,
    companyMaterialTableId,
    setCompanyMaterialTableId,
    priceInsertAfterMaterialId,
    setPriceInsertAfterMaterialId,
  });

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const updateProject = (updater: (project: Project) => Project) => {
    setProjects((items) => items.map((p) => (p.id === selectedProjectId ? updater(p) : p)));
  };

  const undoCanvasChange = () => {
    const previous = undoProjectHistory[undoProjectHistory.length - 1];
    if (!previous || !selectedProject) return;
    setRedoProjectHistory((history) => [...history, cloneProject(selectedProject)].slice(-100));
    setUndoProjectHistory((history) => history.slice(0, -1));
    setProjects((items) => items.map((item) => (item.id === selectedProject.id ? cloneProject(previous) : item)));
    setSelectedItemId(null);
  };

  const redoCanvasChange = () => {
    const next = redoProjectHistory[redoProjectHistory.length - 1];
    if (!next || !selectedProject) return;
    setUndoProjectHistory((history) => [...history, cloneProject(selectedProject)].slice(-100));
    setRedoProjectHistory((history) => history.slice(0, -1));
    setProjects((items) => items.map((item) => (item.id === selectedProject.id ? cloneProject(next) : item)));
    setSelectedItemId(null);
  };

  const takeoff = useCanvasTakeoff({
    project: selectedProject,
    materials,
    assemblies,
    selectedCanvasId,
    itemMaterialPanelId: null,
    calculatePartQuantity: (item, part, material) =>
      calculatePartQuantityPure(item, part, material, assemblies, materials, selectedProject?.items ?? []),
    formulaValuesForItem: (item) =>
      formulaValuesForItemPure(item, materials, selectedProject?.items ?? []),
    materialDatabaseReference: (m) => materialDatabaseReferencePure(m, materials, companyPriceTables),
    shippingRateForMaterial,
    shippingTypes,
    shippingCosts,
    manpowerCosts,
    markupRates,
  });

  const canvasInteraction = useCanvasInteraction({
    project: selectedProject,
    setProjects,
    selectedProjectId,
    updateProject,
    undoProjectHistory,
    redoProjectHistory,
    setUndoProjectHistory,
    setRedoProjectHistory,
    undoCanvasChange,
    redoCanvasChange,
    copiedCanvasItem,
    setCopiedCanvasItem,
    materials,
    assemblies,
    selectedItemId,
    setSelectedItemId,
    selectedCanvasId,
    setSelectedCanvasId,
    frameTypeForItem: (item) =>
      frameTypeForItemPure(item, assemblies, materials, selectedProject?.items ?? []),
    formulaValuesForItem: (item) =>
      formulaValuesForItemPure(item, materials, selectedProject?.items ?? []),
    isCanvasActive: screen === "canvas",
  });

  const activeDatabase = databaseDefinitions[activeDatabaseId] ?? (() => {
    const database = componentDatabases.find((item) => item.id === activeDatabaseId);
    const parentName = database?.parent === "technal" ? "Technal" : "Sidem";
    return {
      title: `${parentName} — ${database?.name ?? "Component"}`,
      eyebrow: `Database / ${parentName}`,
      description: `Materials used only by the ${database?.name ?? "selected"} component.`,
    };
  })();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter(
      (x) =>
        (activeDatabaseId === "prices" || x.databaseId === activeDatabaseId) &&
        `${x.name} ${x.code}`.toLowerCase().includes(q)
    );
  }, [search, materials, activeDatabaseId]);

  const solealAccessoryMaterials = () => solealAccessoryMaterialsPure(materials);
  const solealProfileMaterials = (databaseId: string) => solealProfileMaterialsPure(databaseId, materials);
  const materialDatabaseReference = (material: Material) =>
    materialDatabaseReferencePure(material, materials, companyPriceTables);

  return {
    permissions,
    screen,
    setScreen,
    materials,
    setMaterials,
    assemblies,
    setAssemblies,
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedCanvasId,
    setSelectedCanvasId,
    selectedItemId,
    setSelectedItemId,
    selectedProject,
    updateProject,
    undoCanvasChange,
    redoCanvasChange,
    undoProjectHistory,
    redoProjectHistory,
    componentDatabases,
    setComponentDatabases,
    weightRates,
    setWeightRates,
    companyDatabases,
    setCompanyDatabases,
    companyPriceTables,
    setCompanyPriceTables,
    movedOriginalPriceTableIds,
    setMovedOriginalPriceTableIds,
    markupRates,
    setMarkupRates,
    manpowerCurrency,
    setManpowerCurrency,
    manpowerCosts,
    setManpowerCosts,
    shippingTypes,
    setShippingTypes,
    shippingCosts,
    setShippingCosts,
    shippingRateForType,
    shippingRateForMaterial,
    execution,
    sidebarCollapsed,
    setSidebarCollapsed,
    databaseOpen,
    setDatabaseOpen,
    assembliesOpen,
    setAssembliesOpen,
    projectsOpen,
    setProjectsOpen,
    activeAssemblySystem,
    setActiveAssemblySystem,
    activeProjectYear,
    setActiveProjectYear,
    activeDatabaseId,
    setActiveDatabaseId,
    search,
    setSearch,
    assemblyTypeFilter,
    setAssemblyTypeFilter,
    materialView,
    setMaterialView,
    materialDatabaseOverride,
    setMaterialDatabaseOverride,
    companyMaterialTableId,
    setCompanyMaterialTableId,
    priceInsertAfterMaterialId,
    setPriceInsertAfterMaterialId,
    fynAssemblyMaterialTemplateVersion,
    setFynAssemblyMaterialTemplateVersion,
    priceBook,
    persistence,
    modals,
    takeoff,
    canvasInteraction,
    activeDatabase,
    filtered,
    solealAccessoryMaterials,
    solealProfileMaterials,
    materialDatabaseReference,
  };
}
