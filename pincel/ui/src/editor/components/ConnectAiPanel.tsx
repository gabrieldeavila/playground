const mcpUrl = `${window.location.origin}/mcp`;

const SNIPPETS = [
  { title: 'Claude Code', code: `claude mcp add --transport http pincel ${mcpUrl}` },
  { title: 'Any MCP client (Streamable HTTP)', code: mcpUrl },
  { title: 'Plain REST (tool list in Claude API format)', code: `curl ${window.location.origin}/api/tools` },
];

/** How to point an AI at this editor. */
export function ConnectAiPanel() {
  return (
    <div className="absolute top-12 right-3 z-20 flex w-[28rem] flex-col gap-3 rounded-lg border border-edge bg-panel p-4 shadow-xl">
      <h3 className="font-semibold">Let an AI edit this image</h3>
      <p className="text-zinc-400">
        Every tool in this editor is also an API tool. Connect an AI and watch its edits appear here live — they show up
        in History with a bot icon.
      </p>
      {SNIPPETS.map((s) => (
        <div key={s.title}>
          <p className="mb-1 text-xs text-zinc-400">{s.title}</p>
          <code
            onClick={() => navigator.clipboard?.writeText(s.code)}
            title="Click to copy"
            className="block cursor-copy rounded bg-black/40 px-2 py-1.5 font-mono text-xs break-all text-emerald-300"
          >
            {s.code}
          </code>
        </div>
      ))}
    </div>
  );
}
