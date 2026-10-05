import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { nodewhisper } from 'nodejs-whisper';
import { cleanTranscript } from './clean-transcript';
import { SerialQueue } from './serial-queue';

const execFileAsync = promisify(execFile);

export type UploadedAudio = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private readonly queue = new SerialQueue();

  constructor(private readonly config: ConfigService) {}

  transcribe(file: UploadedAudio) {
    return this.queue.run(() => this.runTranscription(file));
  }

  private async runTranscription(file: UploadedAudio) {
    const tempDir = await mkdtemp(join(tmpdir(), 'whisper-'));
    // Never put client-provided names in paths: they end up in shell commands.
    const inputPath = join(tempDir, 'input');
    const wavPath = join(tempDir, 'audio.wav');
    const model = this.config.get<string>('WHISPER_MODEL', 'small');
    const startedAt = Date.now();

    try {
      await writeFile(inputPath, file.buffer);

      await execFileAsync('ffmpeg', [
        '-nostats',
        '-loglevel',
        'error',
        '-y',
        '-i',
        inputPath,
        '-ar',
        '16000',
        '-ac',
        '1',
        '-c:a',
        'pcm_s16le',
        wavPath,
      ]);

      const raw = await nodewhisper(wavPath, {
        modelName: model,
        autoDownloadModelName: model,
        modelRootPath: this.config.get<string>('WHISPER_MODEL_DIR'),
        logger: {
          debug: () => undefined,
          log: () => undefined,
          error: (...args: unknown[]) => this.logger.error(args.join(' ')),
        },
        whisperOptions: {
          outputInText: false,
          translateToEnglish: false,
          language: this.config.get<string>('WHISPER_LANGUAGE', 'pt'),
        },
      });

      const text = cleanTranscript(raw);

      this.logger.log(
        `Transcribed ${file.size} bytes (${file.mimetype}) in ${Date.now() - startedAt}ms`,
      );

      return { text };
    } catch (error) {
      this.logger.error(
        'Failed to transcribe audio',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Falha ao processar o arquivo com Whisper.',
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
