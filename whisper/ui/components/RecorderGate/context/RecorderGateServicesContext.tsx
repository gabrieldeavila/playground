import { type ReactNode, useMemo } from "react";
import { RecorderGateServicesContext } from "./context";

export function RecorderGateServicesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useMemo(() => ({}), []);

  return (
    <RecorderGateServicesContext.Provider value={value}>
      {children}
    </RecorderGateServicesContext.Provider>
  );
}
