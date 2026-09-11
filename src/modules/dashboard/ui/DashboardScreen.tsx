import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/ui/SessionContext";
import {
  Building2,
  Layers3,
  Ruler,
  Database,
  ArrowRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import { dashboardGateway } from "../infrastructure/dashboardGateway";
import type { RealDashboardSummary } from "../domain/dashboardTypes";
import { DashboardKpiCard } from "./components/DashboardKpiCard";
import { DevExtremeChart } from "./components/DevExtremeChart";
import { DevExtremePieChart } from "./components/DevExtremePieChart";
import { DevExtremeGauge } from "./components/DevExtremeGauge";
import { FacadeProjectsTable } from "./components/FacadeProjectsTable";

export function DashboardScreen() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<RealDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (force = false) => {
    if (force) setIsRefreshing(true);
    try {
      const data = await dashboardGateway.getDashboardSummary(force);
      setSummary(data);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="min-h-full bg-[#F5F7FA] p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#CBD5E1] border-t-[#165BAA] rounded-full animate-spin mb-4" />
        <div className="font-bold text-base text-[#0B1F4D]">Connecting to Live Database…</div>
        <div className="text-xs text-[#64748B] mt-1">Extracting real tender projects, window takeoffs, and Soleal catalog.</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7FA] p-5 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Executive Header */}
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0B1F4D] tracking-tight m-0">
              Welcome back, {user?.displayName || user?.username || "Administrator"}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Live DB Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-xs font-bold text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Database</span>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-colors cursor-pointer"
              title="Reload fresh snapshot from PostgreSQL"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>Sync</span>
            </button>

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

        {/* Row 1: Real 5 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DashboardKpiCard
            title="Tender Projects"
            value={`${summary.totalProjects} Projects`}
            badge="Real Database"
            subtext="Tender Tenders"
            icon={Building2}
            accentColor="#0B1F4D"
          />
          <DashboardKpiCard
            title="Window Openings"
            value={`${summary.totalOpenings} Units`}
            badge="Canvas Drawn"
            subtext="Takeoff Marks"
            icon={Layers}
            accentColor="#165BAA"
          />
          <DashboardKpiCard
            title="Total Glazing Area"
            value={`${summary.totalGlazingM2.toFixed(2)} m²`}
            badge="Real Envelope"
            subtext="Calculated Glass"
            icon={Ruler}
            accentColor="#2D8ACD"
          />
          <DashboardKpiCard
            title="Frame Perimeter"
            value={`${summary.totalPerimeterM.toFixed(1)} m`}
            badge="Linear Frame"
            subtext="Profiles Perimeter"
            icon={Layers3}
            accentColor="#0F766E"
          />
          <DashboardKpiCard
            title="Catalog Materials"
            value={`${summary.totalMaterials} Items`}
            badge="Soleal & Sidem"
            subtext={`${summary.totalAssemblies} Assemblies`}
            icon={Database}
            accentColor="#F59E0B"
          />
        </div>

        {/* Row 2: DevExtreme Charts (Real Data) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Openings Comparison Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                  Real Window Openings & Dimensional Takeoffs
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5 m-0">
                  Glazing surface area (m²) vs. frame perimeter (m) for each opening drawn on the Canvas
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#165BAA] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
                DevExtreme Chart
              </span>
            </div>
            <DevExtremeChart openings={summary.openings} height={310} />
          </div>

          {/* Real Catalog Materials Gauge (1 col) */}
          <div className="bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div className="mb-2">
              <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                Materials & System Databases
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 m-0">
                Live catalog balance across profiles, hardware, and accessories
              </p>
            </div>
            <DevExtremeGauge
              totalMaterials={summary.totalMaterials}
              catalogCategories={summary.catalogCategories}
              totalAssemblies={summary.totalAssemblies}
              height={220}
            />
          </div>
        </div>

        {/* Row 3: Systems Distribution & Real Projects Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Systems Distribution Donut (1 col) */}
          <div className="bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                Façade Systems Distribution
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 m-0">
                Real share of envelope surface area across Technal Soleal systems
              </p>
            </div>
            <div className="my-2">
              <DevExtremePieChart data={summary.systemsShare} height={290} />
            </div>
          </div>

          {/* Real Projects & Openings Table (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(11,31,77,0.04)] flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <h2 className="text-base font-bold text-[#0B1F4D] m-0">
                  Database Tender Projects & Window Details
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5 m-0">
                  Exact projects and takeoff openings extracted directly from your database
                </p>
              </div>
              <FacadeProjectsTable projects={summary.projects} openings={summary.openings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
