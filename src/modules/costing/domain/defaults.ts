import type { ManpowerCost, MarkupRate, ShippingCost, ShippingType } from "../../../domain/types";

/**
 * Seed data for the costing state (markup rates, manpower costs, shipping
 * types/costs), relocated verbatim out of App.tsx — see
 * docs/architecture/OVERVIEW.md. Pure data, no dependencies.
 */
export const defaultMarkupRates: MarkupRate[] = [
  ["design-costs", "Design Costs", 3, 1, 1],
  ["project-management", "Project Management", 4, 3, 1],
  ["site-overheads", "Project Overheads (Site Overheads)", 0, 0, 0],
  ["site-logistics", "Project Overheads (Site Logistics)", 1, 1, 0],
  ["other-overheads", "Other Overheads", 0, 0, 0],
  ["consultancy-fees", "Consultancy Fees", 0, 0, 0],
  ["finance-charges", "Finance Charges", 1, 0, 0],
  ["management-supporting", "Management & Supporting", 6, 2, 2],
  ["utilities", "Utilities", 3, 3, 0],
  ["smd", "SMD (Sales, Marketing & Development)", 0, 0, 0],
  ["depreciation", "Depreciation", 1, 0, 0],
  ["holding-fees", "Alumco Holding Fees", 0, 0, 0],
  ["general-financial-charges", "General Financial Charges", 0, 0, 0],
  ["tax-zakat", "Tax & Zakat", 0, 0, 0],
  ["contingencies", "Contingencies", 1, 1, 0],
  ["profit", "Profit", 11, 8, 6],
  ["discount", "Discount", 0, 0, 0],
].map(([id, name, typeA, typeB, typeC]) => ({ id: String(id), name: String(name), typeA: Number(typeA), typeB: Number(typeB), typeC: Number(typeC) }));

export const defaultManpowerCosts: ManpowerCost[] = [
  ["fabrication", "Fabrication", 3.33],
  ["installation", "Installation", 4.5],
  ["logistics", "Logistics", 2.85],
  ["store", "Store", 4],
  ["others", "Others", 4],
].map(([id, name, rate]) => ({ id: String(id), name: String(name), rate: Number(rate) }));

export const defaultShippingTypes: ShippingType[] = [{ id: "type-1", name: "Type 1" }];

export const defaultShippingCosts: ShippingCost[] = [
  ["load-truck-charges", "Load - Truck Charges", 1],
  ["export-duty-payment", "Export - Duty Payment", 2],
  ["export-transport-port", "Export - Transport to Port", 3],
  ["export-unloading", "Export - Unloading", 4],
  ["export-landing-charges", "Export - Landing Charges", 5],
  ["import-transport-port", "Import - Transport to Port", 6],
  ["import-landing-charges", "Import - Landing Charges", 7],
  ["import-unloading", "Import - Unloading", 8],
  ["import-transport-destination", "Import - Trans. to Destination", 9],
  ["insurance", "Insurance", 10],
  ["customs-clearance", "Customs Clearance", 11],
  ["duties-taxes", "Duties and Taxes", 12],
].map(([id, name, percentage]) => ({ id: String(id), name: String(name), values: { "type-1": Number(percentage) } }));
