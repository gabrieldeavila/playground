// 83.456 -> "1:23.4"
export function formatTime(seconds: number): string {
  const tenths = Math.floor(Math.max(0, seconds) * 10)
  const minutes = Math.floor(tenths / 600)
  const rest = (tenths % 600) / 10
  return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`
}

export function ordinal(place: number): string {
  const suffix = place % 100 >= 11 && place % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][place % 10] ?? 'th')
  return `${place}${suffix}`
}
