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
      <div className="empty-state--hero">
        {icon && <div className="empty-state__icon">{icon}</div>}
        {title && <h3 className="empty-state__title">{title}</h3>}
        {description && <p className="empty-state__desc">{description}</p>}
        {action && (
          <button
            className={`btn ${action.className || "btn-primary"}`}
            onClick={action.onClick}
            style={{ marginTop: 24 }}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`empty-state ${variant === "error" ? "empty-state--error" : ""}`}>
      {icon && (
        <div className="empty-state__icon-small" style={{ marginBottom: 12 }}>
          {icon}
        </div>
      )}
      <p>{message || title}</p>
      {description && (
        <p style={{ fontSize: 12, marginTop: 6, color: "var(--text-muted)" }}>{description}</p>
      )}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: 12 }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
