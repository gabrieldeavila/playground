import { Module } from '@nestjs/common';
import { CsvStockPriceRepository } from './data/csv-stock-price.repository.js';
import { YahooFinanceAdapter } from './data/yahoo-finance.adapter.js';
import { StockDataController } from './delivery/stock-data.controller.js';
import { CollectStockData } from './domain/collect-stock-data.js';

@Module({
  controllers: [StockDataController],
  providers: [
    YahooFinanceAdapter,
    CsvStockPriceRepository,
    {
      provide: CollectStockData,
      useFactory: (
        marketDataProvider: YahooFinanceAdapter,
        stockPriceRepository: CsvStockPriceRepository,
      ) => new CollectStockData(marketDataProvider, stockPriceRepository),
      inject: [YahooFinanceAdapter, CsvStockPriceRepository],
    },
  ],
})
export class StockDataModule {}
