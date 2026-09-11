import type { ElementType } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiMetric } from "../../domain/dashboardTypes";

interface DashboardKpiCardProps {
  metric: KpiMetric;
  icon: ElementType;
  accentColor?: string;
}

export function DashboardKpiCard({ metric, icon: IconComponent, accentColor = "#165BAA" }: DashboardKpiCardProps) {
  const isPositive = metric.trend === "up";
  const isNegative = metric.trend === "down";

  return (
    <div className="bg-white border border-[#E3E8EF] hover:border-[#CBD5E1] rounded-xl p-5 shadow-[0_1px_3px_rgba(11,31,77,0.04)] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider line-clamp-1">
            {metric.title}
          </span>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
          >
            <IconComponent size={19} strokeWidth={1.8} />
          </div>
        </div>

        <div className="text-2xl lg:text-[26px] font-black text-[#0B1F4D] tracking-tight mt-1 mb-1">
          {metric.value}
        </div>
      </div>

      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs mt-3">
        <div className="flex items-center gap-1.5 font-bold">
          {isPositive && (
            <span className="inline-flex items-center gap-0.5 text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0] text-[11px]">
              <TrendingUp size={12} strokeWidth={2.5} />
              {metric.change}
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center gap-0.5 text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA] text-[11px]">
              <TrendingDown size={12} strokeWidth={2.5} />
              {metric.change}
            </span>
          )}
          {!isPositive && !isNegative && (
            <span className="inline-flex items-center gap-0.5 text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0] text-[11px]">
              <Minus size={12} strokeWidth={2.5} />
              {metric.change}
            </span>
          )}
          <span className="text-[11px] text-[#64748B] font-medium ml-1">{metric.period}</span>
        </div>
        <span className="text-[10.5px] text-[#94A3B8] font-semibold hidden xl:inline">{metric.subtext}</span>
      </div>
    </div>
  );
}
