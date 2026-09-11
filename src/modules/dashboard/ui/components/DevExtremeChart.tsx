import { useEffect, useRef, useState } from "react";
import type { RealOpeningItem } from "../../domain/dashboardTypes";

interface DevExtremeChartProps {
  openings: RealOpeningItem[];
  height?: number;
}

export function DevExtremeChart({ openings, height = 310 }: DevExtremeChartProps) {
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
      // ignore
    }

    const chartInstance = new devExpress.viz.dxChart(el, {
      dataSource: openings,
      palette: "amaPalette",
      commonSeriesSettings: {
        argumentField: "name",
        hoverMode: "allArgumentPoints",
        selectionMode: "allArgumentPoints",
      },
      series: [
        {
          valueField: "areaM2",
          name: "Glazing Surface (m²)",
          type: "bar",
          color: "#0B1F4D",
          axis: "areaAxis",
          cornerRadius: 6,
        },
        {
          valueField: "perimeterM",
          name: "Frame Perimeter (m)",
          type: "spline",
          color: "#2D8ACD",
          width: 3,
          point: {
            visible: true,
            size: 8,
            symbol: "circle",
            color: "#FFFFFF",
            border: { color: "#2D8ACD", width: 2.5, visible: true },
          },
          axis: "perimeterAxis",
        },
      ],
      valueAxis: [
        {
          name: "areaAxis",
          position: "left",
          title: {
            text: "Glazing Surface Area (m²)",
            font: { color: "#0B1F4D", weight: 700, size: 12 },
          },
          grid: { visible: true, color: "#F1F5F9" },
          label: { font: { color: "#64748B", size: 11 } },
        },
        {
          name: "perimeterAxis",
          position: "right",
          title: {
            text: "Frame Perimeter (m)",
            font: { color: "#2D8ACD", weight: 700, size: 12 },
          },
          grid: { visible: false },
          label: { font: { color: "#64748B", size: 11 } },
        },
      ],
      argumentAxis: {
        grid: { visible: false },
        label: { font: { color: "#0B1F4D", weight: 700, size: 12 } },
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
        customizeTooltip: (pointInfo: any) => {
          const item = openings.find((o) => o.name === pointInfo.argumentText);
          const dims = item ? `${item.widthMm} × ${item.heightMm} mm` : "";
          const sys = item?.systemName || "Soleal System";
          const glass = item?.glassLabel ? `Glass: ${item.glassLabel}` : "";
          return {
            html: `<div style="padding: 6px 10px; font-family: Inter, sans-serif;">
              <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">${pointInfo.argumentText} — ${sys}</div>
              <div style="font-size: 11px; color: #93C5FD; margin-bottom: 4px;">Dimensions: <b>${dims}</b> (Qty: ${item?.quantity || 1})</div>
              <div style="display: flex; gap: 12px; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px;">
                <span>Area: <b>${item?.areaM2} m²</b></span>
                <span>Perimeter: <b>${item?.perimeterM} m</b></span>
              </div>
              ${glass ? `<div style="font-size: 11px; color: #86EFAC; margin-top: 2px;">${glass}</div>` : ""}
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
        // ignore
      }
    };
  }, [openings]);

  if (openings.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg text-xs text-[#64748B] border border-dashed border-[#CBD5E1]"
        style={{ height: `${height}px` }}
      >
        <span className="font-bold text-[#0B1F4D]">No Openings Recorded</span>
        <span className="text-[11px] mt-1">Draw window openings on the 2D Canvas to visualize real takeoffs.</span>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div ref={containerRef} style={{ height: `${height}px`, width: "100%" }} />

      {!isRendered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg text-xs text-[#64748B]"
          style={{ height: `${height}px` }}
        >
          <div className="w-6 h-6 border-2 border-[#CBD5E1] border-t-[#165BAA] rounded-full animate-spin mb-2" />
          <span>Rendering Real Openings Chart…</span>
        </div>
      )}
    </div>
  );
}
