import { useState } from 'react';

interface Props {
  onCreate: (input: { width: number; height: number; background: string }) => void;
}

const PRESETS = [
  { label: '1024 × 768', width: 1024, height: 768 },
  { label: 'Square 1080', width: 1080, height: 1080 },
  { label: 'HD 1920 × 1080', width: 1920, height: 1080 },
  { label: 'Story 1080 × 1920', width: 1080, height: 1920 },
];

export function NewDocumentForm({ onCreate }: Props) {
  const [size, setSize] = useState({ width: 1024, height: 768 });
  const [background, setBackground] = useState('#ffffff');
  const [transparent, setTransparent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ ...size, background: transparent ? 'transparent' : background });
      }}
      className="absolute top-12 left-24 z-20 flex w-72 flex-col gap-3 rounded-lg border border-edge bg-panel p-4 shadow-xl"
    >
      <h3 className="font-semibold">New document</h3>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setSize({ width: p.width, height: p.height })}
            className="rounded bg-panel-2 px-2 py-1 text-xs hover:bg-edge"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <NumberInput label="Width" value={size.width} onChange={(width) => setSize((s) => ({ ...s, width }))} />
        <NumberInput label="Height" value={size.height} onChange={(height) => setSize((s) => ({ ...s, height }))} />
      </div>
      <label className="flex items-center gap-2">
        Background
        <input type="color" value={background} disabled={transparent} onChange={(e) => setBackground(e.target.value)} />
        <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="ml-2 accent-accent" />
        Transparent
      </label>
      <p className="text-xs text-amber-300/80">This replaces the current image and its history.</p>
      <button type="submit" className="rounded bg-accent py-1.5 font-medium text-white hover:brightness-110">
        Create
      </button>
    </form>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">
      {label}
      <input
        type="number"
        min={1}
        max={8192}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded bg-panel-2 px-2 py-1 text-sm text-zinc-100"
      />
    </label>
  );
}
