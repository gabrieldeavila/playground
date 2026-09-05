export type RecordingModalBaseContextValue = {
  isOpen: boolean;
  mode: "create" | "delete";
  recordingName: string;
  deleteTargetName?: string;
  isDeleting: boolean;
  setIsOpen: (value: boolean) => void;
  setRecordingName: (value: string) => void;
  handleCreateRecording: (selectedSource: string) => Promise<void>;
  onConfirmDelete?: () => void | Promise<void>;
  onCancelDelete?: () => void;
};

export type RecordingModalServicesContextValue = {};
