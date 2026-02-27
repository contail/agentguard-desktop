interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  variant?: "stat" | "info";
  colorClass?: string;
}

export function StatBox({ label, value, variant = "stat", colorClass }: StatBoxProps) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div
        className={`stat-value ${variant === "info" ? "stat-value--text" : ""} ${colorClass ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
