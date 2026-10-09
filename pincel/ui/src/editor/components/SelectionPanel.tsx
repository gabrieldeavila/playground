import { useState } from 'react';
import type { SelectionActions } from '../hooks/useSelectionActions';
import type { DocumentSnapshot } from '../domain/types';
import { PanelSection } from './PanelSection';

interface Props {
  doc: DocumentSnapshot;
  actions: SelectionActions;
}

/** The Select menu: whole-selection commands and "layer via copy/cut". */
export function SelectionPanel({ doc, actions }: Props) {
  const [feather, setFeather] = useState(8);
  const has = doc.selection !== null;
  const bounds = doc.selection?.bounds;

  return (
    <PanelSection title="Selection">
      <p className="mb-2 text-xs text-zinc-500">
        {!has && 'None. Edits affect the whole layer.'}
        {has && bounds && `${Math.round(bounds.width)} × ${Math.round(bounds.height)} at ${Math.round(bounds.x)}, ${Math.round(bounds.y)}`}
        {has && !bounds && 'Empty. Nothing can be edited.'}
      </p>
      <div className="grid grid-cols-3 gap-1">
        <Action label="All" title="Select all (⌘A)" onClick={actions.selectAll} />
        <Action label="None" title="Deselect (⌘D / Esc)" onClick={actions.deselect} disabled={!has} />
        <Action label="Invert" title="Invert (⇧⌘I)" onClick={actions.invertSelection} disabled={!has} />
        <Action label="From layer" title="Select the active layer's visible pixels" onClick={actions.selectLayerPixels} />
        <Action label="Copy → layer" title="Layer via copy (⌘J)" onClick={actions.layerViaCopy} />
        <Action label="Cut → layer" title="Layer via cut (⇧⌘J)" onClick={actions.layerViaCut} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={60}
          value={feather}
          onChange={(e) => setFeather(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <Action label={`Feather ${feather}px`} title="Soften the selection edge" onClick={() => actions.featherSelection(feather)} disabled={!has} />
      </div>
    </PanelSection>
  );
}

function Action({ label, title, onClick, disabled }: { label: string; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded bg-panel-2 px-2 py-1 text-xs hover:bg-edge disabled:pointer-events-none disabled:opacity-35"
    >
      {label}
    </button>
  );
}
