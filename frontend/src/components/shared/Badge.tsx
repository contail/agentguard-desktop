type BadgeVariant = "pending" | "approved" | "denied" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: "bg-warning-muted text-warning",
  approved: "bg-success-muted text-success",
  denied: "bg-danger-muted text-danger",
  info: "bg-accent/[0.12] text-accent",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-[2px] rounded-lg text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
