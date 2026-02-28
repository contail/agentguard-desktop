interface CardProps {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ title, headerRight, children }: CardProps) {
  return (
    <div className="bg-surface-card border border-line rounded p-5 mb-4 transition-colors hover:border-line-hover">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">
          {title}
        </span>
        {headerRight}
      </div>
      {children}
    </div>
  );
}
