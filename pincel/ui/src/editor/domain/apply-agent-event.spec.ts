import { describe, expect, it } from 'vitest';
import type { AgentEvent, ChatEntry } from './agent-events';
import { applyAgentEvent, settleRunningSteps } from './apply-agent-event';

const fold = (events: AgentEvent[], start: ChatEntry[] = []) => events.reduce(applyAgentEvent, start);

describe('applyAgentEvent', () => {
  it('follows a tool from being written to finished', () => {
    expect(
      fold([
        { type: 'tool-writing', name: 'batch' },
        { type: 'tool-call', name: 'batch', arguments: '{"calls":[]}' },
        { type: 'tool-result', name: 'batch', text: 'ok', isError: false },
      ]),
    ).toEqual([{ kind: 'tool', name: 'batch', arguments: '{"calls":[]}', status: 'done', result: 'ok' }]);
  });

  it('adds a running step when the provider does not stream', () => {
    expect(fold([{ type: 'tool-call', name: 'undo', arguments: '{}' }])).toEqual([
      { kind: 'tool', name: 'undo', arguments: '{}', status: 'running' },
    ]);
  });

  it('marks failed tools as errors', () => {
    const entries = fold([
      { type: 'tool-call', name: 'nope', arguments: '{}' },
      { type: 'tool-result', name: 'nope', text: 'Error: unknown tool', isError: true },
    ]);
    expect(entries[0]).toMatchObject({ status: 'error', result: 'Error: unknown tool' });
  });

  it('grows reasoning and draft text from deltas', () => {
    expect(
      fold([
        { type: 'reasoning-delta', text: 'Plan' },
        { type: 'reasoning-delta', text: 'ning' },
        { type: 'text-delta', text: 'Vou ' },
        { type: 'text-delta', text: 'criar' },
      ]),
    ).toEqual([
      { kind: 'reasoning', text: 'Planning' },
      { kind: 'draft', text: 'Vou criar' },
    ]);
  });

  it('replaces the streamed draft with the final text, keeping its place before the tools', () => {
    expect(
      fold([
        { type: 'text-delta', text: 'Vou criar' },
        { type: 'tool-writing', name: 'batch' },
        { type: 'thinking', text: 'Vou criar o pôster.' },
      ]),
    ).toEqual([
      { kind: 'thinking', text: 'Vou criar o pôster.' },
      { kind: 'tool', name: 'batch', arguments: '', status: 'writing' },
    ]);
  });

  it('appends replies and errors when nothing was streamed', () => {
    expect(
      fold([
        { type: 'reply', text: 'Pronto', stoppedAtLimit: false },
        { type: 'error', text: '400' },
      ]),
    ).toEqual([
      { kind: 'reply', text: 'Pronto', stoppedAtLimit: false },
      { kind: 'error', text: '400' },
    ]);
  });
});

describe('settleRunningSteps', () => {
  it('marks unfinished steps as stopped and keeps streamed text', () => {
    expect(
      settleRunningSteps([
        { kind: 'draft', text: 'Vou' },
        { kind: 'tool', name: 'batch', arguments: '', status: 'writing' },
        { kind: 'tool', name: 'render_image', arguments: '{}', status: 'running' },
      ]),
    ).toEqual([
      { kind: 'thinking', text: 'Vou' },
      { kind: 'tool', name: 'batch', arguments: '', status: 'error', result: 'Stopped' },
      { kind: 'tool', name: 'render_image', arguments: '{}', status: 'error', result: 'Stopped' },
    ]);
  });
});
