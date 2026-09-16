import type { ExecuteRequestResponse } from "./request.interface";

export type RequestHistoryEntry = {
  id: string;
  curl: string;
  response: ExecuteRequestResponse;
  createdAt: number;
};
