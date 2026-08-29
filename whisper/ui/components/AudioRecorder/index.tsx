import { AudioRecorderProvider } from "./context/provider";
import AudioRecorderContent from "./features/content";
import "./css/style.css";

const AudioRecorder = () => {
  return (
    <AudioRecorderProvider>
      <AudioRecorderContent />
    </AudioRecorderProvider>
  );
};

export default AudioRecorder;
