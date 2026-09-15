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
  let quote: "'" | '"' | "ansi" | null = null;
  let escaping = false;

  const pushToken = () => {
    if (!token) return;
    tokens.push(token);
    token = "";
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (quote === "ansi") {
      if (character === "\\") {
        if (nextCharacter === "\n") {
          index += 1;
          continue;
        }

        if (nextCharacter !== undefined) {
          // Keep JSON escapes such as \\n and \\t intact, while decoding
          // escaped quotes and the escaped single quote used by Bash.
          if (
            nextCharacter === "n" ||
            nextCharacter === "r" ||
            nextCharacter === "t"
          ) {
            token += `\\${nextCharacter}`;
          } else {
            token += nextCharacter;
          }
          index += 1;
          continue;
        }
      }

      if (character === "'") {
        quote = null;
      } else {
        token += character;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'") quote = null;
      else token += character;
      continue;
    }

    if (quote === '"') {
      if (escaping) {
        token += character;
        escaping = false;
      } else if (character === "\\") {
        escaping = true;
      } else if (character === '"') {
        quote = null;
      } else {
        token += character;
      }
      continue;
    }

    if (escaping) {
      token += character;
      escaping = false;
      continue;
    }

    if (character === "\\") {
      if (nextCharacter === "\n") {
        index += 1;
      } else {
        escaping = true;
      }
      continue;
    }

    if (character === "$" && nextCharacter === "'") {
      quote = "ansi";
      index += 1;
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
    } else if (/\s/.test(character)) {
      pushToken();
    } else {
      token += character;
    }
  }

  if (escaping) token += "\\";
  pushToken();
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
