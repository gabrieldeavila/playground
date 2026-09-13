import { type ReactNode, useCallback, useMemo } from "react";

import type { RequestWorkspaceServicesContextValue } from "@/types/interface/requestworkspace-context.interface";

import { RequestWorkspaceServicesContext } from "./context";

export function RequestWorkspaceServicesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const mockSendRequest = useCallback(() => undefined, []);

  const value = useMemo<RequestWorkspaceServicesContextValue>(
    () => ({ mockSendRequest }),
    [mockSendRequest],
  );

  return (
    <RequestWorkspaceServicesContext value={value}>
      {children}
    </RequestWorkspaceServicesContext>
  );
}
