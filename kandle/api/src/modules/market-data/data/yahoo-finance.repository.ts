import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  MarketCandle,
  MarketData,
  MarketDataRepository,
  MarketInterval,
  MarketRange,
} from '../domain/market-data.repository';

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
  async getCandles(
    symbol: string,
    range: MarketRange,
    interval: MarketInterval,
  ): Promise<MarketData> {
    const params = new URLSearchParams({
      range,
      interval,
      events: 'div,splits',
      includePrePost: 'false',
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
        throw new Error(
          payload.chart?.error?.description ?? 'Ticker não encontrado.',
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
            candle.close !== null,
        );

      return {
        symbol: result.meta?.symbol ?? symbol,
        exchange: result.meta?.exchangeName ?? null,
        currency: result.meta?.currency ?? null,
        timezone: result.meta?.exchangeTimezoneName ?? null,
        range,
        interval,
        candles,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        `Não foi possível obter dados de ${symbol} no Yahoo Finance.`,
      );
    }
  }
}
