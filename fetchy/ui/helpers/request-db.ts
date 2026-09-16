import Dexie, { type EntityTable } from "dexie";

import type { RequestHistoryEntry } from "@/types/interface/request-history.interface";
import type { RequestTab } from "@/types/interface/request.interface";

export class RequestDatabase extends Dexie {
  requests!: EntityTable<RequestTab, "id">;
  history!: EntityTable<RequestHistoryEntry, "id">;

  constructor() {
    super("fetchy-request-workspace");

    this.version(1).stores({
      requests: "id, label, method",
    });
    this.version(2).stores({
      requests: "id, label, method",
      history: "id, createdAt",
    });
  }
}

export const requestDb = new RequestDatabase();

export async function saveRequestHistory(entry: RequestHistoryEntry) {
  await requestDb.history.put(entry);

  const entries = await requestDb.history
    .orderBy("createdAt")
    .reverse()
    .toArray();
  const staleEntries = entries.slice(15);

  if (staleEntries.length > 0) {
    await requestDb.history.bulkDelete(staleEntries.map((item) => item.id));
  }
}
