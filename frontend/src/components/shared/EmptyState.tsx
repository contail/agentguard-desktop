interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  variant?: "default" | "error" | "hero";
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void; className?: string };
}

export function EmptyState({
  title,
  message,
  description,
  variant = "default",
  icon,
  action,
}: EmptyStateProps) {
  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
        {icon && (
          <div className="w-12 h-12 text-content-muted mb-5 opacity-50">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="text-base font-semibold text-content-secondary mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-[13px] text-content-muted max-w-xs leading-relaxed">
            {description}
          </p>
        )}
        {action && (
          <button
            className={`inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover mt-6 ${action.className ?? ""}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-5 text-[13px] ${
        variant === "error" ? "text-danger" : "text-content-muted"
      }`}
    >
      {icon && (
        <div className="w-8 h-8 text-content-muted opacity-70 mb-3">
          {icon}
        </div>
      )}
      <p>{message || title}</p>
      {description && (
        <p className="text-xs mt-1.5 text-content-muted">{description}</p>
      )}
      {action && (
        <button
          className="inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover mt-3"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
