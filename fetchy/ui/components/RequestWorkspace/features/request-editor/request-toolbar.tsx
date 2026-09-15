import { memo, type ClipboardEvent } from "react";

import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import { parseCurl } from "@/helpers/parse-curl";
import type { RequestTab } from "@/types/interface/request.interface";

type RequestToolbarProps = {
  request: RequestTab;
  onUpdate: (update: Partial<RequestTab>) => void;
  onSend: () => void;
  isSending: boolean;
};

export const RequestToolbar = memo(function RequestToolbar({
  request,
  onUpdate,
  onSend,
  isSending,
}: RequestToolbarProps) {
  const handleUrlPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text").trim();
    const importedRequest = parseCurl(pastedText);

    if (!importedRequest) return;

    event.preventDefault();
    onUpdate({
      method: importedRequest.method,
      url: importedRequest.url,
      headers: importedRequest.headers,
      body: importedRequest.body,
    });
  };

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
          onPaste={handleUrlPaste}
          className="flex-1 font-mono text-xs sm:text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSend}
          isLoading={isSending}
          disabled={isSending}
          className="flex-1 sm:flex-none"
        >
          Send
        </Button>
      </div>
    </div>
  );
});
