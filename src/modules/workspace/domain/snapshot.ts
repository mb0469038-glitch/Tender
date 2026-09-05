import type {
  Assembly,
  CompanyDatabase,
  CompanyPriceTable,
  ComponentDatabase,
  ManpowerCost,
  MarkupRate,
  Material,
  Project,
  ShippingCost,
  ShippingType,
} from "../../../domain/types";

/**
 * The shape of the single JSON blob persisted to the `workspace_snapshot`
 * SQLite row (see src-tauri/src/lib.rs). Versioned by name (V1) since this
 * is the whole-app-state-as-one-blob strategy kept deliberately as-is for
 * now — see docs/architecture/ADR-0001-modular-monolith-and-rbac.md.
 */
export type WorkspaceSnapshotV1 = {
  materials: Material[];
  assemblies: Assembly[];
  projects: Project[];
  componentDatabases: ComponentDatabase[];
  weightRates: Record<string, number>;
  markupRates: MarkupRate[];
  manpowerCurrency: string;
  manpowerCosts: ManpowerCost[];
  shippingTypes: ShippingType[];
  shippingCosts: ShippingCost[];
  fynAssemblyMaterialTemplateVersion: number;
  companyDatabases: CompanyDatabase[];
  companyPriceTables: CompanyPriceTable[];
  movedOriginalPriceTableIds: string[];
};

export const serializeWorkspaceSnapshot = (snapshot: WorkspaceSnapshotV1) => JSON.stringify(snapshot);
