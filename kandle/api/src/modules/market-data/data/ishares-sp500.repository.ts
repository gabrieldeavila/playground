import { ServiceUnavailableException } from '@nestjs/common';
import type {
  MarketUniverse,
  MarketUniverseRepository,
} from '../domain/market-universe.repository';
import { parseIsharesHoldings } from './ishares-holdings-parser';

const HOLDINGS_URL =
  'https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/latest-holdings.csv';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MINIMUM_ASSETS = 400;

type CachedUniverse = { expiresAt: number; value: MarketUniverse };

export class IsharesSp500Repository implements MarketUniverseRepository {
  private cache: CachedUniverse | null = null;

  async getUniverse(): Promise<MarketUniverse> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.value;
    }

    try {
      const response = await fetch(HOLDINGS_URL, {
        headers: { Accept: 'text/csv' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`iShares respondeu com HTTP ${response.status}.`);
      }

      const assets = parseIsharesHoldings(await response.text());
      if (assets.length < MINIMUM_ASSETS) {
        throw new Error('A lista de ativos recebida está incompleta.');
      }

      const value: MarketUniverse = {
        source: 'iShares Core S&P 500 ETF (IVV) holdings',
        updatedAt: new Date().toISOString(),
        assets,
      };
      this.cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
      return value;
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível carregar a composição de referência do S&P 500.',
      );
    }
  }
}
