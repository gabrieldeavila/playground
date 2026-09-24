import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MarketCandle,
  MarketData,
  MarketDataPeriod,
  MarketDataRepository,
  MarketInterval,
  TickerSuggestion,
} from '../domain/market-data.repository';

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
  }>;
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { description?: string } | null;
  };
}

interface YahooChartResult {
  meta?: {
    symbol?: string;
    exchangeName?: string;
    currency?: string;
    exchangeTimezoneName?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
}

@Injectable()
export class YahooFinanceRepository implements MarketDataRepository {
  async searchTickers(query: string): Promise<TickerSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      quotesCount: '10',
      newsCount: '0',
    });

    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance respondeu com HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as YahooSearchResponse;
      const suggestions = (payload.quotes ?? [])
        .map((quote) => {
          const label = quote.longname ?? quote.shortname;
          const value = quote.symbol;

          if (!label?.trim() || !value?.trim()) return null;

          return { label: label.trim(), value: value.trim() };
        })
        .filter(
          (suggestion): suggestion is TickerSuggestion => suggestion !== null,
        );

      return [
        ...new Map(
          suggestions.map((suggestion) => [
            suggestion.value.toLowerCase(),
            suggestion,
          ]),
        ).values(),
      ];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'Não foi possível buscar tickers no Yahoo Finance.',
      );
    }
  }

  async getCandles(
    symbol: string,
    period: MarketDataPeriod,
    interval: MarketInterval,
  ): Promise<MarketData> {
    const isDatePeriod = 'from' in period && 'to' in period;
    const datePeriod = isDatePeriod
      ? (period as { from: Date; to: Date })
      : null;
    const params = new URLSearchParams({
      interval,
      events: 'div,splits',
      includePrePost: 'false',
      ...(isDatePeriod
        ? {
            period1: Math.floor(datePeriod!.from.getTime() / 1000).toString(),
            // Yahoo trata period2 como exclusivo; somamos 1 segundo para incluir o limite informado.
            period2: (
              Math.floor(datePeriod!.to.getTime() / 1000) + 1
            ).toString(),
          }
        : { range: period.range }),
      ...(interval === '1d' || interval === '1wk' || interval === '1mo'
        ? {}
        : { includeTimestamps: 'true' }),
    });

    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance respondeu com HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as YahooChartResponse;
      const result = payload.chart?.result?.[0];
      if (!result) {
        throw new UnprocessableEntityException(
          'O período ou ticker solicitado não está disponível no Yahoo Finance.',
        );
      }

      const quote = result.indicators?.quote?.[0];
      const candles = (result.timestamp ?? [])
        .map((time, index) => ({
          time,
          open: quote?.open?.[index] ?? null,
          high: quote?.high?.[index] ?? null,
          low: quote?.low?.[index] ?? null,
          close: quote?.close?.[index] ?? null,
          volume: quote?.volume?.[index] ?? 0,
        }))
        .filter(
          (candle): candle is MarketCandle =>
            candle.open !== null &&
            candle.high !== null &&
            candle.low !== null &&
            candle.close !== null &&
            (!isDatePeriod ||
              (candle.time * 1000 >= datePeriod!.from.getTime() &&
                candle.time * 1000 <= datePeriod!.to.getTime())),
        )
        .sort((a, b) => a.time - b.time);

      return {
        symbol: result.meta?.symbol ?? symbol,
        exchange: result.meta?.exchangeName ?? null,
        currency: result.meta?.currency ?? null,
        timezone: result.meta?.exchangeTimezoneName ?? null,
        range: isDatePeriod ? null : period.range,
        interval,
        ...(isDatePeriod
          ? {
              from: datePeriod!.from.toISOString(),
              to: datePeriod!.to.toISOString(),
            }
          : {}),
        candles,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        `Não foi possível obter dados de ${symbol} no Yahoo Finance.`,
      );
    }
  }
}
