// Frequência de uma nota midi (69 = Lá 440 Hz).
export const noteHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
