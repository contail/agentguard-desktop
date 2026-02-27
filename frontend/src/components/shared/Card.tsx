interface CardProps {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ title, headerRight, children }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {headerRight}
      </div>
      {children}
    </div>
  );
}
