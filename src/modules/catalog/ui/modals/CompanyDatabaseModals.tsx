import type { FormEvent } from "react";
import { Icon } from "../../../../design-system/Icon";

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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">New component database</p>
            <h2>Add to {parent === "technal" ? "Technal" : "Sidem"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="dialog-form">
            <label>
              Component name <span>*</span>
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. 3-slider window"
              />
              <small>This creates a separate material database for this component.</small>
            </label>
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-company-database-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Company databases</p>
            <h2 id="new-company-database-title">Add company database</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="dialog-form">
            <label>
              Company name <span>*</span>
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="e.g. Sidem, Alustil, or Gutmann"
              />
              <small>
                This creates an organized view in the shared material database. It starts with no
                tables or materials.
              </small>
            </label>
            {error && <p className="field-error">{error}</p>}
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-company-table-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{tableFor.name} Database</p>
            <h2 id="new-company-table-title">Add material table</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="dialog-form">
            <label>
              Table name <span>*</span>
              <input
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
            <label>
              Material reference <span>*</span>
              <input
                required
                value={reference}
                onChange={(event) => {
                  setReference(event.target.value);
                  setError("");
                }}
                placeholder="e.g. SD"
              />
              <small>
                The first material will be numbered{" "}
                <b>{referencePrefix(reference) ? `${referencePrefix(reference)}-1` : "—"}</b>.
                Existing table references are blocked.
              </small>
            </label>
            {error && <p className="field-error">{error}</p>}
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-company-table-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Move material table</p>
            <h2 id="move-company-table-title">Move {moveTable.name}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="dialog-form">
            <label>
              Move to database page{" "}
              <select
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
              <small>
                All materials in this table move with it. Assembly links remain unchanged.
              </small>
            </label>
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Move table
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
