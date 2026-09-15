import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createNewRequest, useRequestTabs } from "@/helpers/use-request-tabs";
import { requestDb } from "@/helpers/request-db";
import type {
  RequestDraft,
  RequestKeyValue,
  RequestWorkspaceBaseContextValue,
} from "@/types/interface/requestworkspace-context.interface";
import { RequestWorkspaceBaseContext } from "./context";

const createRow = (key = "", value = ""): RequestKeyValue => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  key,
  value,
  enabled: true,
});

export function RequestWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<"request" | "response">(
    "request",
  );
  const [activeTab, setActiveTab] = useState("");
  const { requestTabs, setRequestTabs, hasLoadedRequests } = useRequestTabs();

  useEffect(() => {
    if (!hasLoadedRequests || requestTabs.length === 0) return;

    setActiveTab((currentActiveTab) => currentActiveTab || requestTabs[0].id);
    void requestDb.requests.bulkPut(requestTabs);
  }, [hasLoadedRequests, requestTabs]);

  const createRequest = useCallback(() => {
    const newRequest = createNewRequest();

    setRequestTabs((tabs) => [...tabs, newRequest]);
    setActiveTab(newRequest.id);
  }, []);

  const closeRequest = useCallback(
    (requestId: string) => {
      setRequestTabs((tabs) => {
        const requestIndex = tabs.findIndex((tab) => tab.id === requestId);
        if (requestIndex === -1) return tabs;

        const remainingTabs = tabs.filter((tab) => tab.id !== requestId);
        void requestDb.requests.delete(requestId);

        if (remainingTabs.length === 0) {
          const replacementRequest = createNewRequest();
          void requestDb.requests.put(replacementRequest);
          setActiveTab(replacementRequest.id);
          return [replacementRequest];
        }

        if (requestId === activeTab) {
          const nextTab =
            remainingTabs[requestIndex] ?? remainingTabs[requestIndex - 1];
          setActiveTab(nextTab.id);
        }

        return remainingTabs;
      });
    },
    [activeTab],
  );

  const renameRequest = useCallback((requestId: string, label: string) => {
    const nextLabel = label.trim() || "New Request";

    setRequestTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === requestId ? { ...tab, label: nextLabel } : tab,
      ),
    );
  }, []);

  const updateActiveRequest = useCallback(
    (update: Partial<RequestDraft>) => {
      setRequestTabs((tabs) =>
        tabs.map((tab) => (tab.id === activeTab ? { ...tab, ...update } : tab)),
      );
    },
    [activeTab],
  );

  const updateRows = useCallback(
    (
      field: "queryParams" | "headers",
      rowId: string,
      update: Partial<RequestKeyValue>,
    ) => {
      const activeRequest = requestTabs.find((tab) => tab.id === activeTab);
      if (!activeRequest) return;

      updateActiveRequest({
        [field]: activeRequest[field].map((row) =>
          row.id === rowId ? { ...row, ...update } : row,
        ),
      });
    },
    [activeTab, requestTabs, updateActiveRequest],
  );

  const addRow = useCallback(
    (field: "queryParams" | "headers") => {
      const activeRequest = requestTabs.find((tab) => tab.id === activeTab);
      if (!activeRequest) return;

      updateActiveRequest({
        [field]: [...activeRequest[field], createRow()],
      });
    },
    [activeTab, requestTabs, updateActiveRequest],
  );

  const removeRow = useCallback(
    (field: "queryParams" | "headers", rowId: string) => {
      const activeRequest = requestTabs.find((tab) => tab.id === activeTab);
      if (!activeRequest) return;

      updateActiveRequest({
        [field]: activeRequest[field].filter((row) => row.id !== rowId),
      });
    },
    [activeTab, requestTabs, updateActiveRequest],
  );

  const value = useMemo<RequestWorkspaceBaseContextValue>(
    () => ({
      activeSection,
      activeTab,
      requestTabs,
      setActiveSection,
      setActiveTab,
      createRequest,
      closeRequest,
      renameRequest,
      updateActiveRequest,
      addQueryParameter: () => addRow("queryParams"),
      updateQueryParameter: (id, update) =>
        updateRows("queryParams", id, update),
      removeQueryParameter: (id) => removeRow("queryParams", id),
      addHeader: () => addRow("headers"),
      updateHeader: (id, update) => updateRows("headers", id, update),
      removeHeader: (id) => removeRow("headers", id),
    }),
    [
      activeSection,
      activeTab,
      addRow,
      closeRequest,
      createRequest,
      removeRow,
      renameRequest,
      requestTabs,
      updateActiveRequest,
      updateRows,
    ],
  );

  return (
    <RequestWorkspaceBaseContext value={value}>
      {children}
    </RequestWorkspaceBaseContext>
  );
}
