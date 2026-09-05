import { useState } from "react";
import type { Assembly, Material } from "../../../domain/types";

/**
 * Owns the `materials`/`assemblies` state itself — the largest catalog
 * slice. Unlike earlier `use<Module>State()` hooks, this one takes the
 * initial values as parameters rather than importing seed data: the seed
 * generation (`withTechnalSeed`, `technalRows`, and friends) is large,
 * App.tsx-specific, and stays exactly where it is — only the bare `useState`
 * ownership moves. See docs/architecture/OVERVIEW.md.
 */
export function useCatalogItemsState(initialMaterials: Material[], initialAssemblies: Assembly[]) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [assemblies, setAssemblies] = useState(initialAssemblies);
  return { materials, setMaterials, assemblies, setAssemblies };
}
