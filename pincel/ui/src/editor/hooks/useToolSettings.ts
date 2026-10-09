import { useCallback, useState } from 'react';
import type { ToolSettings } from '../domain/types';

const DEFAULTS: ToolSettings = {
  primaryColor: '#1e1e1e',
  secondaryColor: '#ffffff',
  size: 12,
  opacity: 1,
  fillShapes: true,
  strokeShapes: false,
  fontSize: 48,
  fontFamily: 'sans-serif',
  tolerance: 32,
  contiguous: true,
  sampleAllLayers: false,
  feather: 0,
  target: 'pixels',
};

export function useToolSettings() {
  const [settings, setSettings] = useState(DEFAULTS);

  const update = useCallback((changes: Partial<ToolSettings>) => setSettings((s) => ({ ...s, ...changes })), []);

  const swapColors = useCallback(
    () => setSettings((s) => ({ ...s, primaryColor: s.secondaryColor, secondaryColor: s.primaryColor })),
    [],
  );

  return { settings, update, swapColors };
}
