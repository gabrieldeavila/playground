import type { docs_v1 } from '@googleapis/docs';

export type DocBlock = {
  text: string;
  style: 'NORMAL_TEXT' | 'HEADING_2' | 'HEADING_3';
  bullet?: boolean;
};

// Builds the batchUpdate that writes `blocks` as new paragraphs at
// `insertAt`, the index right before the body's final newline. Each block
// must be a single line: Docs counts every "\n" as a paragraph break.
export function buildAppendRequests(
  blocks: DocBlock[],
  insertAt: number,
  startsNewParagraph: boolean,
): docs_v1.Schema$Request[] {
  const prefix = startsNewParagraph ? '\n' : '';
  const text = prefix + blocks.map((block) => block.text).join('\n');
  const start = insertAt + prefix.length;
  // The last block reuses the body's final newline, which shifts past it.
  const range = { startIndex: start, endIndex: insertAt + text.length + 1 };

  const requests: docs_v1.Schema$Request[] = [
    { insertText: { location: { index: insertAt }, text } },
    // Inserted text and paragraphs inherit the style around them (bold, a
    // heading, a list item), so reset everything before styling each block.
    { updateTextStyle: { range, textStyle: {}, fields: '*' } },
    {
      updateParagraphStyle: {
        range,
        paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        fields: 'namedStyleType',
      },
    },
    { deleteParagraphBullets: { range } },
  ];

  let cursor = start;
  for (const block of blocks) {
    const blockRange = {
      startIndex: cursor,
      endIndex: cursor + block.text.length + 1,
    };

    if (block.style !== 'NORMAL_TEXT') {
      requests.push({
        updateParagraphStyle: {
          range: blockRange,
          paragraphStyle: { namedStyleType: block.style },
          fields: 'namedStyleType',
        },
      });
    }

    if (block.bullet) {
      requests.push({
        createParagraphBullets: {
          range: blockRange,
          bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
        },
      });
    }

    cursor = blockRange.endIndex;
  }

  return requests;
}
