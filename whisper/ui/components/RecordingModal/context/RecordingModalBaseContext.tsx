import { createRecording } from "@/helpers/recording/recordingStorage";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { RecordingModalBaseContext } from "./context";
import { RecordingModalSelectionProvider } from "./RecordingModalSelectionContext";

export function RecordingModalBaseProvider({
  children,
  isOpen,
  onClose,
  onCreated,
  mode = "create",
  deleteTargetName,
  onConfirmDelete,
  onCancelDelete,
  isDeleting = false,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (recordingId: string) => void;
  mode?: "create" | "delete";
  deleteTargetName?: string;
  onConfirmDelete?: () => void | Promise<void>;
  onCancelDelete?: () => void;
  isDeleting?: boolean;
}) {
  const [recordingName, setRecordingName] = useState("");
  const [recordingType, setRecordingType] = useState("audio");

  const handleCreateRecording = useCallback(async () => {
    const trimmedName = recordingName.trim();

    if (!trimmedName) return;

    const recording = await createRecording(trimmedName, recordingType);
    onCreated?.(recording.id);
    onClose();
    setRecordingName("");
  }, [onClose, onCreated, recordingName, recordingType]);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      recordingName,
      deleteTargetName,
      isDeleting,
      setIsOpen: onClose,
      setRecordingName,
      handleCreateRecording,
      onConfirmDelete,
      onCancelDelete,
    }),
    [
      deleteTargetName,
      handleCreateRecording,
      isDeleting,
      isOpen,
      mode,
      onCancelDelete,
      onClose,
      onConfirmDelete,
      recordingName,
    ],
  );

  return (
    <RecordingModalSelectionProvider>
      <RecordingModalBaseContext.Provider value={value}>
        {children}
      </RecordingModalBaseContext.Provider>
    </RecordingModalSelectionProvider>
  );
}
