import { useEffect, useRef, useState } from "react";
import type { MonthlyTenderDemand } from "../../domain/dashboardTypes";

interface DevExtremeChartProps {
  data: MonthlyTenderDemand[];
  height?: number;
}

export function DevExtremeChart({ data, height = 320 }: DevExtremeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const devExpress = (window as unknown as { DevExpress?: any }).DevExpress;
    if (!devExpress?.viz?.dxChart) {
      return;
    }

    // Register AMA Brand Palette once
    try {
      devExpress.viz.registerPalette("amaPalette", {
        simpleSet: ["#0B1F4D", "#165BAA", "#2D8ACD", "#0F766E", "#475569", "#F59E0B", "#10B981"],
        indicatingSet: ["#10B981", "#F59E0B", "#EF4444"],
        gradientSet: ["#0B1F4D", "#165BAA", "#2D8ACD"],
      });
    } catch {
      // Palette may already be registered
    }

    const chartInstance = new devExpress.viz.dxChart(el, {
      dataSource: data,
      palette: "amaPalette",
      commonSeriesSettings: {
        argumentField: "month",
        type: "stackedBar",
        hoverMode: "allArgumentPoints",
        selectionMode: "allArgumentPoints",
        label: {
          visible: false,
        },
      },
      series: [
        {
          valueField: "extrusionTons",
          name: "Extrusion Profile Weight (Tons)",
          color: "#0B1F4D",
          axis: "tonnageAxis",
        },
        {
          valueField: "glazingAreaM2",
          name: "Glazing Surface (m²)",
          type: "spline",
          color: "#2D8ACD",
          width: 3,
          point: {
            visible: true,
            size: 7,
            symbol: "circle",
            color: "#FFFFFF",
            border: { color: "#2D8ACD", width: 2.5, visible: true },
          },
          axis: "glazingAxis",
        },
      ],
      valueAxis: [
        {
          name: "tonnageAxis",
          position: "left",
          title: {
            text: "Aluminum Extrusion (Tons)",
            font: { color: "#0B1F4D", weight: 600, size: 12 },
          },
          grid: {
            visible: true,
            color: "#F1F5F9",
          },
          label: {
            font: { color: "#64748B", size: 11 },
          },
        },
        {
          name: "glazingAxis",
          position: "right",
          title: {
            text: "Glass Envelope (m²)",
            font: { color: "#2D8ACD", weight: 600, size: 12 },
          },
          grid: {
            visible: false,
          },
          label: {
            font: { color: "#64748B", size: 11 },
          },
        },
      ],
      argumentAxis: {
        grid: { visible: false },
        label: {
          font: { color: "#475569", weight: 600, size: 11 },
        },
      },
      legend: {
        verticalAlignment: "bottom",
        horizontalAlignment: "center",
        itemTextPosition: "right",
        font: { size: 12, weight: 600, color: "#1E293B" },
        margin: { top: 16 },
      },
      tooltip: {
        enabled: true,
        shared: true,
        font: { color: "#FFFFFF", size: 12 },
        color: "#0B1F4D",
        cornerRadius: 8,
        shadow: { opacity: 0.2, blur: 8 },
        format: {
          type: "fixedPoint",
          precision: 1,
        },
        customizeTooltip: (pointInfo: any) => {
          const tons = pointInfo.points?.find((p: any) => p.seriesName.includes("Extrusion"))?.valueText || "0";
          const glass = pointInfo.points?.find((p: any) => p.seriesName.includes("Glazing"))?.valueText || "0";
          return {
            html: `<div style="padding: 6px 10px; font-family: Inter, sans-serif;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px;">${pointInfo.argumentText} 2026 Demand</div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-top: 3px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #60A5FA;"></span>
                <span>Extrusion: <b>${tons} Tons</b></span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-top: 3px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38BDF8;"></span>
                <span>Glass Envelope: <b>${glass} m²</b></span>
              </div>
            </div>`,
          };
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutCubic",
      },
    });

    setIsRendered(true);

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.render();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      try {
        chartInstance.dispose();
      } catch {
        // ignore dispose error
      }
    };
  }, [data]);

  return (
    <div className="w-full relative">
      <div ref={containerRef} style={{ height: `${height}px`, width: "100%" }} />

      {/* Graceful fallback while DevExtreme loads */}
      {!isRendered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg text-xs text-[#64748B]"
          style={{ height: `${height}px` }}
        >
          <div className="w-6 h-6 border-2 border-[#CBD5E1] border-t-[#165BAA] rounded-full animate-spin mb-2" />
          <span>Rendering DevExtreme Façade Demand Chart…</span>
        </div>
      )}
    </div>
  );
}
