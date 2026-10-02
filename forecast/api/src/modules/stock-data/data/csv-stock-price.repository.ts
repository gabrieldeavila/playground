import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { StockPrice, StockPriceRepository } from '../domain/stock-price.js';

const HEADER = 'ticker,date,open,high,low,close,adjusted_close,volume';
const TICKER_PATTERN = /^[A-Z0-9.^_-]{1,20}$/;

@Injectable()
export class CsvStockPriceRepository implements StockPriceRepository {
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly dataDirectory = resolve(
    process.env.STOCK_DATA_DIR ?? '../forecast-ml/data/raw',
  );
  private readonly legacyFilePath = join(
    this.dataDirectory,
    'stock_prices.csv',
  );

  upsert(prices: StockPrice[]): Promise<void> {
    const operation = this.writeQueue.then(() => this.persist(prices));
    this.writeQueue = operation.catch(() => undefined);
    return operation;
  }

  private async persist(prices: StockPrice[]): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true });

    const pricesByTicker = new Map<string, StockPrice[]>();
    for (const price of prices) {
      const ticker = price.ticker.toUpperCase();
      if (!TICKER_PATTERN.test(ticker)) {
        throw new Error(
          `Ticker inválido para nome de arquivo: ${price.ticker}`,
        );
      }
      const tickerPrices = pricesByTicker.get(ticker) ?? [];
      tickerPrices.push({ ...price, ticker });
      pricesByTicker.set(ticker, tickerPrices);
    }

    for (const [ticker, tickerPrices] of pricesByTicker) {
      await this.persistTicker(ticker, tickerPrices);
    }
  }

  private async persistTicker(
    ticker: string,
    prices: StockPrice[],
  ): Promise<void> {
    const filePath = join(this.dataDirectory, `${ticker}.csv`);
    const rows = new Map<string, StockPrice>();

    try {
      const existing = await readFile(filePath, 'utf8');
      for (const price of parseCsv(existing, filePath)) {
        rows.set(price.date, price);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.loadLegacyTickerRows(ticker, rows);
    }

    for (const price of prices) {
      rows.set(price.date, price);
    }

    const sortedRows = [...rows.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
    const content = [HEADER, ...sortedRows.map(toCsvRow)].join('\n') + '\n';
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, content, 'utf8');
    await rename(temporaryPath, filePath);
  }

  private async loadLegacyTickerRows(
    ticker: string,
    rows: Map<string, StockPrice>,
  ): Promise<void> {
    try {
      const existing = await readFile(this.legacyFilePath, 'utf8');
      for (const price of parseCsv(existing, this.legacyFilePath)) {
        if (price.ticker === ticker) rows.set(price.date, price);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

function parseCsv(content: string, filePath: string): StockPrice[] {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== HEADER) {
    throw new Error(`Cabeçalho CSV inválido em ${filePath}`);
  }

  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [ticker, date, open, high, low, close, adjustedClose, volume] =
        line.split(',');
      if (
        !ticker ||
        !date ||
        [open, high, low, close, adjustedClose, volume].some(
          (value) => value === undefined || !Number.isFinite(Number(value)),
        )
      ) {
        throw new Error(`CSV existente inválido em ${filePath}`);
      }
      return {
        ticker,
        date,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        adjustedClose: Number(adjustedClose),
        volume: Number(volume),
      };
    });
}

function toCsvRow(price: StockPrice): string {
  return [
    price.ticker,
    price.date,
    price.open,
    price.high,
    price.low,
    price.close,
    price.adjustedClose,
    price.volume,
  ].join(',');
}
