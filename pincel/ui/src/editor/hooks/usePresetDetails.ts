import { useEffect, useState } from 'react';
import { fetchPreset } from '../api/preset-api';
import type { PresetDetails } from '../domain/presets';

/**
 * Everything about one preset. Fetched again whenever `refresh` turns true
 * (e.g. the agent finished a piece, which updates the preview).
 */
export function usePresetDetails(name: string, refresh: boolean) {
  const [details, setDetails] = useState<PresetDetails | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!name || !refresh) return;
    let current = true;
    fetchPreset(name).then(
      (preset) => {
        if (!current) return;
        setDetails(preset);
        setVersion(Date.now());
        setError('');
      },
      (e: Error) => current && setError(e.message),
    );
    return () => {
      current = false;
    };
  }, [name, refresh]);

  return { details: details?.name === name ? details : null, version, error };
}
