import { type ReactNode, useMemo, useState } from "react";
import { RecorderGateBaseContext } from "./context";

export function RecorderGateBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  const value = useMemo(
    () => ({
      showRecorder,
      setShowRecorder,
      isRecordingModalOpen,
      setIsRecordingModalOpen,
    }),
    [showRecorder, isRecordingModalOpen],
  );

  return (
    <RecorderGateBaseContext.Provider value={value}>
      {children}
    </RecorderGateBaseContext.Provider>
  );
}
