import { memo } from "react";

import { Select } from "@/ui/components/primitives/select";
import { Textarea } from "@/ui/components/primitives/textarea";
import type { RequestBody } from "@/types/interface/request.interface";

type BodyEditorProps = {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
};

export const BodyEditor = memo(function BodyEditor({
  body,
  onChange,
}: BodyEditorProps) {
  return (
    <div className="space-y-3">
      <Select
        aria-label="Tipo do body"
        value={body.type}
        onChange={(event) =>
          onChange({
            ...body,
            type: event.target.value as RequestBody["type"],
          })
        }
      >
        <option value="none">No body</option>
        <option value="json">JSON</option>
        <option value="text">Text</option>
      </Select>
      {body.type !== "none" && (
        <Textarea
          aria-label="Request body"
          value={body.content}
          onChange={(event) =>
            onChange({ ...body, content: event.target.value })
          }
          className="min-h-64 resize-none font-mono text-xs leading-6"
        />
      )}
    </div>
  );
});
