import { useEffect, useRef, useState } from "react";
import type { CuttingOptimizationYield } from "../../domain/dashboardTypes";

interface DevExtremeGaugeProps {
  data: CuttingOptimizationYield;
  height?: number;
}

export function DevExtremeGauge({ data, height = 240 }: DevExtremeGaugeProps) {
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
        startValue: 75,
        endValue: 100,
        tickInterval: 5,
        label: {
          customizeText: (arg: any) => `${arg.valueText}%`,
          font: { size: 10, weight: 600, color: "#64748B" },
        },
      },
      rangeContainer: {
        width: 10,
        ranges: [
          { startValue: 75, endValue: 88, color: "#FCA5A5" }, // Critical / Low Yield
          { startValue: 88, endValue: 93, color: "#FCD34D" }, // Acceptable
          { startValue: 93, endValue: 100, color: "#86EFAC" }, // High Yield Optimal
        ],
      },
      value: data.overallYieldPercent,
      subvalues: [data.targetBenchmarkPercent],
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
        text: `${data.overallYieldPercent}% Linear Yield`,
        subtitle: {
          text: `Target Benchmark: ${data.targetBenchmarkPercent}%`,
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
  }, [data]);

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
            <span>Rendering Optimization Gauge…</span>
          </div>
        )}
      </div>

      {/* Shop floor metrics breakdown */}
      <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-[#E2E8F0] text-center">
        <div className="bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
          <div className="text-[10.5px] font-bold text-[#64748B] uppercase">Kerf Saw Loss</div>
          <div className="text-sm font-extrabold text-[#0B1F4D] mt-0.5">{data.kerfWastagePercent}%</div>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
          <div className="text-[10.5px] font-bold text-[#64748B] uppercase">End Trim Loss</div>
          <div className="text-sm font-extrabold text-[#0B1F4D] mt-0.5">{data.trimWastagePercent}%</div>
        </div>
        <div className="bg-[#EFF6FF] rounded-lg p-2 border border-[#BFDBFE]">
          <div className="text-[10.5px] font-bold text-[#165BAA] uppercase">Reclaimed Offcuts</div>
          <div className="text-sm font-extrabold text-[#165BAA] mt-0.5">{(data.reclaimedOffcutsKg / 1000).toFixed(1)}t</div>
        </div>
      </div>
    </div>
  );
}
