import { AudioRecorderProvider } from "./context/provider";
import AudioRecorderContent from "./features/content";
import "./css/style.css";

type AudioRecorderProps = {
  recordingId?: string | null;
};

const AudioRecorder = ({ recordingId = null }: AudioRecorderProps) => {
  return (
    <AudioRecorderProvider>
      <AudioRecorderContent recordingId={recordingId} />
    </AudioRecorderProvider>
  );
};

export default AudioRecorder;
