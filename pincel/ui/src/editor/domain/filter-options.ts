/** How the filters panel presents each API filter (names match apply_filter). */
export const FILTER_OPTIONS = [
  { name: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.05, initial: 0.2 },
  { name: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05, initial: 0.3 },
  { name: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.05, initial: 0.5 },
  { name: 'hue_rotate', label: 'Hue', min: -180, max: 180, step: 1, initial: 90 },
  { name: 'blur', label: 'Blur', min: 1, max: 50, step: 1, initial: 4 },
  { name: 'sharpen', label: 'Sharpen', min: 0, max: 2, step: 0.1, initial: 0.6 },
  { name: 'grayscale', label: 'Grayscale', min: 0, max: 1, step: 0.05, initial: 1 },
  { name: 'sepia', label: 'Sepia', min: 0, max: 1, step: 0.05, initial: 1 },
  { name: 'invert', label: 'Invert', min: 0, max: 1, step: 0.05, initial: 1 },
  { name: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.05, initial: 0.5 },
  { name: 'posterize', label: 'Posterize', min: 2, max: 16, step: 1, initial: 4 },
  { name: 'pixelate', label: 'Pixelate', min: 2, max: 64, step: 1, initial: 8 },
] as const;

export type FilterOption = (typeof FILTER_OPTIONS)[number];
