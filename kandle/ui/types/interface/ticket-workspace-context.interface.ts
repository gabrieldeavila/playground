import type { Dispatch, SetStateAction } from "react";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";

export type TicketWorkspaceBaseContextValue = {
  ticketQuery: string;
  timeRange: TicketTimeRange;
  setTicketQuery: Dispatch<SetStateAction<string>>;
  setTimeRange: Dispatch<SetStateAction<TicketTimeRange>>;
};
