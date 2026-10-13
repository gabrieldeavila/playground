import { describe, expect, it } from 'vitest';
import { stripProviderOutput } from './strip-provider-output.js';

describe('stripProviderOutput', () => {
  it('removes Responses API items from assistant messages', () => {
    expect(
      stripProviderOutput([
        { role: 'user', content: 'oi' },
        { role: 'assistant', content: 'olá', providerOutput: [{ type: 'reasoning' }] },
      ]),
    ).toEqual([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá' },
    ]);
  });
});
