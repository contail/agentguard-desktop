interface EmptyStateProps {
  message: string;
  variant?: "default" | "error";
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message, variant = "default", action }: EmptyStateProps) {
  return (
    <div className={`empty-state ${variant === "error" ? "empty-state--error" : ""}`}>
      <p>{message}</p>
      {action && (
        <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: 12 }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
