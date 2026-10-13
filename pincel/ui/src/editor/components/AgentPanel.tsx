import clsx from 'clsx';
import { useState } from 'react';
import { LuSettings, LuSquarePen } from 'react-icons/lu';
import { needsApiKey } from '../domain/agent-providers';
import { useAgentChat } from '../hooks/useAgentChat';
import { useAgentSettings } from '../hooks/useAgentSettings';
import { useScrollToEnd } from '../hooks/useScrollToEnd';
import { AgentEntry } from './AgentEntry';
import { AgentInput } from './AgentInput';
import { AgentSettingsForm } from './AgentSettingsForm';
import { AgentWorking } from './AgentWorking';
import { IconButton } from './IconButton';

/** Chat with the built-in agent; its edits show up on the canvas as it works. */
export function AgentPanel({ open }: { open: boolean }) {
  const chat = useAgentChat();
  const agentSettings = useAgentSettings();
  const [editingSettings, setEditingSettings] = useState(false);
  const listRef = useScrollToEnd<HTMLDivElement>(chat.entries);
  const { settings } = agentSettings;
  const showSettings = editingSettings || (settings !== null && needsApiKey(settings));

  return (
    // Hidden rather than unmounted, so the conversation survives closing the panel.
    <aside className={clsx('w-80 shrink-0 flex-col border-l border-edge bg-panel', open ? 'flex' : 'hidden')}>
      <header className="flex items-center gap-1 border-b border-edge px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Agent</h2>
          <p className="truncate text-xs text-zinc-500">{settings?.model ?? '…'}</p>
        </div>
        <IconButton label="New chat" disabled={!chat.entries.length} onClick={() => void chat.newChat()}>
          <LuSquarePen />
        </IconButton>
        <IconButton label="Model and API key" active={showSettings} onClick={() => setEditingSettings((open) => !open)}>
          <LuSettings />
        </IconButton>
      </header>
      {showSettings && settings ? (
        <AgentSettingsForm
          settings={settings}
          error={agentSettings.error}
          onSave={agentSettings.save}
          onDone={() => setEditingSettings(false)}
        />
      ) : (
        <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {chat.entries.length === 0 && (
            <p className="text-zinc-500">Ask for an image or an edit. The agent works on this document and checks its own renders.</p>
          )}
          {chat.entries.map((entry, i) => (
            <AgentEntry key={i} entry={entry} />
          ))}
          {chat.busy && <AgentWorking entries={chat.entries} />}
        </div>
      )}
      <AgentInput busy={chat.busy} disabled={showSettings} onSend={(text) => void chat.send(text)} onStop={chat.stop} />
    </aside>
  );
}
