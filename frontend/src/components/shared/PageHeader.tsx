interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {children && <div className="page-header__controls">{children}</div>}
    </div>
  );
}
