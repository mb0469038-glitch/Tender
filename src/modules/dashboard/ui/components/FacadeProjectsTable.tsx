import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import type { FacadeTenderProject } from "../../domain/dashboardTypes";

interface FacadeProjectsTableProps {
  projects: FacadeTenderProject[];
}

export function FacadeProjectsTable({ projects }: FacadeProjectsTableProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: FacadeTenderProject["status"]) => {
    switch (status) {
      case "Awarded":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "Fabrication":
        return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
      case "Tender In Review":
        return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
      case "Takeoff in Progress":
        return "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
      case "Submitted":
        return "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]";
      default:
        return "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            <th className="py-3 px-4">Project & Location</th>
            <th className="py-3 px-4">Envelope System</th>
            <th className="py-3 px-4 text-right">Glazing (m²)</th>
            <th className="py-3 px-4 text-right">Extrusion (Tons)</th>
            <th className="py-3 px-4 text-right">Package Value</th>
            <th className="py-3 px-4 text-center">Status</th>
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
                      <span className="font-mono text-[10.5px] text-[#165BAA] font-bold">{proj.code}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {proj.location}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-medium text-[#334155]">{proj.envelopeType}</span>
                <div className="text-[11px] text-[#94A3B8]">Client: {proj.client}</div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B1F4D]">
                {proj.glazingM2.toLocaleString()} m²
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-[#165BAA]">
                {proj.extrusionTons.toFixed(1)} t
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#0B1F4D]">
                ${(proj.packageValueUsd / 1_000_000).toFixed(2)}M
              </td>
              <td className="py-3.5 px-4 text-center">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                    proj.status
                  )}`}
                >
                  {proj.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#165BAA] hover:text-[#0B1F4D] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-md transition-colors border border-[#BFDBFE] cursor-pointer"
                >
                  <span>Open</span>
                  <ArrowUpRight size={13} strokeWidth={2} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
