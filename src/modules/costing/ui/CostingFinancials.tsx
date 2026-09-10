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
  return (
    <>
      <section className="flex items-end justify-between gap-6 p-[41px_48px_27px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:px-5 max-[700px]:pt-8">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
            Database / Costing &amp; Financials
          </p>
          <h1 className="m-0 text-[#11262a] text-[36px] font-bold tracking-[-0.035em]">
            Costing &amp; Financials
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-[15px] leading-relaxed">
            Manage tender markups, manpower, and shipping costs in one place.
          </p>
        </div>
      </section>
      <section className="mx-12 mb-9 p-[18px] border border-[#dfe8e8] rounded-[13px] bg-white shadow-[0_8px_27px_#183f4110] grid gap-3.5 max-[700px]:mx-5">
        <div className="flex items-center justify-between gap-4 pb-[18px] flex-wrap">
          <label className="w-[min(330px,100%)] h-10 flex items-center gap-2 px-3 border border-[#d5e0e1] rounded-[7px] text-[#698086] focus-within:border-[#27827d]">
            <Icon name="search" size={17} />
            <span className="sr-only">Search</span>
            <input
              className="w-full border-0 outline-none bg-transparent text-[#18363a] text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search costing items"
            />
          </label>
          <span className="ml-auto text-[#71898c] text-[10px] tabular-nums">
            Table {tableZoom}% · Ctrl + scroll
          </span>
        </div>
      <section className="justify-self-start w-[min(100%,560px)] overflow-auto border border-[#8eaac5] rounded-md bg-white" aria-labelledby="markups-heading">
        <header className="p-[10px_12px] border-b border-[#8eaac5] bg-[#224f82]">
          <div>
            <h2 id="markups-heading" className="m-0 text-white text-sm font-bold">Markups</h2>
            <p className="m-0 mt-0.5 text-white text-[11px]">Only the yellow percentage values can be edited.</p>
          </div>
        </header>
        <table className="w-full min-w-[540px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-[38%] p-[11px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-left uppercase">Markup Cost</th>
              <th className="p-[11px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-center uppercase">Type A</th>
              <th className="p-[11px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-center uppercase">Type B</th>
              <th className="p-[11px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-center uppercase">Type C</th>
            </tr>
          </thead>
          <tbody>
            {markupRates.map((rate) => (
              <tr key={rate.id}>
                <th scope="row" className="p-[4px_8px] border border-dotted border-[#607a91] bg-white text-[#192f40] font-medium text-left">{rate.name}</th>
                {markupFields.map((field) => (
                  <td key={field} className="border border-dotted border-[#607a91] bg-[#ffeca1]">
                    <label className="flex items-center justify-center gap-0.5 min-w-[112px] p-[3px_7px]">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rate[field]}
                        onChange={(event) => updateMarkupRate(rate.id, field, event.target.value)}
                        aria-label={`${rate.name} ${field.replace("type", "Type ")}`}
                        className="w-[76px] p-0.5 border-0 border-b border-transparent bg-transparent text-[#b96b00] font-bold text-right outline-none focus:border-b-[#b96b00] focus:bg-[#fff6c9]"
                      />
                      <span className="text-[#b96b00] font-bold">%</span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="p-[6px_8px] border border-solid border-[#7794ae] bg-[#e7e7e7] text-[#142c42] text-[13px] font-black text-left">Total Add Rate</th>
              {markupTotals.map((total, index) => (
                <td key={markupFields[index]} className="p-[6px_8px] border border-solid border-[#7794ae] bg-[#e7e7e7] text-[#142c42] text-[13px] font-black text-center">{number(total)}%</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </section>
      <section className="justify-self-start w-[min(100%,360px)] overflow-hidden border border-[#8eaac5] rounded-md bg-white" aria-labelledby="manpower-heading">
        <header className="p-[8px_10px] bg-[#224f82]"><h2 id="manpower-heading" className="m-0 text-white text-sm font-bold">Manpower Costs</h2></header>
        <div className="grid grid-cols-[40%_1fr] border-b border-dotted border-[#607a91]">
          <span className="p-[4px_8px] text-[#192f40] text-xs">Input Currency</span>
          <input
            className="min-w-0 p-[4px_8px] border-0 bg-[#fff200] text-[#283b14] font-bold text-center outline-none focus:ring-2 focus:ring-inset focus:ring-[#b5a800]"
            value={manpowerCurrency}
            onChange={(event) => setManpowerCurrency(event.target.value)}
            aria-label="Manpower input currency"
          />
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-[5px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-left uppercase">Manpower Costs</th>
              <th className="p-[5px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-center uppercase">Per Man Hour</th>
            </tr>
          </thead>
          <tbody>
            {manpowerCosts.map((cost) => (
              <tr key={cost.id}>
                <th scope="row" className="w-[40%] p-[4px_8px] border border-dotted border-[#607a91] bg-white text-[#192f40] font-medium text-left">{cost.name}</th>
                <td className="border border-dotted border-[#607a91] bg-[#ffeca1]">
                  <label className="block p-[3px_7px]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost.rate}
                      onChange={(event) => { const rate = Math.max(0, Number(event.target.value) || 0); setManpowerCosts((costs) => costs.map((item) => item.id === cost.id ? { ...item, rate } : item)); }}
                      aria-label={`${cost.name} cost per man hour`}
                      className="w-full p-px border-0 border-b border-transparent bg-transparent text-[#b96b00] font-bold text-right outline-none focus:border-b-[#b96b00] focus:bg-[#fff6c9]"
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="justify-self-start w-[min(100%,460px)] overflow-hidden border border-[#8eaac5] rounded-md bg-white" aria-labelledby="shipping-heading">
        <header className="flex items-center justify-between gap-2.5 p-[8px_10px] bg-[#224f82]">
          <h2 id="shipping-heading" className="m-0 text-white text-sm font-bold">Shipping Costs</h2>
          <button
            type="button"
            className="flex items-center gap-1 min-h-[26px] px-2 border border-[#b7d1e7] rounded bg-white text-[#224f82] text-[10px] font-extrabold whitespace-nowrap hover:bg-[#e7f1fa]"
            onClick={() => { const name = prompt("Shipping type name", `Type ${shippingTypes.length + 1}`); if (!name?.trim()) return; const type: ShippingType = { id: makeId(), name: name.trim() }; setShippingTypes((types) => [...types, type]); setShippingCosts((costs) => costs.map((cost) => ({ ...cost, values: { ...cost.values, [type.id]: 0 } }))); }}
          >
            <Icon name="plus" size={13} /> New shipping type
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="min-w-[230px] p-[5px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-left uppercase">Description</th>
                {shippingTypes.map((type) => (
                  <th key={type.id} className="min-w-[130px] p-[5px_8px] border border-dotted border-[#607a91] bg-[#a9c2dd] text-white text-[11px] text-center uppercase">
                    <span className="flex items-center justify-center gap-[3px]">
                      <b className="overflow-hidden text-ellipsis whitespace-nowrap">{type.name}</b>
                      <button
                        type="button"
                        className="grid place-items-center w-[18px] h-[18px] p-0 border-0 rounded-[3px] bg-white/25 text-white hover:bg-white/45"
                        onClick={() => { const name = prompt("Shipping type name", type.name); if (!name?.trim()) return; setShippingTypes((types) => types.map((item) => item.id === type.id ? { ...item, name: name.trim() } : item)); }}
                        aria-label={`Rename ${type.name}`}
                        title="Rename shipping type"
                      >
                        <Icon name="edit" size={11} />
                      </button>
                      <button
                        type="button"
                        className="grid place-items-center w-[18px] h-[18px] p-0 border-0 rounded-[3px] bg-white/25 text-white hover:bg-white/45"
                        onClick={() => { if (!confirm(`Delete shipping type \"${type.name}\"?`)) return; setShippingTypes((types) => types.filter((item) => item.id !== type.id)); setShippingCosts((costs) => costs.map((cost) => { const { [type.id]: _removed, ...values } = cost.values; return { ...cost, values }; })); setMaterials((items) => items.map((material) => material.shippingTypeId === type.id ? { ...material, shippingTypeId: undefined, shippingPercentage: 0 } : material)); }}
                        aria-label={`Delete ${type.name}`}
                        title="Delete shipping type"
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shippingCosts.filter((cost) => cost.name.toLowerCase().includes(query)).map((cost) => (
                <tr key={cost.id}>
                  <th scope="row" className="p-[4px_8px] border border-dotted border-[#607a91] bg-white text-[#192f40] font-medium text-left">{cost.name}</th>
                  {shippingTypes.map((type) => (
                    <td key={type.id} className="border border-dotted border-[#607a91] bg-[#ffeca1]">
                      <label className="flex items-center justify-center gap-0.5 p-[3px_7px]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cost.values[type.id] ?? 0}
                          onChange={(event) => { const value = Math.max(0, Number(event.target.value) || 0); setShippingCosts((costs) => costs.map((item) => item.id === cost.id ? { ...item, values: { ...item.values, [type.id]: value } } : item)); }}
                          aria-label={`${cost.name} ${type.name} shipping percentage`}
                          className="w-[76px] p-px border-0 border-b border-transparent bg-transparent text-[#b96b00] font-bold text-right outline-none focus:border-b-[#b96b00] focus:bg-[#fff6c9]"
                        />
                        <span className="text-[#b96b00] font-bold">%</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="p-[6px_8px] border border-solid border-[#7794ae] bg-[#e7e7e7] text-[#142c42] font-black text-left">Total</th>
                {shippingTypes.map((type) => (
                  <td key={type.id} className="p-[6px_8px] border border-solid border-[#7794ae] bg-[#e7e7e7] text-[#142c42] font-black text-center">{number(shippingCosts.reduce((total, cost) => total + (cost.values[type.id] ?? 0), 0))}%</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </section>
  </>
  );
}
