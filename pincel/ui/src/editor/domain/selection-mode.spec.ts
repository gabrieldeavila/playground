import { describe, expect, it } from 'vitest';
import { selectionModeFromKeys } from './selection-mode';

describe('selectionModeFromKeys', () => {
  it('maps Photoshop modifiers to selection modes', () => {
    expect(selectionModeFromKeys({ shift: false, alt: false })).toBe('replace');
    expect(selectionModeFromKeys({ shift: true, alt: false })).toBe('add');
    expect(selectionModeFromKeys({ shift: false, alt: true })).toBe('subtract');
    expect(selectionModeFromKeys({ shift: true, alt: true })).toBe('intersect');
  });
});
