import { useParams } from "react-router";
import RecorderGate from "@/components/RecorderGate";

export default function RecordingDetailsPage() {
  const params = useParams();

  return <RecorderGate recordingId={params.id ?? null} />;
}
