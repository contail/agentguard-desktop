import type { ConfirmDialogState } from "../../types";

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  onClose: () => void;
}

export function ConfirmDialog({ state, onClose }: ConfirmDialogProps) {
  if (!state.open) return null;

  const handleConfirm = () => {
    state.onConfirm();
    onClose();
  };

  return (
    <div className="confirm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{state.title}</h3>
        <p className="confirm-dialog__message">{state.message}</p>
        <div className="confirm-dialog__actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className={`btn btn-${state.variant}`} onClick={handleConfirm}>
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
