export interface Recording {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface RecordingText {
  id: string;
  recordingId: string;
  text: string;
  createdAt: number;
}
