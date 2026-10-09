interface Props {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function SliderField({ label, min, max, step = 1, value, suffix = '', onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-zinc-400">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 accent-accent"
      />
      <span className="w-12 tabular-nums">
        {value}
        {suffix}
      </span>
    </label>
  );
}
