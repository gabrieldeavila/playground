import type { ReactNode } from 'react';

interface Props {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PanelSection({ title, actions, children }: Props) {
  return (
    <section className="border-b border-edge p-3">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{title}</h2>
        <div className="flex gap-0.5">{actions}</div>
      </header>
      {children}
    </section>
  );
}
