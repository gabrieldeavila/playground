import { LuCheck, LuLoaderCircle, LuPencilLine, LuX } from 'react-icons/lu';
import type { ChatEntry, ToolEntry, ToolStepStatus } from '../domain/agent-events';
import { describeToolCall } from '../domain/describe-tool-call';

/** One line of the agent transcript: a request, reasoning, a thought, a tool step, the reply or an error. */
export function AgentEntry({ entry }: { entry: ChatEntry }) {
  switch (entry.kind) {
    case 'user':
      return (
        <div className="ml-6 rounded-lg bg-accent/20 px-2.5 py-1.5 whitespace-pre-wrap">
          {entry.preset && <p className="text-[11px] text-zinc-400">Preset: {entry.preset}</p>}
          {entry.text}
        </div>
      );
    case 'reasoning':
      return <p className="border-l-2 border-edge pl-2 text-xs whitespace-pre-wrap text-zinc-500">{entry.text}</p>;
    case 'draft':
    case 'thinking':
      return <p className="text-xs whitespace-pre-wrap text-zinc-400 italic">{entry.text}</p>;
    case 'tool':
      return <ToolStep entry={entry} />;
    case 'reply':
      return (
        <div className="rounded-lg bg-panel-2 px-2.5 py-1.5 whitespace-pre-wrap">
          {entry.text || '(no reply)'}
          {entry.stoppedAtLimit && <p className="mt-1 text-xs text-amber-300/80">Stopped at the step limit.</p>}
        </div>
      );
    case 'error':
      return <p className="rounded-lg bg-red-500/15 px-2.5 py-1.5 text-red-300">{entry.text}</p>;
  }
}

function ToolStep({ entry }: { entry: ToolEntry }) {
  return (
    <details className="group text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
        <StatusIcon status={entry.status} />
        <span className="truncate font-mono">{describeToolCall(entry.name, entry.arguments)}</span>
      </summary>
      <pre className="mt-1 max-h-40 overflow-auto rounded bg-black/40 p-1.5 font-mono text-[10px] break-all whitespace-pre-wrap text-zinc-400">
        {entry.arguments}
        {entry.result && `\n→ ${entry.result}`}
      </pre>
    </details>
  );
}

function StatusIcon({ status }: { status: ToolStepStatus }) {
  if (status === 'writing') return <LuPencilLine className="shrink-0 animate-pulse text-accent" />;
  if (status === 'running') return <LuLoaderCircle className="shrink-0 animate-spin text-accent" />;
  return status === 'done' ? <LuCheck className="shrink-0 text-emerald-400" /> : <LuX className="shrink-0 text-red-400" />;
}
