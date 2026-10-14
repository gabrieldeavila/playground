import { LuInfo, LuLayoutTemplate } from 'react-icons/lu';
import type { PresetSummary } from '../domain/presets';
import { IconButton } from './IconButton';

interface Props {
  presets: PresetSummary[];
  chosen: string;
  onChoose: (name: string) => void;
  showingDetails: boolean;
  onToggleDetails: () => void;
}

/** Picks a saved preset the agent should follow, and opens its details; hidden until there is one. */
export function PresetPicker({ presets, chosen, onChoose, showingDetails, onToggleDetails }: Props) {
  if (presets.length === 0) return null;
  const description = presets.find((preset) => preset.name === chosen)?.description;

  return (
    <div className="flex items-center gap-1 border-t border-edge px-2 pt-2 text-xs text-zinc-400">
      <label className="flex min-w-0 flex-1 items-center gap-2" title={description}>
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
      <IconButton label="Preset details" active={showingDetails} disabled={!chosen} onClick={onToggleDetails}>
        <LuInfo />
      </IconButton>
    </div>
  );
}
