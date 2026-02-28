import type { ConfirmDialogState } from "../../types";

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  onClose: () => void;
}

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const variantBtn: Record<string, string> = {
  primary: "border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover",
  danger: "border border-transparent bg-danger-muted text-danger hover:bg-danger hover:text-white",
};

export function ConfirmDialog({ state, onClose }: ConfirmDialogProps) {
  if (!state.open) return null;

  const handleConfirm = () => {
    state.onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface-card border border-line rounded p-6 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-2">{state.title}</h3>
        <p className="text-[13px] text-content-secondary mb-5 leading-relaxed">
          {state.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className={`${btnBase} border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`${btnBase} ${variantBtn[state.variant] ?? variantBtn.primary}`}
            onClick={handleConfirm}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
