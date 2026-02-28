interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  variant?: "stat" | "info";
  colorClass?: string;
  icon?: React.ReactNode;
  description?: string;
}

const colorMap: Record<string, string> = {
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning",
};

export function StatBox({
  label,
  value,
  variant = "stat",
  colorClass,
  icon,
  description,
}: StatBoxProps) {
  const valueColor = colorClass ? colorMap[colorClass] ?? "" : "";
  const isCompact =
    typeof value === "string" && value.length > 6;

  return (
    <div className="bg-white/[0.02] border border-line rounded-lg p-3.5 text-center transition-all hover:-translate-y-px hover:border-line-hover">
      {icon && (
        <div className="flex items-center justify-center mb-2 text-content-muted [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
      )}
      <div className="text-[10px] font-medium text-content-muted uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div
        className={`font-bold text-content-primary tabular-nums break-all ${
          variant === "info"
            ? "text-base"
            : isCompact
              ? "text-lg"
              : "text-2xl"
        } ${valueColor}`}
      >
        {value}
      </div>
      {description && (
        <div className="text-[10px] text-content-muted mt-1">{description}</div>
      )}
    </div>
  );
}
