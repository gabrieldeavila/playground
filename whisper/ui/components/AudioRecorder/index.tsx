import { AudioRecorderBaseProvider } from "./context/AudioRecorderBaseContext";
import { AudioRecorderServicesProvider } from "./context/AudioRecorderServicesContext";
import AudioRecorderContent from "./features/content";
import "./css/style.css";

const AudioRecorder = () => {
  return (
    <AudioRecorderBaseProvider>
      <AudioRecorderServicesProvider>
        <AudioRecorderContent />
      </AudioRecorderServicesProvider>
    </AudioRecorderBaseProvider>
  );
};

export default AudioRecorder;