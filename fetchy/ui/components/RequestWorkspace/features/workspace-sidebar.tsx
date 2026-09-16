import { memo, useState } from "react";
import { FiClock, FiDatabase, FiLayers, FiPlus } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import type { RequestTab } from "@/types/interface/request.interface";

type WorkspaceSidebarProps = {
  activeTab: string;
  requestTabs: RequestTab[];
  onSelectTab: (tabId: string) => void;
  onCreateRequest: () => void;
  onRenameRequest: (requestId: string, label: string) => void;
  workspaceSection: "requests" | "history";
  onWorkspaceSectionChange: (section: "requests" | "history") => void;
};

const WorkspaceSidebar = memo(
  ({
    activeTab,
    requestTabs,
    onSelectTab,
    onCreateRequest,
    onRenameRequest,
    workspaceSection,
    onWorkspaceSectionChange,
  }: WorkspaceSidebarProps) => {
    const [editingRequestId, setEditingRequestId] = useState<string | null>(
      null,
    );
    const [editingLabel, setEditingLabel] = useState("");

    const startEditing = (tab: RequestTab) => {
      setEditingRequestId(tab.id);
      setEditingLabel(tab.label);
    };

    const cancelEditing = () => {
      setEditingRequestId(null);
      setEditingLabel("");
    };

    const saveEditing = () => {
      if (!editingRequestId) return;

      onRenameRequest(editingRequestId, editingLabel);
      cancelEditing();
    };

    return (
      <aside className="hidden border-r border-(--color-border) bg-(--color-surface)/35 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
            Workspace
          </p>
          <Button
            aria-label="Create new request"
            onClick={onCreateRequest}
            variant="ghost"
            size="sm"
            className="min-h-8 px-2"
            leftIcon={<FiPlus aria-hidden="true" />}
          />
        </div>
        <nav className="space-y-1 px-3" aria-label="Workspace navigation">
          <button
            aria-current={workspaceSection === "requests" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${workspaceSection === "requests" ? "bg-(--color-primary)/10 text-(--color-primary)" : "text-(--color-text-muted) hover:bg-white/5"}`}
            onClick={() => onWorkspaceSectionChange("requests")}
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
            aria-current={workspaceSection === "history" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${workspaceSection === "history" ? "bg-(--color-primary)/10 font-medium text-(--color-primary)" : "text-(--color-text-muted) hover:bg-white/5"}`}
            onClick={() => onWorkspaceSectionChange("history")}
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
            {requestTabs.map((tab) => {
              const isEditing = editingRequestId === tab.id;

              return isEditing ? (
                <Input
                  autoFocus
                  aria-label={`Rename ${tab.label}`}
                  value={editingLabel}
                  onChange={(event) => setEditingLabel(event.target.value)}
                  onBlur={saveEditing}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEditing();
                    if (event.key === "Escape") cancelEditing();
                  }}
                  className="h-8 px-2 text-xs"
                />
              ) : (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  onDoubleClick={() => startEditing(tab)}
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
              );
            })}
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
    );
  },
);

export default WorkspaceSidebar;
