import Dexie, { type Table } from "dexie";
import type {
  Recording,
  RecordingText,
} from "~types/interface/recording.interface";

class AudioRecorderDb extends Dexie {
  recordings!: Table<Recording, string>;
  recordingTexts!: Table<RecordingText, string>;

  constructor() {
    super("AudioRecorderDb");
    this.version(1).stores({
      recordings: "id, name, createdAt, updatedAt",
      recordingTexts: "id, recordingId, createdAt",
    });
  }
}

export const audioRecorderDb = new AudioRecorderDb();
