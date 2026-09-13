import { memo } from "react";
import { FiSettings, FiTerminal } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Select } from "@/ui/components/primitives/select";

const WorkspaceHeader = memo(() => (
  <header className="flex min-h-16 items-center justify-between border-b border-(--color-border) px-5 lg:px-7">
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/10 text-(--color-primary)">
        <FiTerminal aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-[0.12em]">FETCHY</p>
        <p className="text-[11px] text-(--color-text-muted)">HTTP workspace</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Select
        aria-label="Ambiente ativo"
        defaultValue="local"
        className="min-h-9 w-auto border-white/10 bg-white/5 px-3 py-1.5 text-xs"
      >
        <option value="local">Local</option>
        <option value="staging">Staging</option>
      </Select>
      <Button
        aria-label="Abrir configurações"
        variant="ghost"
        size="sm"
        leftIcon={<FiSettings aria-hidden="true" />}
        className="px-3"
      >
        <span className="hidden sm:inline">Settings</span>
      </Button>
    </div>
  </header>
));

export default WorkspaceHeader;
