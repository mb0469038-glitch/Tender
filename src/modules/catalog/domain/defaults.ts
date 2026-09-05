import type { ComponentDatabase } from "../../../domain/types";

/** Must match the constants of the same name/value in App.tsx. */
const TECHNAL_GYN_DATABASE_ID = "technal-gyn";
const TECHNAL_FYN_DATABASE_ID = "technal-fyn";

/**
 * Seed data for the "material sub-database" bookkeeping state, relocated
 * verbatim out of App.tsx — see docs/architecture/OVERVIEW.md.
 */
export const defaultComponentDatabases: ComponentDatabase[] = [
  { id: TECHNAL_GYN_DATABASE_ID, name: "GYn", parent: "technal" },
  { id: TECHNAL_FYN_DATABASE_ID, name: "FY", parent: "technal" },
];
