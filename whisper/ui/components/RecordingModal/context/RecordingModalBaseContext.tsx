import { type ReactNode, useCallback, useMemo, useState } from "react";
import { RecordingModalBaseContext } from "./context";

export function RecordingModalBaseProvider({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [recordingName, setRecordingName] = useState("");

  const handleCreateRecording = useCallback(() => {
    onClose();
    setRecordingName("");
  }, [onClose]);

  const value = useMemo(
    () => ({
      isOpen,
      recordingName,
      setIsOpen: onClose,
      setRecordingName,
      handleCreateRecording,
    }),
    [isOpen, recordingName, onClose],
  );

  return (
    <RecordingModalBaseContext.Provider value={value}>
      {children}
    </RecordingModalBaseContext.Provider>
  );
}
