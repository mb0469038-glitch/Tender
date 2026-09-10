import type { FormEvent } from "react";
import { Icon } from "../../../../design-system/Icon";

const BACKDROP_CLASS = "fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]";
const DIALOG_CLASS = "w-[min(460px,100%)] rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]";
const HEADER_CLASS = "flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]";
const FOOTER_CLASS = "flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]";
const CLOSE_BTN_CLASS = "grid place-items-center w-8 h-8 p-0 border border-[#cbd9db] rounded-md bg-transparent text-[#4c696d] hover:bg-[#edf4f4] cursor-pointer";
const INPUT_CLASS = "w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none";
const PRIMARY_BTN_CLASS = "min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors";
const SECONDARY_BTN_CLASS = "min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors";

export type NewDatabaseModalProps = {
  parent: "technal" | "sidem" | null;
  name: string;
  setName: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function NewDatabaseModal({
  parent,
  name,
  setName,
  onClose,
  onSubmit,
}: NewDatabaseModalProps) {
  if (!parent) return null;

  return (
    <div className={BACKDROP_CLASS} onMouseDown={onClose}>
      <section
        className={DIALOG_CLASS}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={HEADER_CLASS}>
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              New component database
            </p>
            <h2 className="m-0 text-[#1a3539] text-[21px] font-bold">
              Add to {parent === "technal" ? "Technal" : "Sidem"}
            </h2>
          </div>
          <button className={CLOSE_BTN_CLASS} onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Component name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className={INPUT_CLASS}
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. 3-slider window"
              />
              <small className="text-[#7a8f92] font-medium">
                This creates a separate material database for this component.
              </small>
            </label>
          </div>
          <div className={FOOTER_CLASS}>
            <button type="button" className={SECONDARY_BTN_CLASS} onClick={onClose}>
              Cancel
            </button>
            <button className={PRIMARY_BTN_CLASS} type="submit">
              Create database
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export type NewCompanyDatabaseModalProps = {
  isOpen: boolean;
  name: string;
  setName: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function NewCompanyDatabaseModal({
  isOpen,
  name,
  setName,
  error,
  setError,
  onClose,
  onSubmit,
}: NewCompanyDatabaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className={BACKDROP_CLASS} onMouseDown={onClose}>
      <section
        className={DIALOG_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-company-database-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={HEADER_CLASS}>
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              Company databases
            </p>
            <h2 id="new-company-database-title" className="m-0 text-[#1a3539] text-[21px] font-bold">
              Add company database
            </h2>
          </div>
          <button
            type="button"
            className={CLOSE_BTN_CLASS}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Company name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className={INPUT_CLASS}
                autoFocus
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="e.g. Sidem, Alustil, or Gutmann"
              />
              <small className="text-[#7a8f92] font-medium">
                This creates an organized view in the shared material database. It starts with no
                tables or materials.
              </small>
            </label>
            {error && <p className="m-0 text-[#b73030] text-xs font-semibold">{error}</p>}
          </div>
          <div className={FOOTER_CLASS}>
            <button type="button" className={SECONDARY_BTN_CLASS} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={PRIMARY_BTN_CLASS}>
              Create database
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export type NewCompanyTableModalProps = {
  tableFor: { id: string; name: string } | null;
  name: string;
  setName: (value: string) => void;
  reference: string;
  setReference: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  referencePrefix: (reference: string) => string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function NewCompanyTableModal({
  tableFor,
  name,
  setName,
  reference,
  setReference,
  error,
  setError,
  referencePrefix,
  onClose,
  onSubmit,
}: NewCompanyTableModalProps) {
  if (!tableFor) return null;

  return (
    <div className={BACKDROP_CLASS} onMouseDown={onClose}>
      <section
        className={DIALOG_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-company-table-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={HEADER_CLASS}>
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              {tableFor.name} Database
            </p>
            <h2 id="new-company-table-title" className="m-0 text-[#1a3539] text-[21px] font-bold">
              Add material table
            </h2>
          </div>
          <button
            type="button"
            className={CLOSE_BTN_CLASS}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Table name <span className="text-[#b73030]">*</span>
              </span>
              <input
                className={INPUT_CLASS}
                autoFocus
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="e.g. Sliding profiles"
              />
            </label>
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>
                Material reference <span className="text-[#b73030]">*</span>
              </span>
              <input
                className={INPUT_CLASS}
                required
                value={reference}
                onChange={(event) => {
                  setReference(event.target.value);
                  setError("");
                }}
                placeholder="e.g. SD"
              />
              <small className="text-[#7a8f92] font-medium">
                The first material will be numbered{" "}
                <b className="text-[#19363a]">{referencePrefix(reference) ? `${referencePrefix(reference)}-1` : "—"}</b>.
                Existing table references are blocked.
              </small>
            </label>
            {error && <p className="m-0 text-[#b73030] text-xs font-semibold">{error}</p>}
          </div>
          <div className={FOOTER_CLASS}>
            <button type="button" className={SECONDARY_BTN_CLASS} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={PRIMARY_BTN_CLASS}>
              Add table
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export type MoveCompanyTableModalProps = {
  moveTable: { name: string; sourceDatabaseId: string } | null;
  targetId: string;
  setTargetId: (value: string) => void;
  databases: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function MoveCompanyTableModal({
  moveTable,
  targetId,
  setTargetId,
  databases,
  onClose,
  onSubmit,
}: MoveCompanyTableModalProps) {
  if (!moveTable) return null;

  return (
    <div className={BACKDROP_CLASS} onMouseDown={onClose}>
      <section
        className={DIALOG_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-company-table-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={HEADER_CLASS}>
          <div>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
              Move material table
            </p>
            <h2 id="move-company-table-title" className="m-0 text-[#1a3539] text-[21px] font-bold">
              Move {moveTable.name}
            </h2>
          </div>
          <button
            type="button"
            className={CLOSE_BTN_CLASS}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid gap-[15px] p-[25px]">
            <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
              <span>Move to database page</span>
              <select
                className={INPUT_CLASS}
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                {databases
                  .filter((database) => database.id !== moveTable.sourceDatabaseId)
                  .map((database) => (
                    <option key={database.id} value={database.id}>
                      {database.name} Database
                    </option>
                  ))}
              </select>
              <small className="text-[#7a8f92] font-medium">
                All materials in this table move with it. Assembly links remain unchanged.
              </small>
            </label>
          </div>
          <div className={FOOTER_CLASS}>
            <button type="button" className={SECONDARY_BTN_CLASS} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={PRIMARY_BTN_CLASS}>
              Move table
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
