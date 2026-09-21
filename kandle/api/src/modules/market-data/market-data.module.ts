import { Module } from '@nestjs/common';
import { MarketDataController } from './delivery/market-data.controller';
import { MarketDataUseCase } from './domain/market-data.use-case';
import { YahooFinanceRepository } from './data/yahoo-finance.repository';

@Module({
  controllers: [MarketDataController],
  providers: [
    YahooFinanceRepository,
    {
      provide: MarketDataUseCase,
      useFactory: (repository: YahooFinanceRepository) =>
        new MarketDataUseCase(repository),
      inject: [YahooFinanceRepository],
    },
  ],
})
export class MarketDataModule {}
