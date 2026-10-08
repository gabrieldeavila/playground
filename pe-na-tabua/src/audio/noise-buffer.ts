// Alguns segundos de ruído branco, reaproveitados por todos os sons de ar e atrito.
export function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}
