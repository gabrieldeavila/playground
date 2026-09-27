export interface Russell2000Asset {
  label: string;
  value: string;
}

export interface Russell2000Universe {
  source: 'iShares Russell 2000 ETF holdings';
  updatedAt: string;
  assets: Russell2000Asset[];
}

export interface Russell2000UniverseRepository {
  getUniverse(): Promise<Russell2000Universe>;
}
