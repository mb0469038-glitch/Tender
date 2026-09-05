import type { ComponentType, Dispatch, SetStateAction } from "react";
import { makeId } from "../../../shared/kernel/ids";
import { number } from "../../../shared/kernel/formatting";
import type { ManpowerCost, Material, MarkupRate, ShippingCost, ShippingType } from "../../../domain/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ComponentType<any>;

export type CostingFinancialsProps = {
  Icon: IconComponent;
  search: string;
  setSearch: (value: string) => void;
  tableZoom: number;
  markupRates: MarkupRate[];
  setMarkupRates: Dispatch<SetStateAction<MarkupRate[]>>;
  manpowerCurrency: string;
  setManpowerCurrency: (value: string) => void;
  manpowerCosts: ManpowerCost[];
  setManpowerCosts: Dispatch<SetStateAction<ManpowerCost[]>>;
  shippingTypes: ShippingType[];
  setShippingTypes: Dispatch<SetStateAction<ShippingType[]>>;
  shippingCosts: ShippingCost[];
  setShippingCosts: Dispatch<SetStateAction<ShippingCost[]>>;
  setMaterials: Dispatch<SetStateAction<Material[]>>;
};

/**
 * First screen component relocated out of App.tsx (Phase 10) — the smallest,
 * most self-contained one, used as the pilot for the "move a component"
 * pattern: convert what used to be closure-captured state into explicit
 * props, keep the JSX/behavior byte-for-byte identical. See
 * docs/architecture/OVERVIEW.md.
 */
export function CostingFinancials({
  Icon,
  search,
  setSearch,
  tableZoom,
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
  setMaterials,
}: CostingFinancialsProps) {
  const query = search.trim().toLowerCase();
  const markupFields = ["typeA", "typeB", "typeC"] as const;
  const markupTotals = markupFields.map((field) => markupRates.reduce((total, rate) => total + rate[field], 0));
  const updateMarkupRate = (id: string, field: typeof markupFields[number], value: string) => {
    const rate = Math.max(0, Number(value) || 0);
    setMarkupRates((rates) => rates.map((item) => item.id === id ? { ...item, [field]: rate } : item));
  };
  return <>
    <section className="page-heading">
      <div><p className="eyebrow">Database / Costing &amp; Financials</p><h1>Costing &amp; Financials</h1><p className="intro">Manage tender markups, manpower, and shipping costs in one place.</p></div>
    </section>
    <section className="library-panel price-book-panel">
      <div className="toolbar">
        <label className="search-field"><Icon name="search" size={17} /><span className="sr-only">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search costing items" /></label>
        <span className="table-zoom-readout">Table {tableZoom}% · Ctrl + scroll</span>
      </div>
      <section className="markup-rate-section" aria-labelledby="markups-heading">
        <header className="price-book-section-header"><div><h2 id="markups-heading">Markups</h2><p>Only the yellow percentage values can be edited.</p></div></header>
        <table className="markup-rate-table">
          <thead><tr><th>Markup Cost</th><th>Type A</th><th>Type B</th><th>Type C</th></tr></thead>
          <tbody>{markupRates.map((rate) => <tr key={rate.id}><th scope="row">{rate.name}</th>{markupFields.map((field) => <td key={field}><label><input type="number" min="0" step="0.01" value={rate[field]} onChange={(event) => updateMarkupRate(rate.id, field, event.target.value)} aria-label={`${rate.name} ${field.replace("type", "Type ")}`} /><span>%</span></label></td>)}</tr>)}</tbody>
          <tfoot><tr><th>Total Add Rate</th>{markupTotals.map((total, index) => <td key={markupFields[index]}>{number(total)}%</td>)}</tr></tfoot>
        </table>
      </section>
      <section className="manpower-cost-section" aria-labelledby="manpower-heading">
        <header><h2 id="manpower-heading">Manpower Costs</h2></header>
        <div className="manpower-currency"><span>Input Currency</span><input value={manpowerCurrency} onChange={(event) => setManpowerCurrency(event.target.value)} aria-label="Manpower input currency" /></div>
        <table className="manpower-cost-table">
          <thead><tr><th>Manpower Costs</th><th>Per Man Hour</th></tr></thead>
          <tbody>{manpowerCosts.map((cost) => <tr key={cost.id}><th scope="row">{cost.name}</th><td><label><input type="number" min="0" step="0.01" value={cost.rate} onChange={(event) => { const rate = Math.max(0, Number(event.target.value) || 0); setManpowerCosts((costs) => costs.map((item) => item.id === cost.id ? { ...item, rate } : item)); }} aria-label={`${cost.name} cost per man hour`} /></label></td></tr>)}</tbody>
        </table>
      </section>
      <section className="shipping-cost-section" aria-labelledby="shipping-heading">
        <header><h2 id="shipping-heading">Shipping Costs</h2><button type="button" onClick={() => { const name = prompt("Shipping type name", `Type ${shippingTypes.length + 1}`); if (!name?.trim()) return; const type: ShippingType = { id: makeId(), name: name.trim() }; setShippingTypes((types) => [...types, type]); setShippingCosts((costs) => costs.map((cost) => ({ ...cost, values: { ...cost.values, [type.id]: 0 } }))); }}><Icon name="plus" size={13} /> New shipping type</button></header>
        <div className="shipping-cost-scroll">
          <table className="shipping-cost-table">
            <thead><tr><th>Description</th>{shippingTypes.map((type) => <th key={type.id}><span className="shipping-type-heading"><b>{type.name}</b><button type="button" onClick={() => { const name = prompt("Shipping type name", type.name); if (!name?.trim()) return; setShippingTypes((types) => types.map((item) => item.id === type.id ? { ...item, name: name.trim() } : item)); }} aria-label={`Rename ${type.name}`} title="Rename shipping type"><Icon name="edit" size={11} /></button><button type="button" onClick={() => { if (!confirm(`Delete shipping type \"${type.name}\"?`)) return; setShippingTypes((types) => types.filter((item) => item.id !== type.id)); setShippingCosts((costs) => costs.map((cost) => { const { [type.id]: _removed, ...values } = cost.values; return { ...cost, values }; })); setMaterials((items) => items.map((material) => material.shippingTypeId === type.id ? { ...material, shippingTypeId: undefined, shippingPercentage: 0 } : material)); }} aria-label={`Delete ${type.name}`} title="Delete shipping type"><Icon name="trash" size={11} /></button></span></th>)}</tr></thead>
            <tbody>{shippingCosts.filter((cost) => cost.name.toLowerCase().includes(query)).map((cost) => <tr key={cost.id}><th scope="row">{cost.name}</th>{shippingTypes.map((type) => <td key={type.id}><label><input type="number" min="0" step="0.01" value={cost.values[type.id] ?? 0} onChange={(event) => { const value = Math.max(0, Number(event.target.value) || 0); setShippingCosts((costs) => costs.map((item) => item.id === cost.id ? { ...item, values: { ...item.values, [type.id]: value } } : item)); }} aria-label={`${cost.name} ${type.name} shipping percentage`} /><span>%</span></label></td>)}</tr>)}</tbody>
            <tfoot><tr><th>Total</th>{shippingTypes.map((type) => <td key={type.id}>{number(shippingCosts.reduce((total, cost) => total + (cost.values[type.id] ?? 0), 0))}%</td>)}</tr></tfoot>
          </table>
        </div>
      </section>
    </section>
  </>;
}
