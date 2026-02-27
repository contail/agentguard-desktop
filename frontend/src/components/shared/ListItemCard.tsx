interface ListItemCardProps {
  badge: React.ReactNode;
  title: string;
  meta: React.ReactNode;
  actions?: React.ReactNode;
}

export function ListItemCard({ badge, title, meta, actions }: ListItemCardProps) {
  return (
    <div className="list-item-card">
      <div className="list-item-card__badge">{badge}</div>
      <div className="list-item-card__body">
        <div className="list-item-card__title">{title}</div>
        <div className="list-item-card__meta">{meta}</div>
      </div>
      {actions && <div className="list-item-card__actions">{actions}</div>}
    </div>
  );
}
