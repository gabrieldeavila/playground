export interface RiderColors {
  bike: string
  jacket: string
  helmet: string
  pants: string
}

export const PLAYER_COLORS: RiderColors = { bike: '#e8551c', jacket: '#1f2a44', helmet: '#f2c230', pants: '#2b2f38' }

const RIVAL_COLORS: RiderColors[] = [
  { bike: '#2a7de1', jacket: '#3a3a3a', helmet: '#e8e8e8', pants: '#1e2433' },
  { bike: '#c22d5a', jacket: '#5a1f33', helmet: '#151515', pants: '#2d2d2d' },
  { bike: '#2f9e5b', jacket: '#4a3a2a', helmet: '#2f9e5b', pants: '#3a3226' },
  { bike: '#e8e3d6', jacket: '#8a1d1d', helmet: '#c22d2d', pants: '#222222' },
  { bike: '#8e44ad', jacket: '#2b2b3a', helmet: '#f39c12', pants: '#1f1f2a' },
  { bike: '#1c1c1c', jacket: '#6b5a3a', helmet: '#7a7a7a', pants: '#3a3020' },
  { bike: '#16a5a5', jacket: '#24323a', helmet: '#e6e6e6', pants: '#1c262c' },
]

export function riderColors(index: number, isPlayer: boolean): RiderColors {
  return isPlayer ? PLAYER_COLORS : RIVAL_COLORS[index % RIVAL_COLORS.length]
}
