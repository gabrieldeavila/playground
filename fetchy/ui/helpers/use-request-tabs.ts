import { useEffect, useState } from "react";

import { requestDb } from "@/helpers/request-db";
import type { RequestTab } from "@/types/interface/request.interface";

export const createNewRequest = (): RequestTab => ({
  id: `request-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: "New Request",
  method: "GET",
  url: "",
  queryParams: [],
  headers: [],
  body: { type: "none", content: "" },
  auth: { type: "none" },
});

export function useRequestTabs() {
  const [requestTabs, setRequestTabs] = useState<RequestTab[]>([]);
  const [hasLoadedRequests, setHasLoadedRequests] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      const savedRequests = await requestDb.requests.toArray();
      if (!isMounted) return;

      const requests =
        savedRequests.length > 0 ? savedRequests : [createNewRequest()];
      setRequestTabs(requests);
      setHasLoadedRequests(true);
    };

    void loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  return { requestTabs, setRequestTabs, hasLoadedRequests };
}
