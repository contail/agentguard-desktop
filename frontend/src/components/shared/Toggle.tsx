interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="toggle-row">
      <span className="toggle-label-text">{checked ? "On" : "Off"}</span>
      <label className="toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          role="switch"
          aria-label={label}
        />
        <div className="toggle-track" />
      </label>
    </div>
  );
}
