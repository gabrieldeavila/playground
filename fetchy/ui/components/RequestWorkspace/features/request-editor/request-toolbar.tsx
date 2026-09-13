import { memo } from "react";
import { FiUpload } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import type { RequestTab } from "@/types/interface/request.interface";

type RequestToolbarProps = {
  request: RequestTab;
  onUpdate: (update: Partial<RequestTab>) => void;
  onSend: () => void;
};

export const RequestToolbar = memo(function RequestToolbar({
  request,
  onUpdate,
  onSend,
}: RequestToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
      <Select
        aria-label="HTTP method"
        value={request.method}
        onChange={(event) =>
          onUpdate({ method: event.target.value as RequestTab["method"] })
        }
        className="w-full xl:w-32"
      >
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>PATCH</option>
        <option>DELETE</option>
      </Select>
      <div className="grow">
        <Input
          aria-label="Request URL"
          value={request.url}
          onChange={(event) => onUpdate({ url: event.target.value })}
          className="flex-1 font-mono text-xs sm:text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          aria-label="Import cURL"
          leftIcon={<FiUpload aria-hidden="true" />}
          className="flex-1 sm:flex-none"
        >
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button onClick={onSend} className="flex-1 sm:flex-none">
          Send
        </Button>
      </div>
    </div>
  );
});
