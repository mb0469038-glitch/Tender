import { useState } from "react";
import type { ManpowerCost, MarkupRate, Material, ShippingCost, ShippingType } from "../../../domain/types";
import { defaultManpowerCosts, defaultMarkupRates, defaultShippingCosts, defaultShippingTypes } from "../domain/defaults";
import { shippingRateForMaterial as shippingRateForMaterialPure, shippingRateForType as shippingRateForTypePure } from "../domain/pricing";

/**
 * Owns the costing state slice (markup rates, manpower currency/costs,
 * shipping types/costs) — the first state-ownership extraction out of
 * App.tsx (Phase 4). Called once from App.tsx; returns the exact same
 * variable/setter names App.tsx already uses everywhere, so no other call
 * site needs to change. See docs/architecture/OVERVIEW.md for the
 * `use<Module>State()` convention this establishes.
 */
export function useCostingState() {
  const [markupRates, setMarkupRates] = useState<MarkupRate[]>(defaultMarkupRates);
  const [manpowerCurrency, setManpowerCurrency] = useState("US Dollar");
  const [manpowerCosts, setManpowerCosts] = useState<ManpowerCost[]>(defaultManpowerCosts);
  const [shippingTypes, setShippingTypes] = useState<ShippingType[]>(defaultShippingTypes);
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>(defaultShippingCosts);

  return {
    markupRates,
    setMarkupRates,
    manpowerCurrency,
    setManpowerCurrency,
    manpowerCosts,
    setManpowerCosts,
    shippingTypes,
    setShippingTypes,
    shippingCosts,
    setShippingCosts,
    shippingRateForType: (typeId?: string) => shippingRateForTypePure(typeId, shippingCosts),
    shippingRateForMaterial: (material: Material) => shippingRateForMaterialPure(material, shippingCosts),
  };
}
