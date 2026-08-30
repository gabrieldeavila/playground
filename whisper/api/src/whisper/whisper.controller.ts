import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';
import { nodewhisper } from 'nodejs-whisper';

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
    // const whisper = await nodewhisper(
    //   '/Users/gabrielavila/Downloads/audio.wav',
    //   {
    //     modelName: 'small',
    //     whisperOptions: {
    //       outputInText: true,
    //       outputInJson: true,
    //       outputInCsv: false,
    //       outputInSrt: false,
    //       outputInVtt: false,
    //       translateToEnglish: false,
    //     },
    //   },
    // );

    // console.log(whisper);

    const file = files.audio?.[0] ?? files.media?.[0];
    console.log(file);

    if (!file) {
      throw new BadRequestException(
        'Envie o arquivo no campo "audio" ou "media".',
      );
    }

    return this.whisperService.translate(file);
  }
}
