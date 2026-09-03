import { RecordingModalBaseProvider } from "./context/RecordingModalBaseContext";
import { RecordingModalServicesProvider } from "./context/RecordingModalServicesContext";
import RecordingModalContent from "./features/content";
import "./css/style.css";

const RecordingModal = ({
  isOpen,
  onClose,
  onCreated,
  mode = "create",
  deleteTargetName,
  onConfirmDelete,
  onCancelDelete,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (recordingId: string) => void;
  mode?: "create" | "delete";
  deleteTargetName?: string;
  onConfirmDelete?: () => void | Promise<void>;
  onCancelDelete?: () => void;
  isDeleting?: boolean;
}) => {
  return (
    <RecordingModalBaseProvider
      isOpen={isOpen}
      onClose={onClose}
      onCreated={onCreated}
      mode={mode}
      deleteTargetName={deleteTargetName}
      onConfirmDelete={onConfirmDelete}
      onCancelDelete={onCancelDelete}
      isDeleting={isDeleting}
    >
      <RecordingModalServicesProvider>
        <RecordingModalContent />
      </RecordingModalServicesProvider>
    </RecordingModalBaseProvider>
  );
};

export default RecordingModal;
