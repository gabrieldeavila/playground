import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Post('translate')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audio', maxCount: 1 },
      { name: 'media', maxCount: 1 },
    ]),
  )
  async translate(
    @UploadedFiles()
    files: {
      audio?: any[];
      media?: any[];
    },
  ) {
    const file = files.audio?.[0] ?? files.media?.[0];

    if (!file) {
      throw new BadRequestException(
        'Envie o arquivo no campo "audio" ou "media".',
      );
    }

    return this.whisperService.translate(file);
  }
}
