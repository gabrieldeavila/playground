import clsx from 'clsx';
import { LuX } from 'react-icons/lu';

interface Props {
  online: boolean;
  lastChange: string;
  error: string | null;
  onDismissError: () => void;
}

export function StatusBar({ online, lastChange, error, onDismissError }: Props) {
  return (
    <footer className="flex h-7 items-center gap-3 border-t border-edge bg-panel px-3 text-xs text-zinc-400">
      <span className="flex items-center gap-1.5">
        <span className={clsx('size-2 rounded-full', online ? 'bg-emerald-400' : 'bg-red-500')} />
        {online ? 'Live' : 'API offline — start it with pnpm dev'}
      </span>
      {lastChange && <span>Last change: {lastChange}</span>}
      {error && (
        <span className="ml-auto flex items-center gap-1 text-red-400">
          {error}
          <button type="button" onClick={onDismissError} aria-label="Dismiss">
            <LuX />
          </button>
        </span>
      )}
    </footer>
  );
}
