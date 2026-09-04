import { audioRecorderDb } from "@/helpers/db/audioRecorderDb";
import type { Recording } from "~types/interface/recording.interface";

export const createRecording = async (name: string, type: string) => {
  const now = Date.now();
  const recording: Recording = {
    id: crypto.randomUUID(),
    name,
    type,
    createdAt: now,
    updatedAt: now,
  };

  await audioRecorderDb.recordings.add(recording);
  return recording;
};

export const getRecordingById = async (recordingId: string) =>
  audioRecorderDb.recordings.get(recordingId);

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

export const listRecordings = async () =>
  audioRecorderDb.recordings.orderBy("updatedAt").reverse().toArray();

export const deleteRecording = async (recordingId: string) => {
  await audioRecorderDb.transaction(
    "rw",
    audioRecorderDb.recordings,
    audioRecorderDb.recordingTexts,
    async () => {
      await audioRecorderDb.recordings.delete(recordingId);
      await audioRecorderDb.recordingTexts
        .where("recordingId")
        .equals(recordingId)
        .delete();
    },
  );
};

export const listRecordingTexts = async (recordingId: string) =>
  audioRecorderDb.recordingTexts
    .where("recordingId")
    .equals(recordingId)
    .sortBy("createdAt");

export const updateRecordingText = async (id: string, text: string) => {
  await audioRecorderDb.recordingTexts.update(id, {
    text,
  });
};

export const updateRecordingName = renameRecording;
