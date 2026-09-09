/**
 * Fixed permission keys for the existing (not-yet-extracted) App.tsx screens.
 * Must stay in sync with src-tauri/src/auth/permissions_catalog.rs — see
 * docs/architecture/RBAC.md. This file has no other code in it on purpose:
 * it exists only to name the permissions that gate today's screens, ahead of
 * the Phase-2 extraction of materials/assemblies/projects/canvas/costing into
 * their own clean-architecture modules (see ../README.md).
 */
export const WORKSPACE_PERMISSIONS = {
  VIEW_PROJECTS: "workspace.projects.view",
  CREATE_PROJECT: "workspace.projects.create",
  DELETE_PROJECT: "workspace.projects.delete",
  EDIT_CANVAS: "workspace.canvas.edit",

  VIEW_EXECUTION_PROJECTS: "workspace.execution-projects.view",
  CREATE_EXECUTION_PROJECT: "workspace.execution-projects.create",
  DELETE_EXECUTION_PROJECT: "workspace.execution-projects.delete",

  VIEW_DATABASE: "workspace.database.view",
  CREATE_MATERIAL: "workspace.materials.create",
  EDIT_MATERIAL: "workspace.materials.edit",
  DELETE_MATERIAL: "workspace.materials.delete",

  VIEW_ASSEMBLIES: "workspace.assemblies.view",
  CREATE_ASSEMBLY: "workspace.assemblies.create",
  DELETE_ASSEMBLY: "workspace.assemblies.delete",

  VIEW_COSTING: "workspace.costing.view",
  EDIT_COSTING: "workspace.costing.edit",

  VIEW_EXCEL: "workspace.excel.view",
} as const;

export const WORKSPACE_PERMISSIONS_LIST = Object.values(WORKSPACE_PERMISSIONS);
