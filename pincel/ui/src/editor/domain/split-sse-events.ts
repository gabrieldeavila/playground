/**
 * Pulls the complete `data:` events out of a Server-Sent Events buffer.
 * Returns the parsed events and the unfinished tail to keep for the next chunk.
 */
export function splitSseEvents(buffer: string): { events: unknown[]; rest: string } {
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events = blocks.flatMap((block) => {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice('data: '.length))
      .join('\n');
    return data ? [JSON.parse(data)] : [];
  });
  return { events, rest };
}
