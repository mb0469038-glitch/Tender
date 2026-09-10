import { useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Clock, ChevronDown } from "lucide-react";

export type SidebarWorkspaceStatusProps = {
  workspaceSaveStatus: "saved" | "saving" | "error";
  recentWorkspaceSaves: string[];
  isCollapsed: boolean;
};

export function SidebarWorkspaceStatus({
  workspaceSaveStatus,
  recentWorkspaceSaves,
  isCollapsed,
}: SidebarWorkspaceStatusProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (isCollapsed) {
    return (
      <div className="mt-auto pt-3 pb-1 flex justify-center border-t border-[#E3E8EF]">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            workspaceSaveStatus === "saving"
              ? "bg-[#2D8ACD] animate-ping"
              : workspaceSaveStatus === "error"
              ? "bg-rose-500"
              : "bg-emerald-500"
          }`}
          title={
            workspaceSaveStatus === "saving"
              ? "Saving changes…"
              : workspaceSaveStatus === "error"
              ? "Save failed"
              : "Workspace synced"
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-auto pt-3 border-t border-[#E3E8EF]">
      <div className="p-3 bg-white border border-[#E3E8EF] rounded-[10px] shadow-[0_1px_3px_rgba(11,31,77,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {workspaceSaveStatus === "saving" ? (
              <RefreshCw size={16} strokeWidth={2} className="text-[#2D8ACD] animate-spin shrink-0" />
            ) : workspaceSaveStatus === "error" ? (
              <AlertCircle size={16} strokeWidth={2} className="text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 size={16} strokeWidth={2} className="text-emerald-500 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-[#172033] leading-tight truncate">
                {workspaceSaveStatus === "saving"
                  ? "Saving changes…"
                  : workspaceSaveStatus === "error"
                  ? "Save failed"
                  : "Workspace Synced"}
              </div>
              <div className="text-[12px] text-[#667085] leading-tight truncate mt-0.5">
                Local & Cloud persistence
              </div>
            </div>
          </div>

          {recentWorkspaceSaves.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="p-1 rounded-md text-[#667085] hover:text-[#0B1F4D] hover:bg-[#F5F7FA] transition-colors"
              title="Toggle save history"
              aria-expanded={historyOpen}
            >
              <ChevronDown
                size={15}
                strokeWidth={2}
                className={`transition-transform duration-200 ${historyOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {historyOpen && recentWorkspaceSaves.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[#E3E8EF] space-y-1 max-h-32 overflow-y-auto pr-1">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-[#667085] flex items-center gap-1.5 mb-1">
              <Clock size={12} strokeWidth={1.8} /> Recent Saves
            </div>
            {recentWorkspaceSaves.slice(0, 5).map((save, idx) => (
              <div
                key={`${save}-${idx}`}
                className="text-[11.5px] text-[#475467] font-mono flex items-center justify-between py-0.5"
              >
                <span className="text-[#98A2B3]">#{idx + 1}</span>
                <span className="truncate ml-2">{save}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
