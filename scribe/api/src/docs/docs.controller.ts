import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { DocsService } from './docs.service';

type CreateBody = { title?: unknown; content?: unknown };
type AppendBody = { text?: unknown };
type ReplaceBody = { find?: unknown; replace?: unknown; matchCase?: unknown };

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value === '') {
    throw new BadRequestException(`Envie o campo "${field}" como texto.`);
  }

  return value;
}

@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Post()
  create(@Body() body: CreateBody = {}) {
    const title = requireString(body.title, 'title');
    const content =
      body.content === undefined
        ? undefined
        : requireString(body.content, 'content');

    return this.docsService.create(title, content);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.docsService.get(id);
  }

  @Post(':id/append')
  append(@Param('id') id: string, @Body() body: AppendBody = {}) {
    return this.docsService.append(id, requireString(body.text, 'text'));
  }

  @Post(':id/replace')
  replace(@Param('id') id: string, @Body() body: ReplaceBody = {}) {
    const find = requireString(body.find, 'find');

    // An empty replacement is valid: it deletes every match.
    if (typeof body.replace !== 'string') {
      throw new BadRequestException('Envie o campo "replace" como texto.');
    }

    return this.docsService.replace(
      id,
      find,
      body.replace,
      body.matchCase === true,
    );
  }
}
