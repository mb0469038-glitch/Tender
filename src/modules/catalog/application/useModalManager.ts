import {
  type ClipboardEvent,
  type FormEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Assembly,
  AssemblyCanvasDefaults,
  AssemblyNameRule,
  BreakdownRule,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ExecutionProject,
  FrameType,
  JoinModification,
  JoinPropertyMatch,
  Material,
  Project,
} from "../../../domain/types";
import { makeId } from "../../../shared/kernel/ids";
import {
  ASSEMBLY_FORMULA_VALUES,
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TECHNAL_ASSEMBLY_ID,
  TECHNAL_FYN_DATABASE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
  databaseDefinitions,
  glassReference,
  inferGlassThickness,
  standardAssemblyCategory,
} from "../domain/catalogDefinitions";
import {
  completeFynJoinModifications,
  technalAssembly,
} from "../domain/technalSeed";
import {
  defaultAssemblyCode as defaultAssemblyCodePure,
  materialDatabaseReference as materialDatabaseReferencePure,
  materialFromAssemblyCode as materialFromAssemblyCodePure,
} from "../domain/materialReference";
import {
  TWO_SLIDER_DOOR_SKETCH,
  assemblyDefaultColor,
  defaultAssemblyCanvasDefaults,
} from "../../projects/domain/projectDefaults";
import {
  joinMatchPropertiesForAssembly,
  joinMatchPropertyKeys,
} from "../../projects/domain/joinEngine";
import { usesDirectJoinValues } from "../../costing/domain/quantityEngine";
import { WORKSPACE_PERMISSIONS } from "../../workspace-legacy/domain/permissions";
import { hasPermission } from "../../../shared/permissions/PermissionGate";

export const companyTableReferencePrefix = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(/-+$/, "");

export type ModalState = {
  type: "material" | "assembly" | "project" | "executionProject";
  id?: string;
} | null;

export type UseModalManagerParams = {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  executionProjects: ExecutionProject[];
  setExecutionProjects: React.Dispatch<React.SetStateAction<ExecutionProject[]>>;
  companyDatabases: CompanyDatabase[];
  setCompanyDatabases: React.Dispatch<React.SetStateAction<CompanyDatabase[]>>;
  companyPriceTables: CompanyPriceTable[];
  setCompanyPriceTables: React.Dispatch<React.SetStateAction<CompanyPriceTable[]>>;
  componentDatabases: ComponentDatabase[];
  setComponentDatabases: React.Dispatch<React.SetStateAction<ComponentDatabase[]>>;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;
  activeAssemblySystem: "technal" | "sidem";
  activeProjectYear: number;
  setSelectedProjectId: (id: string) => void;
  setSelectedCanvasId: (id: string) => void;
  setScreen: (screen: any) => void;
  screen: string;
  permissions: Set<string>;
  recordPriceChange: () => void;
  materialDatabaseOverride: string | null;
  setMaterialDatabaseOverride: (id: string | null) => void;
  companyMaterialTableId: string | null;
  setCompanyMaterialTableId: (id: string | null) => void;
  priceInsertAfterMaterialId: string | null;
  setPriceInsertAfterMaterialId: (id: string | null) => void;
};

export function useModalManager({
  materials,
  setMaterials,
  assemblies,
  setAssemblies,
  projects,
  setProjects,
  executionProjects,
  setExecutionProjects,
  companyDatabases,
  setCompanyDatabases,
  companyPriceTables,
  setCompanyPriceTables,
  componentDatabases,
  setComponentDatabases,
  activeDatabaseId,
  setActiveDatabaseId,
  activeAssemblySystem,
  activeProjectYear,
  setSelectedProjectId,
  setSelectedCanvasId,
  setScreen,
  screen,
  permissions,
  recordPriceChange,
  materialDatabaseOverride,
  setMaterialDatabaseOverride,
  companyMaterialTableId,
  setCompanyMaterialTableId,
  priceInsertAfterMaterialId,
  setPriceInsertAfterMaterialId,
}: UseModalManagerParams) {
  const [modal, setModal] = useState<ModalState>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [assemblyColor, setAssemblyColor] = useState("#25a9ad");
  const [assemblyCanvasDefaults, setAssemblyCanvasDefaults] =
    useState<AssemblyCanvasDefaults>(defaultAssemblyCanvasDefaults);
  const [formClient, setFormClient] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [materialCodeError, setMaterialCodeError] = useState("");
  const [unit, setUnit] = useState("piece");
  const [priceMethod, setPriceMethod] = useState("Per piece");
  const [materialPriceTable, setMaterialPriceTable] = useState<Material["priceTable"]>("general");
  const [cost, setCost] = useState("0");
  const [options, setOptions] = useState("");
  const [glassDescription, setGlassDescription] = useState("");
  const [glassThickness, setGlassThickness] = useState("");
  const [materialSketch, setMaterialSketch] = useState("");
  const [materialPenPoints, setMaterialPenPoints] = useState<string[]>([]);
  const [assemblyReferenceImage, setAssemblyReferenceImage] = useState("");
  const [copyFromAssemblyOpen, setCopyFromAssemblyOpen] = useState(false);

  const [partIds, setPartIds] = useState<string[]>([]);
  const [partMaterialIds, setPartMaterialIds] = useState<Record<string, string>>({});
  const [partQuantities, setPartQuantities] = useState<Record<string, number>>({});
  const [partFormulas, setPartFormulas] = useState<Record<string, string>>({});
  const [partFourPanelFormulas, setPartFourPanelFormulas] = useState<Record<string, string>>({});
  const [partConditions, setPartConditions] = useState<Record<string, string>>({});
  const [partLabels, setPartLabels] = useState<Record<string, string>>({});
  const [newPartCode, setNewPartCode] = useState("");
  const [rules, setRules] = useState<BreakdownRule[]>([]);
  const [joinModifications, setJoinModifications] = useState<JoinModification[]>([]);
  const [frameTypes, setFrameTypes] = useState<FrameType[]>([]);
  const [nameRules, setNameRules] = useState<AssemblyNameRule[]>([]);
  const [realJoinPropertyMatches, setRealJoinPropertyMatches] = useState<JoinPropertyMatch[]>([]);
  const [fakeJoinPropertyMatches, setFakeJoinPropertyMatches] = useState<JoinPropertyMatch[]>([]);

  const [photoMenuMaterialId, setPhotoMenuMaterialId] = useState<string | null>(null);
  const [insertAfterMaterialId, setInsertAfterMaterialId] = useState<string | null>(null);
  const [insertMaterialCode, setInsertMaterialCode] = useState("");
  const [moveMaterialId, setMoveMaterialId] = useState<string | null>(null);

  const [activeFormulaField, setActiveFormulaField] = useState<{ materialId: string; field: "true" | "false" } | null>(null);
  const [formulaEditBackup, setFormulaEditBackup] = useState<{ materialId: string; field: "true" | "false"; value: string } | null>(null);
  const [activeConditionMaterialId, setActiveConditionMaterialId] = useState<string | null>(null);
  const [conditionEditBackup, setConditionEditBackup] = useState<{ materialId: string; value: string } | null>(null);

  const [assemblyAutoSaveStatus, setAssemblyAutoSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const assemblyAutoSaveReady = useRef(false);

  const [assemblyColumnWidths, setAssemblyColumnWidths] = useState([110, 84, 150, 200, 180, 200]);
  const [assemblyColumnResize, setAssemblyColumnResize] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  const [newDatabaseParent, setNewDatabaseParent] = useState<"technal" | "sidem" | null>(null);
  const [newDatabaseName, setNewDatabaseName] = useState("");

  const [newCompanyDatabaseOpen, setNewCompanyDatabaseOpen] = useState(false);
  const [newCompanyDatabaseName, setNewCompanyDatabaseName] = useState("");
  const [newCompanyDatabaseError, setNewCompanyDatabaseError] = useState("");

  const [newCompanyTableFor, setNewCompanyTableFor] = useState<CompanyDatabase | null>(null);
  const [newCompanyTableName, setNewCompanyTableName] = useState("");
  const [newCompanyTableReference, setNewCompanyTableReference] = useState("");
  const [newCompanyTableError, setNewCompanyTableError] = useState("");

  const [moveCompanyTable, setMoveCompanyTable] = useState<{ tableId?: string; name: string; sourceDatabaseId: string } | null>(null);
  const [moveCompanyTableTargetId, setMoveCompanyTableTargetId] = useState("");

  const materialDatabaseReference = (material: Material) =>
    materialDatabaseReferencePure(material, materials, companyPriceTables);
  const defaultAssemblyCode = (materialId: string) =>
    defaultAssemblyCodePure(materialId, materials, companyPriceTables);
  const materialFromAssemblyCode = (value: string) =>
    materialFromAssemblyCodePure(value, materials, companyPriceTables);

  const activeDatabase =
    databaseDefinitions[activeDatabaseId] ??
    (() => {
      const database = componentDatabases.find((item) => item.id === activeDatabaseId);
      const parentName = database?.parent === "technal" ? "Technal" : "Sidem";
      return {
        title: `${parentName} · ${database?.name ?? "Component"}`,
        eyebrow: `Database / ${parentName}`,
        description: `Materials used only by the ${database?.name ?? "selected"} component.`,
      };
    })();

  const materialScopeId = materialDatabaseOverride ?? activeDatabaseId;
  const materialScopeTitle =
    materialScopeId === "sidem"
      ? "Sidem"
      : databaseDefinitions[materialScopeId]?.title ?? activeDatabase.title;
  const materialScopeManufacturer =
    materialScopeId === "markups"
      ? "General"
      : materialScopeId === "manpower"
      ? "Man power"
      : materialScopeId === "shipping"
      ? "Shipping"
      : materialScopeId === "sidem"
      ? "Sidem"
      : "Technal";

  const assemblyFormulaValuesForEditorBase =
    modal?.type === "assembly" && modal.id === "fly-screen-2rail"
      ? ASSEMBLY_FORMULA_VALUES.filter((value) =>
          ["Width", "Height", "Area", "Perimeter", "Coating"].includes(value.name),
        )
      : ASSEMBLY_FORMULA_VALUES.filter((value) => {
          if (value.name === "NumberOfLeaves")
            return !["fixed-window", "tilt-and-turn-soleal-fyn"].includes(modal?.id ?? "");
          if (value.name === "OpeningType")
            return ["soleal-gyn-2rail", "hinged-window-soleal-fyn"].includes(modal?.id ?? "");
          if (value.name === "LeafSize")
            return ["hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(
              modal?.id ?? "",
            );
          if (value.name === "FrameSize")
            return ["hinged-window-soleal-fyn", "fixed-window", "tilt-and-turn-soleal-fyn"].includes(
              modal?.id ?? "",
            );
          if (value.name === "ArchitraveAllowance")
            return [
              TECHNAL_ASSEMBLY_ID,
              "soleal-gyn-2rail",
              "hinged-window-soleal-fyn",
              "fixed-window",
              "tilt-and-turn-soleal-fyn",
            ].includes(modal?.id ?? "");
          if (["JoinedUp", "JoinedDown", "JoinedLeft", "JoinedRight"].includes(value.name))
            return usesDirectJoinValues(assemblies.find((assembly) => assembly.id === modal?.id));
          if (value.name === "JoinedCorners")
            return usesDirectJoinValues(assemblies.find((assembly) => assembly.id === modal?.id));
          if (value.name === "FlyScreen")
            return ![
              TECHNAL_ASSEMBLY_ID,
              "soleal-gyn-2rail",
              "hinged-window-soleal-fyn",
              "fixed-window",
              "tilt-and-turn-soleal-fyn",
            ].includes(modal?.id ?? "");
          return true;
        });

  const assemblyFormulaValuesForEditor = assemblyFormulaValuesForEditorBase.some(
    (value) => value.name === "JoinLength",
  )
    ? assemblyFormulaValuesForEditorBase
    : [
        ...assemblyFormulaValuesForEditorBase,
        {
          name: "JoinLength",
          label: "Join length",
          description:
            "Total overlapping join length in metres, including both Real and Fake joins.",
        },
      ];

  const startAssemblyColumnResize = (
    event: PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setAssemblyColumnResize({
      index,
      startX: event.clientX,
      startWidth: assemblyColumnWidths[index],
    });
  };

  const resizeAssemblyColumn = (event: PointerEvent<HTMLDivElement>) => {
    if (!assemblyColumnResize) return;
    const delta = event.clientX - assemblyColumnResize.startX;
    setAssemblyColumnWidths((widths) =>
      widths.map((width, i) =>
        i === assemblyColumnResize.index ? Math.max(60, assemblyColumnResize.startWidth + delta) : width,
      ),
    );
  };

  const openModal = (
    type: "material" | "assembly" | "project" | "executionProject",
    id?: string,
    newMaterialPriceTable?: Material["priceTable"],
  ) => {
    assemblyAutoSaveReady.current = false;
    setAssemblyAutoSaveStatus("saved");
    setCopyFromAssemblyOpen(false);
    const record =
      type === "material"
        ? materials.find((x) => x.id === id)
        : type === "assembly"
        ? assemblies.find((x) => x.id === id)
        : type === "project"
        ? projects.find((x) => x.id === id)
        : executionProjects.find((x) => x.id === id);
    const material = record && "priceMethod" in record ? (record as Material) : undefined;
    const assembly = record && "rules" in record ? (record as Assembly) : undefined;
    setFormName(
      record?.name ?? (type === "project" || type === "executionProject" ? "Project 1" : ""),
    );
    setFormCode("code" in (record ?? {}) ? (record as Material | Assembly).code : "");
    setMaterialCodeError("");
    setFormCategory(
      "category" in (record ?? {})
        ? (record as Material | Assembly).category
        : type === "assembly"
        ? standardAssemblyCategory(activeDatabaseId) ?? "Assembly"
        : "",
    );
    setFormManufacturer(
      record && "manufacturer" in record
        ? record.manufacturer ?? ""
        : type === "assembly"
        ? activeAssemblySystem === "technal"
          ? "Technal"
          : "Sidem"
        : "",
    );
    setAssemblyColor(assembly?.color ?? assemblyDefaultColor(assembly?.id));
    setAssemblyCanvasDefaults({ ...defaultAssemblyCanvasDefaults, ...assembly?.canvasDefaults });
    setRules(assembly?.rules ?? []);
    setFormClient(
      record && "client" in record
        ? record.client
        : type === "project" || type === "executionProject"
        ? "Client"
        : "",
    );
    setFormCompany(
      record && "company" in record
        ? record.company ?? ""
        : type === "project" || type === "executionProject"
        ? "Company"
        : "",
    );
    setFormLocation(
      record && "location" in record
        ? record.location ?? ""
        : type === "project" || type === "executionProject"
        ? "Lebanon"
        : "",
    );
    const editableParts =
      record && "parts" in record ? record.parts.map((part) => ({ id: part.id ?? makeId(), part })) : [];
    setPartIds(editableParts.map(({ id }) => id));
    setPartMaterialIds(Object.fromEntries(editableParts.map(({ id, part }) => [id, part.materialId])));
    setPartQuantities(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.quantity]))
        : {},
    );
    setPartFormulas(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.quantityFormula ?? ""]))
        : {},
    );
    setPartFourPanelFormulas(
      editableParts.length
        ? Object.fromEntries(
            editableParts.map(({ id, part }) => [
              id,
              part.quantityFormulaOtherwise ?? part.quantityFormulaFourPanels ?? "0",
            ]),
          )
        : {},
    );
    setPartConditions(
      editableParts.length
        ? Object.fromEntries(editableParts.map(({ id, part }) => [id, part.conditionFormula ?? ""]))
        : {},
    );
    setPartLabels(
      editableParts.length
        ? Object.fromEntries(
            editableParts.map(({ id, part }) => [id, part.label ?? defaultAssemblyCode(part.materialId)]),
          )
        : {},
    );
    setJoinModifications(
      record && "joinModifications" in record ? record.joinModifications ?? [] : [],
    );
    setFrameTypes(assembly?.frameTypes ?? []);
    setNameRules(assembly?.nameRules ?? []);
    const joinPropertyNames = new Set<string>(
      joinMatchPropertiesForAssembly(assembly?.assemblyPage ?? activeDatabaseId, assembly?.id).map(
        (property) => property.value,
      ),
    );
    setRealJoinPropertyMatches(
      (assembly?.realJoinPropertyMatches ?? []).filter((rule) => joinPropertyNames.has(rule.property)),
    );
    setFakeJoinPropertyMatches(
      (assembly?.fakeJoinPropertyMatches ?? []).filter((rule) => joinPropertyNames.has(rule.property)),
    );
    setNewPartCode("");
    setMaterialSketch(record && "sketch" in record ? record.sketch : "");
    setAssemblyReferenceImage(assembly?.referenceImage ?? "");
    setUnit(material?.unit ?? "piece");
    setPriceMethod(material?.priceMethod ?? "Per piece");
    setMaterialPriceTable(material?.priceTable ?? newMaterialPriceTable ?? "general");
    setCost(String(material?.cost ?? 0));
    setOptions(material?.options?.join(", ") ?? "");
    setGlassDescription(material?.description ?? "");
    setGlassThickness(inferGlassThickness(material));
    setModal({ type, id });
  };

  const closeModal = () => {
    assemblyAutoSaveReady.current = false;
    setModal(null);
    setMaterialDatabaseOverride(null);
    setCompanyMaterialTableId(null);
  };

  const copyAssemblyContentFrom = (sourceId: string) => {
    const source = assemblies.find((assembly) => assembly.id === sourceId);
    if (!source) return;
    if (partIds.length || frameTypes.length || joinModifications.length) {
      if (
        !confirm(
          `Replace this assembly's materials, formulas, conditions, Frame types, and join formulas with those from ${source.name}?`,
        )
      )
        return;
    }
    const copiedParts = source.parts.map((part) => ({ id: makeId(), part }));
    setPartIds(copiedParts.map((entry) => entry.id));
    setPartMaterialIds(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.materialId])));
    setPartQuantities(Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.quantity])));
    setPartFormulas(
      Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.quantityFormula ?? ""])),
    );
    setPartFourPanelFormulas(
      Object.fromEntries(
        copiedParts.map(({ id, part }) => [
          id,
          part.quantityFormulaOtherwise ?? part.quantityFormulaFourPanels ?? "0",
        ]),
      ),
    );
    setPartConditions(
      Object.fromEntries(copiedParts.map(({ id, part }) => [id, part.conditionFormula ?? ""])),
    );
    setPartLabels(
      Object.fromEntries(
        copiedParts.map(({ id, part }) => [id, part.label ?? defaultAssemblyCode(part.materialId)]),
      ),
    );
    setFrameTypes((source.frameTypes ?? []).map((frameType) => ({ ...frameType, id: makeId() })));
    setNameRules((source.nameRules ?? []).map((rule) => ({ ...rule, id: makeId() })));
    setRealJoinPropertyMatches(
      (source.realJoinPropertyMatches ?? [])
        .filter((rule) => rule.property !== "quantity")
        .map((rule) => ({ ...rule, id: makeId(), withAssemblyIds: [...rule.withAssemblyIds] })),
    );
    setFakeJoinPropertyMatches(
      (source.fakeJoinPropertyMatches ?? [])
        .filter((rule) => rule.property !== "quantity")
        .map((rule) => ({ ...rule, id: makeId(), withAssemblyIds: [...rule.withAssemblyIds] })),
    );
    setJoinModifications((source.joinModifications ?? []).map((modification) => ({ ...modification })));
    setRules(source.rules.map((rule) => ({ ...rule, id: makeId() })));
    setCopyFromAssemblyOpen(false);
  };

  const addAssemblyPartByCode = (
    insertAfterId?: string,
    code = newPartCode,
    blank = false,
  ) => {
    const material = materialFromAssemblyCode(code);
    if (!material) return;
    const partId = makeId();
    setPartIds((ids) => {
      if (!insertAfterId) return [...ids, partId];
      const index = ids.indexOf(insertAfterId);
      return index < 0 ? [...ids, partId] : [...ids.slice(0, index + 1), partId, ...ids.slice(index + 1)];
    });
    setPartMaterialIds((values) => ({ ...values, [partId]: material.id }));
    setPartQuantities((values) => ({ ...values, [partId]: 1 }));
    setPartFormulas((values) => ({ ...values, [partId]: blank ? "" : material.quantityFormula || "1" }));
    setPartFourPanelFormulas((values) => ({ ...values, [partId]: blank ? "" : "0" }));
    setPartConditions((values) => ({ ...values, [partId]: "" }));
    setPartLabels((labels) => ({ ...labels, [partId]: code }));
    setNewPartCode("");
  };

  const moveAssemblyPartAfter = (movingId: string, targetId: string) => {
    if (movingId === targetId) return;
    setPartIds((ids) => {
      const withoutMoving = ids.filter((id) => id !== movingId);
      const targetIndex = withoutMoving.indexOf(targetId);
      return targetIndex < 0
        ? ids
        : [...withoutMoving.slice(0, targetIndex + 1), movingId, ...withoutMoving.slice(targetIndex + 1)];
    });
    setMoveMaterialId(null);
  };

  const setMaterialPhoto = (file: File, confirmReplacement = false) => {
    if (
      confirmReplacement &&
      materialSketch.startsWith("data:image/") &&
      !window.confirm("A photo already exists. Do you want to replace it?")
    )
      return;
    const reader = new FileReader();
    reader.onload = () => setMaterialSketch(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const pasteMaterialPhoto = (event: ClipboardEvent<HTMLElement>) => {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
      item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();
    if (!file) return;
    event.preventDefault();
    setMaterialPhoto(file, true);
  };

  const materialPoint = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return `${((event.clientX - rect.left) / rect.width) * 100},${
      ((event.clientY - rect.top) / rect.height) * 100
    }`;
  };

  const materialDrawStart = (event: PointerEvent<SVGSVGElement>) =>
    setMaterialPenPoints([materialPoint(event)]);
  const materialDrawMove = (event: PointerEvent<SVGSVGElement>) => {
    if (materialPenPoints.length) setMaterialPenPoints((points) => [...points, materialPoint(event)]);
  };
  const materialDrawEnd = () => setMaterialPenPoints([]);

  const beginFormulaEdit = (
    materialId: string,
    field: "true" | "false",
    initialValue: string,
  ) => {
    setActiveFormulaField({ materialId, field });
    setFormulaEditBackup({
      materialId,
      field,
      value: (field === "true" ? partFormulas[materialId] : partFourPanelFormulas[materialId]) ?? initialValue,
    });
  };

  const cancelFormulaEdit = (materialId: string, field: "true" | "false") => {
    if (formulaEditBackup?.materialId === materialId && formulaEditBackup.field === field) {
      if (field === "true") setPartFormulas((values) => ({ ...values, [materialId]: formulaEditBackup.value }));
      else setPartFourPanelFormulas((values) => ({ ...values, [materialId]: formulaEditBackup.value }));
    }
  };

  const insertFormulaValue = (
    materialId: string,
    field: "true" | "false",
    token: string,
  ) => {
    const setter = field === "true" ? setPartFormulas : setPartFourPanelFormulas;
    setter((values) => {
      const current = values[materialId] ?? "";
      return { ...values, [materialId]: `${current}${current ? " " : ""}${token}` };
    });
  };

  const insertConditionToken = (materialId: string, token: string) => {
    setPartConditions((values) => {
      const current = values[materialId] ?? "";
      return { ...values, [materialId]: `${current}${token}` };
    });
  };

  const updateJoinPropertyMatch = (
    kind: "real" | "fake",
    id: string,
    change: Partial<JoinPropertyMatch>,
  ) => {
    const setter = kind === "real" ? setRealJoinPropertyMatches : setFakeJoinPropertyMatches;
    setter((rows) => rows.map((row) => (row.id === id ? { ...row, ...change } : row)));
  };

  const removeJoinPropertyMatch = (kind: "real" | "fake", id: string) => {
    const setter = kind === "real" ? setRealJoinPropertyMatches : setFakeJoinPropertyMatches;
    setter((rows) => rows.filter((row) => row.id !== id));
  };

  const addJoinPropertyMatch = (kind: "real" | "fake", defaultProperty?: string) => {
    const property = defaultProperty ?? "hasArchitrave";
    const row: JoinPropertyMatch = { id: makeId(), property, withAssemblyIds: [] };
    const setter = kind === "real" ? setRealJoinPropertyMatches : setFakeJoinPropertyMatches;
    setter((rows) => [...rows, row]);
  };

  const save = (event?: FormEvent, closeAfterSave = true) => {
    event?.preventDefault();
    if (!modal || !formName.trim()) return;
    if (modal.type === "material") {
      const existingMaterial = modal.id ? materials.find((value) => value.id === modal.id) : undefined;
      const targetDatabaseId =
        existingMaterial?.databaseId ?? materialDatabaseOverride ?? activeDatabaseId;
      const targetManufacturer =
        existingMaterial?.manufacturer ??
        companyDatabases.find((database) => database.id === targetDatabaseId)?.name ??
        (targetDatabaseId === "sidem"
          ? "Sidem"
          : targetDatabaseId === "markups"
          ? "General"
          : "Technal");
      const isGlass = targetDatabaseId === "glass";
      const code = formCode.trim();
      if (!isGlass && !code) {
        setMaterialCodeError(
          "Material code is required. Use the supplier or item reference, for example GY3808 or A-55.",
        );
        return;
      }
      const duplicate =
        !isGlass &&
        materials.find(
          (material) =>
            material.id !== modal.id &&
            material.code.trim().toLocaleUpperCase() === code.toLocaleUpperCase(),
        );
      if (duplicate) {
        setMaterialCodeError(
          `Code ${code} already belongs to “${duplicate.name}”. Material codes must be unique across Soleal and every company database.`,
        );
        return;
      }
      const item: Material = {
        id: modal.id ?? makeId(),
        name: formName,
        code:
          code ||
          glassReference(
            materials.filter((material) => material.databaseId === "glass" && material.id !== modal.id)
              .length,
          ),
        supplierCode: existingMaterial?.supplierCode ?? "",
        category: isGlass ? "Glass" : formCategory || "Other",
        unit: isGlass ? "m²" : unit,
        weight: existingMaterial?.weight ?? 0,
        rateMethod: existingMaterial?.rateMethod ?? "manual",
        manualRate: existingMaterial?.manualRate,
        weightRateTableId: existingMaterial?.weightRateTableId,
        priceMethod: isGlass ? "Per m²" : priceMethod,
        cost: Number(cost) || 0,
        shippingPercentage: existingMaterial?.shippingPercentage ?? 0,
        shippingTypeId: existingMaterial?.shippingTypeId,
        options: isGlass
          ? options
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : existingMaterial?.options ?? [],
        thickness: isGlass ? glassThickness.trim() || undefined : existingMaterial?.thickness,
        description: isGlass ? glassDescription.trim() || undefined : existingMaterial?.description,
        properties: existingMaterial?.properties ?? [],
        sketch: materialSketch || "M18 18H82V82H18Z",
        manufacturer: targetManufacturer,
        databaseId: targetDatabaseId,
        companyTableId: existingMaterial?.companyTableId ?? companyMaterialTableId ?? undefined,
        priceTable:
          targetDatabaseId === "glass"
            ? undefined
            : existingMaterial?.priceTable ?? materialPriceTable,
        quantityFormula: existingMaterial?.quantityFormula ?? "1",
      };
      if (screen === "database" && activeDatabaseId === "prices") recordPriceChange();
      setMaterials((items) => {
        if (modal.id) return items.map((x) => (x.id === modal.id ? item : x));
        const insertIndex = priceInsertAfterMaterialId
          ? items.findIndex((value) => value.id === priceInsertAfterMaterialId)
          : -1;
        return insertIndex < 0
          ? [item, ...items]
          : [...items.slice(0, insertIndex + 1), item, ...items.slice(insertIndex + 1)];
      });
      setPriceInsertAfterMaterialId(null);
    }
    if (modal.type === "assembly") {
      const existingAssembly = modal.id ? assemblies.find((value) => value.id === modal.id) : undefined;
      const isTechnalTwoSlider = modal.id === TECHNAL_ASSEMBLY_ID || formCode === technalAssembly.code;
      const assemblyPage =
        existingAssembly?.assemblyPage ??
        (activeDatabaseId === TWO_RAIL_WINDOW_PAGE
          ? TWO_RAIL_WINDOW_PAGE
          : activeDatabaseId === FLY_SCREEN_PAGE
          ? FLY_SCREEN_PAGE
          : activeDatabaseId === HINGE_WINDOW_PAGE
          ? HINGE_WINDOW_PAGE
          : activeDatabaseId === FIXED_WINDOW_PAGE
          ? FIXED_WINDOW_PAGE
          : activeDatabaseId === TILT_AND_TURN_PAGE
          ? TILT_AND_TURN_PAGE
          : undefined);
      const item: Assembly = {
        id: modal.id ?? makeId(),
        name: formName,
        code: formCode || "Not assigned",
        category: (standardAssemblyCategory(assemblyPage) ?? formCategory) || "Assembly",
        properties: (existingAssembly?.id === "fly-screen-2rail"
          ? ASSEMBLY_FORMULA_VALUES.slice(0, 4)
          : ASSEMBLY_FORMULA_VALUES
        )
          .filter(
            (value) =>
              (existingAssembly?.id ?? modal.id) !== "tilt-and-turn-soleal-fyn" ||
              (value.name !== "NumberOfLeaves" && value.name !== "FlyScreen" && value.name !== "OpeningType"),
          )
          .map((value) => value.name),
        parts: partIds.map((partId) => ({
          id: partId,
          materialId: partMaterialIds[partId],
          quantity: partQuantities[partId] ?? 1,
          quantityFormula: partFormulas[partId]?.trim() || undefined,
          quantityFormulaOtherwise: partFourPanelFormulas[partId]?.trim() || "0",
          conditionFormula: partConditions[partId]?.trim() || undefined,
          label: partLabels[partId]?.trim() || undefined,
        })),
        rules,
        sketch: isTechnalTwoSlider
          ? TWO_SLIDER_DOOR_SKETCH
          : materialSketch || "M15 15H85V85H15ZM50 15V85",
        referenceImage: assemblyReferenceImage || undefined,
        manufacturer: formManufacturer.trim() || undefined,
        databaseId:
          existingAssembly?.databaseId ??
          (activeAssemblySystem === "technal" ? activeDatabaseId : "sidem"),
        templateSource: existingAssembly?.templateSource,
        joinModifications: usesDirectJoinValues(existingAssembly)
          ? []
          : (existingAssembly?.databaseId ??
              (activeAssemblySystem === "technal" ? activeDatabaseId : "sidem")) === TECHNAL_FYN_DATABASE
          ? completeFynJoinModifications(joinModifications)
          : existingAssembly?.joinModifications ?? [],
        frameTypes: frameTypes.filter((row) => row.type.trim() || row.condition.trim()),
        nameRules: nameRules.filter((row) => row.name.trim()),
        realJoinPropertyMatches: realJoinPropertyMatches.filter(
          (row) => joinMatchPropertyKeys.has(row.property) && row.withAssemblyIds.length,
        ),
        fakeJoinPropertyMatches: fakeJoinPropertyMatches.filter(
          (row) => joinMatchPropertyKeys.has(row.property) && row.withAssemblyIds.length,
        ),
        color: assemblyColor,
        canvasDefaults: assemblyCanvasDefaults,
        assemblyPage,
      };
      setAssemblies((items) =>
        modal.id ? items.map((x) => (x.id === modal.id ? item : x)) : [item, ...items],
      );
    }
    if (modal.type === "project") {
      const item: Project = modal.id
        ? {
            ...(projects.find((x) => x.id === modal.id) as Project),
            name: formName,
            client: formClient,
            company: formCompany.trim() || undefined,
            location: formLocation,
          }
        : {
            id: makeId(),
            name: formName,
            client: formClient,
            company: formCompany.trim() || undefined,
            location: formLocation,
            year: String(activeProjectYear),
            items: [],
            canvases: [{ id: "opening-1", name: "Opening 1", items: [] }],
          };
      setProjects((items) =>
        modal.id ? items.map((x) => (x.id === modal.id ? item : x)) : [item, ...items],
      );
      if (!modal.id) {
        setSelectedProjectId(item.id);
        setSelectedCanvasId("opening-1");
        setScreen("canvas");
      }
    }
    if (modal.type === "executionProject") {
      const item: ExecutionProject = {
        id: makeId(),
        name: formName.trim(),
        client: formClient.trim(),
        company: formCompany.trim() || undefined,
        location: formLocation.trim(),
        createdAt: new Date().toISOString(),
        files: [],
      };
      setExecutionProjects((items) => [item, ...items]);
    }
    if (closeAfterSave) closeModal();
  };

  const assemblyAutoSaveKey =
    modal?.type === "assembly" && modal.id
      ? JSON.stringify({
          formName,
          formCode,
          formCategory,
          formManufacturer,
          assemblyColor,
          assemblyCanvasDefaults,
          partIds,
          partMaterialIds,
          partQuantities,
          partFormulas,
          partFourPanelFormulas,
          partConditions,
          partLabels,
          rules,
          joinModifications,
          frameTypes,
          nameRules,
          realJoinPropertyMatches,
          fakeJoinPropertyMatches,
          materialSketch,
          assemblyReferenceImage,
        })
      : "";

  useEffect(() => {
    if (modal?.type !== "assembly" || !modal.id) return;
    if (!assemblyAutoSaveReady.current) {
      assemblyAutoSaveReady.current = true;
      return;
    }
    if (!formName.trim()) return;
    setAssemblyAutoSaveStatus("saving");
    const timer = window.setTimeout(() => {
      save(undefined, false);
      setAssemblyAutoSaveStatus("saved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [assemblyAutoSaveKey, modal?.id, modal?.type]);

  const remove = (
    type: "material" | "assembly" | "project" | "executionProject",
    id: string,
  ) => {
    const requiredPermission =
      type === "material"
        ? WORKSPACE_PERMISSIONS.DELETE_MATERIAL
        : type === "assembly"
        ? WORKSPACE_PERMISSIONS.DELETE_ASSEMBLY
        : type === "project"
        ? WORKSPACE_PERMISSIONS.DELETE_PROJECT
        : WORKSPACE_PERMISSIONS.DELETE_EXECUTION_PROJECT;
    if (!hasPermission(permissions, requiredPermission)) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    if (type === "material") setMaterials((x) => x.filter((v) => v.id !== id));
    if (type === "assembly") setAssemblies((x) => x.filter((v) => v.id !== id));
    if (type === "project") {
      const next = projects.filter((v) => v.id !== id);
      setProjects(next);
      if (next.length) setSelectedProjectId(next[0].id);
    }
    if (type === "executionProject") {
      setExecutionProjects((items) => items.filter((x) => x.id !== id));
    }
  };

  const openPriceComponent = (
    databaseId: string,
    priceTable?: Material["priceTable"],
    insertAfterMaterialId?: string
  ) => {
    setMaterialDatabaseOverride(databaseId);
    setPriceInsertAfterMaterialId(insertAfterMaterialId ?? null);
    openModal("material", undefined, priceTable);
  };

  const openCompanyTableMaterial = (
    databaseId: string,
    tableId: string,
    priceTable: Material["priceTable"] = "profiles",
    insertAfterMaterialId?: string
  ) => {
    setCompanyMaterialTableId(tableId);
    openPriceComponent(databaseId, priceTable, insertAfterMaterialId);
  };

  const openNewDatabase = (parent: "technal" | "sidem") => {
    setNewDatabaseName("");
    setNewDatabaseParent(parent);
  };

  const saveNewDatabase = (event: FormEvent) => {
    event.preventDefault();
    if (!newDatabaseParent || !newDatabaseName.trim()) return;
    const database: ComponentDatabase = {
      id: makeId(),
      name: newDatabaseName.trim(),
      parent: newDatabaseParent,
    };
    setComponentDatabases((items) => [...items, database]);
    setActiveDatabaseId(database.id);
    setScreen("database");
    setNewDatabaseParent(null);
  };

  const openNewCompanyDatabase = () => {
    setNewCompanyDatabaseName("");
    setNewCompanyDatabaseError("");
    setNewCompanyDatabaseOpen(true);
  };

  const saveNewCompanyDatabase = (event: FormEvent) => {
    event.preventDefault();
    const name = newCompanyDatabaseName.trim();
    if (!name) {
      setNewCompanyDatabaseError("Enter a company name.");
      return;
    }
    if (name.toLocaleLowerCase() === "soleal" || name.toLocaleLowerCase() === "technal") {
      setNewCompanyDatabaseError("Soleal is the main database. Choose another name for this company.");
      return;
    }
    if (companyDatabases.some((database) => database.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setNewCompanyDatabaseError(`${name} database already exists.`);
      return;
    }
    const database = { id: `company-${makeId()}`, name };
    setCompanyDatabases((databases) => [...databases, database]);
    setActiveDatabaseId(database.id);
    setNewCompanyDatabaseName("");
    setNewCompanyDatabaseError("");
    setNewCompanyDatabaseOpen(false);
  };

  const openNewCompanyTable = (database: CompanyDatabase) => {
    setNewCompanyTableFor(database);
    setNewCompanyTableName("");
    setNewCompanyTableReference("");
    setNewCompanyTableError("");
  };

  const saveNewCompanyTable = (event: FormEvent) => {
    event.preventDefault();
    if (!newCompanyTableFor) return;
    const name = newCompanyTableName.trim();
    const referencePrefix = companyTableReferencePrefix(newCompanyTableReference);
    if (!name || !referencePrefix) {
      setNewCompanyTableError("Enter both a table name and a material reference.");
      return;
    }
    const existingPrefixes = new Set([
      "GY",
      "FY",
      "GL",
      ...companyPriceTables.map((table) => table.referencePrefix.toUpperCase()),
    ]);
    if (existingPrefixes.has(referencePrefix.toUpperCase())) {
      setNewCompanyTableError(`Reference ${referencePrefix} is already used. Enter a different reference.`);
      return;
    }
    setCompanyPriceTables((tables) => [
      ...tables,
      { id: `company-table-${makeId()}`, companyDatabaseId: newCompanyTableFor.id, name, referencePrefix },
    ]);
    setNewCompanyTableFor(null);
  };

  const openMoveCompanyTable = (
    table: { id?: string; tableId?: string; name: string; sourceDatabaseId?: string },
    sourceDatabaseId?: string,
  ) => {
    const srcDbId = sourceDatabaseId ?? table.sourceDatabaseId ?? "";
    const targetDatabase = [{ id: "prices", name: "Soleal" }, ...companyDatabases].find(
      (database) => database.id !== srcDbId,
    );
    setMoveCompanyTable({ tableId: table.tableId ?? table.id, name: table.name, sourceDatabaseId: srcDbId });
    setMoveCompanyTableTargetId(targetDatabase?.id ?? "");
  };

  const saveMoveCompanyTable = (event: FormEvent) => {
    event.preventDefault();
    if (!moveCompanyTable || !moveCompanyTableTargetId) return;
    const targetTableId = moveCompanyTable.tableId ?? `company-table-${makeId()}`;
    if (moveCompanyTable.tableId) {
      setCompanyPriceTables((tables) =>
        tables.map((table) =>
          table.id === targetTableId ? { ...table, companyDatabaseId: moveCompanyTableTargetId } : table,
        ),
      );
    }
    setMaterials((items) =>
      items.map((material) =>
        material.companyTableId === moveCompanyTable.tableId
          ? {
              ...material,
              databaseId: moveCompanyTableTargetId,
              companyTableId: moveCompanyTableTargetId === "prices" ? undefined : targetTableId,
            }
          : material,
      ),
    );
    setActiveDatabaseId(moveCompanyTableTargetId);
    setMoveCompanyTable(null);
  };

  return {
    modal,
    setModal,
    openModal,
    closeModal,
    formName,
    setFormName,
    formCode,
    setFormCode,
    formCategory,
    setFormCategory,
    formManufacturer,
    setFormManufacturer,
    assemblyColor,
    setAssemblyColor,
    assemblyCanvasDefaults,
    setAssemblyCanvasDefaults,
    formClient,
    setFormClient,
    formCompany,
    setFormCompany,
    formLocation,
    setFormLocation,
    materialCodeError,
    setMaterialCodeError,
    unit,
    setUnit,
    priceMethod,
    setPriceMethod,
    materialPriceTable,
    setMaterialPriceTable,
    cost,
    setCost,
    options,
    setOptions,
    glassDescription,
    setGlassDescription,
    glassThickness,
    setGlassThickness,
    materialSketch,
    setMaterialSketch,
    materialPenPoints,
    materialDrawStart,
    materialDrawMove,
    materialDrawEnd,
    assemblyReferenceImage,
    setAssemblyReferenceImage,
    copyFromAssemblyOpen,
    setCopyFromAssemblyOpen,
    partIds,
    setPartIds,
    partMaterialIds,
    partQuantities,
    setPartQuantities,
    partFormulas,
    setPartFormulas,
    partFourPanelFormulas,
    setPartFourPanelFormulas,
    partConditions,
    setPartConditions,
    partLabels,
    setPartLabels,
    rules,
    setRules,
    joinModifications,
    setJoinModifications,
    frameTypes,
    setFrameTypes,
    nameRules,
    setNameRules,
    realJoinPropertyMatches,
    fakeJoinPropertyMatches,
    assemblyAutoSaveStatus,
    assemblyColumnWidths,
    startAssemblyColumnResize,
    resizeAssemblyColumn,
    setAssemblyColumnResize,
    photoMenuMaterialId,
    setPhotoMenuMaterialId,
    insertAfterMaterialId,
    setInsertAfterMaterialId,
    insertMaterialCode,
    setInsertMaterialCode,
    moveMaterialId,
    setMoveMaterialId,
    activeFormulaField,
    setActiveFormulaField,
    activeConditionMaterialId,
    setActiveConditionMaterialId,
    conditionEditBackup,
    setConditionEditBackup,
    materialScopeTitle,
    materialScopeManufacturer,
    materialScopeId,
    assemblyFormulaValuesForEditor,
    materialDatabaseReference,
    defaultAssemblyCode,
    materialFromAssemblyCode,
    copyAssemblyContentFrom,
    addAssemblyPartByCode,
    moveAssemblyPartAfter,
    setMaterialPhoto,
    pasteMaterialPhoto,
    beginFormulaEdit,
    cancelFormulaEdit,
    setFormulaEditBackup,
    insertFormulaValue,
    insertConditionToken,
    updateJoinPropertyMatch,
    removeJoinPropertyMatch,
    addJoinPropertyMatch,
    save,
    remove,
    newDatabaseParent,
    setNewDatabaseParent,
    newDatabaseName,
    setNewDatabaseName,
    openNewDatabase,
    saveNewDatabase,
    newCompanyDatabaseOpen,
    setNewCompanyDatabaseOpen,
    newCompanyDatabaseName,
    setNewCompanyDatabaseName,
    newCompanyDatabaseError,
    setNewCompanyDatabaseError,
    openNewCompanyDatabase,
    saveNewCompanyDatabase,
    newCompanyTableFor,
    setNewCompanyTableFor,
    newCompanyTableName,
    setNewCompanyTableName,
    newCompanyTableReference,
    setNewCompanyTableReference,
    newCompanyTableError,
    setNewCompanyTableError,
    openNewCompanyTable,
    saveNewCompanyTable,
    moveCompanyTable,
    setMoveCompanyTable,
    moveCompanyTableTargetId,
    setMoveCompanyTableTargetId,
    openMoveCompanyTable,
    saveMoveCompanyTable,
    openPriceComponent,
    openCompanyTableMaterial,
  };
}
