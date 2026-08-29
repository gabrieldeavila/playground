import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WhisperService } from './whisper.service';

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Get()
  findAll() {
    return this.whisperService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whisperService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whisperService.remove(+id);
  }
}
