import { type ReactNode, useMemo } from "react";
import { AudioRecorderServicesContext } from "./context";
import { useAudioRecorder } from "../features/useAudioRecorder";

export function AudioRecorderServicesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    retryChunk,
    requestMicrophonePermission,
  } = useAudioRecorder();

  const value = useMemo(
    () => ({
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      requestMicrophonePermission,
    }),
    [
      pauseRecording,
      requestMicrophonePermission,
      retryChunk,
      resumeRecording,
      startRecording,
      stopRecording,
    ],
  );

  return (
    <AudioRecorderServicesContext.Provider value={value}>
      {children}
    </AudioRecorderServicesContext.Provider>
  );
}
