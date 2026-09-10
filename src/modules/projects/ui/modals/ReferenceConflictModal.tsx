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
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="material-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-conflict-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Reference conflict</p>
            <h2 id="reference-conflict-title">Reference {requestedReference} already exists</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-form">
          <p>
            Choose whether to make room for this number or use a different reference for this item.
          </p>
        </div>
        <div className="dialog-footer">
          <button type="button" className="secondary-button" onClick={onRename}>
            Rename
          </button>
          <button type="button" className="primary-button" onClick={onShift}>
            Shift
          </button>
        </div>
      </section>
    </div>
  );
}
