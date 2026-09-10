import { Dispatch, SetStateAction, useState } from "react";
import { number } from "../../../domain/calculations";
import type {
  Assembly,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ExecutionProject,
  ExecutionProjectFile,
  Material,
} from "../../../domain/types";
import { Icon } from "../../../design-system/Icon";
import { Sketch } from "../../../design-system/Sketch";
import { ProfileMenu } from "../../auth/ui/ProfileMenu";
import {
  ExecutionWorkspacePage,
  makeId,
  SOLEAL_JOINTS_DATABASE,
  TECHNAL_FY_DATABASE,
  TECHNAL_FYN_DATABASE,
  TECHNAL_GY_DATABASE,
  TECHNAL_GYN_DATABASE,
} from "../../catalog/domain/catalogDefinitions";
import {
  optimizeCuts,
  recommendStockLength,
  OptimizationCut,
} from "../domain/cuttingOptimizer";
import { CuttingListSpreadsheet } from "./CuttingListSpreadsheet";

type ExecutionWorkspaceScreenProps = {
  project: ExecutionProject;
  workspace: ExecutionProjectFile;
  setExecutionProjects: Dispatch<SetStateAction<ExecutionProject[]>>;
  executionWorkspacePage: ExecutionWorkspacePage;
  setExecutionWorkspacePage: (page: ExecutionWorkspacePage) => void;
  workspaceStockDatabaseId: string;
  setWorkspaceStockDatabaseId: (id: string) => void;
  workspaceStockSearch: string;
  setWorkspaceStockSearch: (s: string) => void;
  workspaceStockAssemblyType: string;
  setWorkspaceStockAssemblyType: (s: string) => void;
  workspaceOptimizationError: string;
  setWorkspaceOptimizationError: (s: string) => void;
  setScreen: (screen: any) => void;
  materials: Material[];
  assemblies: Assembly[];
  componentDatabases: ComponentDatabase[];
  companyDatabases: CompanyDatabase[];
  companyPriceTables: CompanyPriceTable[];
  movedOriginalPriceTableIds: string[];
};

export function ExecutionWorkspaceScreen({
  project,
  workspace,
  setExecutionProjects,
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
  setScreen,
  materials,
  assemblies,
  componentDatabases,
  companyDatabases,
  companyPriceTables,
  movedOriginalPriceTableIds,
}: ExecutionWorkspaceScreenProps) {
  const [stockLengthMenu, setStockLengthMenu] = useState<{ materialId: string; entryId: string } | null>(null);

  const pages: { id: ExecutionWorkspacePage; label: string; description: string }[] = [
    { id: "cutting-list", label: "Cutting list", description: "Prepare and review the cutting list for this project." },
    { id: "optimization", label: "Optimization", description: "Plan the best use of material lengths and reduce waste." },
    { id: "material-order", label: "Material order", description: "Prepare the materials required for this project." },
    { id: "database", label: "Database", description: "Manage the materials and reference data used by this workspace." },
  ];
  const currentPage = pages.find((page) => page.id === executionWorkspacePage) ?? pages[0];
  const stockSnapshot = workspace.stockSnapshot;

  const snapshotMaterials = stockSnapshot?.materials ?? [];
  const snapshotAssemblies = stockSnapshot?.assemblies ?? [];
  const snapshotCompanyDatabases = stockSnapshot?.companyDatabases ?? [];
  const snapshotCompanyPriceTables = stockSnapshot?.companyPriceTables ?? [];
  const snapshotMovedOriginalPriceTableIds = stockSnapshot?.movedOriginalPriceTableIds ?? [];
  const stockTabs = [
    { id: "prices", label: "Soleal Database" },
    ...snapshotCompanyDatabases.map((database) => ({ id: database.id, label: `${database.name} Database` })),
  ];
  const activeWorkspaceStockDatabase = stockTabs.some((tab) => tab.id === workspaceStockDatabaseId)
    ? workspaceStockDatabaseId
    : "prices";

  const assemblyUsageByMaterial = new Map<string, string[]>();
  snapshotAssemblies.forEach((assembly) =>
    assembly.parts.forEach((part) => {
      const usage = assemblyUsageByMaterial.get(part.materialId) ?? [];
      if (!usage.includes(assembly.name)) usage.push(assembly.name);
      assemblyUsageByMaterial.set(part.materialId, usage);
    })
  );
  const snapshotAssemblyTypeNames = [
    ...new Set(snapshotAssemblies.filter((assembly) => assembly.parts.length > 0).map((assembly) => assembly.name)),
  ].sort((a, b) => a.localeCompare(b));
  const stockSearch = workspaceStockSearch.trim().toLocaleLowerCase();

  const snapshotRowsFor = (databaseId: string) =>
    snapshotMaterials.filter(
      (material) =>
        material.databaseId === databaseId &&
        (!workspaceStockAssemblyType || (assemblyUsageByMaterial.get(material.id) ?? []).includes(workspaceStockAssemblyType)) &&
        (!stockSearch ||
          [material.name, material.code, material.category, material.manufacturer]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(stockSearch))
    );

  const snapshotGeneralRowsFor = (group: "others" | "profiles" | "accessories") =>
    snapshotRowsFor("markups").filter((material) =>
      group === "others" ? !material.priceTable || material.priceTable === "general" : material.priceTable === group
    );

  const snapshotGroupedRowsFor = (databaseId: string, group: "profiles" | "accessories", legacyProfileCount = 7) => {
    const allRows = snapshotMaterials.filter((material) => material.databaseId === databaseId);
    const legacyProfileIds = new Set(
      allRows
        .filter((material) => !material.priceTable)
        .slice(0, legacyProfileCount)
        .map((material) => material.id)
    );
    return snapshotRowsFor(databaseId).filter((material) =>
      material.priceTable === group ||
      (!material.priceTable && (group === "profiles" ? legacyProfileIds.has(material.id) : !legacyProfileIds.has(material.id)))
    );
  };

  const snapshotHasLegacyMovedOthers = snapshotCompanyPriceTables.some(
    (table) =>
      table.companyDatabaseId !== "prices" &&
      table.name.trim().toLowerCase() === "others" &&
      table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === "g"
  );

  const stockTables =
    activeWorkspaceStockDatabase === "prices"
      ? [
          ...snapshotCompanyPriceTables
            .filter((table) => table.companyDatabaseId === "prices")
            .map((table) => ({
              id: `company-${table.id}`,
              title: table.name,
              note: "Materials in this shared Soleal database table.",
              rows: snapshotRowsFor("prices").filter((material) => material.companyTableId === table.id),
              prefix: `${table.referencePrefix}-`,
              section: "price-technal",
            })),
          ...(!snapshotMovedOriginalPriceTableIds.includes("general-others") && !snapshotHasLegacyMovedOthers
            ? [
                {
                  id: "general-others",
                  title: "Others",
                  note: "Miscellaneous general items.",
                  rows: snapshotGeneralRowsFor("others"),
                  prefix: "G-",
                  section: "price-general",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("general-profiles")
            ? [
                {
                  id: "general-profiles",
                  title: "General ALU profiles",
                  note: "General aluminium profiles.",
                  rows: snapshotGeneralRowsFor("profiles"),
                  prefix: "GP-",
                  section: "price-general",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("general-accessories")
            ? [
                {
                  id: "general-accessories",
                  title: "General ALU accessories",
                  note: "General aluminium accessories.",
                  rows: snapshotGeneralRowsFor("accessories"),
                  prefix: "GA-",
                  section: "price-general",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("gyn-profiles")
            ? [
                {
                  id: "gyn-profiles",
                  title: "GYn · ALU profiles",
                  note: "Soleal GYn aluminium profiles.",
                  rows: snapshotGroupedRowsFor(TECHNAL_GYN_DATABASE, "profiles"),
                  prefix: "GYn-",
                  section: "price-technal",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("gy-profiles")
            ? [
                {
                  id: "gy-profiles",
                  title: "GY · ALU profiles",
                  note: "Soleal GY aluminium profiles.",
                  rows: snapshotGroupedRowsFor(TECHNAL_GY_DATABASE, "profiles"),
                  prefix: "GY-",
                  section: "price-technal",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("fyn-profiles")
            ? [
                {
                  id: "fyn-profiles",
                  title: "FYn · ALU profiles",
                  note: "Soleal FYn aluminium profiles.",
                  rows: snapshotGroupedRowsFor(TECHNAL_FYN_DATABASE, "profiles"),
                  prefix: "FYn-",
                  section: "price-technal",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("fy-profiles")
            ? [
                {
                  id: "fy-profiles",
                  title: "FY · ALU profiles",
                  note: "Soleal FY aluminium profiles.",
                  rows: snapshotGroupedRowsFor(TECHNAL_FY_DATABASE, "profiles"),
                  prefix: "FY-",
                  section: "price-technal",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("soleal-accessories")
            ? [
                {
                  id: "soleal-accessories",
                  title: "Accessories",
                  note: "Accessories for all Soleal doors and windows systems.",
                  rows: [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].flatMap(
                    (databaseId) => snapshotGroupedRowsFor(databaseId, "accessories")
                  ),
                  prefix: "A-",
                  section: "price-technal",
                },
              ]
            : []),
          ...(!snapshotMovedOriginalPriceTableIds.includes("soleal-joints")
            ? [
                {
                  id: "soleal-joints",
                  title: "Joints",
                  note: "Joints for all Soleal doors and windows systems.",
                  rows: snapshotRowsFor(SOLEAL_JOINTS_DATABASE),
                  prefix: "J-",
                  section: "price-technal",
                },
              ]
            : []),
        ]
      : snapshotCompanyPriceTables
          .filter((table) => table.companyDatabaseId === activeWorkspaceStockDatabase)
          .map((table) => ({
            id: table.id,
            title: table.name,
            note: `Materials in this ${snapshotCompanyDatabases.find((database) => database.id === activeWorkspaceStockDatabase)?.name ?? "company"} table.`,
            rows: snapshotRowsFor(activeWorkspaceStockDatabase).filter((material) => material.companyTableId === table.id),
            prefix: `${table.referencePrefix}-`,
            section: "price-technal",
          }));

  const stockMaterialCount = new Set(stockTables.flatMap((table) => table.rows.map((material) => material.id))).size;

  const stockEntriesFor = (material: Material) =>
    material.stockEntries?.length
      ? material.stockEntries
      : [{ id: "default", length: material.stockLength ?? 0, quantity: material.stockQuantity ?? 0 }];

  const saveWorkspaceStockEntries = (materialId: string, entries: { id: string; length: number; quantity: number }[]) => {
    if (!entries.length) return;
    setExecutionProjects((projects) =>
      projects.map((item) =>
        item.id !== project.id
          ? item
          : {
              ...item,
              files: item.files.map((file) =>
                file.id !== workspace.id || !file.stockSnapshot
                  ? file
                  : {
                      ...file,
                      stockSnapshot: {
                        ...file.stockSnapshot,
                        materials: file.stockSnapshot.materials.map((material) =>
                          material.id !== materialId
                            ? material
                            : {
                                ...material,
                                stockEntries: entries,
                                stockLength: entries[0].length,
                                stockQuantity: entries[0].quantity,
                              }
                        ),
                      },
                    }
              ),
            }
      )
    );
  };

  const saveWorkspaceMaterialMass = (materialId: string, value: string) => {
    const weight = Math.max(0, Number(value) || 0);
    setExecutionProjects((projects) =>
      projects.map((item) =>
        item.id !== project.id
          ? item
          : {
              ...item,
              files: item.files.map((file) =>
                file.id !== workspace.id || !file.stockSnapshot
                  ? file
                  : {
                      ...file,
                      stockSnapshot: {
                        ...file.stockSnapshot,
                        materials: file.stockSnapshot.materials.map((material) =>
                          material.id === materialId ? { ...material, weight } : material
                        ),
                      },
                    }
              ),
            }
      )
    );
  };

  const matchWorkspaceStockWithCurrent = () => {
    if (
      !confirm(
        `Match ${workspace.name} with the current Stock page? This replaces this workspace's saved stock tables, quantities, and mass with the current Stock values.`
      )
    )
      return;
    const capturedAt = new Date().toISOString();
    setExecutionProjects((projects) =>
      projects.map((item) =>
        item.id !== project.id
          ? item
          : {
              ...item,
              files: item.files.map((file) =>
                file.id !== workspace.id
                  ? file
                  : {
                      ...file,
                      stockSnapshot: {
                        materials: JSON.parse(JSON.stringify(materials)) as Material[],
                        assemblies: JSON.parse(JSON.stringify(assemblies)),
                        componentDatabases: JSON.parse(JSON.stringify(componentDatabases)),
                        companyDatabases: JSON.parse(JSON.stringify(companyDatabases)),
                        companyPriceTables: JSON.parse(JSON.stringify(companyPriceTables)),
                        movedOriginalPriceTableIds: JSON.parse(JSON.stringify(movedOriginalPriceTableIds)),
                        capturedAt,
                      },
                    }
              ),
            }
      )
    );
    setWorkspaceStockDatabaseId("prices");
    setWorkspaceStockSearch("");
    setWorkspaceStockAssemblyType("");
  };

  const profileMaterials = (() => {
    const all = snapshotMaterials.filter((material) => material.databaseId !== "glass");
    const lengthMaterials = all.filter((material) => ["m", "lm"].includes(material.unit.toLowerCase()));
    return (lengthMaterials.length ? lengthMaterials : all).sort((left, right) =>
      `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`)
    );
  })();

  const optimization = workspace.optimization ?? {
    stockLength: 6000,
    kerf: 3,
    trim: 10,
    arrangements: 1000,
    cuts: [],
    recommendationMinimum: 4000,
    recommendationMaximum: 8000,
    recommendationIncrement: 100,
  };

  const updateWorkspaceOptimization = (changes: Partial<NonNullable<ExecutionProjectFile["optimization"]>>) =>
    setExecutionProjects((projects) =>
      projects.map((item) =>
        item.id !== project.id
          ? item
          : {
              ...item,
              files: item.files.map((file) =>
                file.id !== workspace.id ? file : { ...file, optimization: { ...optimization, ...changes } }
              ),
            }
      )
    );

  const optimizationCutForMaterial = (material?: Material): OptimizationCut => ({
    id: makeId(),
    openingName: "",
    profileId: material?.id ?? "",
    profileName: material?.name ?? "",
    profileCode: material?.code ?? "",
    length: 0,
    quantity: 1,
    angle: 90,
  });

  const setOptimizationCuts = (cuts: OptimizationCut[]) =>
    updateWorkspaceOptimization({ cuts, result: undefined, recommendation: undefined });

  const updateOptimizationCut = (cutId: string, changes: Partial<OptimizationCut>) =>
    setOptimizationCuts(optimization.cuts.map((cut) => (cut.id === cutId ? { ...cut, ...changes } : cut)));

  const WorkspaceCuttingListPage = () => (
    <section className="h-full">
      <CuttingListSpreadsheet
        profileCatalog={profileMaterials.map((material) => ({
          code: material.code,
          name: material.name,
          photo: material.sketch,
        }))}
      />
    </section>
  );

  const generateWorkspaceOptimization = () => {
    try {
      const result = optimizeCuts(optimization);
      updateWorkspaceOptimization({ result, recommendation: undefined });
      setWorkspaceOptimizationError("");
    } catch (error) {
      setWorkspaceOptimizationError(error instanceof Error ? error.message : "Unable to generate the optimization.");
    }
  };

  const findWorkspaceBestStockLength = () => {
    try {
      const recommendation = recommendStockLength({
        minimum: optimization.recommendationMinimum ?? 4000,
        maximum: optimization.recommendationMaximum ?? 8000,
        increment: optimization.recommendationIncrement ?? 100,
        kerf: optimization.kerf,
        trim: optimization.trim,
        cuts: optimization.cuts,
      });
      if (!recommendation) throw new Error("No stock length in this range can fit every required cut.");
      updateWorkspaceOptimization({ recommendation });
      setWorkspaceOptimizationError("");
    } catch (error) {
      setWorkspaceOptimizationError(
        error instanceof Error ? error.message : "Unable to find a stock-length recommendation."
      );
    }
  };

  const WorkspaceOptimizationPage = () => (
    <section className="grid gap-4 mt-7">
      <section className="p-5 border border-[#c5dcda] rounded-xl bg-white shadow-[0_5px_16px_rgba(22,63,65,0.06)]">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">Cutting optimization</p>
          <h2 className="mt-1 mb-1 text-[#21484b] text-[19px] font-bold">Generate the best cutting plan</h2>
          <p className="m-0 text-[#607d80] text-xs leading-[1.45]">
            Enter the required cuts in millimeters. The engine keeps each profile separate and tries up to the selected
            number of arrangements per profile.
          </p>
        </div>
        <div className="grid grid-cols-4 max-[900px]:grid-cols-2 max-[620px]:grid-cols-1 gap-2.5 mt-4">
          <label className="grid gap-1.5 text-[#3b6668] text-[10px] font-extrabold uppercase [&>span]:text-[#729092] [&>span]:text-[9px]">
            Stock length <span>mm</span>
            <input
              className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
              type="number"
              min="1"
              step="1"
              value={optimization.stockLength || ""}
              onChange={(event) =>
                updateWorkspaceOptimization({
                  stockLength: Math.max(0, Number(event.target.value) || 0),
                  result: undefined,
                  recommendation: undefined,
                })
              }
            />
          </label>
          <label className="grid gap-1.5 text-[#3b6668] text-[10px] font-extrabold uppercase [&>span]:text-[#729092] [&>span]:text-[9px]">
            Saw kerf <span>mm</span>
            <input
              className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
              type="number"
              min="0"
              step="0.1"
              value={optimization.kerf || ""}
              onChange={(event) =>
                updateWorkspaceOptimization({
                  kerf: Math.max(0, Number(event.target.value) || 0),
                  result: undefined,
                  recommendation: undefined,
                })
              }
            />
          </label>
          <label className="grid gap-1.5 text-[#3b6668] text-[10px] font-extrabold uppercase [&>span]:text-[#729092] [&>span]:text-[9px]">
            End trim <span>mm</span>
            <input
              className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
              type="number"
              min="0"
              step="0.1"
              value={optimization.trim || ""}
              onChange={(event) =>
                updateWorkspaceOptimization({
                  trim: Math.max(0, Number(event.target.value) || 0),
                  result: undefined,
                  recommendation: undefined,
                })
              }
            />
          </label>
          <label className="grid gap-1.5 text-[#3b6668] text-[10px] font-extrabold uppercase [&>span]:text-[#729092] [&>span]:text-[9px]">
            Search depth
            <select
              className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
              value={optimization.arrangements}
              onChange={(event) =>
                updateWorkspaceOptimization({
                  arrangements: Number(event.target.value),
                  result: undefined,
                  recommendation: undefined,
                })
              }
            >
              <option value={100}>Fast · 100 arrangements</option>
              <option value={1000}>Standard · 1,000 arrangements</option>
              <option value={5000}>Deep · 5,000 arrangements</option>
            </select>
          </label>
        </div>
      </section>
      <section className="p-5 border border-[#c5dcda] rounded-xl bg-white shadow-[0_5px_16px_rgba(22,63,65,0.06)]">
        <header className="flex items-start justify-between max-[620px]:flex-col gap-3.5 mb-3.5">
          <div>
            <h2 className="mt-1 mb-1 text-[#21484b] text-[19px] font-bold">Required cuts</h2>
            <p className="m-0 text-[#607d80] text-xs leading-[1.45]">Use the profiles from this workspace’s independent Stock snapshot.</p>
          </div>
          <button
            type="button"
            className="min-h-[35px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
            onClick={() => {
              if (!profileMaterials.length) {
                setWorkspaceOptimizationError("No profiles are available in this workspace Stock snapshot.");
                return;
              }
              setOptimizationCuts([...optimization.cuts, optimizationCutForMaterial(profileMaterials[0])]);
            }}
          >
            <Icon name="plus" size={15} /> Add cut
          </button>
        </header>
        <div className="overflow-auto border border-[#c7dddd] rounded-lg" role="table">
          <div className="grid grid-cols-[minmax(145px,1.05fr)_minmax(210px,1.7fr)_minmax(108px,0.8fr)_68px_74px_32px] gap-2 items-center min-w-[690px] p-2 px-2.5 bg-[#16464b] text-[#eaf6f5] text-[9px] font-extrabold tracking-[0.04em] uppercase" role="row">
            <span>Opening / item</span>
            <span>Profile</span>
            <span>Cut length</span>
            <span>Qty</span>
            <span>Angle</span>
            <span />
          </div>
          {optimization.cuts.map((cut) => (
            <div className="grid grid-cols-[minmax(145px,1.05fr)_minmax(210px,1.7fr)_minmax(108px,0.8fr)_68px_74px_32px] gap-2 items-center min-w-[690px] p-2 px-2.5 border-t border-[#dce9e8] bg-[#fbfdfd]" role="row" key={cut.id}>
              <span>
                <input
                  className="w-full h-[30px] min-w-0 px-1.5 py-1 border border-[#b2cecb] rounded bg-white text-[#244f51] text-[11px] outline-none focus:border-[#27827d]"
                  aria-label="Opening or item"
                  value={cut.openingName}
                  placeholder="e.g. Window A"
                  onChange={(event) => updateOptimizationCut(cut.id, { openingName: event.target.value })}
                />
              </span>
              <span>
                <select
                  className="w-full h-[30px] min-w-0 px-1.5 py-1 border border-[#b2cecb] rounded bg-white text-[#244f51] text-[11px] outline-none focus:border-[#27827d]"
                  aria-label="Profile"
                  value={cut.profileId}
                  onChange={(event) => {
                    const material = profileMaterials.find((item) => item.id === event.target.value);
                    updateOptimizationCut(cut.id, {
                      profileId: material?.id ?? "",
                      profileName: material?.name ?? "",
                      profileCode: material?.code ?? "",
                    });
                  }}
                >
                  <option value="">Choose profile</option>
                  {profileMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.code} · {material.name}
                    </option>
                  ))}
                </select>
              </span>
              <span className="flex items-center gap-1 [&>em]:text-[#6b8588] [&>em]:text-[10px] [&>em]:not-italic [&>em]:font-extrabold">
                <input
                  className="w-full h-[30px] min-w-0 px-1.5 py-1 border border-[#b2cecb] rounded bg-white text-[#244f51] text-[11px] outline-none focus:border-[#27827d]"
                  aria-label="Cut length in millimeters"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={cut.length || ""}
                  onChange={(event) => updateOptimizationCut(cut.id, { length: Math.max(0, Number(event.target.value) || 0) })}
                />
                <em>mm</em>
              </span>
              <span>
                <input
                  className="w-full h-[30px] min-w-0 px-1.5 py-1 border border-[#b2cecb] rounded bg-white text-[#244f51] text-[11px] outline-none focus:border-[#27827d]"
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={cut.quantity || ""}
                  onChange={(event) =>
                    updateOptimizationCut(cut.id, { quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) })
                  }
                />
              </span>
              <span>
                <select
                  className="w-full h-[30px] min-w-0 px-1.5 py-1 border border-[#b2cecb] rounded bg-white text-[#244f51] text-[11px] outline-none focus:border-[#27827d]"
                  aria-label="Cut angle"
                  value={cut.angle}
                  onChange={(event) => updateOptimizationCut(cut.id, { angle: Number(event.target.value) as 45 | 90 })}
                >
                  <option value={90}>90°</option>
                  <option value={45}>45°</option>
                </select>
              </span>
              <span>
                <button
                  className="w-[29px] h-[29px] grid place-items-center rounded-[7px] border-0 bg-transparent text-[#a33131] hover:bg-[#fdeaea] cursor-pointer transition-colors"
                  type="button"
                  aria-label="Delete cut"
                  onClick={() => setOptimizationCuts(optimization.cuts.filter((item) => item.id !== cut.id))}
                >
                  <Icon name="trash" size={15} />
                </button>
              </span>
            </div>
          ))}
          {!optimization.cuts.length && (
            <p className="p-6 m-0 text-[#71898b] text-xs text-center">Add the first required cut to generate an optimization.</p>
          )}
        </div>
        {workspaceOptimizationError && (
          <p className="mt-3 p-2.5 px-3 rounded-md bg-[#fdebed] text-[#9e3037] text-xs font-bold" role="alert">
            {workspaceOptimizationError}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3.5">
          <button
            type="button"
            className="min-h-[35px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
            onClick={generateWorkspaceOptimization}
          >
            <Icon name="box" size={16} /> Generate optimized plan
          </button>
          <button
            type="button"
            className="min-h-[35px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
            onClick={findWorkspaceBestStockLength}
          >
            Find best stock length
          </button>
        </div>
      </section>
      <section className="p-5 border border-[#c5dcda] rounded-xl bg-white shadow-[0_5px_16px_rgba(22,63,65,0.06)] flex items-end max-[900px]:items-stretch max-[900px]:flex-wrap gap-3">
        <div className="grid flex-1 max-[900px]:basis-full gap-1 min-w-[180px]">
          <b className="text-[#22575a] text-[13px]">Best stock length advisor</b>
          <span className="text-[#688286] text-[11px] leading-[1.35]">
            Tests the selected range with the fast optimizer, then you can use the recommended length for the full
            arrangement search.
          </span>
        </div>
        <label className="w-[92px] max-[620px]:w-[calc(33.333%-8px)] flex-none grid gap-1 text-[#3b6668] text-[10px] font-extrabold uppercase">
          Minimum
          <input
            className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
            type="number"
            min="1"
            step="100"
            value={optimization.recommendationMinimum ?? 4000}
            onChange={(event) =>
              updateWorkspaceOptimization({ recommendationMinimum: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </label>
        <label className="w-[92px] max-[620px]:w-[calc(33.333%-8px)] flex-none grid gap-1 text-[#3b6668] text-[10px] font-extrabold uppercase">
          Maximum
          <input
            className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
            type="number"
            min="1"
            step="100"
            value={optimization.recommendationMaximum ?? 8000}
            onChange={(event) =>
              updateWorkspaceOptimization({ recommendationMaximum: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </label>
        <label className="w-[92px] max-[620px]:w-[calc(33.333%-8px)] flex-none grid gap-1 text-[#3b6668] text-[10px] font-extrabold uppercase">
          Step
          <input
            className="w-full h-[34px] min-w-0 px-2 py-1 border border-[#9bc5c1] rounded bg-[#f8fdfc] text-[#174c4d] text-xs font-bold outline-none focus:border-[#27827d]"
            type="number"
            min="1"
            step="10"
            value={optimization.recommendationIncrement ?? 100}
            onChange={(event) =>
              updateWorkspaceOptimization({ recommendationIncrement: Math.max(1, Number(event.target.value) || 100) })
            }
          />
        </label>
        {optimization.recommendation && (
          <div className="grid gap-1 min-w-[155px] max-[620px]:w-full p-2 px-2.5 rounded-md bg-[#e7f5f2] text-[#216c66] [&>strong]:text-xs [&>span]:text-[10px] [&>button]:justify-self-start [&>button]:mt-1 [&>button]:p-0 [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-[#176e68] [&>button]:text-[10px] [&>button]:font-extrabold [&>button]:underline [&>button]:cursor-pointer">
            <strong>{number(optimization.recommendation.length)} mm recommended</strong>
            <span>
              {optimization.recommendation.result.bars.length} bars ·{" "}
              {number(optimization.recommendation.result.utilization, 1)}% utilization
            </span>
            <button
              type="button"
              onClick={() =>
                updateWorkspaceOptimization({ stockLength: optimization.recommendation!.length, result: undefined })
              }
            >
              Use this length
            </button>
          </div>
        )}
      </section>
      {optimization.result && (
        <section className="p-5 border border-[#c5dcda] rounded-xl bg-white shadow-[0_5px_16px_rgba(22,63,65,0.06)]">
          <header className="flex items-center max-[900px]:items-start max-[900px]:flex-col justify-between gap-3.5 mb-3.5">
            <div>
              <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">Optimized result</p>
              <h2 className="mt-1 mb-1 text-[#21484b] text-[19px] font-bold">Cutting plan</h2>
              <p className="m-0 text-[#607d80] text-xs leading-[1.45]">
                {optimization.result.minimumProven
                  ? "The lower bound was reached for every profile."
                  : `Best result after up to ${optimization.result.arrangements.toLocaleString()} arrangements per profile.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end max-[900px]:justify-start [&>span]:grid [&>span]:gap-0.5 [&>span]:min-w-[74px] [&>span]:p-2 [&>span]:rounded-md [&>span]:bg-[#edf7f6] [&>span]:text-[#507174] [&>span]:text-[9px] [&>span]:font-extrabold [&>span]:text-center [&>span]:uppercase [&>span>b]:text-[#176d67] [&>span>b]:text-base">
              <span>
                <b>{optimization.result.bars.length}</b>stock bars
              </span>
              <span>
                <b>{number(optimization.result.utilization, 1)}%</b>utilization
              </span>
              <span>
                <b>{number(optimization.result.waste / 1000, 2)} m</b>offcut
              </span>
            </div>
          </header>
          <div className="grid gap-2.5">
            {optimization.result.bars.map((bar, index) => (
              <article className="p-3 border border-[#ccdedd] rounded-lg bg-[#fbfdfd]" key={bar.id}>
                <div className="flex justify-between max-[620px]:flex-col gap-3.5 text-[#2c5c5f] text-[11px] [&>span]:text-[#6b8486]">
                  <b>
                    {bar.profileCode || bar.profileName} · Bar {String(index + 1).padStart(2, "0")}
                  </b>
                  <span>
                    {number(bar.used, 1)} mm used · {number(bar.waste, 1)} mm offcut
                  </span>
                </div>
                <div className="flex h-[33px] my-2 overflow-hidden border border-[#a8c5c2] rounded bg-[#e4eeee]">
                  {bar.pieces.map((piece) => (
                    <span
                      className="grid min-w-0 place-items-center overflow-hidden border-r border-white/70 bg-[#5c9d9a] text-white text-[9px] font-extrabold text-ellipsis whitespace-nowrap nth-[3n]:bg-[#497da5] nth-[3n+2]:bg-[#6a9f76]"
                      key={piece.id}
                      style={{ width: `${Math.max(2, (piece.length / optimization.result!.stockLength) * 100)}%` }}
                      title={`${piece.openingName || piece.profileName}: ${number(piece.length)} mm`}
                    >
                      {piece.openingName || piece.profileCode}
                    </span>
                  ))}
                  <i
                    className="block min-w-0 bg-[repeating-linear-gradient(135deg,#e7bb91_0,#e7bb91_5px,#f7e3cc_5px,#f7e3cc_10px)]"
                    style={{ width: `${Math.max(0, (bar.waste / optimization.result!.stockLength) * 100)}%` }}
                  />
                </div>
                <p className="m-0 text-[#607a7d] text-[10px] leading-[1.45]">
                  {bar.pieces
                    .map((piece) => `${piece.openingName || piece.profileCode} · ${number(piece.length)} mm · ${piece.angle}°`)
                    .join("  |  ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );

  return (
    <div className="min-h-screen flex bg-[#f5f7f8]">
      <aside className="flex flex-col flex-none w-[246px] max-[760px]:w-[76px] p-7 max-[760px]:py-6 max-[760px]:px-2.5 bg-[#163f44] text-[#d9e6e7]">
        <button
          className="flex items-center gap-2.5 self-start max-[760px]:justify-center mb-[42px] p-0 border-0 bg-transparent text-white text-left text-lg font-extrabold leading-none cursor-pointer [&>svg]:text-[#82d4c9]"
          type="button"
          onClick={() => setScreen("execution-project-detail")}
          aria-label="Return to project files"
        >
          <Icon name="arrow" size={20} />
          <span className="max-[760px]:hidden">
            Project
            <br />
            workspace
          </span>
        </button>
        <p className="mx-[11px] mb-4 text-[#8eb8b8] text-[11px] font-extrabold leading-[1.35] [overflow-wrap:anywhere] max-[760px]:hidden">{workspace.name}</p>
        <nav aria-label="Workspace pages" className="grid gap-[5px]">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`flex items-center gap-2.5 w-full p-[11px] border-0 rounded-lg text-left text-sm font-bold max-[760px]:justify-center cursor-pointer transition-colors ${
                executionWorkspacePage === page.id
                  ? "bg-[#28636a] text-white"
                  : "bg-transparent text-[#b7cccc] hover:bg-[#28636a] hover:text-white"
              }`}
              onClick={() => setExecutionWorkspacePage(page.id)}
            >
              <Icon name={page.id === "material-order" ? "order" : page.id === "database" ? "layers" : "box"} size={18} />
              <span className="max-[760px]:hidden">{page.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div
        className={`min-w-0 flex-1 ${
          currentPage.id === "cutting-list" ? "flex min-h-screen" : ""
        }`}
      >
        {currentPage.id !== "cutting-list" && (
          <header className="flex items-center justify-between h-[69px] px-12 max-[760px]:px-5 border-b border-[#e0e8e9] bg-white text-[#284d51] text-sm font-extrabold">
            <span>{workspace.name}</span>
            <ProfileMenu />
          </header>
        )}
        <main
          className={
            currentPage.id === "cutting-list"
              ? "flex flex-1 min-w-0 min-h-0 p-2.5 max-[760px]:p-[5px]"
              : "p-9 max-[760px]:p-5 px-12 max-[760px]:px-5"
          }
        >
          {currentPage.id !== "cutting-list" && (
            <>
              <button
                className="border-0 bg-transparent p-0 text-[#28716e] text-[13px] font-bold cursor-pointer hover:underline inline-flex items-center gap-1 mb-2"
                type="button"
                onClick={() => setScreen("execution-project-detail")}
              >
                ← Project files
              </button>
              <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">{project.name}</p>
              <h1 className="m-0 text-[#1a3e42] text-[32px] font-bold">{currentPage.label}</h1>
              <p className="max-w-[650px] mt-2 mb-0 text-[#60797c] text-sm leading-relaxed">{currentPage.description}</p>
            </>
          )}
          {currentPage.id === "cutting-list" ? (
            WorkspaceCuttingListPage()
          ) : currentPage.id === "optimization" ? (
            WorkspaceOptimizationPage()
          ) : currentPage.id === "database" ? (
            stockSnapshot ? (
              <section className="mt-7">
                <div className="flex flex-wrap gap-2 mb-3 ml-3.5 max-[760px]:ml-0" role="tablist" aria-label="Workspace stock databases">
                  {stockTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeWorkspaceStockDatabase === tab.id}
                      className={`min-h-[31px] px-3 border rounded text-[11px] font-extrabold cursor-pointer transition-colors ${
                        activeWorkspaceStockDatabase === tab.id
                          ? "border-[#3d918a] bg-[#e0f1ee] text-[#155a56]"
                          : "border-[#b9d7d4] bg-white text-[#286864] hover:border-[#3d918a] hover:bg-[#e0f1ee] hover:text-[#155a56]"
                      }`}
                      onClick={() => setWorkspaceStockDatabaseId(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <section className="mx-12 mb-9 p-[18px] border border-[#dfe8e8] rounded-[13px] bg-white shadow-[0_8px_27px_#183f4110] grid gap-3.5 max-[700px]:mx-5">
                  <div className="flex items-center justify-between max-[760px]:flex-col max-[760px]:items-start gap-4 mb-4 p-3 border border-[#bfdbd7] rounded-lg bg-[#edf8f6] text-[#336d69] text-[11px] [&>div]:grid [&>div]:gap-1 [&>div>b]:text-[#176a65] [&>div>b]:text-xs [&>div>span]:leading-[1.4]">
                    <div>
                      <b>Stock snapshot</b>
                      <span>
                        Captured{" "}
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                          new Date(stockSnapshot.capturedAt)
                        )}
                        . This is the same Stock table structure, saved independently for {workspace.name}.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end [&>strong]:flex-none [&>strong]:px-2 [&>strong]:py-1 [&>strong]:rounded-full [&>strong]:bg-[#d6eeea] [&>strong]:text-[#176a65] [&>strong]:text-[11px] [&>button]:min-h-[29px] [&>button]:px-2.5 [&>button]:border [&>button]:border-[#398f88] [&>button]:rounded [&>button]:bg-[#187b75] [&>button]:text-white [&>button]:text-[10px] [&>button]:font-extrabold [&>button]:whitespace-nowrap [&>button]:cursor-pointer hover:[&>button]:bg-[#106963]">
                      <strong>{stockMaterialCount} materials</strong>
                      <button type="button" onClick={matchWorkspaceStockWithCurrent}>
                        Match with current Stock
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pb-[18px] flex-wrap">
                    <label className="w-[min(330px,100%)] h-10 flex items-center gap-2 px-3 border border-[#d5e0e1] rounded-[7px] text-[#698086] focus-within:border-[#27827d]">
                      <Icon name="search" size={17} />
                      <span className="sr-only">Search workspace stock</span>
                      <input
                        className="w-full border-0 outline-none bg-transparent text-[#18363a] text-sm"
                        value={workspaceStockSearch}
                        onChange={(event) => setWorkspaceStockSearch(event.target.value)}
                        placeholder={`Search ${stockTabs.find((tab) => tab.id === activeWorkspaceStockDatabase)?.label ?? "database"}`}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#4c696d] [&>select]:h-10 [&>select]:px-2.5 [&>select]:border [&>select]:border-[#d5e0e1] [&>select]:rounded-[7px] [&>select]:bg-white [&>select]:text-[#18363a]">
                      <span>Assembly type</span>
                      <select
                        value={workspaceStockAssemblyType}
                        onChange={(event) => setWorkspaceStockAssemblyType(event.target.value)}
                      >
                        <option value="">All assembly types</option>
                        {snapshotAssemblyTypeNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="px-3 py-1 rounded-full bg-[#dff0ed] text-[#156a65] text-xs font-bold">{stockMaterialCount} materials</span>
                  </div>
                  {stockTables.map((table) => (
                    <section className={`price-book-section ${table.section} stock-book-section workspace-stock-section`} key={table.id}>
                      <header className="flex items-end justify-between px-0.5 pb-1">
                        <div>
                          <h2 className="m-0 text-[#244a4e] text-sm font-bold">{table.title}</h2>
                          <p className="m-0 mt-0.5 text-[#748b8f] text-[11px]">{table.note}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="grid place-items-center min-w-[21px] h-[21px] rounded-full bg-[#e2f1ee] text-[#1b6d68] text-[10px] font-extrabold px-1.5">{table.rows.length}</span>
                        </div>
                      </header>
                      <div
                        className="material-list price-book-table stock-book-table workspace-stock-table"
                        role="table"
                        aria-label={`${table.title} stock`}
                      >
                        <div className="material-list-header" role="row">
                          <span>Ref.</span>
                          <span>Profile photo / name</span>
                          <span>Profile ref.</span>
                          <span>Used in assembly type</span>
                          <span>Unit</span>
                          <span>Mass / length</span>
                          <span>Stock length</span>
                          <span>Qty</span>
                        </div>
                        {table.rows.map((material, index) => {
                          const entries = stockEntriesFor(material);
                          const updateEntry = (entryId: string, field: "length" | "quantity", value: string) =>
                            saveWorkspaceStockEntries(
                              material.id,
                              entries.map((entry) =>
                                entry.id === entryId ? { ...entry, [field]: Math.max(0, Number(value) || 0) } : entry
                              )
                            );
                          const usageText = (assemblyUsageByMaterial.get(material.id) ?? []).join(", ");
                          return (
                            <div className="material-list-row" role="row" key={material.id}>
                              <span className="price-reference">
                                {table.prefix}
                                {index + 1}
                              </span>
                              <span className="material-list-name">
                                <span className="price-photo-cell">
                                  <Sketch path={material.sketch} label={material.name} />
                                </span>
                                <b>{material.name}</b>
                                {material.manufacturer && <small>{material.manufacturer}</small>}
                              </span>
                              <span>{material.code || "—"}</span>
                              <span className="assembly-usage" title={usageText || "Not used in an assembly type"}>
                                {usageText || "Not used"}
                              </span>
                              <span>{material.unit}</span>
                              <span className="stock-mass-cell">
                                <input
                                  className="stock-input"
                                  aria-label={`Mass per length for ${material.name}`}
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={material.weight || ""}
                                  onChange={(event) => saveWorkspaceMaterialMass(material.id, event.target.value)}
                                />
                                <em>{["m", "lm"].includes(material.unit.toLowerCase()) ? "kg/m" : "kg/unit"}</em>
                              </span>
                              <span className="stock-cell stock-entry-list">
                                {entries.map((entry) => (
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
                                            saveWorkspaceStockEntries(material.id, [
                                              ...entries,
                                              { id: makeId(), length: 0, quantity: 0 },
                                            ]);
                                            setStockLengthMenu(null);
                                          }}
                                        >
                                          Add another stock length
                                        </button>
                                        {entries.length > 1 && (
                                          <button
                                            type="button"
                                            className="danger"
                                            onClick={() => {
                                              saveWorkspaceStockEntries(
                                                material.id,
                                                entries.filter((value) => value.id !== entry.id)
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
                                {entries.map((entry) => (
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
                            </div>
                          );
                        })}
                        {!table.rows.length && <p className="m-0 p-[18px] text-[#7b9194] text-[11px] text-center">No materials in this price group yet.</p>}
                      </div>
                    </section>
                  ))}
                  {!stockTables.length && <p className="m-0 p-[18px] text-[#7b9194] text-[11px] text-center">No tables are saved in this database snapshot.</p>}
                </section>
              </section>
            ) : (
              <section className="grid justify-items-center gap-2.5 max-w-[700px] mt-8 p-14 px-7 border border-dashed border-[#b8d1d3] rounded-xl bg-white text-[#527074] text-center [&>svg]:text-[#27827d]">
                <Icon name="layers" size={34} />
                <h2 className="m-0 text-[#244d50] text-lg font-bold">No stock snapshot</h2>
                <p className="m-0 text-sm">
                  This workspace was created before stock snapshots were added. Create a new workspace to capture the
                  current Stock page.
                </p>
              </section>
            )
          ) : (
            <section className="grid justify-items-center gap-2.5 max-w-[700px] mt-8 p-14 px-7 border border-dashed border-[#b8d1d3] rounded-xl bg-white text-[#527074] text-center [&>svg]:text-[#27827d]">
              <Icon name={currentPage.id === "material-order" ? "order" : "box"} size={34} />
              <h2 className="m-0 text-[#244d50] text-lg font-bold">{currentPage.label}</h2>
              <p className="m-0 text-sm">This page is ready for its project tools.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
