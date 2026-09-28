import type {
  MarketUniverse,
  MarketUniverseRepository,
} from './market-universe.repository';

export class Russell2000UniverseUseCase {
  constructor(private readonly repository: MarketUniverseRepository) {}

  execute(): Promise<MarketUniverse> {
    return this.repository.getUniverse();
  }
}

export class Sp500UniverseUseCase extends Russell2000UniverseUseCase {}
