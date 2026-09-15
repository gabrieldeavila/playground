import axios from "axios";
import { type ReactNode, useCallback, useMemo } from "react";

import type {
  ExecuteRequestPayload,
  ExecuteRequestResponse,
  RequestTab,
} from "@/types/interface/request.interface";
import type { RequestWorkspaceServicesContextValue } from "@/types/interface/requestworkspace-context.interface";

import { RequestWorkspaceServicesContext } from "./context";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const buildPayload = (request: RequestTab): ExecuteRequestPayload => ({
  method: request.method,
  url: request.url,
  queryParams: request.queryParams
    .filter((item) => item.enabled)
    .map(({ id: _id, enabled: _enabled, ...item }) => item),
  headers: request.headers
    .filter((item) => item.enabled)
    .map(({ id: _id, enabled: _enabled, ...item }) => item),
  body: request.body.type === "none" ? null : request.body,
  auth: request.auth,
});

export function RequestWorkspaceServicesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const executeRequest = useCallback(async (request: RequestTab) => {
    const payload = buildPayload(request);

    try {
      const response = await api.post<
        { data?: ExecuteRequestResponse } | ExecuteRequestResponse
      >("/api/requests/execute", payload);

      return (
        response.data && "data" in response.data
          ? response.data.data
          : response.data
      ) as ExecuteRequestResponse;
    } catch (error) {
      throw error;
    }
  }, []);

  const value = useMemo<RequestWorkspaceServicesContextValue>(
    () => ({ executeRequest }),
    [executeRequest],
  );

  return (
    <RequestWorkspaceServicesContext value={value}>
      {children}
    </RequestWorkspaceServicesContext>
  );
}
