import { buildAppendRequests, type DocBlock } from './doc-blocks';

const blocks: DocBlock[] = [
  { text: 'Resumo', style: 'HEADING_2' },
  { text: 'Visão geral', style: 'NORMAL_TEXT' },
  { text: 'Ponto', style: 'NORMAL_TEXT', bullet: true },
];

describe('buildAppendRequests', () => {
  it('starts a new paragraph after existing content', () => {
    // Body "Hello\n": the final newline sits at index 6.
    const [insert, textStyle] = buildAppendRequests(blocks, 6, true);

    expect(insert.insertText).toEqual({
      location: { index: 6 },
      text: '\nResumo\nVisão geral\nPonto',
    });
    // "Hello\nResumo\nVisão geral\nPonto\n" ends at index 32.
    expect(textStyle.updateTextStyle?.range).toEqual({
      startIndex: 7,
      endIndex: 32,
    });
  });

  it('writes straight into an empty document', () => {
    const [insert, textStyle] = buildAppendRequests(blocks, 1, false);

    expect(insert.insertText?.text).toBe('Resumo\nVisão geral\nPonto');
    expect(textStyle.updateTextStyle?.range).toEqual({
      startIndex: 1,
      endIndex: 26,
    });
  });

  it('styles each block over its own paragraph', () => {
    const requests = buildAppendRequests(blocks, 1, false);

    expect(requests.slice(4)).toEqual([
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 8 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      },
      {
        createParagraphBullets: {
          range: { startIndex: 20, endIndex: 26 },
          bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
        },
      },
    ]);
  });
});
