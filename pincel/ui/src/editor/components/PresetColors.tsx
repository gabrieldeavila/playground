/** The preset's named colors as swatches. */
export function PresetColors({ colors }: { colors: Record<string, string> }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {Object.entries(colors).map(([name, color]) => (
        <li key={name} className="flex items-center gap-1.5 text-xs">
          <span className="size-5 rounded border border-zinc-500" style={{ background: color }} />
          <span className="text-zinc-300">{name}</span>
          <span className="text-zinc-500">{color}</span>
        </li>
      ))}
    </ul>
  );
}
