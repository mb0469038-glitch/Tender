import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/ui/SessionContext";
import {
  Layers3,
  Warehouse,
  FolderKanban,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Building2,
} from "lucide-react";

export function HomeScreen() {
  const { user } = useSession();
  const navigate = useNavigate();

  const userName = user?.displayName || user?.username || "Estimator";

  const cards = [
    {
      id: "estimation",
      title: "Estimation Service",
      badge: "Core Engineering",
      badgeColor: "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]",
      icon: Layers3,
      iconBg: "bg-[#0284C7]/10 text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white",
      description:
        "Tender projects, Soleal window & door assemblies, technical formulas, takeoff canvas, and dynamic costing engine.",
      buttonLabel: "Open Estimation",
      path: "/estimation",
      accentBorder: "hover:border-[#0284C7]/40",
      buttonBg: "bg-[#0284C7] hover:bg-[#0369A1]",
      features: ["Window Takeoff & Canvas", "Soleal 2-Rail & Hinged Systems", "Material & Glass Costing"],
    },
    {
      id: "stock",
      title: "AMA Stock",
      badge: "Materials & Inventory",
      badgeColor: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
      icon: Warehouse,
      iconBg: "bg-[#D97706]/10 text-[#D97706] group-hover:bg-[#D97706] group-hover:text-white",
      description:
        "Extrusion profiles database, glass pricing tables, accessories catalog, and real-time inventory management.",
      buttonLabel: "Open AMA Stock",
      path: "/stock",
      accentBorder: "hover:border-[#D97706]/40",
      buttonBg: "bg-[#D97706] hover:bg-[#B45309]",
      features: ["Extrusion Profile Database", "Glass Price Tables", "Hardware & Gasket Inventory"],
    },
    {
      id: "execution",
      title: "Projects Under Execution",
      badge: "Production & Workshop",
      badgeColor: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",
      icon: FolderKanban,
      iconBg: "bg-[#16A34A]/10 text-[#16A34A] group-hover:bg-[#16A34A] group-hover:text-white",
      description:
        "Fabrication orders, workshop cutting lists, automated bar length optimization, and procurement orders.",
      buttonLabel: "Open Execution",
      path: "/execution",
      accentBorder: "hover:border-[#16A34A]/40",
      buttonBg: "bg-[#16A34A] hover:bg-[#15803D]",
      features: ["Cutting Lists & Optimization", "Workshop Orders", "Material Procurement"],
    },
    {
      id: "dashboard",
      title: "Executive Dashboard",
      badge: "Analytics & Oversight",
      badgeColor: "bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]",
      icon: LayoutDashboard,
      iconBg: "bg-[#7C3AED]/10 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white",
      description:
        "Real-time KPIs, active tender totals, financial summaries, project breakdown charts, and live database sync.",
      buttonLabel: "Open Dashboard",
      path: "/dashboard",
      accentBorder: "hover:border-[#7C3AED]/40",
      buttonBg: "bg-[#7C3AED] hover:bg-[#6D28D9]",
      features: ["Live Database Status", "Tender Breakdown Charts", "Financial KPIs & Metrics"],
    },
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] p-6 lg:p-10">
      <div className="max-w-[1500px] mx-auto space-y-8">
        {/* Hero Welcome Banner */}
        <section className="relative overflow-hidden bg-white border border-[#E3E8EF] rounded-2xl p-8 lg:p-10 shadow-[0_4px_20px_rgba(11,31,77,0.04)]">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full text-xs font-extrabold text-[#15803D]">
                <ShieldCheck size={14} className="text-[#16A34A]" />
                <span>AMA Enterprise Architectural Workspace</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-[#0B1F4D] tracking-tight m-0">
                Welcome back, {userName}
              </h1>
              <p className="text-[#475467] text-sm lg:text-base leading-relaxed m-0">
                Select a workspace module below to access window engineering, inventory catalogs, production cutting lists, or business analytics.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E3E8EF] rounded-xl flex items-center gap-3">
                <Building2 size={20} className="text-[#0B1F4D]" />
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Company</div>
                  <div className="text-xs font-extrabold text-[#0B1F4D]">L’Atelier Moderne de l’Aluminium</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative subtle background accents */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#165BAA]/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-[#0284C7]/10 to-transparent blur-3xl pointer-events-none" />
        </section>

        {/* 4 Gateway Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <article
                key={card.id}
                className={`group relative flex flex-col justify-between p-6 bg-white border border-[#E3E8EF] rounded-2xl shadow-[0_2px_8px_rgba(11,31,77,0.03)] hover:shadow-[0_12px_32px_rgba(11,31,77,0.08)] ${card.accentBorder} transition-all duration-200 hover:-translate-y-1 cursor-pointer`}
                onClick={() => navigate(card.path)}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${card.iconBg}`}
                    >
                      <IconComponent size={24} strokeWidth={2} />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Card Title & Description */}
                  <h2 className="text-xl font-bold text-[#0B1F4D] tracking-tight m-0 mb-2 group-hover:text-[#165BAA] transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs lg:text-[13px] text-[#64748B] leading-relaxed m-0 mb-5">
                    {card.description}
                  </p>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 mb-6 pt-4 border-t border-[#F1F5F9]">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#475467]">
                        <ChevronRight size={13} className="text-[#94A3B8] shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.path);
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs lg:text-sm font-bold shadow-sm transition-all duration-150 cursor-pointer border-0 ${card.buttonBg}`}
                >
                  <span>{card.buttonLabel}</span>
                  <ArrowRight size={15} strokeWidth={2.2} className="transition-transform duration-150 group-hover:translate-x-1" />
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
