import { memo } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import type { RequestTab } from "@/types/interface/request.interface";
import { IconButton } from "@/ui/components/primitives/icon-button";

type RequestTabsProps = {
  activeTab: string;
  requestTabs: RequestTab[];
  onSelectTab: (tabId: string) => void;
  onCreateRequest: () => void;
  onCloseRequest: (requestId: string) => void;
};

const RequestTabs = memo(
  ({
    activeTab,
    requestTabs,
    onSelectTab,
    onCreateRequest,
    onCloseRequest,
  }: RequestTabsProps) => (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-(--color-border) px-3 pt-3 lg:px-5">
      {requestTabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          tabIndex={tab.id === activeTab ? 0 : -1}
          onClick={() => onSelectTab(tab.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectTab(tab.id);
            }
          }}
          className="group flex min-w-36 cursor-pointer items-center gap-2 rounded-t-lg border border-b-0 border-(--color-border) px-3 py-2.5 text-xs data-[active=true]:bg-(--color-surface) data-[active=true]:text-(--color-text) data-[active=true]:shadow-[inset_0_-2px_0_var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--color-primary)"
          data-active={tab.id === activeTab}
        >
          <span
            className={
              tab.method === "GET"
                ? "shrink-0 text-(--color-success)"
                : "shrink-0 text-(--color-warning)"
            }
          >
            {tab.method}
          </span>
          <span className="min-w-0 flex-1 truncate text-(--color-text-muted)">
            {tab.label}
          </span>
          <IconButton
            label={`Delete ${tab.label}`}
            icon={<FiX />}
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onCloseRequest(tab.id);
            }}
            className="size-6 rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 w-2.5 h-2.5"
          />
        </div>
      ))}
      <button
        type="button"
        aria-label="Create new request"
        onClick={onCreateRequest}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-(--color-text-muted) hover:bg-white/5"
      >
        <FiPlus aria-hidden="true" />
      </button>
    </div>
  ),
);

export default RequestTabs;
