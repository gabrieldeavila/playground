import { useState } from 'react';
import { type AgentSettings, type AgentSettingsUpdate, PROVIDER_PRESETS, REASONING_EFFORTS } from '../domain/agent-providers';

interface Props {
  settings: AgentSettings;
  error: string;
  onSave: (update: AgentSettingsUpdate) => Promise<boolean>;
  onDone: () => void;
}

/** Provider, model, key and reasoning effort. The key field stays empty: leaving it so keeps the saved one. */
export function AgentSettingsForm({ settings, error, onSave, onDone }: Props) {
  const [draft, setDraft] = useState({ ...settings, apiKey: '' });
  const set = (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const { baseURL, model, apiKey, reasoningEffort } = draft;
        if (await onSave({ baseURL, model, apiKey, reasoningEffort })) onDone();
      }}
      className="flex flex-col gap-2.5 p-3"
    >
      <div className="flex flex-wrap gap-1">
        {PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => set({ baseURL: preset.baseURL, model: preset.model })}
            className="rounded bg-panel-2 px-2 py-1 text-xs hover:bg-edge"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <Field label="Base URL" value={draft.baseURL} onChange={(baseURL) => set({ baseURL })} />
      <Field label="Model (needs vision)" value={draft.model} onChange={(model) => set({ model })} />
      <Field
        label="API key"
        type="password"
        value={draft.apiKey}
        placeholder={settings.hasApiKey ? `Saved (${settings.apiKeyHint || '••••'}) — leave empty to keep` : 'sk-…'}
        onChange={(apiKey) => set({ apiKey })}
      />
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Reasoning effort
        <select
          value={draft.reasoningEffort}
          onChange={(e) => set({ reasoningEffort: e.target.value })}
          className="rounded-md border border-edge bg-panel-2 px-2 py-1.5 text-sm text-zinc-200"
        >
          {REASONING_EFFORTS.map((effort) => (
            <option key={effort} value={effort}>
              {effort || "Model's default"}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-zinc-500">The key is saved on this machine (api/.data/agent.json) and only sent to the provider.</p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md px-3 py-1 text-zinc-300 hover:bg-panel-2">
          Cancel
        </button>
        <button type="submit" className="rounded-md bg-accent px-3 py-1 text-white">
          Save
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-edge bg-panel-2 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-accent"
      />
    </label>
  );
}
