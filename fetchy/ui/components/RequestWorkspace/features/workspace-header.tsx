import { memo } from "react";
import { FiTerminal } from "react-icons/fi";

const WorkspaceHeader = memo(() => (
  <header className="flex min-h-16 items-center justify-between border-b border-border px-5 lg:px-7">
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/10 text-(--color-primary)">
        <FiTerminal aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-[0.12em]">FETCHY</p>
        <p className="text-[11px] text-text-muted">HTTP workspace</p>
      </div>
    </div>
  </header>
));

export default WorkspaceHeader;
