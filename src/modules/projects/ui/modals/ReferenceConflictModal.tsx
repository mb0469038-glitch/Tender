import { Icon } from "../../../../design-system/Icon";

export type ReferenceConflictModalProps = {
  requestedReference: number;
  onClose: () => void;
  onRename: () => void;
  onShift: () => void;
};

export function ReferenceConflictModal({
  requestedReference,
  onClose,
  onRename,
  onShift,
}: ReferenceConflictModalProps) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]"
      onMouseDown={onClose}
    >
      <section
        className="w-[min(460px,100%)] rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-conflict-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]">
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              Reference conflict
            </p>
            <h2 id="reference-conflict-title" className="m-0 text-[#1a3539] text-[21px] font-bold">
              Reference {requestedReference} already exists
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
        <div className="grid gap-[15px] p-[25px] text-[#4c696d] text-sm leading-relaxed">
          <p className="m-0">
            Choose whether to make room for this number or use a different reference for this item.
          </p>
        </div>
        <div className="flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]">
          <button
            type="button"
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
            onClick={onRename}
          >
            Rename
          </button>
          <button
            type="button"
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
            onClick={onShift}
          >
            Shift
          </button>
        </div>
      </section>
    </div>
  );
}
