import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CsvStockPriceRepository } from './csv-stock-price.repository.js';

const HEADER = 'ticker,date,open,high,low,close,adjusted_close,volume';

const price = (ticker: string, date: string, close: number) => ({
  ticker,
  date,
  open: close,
  high: close,
  low: close,
  close,
  adjustedClose: close,
  volume: 1000,
});

describe('CsvStockPriceRepository', () => {
  let dataDirectory: string;
  let previousDataDirectory: string | undefined;

  beforeEach(async () => {
    previousDataDirectory = process.env.STOCK_DATA_DIR;
    dataDirectory = await mkdtemp(join(tmpdir(), 'stock-data-'));
    process.env.STOCK_DATA_DIR = dataDirectory;
  });

  afterEach(async () => {
    if (previousDataDirectory === undefined) {
      delete process.env.STOCK_DATA_DIR;
    } else {
      process.env.STOCK_DATA_DIR = previousDataDirectory;
    }
    await rm(dataDirectory, { recursive: true, force: true });
  });

  it('grava um arquivo por ticker e atualiza linhas pela data', async () => {
    const repository = new CsvStockPriceRepository();
    await repository.upsert([
      price('AAPL', '2024-01-02', 100),
      price('MSFT', '2024-01-02', 200),
    ]);
    await repository.upsert([price('AAPL', '2024-01-02', 110)]);

    const apple = await readFile(join(dataDirectory, 'AAPL.csv'), 'utf8');
    const microsoft = await readFile(join(dataDirectory, 'MSFT.csv'), 'utf8');

    expect(apple).toBe(`${HEADER}\nAAPL,2024-01-02,110,110,110,110,110,1000\n`);
    expect(microsoft).toBe(
      `${HEADER}\nMSFT,2024-01-02,200,200,200,200,200,1000\n`,
    );
  });

  it('importa as linhas do ticker do CSV legado na primeira gravação', async () => {
    const legacyRows = [
      price('AAPL', '2024-01-02', 100),
      price('MSFT', '2024-01-02', 200),
    ].map((row) =>
      [
        row.ticker,
        row.date,
        row.open,
        row.high,
        row.low,
        row.close,
        row.adjustedClose,
        row.volume,
      ].join(','),
    );
    await writeFile(
      join(dataDirectory, 'stock_prices.csv'),
      [HEADER, ...legacyRows].join('\n') + '\n',
    );

    const repository = new CsvStockPriceRepository();
    await repository.upsert([price('AAPL', '2024-01-03', 105)]);

    const apple = await readFile(join(dataDirectory, 'AAPL.csv'), 'utf8');
    expect(apple).toContain('AAPL,2024-01-02,100,100,100,100,100,1000');
    expect(apple).toContain('AAPL,2024-01-03,105,105,105,105,105,1000');
    await expect(
      readFile(join(dataDirectory, 'MSFT.csv'), 'utf8'),
    ).rejects.toThrow();
  });
});
