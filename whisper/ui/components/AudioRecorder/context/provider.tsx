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
      chunks: value.chunks,
      lastError: value.lastError,
      elapsedSeconds: value.elapsedSeconds,
      transcripts: value.transcripts,
      setTranscripts: value.setTranscripts,
    }),
    [
      value.session,
      value.chunks,
      value.lastError,
      value.elapsedSeconds,
      value.transcripts,
      value.setTranscripts,
    ],
  );

  const servicesValue = useMemo(
    () => ({
      startRecording: value.startRecording,
      pauseRecording: value.pauseRecording,
      resumeRecording: value.resumeRecording,
      stopRecording: value.stopRecording,
      retryChunk: value.retryChunk,
      downloadChunk: value.downloadChunk,
    }),
    [
      value.startRecording,
      value.pauseRecording,
      value.resumeRecording,
      value.stopRecording,
      value.retryChunk,
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
