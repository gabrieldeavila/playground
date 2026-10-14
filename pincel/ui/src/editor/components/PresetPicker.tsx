import { LuLayoutTemplate } from 'react-icons/lu';
import type { PresetSummary } from '../domain/presets';

interface Props {
  presets: PresetSummary[];
  chosen: string;
  onChoose: (name: string) => void;
}

/** Picks a saved preset the agent should follow; hidden until there is one. */
export function PresetPicker({ presets, chosen, onChoose }: Props) {
  if (presets.length === 0) return null;
  const description = presets.find((preset) => preset.name === chosen)?.description;

  return (
    <label className="flex items-center gap-2 border-t border-edge px-2 pt-2 text-xs text-zinc-400" title={description}>
      <LuLayoutTemplate className="shrink-0" />
      <select
        value={chosen}
        onChange={(e) => onChoose(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-edge bg-panel-2 px-2 py-1 text-zinc-200"
      >
        <option value="">No preset</option>
        {presets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name}
          </option>
        ))}
      </select>
    </label>
  );
}
