import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MarketData,
  MarketDataPeriod,
  MarketDataRepository,
  TickerSuggestion,
  MarketInterval,
  MarketRange,
} from './market-data.repository';

export const MAX_CANDLES_PER_REQUEST = 10_000;

const ranges: MarketRange[] = [
  '1d',
  '5d',
  '1mo',
  '3mo',
  '6mo',
  '1y',
  '2y',
  '5y',
  '10y',
  'max',
];

const intervals: MarketInterval[] = [
  '1m',
  '2m',
  '5m',
  '15m',
  '30m',
  '60m',
  '90m',
  '1h',
  '1d',
  '5d',
  '1wk',
  '1mo',
  '3mo',
];

const intervalSeconds: Record<MarketInterval, number> = {
  '1m': 60,
  '2m': 120,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '60m': 3600,
  '90m': 5400,
  '1h': 3600,
  '1d': 86400,
  '5d': 432000,
  '1wk': 604800,
  '1mo': 2592000,
  '3mo': 7776000,
};

interface CandleQuery {
  range?: string;
  from?: string;
  to?: string;
  interval?: string;
}

export class MarketDataUseCase {
  constructor(private readonly repository: MarketDataRepository) {}

  searchTickers(query: string): Promise<TickerSuggestion[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 1 || normalizedQuery.length > 50) {
      throw new BadRequestException('Busca inválida.');
    }

    return this.repository.searchTickers(normalizedQuery);
  }

  async execute(symbol: string, query: CandleQuery): Promise<MarketData> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!/^[A-Z0-9^._=-]{1,20}$/.test(normalizedSymbol)) {
      throw new BadRequestException('Ticker inválido.');
    }

    const interval = query.interval ?? '5m';
    if (!intervals.includes(interval as MarketInterval)) {
      throw new BadRequestException(
        `interval inválido. Valores permitidos: ${intervals.join(', ')}.`,
      );
    }

    const hasFrom = query.from !== undefined;
    const hasTo = query.to !== undefined;
    let period: MarketDataPeriod;

    if (hasFrom || hasTo) {
      if (!hasFrom || !hasTo) {
        throw new BadRequestException('Informe from e to juntos.');
      }
      if (query.range !== undefined) {
        throw new BadRequestException(
          'Use range ou from/to; os dois formatos não podem ser combinados.',
        );
      }

      const from = parseDate(query.from!, 'from', false);
      const to = parseDate(query.to!, 'to', true);
      if (from.getTime() >= to.getTime()) {
        throw new BadRequestException('from deve ser anterior a to.');
      }

      const estimatedCandles =
        Math.ceil(
          (to.getTime() - from.getTime()) /
            1000 /
            intervalSeconds[interval as MarketInterval],
        ) + 1;
      if (estimatedCandles > MAX_CANDLES_PER_REQUEST) {
        throw new BadRequestException(
          `O período excede o limite de ${MAX_CANDLES_PER_REQUEST} candles para este interval.`,
        );
      }

      validateProviderPeriod(from, to, interval as MarketInterval);
      period = { from, to };
    } else {
      const range = query.range ?? '1d';
      if (!ranges.includes(range as MarketRange)) {
        throw new BadRequestException(
          `range inválido. Valores permitidos: ${ranges.join(', ')}.`,
        );
      }
      period = { range: range as MarketRange };
    }

    const data = await this.repository.getCandles(
      normalizedSymbol,
      period,
      interval as MarketInterval,
    );

    if (data.candles.length === 0) {
      throw new NotFoundException(
        'Nenhum candle disponível para o ativo, período e intervalo informados.',
      );
    }

    if (data.candles.length > MAX_CANDLES_PER_REQUEST) {
      throw new UnprocessableEntityException(
        `O provedor retornou mais de ${MAX_CANDLES_PER_REQUEST} candles para a consulta.`,
      );
    }

    return data;
  }
}

function parseDate(value: string, name: string, endOfDate: boolean): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isoDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/i.test(
      value,
    );

  if (!dateOnly && !isoDateTime) {
    throw new BadRequestException(
      `${name} deve ser uma data YYYY-MM-DD ou timestamp ISO 8601 com fuso horário.`,
    );
  }

  const parsed = new Date(value);
  if (
    Number.isNaN(parsed.getTime()) ||
    (parsed.toISOString().slice(0, 10) !== value.slice(0, 10) && dateOnly)
  ) {
    throw new BadRequestException(`${name} contém uma data inválida.`);
  }

  if (dateOnly && endOfDate) {
    parsed.setUTCHours(23, 59, 59, 999);
  }

  return parsed;
}

function validateProviderPeriod(
  from: Date,
  to: Date,
  interval: MarketInterval,
): void {
  const durationMs = to.getTime() - from.getTime();
  const maxDurationMs =
    interval === '1m'
      ? 7 * 24 * 60 * 60 * 1000
      : ['2m', '5m', '15m', '30m', '60m', '90m', '1h'].includes(interval)
        ? 60 * 24 * 60 * 60 * 1000
        : null;

  if (maxDurationMs !== null && durationMs > maxDurationMs) {
    const limit = interval === '1m' ? '7 dias' : '60 dias';
    throw new UnprocessableEntityException(
      `O Yahoo Finance disponibiliza no máximo ${limit} para o interval ${interval}.`,
    );
  }

  if (from.getTime() > Date.now()) {
    throw new UnprocessableEntityException(
      'O período solicitado ainda não está disponível.',
    );
  }
}
