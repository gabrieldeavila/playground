import { memo } from "react";
import { FiClock, FiDatabase, FiLayers, FiPlus } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import type { RequestTab } from "@/types/interface/request.interface";

type WorkspaceSidebarProps = {
  activeTab: string;
  requestTabs: RequestTab[];
  onSelectTab: (tabId: string) => void;
};

const WorkspaceSidebar = memo(
  ({ activeTab, requestTabs, onSelectTab }: WorkspaceSidebarProps) => (
    <aside className="hidden border-r border-(--color-border) bg-(--color-surface)/35 lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
          Workspace
        </p>
        <Button
          aria-label="Criar nova request"
          variant="ghost"
          size="sm"
          className="min-h-8 px-2"
          leftIcon={<FiPlus aria-hidden="true" />}
        />
      </div>
      <nav className="space-y-1 px-3" aria-label="Navegação do workspace">
        <button
          className="flex w-full items-center gap-3 rounded-lg bg-(--color-primary)/10 px-3 py-2.5 text-left text-sm font-medium text-(--color-primary)"
          type="button"
        >
          <FiLayers aria-hidden="true" />
          Requests
          <span className="ml-auto text-xs text-(--color-text-muted)">
            {requestTabs.length}
          </span>
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-(--color-text-muted) hover:bg-white/5"
          type="button"
        >
          <FiDatabase aria-hidden="true" />
          Environments
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-(--color-text-muted) hover:bg-white/5"
          type="button"
        >
          <FiClock aria-hidden="true" />
          History
        </button>
      </nav>
      <div className="mt-8 px-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
          Open requests
        </p>
        <div className="space-y-1">
          {requestTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5"
            >
              <span
                className={
                  tab.method === "GET"
                    ? "text-(--color-success)"
                    : "text-(--color-warning)"
                }
              >
                {tab.method}
              </span>
              <span className="min-w-0 flex-1 truncate text-(--color-text-muted)">
                {tab.label}
              </span>
              {tab.id === activeTab && (
                <span className="size-1.5 rounded-full bg-(--color-primary)" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto border-t border-(--color-border) p-4">
        <p className="text-xs text-(--color-text-muted)">Environment</p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full bg-(--color-success)" />
          Local
        </p>
      </div>
    </aside>
  ),
);

export default WorkspaceSidebar;
