import { memo, useState } from "react";

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
    updateActiveRequest,
    addQueryParameter,
    updateQueryParameter,
    removeQueryParameter,
    addHeader,
    updateHeader,
    removeHeader,
  } = useRequestWorkspaceBaseContext();
  const { mockSendRequest } = useRequestWorkspaceServicesContext();
  const [hasResponse, setHasResponse] = useState(false);
  const request = requestTabs.find((item) => item.id === activeTab);

  if (!request) return null;

  const handleSend = () => {
    mockSendRequest();
    setHasResponse(true);
  };

  return (
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
          />
          <section className="flex min-w-0 flex-col">
            <RequestTabs
              activeTab={activeTab}
              requestTabs={requestTabs}
              onSelectTab={setActiveTab}
              onCreateRequest={createRequest}
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
                />
                <ResponsePanel hasResponse={hasResponse} request={request} />
              </div>
              <WorkspaceFooter />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
});

export default RequestWorkspaceContent;
