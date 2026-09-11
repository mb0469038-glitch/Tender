import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AssemblyLibrary } from "../../modules/catalog/ui/AssemblyLibrary";
import {
  TWO_RAIL_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  FIXED_WINDOW_PAGE,
  TILT_AND_TURN_PAGE,
} from "../../modules/catalog/domain/catalogDefinitions";
import type { useAppState } from "../../application/useAppState";

export type AssemblyRouteWrapperProps = {
  state: ReturnType<typeof useAppState>;
};

const VALID_TECHNAL_PAGES = new Set([
  TWO_RAIL_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  FIXED_WINDOW_PAGE,
  TILT_AND_TURN_PAGE,
]);

export function AssemblyRouteWrapper({ state }: AssemblyRouteWrapperProps) {
  const { systemOrId, assemblyId } = useParams<{
    systemOrId?: string;
    assemblyId?: string;
  }>();
  const navigate = useNavigate();

  const {
    assemblies,
    componentDatabases,
    search,
    setSearch,
    modals,
    activeAssemblySystem,
    setActiveAssemblySystem,
    activeDatabaseId,
    setActiveDatabaseId,
  } = state;

  // Resolve active category/database from URL parameter or fallback
  let resolvedSystem: "technal" | "sidem" = activeAssemblySystem;
  let resolvedDatabaseId: string = activeDatabaseId;

  if (systemOrId) {
    if (systemOrId === "sidem") {
      resolvedSystem = "sidem";
      resolvedDatabaseId = "sidem";
    } else if (VALID_TECHNAL_PAGES.has(systemOrId)) {
      resolvedSystem = "technal";
      resolvedDatabaseId = systemOrId;
    } else {
      // Check if custom component database
      const compDb = componentDatabases.find((db) => db.id === systemOrId);
      if (compDb) {
        resolvedSystem = compDb.parent;
        resolvedDatabaseId = compDb.id;
      }
    }
  } else {
    // Default to TWO_RAIL_WINDOW_PAGE when visiting base /assemblies
    resolvedDatabaseId =
      activeDatabaseId && activeDatabaseId !== "prices" ? activeDatabaseId : TWO_RAIL_WINDOW_PAGE;
    resolvedSystem = "technal";
  }

  // Redirect base /assemblies to the resolved database subpage
  useEffect(() => {
    if (!systemOrId) {
      navigate(`/assemblies/${resolvedDatabaseId}`, { replace: true });
    }
  }, [systemOrId, resolvedDatabaseId, navigate]);

  // Keep active database synchronized with URL route
  useEffect(() => {
    if (resolvedDatabaseId && activeDatabaseId !== resolvedDatabaseId) {
      setActiveDatabaseId(resolvedDatabaseId);
    }
  }, [resolvedDatabaseId, activeDatabaseId, setActiveDatabaseId]);

  // Keep active system synchronized with URL route
  useEffect(() => {
    if (resolvedSystem && activeAssemblySystem !== resolvedSystem) {
      setActiveAssemblySystem(resolvedSystem);
    }
  }, [resolvedSystem, activeAssemblySystem, setActiveAssemblySystem]);

  // Track the ID of the assembly that was opened via route
  const lastOpenedIdRef = useRef<string | null>(null);

  // If URL has specific assemblyId, open the edit modal once
  useEffect(() => {
    if (assemblyId) {
      if (lastOpenedIdRef.current !== assemblyId && modals.modal?.id !== assemblyId) {
        lastOpenedIdRef.current = assemblyId;
        modals.openModal("assembly", assemblyId);
      }
    } else {
      lastOpenedIdRef.current = null;
    }
  }, [assemblyId, modals.modal?.id]);

  // When modal is closed, sync URL back to base category route if on an assemblyId route
  useEffect(() => {
    if (assemblyId && lastOpenedIdRef.current && !modals.modal) {
      lastOpenedIdRef.current = null;
      navigate(`/assemblies/${resolvedDatabaseId}`);
    }
  }, [modals.modal, assemblyId, resolvedDatabaseId, navigate]);

  const handleOpenAssembly = (id: string) => {
    lastOpenedIdRef.current = id;
    modals.openModal("assembly", id);
    navigate(`/assemblies/${resolvedDatabaseId}/${id}`);
  };

  return (
    <AssemblyLibrary
      activeAssemblySystem={resolvedSystem}
      activeDatabaseId={resolvedDatabaseId}
      componentDatabases={componentDatabases}
      search={search}
      setSearch={setSearch}
      assemblies={assemblies}
      openModal={modals.openModal}
      remove={modals.remove}
      onOpenAssembly={handleOpenAssembly}
    />
  );
}
