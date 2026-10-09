interface Props {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, checked, onChange }: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-accent" />
      {label}
    </label>
  );
}
