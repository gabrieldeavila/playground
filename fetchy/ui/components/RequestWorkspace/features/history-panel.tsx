import { memo, useEffect, useState } from "react";
import { FiCheck, FiClock, FiCopy, FiInbox } from "react-icons/fi";

import { requestDb } from "@/helpers/request-db";
import type { RequestHistoryEntry } from "@/types/interface/request-history.interface";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { EmptyState } from "@/ui/components/primitives/empty-state";

const HistoryPanel = memo(function HistoryPanel() {
  const [entries, setEntries] = useState<RequestHistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const history = await requestDb.history
        .orderBy("createdAt")
        .reverse()
        .toArray();
      if (mounted) setEntries(history);
    };

    void loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = async (entry: RequestHistoryEntry) => {
    await navigator.clipboard.writeText(entry.curl);
    setCopiedId(entry.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/10 bg-surface/80 pb-8">
      <Card.Header className="border-b border-border p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          <FiClock aria-hidden="true" /> Request history
        </p>
        <Card.Title className="mt-2 text-xl">Last 15 requests</Card.Title>
        <p className="mt-2 text-sm text-text-muted">
          Successful backend executions are stored as cURL and response data.
        </p>
      </Card.Header>
      <Card.Body className="workspace-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-8 sm:p-5 sm:pb-8">
        {entries.length === 0 ? (
          <EmptyState
            icon={<FiInbox />}
            title="No request history"
            description="Successful requests will appear here after you press Send."
            className="border-dashed bg-transparent"
          />
        ) : (
          entries.map((entry) => (
            <article
              className="rounded-xl border border-border bg-bg/50 p-4"
              key={entry.id}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">
                  {new Date(entry.createdAt).toLocaleString()} ·{" "}
                  {entry.response.status} {entry.response.statusText}
                </p>
                <Button
                  aria-label="Copy cURL command"
                  leftIcon={
                    copiedId === entry.id ? (
                      <FiCheck aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )
                  }
                  onClick={() => void handleCopy(entry)}
                  size="sm"
                  variant="ghost"
                >
                  {copiedId === entry.id ? "Copied" : "Copy cURL"}
                </Button>
              </div>
              <pre className="overflow-auto rounded-lg border border-border bg-bg/70 p-3 text-xs leading-6 text-text-muted">
                <code>{entry.curl}</code>
              </pre>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-(--color-primary)">
                  View response
                </summary>
                <pre className="mt-3 overflow-auto rounded-lg border border-border bg-bg/70 p-3 text-xs leading-6 text-text-muted">
                  <code>{JSON.stringify(entry.response, null, 2)}</code>
                </pre>
              </details>
            </article>
          ))
        )}
      </Card.Body>
    </Card>
  );
});

export default HistoryPanel;
