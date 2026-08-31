import { audioRecorderDb } from "@/helpers/db/audioRecorderDb";
import type { Recording } from "~types/interface/recording.interface";

export const createRecording = async (name: string) => {
  const now = Date.now();
  const recording: Recording = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  };

  await audioRecorderDb.recordings.add(recording);
  return recording;
};

export const renameRecording = async (id: string, name: string) => {
  await audioRecorderDb.recordings.update(id, {
    name,
    updatedAt: Date.now(),
  });
};

export const saveRecordingText = async (recordingId: string, text: string) => {
  await audioRecorderDb.recordingTexts.add({
    id: crypto.randomUUID(),
    recordingId,
    text,
    createdAt: Date.now(),
  });
};

export const listRecordings = async () => audioRecorderDb.recordings.toArray();

export const listRecordingTexts = async (recordingId: string) =>
  audioRecorderDb.recordingTexts
    .where("recordingId")
    .equals(recordingId)
    .sortBy("createdAt");
