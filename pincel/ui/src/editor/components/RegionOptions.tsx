import type { ToolSettings } from '../domain/types';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

interface Props {
  settings: ToolSettings;
  onSettings: (changes: Partial<ToolSettings>) => void;
}

/** Magic wand / paint bucket: how the similar-color area is found. */
export function RegionOptions({ settings, onSettings }: Props) {
  return (
    <>
      <SliderField label="Tolerance" min={0} max={255} value={settings.tolerance} onChange={(tolerance) => onSettings({ tolerance })} />
      <Toggle label="Contiguous" checked={settings.contiguous} onChange={(contiguous) => onSettings({ contiguous })} />
      <Toggle label="Sample all layers" checked={settings.sampleAllLayers} onChange={(sampleAllLayers) => onSettings({ sampleAllLayers })} />
    </>
  );
}
