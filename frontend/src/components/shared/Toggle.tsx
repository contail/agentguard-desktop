interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between bg-surface-input border border-line rounded-sm py-2 px-2.5">
      <span className="text-[13px] text-content-secondary">
        {checked ? "On" : "Off"}
      </span>
      <label className="relative w-9 h-5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          role="switch"
          aria-label={label}
          className="peer sr-only"
        />
        <div className="absolute inset-0 bg-line rounded-full transition-colors peer-checked:bg-success before:content-[''] before:absolute before:w-3.5 before:h-3.5 before:left-[3px] before:top-[3px] before:bg-content-muted before:rounded-full before:transition-all peer-checked:before:translate-x-4 peer-checked:before:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
      </label>
    </div>
  );
}
