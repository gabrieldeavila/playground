import { Injectable } from '@nestjs/common';
import { MarketDataProvider, StockPrice } from '../domain/stock-price.js';

@Injectable()
export class YahooFinanceAdapter implements MarketDataProvider {
  async fetchDailyPrices(
    ticker: string,
    startDate: string,
    endDate: string,
  ): Promise<StockPrice[]> {
    const period1 = Math.floor(
      new Date(`${startDate}T00:00:00Z`).getTime() / 1000,
    );
    const period2 = Math.floor(
      (new Date(`${endDate}T00:00:00Z`).getTime() + 86_400_000) / 1000,
    );
    const url = new URL(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
    );
    url.searchParams.set('period1', String(period1));
    url.searchParams.set('period2', String(period2));
    url.searchParams.set('interval', '1d');
    url.searchParams.set('events', 'div,splits');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance respondeu com HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    const chart = record(record(payload)?.chart);
    if (!chart) throw new Error(`Resposta inválida para o ticker ${ticker}`);

    const chartError = record(chart.error);
    if (chartError) {
      throw new Error(
        typeof chartError.description === 'string'
          ? chartError.description
          : 'Yahoo Finance não retornou os dados solicitados',
      );
    }

    const result = Array.isArray(chart.result)
      ? record(chart.result[0])
      : undefined;
    const indicators = record(result?.indicators);
    const quote = Array.isArray(indicators?.quote)
      ? record(indicators.quote[0])
      : undefined;
    const timestamps = result?.timestamp;
    if (
      !Array.isArray(timestamps) ||
      !timestamps.every(
        (value) => typeof value === 'number' && Number.isFinite(value),
      ) ||
      !quote
    ) {
      throw new Error(`Resposta inválida para o ticker ${ticker}`);
    }

    const open = numberArray(quote.open);
    const high = numberArray(quote.high);
    const low = numberArray(quote.low);
    const close = numberArray(quote.close);
    const volume = numberArray(quote.volume);
    const adjustedIndicators = Array.isArray(indicators?.adjclose)
      ? record(indicators.adjclose[0])
      : undefined;
    const adjustedClose = adjustedIndicators
      ? numberArray(adjustedIndicators.adjclose)
      : close;

    if (!open || !high || !low || !close || !volume || !adjustedClose) {
      throw new Error(`Séries de preços inválidas para o ticker ${ticker}`);
    }

    return timestamps.flatMap((timestamp, index) => {
      const values = [
        open[index],
        high[index],
        low[index],
        close[index],
        adjustedClose[index],
        volume[index],
      ];
      if (values.some((value) => value == null)) return [];

      const [dayOpen, dayHigh, dayLow, dayClose, dayAdjustedClose, dayVolume] =
        values;
      return [
        {
          ticker,
          date: new Date(timestamp * 1000).toISOString().slice(0, 10),
          open: dayOpen as number,
          high: dayHigh as number,
          low: dayLow as number,
          close: dayClose as number,
          adjustedClose: dayAdjustedClose as number,
          volume: dayVolume as number,
        },
      ];
    });
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function numberArray(value: unknown): Array<number | null> | undefined {
  if (!Array.isArray(value)) return undefined;
  const values: unknown[] = value;
  if (
    !values.every(
      (item) =>
        item === null || (typeof item === 'number' && Number.isFinite(item)),
    )
  ) {
    return undefined;
  }
  return values as Array<number | null>;
}
