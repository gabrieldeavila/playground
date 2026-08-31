import { type ReactNode, useMemo } from "react";
import { RecordingModalServicesContext } from "./context";

export function RecordingModalServicesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useMemo(() => ({}), []);

  return (
    <RecordingModalServicesContext.Provider value={value}>
      {children}
    </RecordingModalServicesContext.Provider>
  );
}
