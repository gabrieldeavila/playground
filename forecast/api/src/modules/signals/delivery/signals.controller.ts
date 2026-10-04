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
  Query,
} from '@nestjs/common';
import { ListSignals } from '../domain/list-signals.js';
import {
  TIMEFRAMES,
  type SignalRefreshRunner,
  type Timeframe,
} from '../domain/signal-snapshot.js';

export const SIGNAL_REFRESH_RUNNER = 'SIGNAL_REFRESH_RUNNER';

@Controller('signals')
export class SignalsController {
  constructor(
    private readonly listSignals: ListSignals,
    @Inject(SIGNAL_REFRESH_RUNNER)
    private readonly refreshRunner: SignalRefreshRunner,
  ) {}

  @Get()
  async list(@Query('timeframe') timeframe?: string) {
    const result = await this.listSignals.execute(parseTimeframe(timeframe));
    if (!result) throw snapshotMissing();
    return result;
  }

  @Get('tickers')
  async tickers(@Query('timeframe') timeframe?: string) {
    const result = await this.listSignals.listTickers(
      parseTimeframe(timeframe),
    );
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
  async ticker(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe?: string,
  ) {
    if (!/^[a-zA-Z0-9.^_-]{1,20}$/.test(ticker)) {
      throw new BadRequestException('Ticker inválido');
    }
    const result = await this.listSignals.findTicker(
      ticker,
      parseTimeframe(timeframe),
    );
    if (!result) {
      throw new NotFoundException(`Sem sinais para ${ticker.toUpperCase()}`);
    }
    return result;
  }
}

function parseTimeframe(value = 'daily'): Timeframe {
  if (!(TIMEFRAMES as readonly string[]).includes(value)) {
    throw new BadRequestException(
      `timeframe deve ser ${TIMEFRAMES.join(' ou ')}`,
    );
  }
  return value as Timeframe;
}

function snapshotMissing() {
  return new NotFoundException(
    'Snapshot de sinais ainda não gerado; chame POST /signals/refresh',
  );
}
