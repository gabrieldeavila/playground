import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createNewRequest, useRequestTabs } from "@/helpers/use-request-tabs";
import { requestDb } from "@/helpers/request-db";
import { ACTIVE_REQUEST_TAB_STORAGE_KEY } from "@/types/consts/request-workspace.const";
import type {
  RequestDraft,
  RequestKeyValue,
  RequestTab,
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
  const [workspaceSection, setWorkspaceSection] = useState<
    "requests" | "history"
  >("requests");
  const [openRequestIds, setOpenRequestIds] = useState<string[]>([]);
  const { requestTabs, setRequestTabs, hasLoadedRequests } = useRequestTabs();

  useEffect(() => {
    if (!hasLoadedRequests || requestTabs.length === 0) return;

    setOpenRequestIds((currentIds) =>
      currentIds.length > 0
        ? currentIds.filter((id) => requestTabs.some((tab) => tab.id === id))
        : requestTabs.map((tab) => tab.id),
    );
    setActiveTab((currentActiveTab) => {
      if (
        currentActiveTab &&
        requestTabs.some((tab) => tab.id === currentActiveTab)
      ) {
        return currentActiveTab;
      }

      const savedActiveTab = window.localStorage.getItem(
        ACTIVE_REQUEST_TAB_STORAGE_KEY,
      );
      return requestTabs.some((tab) => tab.id === savedActiveTab)
        ? (savedActiveTab ?? requestTabs[0].id)
        : requestTabs[0].id;
    });
    void requestDb.requests.bulkPut(requestTabs);
  }, [hasLoadedRequests, requestTabs]);

  useEffect(() => {
    if (!hasLoadedRequests || !activeTab) return;

    window.localStorage.setItem(ACTIVE_REQUEST_TAB_STORAGE_KEY, activeTab);
  }, [activeTab, hasLoadedRequests]);

  const openRequest = useCallback((requestId: string) => {
    setOpenRequestIds((ids) =>
      ids.includes(requestId) ? ids : [...ids, requestId],
    );
    setActiveTab(requestId);
    setWorkspaceSection("requests");
  }, []);

  const createRequest = useCallback(() => {
    const newRequest = createNewRequest();

    setRequestTabs((tabs) => [...tabs, newRequest]);
    setOpenRequestIds((ids) => [...ids, newRequest.id]);
    setActiveTab(newRequest.id);
  }, []);

  const closeTab = useCallback(
    (requestId: string) => {
      setOpenRequestIds((ids) => {
        const nextIds = ids.filter((id) => id !== requestId);

        if (requestId === activeTab) {
          const closedIndex = ids.indexOf(requestId);
          const nextActiveId =
            nextIds[closedIndex] ?? nextIds[closedIndex - 1] ?? "";
          setActiveTab(nextActiveId);
        }

        return nextIds;
      });
    },
    [activeTab],
  );

  const deleteRequest = useCallback(
    (requestId: string) => {
      setRequestTabs((tabs) => tabs.filter((tab) => tab.id !== requestId));
      setOpenRequestIds((ids) => {
        const requestIndex = ids.indexOf(requestId);
        const nextIds = ids.filter((id) => id !== requestId);

        if (requestId === activeTab) {
          const nextActiveId =
            nextIds[requestIndex] ?? nextIds[requestIndex - 1] ?? "";
          setActiveTab(nextActiveId);
        }

        return nextIds;
      });
      void requestDb.requests.delete(requestId);
    },
    [activeTab, setRequestTabs],
  );

  const renameRequest = useCallback((requestId: string, label: string) => {
    const nextLabel = label.trim() || "New Request";

    setRequestTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === requestId ? { ...tab, label: nextLabel } : tab,
      ),
    );
  }, []);

  const updateRequest = useCallback(
    (requestId: string, update: Partial<RequestTab>) => {
      setRequestTabs((tabs) =>
        tabs.map((tab) => (tab.id === requestId ? { ...tab, ...update } : tab)),
      );
    },
    [],
  );

  const updateActiveRequest = useCallback(
    (update: Partial<RequestDraft>) => {
      updateRequest(activeTab, update);
    },
    [activeTab, updateRequest],
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

  const openRequestTabs = useMemo(
    () =>
      openRequestIds
        .map((id) => requestTabs.find((tab) => tab.id === id))
        .filter((tab): tab is (typeof requestTabs)[number] => Boolean(tab)),
    [openRequestIds, requestTabs],
  );

  const value = useMemo<RequestWorkspaceBaseContextValue>(
    () => ({
      activeSection,
      activeTab,
      requestTabs,
      openRequestTabs,
      workspaceSection,
      setActiveSection,
      setActiveTab,
      setWorkspaceSection,
      openRequest,
      createRequest,
      closeTab,
      deleteRequest,
      renameRequest,
      updateRequest,
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
      closeTab,
      createRequest,
      deleteRequest,
      openRequest,
      openRequestTabs,
      removeRow,
      renameRequest,
      requestTabs,
      setWorkspaceSection,
      updateActiveRequest,
      updateRequest,
      updateRows,
      workspaceSection,
    ],
  );

  return (
    <RequestWorkspaceBaseContext value={value}>
      {children}
    </RequestWorkspaceBaseContext>
  );
}
