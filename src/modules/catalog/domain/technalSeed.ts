import type { Assembly, JoinModification, Material } from "../../../domain/types";
import {
  FYN_CADRE_MATERIAL_ID,
  FYN_TRANSOM_MATERIAL_ID,
  GENERAL_ITEM_CODES,
  GLAZED_ALUMINIUM_CATEGORY,
  TECHNAL_ASSEMBLY_ID,
  TECHNAL_FYN_DATABASE,
  TECHNAL_GYN_DATABASE,
  TECHNAL_MANUFACTURER,
  FLY_SCREEN_PAGE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "./catalogDefinitions";

export const fynTransomPhoto =
  "data:image/png;base64,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";

export const fynTransomMaterial: Material = {
  id: FYN_TRANSOM_MATERIAL_ID,
  name: "FY2300 - Transom - T small",
  code: "FY2300",
  supplierCode: "",
  category: "Profiles",
  unit: "lm",
  weight: 0,
  priceMethod: "Per lm",
  cost: 14.9,
  wastage: 7,
  options: [],
  properties: [],
  sketch: fynTransomPhoto,
  manufacturer: "Technal",
  databaseId: TECHNAL_FYN_DATABASE,
  priceTable: "profiles",
};

export const fynParcloseMaterials: Material[] = [
  ["591001", "32-30"],
  ["591002", "29-26"],
  ["591003", "25-22"],
  ["591004", "21-18"],
  ["591005", "17-12"],
  ["591006", "17-12"],
  ["591007", "11-9"],
  ["591008", "8-7"],
  ["591009", "6-5"],
  ["591010", "4-3"],
  ["591011", "2-1"],
  ["591012", "<1"],
].map(([numberPart, thickness]) => ({
  id: `excel-hinged-fyn-${numberPart}`,
  name: `${numberPart} - Parclose-${thickness}mm`,
  code: `T${numberPart}`,
  supplierCode: `T${numberPart}`,
  category: "Aluminium profile",
  unit: "lm",
  weight: 0,
  rateMethod: "manual" as const,
  manualRate: 0,
  priceMethod: "Per lm",
  cost: 0,
  wastage: 0,
  options: [],
  properties: ["Width", "Height"],
  sketch: `/materials/fyn-parclose-${numberPart}.png`,
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: TECHNAL_FYN_DATABASE,
  priceTable: "profiles" as const,
}));

export const defaultFynJoinModifications = (): JoinModification[] => [
  { materialId: FYN_TRANSOM_MATERIAL_ID, topFormula: "+0.5*Width", bottomFormula: "+0.5*Width", leftFormula: "+0.5*Height", rightFormula: "+0.5*Height" },
  { materialId: FYN_CADRE_MATERIAL_ID, topFormula: "-Width", bottomFormula: "-Width", leftFormula: "-Height", rightFormula: "-Height" },
];

export const completeFynJoinModifications = (rows: JoinModification[] = []) => [
  ...defaultFynJoinModifications(),
  ...rows.filter((row) => ![FYN_TRANSOM_MATERIAL_ID, FYN_CADRE_MATERIAL_ID].includes(row.materialId)),
];

export const technalRows = [
  ["TCH-MISC", "Misc items - pan head screw- backing rod", "perimeter", 3],
  ["TCH-SIL", "Weather Silicone", "CEILING(perimeter/2,1)", 4.24],
  ["GY1114", "GY1114 - Dormant Inferieur", "Width", 20.481818181818184],
  ["GY1113", "GY1113 - Dormant", "Width+Height*2", 19.312121212121212],
  ["141021", "Traverse 32mm", "Width*2", 13.327272727272726],
  ["GY1300", "Ouvrant Lateral 24mm", "Height*2", 12.987878787878788],
  ["GY2302", "Ouvrant Central 24mm", "Height*2", 8.26818181818182],
  ["GY4000", "GY4000 - Profile Chicane", "Height*2", 9.89],
  ["431024", "431024 - Bouclier PVC superieur", "Width*2+Height*2", 2.9916666666666667],
  ["431025", "431025 - Bouclier PVC inferieur", "Width*2", 7.92],
  ["821000", "821000 - Bouclier thermique rail", "perimeter", 7.8],
  ["341000", "341000 - Clip Rail", "Width*4+Height*4", 4.02],
  ["391010m", "391010m - Couvre Joint", "Width*2+Height*4", 3.631818181818182],
  ["TAY0002", "TAY0002 - Goupille a vis d=6mm", "8", 0.657],
  ["T401011", "T401011 - Roulette simple", "4", 7.65],
  ["GY3700", "GY3700 - Fermeture 1 point", "2", 30.177000000000003],
  ["GY3705", "GY3705 - Gache dormant peripherique", "2", 5.391],
  ["GY3712", "GY3712 - Cuvette de manoeuvre semi fixe", "1", 34.902],
  ["GY3717", "GY3717 - Poignee tirage a manoeuvre", "1", 37.368],
  ["GY3803", "GY3803 - Talon Central D'etancheite", "1", 10.773000000000001],
  ["GY3804", "GY3804 - Bouchon montant lateral", "2", 4.167],
  ["GY3805", "GY3805 - Bouchon montant central", "2", 3.411],
  ["GY3807", "GY3807 - Bouchon recueil", "1", 2.9160000000000004],
  ["GY3831", "GY3831 - Cale de fermeture", "1", 1.773],
  ["GY3832", "GY3832 - Centreur d'ouvrant", "2", 4.761],
  ["GY3603", "GY3603 - Equerre 11x13.3 rainure", "8", 2.43],
] as const;

export const technalMaterials: Material[] = technalRows.map(([code, name, formula, cost]) => ({
  id: `technal-${code.toLowerCase()}`,
  name,
  code,
  supplierCode: code,
  category: "2 rail sliding window",
  unit: "LM",
  weight: 0,
  priceMethod: "Catalog unit price",
  cost,
  options: [],
  properties: ["Width", "Height"],
  sketch: "M18 18H82V82H18Z",
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: GENERAL_ITEM_CODES.has(code) ? "markups" : TECHNAL_GYN_DATABASE,
  quantityFormula: formula,
}));

export const technalAssembly: Assembly = {
  id: TECHNAL_ASSEMBLY_ID,
  name: "2 Rail System - Soleal - GYn",
  code: "TECHNAL-2SLD",
  category: GLAZED_ALUMINIUM_CATEGORY,
  manufacturer: TECHNAL_MANUFACTURER,
  databaseId: TECHNAL_GYN_DATABASE,
  assemblyPage: TWO_RAIL_WINDOW_PAGE,
  properties: ["Width", "Height"],
  parts: technalRows.map(([code, , formula]) => ({
    materialId: `technal-${code.toLowerCase()}`,
    quantity: 1,
    quantityFormula: formula,
  })),
  rules: [],
  sketch: "M12 12H88V88H12ZM37 12V88M63 12V88",
};

export const flyScreenAssembly: Assembly = {
  id: "fly-screen-2rail",
  name: "Fly screen - Soleal - GYn",
  code: "SOLEAL-GYN-FLY",
  category: "Fly screen",
  manufacturer: "Soleal",
  databaseId: TECHNAL_GYN_DATABASE,
  assemblyPage: FLY_SCREEN_PAGE,
  properties: ["Width", "Height"],
  parts: [],
  rules: [],
  sketch:
    "M12 12H88V88H12ZM20 20H80V80H20M32 20V80M44 20V80M56 20V80M68 20V80M20 32H80M20 44H80M20 56H80M20 68H80",
};

export const tiltAndTurnAssembly: Assembly = {
  id: "tilt-and-turn-soleal-fyn",
  name: "Tilt and Turn - Soleal - FYn",
  code: "SOLEAL-FYN-TILT-TURN",
  category: GLAZED_ALUMINIUM_CATEGORY,
  manufacturer: "Soleal",
  databaseId: TECHNAL_FYN_DATABASE,
  assemblyPage: TILT_AND_TURN_PAGE,
  properties: ["Width", "Height"],
  parts: [
    { label: "T&T-1", materialId: "import-markups-gen-misc-001", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-2", materialId: "import-markups-gen-sil-001", quantity: 1, quantityFormula: "Perimeter/2", quantityFormulaFourPanels: "Perimeter/2" },
    { label: "T&T-3", materialId: "excel-hinged-fyn-fy2203", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-4", materialId: "excel-hinged-fyn-fy2209", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter+2*Height" },
    { label: "T&T-5", materialId: "excel-hinged-fyn-591003", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter+2*Height" },
    { label: "T&T-6", materialId: "import-technal-gyn-391010m", quantity: 1, quantityFormula: "Perimeter", quantityFormulaFourPanels: "Perimeter" },
    { label: "T&T-7", materialId: "excel-hinged-fyn-410010", quantity: 1, quantityFormula: "Width*4+Height*4", quantityFormulaFourPanels: "Width*4+Height*8" },
    { label: "T&T-8", materialId: "excel-hinged-fyn-as0017", quantity: 1, quantityFormula: "Width*2+Height*2", quantityFormulaFourPanels: "Width*2+Height*4" },
    { label: "T&T-9", materialId: "excel-hinged-fyn-410018", quantity: 1, quantityFormula: "Width*2+Height*2", quantityFormulaFourPanels: "Width*2+Height*3" },
    { label: "T&T-10", materialId: "excel-hinged-fyn-740012", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-11", materialId: "excel-hinged-fyn-fy3653", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "4" },
    { label: "T&T-12", materialId: "excel-hinged-fyn-420022", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-13", materialId: "excel-hinged-fyn-750220", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-14", materialId: "excel-hinged-fyn-940025", quantity: 1, quantityFormula: "IF(Area>1.5,3,4)", quantityFormulaFourPanels: "IF(Area>3,6,4)" },
    { label: "T&T-15", materialId: "excel-hinged-fyn-750201", quantity: 1, quantityFormula: "4", quantityFormulaFourPanels: "8" },
    { label: "T&T-16", materialId: "excel-hinged-fyn-960017", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-17", materialId: "excel-hinged-fyn-960013", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-18", materialId: "excel-hinged-fyn-960010", quantity: 1, quantityFormula: "1", quantityFormulaFourPanels: "1" },
    { label: "T&T-19", materialId: "import-technal-gyn-ay0002", quantity: 1, quantityFormula: "16", quantityFormulaFourPanels: "32" },
  ],
  rules: [],
  sketch: "M12 12H88V88H12ZM50 12V88M18 20L50 50L18 80M82 20L50 50L82 80",
};

export const withTechnalSeed = (savedMaterials: Material[], savedAssemblies: Assembly[]) => ({
  materials: fynParcloseMaterials.reduce(
    (items, seed) =>
      items.some(
        (material) =>
          material.id === seed.id ||
          material.code.toLowerCase() === seed.code.toLowerCase()
      )
        ? items
        : [...items, seed],
    savedMaterials
  ),
  assemblies: [flyScreenAssembly, tiltAndTurnAssembly].reduce(
    (items, seed) =>
      items.some((assembly) => assembly.id === seed.id)
        ? items
        : [...items, seed],
    savedAssemblies
  ),
});
