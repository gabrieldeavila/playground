export type AudioRecorderStatus =
  "idle" | "recording" | "pausing" | "paused" | "sending" | "error";

export interface AudioRecorderSession {
  id: string;
  startedAt: number | null;
  chunkSizeSeconds: number;
  status: AudioRecorderStatus;
}

export interface AudioChunk {
  id: string;
  sessionId: string;
  index: number;
  blob: Blob;
  durationMs: number;
  createdAt: number;
  status: "pending" | "uploading" | "sent" | "failed";
  errorMessage?: string;
}

export interface UploadAudioChunkInput {
  chunk: AudioChunk;
}

export interface AudioRecorderBaseContextValue {
  session: AudioRecorderSession;
  pendingChunks: AudioChunk[];
  lastError: string | null;
  elapsedSeconds: number;
  isSupported: boolean;
  hasPermission: boolean;
}

export interface AudioRecorderServicesContextValue {
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  retryChunk: (chunkId: string) => Promise<void>;
  requestMicrophonePermission: () => Promise<boolean>;
}
