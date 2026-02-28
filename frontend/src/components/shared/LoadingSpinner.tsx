interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 24,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center py-10 px-5 ${className ?? ""}`}
      role="status"
    >
      <div
        className="border-2 border-line border-t-accent rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
