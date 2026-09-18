export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestKeyValue = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type RequestBody = {
  type: "none" | "json" | "text";
  content: string;
};

export type RequestAuth =
  | {
      type: "none";
    }
  | {
      type: "bearer";
      token: string;
    }
  | {
      type: "apiKey";
      key: string;
      value: string;
      placement: "header" | "query";
    };

export type RequestDraft = {
  method: HttpMethod;
  url: string;
  queryParams: RequestKeyValue[];
  headers: RequestKeyValue[];
  body: RequestBody;
  auth: RequestAuth;
};

export type RequestTab = RequestDraft & {
  id: string;
  label: string;
  lastResponse?: ExecuteRequestResponse;
};

export type ExecuteRequestPayload = {
  method: HttpMethod;
  url: string;
  queryParams: Omit<RequestKeyValue, "id" | "enabled">[];
  headers: Omit<RequestKeyValue, "id" | "enabled">[];
  body: RequestBody | null;
  auth: RequestAuth;
};

export type ExecuteRequestResponse = {
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  duration: number;
};

export type RequestWorkspaceBaseContextValue = {
  activeSection: "request" | "response";
  workspaceSection: "requests" | "history";
  activeTab: string;
  requestTabs: RequestTab[];
  openRequestTabs: RequestTab[];
  setActiveSection: (section: "request" | "response") => void;
  setWorkspaceSection: (section: "requests" | "history") => void;
  setActiveTab: (tabId: string) => void;
  openRequest: (requestId: string) => void;
  createRequest: () => void;
  closeTab: (requestId: string) => void;
  deleteRequest: (requestId: string) => void;
  renameRequest: (requestId: string, label: string) => void;
  updateRequest: (requestId: string, update: Partial<RequestTab>) => void;
  updateActiveRequest: (update: Partial<RequestDraft>) => void;
  addQueryParameter: () => void;
  updateQueryParameter: (
    parameterId: string,
    update: Partial<RequestKeyValue>,
  ) => void;
  removeQueryParameter: (parameterId: string) => void;
  addHeader: () => void;
  updateHeader: (headerId: string, update: Partial<RequestKeyValue>) => void;
  removeHeader: (headerId: string) => void;
};

export type RequestWorkspaceServicesContextValue = {
  executeRequest: (request: RequestTab) => Promise<ExecuteRequestResponse>;
};
