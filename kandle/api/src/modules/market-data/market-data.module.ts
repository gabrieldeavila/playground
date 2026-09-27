import { Module } from '@nestjs/common';
import { IsharesRussell2000Repository } from './data/ishares-russell-2000.repository';
import { YahooCompanyProfileRepository } from './data/yahoo-company-profile.repository';
import { YahooFinanceRepository } from './data/yahoo-finance.repository';
import { MarketDataController } from './delivery/market-data.controller';
import { CompanyProfileUseCase } from './domain/company-profile.use-case';
import { MarketDataUseCase } from './domain/market-data.use-case';
import { Russell2000UniverseUseCase } from './domain/russell-2000-universe.use-case';

@Module({
  controllers: [MarketDataController],
  providers: [
    YahooFinanceRepository,
    IsharesRussell2000Repository,
    YahooCompanyProfileRepository,
    {
      provide: MarketDataUseCase,
      useFactory: (repository: YahooFinanceRepository) =>
        new MarketDataUseCase(repository),
      inject: [YahooFinanceRepository],
    },
    {
      provide: Russell2000UniverseUseCase,
      useFactory: (repository: IsharesRussell2000Repository) =>
        new Russell2000UniverseUseCase(repository),
      inject: [IsharesRussell2000Repository],
    },
    {
      provide: CompanyProfileUseCase,
      useFactory: (repository: YahooCompanyProfileRepository) =>
        new CompanyProfileUseCase(repository),
      inject: [YahooCompanyProfileRepository],
    },
  ],
})
export class MarketDataModule {}
