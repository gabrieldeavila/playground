export type RecordingModalBaseContextValue = {
  isOpen: boolean;
  recordingName: string;
  setIsOpen: (value: boolean) => void;
  setRecordingName: (value: string) => void;
  handleCreateRecording: () => void;
};

export type RecordingModalServicesContextValue = {
};
