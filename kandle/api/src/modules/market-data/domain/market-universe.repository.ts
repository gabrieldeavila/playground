export interface MarketUniverseAsset {
  label: string;
  value: string;
}

export interface MarketUniverse {
  source: string;
  updatedAt: string;
  assets: MarketUniverseAsset[];
}

export interface MarketUniverseRepository {
  getUniverse(): Promise<MarketUniverse>;
}
