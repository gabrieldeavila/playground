import { type ReactNode, useMemo } from "react";
import { AudioRecorderBaseContext } from "./context";
import { useAudioRecorder } from "../features/useAudioRecorder";

export function AudioRecorderBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    session,
    pendingChunks,
    lastError,
    elapsedSeconds,
    isSupported,
    hasPermission,
  } = useAudioRecorder();

  const value = useMemo(
    () => ({
      session,
      pendingChunks,
      lastError,
      elapsedSeconds,
      isSupported,
      hasPermission,
    }),
    [
      elapsedSeconds,
      hasPermission,
      isSupported,
      lastError,
      pendingChunks,
      session,
    ],
  );

  return (
    <AudioRecorderBaseContext.Provider value={value}>
      {children}
    </AudioRecorderBaseContext.Provider>
  );
}
