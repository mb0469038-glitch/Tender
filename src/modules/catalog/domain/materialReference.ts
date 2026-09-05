import type { CompanyPriceTable, Material } from "../../../domain/types";

/**
 * The material addressing/reference-numbering scheme: the bespoke
 * "GYn-3 / FY-12 / GP-5 / company-prefix-N" code-lookup system, relocated
 * out of App.tsx (previously closures over `materials`/`companyPriceTables`
 * state) — see docs/architecture/OVERVIEW.md.
 *
 * Must match the constants of the same name/value in App.tsx.
 */
const TECHNAL_GYN_DATABASE = "technal-gyn";
const TECHNAL_GY_DATABASE = "technal-gy";
const TECHNAL_FYN_DATABASE = "technal-fyn";
const TECHNAL_FY_DATABASE = "technal-fy";
const SOLEAL_JOINTS_DATABASE = "soleal-joints";

export const solealAccessoryMaterials = (materials: Material[]) => [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].flatMap((databaseId) => {
  const databaseMaterials = materials.filter((material) => material.databaseId === databaseId);
  const legacyProfileIds = new Set(databaseMaterials.filter((material) => !material.priceTable).slice(0, 7).map((material) => material.id));
  return databaseMaterials.filter((material) => material.priceTable === "accessories" || (!material.priceTable && !legacyProfileIds.has(material.id)));
});

export const solealProfileMaterials = (databaseId: string, materials: Material[]) => {
  const databaseMaterials = materials.filter((material) => material.databaseId === databaseId);
  const legacyProfileIds = new Set(databaseMaterials.filter((material) => !material.priceTable).slice(0, 7).map((material) => material.id));
  return databaseMaterials.filter((material) => material.priceTable === "profiles" || (!material.priceTable && legacyProfileIds.has(material.id)));
};

export const materialFromAssemblyCode = (value: string, materials: Material[], companyPriceTables: CompanyPriceTable[]) => {
  const companyReference = value.trim().toLowerCase().match(/^(.+?)-?(\d+)$/);
  if (companyReference) {
    const companyTable = companyPriceTables.find((table) => table.referencePrefix.toLowerCase() === companyReference[1]);
    if (companyTable) {
      return materials.filter((material) => material.companyTableId === companyTable.id)[Number(companyReference[2]) - 1];
    }
  }
  const match = value.trim().toLowerCase().match(/^(gyn|gy|fyn|fy|gp|ga|g|j|a)-?(\d+)$/);
  if (!match) return undefined;
  const index = Number(match[2]) - 1;
  if (match[1] === "a") return solealAccessoryMaterials(materials)[index];
  const databaseId = match[1] === "gyn" ? TECHNAL_GYN_DATABASE
    : match[1] === "gy" ? TECHNAL_GY_DATABASE
      : match[1] === "fyn" ? TECHNAL_FYN_DATABASE
        : match[1] === "fy" ? TECHNAL_FY_DATABASE
          : match[1] === "j" ? SOLEAL_JOINTS_DATABASE
            : "markups";
  if (["gyn", "gy", "fyn", "fy"].includes(match[1])) return solealProfileMaterials(databaseId, materials)[index];
  const table = match[1] === "gp" ? "profiles" : match[1] === "ga" ? "accessories" : "general";
  return materials.filter((material) => material.databaseId === databaseId && (databaseId !== "markups" ? true : table === "general" ? (!material.priceTable || material.priceTable === "general") : material.priceTable === table))[index];
};

export const materialDatabaseReference = (material: Material, materials: Material[], companyPriceTables: CompanyPriceTable[]) => {
  const companyTable = companyPriceTables.find((table) => table.id === material.companyTableId);
  if (companyTable) {
    const index = materials.filter((item) => item.companyTableId === companyTable.id).findIndex((item) => item.id === material.id) + 1;
    return index > 0 ? `${companyTable.referencePrefix}-${index}` : material.code;
  }
  const accessoryIndex = solealAccessoryMaterials(materials).findIndex((item) => item.id === material.id);
  if (accessoryIndex >= 0) return `A-${accessoryIndex + 1}`;
  const group = material.databaseId === TECHNAL_GYN_DATABASE ? "GYn"
    : material.databaseId === TECHNAL_GY_DATABASE ? "GY"
      : material.databaseId === TECHNAL_FYN_DATABASE ? "FYn"
        : material.databaseId === TECHNAL_FY_DATABASE ? "FY"
          : material.databaseId === SOLEAL_JOINTS_DATABASE ? "J"
            : material.databaseId === "markups" ? material.priceTable === "profiles" ? "GP" : material.priceTable === "accessories" ? "GA" : "G"
              : material.databaseId === "sidem" ? "S"
                : "";
  if (!group) return material.code;
  const sameTable = [TECHNAL_GYN_DATABASE, TECHNAL_GY_DATABASE, TECHNAL_FYN_DATABASE, TECHNAL_FY_DATABASE].includes(material.databaseId ?? "")
    ? solealProfileMaterials(material.databaseId ?? "", materials)
    : materials.filter((item) => item.databaseId === material.databaseId && (material.databaseId !== "markups" || (material.priceTable === "profiles" ? item.priceTable === "profiles" : material.priceTable === "accessories" ? item.priceTable === "accessories" : !item.priceTable || item.priceTable === "general")));
  const index = sameTable.findIndex((item) => item.id === material.id) + 1;
  return index > 0 ? `${group}-${index}` : material.code;
};

export const defaultAssemblyCode = (materialId: string, materials: Material[], companyPriceTables: CompanyPriceTable[]) => {
  const material = materials.find((item) => item.id === materialId);
  return material ? materialDatabaseReference(material, materials, companyPriceTables) : "";
};
