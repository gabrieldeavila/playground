import { Injectable } from '@nestjs/common';
import type {
  CompanyProfile,
  CompanyProfileRepository,
} from '../domain/company-profile.repository';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROFILE_URL =
  'https://query1.finance.yahoo.com/v10/finance/quoteSummary/';
type CachedProfile = { expiresAt: number; value: CompanyProfile };
type YahooProfileResponse = {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: { sector?: unknown; industry?: unknown };
    }> | null;
  };
};

@Injectable()
export class YahooCompanyProfileRepository implements CompanyProfileRepository {
  private readonly cache = new Map<string, CachedProfile>();

  async getProfile(ticker: string): Promise<CompanyProfile> {
    const cached = this.cache.get(ticker);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    try {
      const params = new URLSearchParams({ modules: 'assetProfile' });
      const response = await fetch(
        `${PROFILE_URL}${encodeURIComponent(ticker)}?${params.toString()}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'Kandle/1.0' },
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!response.ok)
        throw new Error(`Yahoo Finance HTTP ${response.status}`);

      const payload = (await response.json()) as YahooProfileResponse;
      const profile = payload.quoteSummary?.result?.[0]?.assetProfile;
      const value = {
        sector: nonEmptyString(profile?.sector),
        industry: nonEmptyString(profile?.industry),
      };
      this.cache.set(ticker, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch {
      // A ausência de perfil não deve impedir a descoberta de ações nem gerar retries em loop.
      const value = { sector: null, industry: null };
      this.cache.set(ticker, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    }
  }
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
