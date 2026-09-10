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
        ? assembly.assemblyPage === TWO_RAIL_WINDOW_PAGE
        : isFlyScreenPage
          ? assembly.assemblyPage === FLY_SCREEN_PAGE
          : isHingeWindowPage
            ? assembly.assemblyPage === HINGE_WINDOW_PAGE
            : isFixedWindowPage
              ? assembly.assemblyPage === FIXED_WINDOW_PAGE
              : isTiltAndTurnPage
                ? assembly.assemblyPage === TILT_AND_TURN_PAGE
                : activeSubcategory
                  ? assembly.databaseId === activeDatabaseId
                  : assembly.manufacturer?.toLowerCase() === systemName.toLowerCase()) &&
      `${assembly.name} ${assembly.code}`.toLowerCase().includes(assemblyQuery)
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Assemblies / {assemblyCategoryName}</p>
          <h1>{assemblyCategoryName} assemblies</h1>
          <p className="intro">Reusable technical components that calculate material quantities from their formulas.</p>
        </div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_ASSEMBLY}>
          <button className="primary-button" onClick={() => openModal("assembly")}>
            <Icon name="plus" />{" "}
            {isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage
              ? "Add type"
              : "Add assembly"}
          </button>
        </PermissionGate>
      </section>
      <section className="library-panel">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={17} />
            <span className="sr-only">Search assemblies</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assemblies"
            />
          </label>
          <span className="item-count">{systemAssemblies.length} assemblies</span>
        </div>
        <div
          className={`material-grid ${
            isTwoRailWindowPage || isFlyScreenPage || isHingeWindowPage || isFixedWindowPage || isTiltAndTurnPage
              ? "assembly-type-grid"
              : ""
          }`}
        >
          {systemAssemblies.map((assembly) => (
            <article className="material-card" key={assembly.id}>
              <div className="card-art">
                <Sketch path={assembly.sketch} label={assembly.name} />
              </div>
              <div className="card-content">
                <h2>{assembly.name}</h2>
                <div className="card-actions">
                  <button onClick={() => openModal("assembly", assembly.id)}>
                    <Icon name="edit" size={15} /> Edit
                  </button>
                  <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_ASSEMBLY}>
                    <button className="danger" onClick={() => remove("assembly", assembly.id)}>
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </article>
          ))}
          {!systemAssemblies.length && (
            <p className="price-book-empty">
              No {assemblyCategoryName} assemblies yet. Add one to start building reusable components.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
