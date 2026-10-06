import type { DocBlock } from '../docs/doc-blocks';
import type { Summary } from './summary.schema';

// Docs turns every "\n" into a paragraph break, so each item becomes one line.
const singleLine = (text: string) => text.replace(/\s+/g, ' ').trim();

export function summaryToBlocks(heading: string, summary: Summary): DocBlock[] {
  const bullets = (items: string[]): DocBlock[] =>
    items
      .map(singleLine)
      .filter(Boolean)
      .map((text) => ({ text, style: 'NORMAL_TEXT', bullet: true }));

  const blocks: DocBlock[] = [
    { text: singleLine(heading), style: 'HEADING_2' },
    { text: singleLine(summary.overview), style: 'NORMAL_TEXT' },
  ];

  const keyPoints = bullets(summary.keyPoints);
  if (keyPoints.length > 0) {
    blocks.push(
      { text: 'Pontos principais', style: 'HEADING_3' },
      ...keyPoints,
    );
  }

  const nextSteps = bullets(summary.nextSteps);
  if (nextSteps.length > 0) {
    blocks.push({ text: 'Próximos passos', style: 'HEADING_3' }, ...nextSteps);
  }

  return blocks;
}
