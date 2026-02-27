interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {children && <div className="page-header__controls">{children}</div>}
    </div>
  );
}
