import { createContext, useContext } from "react";

import type { TicketWorkspaceBaseContextValue } from "@/types/interface/ticket-workspace-context.interface";

export const TicketWorkspaceBaseContext =
  createContext<TicketWorkspaceBaseContextValue | null>(null);

export function useTicketWorkspaceContext() {
  const context = useContext(TicketWorkspaceBaseContext);

  if (!context) {
    throw new Error(
      "useTicketWorkspaceContext must be used within a TicketWorkspaceBaseProvider",
    );
  }

  return context;
}
