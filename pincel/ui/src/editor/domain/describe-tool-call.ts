/** "batch · add_layer, draw_text ×3" instead of just "batch"; other tools keep their name. */
export function describeToolCall(name: string, args: string): string {
  if (name !== 'batch') return name;
  const tools = batchToolNames(args);
  return tools.length ? `batch · ${countRepeats(tools).join(', ')}` : name;
}

function batchToolNames(args: string): string[] {
  try {
    const { calls } = JSON.parse(args) as { calls?: { tool?: unknown }[] };
    return (calls ?? []).flatMap((call) => (typeof call.tool === 'string' ? [call.tool] : []));
  } catch {
    return [];
  }
}

function countRepeats(names: string[]): string[] {
  const counts = new Map<string, number>();
  names.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
  return [...counts].map(([name, count]) => (count > 1 ? `${name} ×${count}` : name));
}
