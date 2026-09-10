import type { FormEvent } from "react";
import { Icon } from "../../../../design-system/Icon";

export type ProjectModalProps = {
  isOpen: boolean;
  isEdit: boolean;
  isExecutionProject?: boolean;
  formName: string;
  setFormName: (value: string) => void;
  formClient: string;
  setFormClient: (value: string) => void;
  formCompany: string;
  setFormCompany: (value: string) => void;
  formLocation: string;
  setFormLocation: (value: string) => void;
  onClose: () => void;
  onSave: (event: FormEvent) => void;
};

export function ProjectModal({
  isOpen,
  isEdit,
  isExecutionProject = false,
  formName,
  setFormName,
  formClient,
  setFormClient,
  formCompany,
  setFormCompany,
  formLocation,
  setFormLocation,
  onClose,
  onSave,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]"
      onMouseDown={onClose}
    >
      <section
        className="w-[min(560px,100%)] rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]">
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              {isEdit ? "Edit" : "New"} item
            </p>
            <h2 className="m-0 text-[#1a3539] text-[21px] font-bold">
              {isEdit ? "Edit" : "Add"} {isExecutionProject ? "project" : "project"}
            </h2>
          </div>
          <button
            className="grid place-items-center w-8 h-8 p-0 border border-[#cbd9db] rounded-md bg-transparent text-[#4c696d] hover:bg-[#edf4f4] cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Project name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none"
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Project 1"
              />
            </label>
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Client name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none"
                required
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="Client"
              />
            </label>
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Company name <small className="text-[#7a8f92] font-medium">(optional)</small>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Company"
              />
            </label>
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Location <span className="text-[#b73030]">*</span>
              </span>
              <input
                className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Lebanon"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]">
            <button
              type="button"
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
              type="submit"
            >
              {isExecutionProject ? "Create project" : "Save project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
