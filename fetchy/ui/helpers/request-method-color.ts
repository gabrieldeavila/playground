import type { HttpMethod } from "@/types/interface/request.interface";

const requestMethodColors: Record<HttpMethod, string> = {
  GET: "text-(--color-method-get)",
  POST: "text-(--color-method-post)",
  PUT: "text-(--color-method-put)",
  PATCH: "text-(--color-method-patch)",
  DELETE: "text-(--color-method-delete)",
};

export const getRequestMethodColor = (method: HttpMethod) =>
  requestMethodColors[method];
