import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin, Layers } from "lucide-react";
import type { RealProjectSummary, RealOpeningItem } from "../../domain/dashboardTypes";

interface FacadeProjectsTableProps {
  projects: RealProjectSummary[];
  openings: RealOpeningItem[];
}

export function FacadeProjectsTable({ projects, openings }: FacadeProjectsTableProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"projects" | "openings">("projects");

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-2 bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0 ${
              activeTab === "projects"
                ? "bg-white text-[#0B1F4D] shadow-xs"
                : "text-[#64748B] hover:text-[#0B1F4D] bg-transparent"
            }`}
          >
            <Building2 size={14} strokeWidth={2} />
            <span>Tender Projects ({projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("openings")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0 ${
              activeTab === "openings"
                ? "bg-white text-[#0B1F4D] shadow-xs"
                : "text-[#64748B] hover:text-[#0B1F4D] bg-transparent"
            }`}
          >
            <Layers size={14} strokeWidth={2} />
            <span>Window Openings ({openings.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="text-xs font-bold text-[#165BAA] hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
        >
          <span>Open Estimation System</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Projects View */}
      {activeTab === "projects" && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-white text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Project & Location</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Primary System</th>
                <th className="py-3 px-4 text-center">Openings</th>
                <th className="py-3 px-4 text-right">Glazing Area</th>
                <th className="py-3 px-4 text-right">Frame Perimeter</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#165BAA] flex items-center justify-center shrink-0 mt-0.5 border border-[#DBEAFE]">
                        <Building2 size={16} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div className="font-bold text-[#0B1F4D] group-hover:text-[#165BAA] transition-colors">
                          {proj.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {proj.location}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-[#165BAA]">Year {proj.year}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#334155]">
                    {proj.client}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#165BAA] border border-[#BFDBFE]">
                      {proj.primarySystem}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#0B1F4D]">
                    {proj.itemsCount} units
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B1F4D]">
                    {proj.totalGlazingM2.toFixed(2)} m²
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#165BAA]">
                    {proj.totalPerimeterM.toFixed(2)} m
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/home")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#165BAA] hover:text-[#0B1F4D] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-md transition-colors border border-[#BFDBFE] cursor-pointer"
                    >
                      <span>Open Canvas</span>
                      <ArrowUpRight size={13} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Openings View */}
      {activeTab === "openings" && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-white text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Opening Mark</th>
                <th className="py-3 px-4">System Type</th>
                <th className="py-3 px-4 text-right">Dimensions (W × H)</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Area (m²)</th>
                <th className="py-3 px-4 text-right">Perimeter (m)</th>
                <th className="py-3 px-4">Glazing Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {openings.map((op) => (
                <tr key={op.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0B1F4D]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: op.color || "#165BAA" }}
                      />
                      <span>{op.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#334155] font-medium">
                    {op.systemName}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1F4D]">
                    {op.widthMm} × {op.heightMm} mm
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-[#64748B]">
                    {op.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-[#0B1F4D]">
                    {op.areaM2.toFixed(2)} m²
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#165BAA]">
                    {op.perimeterM.toFixed(2)} m
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#F1F5F9] text-[11px] font-mono font-bold text-[#334155] border border-[#E2E8F0]">
                      {op.glassLabel || "GL03"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
