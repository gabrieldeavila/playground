import { memo } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import type { RequestKeyValue } from "@/types/interface/request.interface";

type KeyValueEditorProps = {
  label: string;
  rows: RequestKeyValue[];
  onAdd: () => void;
  onChange: (rowId: string, update: Partial<RequestKeyValue>) => void;
  onRemove: (rowId: string) => void;
};

export const KeyValueEditor = memo(function KeyValueEditor({
  label,
  rows,
  onAdd,
  onChange,
  onRemove,
}: KeyValueEditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-2 text-[11px] uppercase tracking-[0.14em] text-(--color-text-muted)">
        <span>Key</span>
        <span>Value</span>
        <span className="sr-only">Actions</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] items-center gap-2"
        >
          <Input
            aria-label={`${label} key`}
            value={row.key}
            onChange={(event) => onChange(row.id, { key: event.target.value })}
            placeholder="Key"
            className="min-h-10 font-mono text-xs"
          />
          <Input
            aria-label={`${label} value`}
            value={row.value}
            onChange={(event) =>
              onChange(row.id, { value: event.target.value })
            }
            placeholder="Value"
            className="min-h-10 font-mono text-xs"
          />
          <button
            type="button"
            aria-label={`Remover ${label.toLowerCase()}`}
            onClick={() => onRemove(row.id)}
            className="grid size-10 place-items-center rounded-lg text-(--color-text-muted) hover:text-(--color-danger)"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<FiPlus aria-hidden="true" />}
        onClick={onAdd}
      >
        Add {label.toLowerCase()}
      </Button>
    </div>
  );
});
