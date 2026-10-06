import type { docs_v1 } from '@googleapis/docs';

// Flattens a document body into plain text. Every paragraph already ends with
// "\n", and table cells are read row by row.
export function extractText(
  content: docs_v1.Schema$StructuralElement[] = [],
): string {
  return content
    .map((element) => {
      if (element.paragraph) {
        return (element.paragraph.elements ?? [])
          .map((part) => part.textRun?.content ?? '')
          .join('');
      }

      if (element.table) {
        return (element.table.tableRows ?? [])
          .flatMap((row) => row.tableCells ?? [])
          .map((cell) => extractText(cell.content))
          .join('');
      }

      if (element.tableOfContents) {
        return extractText(element.tableOfContents.content);
      }

      return '';
    })
    .join('');
}
