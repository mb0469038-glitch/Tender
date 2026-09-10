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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{isEdit ? "Edit" : "New"} item</p>
            <h2>
              {isEdit ? "Edit" : "Add"} {isExecutionProject ? "project" : "project"}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className="dialog-form">
            <label>
              Project name <span>*</span>
              <input
                autoFocus
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Project 1"
              />
            </label>
            <label>
              Client name <span>*</span>
              <input
                required
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="Client"
              />
            </label>
            <label>
              Company name <small>(optional)</small>
              <input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Company"
              />
            </label>
            <label>
              Location <span>*</span>
              <input
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Lebanon"
              />
            </label>
          </div>
          <div className="dialog-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              {isExecutionProject ? "Create project" : "Save project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
