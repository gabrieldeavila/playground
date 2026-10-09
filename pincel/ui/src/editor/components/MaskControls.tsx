import type { LayerMeta, ToolCall } from '../domain/types';
import { Toggle } from './Toggle';

interface Props {
  layer: LayerMeta;
  run: (call: ToolCall) => void;
}

/** Turn the active layer's mask on/off, bake it in, or throw it away. */
export function MaskControls({ layer, run }: Props) {
  if (!layer.mask) return null;
  const layerId = layer.id;
  return (
    <div className="mb-2 flex items-center gap-3 text-xs">
      <Toggle
        label="Mask on"
        checked={layer.mask.enabled}
        onChange={(maskEnabled) => run({ name: 'update_layer', input: { layerId, maskEnabled } })}
      />
      <button
        type="button"
        title="Erase what the mask hides and remove it"
        onClick={() => run({ name: 'remove_layer_mask', input: { layerId, apply: true } })}
        className="ml-auto rounded bg-panel-2 px-2 py-0.5 hover:bg-edge"
      >
        Apply
      </button>
      <button
        type="button"
        title="Remove the mask without changing pixels"
        onClick={() => run({ name: 'remove_layer_mask', input: { layerId, apply: false } })}
        className="rounded bg-panel-2 px-2 py-0.5 hover:bg-edge"
      >
        Delete
      </button>
    </div>
  );
}
