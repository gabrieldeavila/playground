import { BACKGROUND_LAYER_ID } from '../domain/commands/doc-state.js';
import { fitWithin } from '../domain/document/fit-within.js';
import type { DocumentEngine } from './document-engine.js';
import type { ImageSource } from './image-source.js';
import type { CommandSource } from './logged-command.js';

/** Default cap: big phone photos are scaled so editing and replay stay fast. */
export const DEFAULT_MAX_SIDE = 4096;

/** Starts a new document the size of the image, with the image on a "Photo" layer. */
export async function openImage(
  engine: DocumentEngine,
  image: ImageSource,
  source: CommandSource,
  maxSide = DEFAULT_MAX_SIDE,
): Promise<{ width: number; height: number; scaled: boolean }> {
  const size = fitWithin(image.width, image.height, maxSide);
  await engine.reset({ ...size, background: 'transparent' }, source);
  await engine.group('open image', source, async () => {
    await engine.execute({ type: 'update_layer', layerId: BACKGROUND_LAYER_ID, changes: { name: 'Photo' } }, source);
    await engine.execute(
      { type: 'place_image', layerId: BACKGROUND_LAYER_ID, src: image.dataUri, rect: { x: 0, y: 0, ...size } },
      source,
    );
  });
  return { ...size, scaled: size.width !== image.width };
}
