import { useEffect, type ReactNode } from "react";
import { Layers3 } from "lucide-react";

export type WorkspaceDataLoaderProps = {
  hydrated: boolean;
  isLoading: boolean;
  loadWorkspaceData: () => void;
  children: ReactNode;
};

export function WorkspaceDataLoader({
  hydrated,
  isLoading,
  loadWorkspaceData,
  children,
}: WorkspaceDataLoaderProps) {
  useEffect(() => {
    if (!hydrated) {
      loadWorkspaceData();
    }
  }, [hydrated, loadWorkspaceData]);

  if (!hydrated) {
    return (
      <div className="min-h-[calc(100vh-69px)] flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center select-none">
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-8 lg:p-10 shadow-[0_4px_20px_rgba(11,31,77,0.06)] max-w-md w-full flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#165BAA]">
              <Layers3 size={32} strokeWidth={1.8} className="animate-pulse" />
            </div>
            <div className="absolute -inset-1 border-2 border-[#165BAA] border-t-transparent rounded-2xl animate-spin" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0B1F4D] tracking-tight m-0">
              Loading Workspace
            </h2>
            <p className="text-xs font-semibold text-[#165BAA] uppercase tracking-wider mt-1 mb-2">
              Atelier Moderne de l'Aluminium
            </p>
            <p className="text-xs text-[#667085] leading-relaxed m-0">
              {isLoading
                ? "Hydrating system profiles, projects, and catalogs on demand..."
                : "Initializing workspace engine..."}
            </p>
          </div>

          <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#165BAA] h-full rounded-full animate-[shimmer_1.5s_infinite] w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
