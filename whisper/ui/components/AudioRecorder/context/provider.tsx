import { type ReactNode, useMemo } from "react";
import {
  AudioRecorderBaseContext,
  AudioRecorderServicesContext,
} from "./context";
import { useAudioRecorder } from "../features/useAudioRecorder";

export function AudioRecorderBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useAudioRecorder();
  const baseValue = useMemo(
    () => ({
      session: value.session,
      pendingChunks: value.pendingChunks,
      lastError: value.lastError,
      elapsedSeconds: value.elapsedSeconds,
      isSupported: value.isSupported,
      hasPermission: value.hasPermission,
      transcribedTexts: value.transcribedTexts,
    }),
    [
      value.session,
      value.pendingChunks,
      value.lastError,
      value.elapsedSeconds,
      value.isSupported,
      value.hasPermission,
      value.transcribedTexts,
    ],
  );

  const servicesValue = useMemo(
    () => ({
      startRecording: value.startRecording,
      pauseRecording: value.pauseRecording,
      resumeRecording: value.resumeRecording,
      stopRecording: value.stopRecording,
      retryChunk: value.retryChunk,
      requestDisplayMediaPermission: value.requestDisplayMediaPermission,
      downloadChunk: value.downloadChunk,
    }),
    [
      value.startRecording,
      value.pauseRecording,
      value.resumeRecording,
      value.stopRecording,
      value.retryChunk,
      value.requestDisplayMediaPermission,
      value.downloadChunk,
    ],
  );

  return (
    <AudioRecorderBaseContext.Provider value={baseValue}>
      <AudioRecorderServicesContext.Provider value={servicesValue}>
        {children}
      </AudioRecorderServicesContext.Provider>
    </AudioRecorderBaseContext.Provider>
  );
}

export const AudioRecorderProvider = AudioRecorderBaseProvider;
export default AudioRecorderProvider;
