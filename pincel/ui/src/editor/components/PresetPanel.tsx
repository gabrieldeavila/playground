import { usePresetDetails } from '../hooks/usePresetDetails';
import { PresetInfo } from './PresetInfo';

interface Props {
  name: string;
  /** True when it's a good time to fetch again (the agent is idle). */
  refresh: boolean;
}

/** Shows the chosen preset in the agent panel, in place of the conversation. */
export function PresetPanel({ name, refresh }: Props) {
  const { details, version, error } = usePresetDetails(name, refresh);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {error && <p className="text-xs text-red-300">{error}</p>}
      {details ? <PresetInfo preset={details} version={version} /> : !error && <p className="text-zinc-500">Loading…</p>}
    </div>
  );
}
