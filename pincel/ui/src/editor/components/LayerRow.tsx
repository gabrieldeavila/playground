import clsx from 'clsx';
import { useState } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { layerThumbnailUrl, maskThumbnailUrl } from '../api/pincel-api';
import type { LayerMeta, ToolCall, ToolSettings } from '../domain/types';
import { LayerThumbnail } from './LayerThumbnail';

interface Props {
  layer: LayerMeta;
  version: number;
  active: boolean;
  target: ToolSettings['target'];
  onEdit: (target: ToolSettings['target']) => void;
  run: (call: ToolCall) => void;
}

export function LayerRow({ layer, version, active, target, onEdit, run }: Props) {
  const [renaming, setRenaming] = useState(false);
  const rename = (name: string) => {
    setRenaming(false);
    if (name.trim() && name !== layer.name) run({ name: 'update_layer', input: { layerId: layer.id, name } });
  };
  const edit = (next: ToolSettings['target']) => {
    if (!active) run({ name: 'select_layer', input: { layerId: layer.id } });
    onEdit(next);
  };

  return (
    <li
      onClick={() => !active && edit('pixels')}
      className={clsx('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5', active ? 'bg-accent/25' : 'hover:bg-panel-2')}
    >
      <button
        type="button"
        title={layer.visible ? 'Hide' : 'Show'}
        onClick={(e) => {
          e.stopPropagation();
          run({ name: 'update_layer', input: { layerId: layer.id, visible: !layer.visible } });
        }}
        className="text-zinc-400 hover:text-white"
      >
        {layer.visible ? <LuEye /> : <LuEyeOff />}
      </button>
      <LayerThumbnail
        src={layerThumbnailUrl(layer.id, version)}
        title="Paint on the layer"
        editing={active && !!layer.mask && target === 'pixels'}
        onClick={() => edit('pixels')}
      />
      {layer.mask && (
        <LayerThumbnail
          src={maskThumbnailUrl(layer.id, version)}
          title="Paint on the mask (black hides, white shows)"
          editing={active && target === 'mask'}
          dimmed={!layer.mask.enabled}
          onClick={() => edit('mask')}
        />
      )}
      {renaming ? (
        <input
          autoFocus
          defaultValue={layer.name}
          onBlur={(e) => rename(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && rename(e.currentTarget.value)}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded bg-panel-2 px-1"
        />
      ) : (
        <span onDoubleClick={() => setRenaming(true)} className={clsx('min-w-0 flex-1 truncate', !layer.visible && 'opacity-50')}>
          {layer.name}
        </span>
      )}
      <span className="text-[10px] text-zinc-500">{layer.id.replace('layer_', '#')}</span>
    </li>
  );
}
