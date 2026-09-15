import { isAxiosError } from "axios";
import { memo, useState } from "react";

import type { ExecuteRequestResponse } from "@/types/interface/request.interface";
import { StandardModal } from "@/ui/components/primitives/standard-modal";

import {
  useRequestWorkspaceBaseContext,
  useRequestWorkspaceServicesContext,
} from "../context/context";
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
    setActiveTab,
    createRequest,
    closeRequest,
    renameRequest,
    updateActiveRequest,
    addQueryParameter,
    updateQueryParameter,
    removeQueryParameter,
    addHeader,
    updateHeader,
    removeHeader,
  } = useRequestWorkspaceBaseContext();
  const { executeRequest } = useRequestWorkspaceServicesContext();
  const [response, setResponse] = useState<ExecuteRequestResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingCloseRequestId, setPendingCloseRequestId] = useState<
    string | null
  >(null);
  const request = requestTabs.find((item) => item.id === activeTab);
  const pendingCloseRequest = requestTabs.find(
    (item) => item.id === pendingCloseRequestId,
  );

  if (!request) return null;

  const handleSend = async () => {
    setIsSending(true);
    setRequestError(null);
    setResponse(null);

    try {
      const nextResponse = await executeRequest(request);
      setResponse(nextResponse);
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        const message = error.response?.data?.message;
        setRequestError(
          message ??
            (error.response
              ? `Backend request failed with status ${error.response.status}.`
              : "Could not connect to the backend."),
        );
      } else {
        setRequestError("Could not execute the request.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmClose = () => {
    if (!pendingCloseRequestId) return;

    closeRequest(pendingCloseRequestId);
    setPendingCloseRequestId(null);
  };

  return (
    <>
      <main className="min-h-dvh overflow-hidden -bg`">
        <div className="pointer-events-none fixed inset-0 opacity-70 [background-image:radial-gradient(circle_at_78%_4%,rgba(94,168,255,0.13),transparent_28%),radial-gradient(circle_at_12%_82%,rgba(126,87,194,0.09),transparent_26%)]" />
        <div className="relative mx-auto flex min-h-dvh flex-col border-x border-(--color-border) bg-(--color-bg)/85 backdrop-blur-xl">
          <WorkspaceHeader />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[238px_minmax(0,1fr)]">
            <WorkspaceSidebar
              activeTab={activeTab}
              requestTabs={requestTabs}
              onSelectTab={setActiveTab}
              onCreateRequest={createRequest}
              onRenameRequest={renameRequest}
            />
            <section className="flex min-w-0 flex-col">
              <RequestTabs
                activeTab={activeTab}
                requestTabs={requestTabs}
                onSelectTab={setActiveTab}
                onCreateRequest={createRequest}
                onCloseRequest={setPendingCloseRequestId}
              />
              <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5 lg:p-7">
                <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
                  <RequestEditor
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
                    response={response}
                    error={requestError}
                    request={request}
                  />
                </div>
                <WorkspaceFooter />
              </div>
            </section>
          </div>
        </div>
      </main>
      <StandardModal
        open={pendingCloseRequestId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCloseRequestId(null);
        }}
        title="Delete request?"
        onCancel={() => setPendingCloseRequestId(null)}
        onSave={handleConfirmClose}
        cancelLabel="Cancel"
        saveLabel="Delete"
        size="sm"
      >
        <p className="text-sm leading-6 text-(--color-text-muted)">
          Are you sure you want to delete the request{" "}
          <strong className="text-(--color-text)">
            {pendingCloseRequest?.label ?? "selected request"}
          </strong>
          ? This action cannot be undone.
        </p>
      </StandardModal>
    </>
  );
});

export default RequestWorkspaceContent;
