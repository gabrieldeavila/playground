import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type UploadedAudio, WhisperService } from './whisper.service';

// A 3-minute opus chunk is ~1.5 MB; this leaves room for longer chunks and
// less efficient codecs without letting a single request exhaust memory.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  transcribe(@UploadedFile() file?: UploadedAudio) {
    if (!file) {
      throw new BadRequestException('Envie o arquivo no campo "audio".');
    }

    return this.whisperService.transcribe(file);
  }
}
