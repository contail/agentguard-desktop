interface ListItemCardProps {
  badge: React.ReactNode;
  title: string;
  meta: React.ReactNode;
  actions?: React.ReactNode;
}

export function ListItemCard({
  badge,
  title,
  meta,
  actions,
}: ListItemCardProps) {
  return (
    <div className="bg-white/[0.02] border border-line rounded py-3.5 px-4 mb-2 flex items-center gap-3 transition-colors hover:border-line-hover">
      <div className="shrink-0">{badge}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-content-primary">
          {title}
        </div>
        <div className="text-[11px] text-content-muted mt-[3px]">{meta}</div>
      </div>
      {actions && <div className="flex gap-1.5 shrink-0">{actions}</div>}
    </div>
  );
}
