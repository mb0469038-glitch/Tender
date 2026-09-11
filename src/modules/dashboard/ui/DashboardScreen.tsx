import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/ui/SessionContext";
import {
  Building2,
  Layers3,
  Ruler,
  Factory,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  Filter,
} from "lucide-react";
import {
  executiveKpiMetrics,
  monthlyTenderDemands,
  facadeSystemShares,
  cuttingYieldData,
  topFacadeProjects,
} from "../domain/dashboardData";
import { DashboardKpiCard } from "./components/DashboardKpiCard";
import { DevExtremeChart } from "./components/DevExtremeChart";
import { DevExtremePieChart } from "./components/DevExtremePieChart";
import { DevExtremeGauge } from "./components/DevExtremeGauge";
import { FacadeProjectsTable } from "./components/FacadeProjectsTable";

export function DashboardScreen() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<"all" | "2026" | "2027">("2026");

  const filteredProjects =
    selectedYear === "all"
      ? topFacadeProjects
      : topFacadeProjects.filter((p) => p.year === selectedYear);

  return (
    <div className="min-h-full bg-[#F5F7FA] p-5 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Executive Header */}
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#165BAA] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} strokeWidth={2} />
              <span>Atelier Moderne de l'Aluminium — Executive Façade Analytics</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0B1F4D] tracking-tight m-0">
              Welcome back, {user?.displayName || user?.username || "Administrator"}
            </h1>
            <p className="text-xs lg:text-sm text-[#667085] mt-1 m-0">
              Building Envelope Takeoffs, Extrusion Demand, Glazing Metrics & Linear Optimization Efficiency.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Year Selector */}
            <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B]">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[#475569]">
                <Calendar size={13} strokeWidth={2} />
                <span>Year:</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYear("2026")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border-0 ${
                  selectedYear === "2026"
                    ? "bg-white text-[#0B1F4D] shadow-xs font-black"
                    : "hover:text-[#0B1F4D] bg-transparent"
                }`}
              >
                2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedYear("2027")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border-0 ${
                  selectedYear === "2027"
                    ? "bg-white text-[#0B1F4D] shadow-xs font-black"
                    : "hover:text-[#0B1F4D] bg-transparent"
                }`}
              >
                2027
              </button>
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border-0 ${
                  selectedYear === "all"
                    ? "bg-white text-[#0B1F4D] shadow-xs font-black"
                    : "hover:text-[#0B1F4D] bg-transparent"
                }`}
              >
                All
              </button>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B1F4D] hover:bg-[#165BAA] text-white text-xs lg:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer border-0"
            >
              <span>Open System</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Row 1: Executive KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DashboardKpiCard metric={executiveKpiMetrics[0]} icon={Building2} accentColor="#0B1F4D" />
          <DashboardKpiCard metric={executiveKpiMetrics[1]} icon={Layers3} accentColor="#165BAA" />
          <DashboardKpiCard metric={executiveKpiMetrics[2]} icon={Ruler} accentColor="#2D8ACD" />
          <DashboardKpiCard metric={executiveKpiMetrics[3]} icon={Factory} accentColor="#0F766E" />
          <DashboardKpiCard metric={executiveKpiMetrics[4]} icon={ShieldCheck} accentColor="#F59E0B" />
        </div>

        {/* Row 2: DevExtreme Demand Chart & Cutting Yield Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Material Demand (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                  Tender Material Demand & Extrusion Volume
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5 m-0">
                  Monthly progression of aluminum profile tonnage (Tons) vs. glass envelope surface area (m²)
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#165BAA] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
                <Filter size={12} />
                DevExtreme Viz
              </span>
            </div>
            <DevExtremeChart data={monthlyTenderDemands} height={310} />
          </div>

          {/* Cutting Optimization Yield (1 col) */}
          <div className="bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div className="mb-2">
              <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                Cutting Optimization Yield
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 m-0">
                Linear stock yield across 6.5m profile bars with off-cut recovery
              </p>
            </div>
            <DevExtremeGauge data={cuttingYieldData} height={220} />
          </div>
        </div>

        {/* Row 3: Systems Distribution & Top Active Façade Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Glazing & Façade Systems Donut (1 col) */}
          <div className="bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                Façade Systems Distribution
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 m-0">
                Share of envelope area across Soleal curtain walls & sliding assemblies
              </p>
            </div>
            <div className="my-2">
              <DevExtremePieChart data={facadeSystemShares} height={290} />
            </div>
          </div>

          {/* Top Active Façade Bids & Package Tracking (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                    High-Profile Façade Bids & Execution Tracking
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5 m-0">
                    Active packages with glass envelope area, extrusion weight, package value, and win probability
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="text-xs font-bold text-[#165BAA] hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                >
                  <span>View All Tenders</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <FacadeProjectsTable projects={filteredProjects} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
