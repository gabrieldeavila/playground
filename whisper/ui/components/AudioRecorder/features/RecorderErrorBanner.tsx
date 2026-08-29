import { memo } from "react";

interface RecorderErrorBannerProps {
  error: string | null;
}

const RecorderErrorBanner = memo(({ error }: RecorderErrorBannerProps) => {
  if (!error) return null;

  return <div className="audio-recorder__error">{error}</div>;
});

export default RecorderErrorBanner;
