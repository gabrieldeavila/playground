import type { docs_v1 } from '@googleapis/docs';
import { extractText } from './extract-text';

const paragraph = (...runs: string[]): docs_v1.Schema$StructuralElement => ({
  paragraph: { elements: runs.map((content) => ({ textRun: { content } })) },
});

describe('extractText', () => {
  it('returns an empty string for a missing body', () => {
    expect(extractText(undefined)).toBe('');
  });

  it('joins the text runs of each paragraph', () => {
    expect(
      extractText([paragraph('Olá, ', 'mundo\n'), paragraph('Fim\n')]),
    ).toBe('Olá, mundo\nFim\n');
  });

  it('ignores section breaks and non-text elements', () => {
    expect(
      extractText([
        { sectionBreak: {} },
        {
          paragraph: {
            elements: [
              { inlineObjectElement: {} },
              { textRun: { content: 'A\n' } },
            ],
          },
        },
      ]),
    ).toBe('A\n');
  });

  it('reads table cells row by row', () => {
    expect(
      extractText([
        {
          table: {
            tableRows: [
              {
                tableCells: [
                  { content: [paragraph('a\n')] },
                  { content: [paragraph('b\n')] },
                ],
              },
              { tableCells: [{ content: [paragraph('c\n')] }] },
            ],
          },
        },
      ]),
    ).toBe('a\nb\nc\n');
  });
});
