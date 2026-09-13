import { type ReactNode, useCallback, useMemo, useState } from "react";

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

const initialRequestTabs: RequestTab[] = [
  {
    id: "users",
    label: "List users",
    method: "GET",
    url: "https://api.example.com/users",
    queryParams: [],
    headers: [createRow("Accept", "application/json")],
    body: { type: "none", content: "" },
    auth: { type: "none" },
  },
  {
    id: "create-user",
    label: "Create user",
    method: "POST",
    url: "https://api.example.com/users",
    queryParams: [],
    headers: [createRow("Content-Type", "application/json")],
    body: { type: "json", content: '{\n  "name": "Gabriel"\n}' },
    auth: { type: "none" },
  },
];

export function RequestWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<"request" | "response">(
    "request",
  );
  const [activeTab, setActiveTab] = useState(initialRequestTabs[0].id);
  const [requestTabs, setRequestTabs] = useState(initialRequestTabs);

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
      removeRow,
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
