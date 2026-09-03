export type RecorderGateBaseContextValue = {
  isRecordingModalOpen: boolean;
  setIsRecordingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRecordingId: string | null;
  setSelectedRecordingId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type RecorderGateServicesContextValue = {
  initialMode: "create" | "list";
};
