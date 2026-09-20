import { memo } from "react";
import { FiEye, FiEyeOff, FiPlus, FiX } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { IconButton } from "@/ui/components/primitives/icon-button";
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
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto_auto] gap-2 text-[11px] uppercase tracking-[0.14em] text-text-muted">
        <span>Key</span>
        <span>Value</span>
        <span className="sr-only">Toggle visibility</span>
        <span className="sr-only">Actions</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className={`grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto_auto] items-center gap-2 transition-opacity ${row.enabled ? "" : "opacity-45"}`}
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
          <IconButton
            label={`${row.enabled ? "Disable" : "Enable"} ${label.toLowerCase()}`}
            icon={
              row.enabled ? (
                <FiEye aria-hidden="true" />
              ) : (
                <FiEyeOff aria-hidden="true" />
              )
            }
            size="sm"
            variant="ghost"
            aria-pressed={row.enabled}
            onClick={() => onChange(row.id, { enabled: !row.enabled })}
            className="size-8 rounded-md text-text-muted hover:text-(--color-primary)"
          />
          <IconButton
            label={`Remove ${label.toLowerCase()}`}
            icon={<FiX aria-hidden="true" />}
            size="sm"
            variant="ghost"
            onClick={() => onRemove(row.id)}
            className="size-8 rounded-md text-text-muted hover:text-danger"
          />
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
