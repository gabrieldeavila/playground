import { Injectable } from '@nestjs/common';

@Injectable()
export class WhisperService {
  findAll() {
    return `This action returns all whisper`;
  }

  findOne(id: number) {
    return `This action returns a #${id} whisper`;
  }

  remove(id: number) {
    return `This action removes a #${id} whisper`;
  }
}
