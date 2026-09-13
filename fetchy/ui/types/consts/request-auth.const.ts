import type { RequestAuth } from "@/types/interface/request.interface";

export const REQUEST_AUTH_OPTIONS: Array<{
  value: RequestAuth["type"];
  label: string;
}> = [
  { value: "none", label: "No auth" },
  { value: "bearer", label: "Bearer token" },
  { value: "apiKey", label: "API key" },
];
