import type { DocumentSnapshot, ToolCall, ToolSettings } from '../domain/types';
import type { SelectionActions } from '../hooks/useSelectionActions';
import { ActivityFeed } from './ActivityFeed';
import { FiltersPanel } from './FiltersPanel';
import { LayersPanel } from './LayersPanel';
import { SelectionPanel } from './SelectionPanel';

interface Props {
  doc: DocumentSnapshot;
  run: (call: ToolCall) => void;
  target: ToolSettings['target'];
  onEditTarget: (target: ToolSettings['target']) => void;
  selection: SelectionActions;
}

export function Sidebar({ doc, run, target, onEditTarget, selection }: Props) {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-edge bg-panel">
      <LayersPanel doc={doc} run={run} target={target} onEditTarget={onEditTarget} />
      <SelectionPanel doc={doc} actions={selection} />
      <FiltersPanel layerId={doc.activeLayerId} target={target} run={run} />
      <ActivityFeed edits={doc.recentEdits} />
    </aside>
  );
}
