import { LuCopy, LuMerge, LuPlus, LuTrash2, LuVenetianMask } from 'react-icons/lu';
import type { DocumentSnapshot, ToolCall, ToolSettings } from '../domain/types';
import { IconButton } from './IconButton';
import { LayerProperties } from './LayerProperties';
import { LayerRow } from './LayerRow';
import { MaskControls } from './MaskControls';
import { PanelSection } from './PanelSection';

interface Props {
  doc: DocumentSnapshot;
  run: (call: ToolCall) => void;
  target: ToolSettings['target'];
  onEditTarget: (target: ToolSettings['target']) => void;
}

/** Layers listed top to bottom, like Photoshop. */
export function LayersPanel({ doc, run, target, onEditTarget }: Props) {
  const layers = [...doc.layersBottomToTop].reverse();
  const active = doc.layersBottomToTop.find((l) => l.id === doc.activeLayerId);
  const isBottom = doc.layersBottomToTop[0]?.id === doc.activeLayerId;
  const layerId = doc.activeLayerId;
  const addMask = () => {
    run({ name: 'add_layer_mask', input: { layerId } });
    onEditTarget('mask');
  };

  return (
    <PanelSection
      title="Layers"
      actions={
        <>
          <IconButton label="New layer" onClick={() => run({ name: 'add_layer', input: { name: `Layer ${doc.layersBottomToTop.length + 1}` } })}>
            <LuPlus />
          </IconButton>
          <IconButton
            label={doc.selection ? 'Add mask from selection' : 'Add layer mask'}
            disabled={!!active?.mask}
            onClick={addMask}
          >
            <LuVenetianMask />
          </IconButton>
          <IconButton label="Duplicate layer" onClick={() => run({ name: 'duplicate_layer', input: { layerId } })}>
            <LuCopy />
          </IconButton>
          <IconButton label="Merge down" disabled={isBottom} onClick={() => run({ name: 'merge_down', input: { layerId } })}>
            <LuMerge />
          </IconButton>
          <IconButton label="Delete layer" disabled={layers.length === 1} onClick={() => run({ name: 'delete_layer', input: { layerId } })}>
            <LuTrash2 />
          </IconButton>
        </>
      }
    >
      {active && <LayerProperties layer={active} run={run} />}
      {active && <MaskControls layer={active} run={run} />}
      <ul className="flex flex-col gap-px">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            version={doc.version}
            active={layer.id === doc.activeLayerId}
            target={target}
            onEdit={onEditTarget}
            run={run}
          />
        ))}
      </ul>
    </PanelSection>
  );
}
