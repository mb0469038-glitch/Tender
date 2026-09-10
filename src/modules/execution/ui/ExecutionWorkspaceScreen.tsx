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
    <section className="workspace-cutting-list-page">
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
    <section className="workspace-optimizer">
      <section className="workspace-optimizer-settings">
        <div>
          <p className="eyebrow">Cutting optimization</p>
          <h2>Generate the best cutting plan</h2>
          <p>
            Enter the required cuts in millimeters. The engine keeps each profile separate and tries up to the selected
            number of arrangements per profile.
          </p>
        </div>
        <div className="workspace-optimizer-settings-grid">
          <label>
            Stock length <span>mm</span>
            <input
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
          <label>
            Saw kerf <span>mm</span>
            <input
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
          <label>
            End trim <span>mm</span>
            <input
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
          <label>
            Search depth
            <select
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
      <section className="workspace-cut-list">
        <header>
          <div>
            <h2>Required cuts</h2>
            <p>Use the profiles from this workspace’s independent Stock snapshot.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
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
        <div className="workspace-cut-grid" role="table">
          <div className="workspace-cut-grid-header" role="row">
            <span>Opening / item</span>
            <span>Profile</span>
            <span>Cut length</span>
            <span>Qty</span>
            <span>Angle</span>
            <span />
          </div>
          {optimization.cuts.map((cut) => (
            <div className="workspace-cut-grid-row" role="row" key={cut.id}>
              <span>
                <input
                  aria-label="Opening or item"
                  value={cut.openingName}
                  placeholder="e.g. Window A"
                  onChange={(event) => updateOptimizationCut(cut.id, { openingName: event.target.value })}
                />
              </span>
              <span>
                <select
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
              <span className="workspace-cut-length">
                <input
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
                  className="icon-button danger"
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
            <p className="workspace-cut-empty">Add the first required cut to generate an optimization.</p>
          )}
        </div>
        {workspaceOptimizationError && (
          <p className="workspace-optimization-error" role="alert">
            {workspaceOptimizationError}
          </p>
        )}
        <div className="workspace-optimizer-actions">
          <button type="button" className="primary-button" onClick={generateWorkspaceOptimization}>
            <Icon name="box" size={16} /> Generate optimized plan
          </button>
          <button type="button" className="secondary-button" onClick={findWorkspaceBestStockLength}>
            Find best stock length
          </button>
        </div>
      </section>
      <section className="workspace-stock-advisor">
        <div>
          <b>Best stock length advisor</b>
          <span>
            Tests the selected range with the fast optimizer, then you can use the recommended length for the full
            arrangement search.
          </span>
        </div>
        <label>
          Minimum
          <input
            type="number"
            min="1"
            step="100"
            value={optimization.recommendationMinimum ?? 4000}
            onChange={(event) =>
              updateWorkspaceOptimization({ recommendationMinimum: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </label>
        <label>
          Maximum
          <input
            type="number"
            min="1"
            step="100"
            value={optimization.recommendationMaximum ?? 8000}
            onChange={(event) =>
              updateWorkspaceOptimization({ recommendationMaximum: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </label>
        <label>
          Step
          <input
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
          <div className="workspace-stock-recommendation">
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
        <section className="workspace-optimization-result">
          <header>
            <div>
              <p className="eyebrow">Optimized result</p>
              <h2>Cutting plan</h2>
              <p>
                {optimization.result.minimumProven
                  ? "The lower bound was reached for every profile."
                  : `Best result after up to ${optimization.result.arrangements.toLocaleString()} arrangements per profile.`}
              </p>
            </div>
            <div className="workspace-optimization-metrics">
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
          <div className="workspace-bar-list">
            {optimization.result.bars.map((bar, index) => (
              <article className="workspace-bar" key={bar.id}>
                <div className="workspace-bar-heading">
                  <b>
                    {bar.profileCode || bar.profileName} · Bar {String(index + 1).padStart(2, "0")}
                  </b>
                  <span>
                    {number(bar.used, 1)} mm used · {number(bar.waste, 1)} mm offcut
                  </span>
                </div>
                <div className="workspace-bar-visual">
                  {bar.pieces.map((piece) => (
                    <span
                      key={piece.id}
                      style={{ width: `${Math.max(2, (piece.length / optimization.result!.stockLength) * 100)}%` }}
                      title={`${piece.openingName || piece.profileName}: ${number(piece.length)} mm`}
                    >
                      {piece.openingName || piece.profileCode}
                    </span>
                  ))}
                  <i style={{ width: `${Math.max(0, (bar.waste / optimization.result!.stockLength) * 100)}%` }} />
                </div>
                <p>
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
    <div className="execution-workspace-app">
      <aside className="execution-workspace-sidebar">
        <button
          className="execution-projects-brand"
          type="button"
          onClick={() => setScreen("execution-project-detail")}
          aria-label="Return to project files"
        >
          <Icon name="arrow" size={20} />
          <span>
            Project
            <br />
            workspace
          </span>
        </button>
        <p>{workspace.name}</p>
        <nav aria-label="Workspace pages">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={executionWorkspacePage === page.id ? "active" : ""}
              onClick={() => setExecutionWorkspacePage(page.id)}
            >
              <Icon name={page.id === "material-order" ? "order" : page.id === "database" ? "layers" : "box"} size={18} />
              <span>{page.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div
        className={`execution-workspace-content${
          currentPage.id === "cutting-list" ? " execution-workspace-content--cutting-list" : ""
        }`}
      >
        {currentPage.id !== "cutting-list" && (
          <header className="execution-projects-topbar">
            <span>{workspace.name}</span>
            <ProfileMenu />
          </header>
        )}
        <main
          className={`execution-workspace-main${
            currentPage.id === "cutting-list" ? " execution-workspace-main--cutting-list" : ""
          }`}
        >
          {currentPage.id !== "cutting-list" && (
            <>
              <button
                className="back-button"
                type="button"
                onClick={() => setScreen("execution-project-detail")}
              >
                Project files
              </button>
              <p className="eyebrow">{project.name}</p>
              <h1>{currentPage.label}</h1>
              <p className="intro">{currentPage.description}</p>
            </>
          )}
          {currentPage.id === "cutting-list" ? (
            WorkspaceCuttingListPage()
          ) : currentPage.id === "optimization" ? (
            WorkspaceOptimizationPage()
          ) : currentPage.id === "database" ? (
            stockSnapshot ? (
              <section className="workspace-stock-page">
                <div className="workspace-stock-tabs" role="tablist" aria-label="Workspace stock databases">
                  {stockTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeWorkspaceStockDatabase === tab.id}
                      className={activeWorkspaceStockDatabase === tab.id ? "active" : ""}
                      onClick={() => setWorkspaceStockDatabaseId(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <section className="library-panel price-book-panel workspace-stock-panel">
                  <div className="workspace-stock-notice">
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
                    <div className="workspace-stock-notice-actions">
                      <strong>{stockMaterialCount} materials</strong>
                      <button type="button" onClick={matchWorkspaceStockWithCurrent}>
                        Match with current Stock
                      </button>
                    </div>
                  </div>
                  <div className="toolbar">
                    <label className="search-field">
                      <Icon name="search" size={17} />
                      <span className="sr-only">Search workspace stock</span>
                      <input
                        value={workspaceStockSearch}
                        onChange={(event) => setWorkspaceStockSearch(event.target.value)}
                        placeholder={`Search ${stockTabs.find((tab) => tab.id === activeWorkspaceStockDatabase)?.label ?? "database"}`}
                      />
                    </label>
                    <label className="assembly-type-filter">
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
                    <span className="item-count">{stockMaterialCount} materials</span>
                  </div>
                  {stockTables.map((table) => (
                    <section className={`price-book-section ${table.section} stock-book-section workspace-stock-section`} key={table.id}>
                      <header className="price-book-section-header">
                        <div>
                          <h2>{table.title}</h2>
                          <p>{table.note}</p>
                        </div>
                        <div className="price-book-section-actions">
                          <span>{table.rows.length}</span>
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
                        {!table.rows.length && <p className="price-book-empty">No materials in this price group yet.</p>}
                      </div>
                    </section>
                  ))}
                  {!stockTables.length && <p className="price-book-empty">No tables are saved in this database snapshot.</p>}
                </section>
              </section>
            ) : (
              <section className="execution-workspace-empty">
                <Icon name="layers" size={34} />
                <h2>No stock snapshot</h2>
                <p>
                  This workspace was created before stock snapshots were added. Create a new workspace to capture the
                  current Stock page.
                </p>
              </section>
            )
          ) : (
            <section className="execution-workspace-empty">
              <Icon name={currentPage.id === "material-order" ? "order" : "box"} size={34} />
              <h2>{currentPage.label}</h2>
              <p>This page is ready for its project tools.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
