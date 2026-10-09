import { z } from 'zod';
import { describeError, parseToolInput } from './run-tool.js';
import { defineTool, type ToolContext, type ToolDefinition, type ToolResult } from './tool-definition.js';

/** Tools that replace or rewind the whole document can't be part of a batch. */
const NOT_BATCHABLE = new Set(['batch', 'create_document', 'undo', 'redo']);
const MAX_STEPS = 200;

interface Step {
  tool: ToolDefinition;
  input: Record<string, unknown>;
}

export function createBatchTool(tools: ToolDefinition[]): ToolDefinition {
  const batchable = tools.filter((tool) => !NOT_BATCHABLE.has(tool.name));
  const names = batchable.map((tool) => tool.name) as [string, ...string[]];

  return defineTool({
    name: 'batch',
    title: 'Batch',
    description: [
      'Runs many tool calls in order as ONE edit: much faster than calling them one by one.',
      'All-or-nothing: if any step fails, nothing is applied and the error says which step. It is a single undo step.',
      'Steps without layerId use the active layer, and add_layer makes its new layer active, so "add_layer then draw_*" just works.',
      'New layer ids are predictable: layer_<highest existing number + 1>.',
      `Not allowed inside a batch: ${[...NOT_BATCHABLE].join(', ')}.`,
      'Example: {"calls":[{"tool":"add_layer","input":{"name":"Sun"}},{"tool":"draw_ellipse","input":{"center":[400,300],"radiusX":80,"radiusY":80,"fill":"#fde047"}}]}',
    ].join(' '),
    input: {
      calls: z
        .array(
          z.object({
            tool: z.enum(names),
            input: z.record(z.string(), z.unknown()).default({}).describe('Same arguments as calling the tool directly'),
          }),
        )
        .min(1)
        .max(MAX_STEPS),
      label: z.string().optional().describe('Short name shown in the history, e.g. "draw logo"'),
    },
    async run({ calls, label }, ctx) {
      const steps = parseSteps(calls, batchable);
      const results = await ctx.engine.group(label ?? `batch (${steps.length} steps)`, ctx.source, () => runSteps(steps, ctx));
      return {
        text: results.map((result, i) => `${i + 1}. ${steps[i].tool.name}: ${result.text}`).join('\n'),
        image: results.findLast((result) => result.image)?.image,
        data: { results: results.map((result) => result.data ?? null) },
      };
    },
  });
}

/** Checks every step up front so the AI gets all input mistakes at once, before anything is drawn. */
function parseSteps(calls: { tool: string; input: Record<string, unknown> }[], tools: ToolDefinition[]): Step[] {
  const problems: string[] = [];
  const steps = calls.map((call, i) => {
    const tool = tools.find((t) => t.name === call.tool)!;
    try {
      return { tool, input: parseToolInput(tool, call.input) };
    } catch (error) {
      problems.push(`Step ${i + 1} (${call.tool}): ${describeError(error)}`);
      return null;
    }
  });
  if (problems.length > 0) throw new Error(`Invalid batch, nothing was applied.\n${problems.join('\n')}`);
  return steps as Step[];
}

async function runSteps(steps: Step[], ctx: ToolContext): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const [i, step] of steps.entries()) {
    try {
      results.push(await step.tool.run(step.input, ctx));
    } catch (error) {
      throw new Error(`Step ${i + 1} (${step.tool.name}) failed: ${describeError(error)}. Nothing was applied.`);
    }
  }
  return results;
}
