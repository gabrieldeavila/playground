import clsx from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function IconButton({ label, onClick, active, disabled, children }: Props) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'grid size-8 place-items-center rounded-md text-base transition-colors',
        active ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-panel-2',
        disabled && 'pointer-events-none opacity-35',
      )}
    >
      {children}
    </button>
  );
}
