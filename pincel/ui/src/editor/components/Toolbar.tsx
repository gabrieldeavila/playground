import type { IconType } from 'react-icons';
import {
  LuBrush,
  LuCircle,
  LuCircleDashed,
  LuLasso,
  LuSquareDashed,
  LuWand,
  LuEraser,
  LuMove,
  LuPaintBucket,
  LuPipette,
  LuSlash,
  LuSquare,
  LuSunset,
  LuType,
} from 'react-icons/lu';
import { EDITOR_TOOLS, type EditorToolId } from '../domain/editor-tools';
import { ColorSwatches } from './ColorSwatches';
import { IconButton } from './IconButton';
import type { ToolSettings } from '../domain/types';

const ICONS: Record<EditorToolId, IconType> = {
  move: LuMove,
  'select-rect': LuSquareDashed,
  'select-ellipse': LuCircleDashed,
  lasso: LuLasso,
  'magic-wand': LuWand,
  brush: LuBrush,
  eraser: LuEraser,
  rect: LuSquare,
  ellipse: LuCircle,
  line: LuSlash,
  gradient: LuSunset,
  text: LuType,
  fill: LuPaintBucket,
  eyedropper: LuPipette,
};

interface Props {
  tool: EditorToolId;
  onSelect: (tool: EditorToolId) => void;
  settings: ToolSettings;
  onSettings: (changes: Partial<ToolSettings>) => void;
  onSwapColors: () => void;
}

export function Toolbar({ tool, onSelect, settings, onSettings, onSwapColors }: Props) {
  return (
    <aside className="flex w-12 flex-col items-center gap-1 border-r border-edge bg-panel py-2">
      {EDITOR_TOOLS.map(({ id, label, shortcut }) => {
        const Icon = ICONS[id];
        return (
          <IconButton key={id} label={`${label} (${shortcut.toUpperCase()})`} active={tool === id} onClick={() => onSelect(id)}>
            <Icon />
          </IconButton>
        );
      })}
      <div className="mt-auto">
        <ColorSwatches settings={settings} onSettings={onSettings} onSwap={onSwapColors} />
      </div>
    </aside>
  );
}
