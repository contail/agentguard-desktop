import type { Toast as ToastType } from "../../types";

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  return (
    <div className={`toast ${toast.type}`} role="alert">
      {toast.message}
    </div>
  );
}
