import { presetPreviewUrl } from '../api/preset-api';
import type { PresetDetails } from '../domain/presets';

/** The latest piece made with the preset, or its blank canvas when there isn't one yet. */
export function PresetPreview({ preset, version }: { preset: PresetDetails; version: number }) {
  if (preset.hasPreview) {
    return (
      <img
        src={presetPreviewUrl(preset.name, version)}
        alt={`Latest piece made with ${preset.name}`}
        className="w-full rounded-md border border-edge"
      />
    );
  }
  const { canvas } = preset;
  return (
    <div
      className="grid w-full place-items-center rounded-md border border-dashed border-edge p-4 text-center text-xs text-zinc-500"
      style={canvas ? { aspectRatio: `${canvas.width} / ${canvas.height}`, background: canvas.background } : undefined}
    >
      <span className="rounded bg-panel/80 px-2 py-1">No preview yet: make a piece with this preset</span>
    </div>
  );
}
