import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ListSignals } from '../domain/list-signals.js';
import type { SignalRefreshRunner } from '../domain/signal-snapshot.js';

export const SIGNAL_REFRESH_RUNNER = 'SIGNAL_REFRESH_RUNNER';

@Controller('signals')
export class SignalsController {
  constructor(
    private readonly listSignals: ListSignals,
    @Inject(SIGNAL_REFRESH_RUNNER)
    private readonly refreshRunner: SignalRefreshRunner,
  ) {}

  @Get()
  async list() {
    const result = await this.listSignals.execute();
    if (!result) throw snapshotMissing();
    return result;
  }

  @Get('refresh')
  refreshStatus() {
    return this.refreshRunner.status();
  }

  @Post('refresh')
  @HttpCode(202)
  refresh(@Body() body: unknown) {
    const download =
      typeof body === 'object' &&
      body !== null &&
      (body as Record<string, unknown>).download === true;
    return this.refreshRunner.start({ download });
  }

  @Get(':ticker')
  async ticker(@Param('ticker') ticker: string) {
    if (!/^[a-zA-Z0-9.^_-]{1,20}$/.test(ticker)) {
      throw new BadRequestException('Ticker inválido');
    }
    const result = await this.listSignals.findTicker(ticker);
    if (!result) {
      throw new NotFoundException(`Sem sinais para ${ticker.toUpperCase()}`);
    }
    return result;
  }
}

function snapshotMissing() {
  return new NotFoundException(
    'Snapshot de sinais ainda não gerado; chame POST /signals/refresh',
  );
}
