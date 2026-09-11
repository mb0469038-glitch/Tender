import { Dispatch, SetStateAction } from "react";
import type { Assembly, ComponentDatabase } from "../../../domain/types";
import { Icon } from "../../../design-system/Icon";
import { Sketch } from "../../../design-system/Sketch";
import { PermissionGate } from "../../../shared/permissions/PermissionGate";
import { WORKSPACE_PERMISSIONS } from "../../workspace-legacy/domain/permissions";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../domain/catalogDefinitions";

export type AssemblyLibraryProps = {
  activeAssemblySystem: "technal" | "sidem";
  activeDatabaseId: string;
  componentDatabases: ComponentDatabase[];
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  assemblies: Assembly[];
  openModal: (type: "assembly", id?: string) => void;
  remove: (type: "assembly", id: string) => void;
  onOpenAssembly?: (id: string) => void;
};

export function AssemblyLibrary({
  activeAssemblySystem,
  activeDatabaseId,
  componentDatabases,
  search,
  setSearch,
  assemblies,
  openModal,
  remove,
  onOpenAssembly,
}: AssemblyLibraryProps) {
  const systemName = activeAssemblySystem === "technal" ? "Technal" : "Sidem";
  const isTwoRailWindowPage = activeDatabaseId === TWO_RAIL_WINDOW_PAGE;
  const isFlyScreenPage = activeDatabaseId === FLY_SCREEN_PAGE;
  const isHingeWindowPage = activeDatabaseId === HINGE_WINDOW_PAGE;
  const isFixedWindowPage = activeDatabaseId === FIXED_WINDOW_PAGE;
  const isTiltAndTurnPage = activeDatabaseId === TILT_AND_TURN_PAGE;

  const activeAssemblyDatabase = componentDatabases.find((database) => database.id === activeDatabaseId);
  const activeSubcategory =
    activeAssemblyDatabase?.parent === activeAssemblySystem ? activeAssemblyDatabase.name : undefined;
  const assemblyCategoryName = isTwoRailWindowPage
    ? "2 rail system"
    : isFlyScreenPage
      ? "Fly screen"
      : isHingeWindowPage
        ? "Hinged system"
        : isFixedWindowPage
          ? "Fixed window"
          : isTiltAndTurnPage
            ? "Tilt and Turn"
            : activeSubcategory ?? systemName;

  const assemblyQuery = search.trim().toLowerCase();
  const systemAssemblies = assemblies.filter(
    (assembly) =>
      (isTwoRailWindowPage
        ? (assembly.assemblyPage === TWO_RAIL_WINDOW_PAGE || assembly.id === "soleal-gyn-2rail")
        : isFlyScreenPage
          ? (assembly.assemblyPage === FLY_SCREEN_PAGE || assembly.id === "fly-screen-2rail")
          : isHingeWindowPage
            ? (assembly.assemblyPage === HINGE_WINDOW_PAGE || assembly.id === "hinged-window-soleal-fyn" || assembly.id === "hinge-window")
            : isFixedWindowPage
              ? (assembly.assemblyPage === FIXED_WINDOW_PAGE || assembly.id === "fixed-window")
              : isTiltAndTurnPage
                ? (assembly.assemblyPage === TILT_AND_TURN_PAGE || assembly.id === "tilt-and-turn-soleal-fyn")
                : activeSubcategory
                  ? assembly.databaseId === activeDatabaseId
                  : (activeAssemblySystem === "technal"
                      ? (assembly.manufacturer?.toLowerCase() === "technal" || assembly.manufacturer?.toLowerCase() === "soleal")
                      : assembly.manufacturer?.toLowerCase() === "sidem")) &&
      `${assembly.name || ""} ${assembly.code || ""}`.toLowerCase().includes(assemblyQuery)
  );

  return (
    <>
      <section className="flex items-end justify-between gap-6 p-[41px_48px_27px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:px-5 max-[700px]:pt-8">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
            Assemblies / {assemblyCategoryName}
          </p>
          <h1 className="m-0 text-[#11262a] text-[36px] font-bold tracking-[-0.035em]">
            {assemblyCategoryName} assemblies
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-[15px] leading-relaxed">
            Reusable technical components that calculate material quantities from their formulas.
          </p>
        </div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_ASSEMBLY}>
          <button
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
            onClick={() => openModal("assembly")}
          >
            <Icon name="plus" />{" "}
            {isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage
              ? "Add type"
              : "Add assembly"}
          </button>
        </PermissionGate>
      </section>
      <section className="mx-12 mb-9 p-[18px] border border-[#dfe8e8] rounded-[13px] bg-white shadow-[0_8px_27px_#183f4110] max-[700px]:mx-5">
        <div className="flex items-center justify-between gap-4 pb-[18px] flex-wrap">
          <label className="w-[min(330px,100%)] h-10 flex items-center gap-2 px-3 border border-[#d5e0e1] rounded-[7px] text-[#698086] focus-within:border-[#27827d]">
            <Icon name="search" size={17} />
            <span className="sr-only">Search assemblies</span>
            <input
              className="w-full border-0 outline-none bg-transparent text-[#18363a] text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assemblies"
            />
          </label>
          <span className="text-[#687d81] text-[13px]">{systemAssemblies.length} assemblies</span>
        </div>
        <div
          className={`grid gap-4 ${
            isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage
              ? "grid-cols-[repeat(2,minmax(260px,1fr))] max-[700px]:grid-cols-1"
              : "grid-cols-[repeat(auto-fill,minmax(225px,1fr))]"
          }`}
        >
          {systemAssemblies.map((assembly) => (
            <article
              className="min-h-[270px] overflow-hidden border border-[#dfe7e8] rounded-[10px] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8dbdb8] hover:shadow-[0_9px_20px_#17424419] flex flex-col cursor-pointer group"
              key={assembly.id}
              onClick={() => {
                if (onOpenAssembly) {
                  onOpenAssembly(assembly.id);
                } else {
                  openModal("assembly", assembly.id);
                }
              }}
            >
              <div className="h-[125px] w-full bg-[#f7fbfa] flex items-center justify-center overflow-hidden border-b border-[#edf3f3]">
                <Sketch path={assembly.sketch} label={assembly.name} />
              </div>
              <div className="p-[15px] flex-1 flex flex-col justify-between">
                <h2 className="m-0 text-[#173a3f] text-[16px] font-bold group-hover:text-[#176f6b] transition-colors">{assembly.name}</h2>
                <div className="flex gap-1.5 mt-3">
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#d2dfdf] rounded-md bg-[#f4f8f8] text-[#285d61] text-xs font-bold hover:bg-[#e6f1f1] cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenAssembly) {
                        onOpenAssembly(assembly.id);
                      } else {
                        openModal("assembly", assembly.id);
                      }
                    }}
                  >
                    <Icon name="edit" size={15} /> Edit
                  </button>
                  <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_ASSEMBLY}>
                    <button
                      className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#f2d0d0] rounded-md bg-[#fdf2f2] text-[#a83737] text-xs font-bold hover:bg-[#fae4e4] cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove("assembly", assembly.id);
                      }}
                    >
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </article>
          ))}
          {!systemAssemblies.length && (
            <p className="col-span-full m-0 p-[42px_22px] border border-dashed border-[#b8d1d3] rounded-[10px] bg-white text-[#607d80] text-center text-sm">
              No {assemblyCategoryName} assemblies yet. Add one to start building reusable components.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
