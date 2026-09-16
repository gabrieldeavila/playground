import type { RequestTab } from "@/types/interface/request.interface";

const quoteShell = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

export const buildRequestCurl = (request: RequestTab): string => {
  const query = request.queryParams
    .filter((item) => item.enabled && item.key.trim())
    .map(
      (item) =>
        `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`,
    )
    .join("&");
  const url = query
    ? `${request.url}${request.url.includes("?") ? "&" : "?"}${query}`
    : request.url;
  const lines = [`curl --request ${request.method} ${quoteShell(url)}`];

  request.headers
    .filter((item) => item.enabled && item.key.trim())
    .forEach((item) => {
      lines.push(`  --header ${quoteShell(`${item.key}: ${item.value}`)}`);
    });

  if (request.auth.type === "bearer") {
    lines.push(
      `  --header ${quoteShell(`Authorization: Bearer ${request.auth.token}`)}`,
    );
  }

  if (request.auth.type === "apiKey" && request.auth.placement === "header") {
    lines.push(
      `  --header ${quoteShell(`${request.auth.key}: ${request.auth.value}`)}`,
    );
  }

  if (request.body.type !== "none") {
    lines.push(`  --data-raw ${quoteShell(request.body.content)}`);
  }

  return lines.join(" \\\n");
};
