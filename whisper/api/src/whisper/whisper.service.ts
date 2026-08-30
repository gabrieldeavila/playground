import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { writeFile, mkdtemp, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { nodewhisper } from 'nodejs-whisper';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class WhisperService {
  async translate(file: any) {
    if (!file) {
      throw new BadRequestException('Arquivo de áudio/vídeo não enviado.');
    }

    const id = randomUUID();
    const tempDir = await mkdtemp(join(tmpdir(), 'whisper-'));
    const tempFilePath = join(tempDir, `${id}-${file.originalname}`);
    const wavFilePath = join(tempDir, `${id}-pronto-para-whisper.wav`);

    console.log({ file: file.buffer, tempFilePath });

    try {
      console.log('Escrevendo arquivo temporário:', tempFilePath);

      await writeFile(tempFilePath, file.buffer);

      await execAsync(
        `ffmpeg -y -i "${tempFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavFilePath}"`,
      );

      const whisper = await nodewhisper(wavFilePath, {
        modelName: 'small',
        whisperOptions: {
          outputInText: true,
          outputInJson: true,
          outputInCsv: false,
          outputInSrt: false,
          outputInVtt: false,
          translateToEnglish: false,
        },
      });

      return {
        message: 'Arquivo processado com sucesso.',
        filename: file.originalname,
        mimetype: file.mimetype,
        result: whisper,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao processar o arquivo com Whisper.',
      );
    } finally {
      await unlink(tempFilePath).catch(() => undefined);
    }
  }
}
