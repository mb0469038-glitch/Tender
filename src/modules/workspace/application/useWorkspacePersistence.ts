import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import type {
  Assembly,
  CanvasItem,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ExecutionProject,
  ManpowerCost,
  MarkupRate,
  Material,
  Project,
  Screen,
  ShippingCost,
  ShippingType,
} from "../../../domain/types";
import { defaultComponentDatabases } from "../../catalog/domain/defaults";
import {
  ASSEMBLY_FORMULA_VALUES,
  FLY_SCREEN_PAGE,
  FYN_TRANSOM_CODES,
  GENERAL_ITEM_CODES,
  GLAZED_ALUMINIUM_CATEGORY,
  HINGE_WINDOW_PAGE,
  REAL_JOIN_TRANSOM_FORMULA,
  standardAssemblyCategory,
  TECHNAL_2_SLIDER_DATABASE,
  TECHNAL_ASSEMBLY_ID,
  TECHNAL_FY_DATABASE,
  TECHNAL_FYN_DATABASE,
  TECHNAL_GYN_DATABASE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../../catalog/domain/catalogDefinitions";
import { materialData, assemblyData } from "../../catalog/domain/sampleData";
import {
  completeFynJoinModifications,
  flyScreenAssembly,
  fynTransomMaterial,
  fynTransomPhoto,
  technalAssembly,
  technalMaterials,
  withTechnalSeed,
} from "../../catalog/domain/technalSeed";
import { defaultManpowerCosts, defaultMarkupRates, defaultShippingCosts, defaultShippingTypes } from "../../costing/domain/defaults";
import { usesDirectJoinValues } from "../../costing/domain/quantityEngine";
import { projectData } from "../../projects/domain/projectDefaults";
import { JOIN_MATCH_PROPERTIES } from "../../projects/domain/joinEngine";
import { serializeWorkspaceSnapshot, WorkspaceSnapshotV1 } from "../domain/snapshot";
import { workspaceGateway } from "../infrastructure/workspaceGateway";
import { persistWorkspaceSnapshot } from "./persistWorkspace";

type UseWorkspacePersistenceParams = {
  materials: Material[];
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  assemblies: Assembly[];
  setAssemblies: Dispatch<SetStateAction<Assembly[]>>;
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setSelectedProjectId: Dispatch<SetStateAction<string>>;
  executionProjects: ExecutionProject[];
  setExecutionProjects: Dispatch<SetStateAction<ExecutionProject[]>>;
  componentDatabases: ComponentDatabase[];
  setComponentDatabases: Dispatch<SetStateAction<ComponentDatabase[]>>;
  weightRates: Record<string, number>;
  setWeightRates: Dispatch<SetStateAction<Record<string, number>>>;
  markupRates: MarkupRate[];
  setMarkupRates: Dispatch<SetStateAction<MarkupRate[]>>;
  manpowerCurrency: string;
  setManpowerCurrency: Dispatch<SetStateAction<string>>;
  manpowerCosts: ManpowerCost[];
  setManpowerCosts: Dispatch<SetStateAction<ManpowerCost[]>>;
  shippingTypes: ShippingType[];
  setShippingTypes: Dispatch<SetStateAction<ShippingType[]>>;
  shippingCosts: ShippingCost[];
  setShippingCosts: Dispatch<SetStateAction<ShippingCost[]>>;
  fynAssemblyMaterialTemplateVersion: number;
  setFynAssemblyMaterialTemplateVersion: Dispatch<SetStateAction<number>>;
  companyDatabases: CompanyDatabase[];
  setCompanyDatabases: Dispatch<SetStateAction<CompanyDatabase[]>>;
  companyPriceTables: CompanyPriceTable[];
  setCompanyPriceTables: Dispatch<SetStateAction<CompanyPriceTable[]>>;
  movedOriginalPriceTableIds: string[];
  setMovedOriginalPriceTableIds: Dispatch<SetStateAction<string[]>>;
  screen: Screen;
  recheckCombinationJoins: (items: CanvasItem[]) => CanvasItem[];
  synchronizeCombinationDetails: (items: CanvasItem[]) => CanvasItem[];
};

export function useWorkspacePersistence({
  materials,
  setMaterials,
  assemblies,
  setAssemblies,
  projects,
  setProjects,
  setSelectedProjectId,
  executionProjects,
  setExecutionProjects,
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
  recheckCombinationJoins,
  synchronizeCombinationDetails,
}: UseWorkspacePersistenceParams) {
  const [hydrated, setHydrated] = useState(false);
  const [workspaceSaveStatus, setWorkspaceSaveStatus] = useState<"saving" | "saved" | "error">("saved");
  const [recentWorkspaceSaves, setRecentWorkspaceSaves] = useState<string[]>([]);
  const workspaceSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const workspaceSaveVersion = useRef(0);
  const workspaceRefreshInProgress = useRef(false);

  // Initial load effect
  useEffect(() => {
    workspaceGateway
      .loadSnapshot()
      .then((snapshot) => {
        if (snapshot) {
          const saved = JSON.parse(snapshot) as {
            materials: Material[];
            assemblies: Assembly[];
            projects: Project[];
            executionProjects?: ExecutionProject[];
            componentDatabases?: ComponentDatabase[];
            weightRates?: Record<string, number>;
            markupRates?: MarkupRate[];
            manpowerCurrency?: string;
            manpowerCosts?: ManpowerCost[];
            shippingTypes?: ShippingType[];
            shippingCosts?: ShippingCost[];
            fynAssemblyMaterialTemplateVersion?: number;
            companyDatabases?: CompanyDatabase[];
            companyPriceTables?: CompanyPriceTable[];
            movedOriginalPriceTableIds?: string[];
          };
          const seeded = withTechnalSeed(saved.materials ?? materialData, saved.assemblies ?? assemblyData);
          const fynTransomMaterialIds = new Set(
            seeded.materials.filter((material) => FYN_TRANSOM_CODES.has(material.code)).map((material) => material.id)
          );
          setMaterials([
            ...seeded.materials.map((material) => ({
              ...material,
              supplierCode: material.supplierCode ?? "",
              unit: material.unit ?? "piece",
              weight: material.weight ?? 0,
              rateMethod: material.rateMethod ?? "manual",
              manualRate:
                material.manualRate ?? (material.rateMethod === "manual" || !material.rateMethod ? material.cost ?? 0 : undefined),
              priceMethod: material.priceMethod ?? "Per piece",
              cost: material.cost ?? 0,
              shippingPercentage: material.shippingPercentage ?? 0,
              options: material.options ?? [],
              properties: material.properties ?? [],
              sketch: material.code === "FY2300" ? fynTransomPhoto : material.sketch,
              databaseId: GENERAL_ITEM_CODES.has(material.code)
                ? "markups"
                : material.databaseId === TECHNAL_2_SLIDER_DATABASE
                  ? TECHNAL_GYN_DATABASE
                  : material.databaseId === TECHNAL_FY_DATABASE
                    ? TECHNAL_FYN_DATABASE
                    : material.databaseId ?? (technalMaterials.some((seed) => seed.code === material.code) ? TECHNAL_GYN_DATABASE : undefined),
              quantityFormula:
                material.quantityFormula ?? technalMaterials.find((seed) => seed.code === material.code)?.quantityFormula,
            })),
            ...(seeded.materials.some((material) => material.code === "FY2300") ? [] : [fynTransomMaterial]),
          ]);
          const normalizedAssemblies = seeded.assemblies.map((assembly) => ({
            ...assembly,
            name:
              assembly.id === "fly-screen-2rail"
                ? "Fly screen - Soleal - GYn"
                : assembly.id === "hinged-window-soleal-fyn"
                  ? "Hinged System - Soleal - FYn"
                  : [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id) ||
                      /^2 rail(?: sliding window)? - soleal - gyn$/i.test(assembly.name)
                    ? "2 Rail System - Soleal - GYn"
                    : assembly.name,
            code: assembly.id === "fly-screen-2rail" ? "SOLEAL-GYN-FLY" : assembly.code,
            category: assembly.id === "fly-screen-2rail" ? "Fly screen" : assembly.category,
            sketch: assembly.id === "fly-screen-2rail" ? flyScreenAssembly.sketch : assembly.sketch,
            assemblyPage: assembly.id === "fly-screen-2rail" ? FLY_SCREEN_PAGE : assembly.assemblyPage ?? TWO_RAIL_WINDOW_PAGE,
            properties:
              assembly.id === "fly-screen-2rail"
                ? ["Width", "Height"]
                : assembly.id === "tilt-and-turn-soleal-fyn"
                  ? ASSEMBLY_FORMULA_VALUES.filter(
                      (value) => value.name !== "NumberOfLeaves" && value.name !== "FlyScreen" && value.name !== "OpeningType"
                    ).map((value) => value.name)
                  : assembly.properties ?? ["Width", "Height"],
            parts: assembly.parts.map((part) => ({
              ...part,
              label: assembly.id === "fly-screen-2rail" ? undefined : part.label,
              quantityFormula:
                assembly.id === "fly-screen-2rail"
                  ? part.quantityFormula?.toLowerCase() === "f12"
                    ? "Perimeter"
                    : part.quantityFormula
                  : fynTransomMaterialIds.has(part.materialId) && part.quantityFormula?.includes("JoinedUp*0.5*Width")
                    ? REAL_JOIN_TRANSOM_FORMULA
                    : part.quantityFormula,
              quantityFormulaFourPanels:
                assembly.id === "fly-screen-2rail" && part.quantityFormulaFourPanels?.toLowerCase() === "f12"
                  ? "Perimeter"
                  : part.quantityFormulaFourPanels,
            })),
            rules: assembly.rules ?? [],
            databaseId:
              assembly.databaseId === TECHNAL_2_SLIDER_DATABASE
                ? TECHNAL_GYN_DATABASE
                : assembly.databaseId === TECHNAL_FY_DATABASE
                  ? TECHNAL_FYN_DATABASE
                  : assembly.databaseId ?? (assembly.code === technalAssembly.code ? TECHNAL_GYN_DATABASE : undefined),
            joinModifications: usesDirectJoinValues(assembly)
              ? []
              : assembly.databaseId === TECHNAL_FYN_DATABASE || assembly.databaseId === TECHNAL_FY_DATABASE
                ? completeFynJoinModifications(assembly.joinModifications)
                : assembly.joinModifications ?? [],
          }));
          const hingedFynFrameTypes = normalizedAssemblies.find((assembly) => assembly.id === "hinged-window-soleal-fyn")?.frameTypes ?? [];
          setAssemblies(
            normalizedAssemblies.map((assembly) =>
              ["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && !assembly.frameTypes?.length && hingedFynFrameTypes.length
                ? { ...assembly, frameTypes: hingedFynFrameTypes.map((row) => ({ ...row })) }
                : assembly
            )
          );
          setProjects(
            (saved.projects ?? projectData).map((project) => {
              const normalizeItems = (items: CanvasItem[]) =>
                items.map((item) => {
                  const isLegacyHinge = item.sourceId === "hinge-window";
                  const isHingeWindow = item.assemblyPage === HINGE_WINDOW_PAGE || item.sourceId === "hinged-window-soleal-fyn" || isLegacyHinge;
                  const isTiltAndTurn = item.assemblyPage === TILT_AND_TURN_PAGE || item.sourceId === "tilt-and-turn-soleal-fyn";
                  const isTwoRailWindow = item.assemblyPage === TWO_RAIL_WINDOW_PAGE || [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId);
                  return {
                    ...item,
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    sourceId: isLegacyHinge ? "" : item.sourceId,
                    name: isLegacyHinge ? "Hinge window" : item.name,
                    sketch: isLegacyHinge ? "M12 12H88V88H12ZM50 12V88M15 18L50 50L15 82M85 18L50 50L85 82" : item.sketch,
                    inputWidth: Math.round(item.inputWidth ?? 1500),
                    inputHeight: Math.round(item.inputHeight ?? 1200),
                    quantity: Math.max(1, Math.round(item.quantity ?? 1)),
                    openingType: item.openingType ?? "window",
                    leafSize: item.leafSize ?? "small",
                    frameSize: item.frameSize ?? "small",
                    hasArchitraveAllowance: item.hasArchitraveAllowance ?? (isTwoRailWindow ? item.hasFlyScreen ?? false : false),
                    hasCoating: item.hasCoating ?? false,
                    leaves: isHingeWindow ? (item.leaves === 3 || item.leaves === 4 ? 2 : item.leaves ?? 1) : isTiltAndTurn ? 1 : item.leaves,
                    assemblyPage: isHingeWindow
                      ? HINGE_WINDOW_PAGE
                      : item.assemblyPage ?? (item.sourceId === "fly-screen-2rail" ? FLY_SCREEN_PAGE : item.kind === "assembly" ? TWO_RAIL_WINDOW_PAGE : undefined),
                  };
                });
              const canvases = project.canvases?.length
                ? project.canvases.map((canvas) => ({ ...canvas, items: normalizeItems(canvas.items) }))
                : [{ id: "opening-1", name: "Opening 1", items: normalizeItems(project.items) }];
              return { ...project, year: project.year ?? "2026", company: project.company ?? "", location: project.location ?? "Lebanon", canvases, items: canvases[0].items };
            })
          );
          setExecutionProjects(
            (saved.executionProjects ?? [])
              .filter((project) => project.id && project.name?.trim())
              .map((project) => ({ ...project, files: project.files ?? [] }))
          );
          setComponentDatabases(() => {
            const savedDatabases = saved.componentDatabases ?? [];
            return [
              ...defaultComponentDatabases,
              ...savedDatabases.filter(
                (item) =>
                  item.id !== TECHNAL_2_SLIDER_DATABASE &&
                  item.id !== TECHNAL_FY_DATABASE &&
                  !defaultComponentDatabases.some((defaultItem) => defaultItem.id === item.id)
              ),
            ];
          });
          setWeightRates(saved.weightRates ?? {});
          setMarkupRates(saved.markupRates?.length ? saved.markupRates : defaultMarkupRates);
          setManpowerCurrency(saved.manpowerCurrency || "US Dollar");
          setManpowerCosts(saved.manpowerCosts?.length ? saved.manpowerCosts : defaultManpowerCosts);
          const savedShippingTypes = saved.shippingTypes?.length ? saved.shippingTypes : defaultShippingTypes;
          setShippingTypes(savedShippingTypes);
          setShippingCosts(
            (saved.shippingCosts?.length ? saved.shippingCosts : defaultShippingCosts).map((cost) => {
              const legacyCost = cost as ShippingCost & { percentage?: number };
              const values: Record<string, number> = {};
              savedShippingTypes.forEach((type) => {
                values[type.id] = Math.max(0, Number(legacyCost.values?.[type.id] ?? (type.id === "type-1" ? legacyCost.percentage : 0)) || 0);
              });
              return {
                id: legacyCost.id,
                name: legacyCost.name,
                values,
              };
            })
          );
          setFynAssemblyMaterialTemplateVersion(saved.fynAssemblyMaterialTemplateVersion ?? 0);
          setCompanyDatabases((saved.companyDatabases ?? []).filter((database) => database.id && database.name?.trim()));
          const savedCompanyTables = (saved.companyPriceTables ?? []).filter(
            (table) => table.id && table.companyDatabaseId && table.name?.trim() && table.referencePrefix?.trim()
          );
          setCompanyPriceTables(savedCompanyTables);
          const migratedMoves = [
            { id: "general-others", name: "Others", prefix: "G" },
            { id: "general-profiles", name: "General ALU profiles", prefix: "GP" },
            { id: "general-accessories", name: "General ALU accessories", prefix: "GA" },
          ]
            .filter((original) =>
              savedCompanyTables.some(
                (table) =>
                  table.companyDatabaseId !== "prices" &&
                  table.name.trim().toLowerCase() === original.name.toLowerCase() &&
                  table.referencePrefix.trim().replace(/-+$/, "").toLowerCase() === original.prefix.toLowerCase()
              )
            )
            .map((original) => original.id);
          setMovedOriginalPriceTableIds([...new Set([...(saved.movedOriginalPriceTableIds ?? []), ...migratedMoves])]);
          setSelectedProjectId(saved.projects?.[0]?.id ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setHydrated(true));
  }, []);

  // Fetch recent saves on startup
  useEffect(() => {
    workspaceGateway
      .fetchRecentSaves()
      .then(setRecentWorkspaceSaves)
      .catch((error) => console.error("Could not load recent workspace saves.", error));
  }, []);

  // FYN join modifications migration
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) =>
      items.map((assembly) => {
        if (assembly.databaseId !== TECHNAL_FYN_DATABASE || usesDirectJoinValues(assembly)) return assembly;
        const joinModifications = completeFynJoinModifications(assembly.joinModifications);
        return JSON.stringify(joinModifications) === JSON.stringify(assembly.joinModifications ?? []) ? assembly : { ...assembly, joinModifications };
      })
    );
  }, [hydrated]);

  // Quantity rule clean-up
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) =>
      items.map((assembly) => {
        const realJoinPropertyMatches = assembly.realJoinPropertyMatches?.filter((rule) => rule.property !== "quantity");
        const fakeJoinPropertyMatches = assembly.fakeJoinPropertyMatches?.filter((rule) => rule.property !== "quantity");
        return JSON.stringify(realJoinPropertyMatches) === JSON.stringify(assembly.realJoinPropertyMatches) &&
          JSON.stringify(fakeJoinPropertyMatches) === JSON.stringify(assembly.fakeJoinPropertyMatches)
          ? assembly
          : { ...assembly, realJoinPropertyMatches, fakeJoinPropertyMatches };
      })
    );
  }, [hydrated]);

  // Reconcile combination details on existing projects
  useEffect(() => {
    if (!hydrated) return;
    setProjects((current) =>
      current.map((project) => {
        const canvases = project.canvases?.length
          ? project.canvases.map((canvas) => ({ ...canvas, items: synchronizeCombinationDetails(recheckCombinationJoins(canvas.items)) }))
          : undefined;
        const items = canvases?.[0]?.items ?? synchronizeCombinationDetails(recheckCombinationJoins(project.items));
        const next = { ...project, items, ...(canvases ? { canvases } : {}) };
        return JSON.stringify(next) === JSON.stringify(project) ? project : next;
      })
    );
  }, [hydrated]);

  // Rename FlyScreen to ArchitraveAllowance in two-rail formulas
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) =>
      items.map((assembly) => {
        if (assembly.assemblyPage !== TWO_RAIL_WINDOW_PAGE && ![TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id)) return assembly;
        const renameFormulaValue = (value?: string) => value?.replace(/\bFlyScreen\b/gi, "ArchitraveAllowance");
        const parts = assembly.parts.map((part) => ({
          ...part,
          quantityFormula: renameFormulaValue(part.quantityFormula),
          quantityFormulaOtherwise: renameFormulaValue(part.quantityFormulaOtherwise),
          quantityFormulaFourPanels: renameFormulaValue(part.quantityFormulaFourPanels),
          conditionFormula: renameFormulaValue(part.conditionFormula),
        }));
        return JSON.stringify(parts) === JSON.stringify(assembly.parts) ? assembly : { ...assembly, parts };
      })
    );
  }, [hydrated]);

  // Ensure standard assembly categories
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) =>
      items.map((assembly) => {
        const category = standardAssemblyCategory(assembly.assemblyPage);
        return category && assembly.category !== category ? { ...assembly, category } : assembly;
      })
    );
  }, [hydrated]);

  // Real join property matches migration
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const glazedAssemblyIds = items.filter((assembly) => assembly.category === GLAZED_ALUMINIUM_CATEGORY).map((assembly) => assembly.id);
      return items.map((assembly) => {
        if (assembly.realJoinPropertyMatches !== undefined || assembly.category !== GLAZED_ALUMINIUM_CATEGORY) return assembly;
        const withAssemblyIds = glazedAssemblyIds;
        return {
          ...assembly,
          realJoinPropertyMatches: JOIN_MATCH_PROPERTIES.map((property) => ({
            id: `${assembly.id}-real-${property.value}`,
            property: property.value,
            withAssemblyIds,
          })),
          fakeJoinPropertyMatches: ["hasArchitrave", "hasArchitraveAllowance"].map((property) => ({
            id: `${assembly.id}-fake-${property}`,
            property,
            withAssemblyIds,
          })),
        };
      });
    });
  }, [hydrated]);

  // Synchronize hinged fyn matches to fixed and tilt & turn
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const hinged = items.find((assembly) => assembly.id === "hinged-window-soleal-fyn");
      if (!hinged) return items;
      return items.map((assembly) =>
        ["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && assembly.joinPropertyMatchSource !== hinged.id
          ? {
              ...assembly,
              realJoinPropertyMatches: (hinged.realJoinPropertyMatches ?? []).map((rule) => ({
                ...rule,
                id: `${assembly.id}-real-${rule.property}`,
                withAssemblyIds: [...rule.withAssemblyIds],
              })),
              fakeJoinPropertyMatches: (hinged.fakeJoinPropertyMatches ?? []).map((rule) => ({
                ...rule,
                id: `${assembly.id}-fake-${rule.property}`,
                withAssemblyIds: [...rule.withAssemblyIds],
              })),
              joinPropertyMatchSource: hinged.id,
            }
          : assembly
      );
    });
  }, [hydrated]);

  // Sync hinged FYN parts & frame types to fixed/tilt-and-turn
  useEffect(() => {
    if (!hydrated) return;
    setAssemblies((items) => {
      const hingedFyn = items.find((assembly) => assembly.id === "hinged-window-soleal-fyn");
      if (!hingedFyn || !hingedFyn.parts.length) return items;
      return items.map((assembly) =>
        [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(assembly.id) || /^2 rail(?: sliding window)? - soleal - gyn$/i.test(assembly.name)
          ? { ...assembly, name: "2 Rail System - Soleal - GYn" }
          : assembly.id === "hinged-window-soleal-fyn"
            ? { ...assembly, name: "Hinged System - Soleal - FYn" }
            : ["fixed-window", "tilt-and-turn-soleal-fyn"].includes(assembly.id) && assembly.templateSource !== "hinged-fyn"
              ? {
                  ...assembly,
                  parts: hingedFyn.parts.map((part) => ({ ...part })),
                  frameTypes: (hingedFyn.frameTypes ?? []).map((frameType) => ({ ...frameType })),
                  templateSource: "hinged-fyn",
                }
              : assembly
      );
    });
  }, [hydrated]);

  const currentWorkspaceSnapshot = (): WorkspaceSnapshotV1 => ({
    materials,
    assemblies,
    projects,
    executionProjects,
    componentDatabases,
    weightRates,
    markupRates,
    manpowerCurrency,
    manpowerCosts,
    shippingTypes,
    shippingCosts,
    fynAssemblyMaterialTemplateVersion,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
  });

  // Auto-save effect
  useEffect(() => {
    if (!hydrated) return;
    const version = ++workspaceSaveVersion.current;
    const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
    setWorkspaceSaveStatus("saving");
    const saveTimer = window.setTimeout(() => {
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => workspaceGateway.saveSnapshot(snapshot))
        .then(() => {
          if (version !== workspaceSaveVersion.current) return;
          setWorkspaceSaveStatus("saved");
          workspaceGateway
            .fetchRecentSaves()
            .then(setRecentWorkspaceSaves)
            .catch((error) => console.error("Could not load recent workspace saves.", error));
        })
        .catch((error) => {
          console.error("Could not save the workspace.", error);
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("error");
        });
    }, 600);
    return () => window.clearTimeout(saveTimer);
  }, [
    materials,
    assemblies,
    projects,
    executionProjects,
    componentDatabases,
    weightRates,
    markupRates,
    manpowerCurrency,
    manpowerCosts,
    shippingTypes,
    shippingCosts,
    fynAssemblyMaterialTemplateVersion,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
    hydrated,
  ]);

  // Ctrl+R save-before-refresh shortcut
  useEffect(() => {
    const refreshWithKeyboard = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "r") return;
      event.preventDefault();
      if (workspaceRefreshInProgress.current) return;
      workspaceRefreshInProgress.current = true;
      if (!hydrated) {
        window.location.reload();
        return;
      }
      const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
      workspaceSaveVersion.current += 1;
      setWorkspaceSaveStatus("saving");
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => persistWorkspaceSnapshot(snapshot, { refreshRecentSaves: false }).then(() => undefined))
        .catch((error) => console.error("Could not save the workspace before refreshing.", error))
        .finally(() => window.location.reload());
    };
    window.addEventListener("keydown", refreshWithKeyboard);
    return () => window.removeEventListener("keydown", refreshWithKeyboard);
  }, [
    materials,
    assemblies,
    projects,
    executionProjects,
    componentDatabases,
    weightRates,
    markupRates,
    manpowerCurrency,
    manpowerCosts,
    shippingTypes,
    shippingCosts,
    fynAssemblyMaterialTemplateVersion,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
    hydrated,
  ]);

  // Ctrl+S instant save shortcut on canvas
  useEffect(() => {
    const saveCanvasWithKeyboard = (event: KeyboardEvent) => {
      if (screen !== "canvas" || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (!hydrated) return;
      const snapshot = serializeWorkspaceSnapshot(currentWorkspaceSnapshot());
      const version = ++workspaceSaveVersion.current;
      setWorkspaceSaveStatus("saving");
      workspaceSaveQueue.current = workspaceSaveQueue.current
        .catch(() => undefined)
        .then(() => persistWorkspaceSnapshot(snapshot))
        .then((recentSaves) => {
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("saved");
          if (recentSaves) setRecentWorkspaceSaves(recentSaves);
        })
        .catch((error) => {
          console.error("Could not save the workspace.", error);
          if (version === workspaceSaveVersion.current) setWorkspaceSaveStatus("error");
        });
    };
    window.addEventListener("keydown", saveCanvasWithKeyboard);
    return () => window.removeEventListener("keydown", saveCanvasWithKeyboard);
  }, [
    screen,
    materials,
    assemblies,
    projects,
    executionProjects,
    componentDatabases,
    weightRates,
    markupRates,
    manpowerCurrency,
    manpowerCosts,
    shippingTypes,
    shippingCosts,
    fynAssemblyMaterialTemplateVersion,
    companyDatabases,
    companyPriceTables,
    movedOriginalPriceTableIds,
    hydrated,
  ]);

  return {
    hydrated,
    workspaceSaveStatus,
    recentWorkspaceSaves,
    fynAssemblyMaterialTemplateVersion,
    setFynAssemblyMaterialTemplateVersion,
  };
}
