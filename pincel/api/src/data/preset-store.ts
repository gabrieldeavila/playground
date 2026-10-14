import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { presetNameSchema, presetSchema, type Preset, type PresetSummary } from '../domain/presets/preset.js';
import type { DocumentTemplate } from './document-template.js';

const TEMPLATE_SUFFIX = '.template.json';
const PREVIEW_SUFFIX = '.preview.png';

export interface StoredPreset {
  preset: Preset;
  template: DocumentTemplate | null;
}

/**
 * Presets live as `<name>.json` (editable by hand) plus an optional
 * `<name>.template.json` with the document to start from and a
 * `<name>.preview.png` of the latest piece made with it.
 */
export function createPresetStore(dir: string) {
  const presetPath = (name: string) => join(dir, `${presetNameSchema.parse(name)}.json`);
  const templatePath = (name: string) => join(dir, `${presetNameSchema.parse(name)}${TEMPLATE_SUFFIX}`);
  const previewPath = (name: string) => join(dir, `${presetNameSchema.parse(name)}${PREVIEW_SUFFIX}`);

  async function names(): Promise<string[]> {
    const files = await readdir(dir).catch(() => [] as string[]);
    return files.filter((file) => file.endsWith('.json') && !file.endsWith(TEMPLATE_SUFFIX)).map((file) => file.slice(0, -5)).sort();
  }

  async function readPreset(name: string): Promise<Preset> {
    const raw = await readFile(presetPath(name), 'utf8').catch(() => {
      throw new Error(`No preset "${name}". Call list_presets to see the ones there are.`);
    });
    const parsed = presetSchema.safeParse({ ...JSON.parse(raw), name });
    if (!parsed.success) throw new Error(`Preset "${name}" is invalid:\n${z.prettifyError(parsed.error)}`);
    return parsed.data;
  }

  async function readTemplate(name: string): Promise<DocumentTemplate | null> {
    const raw = await readFile(templatePath(name), 'utf8').catch(() => null);
    return raw === null ? null : (JSON.parse(raw) as DocumentTemplate);
  }

  return {
    /** Every readable preset; broken files are skipped so one typo doesn't hide the rest. */
    async list(): Promise<PresetSummary[]> {
      const all = await Promise.all(
        (await names()).map(async (name) => {
          const preset = await readPreset(name).catch(() => null);
          const template = await readTemplate(name).catch(() => null);
          const hasPreview = await stat(previewPath(name)).then(() => true, () => false);
          return preset && { name, description: preset.description, hasTemplate: template !== null, hasPreview };
        }),
      );
      return all.filter((summary) => summary !== null);
    },

    async load(name: string): Promise<StoredPreset> {
      return { preset: await readPreset(name), template: await readTemplate(name) };
    },

    async save({ preset, template }: StoredPreset, overwrite: boolean): Promise<void> {
      if (!overwrite && (await names()).includes(preset.name)) {
        throw new Error(`Preset "${preset.name}" already exists. Pass overwrite: true to replace it.`);
      }
      await mkdir(dir, { recursive: true });
      await writeFile(presetPath(preset.name), JSON.stringify(preset, null, 2));
      if (template) await writeFile(templatePath(preset.name), JSON.stringify(template));
      else await rm(templatePath(preset.name), { force: true });
    },

    async remove(name: string): Promise<void> {
      if (!(await names()).includes(name)) throw new Error(`No preset "${name}"`);
      await rm(presetPath(name));
      await rm(templatePath(name), { force: true });
      await rm(previewPath(name), { force: true });
    },

    /** Keeps a picture of a piece made with the preset, so people can recognize it. Ignored for unknown presets. */
    async savePreview(name: string, png: Buffer): Promise<void> {
      if ((await names()).includes(name)) await writeFile(previewPath(name), png);
    },

    readPreview(name: string): Promise<Buffer | null> {
      return readFile(previewPath(name)).catch(() => null);
    },
  };
}

export type PresetStore = ReturnType<typeof createPresetStore>;
