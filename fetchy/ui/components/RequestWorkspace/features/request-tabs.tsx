import { memo } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import type { RequestTab } from "@/types/interface/request.interface";

type RequestTabsProps = {
  activeTab: string;
  requestTabs: RequestTab[];
  onSelectTab: (tabId: string) => void;
};

const RequestTabs = memo(
  ({ activeTab, requestTabs, onSelectTab }: RequestTabsProps) => (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-(--color-border) px-3 pt-3 lg:px-5">
      {requestTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelectTab(tab.id)}
          className="group flex min-w-36 items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2.5 text-xs"
          data-active={tab.id === activeTab}
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
          <span className="flex-1 truncate text-left text-(--color-text-muted)">
            {tab.label}
          </span>
          <FiX
            aria-hidden="true"
            className="opacity-0 group-hover:opacity-100"
          />
        </button>
      ))}
      <button
        type="button"
        aria-label="Abrir nova aba"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-(--color-text-muted) hover:bg-white/5"
      >
        <FiPlus aria-hidden="true" />
      </button>
    </div>
  ),
);

export default RequestTabs;
