import type { Material, ShippingCost } from "../../../domain/types";

/**
 * Pure shipping-rate lookups, relocated out of App.tsx (previously closures
 * over `shippingCosts` state) — see docs/architecture/OVERVIEW.md.
 */
export const shippingRateForType = (typeId: string | undefined, shippingCosts: ShippingCost[]) => typeId
  ? shippingCosts.reduce((total, cost) => total + Math.max(0, cost.values[typeId] ?? 0), 0)
  : 0;

export const shippingRateForMaterial = (material: Material, shippingCosts: ShippingCost[]) => material.shippingTypeId
  ? shippingRateForType(material.shippingTypeId, shippingCosts)
  : Math.max(0, material.shippingPercentage ?? 0);

/** Grosses up direct cost by a markup percentage to get the selling price. */
export const sellingPriceFromDirectCost = (directCost: number, markupRatePercent: number) =>
  directCost / Math.max(0.01, 1 - markupRatePercent / 100);
