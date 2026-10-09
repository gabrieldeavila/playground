import { MASKABLE_TOOLS, type EditorToolId } from '../domain/editor-tools';
import { TOOL_HINTS } from '../domain/tool-hints';
import type { ToolSettings } from '../domain/types';
import { MaskTargetBadge } from './MaskTargetBadge';
import { RegionOptions } from './RegionOptions';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

interface Props {
  tool: EditorToolId;
  settings: ToolSettings;
  onSettings: (changes: Partial<ToolSettings>) => void;
}

const SIZED: ReadonlySet<EditorToolId> = new Set(['brush', 'eraser', 'line', 'rect', 'ellipse']);
const FEATHERED: ReadonlySet<EditorToolId> = new Set(['select-rect', 'select-ellipse', 'lasso']);
const FONTS = ['sans-serif', 'serif', 'monospace', 'Helvetica', 'Georgia', 'Impact', 'Courier New'];

/** Context bar under the top bar showing the options of the selected tool. */
export function ToolOptions({ tool, settings, onSettings }: Props) {
  return (
    <div className="flex h-10 items-center gap-5 overflow-x-auto border-b border-edge bg-panel px-4 whitespace-nowrap text-zinc-300">
      {settings.target === 'mask' && MASKABLE_TOOLS.has(tool) && <MaskTargetBadge onExit={() => onSettings({ target: 'pixels' })} />}
      {SIZED.has(tool) && (
        <SliderField label="Size" min={1} max={200} value={settings.size} onChange={(size) => onSettings({ size })} suffix="px" />
      )}
      {(tool === 'brush' || tool === 'eraser') && (
        <SliderField
          label="Opacity"
          min={5}
          max={100}
          value={Math.round(settings.opacity * 100)}
          onChange={(v) => onSettings({ opacity: v / 100 })}
          suffix="%"
        />
      )}
      {(tool === 'rect' || tool === 'ellipse') && (
        <>
          <Toggle label="Fill (primary)" checked={settings.fillShapes} onChange={(fillShapes) => onSettings({ fillShapes })} />
          <Toggle label="Outline (secondary)" checked={settings.strokeShapes} onChange={(strokeShapes) => onSettings({ strokeShapes })} />
        </>
      )}
      {FEATHERED.has(tool) && (
        <SliderField label="Feather" min={0} max={100} value={settings.feather} onChange={(feather) => onSettings({ feather })} suffix="px" />
      )}
      {(tool === 'magic-wand' || tool === 'fill') && <RegionOptions settings={settings} onSettings={onSettings} />}
      {tool === 'text' && (
        <>
          <SliderField label="Font size" min={8} max={300} value={settings.fontSize} onChange={(fontSize) => onSettings({ fontSize })} suffix="px" />
          <select
            value={settings.fontFamily}
            onChange={(e) => onSettings({ fontFamily: e.target.value })}
            className="rounded bg-panel-2 px-2 py-1"
          >
            {FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </>
      )}
      <span className="ml-auto pl-4 text-xs text-zinc-500">{TOOL_HINTS[tool]}</span>
    </div>
  );
}
