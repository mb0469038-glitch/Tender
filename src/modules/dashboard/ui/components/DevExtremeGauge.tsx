import { useEffect, useRef, useState } from "react";
import type { RealCatalogCategory } from "../../domain/dashboardTypes";

interface DevExtremeGaugeProps {
  totalMaterials: number;
  catalogCategories: RealCatalogCategory[];
  totalAssemblies: number;
  height?: number;
}

export function DevExtremeGauge({
  totalMaterials,
  catalogCategories,
  totalAssemblies,
  height = 230,
}: DevExtremeGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const devExpress = (window as unknown as { DevExpress?: any }).DevExpress;
    if (!devExpress?.viz?.dxCircularGauge) {
      return;
    }

    const gaugeInstance = new devExpress.viz.dxCircularGauge(el, {
      scale: {
        startValue: 0,
        endValue: 120,
        tickInterval: 20,
        label: {
          customizeText: (arg: any) => `${arg.valueText}`,
          font: { size: 10, weight: 600, color: "#64748B" },
        },
      },
      rangeContainer: {
        width: 10,
        ranges: [
          { startValue: 0, endValue: 40, color: "#93C5FD" },   // Base items
          { startValue: 40, endValue: 80, color: "#60A5FA" },  // Profiles & Hardware
          { startValue: 80, endValue: 120, color: "#165BAA" }, // Full Catalog
        ],
      },
      value: totalMaterials,
      subvalues: [100],
      valueIndicator: {
        type: "triangleNeedle",
        color: "#0B1F4D",
        width: 8,
      },
      subvalueIndicator: {
        type: "triangleMarker",
        color: "#165BAA",
        length: 12,
        width: 10,
      },
      title: {
        text: `${totalMaterials} Catalog Items`,
        subtitle: {
          text: `${totalAssemblies} Standard System Assemblies`,
          font: { size: 11, weight: 600, color: "#165BAA" },
        },
        font: { size: 18, weight: 800, color: "#0B1F4D" },
        position: "bottom-center",
        margin: { top: 0, bottom: 0 },
      },
      animation: {
        duration: 900,
        easing: "easeOutCubic",
      },
    });

    setIsRendered(true);

    const resizeObserver = new ResizeObserver(() => {
      gaugeInstance.render();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      try {
        gaugeInstance.dispose();
      } catch {
        // ignore
      }
    };
  }, [totalMaterials, totalAssemblies]);

  const topCats = catalogCategories.slice(0, 3);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full relative">
        <div ref={containerRef} style={{ height: `${height}px`, width: "100%" }} />

        {!isRendered && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg text-xs text-[#64748B]"
            style={{ height: `${height}px` }}
          >
            <div className="w-6 h-6 border-2 border-[#CBD5E1] border-t-[#165BAA] rounded-full animate-spin mb-2" />
            <span>Rendering Real Catalog Gauge…</span>
          </div>
        )}
      </div>

      {/* Real Category Breakdown */}
      <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-[#E2E8F0] text-center">
        {topCats.map((cat, idx) => (
          <div key={idx} className="bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
            <div className="text-[10.5px] font-bold text-[#64748B] uppercase line-clamp-1" title={cat.category}>
              {cat.category}
            </div>
            <div className="text-sm font-extrabold text-[#0B1F4D] mt-0.5">{cat.count} items</div>
          </div>
        ))}
      </div>
    </div>
  );
}
