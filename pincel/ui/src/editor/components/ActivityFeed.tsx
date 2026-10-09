import clsx from 'clsx';
import { LuBot, LuUser } from 'react-icons/lu';
import type { EditEntry } from '../domain/types';
import { PanelSection } from './PanelSection';

/** Recent edits, newest first, marking which ones came from an AI. */
export function ActivityFeed({ edits }: { edits: EditEntry[] }) {
  const newestFirst = [...edits].reverse();
  return (
    <PanelSection title="History">
      {newestFirst.length === 0 && <p className="text-zinc-500">No edits yet.</p>}
      <ol className="flex max-h-56 flex-col gap-1 overflow-y-auto">
        {newestFirst.map((edit, i) => {
          const byAi = edit.source !== 'ui';
          return (
            <li key={`${edit.at}-${i}`} className={clsx('flex items-center gap-2', i > 0 && 'opacity-70')}>
              <span
                title={byAi ? `AI via ${edit.source.toUpperCase()}` : 'You'}
                className={clsx('grid size-5 place-items-center rounded', byAi ? 'bg-fuchsia-500/25 text-fuchsia-300' : 'bg-panel-2 text-zinc-400')}
              >
                {byAi ? <LuBot /> : <LuUser />}
              </span>
              <span className="flex-1 truncate font-mono text-xs">{edit.type}</span>
              {edit.edits > 1 && <span className="rounded bg-panel-2 px-1 text-[10px] text-zinc-400">×{edit.edits}</span>}
              <time className="text-[10px] text-zinc-500">{new Date(edit.at).toLocaleTimeString()}</time>
            </li>
          );
        })}
      </ol>
    </PanelSection>
  );
}
