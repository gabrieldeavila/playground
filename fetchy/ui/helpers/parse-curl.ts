import type { CurlImportResult } from "@/types/interface/curl.interface";
import type {
  HttpMethod,
  RequestKeyValue,
} from "@/types/interface/request.interface";

const createRow = (key: string, value: string): RequestKeyValue => ({
  id: `curl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  key,
  value,
  enabled: true,
});

const tokenizeShellInput = (input: string): string[] => {
  const tokens: string[] = [];
  let token = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;

  for (const character of input.replace(/\\\n/g, " ")) {
    if (escaping) {
      token += character;
      escaping = false;
      continue;
    }

    if (character === "\\" && quote !== "'") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (character === quote) quote = null;
      else token += character;
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
    } else if (/\s/.test(character)) {
      if (token) {
        tokens.push(token);
        token = "";
      }
    } else {
      token += character;
    }
  }

  if (escaping) token += "\\";
  if (token) tokens.push(token);
  return tokens;
};

const isHttpMethod = (value: string): value is HttpMethod =>
  ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(value);

const parseHeader = (value: string): RequestKeyValue | null => {
  const separator = value.indexOf(":");
  if (separator < 1) return null;

  return createRow(
    value.slice(0, separator).trim(),
    value.slice(separator + 1).trim(),
  );
};

export const parseCurl = (input: string): CurlImportResult | null => {
  const normalizedInput = input.trim();
  const curlMatch = /(?:^|[^a-z])curl(?=\s)/i.exec(normalizedInput);
  if (!curlMatch || curlMatch.index === undefined) return null;

  const curlIndex =
    curlMatch.index + curlMatch[0].toLowerCase().indexOf("curl");
  const commandInput = normalizedInput.slice(curlIndex);
  const tokens = tokenizeShellInput(commandInput);
  if (tokens[0]?.toLowerCase() !== "curl") return null;

  const url = commandInput.match(/https?:\/\/[^\s'"\\]+/i)?.[0] ?? "";
  let method: HttpMethod = "GET";
  let bodyContent = "";
  let hasExplicitMethod = false;
  let hasBody = false;
  const headers: RequestKeyValue[] = [];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    const next = tokens[index + 1];

    // A pasted payload can contain another cURL command. Only parse the
    // outer command and ignore the nested command's remaining arguments.
    if (token.toLowerCase() === "curl") break;

    if (token === "-X" || token === "--request") {
      const normalizedMethod = next?.toUpperCase();

      if (normalizedMethod && isHttpMethod(normalizedMethod)) {
        method = normalizedMethod;
        hasExplicitMethod = true;
        index += 1;
      }
      continue;
    }

    if (token === "-H" || token === "--header") {
      if (next) {
        const header = parseHeader(next);
        if (header) headers.push(header);
        index += 1;
      }
      continue;
    }

    if (token === "-b" || token === "--cookie") {
      if (next) {
        headers.push(createRow("Cookie", next));
        index += 1;
      }
      continue;
    }

    if (
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "-d"
    ) {
      if (next !== undefined) {
        if (!hasBody) {
          bodyContent = next;
          hasBody = true;
        }
        index += 1;
      }
      continue;
    }
  }

  if (!url) return null;
  if (hasBody && !hasExplicitMethod) method = "POST";

  const contentType = headers
    .find((header) => header.key.toLowerCase() === "content-type")
    ?.value.toLowerCase();
  const body = hasBody
    ? {
        type: contentType?.includes("application/json")
          ? ("json" as const)
          : ("text" as const),
        content: bodyContent,
      }
    : { type: "none" as const, content: "" };

  return { method, url, headers, body };
};
