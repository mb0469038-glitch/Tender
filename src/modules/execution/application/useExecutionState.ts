import { FormEvent, useState } from "react";
import type {
  Assembly,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ExecutionProject,
  ExecutionProjectFile,
  Material,
} from "../../../domain/types";
import { ExecutionWorkspacePage, makeId } from "../../catalog/domain/catalogDefinitions";

type UseExecutionStateParams = {
  materials: Material[];
  assemblies: Assembly[];
  componentDatabases: ComponentDatabase[];
  companyDatabases: CompanyDatabase[];
  companyPriceTables: CompanyPriceTable[];
  movedOriginalPriceTableIds: string[];
  setScreen: (screen: any) => void;
};

export function useExecutionState({
  materials,
  assemblies,
  componentDatabases,
  companyDatabases,
  companyPriceTables,
  movedOriginalPriceTableIds,
  setScreen,
}: UseExecutionStateParams) {
  const [executionProjects, setExecutionProjects] = useState<ExecutionProject[]>([]);
  const [selectedExecutionProjectId, setSelectedExecutionProjectId] = useState("");
  const [executionFolderId, setExecutionFolderId] = useState<string | null>(null);
  const [selectedExecutionWorkspaceId, setSelectedExecutionWorkspaceId] = useState("");
  const [executionWorkspacePage, setExecutionWorkspacePage] = useState<ExecutionWorkspacePage>("cutting-list");
  const [workspaceStockDatabaseId, setWorkspaceStockDatabaseId] = useState("prices");
  const [workspaceStockSearch, setWorkspaceStockSearch] = useState("");
  const [workspaceStockAssemblyType, setWorkspaceStockAssemblyType] = useState("");
  const [workspaceOptimizationError, setWorkspaceOptimizationError] = useState("");
  const [newExecutionItemType, setNewExecutionItemType] = useState<"folder" | "optimization-material-order" | null>(null);
  const [newExecutionItemName, setNewExecutionItemName] = useState("");
  const [executionNewMenuOpen, setExecutionNewMenuOpen] = useState(false);

  const copyExecutionProject = (id: string) => {
    setExecutionProjects((items) => {
      const source = items.find((item) => item.id === id);
      if (!source) return items;
      const idMap = new Map((source.files ?? []).map((file) => [file.id, makeId()]));
      const files = (source.files ?? []).map((file) => ({
        ...file,
        id: idMap.get(file.id)!,
        parentId: file.parentId ? idMap.get(file.parentId) ?? null : null,
      }));
      return [
        {
          ...source,
          id: makeId(),
          name: `${source.name} copy`,
          createdAt: new Date().toISOString(),
          files,
        },
        ...items,
      ];
    });
  };

  const removeExecutionProject = (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setExecutionProjects((items) => items.filter((item) => item.id !== id));
  };

  const openExecutionProject = (id: string) => {
    setSelectedExecutionProjectId(id);
    setExecutionFolderId(null);
    setScreen("execution-project-detail");
  };

  const openExecutionWorkspace = (fileId: string) => {
    setSelectedExecutionWorkspaceId(fileId);
    setExecutionWorkspacePage("cutting-list");
    setWorkspaceStockDatabaseId("prices");
    setWorkspaceStockSearch("");
    setWorkspaceStockAssemblyType("");
    setWorkspaceOptimizationError("");
    setScreen("execution-workspace");
  };

  const createExecutionProjectItem = (event: FormEvent) => {
    event.preventDefault();
    const name = newExecutionItemName.trim();
    if (!name || !newExecutionItemType || !selectedExecutionProjectId) return;
    const createdAt = new Date().toISOString();
    const item: ExecutionProjectFile = {
      id: makeId(),
      name,
      type: newExecutionItemType,
      parentId: executionFolderId,
      createdAt,
      stockSnapshot:
        newExecutionItemType === "optimization-material-order"
          ? {
              materials: JSON.parse(JSON.stringify(materials)) as Material[],
              assemblies: JSON.parse(JSON.stringify(assemblies)),
              componentDatabases: JSON.parse(JSON.stringify(componentDatabases)),
              companyDatabases: JSON.parse(JSON.stringify(companyDatabases)),
              companyPriceTables: JSON.parse(JSON.stringify(companyPriceTables)),
              movedOriginalPriceTableIds: JSON.parse(JSON.stringify(movedOriginalPriceTableIds)),
              capturedAt: createdAt,
            }
          : undefined,
      optimization:
        newExecutionItemType === "optimization-material-order"
          ? {
              stockLength: 6000,
              kerf: 3,
              trim: 10,
              arrangements: 1000,
              cuts: [],
              recommendationMinimum: 4000,
              recommendationMaximum: 8000,
              recommendationIncrement: 100,
            }
          : undefined,
    };
    setExecutionProjects((projects) =>
      projects.map((project) =>
        project.id === selectedExecutionProjectId ? { ...project, files: [...(project.files ?? []), item] } : project
      )
    );
    setNewExecutionItemType(null);
    setNewExecutionItemName("");
  };

  const removeExecutionProjectItem = (id: string) => {
    if (!confirm("Delete this item? Folders and everything inside them will be deleted.")) return;
    setExecutionProjects((projects) =>
      projects.map((project) => {
        if (project.id !== selectedExecutionProjectId) return project;
        const deletedIds = new Set([id]);
        let foundChild = true;
        while (foundChild) {
          foundChild = false;
          (project.files ?? []).forEach((item) => {
            if (item.parentId && deletedIds.has(item.parentId) && !deletedIds.has(item.id)) {
              deletedIds.add(item.id);
              foundChild = true;
            }
          });
        }
        return { ...project, files: (project.files ?? []).filter((item) => !deletedIds.has(item.id)) };
      })
    );
  };

  return {
    executionProjects,
    setExecutionProjects,
    selectedExecutionProjectId,
    setSelectedExecutionProjectId,
    executionFolderId,
    setExecutionFolderId,
    selectedExecutionWorkspaceId,
    setSelectedExecutionWorkspaceId,
    executionWorkspacePage,
    setExecutionWorkspacePage,
    workspaceStockDatabaseId,
    setWorkspaceStockDatabaseId,
    workspaceStockSearch,
    setWorkspaceStockSearch,
    workspaceStockAssemblyType,
    setWorkspaceStockAssemblyType,
    workspaceOptimizationError,
    setWorkspaceOptimizationError,
    newExecutionItemType,
    setNewExecutionItemType,
    newExecutionItemName,
    setNewExecutionItemName,
    executionNewMenuOpen,
    setExecutionNewMenuOpen,
    copyExecutionProject,
    removeExecutionProject,
    openExecutionProject,
    openExecutionWorkspace,
    createExecutionProjectItem,
    removeExecutionProjectItem,
  };
}
