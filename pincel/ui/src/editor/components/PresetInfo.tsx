import type { ReactNode } from 'react';
import type { PresetDetails } from '../domain/presets';
import { PresetAssets } from './PresetAssets';
import { PresetColors } from './PresetColors';
import { PresetFonts } from './PresetFonts';
import { PresetPreview } from './PresetPreview';

interface Props {
  preset: PresetDetails;
  version: number;
}

/** Everything a preset holds, to recognize it and see what the agent will follow. */
export function PresetInfo({ preset, version }: Props) {
  const { canvas } = preset;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-zinc-200">{preset.name}</h3>
        <p className="text-xs text-zinc-400">{preset.description}</p>
      </div>
      <PresetPreview preset={preset} version={version} />
      <p className="text-xs text-zinc-500">
        {canvas ? `${canvas.width}×${canvas.height}` : 'Keeps the current document size'}
        {preset.hasTemplate && ' · starts from a template document'}
      </p>
      {preset.fonts.length > 0 && (
        <Part title="Fonts">
          <PresetFonts fonts={preset.fonts} />
        </Part>
      )}
      {Object.keys(preset.colors).length > 0 && (
        <Part title="Colors">
          <PresetColors colors={preset.colors} />
        </Part>
      )}
      {Object.keys(preset.assets).length > 0 && (
        <Part title="Assets">
          <PresetAssets preset={preset.name} assets={preset.assets} />
        </Part>
      )}
      <Part title="Instructions">
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">{preset.instructions}</p>
      </Part>
    </div>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{title}</h4>
      {children}
    </section>
  );
}
