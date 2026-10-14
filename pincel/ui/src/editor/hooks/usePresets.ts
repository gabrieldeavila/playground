import { useEffect, useState } from 'react';
import { fetchPresets } from '../api/preset-api';
import { keepChosenPreset, type PresetSummary } from '../domain/presets';

/**
 * The saved presets and the one picked for the next requests. Reloads whenever
 * `refresh` turns true (e.g. the agent finished and may have saved a new one).
 */
export function usePresets(refresh: boolean) {
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [chosen, setChosen] = useState('');

  useEffect(() => {
    if (!refresh) return;
    fetchPresets().then(
      (list) => {
        setPresets(list);
        setChosen((current) => keepChosenPreset(current, list));
      },
      () => setPresets([]),
    );
  }, [refresh]);

  return { presets, chosen, choose: setChosen };
}
