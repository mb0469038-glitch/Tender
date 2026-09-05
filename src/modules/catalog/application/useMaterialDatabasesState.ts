import { useState } from "react";
import type { CompanyDatabase, CompanyPriceTable, ComponentDatabase } from "../../../domain/types";
import { defaultComponentDatabases } from "../domain/defaults";

/**
 * Owns the "material sub-database" bookkeeping state: Sidem's user-creatable
 * component databases, per-table weight rates, the parallel "other
 * manufacturer" company-database/table system, and price-table migration
 * tracking. Second `use<Module>State()` hook (see
 * docs/architecture/OVERVIEW.md) — called once from App.tsx, returns the
 * exact same variable/setter names App.tsx already uses everywhere.
 */
export function useMaterialDatabasesState() {
  const [componentDatabases, setComponentDatabases] = useState<ComponentDatabase[]>(defaultComponentDatabases);
  const [weightRates, setWeightRates] = useState<Record<string, number>>({});
  const [companyDatabases, setCompanyDatabases] = useState<CompanyDatabase[]>([]);
  const [companyPriceTables, setCompanyPriceTables] = useState<CompanyPriceTable[]>([]);
  const [movedOriginalPriceTableIds, setMovedOriginalPriceTableIds] = useState<string[]>([]);

  return {
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
  };
}
