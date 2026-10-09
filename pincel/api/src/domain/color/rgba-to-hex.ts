export function rgbaToHex(r: number, g: number, b: number, a = 255): string {
  const hex = [r, g, b].map(toHexByte).join('');
  return a === 255 ? `#${hex}` : `#${hex}${toHexByte(a)}`;
}

function toHexByte(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
}
