import { BLEND_MODES } from '../domain/blend-modes';
import type { LayerMeta, ToolCall } from '../domain/types';

interface Props {
  layer: LayerMeta;
  run: (call: ToolCall) => void;
}

/** Blend mode and opacity of the active layer. Opacity is sent when the slider is released. */
export function LayerProperties({ layer, run }: Props) {
  const update = (changes: Partial<LayerMeta>) => run({ name: 'update_layer', input: { layerId: layer.id, ...changes } });

  return (
    <div className="mb-2 flex items-center gap-2">
      <select
        value={layer.blendMode}
        onChange={(e) => update({ blendMode: e.target.value })}
        className="min-w-0 flex-1 rounded bg-panel-2 px-1.5 py-1 capitalize"
      >
        {BLEND_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode.replace('-', ' ')}
          </option>
        ))}
      </select>
      <input
        key={`${layer.id}-${layer.opacity}`}
        type="range"
        min={0}
        max={100}
        defaultValue={Math.round(layer.opacity * 100)}
        onPointerUp={(e) => update({ opacity: Number(e.currentTarget.value) / 100 })}
        onKeyUp={(e) => update({ opacity: Number(e.currentTarget.value) / 100 })}
        title="Opacity"
        className="w-20 accent-accent"
      />
      <span className="w-9 text-right tabular-nums text-zinc-400">{Math.round(layer.opacity * 100)}%</span>
    </div>
  );
}
