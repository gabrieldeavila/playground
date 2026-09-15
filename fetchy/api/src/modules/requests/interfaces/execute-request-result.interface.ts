export interface ExecuteRequestResult {
  status: number;
  statusText: string;
  responseHeaders: Array<{
    key: string;
    value: string;
  }>;
  responseBody: unknown;
  duration: number;
}
