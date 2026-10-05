import type { RecordingText } from "~types/interface/recording.interface";

export type AudioRecorderStatus = "idle" | "recording" | "paused";

export interface AudioRecorderSession {
  id: string;
  startedAt: number | null;
  chunkSizeSeconds: number;
  status: AudioRecorderStatus;
}

export interface AudioChunk {
  id: string;
  recordingId: string;
  index: number;
  blob: Blob;
  durationMs: number;
  createdAt: number;
  status: "pending" | "uploading" | "sent" | "failed";
  text?: string;
  errorMessage?: string;
}

export interface AudioRecorderBaseContextValue {
  session: AudioRecorderSession;
  chunks: AudioChunk[];
  lastError: string | null;
  elapsedSeconds: number;
  transcripts: RecordingText[];
  setTranscripts: React.Dispatch<React.SetStateAction<RecordingText[]>>;
}

export interface AudioRecorderServicesContextValue {
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  retryChunk: (chunkId: string) => Promise<void>;
  downloadChunk: (chunk: AudioChunk) => void;
}
