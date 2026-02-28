interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  variant?: "stat" | "info";
  colorClass?: string;
  icon?: React.ReactNode;
  description?: string;
}

export function StatBox({
  label,
  value,
  variant = "stat",
  colorClass,
  icon,
  description,
}: StatBoxProps) {
  return (
    <div className="stat-box">
      {icon && <div className="stat-box__icon">{icon}</div>}
      <div className="stat-label">{label}</div>
      <div
        className={`stat-value ${variant === "info" ? "stat-value--text" : ""} ${colorClass ?? ""}`}
      >
        {value}
      </div>
      {description && <div className="stat-box__desc">{description}</div>}
    </div>
  );
}
