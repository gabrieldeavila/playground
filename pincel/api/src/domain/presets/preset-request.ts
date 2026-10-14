/** A chat request that should follow a preset: the model is told to apply it before anything else. */
export function withPreset(message: string, presetName?: string): string {
  if (!presetName) return message;
  return `Use the preset "${presetName}": call apply_preset first, then follow its instructions.\n\n${message}`;
}
