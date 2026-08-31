import { RecordingModalBaseProvider } from "./context/RecordingModalBaseContext";
import { RecordingModalServicesProvider } from "./context/RecordingModalServicesContext";
import RecordingModalContent from "./features/content";
import "./css/style.css";

const RecordingModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (recordingId: string) => void;
}) => {
  return (
    <RecordingModalBaseProvider
      isOpen={isOpen}
      onClose={onClose}
      onCreated={onCreated}
    >
      <RecordingModalServicesProvider>
        <RecordingModalContent />
      </RecordingModalServicesProvider>
    </RecordingModalBaseProvider>
  );
};

export default RecordingModal;
