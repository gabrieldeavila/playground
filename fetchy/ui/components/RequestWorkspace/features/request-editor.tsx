import { memo, useState } from "react";

import { Card } from "@/ui/components/primitives/card";
import { Tabs } from "@/ui/components/primitives/tabs";
import type {
  RequestAuth,
  RequestKeyValue,
  RequestTab,
} from "@/types/interface/request.interface";

import { AuthEditor } from "./request-editor/auth-editor";
import { BodyEditor } from "./request-editor/body-editor";
import { KeyValueEditor } from "./request-editor/key-value-editor";
import { RequestToolbar } from "./request-editor/request-toolbar";

type Section = "Query" | "Headers" | "Body" | "Auth";

type RequestEditorProps = {
  request: RequestTab;
  onUpdate: (update: Partial<RequestTab>) => void;
  onAddQueryParameter: () => void;
  onUpdateQueryParameter: (
    rowId: string,
    update: Partial<RequestKeyValue>,
  ) => void;
  onRemoveQueryParameter: (rowId: string) => void;
  onAddHeader: () => void;
  onUpdateHeader: (rowId: string, update: Partial<RequestKeyValue>) => void;
  onRemoveHeader: (rowId: string) => void;
  onSend: () => void;
};

const RequestEditor = memo(function RequestEditor({
  request,
  onUpdate,
  onAddQueryParameter,
  onUpdateQueryParameter,
  onRemoveQueryParameter,
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onSend,
}: RequestEditorProps) {
  const [section, setSection] = useState<Section>("Headers");

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <RequestToolbar request={request} onUpdate={onUpdate} onSend={onSend} />
      <Card className="min-h-[420px] overflow-hidden border-white/10 bg-(--color-surface)/80">
        <Card.Header className="border-b border-(--color-border) p-0">
          <Tabs
            defaultValue="Headers"
            onValueChange={(value) => setSection(value as Section)}
          >
            <Tabs.List className="w-full rounded-none border-0 bg-transparent p-2">
              {(["Query", "Headers", "Body", "Auth"] as Section[]).map(
                (item) => (
                  <Tabs.Trigger key={item} value={item}>
                    {item}
                  </Tabs.Trigger>
                ),
              )}
            </Tabs.List>
          </Tabs>
        </Card.Header>
        <Card.Body className="p-4 sm:p-5">
          {section === "Headers" && (
            <KeyValueEditor
              label="Header"
              rows={request.headers}
              onAdd={onAddHeader}
              onChange={onUpdateHeader}
              onRemove={onRemoveHeader}
            />
          )}
          {section === "Query" && (
            <KeyValueEditor
              label="Parameter"
              rows={request.queryParams}
              onAdd={onAddQueryParameter}
              onChange={onUpdateQueryParameter}
              onRemove={onRemoveQueryParameter}
            />
          )}
          {section === "Body" && (
            <BodyEditor
              body={request.body}
              onChange={(body) => onUpdate({ body })}
            />
          )}
          {section === "Auth" && (
            <AuthEditor
              auth={request.auth}
              onChange={(auth: RequestAuth) => onUpdate({ auth })}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
});

export default RequestEditor;
