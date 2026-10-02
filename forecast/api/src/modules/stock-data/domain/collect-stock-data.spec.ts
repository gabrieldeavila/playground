import { CollectStockData } from './collect-stock-data.js';
import {
  MarketDataProvider,
  StockPrice,
  StockPriceRepository,
} from './stock-price.js';

const price: StockPrice = {
  ticker: 'AAPL',
  date: '2024-01-02',
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  adjustedClose: 104,
  volume: 1000,
};

describe('CollectStockData', () => {
  it('coleta e persiste dados, mantendo falhas individuais por ticker', async () => {
    const marketDataProvider: MarketDataProvider = {
      fetchDailyPrices: jest.fn((ticker: string) =>
        ticker === 'INVALID'
          ? Promise.reject(new Error('Ticker desconhecido'))
          : Promise.resolve([{ ...price, ticker }]),
      ),
    };
    const upsert = jest.fn().mockResolvedValue(undefined);
    const stockPriceRepository: StockPriceRepository = { upsert };
    const useCase = new CollectStockData(
      marketDataProvider,
      stockPriceRepository,
    );

    const result = await useCase.execute({
      tickers: ['AAPL', 'INVALID'],
      startDate: '2024-01-01',
      endDate: '2024-01-05',
    });

    expect(result).toEqual({
      savedRows: 1,
      tickers: ['AAPL'],
      errors: [{ ticker: 'INVALID', message: 'Ticker desconhecido' }],
    });
    expect(upsert).toHaveBeenCalledWith([{ ...price, ticker: 'AAPL' }]);
  });
});
