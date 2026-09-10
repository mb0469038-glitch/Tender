import type { AssemblyCanvasDefaults, Project } from "../../../domain/types";

export const TWO_SLIDER_DOOR_SKETCH =
  "M8 8H92V92H8ZM50 8V92M8 50H92M14 15H45V85H14ZM55 15H86V85H55M17 48l-7 4 7 4M83 48l7 4-7 4M22 82H41M59 18H78";

export const assemblyDefaultColor = (id?: string) =>
  id === "soleal-gyn-2rail" ? "#25a9ad" : id === "soleal-gy-2rail" ? "#527fc3" : "#d9e8ea";

export const projectYears = ["2026", "2027"] as const;

export const defaultManpowerHours: Record<string, number> = {
  fabrication: 4,
  installation: 5,
  logistics: 1,
  store: 1,
  others: 1,
};

export const defaultAssemblyCanvasDefaults: AssemblyCanvasDefaults = {
  width: 1500,
  height: 1200,
  leaves: 2,
  openingType: "window",
  leafSize: "small",
  frameSize: "small",
  hasArchitrave: false,
  hasArchitraveAllowance: false,
  reinforced: false,
  hasCoating: false,
};

export const projectData: Project[] = [
  {
    id: "project-1",
    name: "Riviera residence",
    client: "Riviera Development",
    company: "Company",
    location: "Lebanon",
    year: "2026",
    items: [
      {
        id: "item-1",
        sourceId: "window",
        kind: "assembly",
        name: "Sliding window type 1",
        sketch: "M15 13H85V87H15ZM50 13V87",
        x: 140,
        y: 110,
        width: 175,
        height: 130,
      },
    ],
  },
];
