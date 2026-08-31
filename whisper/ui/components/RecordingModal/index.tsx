import { RecordingModalBaseProvider } from "./context/RecordingModalBaseContext";
import { RecordingModalServicesProvider } from "./context/RecordingModalServicesContext";
import RecordingModalContent from "./features/content";
import "./css/style.css";

const RecordingModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <RecordingModalBaseProvider isOpen={isOpen} onClose={onClose}>
      <RecordingModalServicesProvider>
        <RecordingModalContent />
      </RecordingModalServicesProvider>
    </RecordingModalBaseProvider>
  );
};

export default RecordingModal;
