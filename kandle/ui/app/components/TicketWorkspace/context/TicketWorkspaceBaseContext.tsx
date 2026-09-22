import { type ReactNode, useMemo, useState } from "react";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import { TicketWorkspaceBaseContext } from "./context";

export function TicketWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ticketQuery, setTicketQuery] = useState("");
  const [timeRange, setTimeRange] = useState(TicketTimeRange.SevenDays);

  const value = useMemo(
    () => ({
      ticketQuery,
      timeRange,
      setTicketQuery,
      setTimeRange,
    }),
    [ticketQuery, timeRange],
  );

  return (
    <TicketWorkspaceBaseContext value={value}>
      {children}
    </TicketWorkspaceBaseContext>
  );
}
