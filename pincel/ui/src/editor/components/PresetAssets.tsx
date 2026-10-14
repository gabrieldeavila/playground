import { presetAssetUrl } from '../api/preset-api';

/** Files the preset uses in every piece (a logo...), with a thumbnail. */
export function PresetAssets({ preset, assets }: { preset: string; assets: Record<string, string> }) {
  return (
    <ul className="flex flex-col gap-2">
      {Object.entries(assets).map(([key, path]) => (
        <li key={key} className="flex items-center gap-2 text-xs">
          <img
            src={presetAssetUrl(preset, key)}
            alt=""
            className="size-10 shrink-0 rounded border border-edge bg-panel-2 object-contain"
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
          <div className="min-w-0">
            <p className="text-zinc-300">{key}</p>
            <p className="truncate text-zinc-500" title={path}>
              {path}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
