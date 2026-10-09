import { useState } from 'react';
import { FILTER_OPTIONS } from '../domain/filter-options';
import type { ToolCall, ToolSettings } from '../domain/types';
import { PanelSection } from './PanelSection';

interface Props {
  layerId: string;
  target: ToolSettings['target'];
  run: (call: ToolCall) => void;
}

export function FiltersPanel({ layerId, target, run }: Props) {
  const [name, setName] = useState<string>(FILTER_OPTIONS[0].name);
  const option = FILTER_OPTIONS.find((f) => f.name === name) ?? FILTER_OPTIONS[0];
  const [amount, setAmount] = useState<number>(option.initial);

  const choose = (next: string) => {
    setName(next);
    setAmount(FILTER_OPTIONS.find((f) => f.name === next)?.initial ?? 0);
  };

  return (
    <PanelSection title={target === 'mask' ? 'Adjustments (mask)' : 'Adjustments'}>
      <div className="flex items-center gap-2">
        <select value={name} onChange={(e) => choose(e.target.value)} className="min-w-0 flex-1 rounded bg-panel-2 px-1.5 py-1">
          {FILTER_OPTIONS.map((f) => (
            <option key={f.name} value={f.name}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => run({ name: 'apply_filter', input: { layerId, filter: name, amount, target } })}
          className="rounded bg-accent px-3 py-1 font-medium text-white hover:brightness-110"
        >
          Apply
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="range"
          min={option.min}
          max={option.max}
          step={option.step}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="w-10 text-right tabular-nums text-zinc-400">{amount}</span>
      </div>
    </PanelSection>
  );
}
