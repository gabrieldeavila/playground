export type RecorderGateBaseContextValue = {
  showRecorder: boolean;
  setShowRecorder: React.Dispatch<React.SetStateAction<boolean>>;
  isRecordingModalOpen: boolean;
  setIsRecordingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRecordingId: string | null;
  setSelectedRecordingId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type RecorderGateServicesContextValue = {};
