import { RecorderGateBaseProvider } from "./context/RecorderGateBaseContext";
import { RecorderGateServicesProvider } from "./context/RecorderGateServicesContext";
import RecorderGateContent from "./features/content";
import "./css/style.css";

const RecorderGate = () => {
  return (
    <RecorderGateBaseProvider>
      <RecorderGateServicesProvider>
        <RecorderGateContent />
      </RecorderGateServicesProvider>
    </RecorderGateBaseProvider>
  );
};

export default RecorderGate;