import { useState } from 'react';
import { CanvasStage } from './components/CanvasStage';
import { DropOverlay } from './components/DropOverlay';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { TextEntry } from './components/TextEntry';
import { Toolbar } from './components/Toolbar';
import { ToolOptions } from './components/ToolOptions';
import { TopBar } from './components/TopBar';
import type { EditorToolId } from './domain/editor-tools';
import type { DocumentSnapshot, ToolSettings } from './domain/types';
import { useCanvasGesture } from './hooks/useCanvasGesture';
import { useDocument } from './hooks/useDocument';
import { useEditorActions } from './hooks/useEditorActions';
import { useFitZoom } from './hooks/useFitZoom';
import { useImageOpener } from './hooks/useImageOpener';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSelectionActions } from './hooks/useSelectionActions';
import { useTextEntry } from './hooks/useTextEntry';
import { useToolRunner } from './hooks/useToolRunner';
import { useToolSettings } from './hooks/useToolSettings';

export function Editor() {
  const { doc, online, lastChange } = useDocument();
  if (!doc) return <p className="grid h-full place-items-center text-zinc-500">{online ? 'Loading…' : 'Waiting for the Pincel API on :4300…'}</p>;
  return <Workspace doc={doc} online={online} lastChange={lastChange} />;
}

function Workspace({ doc, online, lastChange }: { doc: DocumentSnapshot; online: boolean; lastChange: string }) {
  const [tool, setTool] = useState<EditorToolId>('brush');
  const { settings: chosen, update, swapColors } = useToolSettings();
  const settings = withEffectiveTarget(chosen, doc);
  const { run, error, clearError, showError } = useToolRunner();
  const opener = useImageOpener(doc.canUndo, showError);
  const textEntry = useTextEntry();
  const { containerRef, zoom } = useFitZoom(doc);
  const selection = useSelectionActions(run, doc.activeLayerId, settings);
  const actions = useEditorActions({ doc, tool, settings, run, updateSettings: update, openTextEntry: textEntry.open });
  const gesture = useCanvasGesture({
    doc,
    tool,
    settings,
    onDrag: (points, mode) => void actions.commitDrag(points, mode).then((result) => !result && gesture.clearPreview()),
    onClick: (point, mode) => void actions.clickAt(point, mode),
  });

  useKeyboardShortcuts({
    ...selection,
    selectTool: setTool,
    undo: () => void run({ name: 'undo', input: {} }),
    redo: () => void run({ name: 'redo', input: {} }),
    swapColors,
  });

  return (
    <div className="relative flex h-full flex-col" {...opener.dropHandlers}>
      {opener.dragging && <DropOverlay />}
      <TopBar doc={doc} run={run} onOpenImage={opener.open} />
      <ToolOptions tool={tool} settings={settings} onSettings={update} />
      <div className="flex min-h-0 flex-1">
        <Toolbar tool={tool} onSelect={setTool} settings={settings} onSettings={update} onSwapColors={swapColors} />
        <CanvasStage
          doc={doc}
          zoom={zoom}
          containerRef={containerRef}
          overlayRef={gesture.overlayRef}
          handlers={gesture.handlers}
          onRendered={gesture.clearPreview}
          cursor={tool === 'move' ? 'move' : tool === 'text' ? 'text' : 'crosshair'}
        >
          {textEntry.at && (
            <TextEntry
              at={textEntry.at}
              zoom={zoom}
              fontSize={settings.fontSize}
              color={settings.primaryColor}
              onCancel={textEntry.close}
              onCommit={(text) => {
                void actions.commitText(text, textEntry.at!);
                textEntry.close();
              }}
            />
          )}
        </CanvasStage>
        <Sidebar doc={doc} run={run} target={settings.target} onEditTarget={(target) => update({ target })} selection={selection} />
      </div>
      <StatusBar online={online} lastChange={lastChange} error={error} onDismissError={clearError} />
    </div>
  );
}

/** Painting can only target the mask while the active layer has one. */
function withEffectiveTarget(settings: ToolSettings, doc: DocumentSnapshot): ToolSettings {
  const active = doc.layersBottomToTop.find((l) => l.id === doc.activeLayerId);
  return settings.target === 'mask' && !active?.mask ? { ...settings, target: 'pixels' } : settings;
}
