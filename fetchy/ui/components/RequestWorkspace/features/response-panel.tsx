import { memo } from "react";
import { FiActivity, FiInbox } from "react-icons/fi";

import { Badge } from "@/ui/components/primitives/badge";
import { Card } from "@/ui/components/primitives/card";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Tabs } from "@/ui/components/primitives/tabs";
import type { RequestTab } from "@/types/interface/request.interface";

type ResponsePanelProps = {
  hasResponse: boolean;
  request: RequestTab;
};

const ResponsePanel = memo(({ hasResponse, request }: ResponsePanelProps) => (
  <Card className="min-h-[420px] overflow-hidden border-white/10 bg-(--color-surface)/80">
    <Card.Header className="border-b border-(--color-border) p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
            Response
          </p>
          <Card.Title className="mt-2 text-xl">
            {hasResponse ? "Request completed" : "Ready to send"}
          </Card.Title>
        </div>
        {hasResponse && (
          <Badge variant="success" showIndicator>
            200 OK
          </Badge>
        )}
      </div>
      {hasResponse && (
        <p className="mt-3 flex items-center gap-2 text-xs text-(--color-text-muted)">
          <FiActivity aria-hidden="true" />
          184 ms · 2.4 KB
        </p>
      )}
    </Card.Header>
    {hasResponse ? (
      <Card.Body className="p-0">
        <Tabs defaultValue="Body">
          <Tabs.List className="w-full rounded-none border-0 border-b border-(--color-border) bg-transparent p-2">
            <Tabs.Trigger value="Body">Body</Tabs.Trigger>
            <Tabs.Trigger value="Headers">Headers</Tabs.Trigger>
            <Tabs.Trigger value="Received">Received request</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="Body" className="mt-0 p-4 sm:p-5">
            <ResponseCode value={{ users: [], message: "Response preview" }} />
          </Tabs.Content>
          <Tabs.Content value="Headers" className="mt-0 p-4 sm:p-5">
            <ResponseCode value={{ "content-type": "application/json" }} />
          </Tabs.Content>
          <Tabs.Content value="Received" className="mt-0 p-4 sm:p-5">
            <ResponseCode
              value={{ method: request.method, url: request.url }}
            />
          </Tabs.Content>
        </Tabs>
      </Card.Body>
    ) : (
      <Card.Body className="flex min-h-[300px] items-center p-4 sm:p-5">
        <EmptyState
          icon={<FiInbox />}
          title="No response yet"
          description="Configure the request and press Send to inspect the response here."
          className="border-dashed bg-transparent"
        />
      </Card.Body>
    )}
  </Card>
));

const ResponseCode = memo(({ value }: { value: unknown }) => (
  <pre className="overflow-auto rounded-lg border border-(--color-border) bg-(--color-bg)/70 p-4 text-xs leading-6 text-(--color-text-muted)">
    <code>{JSON.stringify(value, null, 2)}</code>
  </pre>
));

export default ResponsePanel;
