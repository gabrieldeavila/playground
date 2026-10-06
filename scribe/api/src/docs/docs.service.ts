import { Injectable } from '@nestjs/common';
import { docs, type docs_v1 } from '@googleapis/docs';
import { GoogleAuthService } from '../google/google-auth.service';
import { buildAppendRequests, type DocBlock } from './doc-blocks';
import { extractText } from './extract-text';
import { toHttpError } from './google-errors';

const docUrl = (id: string) => `https://docs.google.com/document/d/${id}/edit`;

@Injectable()
export class DocsService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  async get(documentId: string) {
    const document = await this.fetch(documentId);

    return {
      id: documentId,
      title: document.title,
      url: docUrl(documentId),
      text: extractText(document.body?.content),
    };
  }

  async create(title: string, content?: string) {
    const { data } = await this.call((api) =>
      api.documents.create({ requestBody: { title } }),
    );
    const id = data.documentId!;

    if (content) {
      // A new document is a single empty paragraph; index 1 is its start.
      await this.batchUpdate(id, [
        { insertText: { location: { index: 1 }, text: content } },
      ]);
    }

    return { id, title: data.title, url: docUrl(id) };
  }

  async append(documentId: string, text: string) {
    const document = await this.fetch(documentId);
    const isEmpty = extractText(document.body?.content).trim() === '';

    // Text inserted at the end of the body lands before its final newline,
    // so it needs its own line break to start a new paragraph.
    await this.batchUpdate(documentId, [
      {
        insertText: {
          endOfSegmentLocation: {},
          text: isEmpty ? text : `\n${text}`,
        },
      },
    ]);

    return { id: documentId, url: docUrl(documentId) };
  }

  async appendBlocks(documentId: string, blocks: DocBlock[]) {
    const document = await this.fetch(documentId);
    const bodyEnd = document.body?.content?.at(-1)?.endIndex ?? 2;
    const insertAt = bodyEnd - 1;

    // A blank document is a single empty paragraph starting at index 1;
    // anything past that needs a line break to start a new paragraph.
    await this.batchUpdate(
      documentId,
      buildAppendRequests(blocks, insertAt, insertAt > 1),
    );

    return { id: documentId, url: docUrl(documentId) };
  }

  async replace(
    documentId: string,
    find: string,
    replaceWith: string,
    matchCase: boolean,
  ) {
    const { replies } = await this.batchUpdate(documentId, [
      {
        replaceAllText: {
          containsText: { text: find, matchCase },
          replaceText: replaceWith,
        },
      },
    ]);

    return {
      id: documentId,
      url: docUrl(documentId),
      occurrences: replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0,
    };
  }

  private async fetch(documentId: string) {
    const { data } = await this.call((api) =>
      api.documents.get({ documentId }),
    );

    return data;
  }

  private async batchUpdate(
    documentId: string,
    requests: docs_v1.Schema$Request[],
  ) {
    const { data } = await this.call((api) =>
      api.documents.batchUpdate({ documentId, requestBody: { requests } }),
    );

    return data;
  }

  private async call<T>(request: (api: docs_v1.Docs) => Promise<T>) {
    const api = docs({ version: 'v1', auth: this.googleAuth.getClient() });

    try {
      return await request(api);
    } catch (error) {
      throw toHttpError(error);
    }
  }
}
