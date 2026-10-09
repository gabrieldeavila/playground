import { z } from 'zod';
import { renderPng } from '../../data/document-renderer.js';
import { findSpotsOnLayer } from '../../data/spot-finder.js';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { layerIdField, pointField, rectField } from './tool-fields.js';

const spotField = z.object({ center: pointField, radius: z.number().positive().max(80).describe('Covers the whole blemish, in px') });

export const retouchTools = [
  defineTool({
    name: 'find_spots',
    title: 'Find blemishes',
    description:
      'Detects small spots that are redder than the skin around them (acne, pimples, red marks) on a layer. Select the skin first (e.g. select_lasso around the face, then subtract eyes/lips) so hair, lips and background are ignored; only spots inside the selection are returned. preview=true returns an image with each spot circled and numbered so you can check them before calling heal_spots.',
    input: {
      layerId: layerIdField,
      threshold: z.number().min(1).max(255).default(16).describe('How much redder than the surroundings (lower finds fainter marks)'),
      maxRadius: z.number().positive().default(12).describe('Ignore red areas larger than this radius'),
      minRadius: z.number().positive().default(1.2),
      region: rectField.optional().describe('Only look in this rectangle'),
      limit: z.number().int().min(1).max(500).default(150),
      preview: z.boolean().default(true),
    },
    readOnly: true,
    async run({ layerId, threshold, maxRadius, minRadius, region, limit, preview }, { engine }) {
      const id = resolveLayer(engine, layerId);
      const spots = findSpotsOnLayer(engine.doc, id, { threshold, maxRadius, minRadius, region }).slice(0, limit);
      const image = preview ? renderPng(engine.doc, { region, maxSize: 1400, markers: spots }) : undefined;
      const scope = engine.doc.selection ? 'inside the selection' : 'on the whole layer (tip: select the skin first)';
      return {
        text: `Found ${spots.length} spots ${scope}, strongest first:\n${JSON.stringify(spots.map(({ center, radius }) => ({ center, radius })))}`,
        image,
        data: { spots },
      };
    },
  }),

  defineTool({
    name: 'heal_spots',
    title: 'Spot healing brush',
    description:
      'Removes small blemishes (acne, dust, spots): each one is covered with nearby clean texture, color-matched to its surroundings and feathered in. Make radius cover the whole spot. Works best on a duplicate of the photo layer so the original stays intact. Pass the spots from find_spots, or your own.',
    input: {
      layerId: layerIdField,
      spots: z.array(spotField).min(1).max(500),
      target: targetField,
    },
    async run({ layerId, spots, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'heal_spots', layerId: id, spots, target }, source);
      return { text: `Healed ${spots.length} spots on ${describeTarget(engine, id, target)}` };
    },
  }),
];
