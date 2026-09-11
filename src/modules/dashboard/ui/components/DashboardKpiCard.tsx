import type { ElementType } from "react";
import { CheckCircle2 } from "lucide-react";

export interface DashboardKpiCardProps {
  title: string;
  value: string;
  badge: string;
  subtext: string;
  icon: ElementType;
  accentColor?: string;
}

export function DashboardKpiCard({
  title,
  value,
  badge,
  subtext,
  icon: IconComponent,
  accentColor = "#165BAA",
}: DashboardKpiCardProps) {
  return (
    <div className="bg-white border border-[#E3E8EF] hover:border-[#CBD5E1] rounded-xl p-5 shadow-[0_1px_3px_rgba(11,31,77,0.04)] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider line-clamp-1">
            {title}
          </span>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
          >
            <IconComponent size={19} strokeWidth={1.8} />
          </div>
        </div>

        <div className="text-2xl lg:text-[26px] font-black text-[#0B1F4D] tracking-tight mt-1 mb-1">
          {value}
        </div>
      </div>

      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs mt-3">
        <span className="inline-flex items-center gap-1 text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0] text-[11px] font-bold">
          <CheckCircle2 size={11} strokeWidth={2.5} />
          {badge}
        </span>
        <span className="text-[10.5px] text-[#94A3B8] font-semibold">{subtext}</span>
      </div>
    </div>
  );
}
