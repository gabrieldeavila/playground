export type RecordingModalBaseContextValue = {
  isOpen: boolean;
  recordingName: string;
  setIsOpen: (value: boolean) => void;
  setRecordingName: (value: string) => void;
  handleCreateRecording: () => Promise<void>;
};

export type RecordingModalServicesContextValue = {};
