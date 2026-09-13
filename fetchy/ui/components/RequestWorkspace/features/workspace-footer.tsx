import { memo } from "react";
import { FiCode, FiCommand } from "react-icons/fi";

const WorkspaceFooter = memo(() => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) pt-4 text-xs text-(--color-text-muted)">
    <span className="flex items-center gap-2">
      <FiCommand aria-hidden="true" />⌘ Enter to send
    </span>
    <span className="flex items-center gap-2">
      <FiCode aria-hidden="true" />
      Variables use{" "}
      <code className="text-(--color-primary)">{"{{variable}"}</code>
    </span>
  </div>
));

export default WorkspaceFooter;
