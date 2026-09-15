import Dexie, { type EntityTable } from "dexie";

import type { RequestTab } from "@/types/interface/request.interface";

export class RequestDatabase extends Dexie {
  requests!: EntityTable<RequestTab, "id">;

  constructor() {
    super("fetchy-request-workspace");

    this.version(1).stores({
      requests: "id, label, method",
    });
  }
}

export const requestDb = new RequestDatabase();
