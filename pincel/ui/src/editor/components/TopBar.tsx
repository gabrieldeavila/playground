import { useState } from 'react';
import { LuDownload, LuFilePlus, LuPlug, LuRedo2, LuUndo2 } from 'react-icons/lu';
import type { DocumentSnapshot, ToolCall } from '../domain/types';
import { ConnectAiPanel } from './ConnectAiPanel';
import { IconButton } from './IconButton';
import { NewDocumentForm } from './NewDocumentForm';

interface Props {
  doc: DocumentSnapshot;
  run: (call: ToolCall) => void;
}

type Popover = 'new' | 'connect' | null;

export function TopBar({ doc, run }: Props) {
  const [open, setOpen] = useState<Popover>(null);
  const toggle = (which: Popover) => setOpen((current) => (current === which ? null : which));

  return (
    <header className="relative flex h-11 items-center gap-1 border-b border-edge bg-panel px-3">
      <span className="mr-3 font-semibold tracking-tight">
        <span className="text-accent">●</span> Pincel
      </span>
      <IconButton label="New document" active={open === 'new'} onClick={() => toggle('new')}>
        <LuFilePlus />
      </IconButton>
      <IconButton label="Undo (⌘Z)" disabled={!doc.canUndo} onClick={() => run({ name: 'undo', input: {} })}>
        <LuUndo2 />
      </IconButton>
      <IconButton label="Redo (⇧⌘Z)" disabled={!doc.canRedo} onClick={() => run({ name: 'redo', input: {} })}>
        <LuRedo2 />
      </IconButton>
      <a
        href="/api/render.png"
        download="pincel.png"
        title="Export PNG"
        className="grid size-8 place-items-center rounded-md text-base text-zinc-300 hover:bg-panel-2"
      >
        <LuDownload />
      </a>
      <span className="ml-3 text-xs text-zinc-500">
        {doc.width} × {doc.height}px
      </span>
      <button
        type="button"
        onClick={() => toggle('connect')}
        className="ml-auto flex items-center gap-1.5 rounded-md border border-edge px-2.5 py-1 text-zinc-300 hover:bg-panel-2"
      >
        <LuPlug /> Connect an AI
      </button>
      {open === 'new' && (
        <NewDocumentForm
          onCreate={(input) => {
            run({ name: 'create_document', input });
            setOpen(null);
          }}
        />
      )}
      {open === 'connect' && <ConnectAiPanel />}
    </header>
  );
}
