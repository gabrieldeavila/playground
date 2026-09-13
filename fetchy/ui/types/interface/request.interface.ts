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
};

export type RequestWorkspaceBaseContextValue = {
  activeSection: "request" | "response";
  activeTab: string;
  requestTabs: RequestTab[];
  setActiveSection: (section: "request" | "response") => void;
  setActiveTab: (tabId: string) => void;
  createRequest: () => void;
  closeRequest: (requestId: string) => void;
  renameRequest: (requestId: string, label: string) => void;
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
  mockSendRequest: () => void;
};
