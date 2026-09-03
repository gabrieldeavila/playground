import { RecorderGateBaseContext } from "./context/RecorderGateBaseContext";
import { RecorderGateServicesContext } from "./context/RecorderGateServicesContext";
import RecorderGateContent from "./features/content";
import { useMemo, useState } from "react";
import "./css/style.css";

interface RecorderGateProps {
  recordingId?: string | null;
  initialMode?: "create" | "list";
}

const RecorderGate = ({
  recordingId = null,
  initialMode = "list",
}: RecorderGateProps) => {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    recordingId,
  );

  const baseValue = useMemo(
    () => ({
      isRecordingModalOpen,
      setIsRecordingModalOpen,
      selectedRecordingId,
      setSelectedRecordingId,
    }),
    [isRecordingModalOpen, selectedRecordingId],
  );

  const servicesValue = useMemo(
    () => ({
      initialMode,
    }),
    [initialMode],
  );

  return (
    <RecorderGateBaseContext.Provider value={baseValue}>
      <RecorderGateServicesContext.Provider value={servicesValue}>
        <RecorderGateContent />
      </RecorderGateServicesContext.Provider>
    </RecorderGateBaseContext.Provider>
  );
};

export default RecorderGate;
