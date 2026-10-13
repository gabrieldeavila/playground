import { describe, expect, it } from 'vitest';
import type { ChatMessage } from './chat-message.js';
import { DROPPED_IMAGE_TEXT, dropOldImages } from './drop-old-images.js';

const image = (url: string) => ({ type: 'image_url' as const, image_url: { url } });

describe('dropOldImages', () => {
  it('keeps only the newest images', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'faz um pôster' },
      { role: 'user', content: [image('old')] },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: [image('middle'), image('new')] },
    ];

    expect(dropOldImages(messages, 2)).toEqual([
      { role: 'user', content: 'faz um pôster' },
      { role: 'user', content: [{ type: 'text', text: DROPPED_IMAGE_TEXT }] },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: [image('middle'), image('new')] },
    ]);
  });

  it('leaves the history alone when there are few images', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: [image('only')] }];
    expect(dropOldImages(messages, 2)).toEqual(messages);
  });
});
