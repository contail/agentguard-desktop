interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-container ${className ?? ""}`} role="status">
      <div className="loading-spinner" style={{ width: size, height: size }} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
