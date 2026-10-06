import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { SummariesService } from './summaries.service';

type SummarizeBody = {
  transcript?: unknown;
  title?: unknown;
  documentId?: unknown;
};

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`Envie o campo "${field}" como texto.`);
  }

  return value.trim();
}

@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  // Without a documentId, the summary goes into a new document.
  @Post()
  summarize(@Body() body: SummarizeBody = {}) {
    return this.summariesService.summarizeToDoc({
      transcript: requireString(body.transcript, 'transcript'),
      title: requireString(body.title, 'title'),
      documentId:
        body.documentId === undefined
          ? undefined
          : requireString(body.documentId, 'documentId'),
    });
  }
}
