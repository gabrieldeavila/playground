import { isAxiosError } from "axios";
import { memo, useCallback, useState } from "react";

import { buildRequestCurl } from "@/helpers/request-curl";
import { saveRequestHistory } from "@/helpers/request-db";
import { useSendShortcut } from "@/helpers/use-send-shortcut";
import { StandardModal } from "@/ui/components/primitives/standard-modal";

import "./css/scrollbar.css";

import {
  useRequestWorkspaceBaseContext,
  useRequestWorkspaceServicesContext,
} from "../context/context";
import HistoryPanel from "./history-panel";
import RequestEditor from "./request-editor";
import RequestTabs from "./request-tabs";
import ResponsePanel from "./response-panel";
import WorkspaceFooter from "./workspace-footer";
import WorkspaceHeader from "./workspace-header";
import WorkspaceSidebar from "./workspace-sidebar";

const RequestWorkspaceContent = memo(() => {
  const {
    activeTab,
    requestTabs,
    openRequestTabs,
    workspaceSection,
    setWorkspaceSection,
    openRequest,
    createRequest,
    closeTab,
    deleteRequest,
    renameRequest,
    updateRequest,
    updateActiveRequest,
    addQueryParameter,
    updateQueryParameter,
    removeQueryParameter,
    addHeader,
    updateHeader,
    removeHeader,
  } = useRequestWorkspaceBaseContext();
  const { executeRequest } = useRequestWorkspaceServicesContext();
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSending, setIsSending] = useState(false);
  const [pendingDeleteRequestId, setPendingDeleteRequestId] = useState<
    string | null
  >(null);
  const request = requestTabs.find((item) => item.id === activeTab);
  const pendingDeleteRequest = requestTabs.find(
    (item) => item.id === pendingDeleteRequestId,
  );

  const handleSend = useCallback(async () => {
    if (!request || isSending) return;

    const requestId = request.id;
    const requestSnapshot = request;

    setIsSending(true);
    setRequestErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[requestId];
      return nextErrors;
    });
    updateRequest(requestId, { lastResponse: undefined });

    try {
      const nextResponse = await executeRequest(requestSnapshot);
      updateRequest(requestId, { lastResponse: nextResponse });

      try {
        await saveRequestHistory({
          id: `history-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          curl: buildRequestCurl(requestSnapshot),
          response: nextResponse,
          createdAt: Date.now(),
        });
      } catch (historyError) {
        console.error("Could not persist request history.", historyError);
      }
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ??
          (error.response
            ? `Backend request failed with status ${error.response.status}.`
            : "Could not connect to the backend."))
        : "Could not execute the request.";

      setRequestErrors((currentErrors) => ({
        ...currentErrors,
        [requestId]: message,
      }));
    } finally {
      setIsSending(false);
    }
  }, [executeRequest, isSending, request, updateRequest]);

  useSendShortcut(handleSend);

  const handleConfirmDelete = () => {
    if (!pendingDeleteRequestId) return;

    deleteRequest(pendingDeleteRequestId);
    setPendingDeleteRequestId(null);
  };

  return (
    <>
      <main className="h-dvh min-h-0 overflow-hidden bg-(--color-bg)">
        <div className="pointer-events-none fixed inset-0 opacity-70 [background-image:radial-gradient(circle_at_78%_4%,rgba(94,168,255,0.13),transparent_28%),radial-gradient(circle_at_12%_82%,rgba(126,87,194,0.09),transparent_26%)]" />
        <div className="relative mx-auto flex h-full min-h-0 flex-col border-x border-(--color-border) bg-(--color-bg)/85 backdrop-blur-xl">
          <WorkspaceHeader />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[238px_minmax(0,1fr)]">
            <WorkspaceSidebar
              activeTab={activeTab}
              requestTabs={requestTabs}
              onSelectTab={openRequest}
              onCreateRequest={createRequest}
              onRenameRequest={renameRequest}
              onDeleteRequest={setPendingDeleteRequestId}
              workspaceSection={workspaceSection}
              onWorkspaceSectionChange={setWorkspaceSection}
            />
            <section
              className={
                workspaceSection === "history"
                  ? "flex h-[calc(100dvh-64px)] min-h-0 min-w-0 flex-col"
                  : "flex min-h-0 min-w-0 flex-1 flex-col"
              }
            >
              {workspaceSection === "history" ? (
                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4 sm:p-5 lg:p-7">
                  <HistoryPanel />
                  <WorkspaceFooter />
                </div>
              ) : (
                <>
                  <RequestTabs
                    activeTab={activeTab}
                    requestTabs={openRequestTabs}
                    onSelectTab={openRequest}
                    onCreateRequest={createRequest}
                    onCloseTab={closeTab}
                  />
                  <div className="workspace-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-5 lg:p-7">
                    {request ? (
                      <div className="grid min-h-0 flex-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
                        <RequestEditor
                          key={`request-editor-${request.id}`}
                          request={request}
                          onUpdate={updateActiveRequest}
                          onAddQueryParameter={addQueryParameter}
                          onUpdateQueryParameter={updateQueryParameter}
                          onRemoveQueryParameter={removeQueryParameter}
                          onAddHeader={addHeader}
                          onUpdateHeader={updateHeader}
                          onRemoveHeader={removeHeader}
                          onSend={handleSend}
                          isSending={isSending}
                        />
                        <ResponsePanel
                          key={`response-panel-${request.id}`}
                          response={request.lastResponse ?? null}
                          error={requestErrors[request.id] ?? null}
                          request={request}
                        />
                      </div>
                    ) : (
                      <div className="grid min-h-0 flex-1 place-items-center rounded-lg border border-dashed border-(--color-border) text-sm text-(--color-text-muted)">
                        Select a request from Open requests to open it.
                      </div>
                    )}
                    <WorkspaceFooter />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <StandardModal
        open={pendingDeleteRequestId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteRequestId(null);
        }}
        title="Delete request?"
        onCancel={() => setPendingDeleteRequestId(null)}
        onSave={handleConfirmDelete}
        cancelLabel="Cancel"
        saveLabel="Delete"
        size="sm"
      >
        <p className="text-sm leading-6 text-(--color-text-muted)">
          Are you sure you want to delete the request{" "}
          <strong className="text-(--color-text)">
            {pendingDeleteRequest?.label ?? "selected request"}
          </strong>
          ? This action cannot be undone.
        </p>
      </StandardModal>
    </>
  );
});

export default RequestWorkspaceContent;
