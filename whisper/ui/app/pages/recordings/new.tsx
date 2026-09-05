import RecorderGate from "@/components/RecorderGate";

export const meta = () => [{ title: "New Recording | Aural Studio" }];

export default function NewRecordingPage() {
  return <RecorderGate initialMode="create" />;
}
