import { LuLoaderCircle } from 'react-icons/lu';
import type { ChatEntry } from '../domain/agent-events';
import { workingLabel } from '../domain/working-label';

/** Shown while a request runs, so a long think never looks like a frozen panel. */
export function AgentWorking({ entries }: { entries: ChatEntry[] }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
      <LuLoaderCircle className="animate-spin" />
      {workingLabel(entries)}
    </p>
  );
}
