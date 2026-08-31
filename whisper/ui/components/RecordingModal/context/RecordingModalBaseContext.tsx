import { type ReactNode, useCallback, useMemo, useState } from "react";
import { createRecording } from "@/helpers/recording/recordingStorage";
import { RecordingModalBaseContext } from "./context";

export function RecordingModalBaseProvider({
  children,
  isOpen,
  onClose,
  onCreated,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (recordingId: string) => void;
}) {
  const [recordingName, setRecordingName] = useState("");

  const handleCreateRecording = useCallback(async () => {
    const trimmedName = recordingName.trim();

    if (!trimmedName) return;

    const recording = await createRecording(trimmedName);
    onCreated?.(recording.id);
    onClose();
    setRecordingName("");
  }, [onClose, onCreated, recordingName]);

  const value = useMemo(
    () => ({
      isOpen,
      recordingName,
      setIsOpen: onClose,
      setRecordingName,
      handleCreateRecording,
    }),
    [handleCreateRecording, isOpen, onClose, recordingName],
  );

  return (
    <RecordingModalBaseContext.Provider value={value}>
      {children}
    </RecordingModalBaseContext.Provider>
  );
}
