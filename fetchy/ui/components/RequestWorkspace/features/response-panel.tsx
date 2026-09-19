import { memo } from "react";
import { FiActivity, FiInbox } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Badge } from "@/ui/components/primitives/badge";
import { Card } from "@/ui/components/primitives/card";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Tabs } from "@/ui/components/primitives/tabs";
import type {
  ExecuteRequestResponse,
  RequestTab,
} from "@/types/interface/request.interface";

import { JsonCodeEditor } from "./request-editor/body-editor";

type ResponsePanelProps = {
  request: RequestTab;
  response: ExecuteRequestResponse | null;
  error: string | null;
};

const ResponsePanel = memo(
  ({ request, response, error }: ResponsePanelProps) => {
    const hasResponse = response !== null;
    const isExternalError = hasResponse && response.status >= 400;

    return (
      <Card className="flex h-full min-h-0 flex-col overflow-hidden border-white/10 bg-(--color-surface)/80 pb-8">
        <Card.Header className="border-b border-(--color-border) p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
                Response
              </p>
              <Card.Title className="mt-2 text-xl">
                {error
                  ? "Request failed"
                  : hasResponse
                    ? "Request completed"
                    : "Ready to send"}
              </Card.Title>
            </div>
            {hasResponse && (
              <Badge
                variant={isExternalError ? "danger" : "success"}
                showIndicator
              >
                {response.status} {response.statusText}
              </Badge>
            )}
          </div>
          {hasResponse && (
            <p className="mt-3 flex items-center gap-2 text-xs text-(--color-text-muted)">
              <FiActivity aria-hidden="true" />
              {response.duration} ms
            </p>
          )}
        </Card.Header>
        {error ? (
          <Card.Body className="min-h-0 flex-1 p-4 sm:p-5">
            <Alert variant="danger">{error}</Alert>
          </Card.Body>
        ) : hasResponse ? (
          <Card.Body className="min-h-0 flex-1 overflow-hidden p-0 pb-8">
            <Tabs defaultValue="Body" className="flex h-full min-h-0 flex-col">
              <Tabs.List className="w-full shrink-0 rounded-none border-0 border-b border-(--color-border) bg-transparent p-2">
                <Tabs.Trigger value="Body">Body</Tabs.Trigger>
                <Tabs.Trigger value="Headers">Headers</Tabs.Trigger>
                <Tabs.Trigger value="Received">Received request</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content
                value="Body"
                className="mt-0 flex min-h-0 flex-1 flex-col p-4 sm:p-5"
              >
                <ResponseCode value={response.responseBody} fillHeight />
              </Tabs.Content>
              <Tabs.Content
                value="Headers"
                className="mt-0 flex min-h-0 flex-1 flex-col p-4 sm:p-5"
              >
                <ResponseCode value={response.responseHeaders} fillHeight />
              </Tabs.Content>
              <Tabs.Content
                value="Received"
                className="mt-0 flex min-h-0 flex-1 flex-col p-4 sm:p-5"
              >
                <ResponseCode
                  value={{ method: request.method, url: request.url }}
                  fillHeight
                />
              </Tabs.Content>
            </Tabs>
          </Card.Body>
        ) : (
          <Card.Body className="flex min-h-0 flex-1 items-center p-4 sm:p-5">
            <EmptyState
              icon={<FiInbox />}
              title="No response yet"
              description="Configure the request and press Send to inspect the response here."
              className="border-dashed bg-transparent"
            />
          </Card.Body>
        )}
      </Card>
    );
  },
);

const ResponseCode = memo(
  ({ value, fillHeight = false }: { value: unknown; fillHeight?: boolean }) => {
    const content = formatCodeValue(value);

    return (
      <JsonCodeEditor
        ariaLabel="Response code"
        value={content}
        readOnly
        height={fillHeight ? "100%" : "320px"}
        className={fillHeight ? "flex min-h-0 flex-1" : undefined}
      />
    );
  },
);

const formatCodeValue = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2) ?? "null";
};

export default ResponsePanel;
