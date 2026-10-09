import { LuArrowLeftRight } from 'react-icons/lu';
import type { ToolSettings } from '../domain/types';

interface Props {
  settings: ToolSettings;
  onSettings: (changes: Partial<ToolSettings>) => void;
  onSwap: () => void;
}

/** Photoshop-style foreground/background swatches. */
export function ColorSwatches({ settings, onSettings, onSwap }: Props) {
  return (
    <div className="relative mb-1 h-12 w-10">
      <input
        type="color"
        title="Secondary color"
        value={settings.secondaryColor}
        onChange={(e) => onSettings({ secondaryColor: e.target.value })}
        className="absolute right-0 bottom-0 size-6 cursor-pointer rounded border border-zinc-500 bg-transparent p-0"
      />
      <input
        type="color"
        title="Primary color"
        value={settings.primaryColor}
        onChange={(e) => onSettings({ primaryColor: e.target.value })}
        className="absolute top-0 left-0 size-6 cursor-pointer rounded border border-zinc-300 bg-transparent p-0"
      />
      <button
        type="button"
        title="Swap colors (X)"
        onClick={onSwap}
        className="absolute top-0 right-0 text-[11px] text-zinc-400 hover:text-white"
      >
        <LuArrowLeftRight />
      </button>
    </div>
  );
}
