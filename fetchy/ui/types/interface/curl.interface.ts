import type {
  HttpMethod,
  RequestBody,
  RequestKeyValue,
} from "./request.interface";

export type CurlImportResult = {
  method: HttpMethod;
  url: string;
  headers: RequestKeyValue[];
  body: RequestBody;
};
