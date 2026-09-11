import { useEffect, useRef, useState } from "react";
import type { RealSystemShare } from "../../domain/dashboardTypes";

interface DevExtremePieChartProps {
  data: RealSystemShare[];
  height?: number;
}

export function DevExtremePieChart({ data, height = 310 }: DevExtremePieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const devExpress = (window as unknown as { DevExpress?: any }).DevExpress;
    if (!devExpress?.viz?.dxPieChart) {
      return;
    }

    const totalM2 = data.reduce((acc, curr) => acc + curr.areaM2, 0);

    const pieInstance = new devExpress.viz.dxPieChart(el, {
      dataSource: data,
      type: "doughnut",
      innerRadius: 0.62,
      palette: data.map((d) => d.color),
      series: [
        {
          argumentField: "system",
          valueField: "areaM2",
          label: {
            visible: true,
            position: "outside",
            radialOffset: 10,
            connector: { visible: true, width: 1 },
            customizeText: (arg: any) => `${arg.percentText}`,
            font: { size: 11, weight: 600, color: "#1E293B" },
          },
        },
      ],
      legend: {
        verticalAlignment: "bottom",
        horizontalAlignment: "center",
        itemTextPosition: "right",
        rowCount: 2,
        font: { size: 11, weight: 600, color: "#334155" },
        margin: { top: 12 },
      },
      tooltip: {
        enabled: true,
        font: { color: "#FFFFFF", size: 12 },
        color: "#0B1F4D",
        cornerRadius: 8,
        customizeTooltip: (pointInfo: any) => {
          const item = data.find((d) => d.system === pointInfo.argumentText);
          const openings = item ? `${item.openingsCount} window units` : "";
          return {
            html: `<div style="padding: 6px 10px; font-family: Inter, sans-serif;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${pointInfo.argumentText}</div>
              <div style="color: #93C5FD; font-size: 12px; margin-bottom: 4px;">Real Glazing Surface: <b>${pointInfo.valueText} m²</b> (${pointInfo.percentText})</div>
              ${openings ? `<div style="font-size: 11px; color: #E2E8F0;">Openings: <b>${openings}</b></div>` : ""}
            </div>`,
          };
        },
      },
      centerTemplate: () => {
        return `<div style="text-align: center; font-family: Inter, sans-serif; pointer-events: none;">
          <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">Real Glazing</div>
          <div style="font-size: 20px; font-weight: 900; color: #0B1F4D; line-height: 1.2;">${totalM2.toFixed(1)} <span style="font-size: 13px; font-weight: 600;">m²</span></div>
          <div style="font-size: 10px; font-weight: 600; color: #165BAA; margin-top: 1px;">Soleal Systems</div>
        </div>`;
      },
      animation: {
        duration: 800,
        easing: "easeOutCubic",
      },
    });

    setIsRendered(true);

    const resizeObserver = new ResizeObserver(() => {
      pieInstance.render();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      try {
        pieInstance.dispose();
      } catch {
        // ignore
      }
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center bg-[#F8FAFC] rounded-lg text-xs text-[#64748B] border border-dashed border-[#CBD5E1]"
        style={{ height: `${height}px` }}
      >
        <span className="font-bold text-[#0B1F4D]">No Systems Recorded</span>
        <span className="text-[11px] mt-1">Openings with Technal Soleal assemblies will appear here.</span>
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
          <span>Rendering Real Systems Donut…</span>
        </div>
      )}
    </div>
  );
}
