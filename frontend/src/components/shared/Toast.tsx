import type { Toast as ToastType } from "../../types";

interface ToastProps {
  toast: ToastType;
}

const typeClasses: Record<string, string> = {
  success: "bg-[#166534] text-[#bbf7d0]",
  error: "bg-[#991b1b] text-[#fecaca]",
};

export function Toast({ toast }: ToastProps) {
  return (
    <div
      className={`fixed top-[50px] right-4 py-2.5 px-[18px] rounded-lg text-xs font-medium z-[1000] animate-slide-in shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${typeClasses[toast.type] ?? ""}`}
      role="alert"
    >
      {toast.message}
    </div>
  );
}
