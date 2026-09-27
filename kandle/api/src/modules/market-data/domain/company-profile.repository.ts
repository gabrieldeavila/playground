export interface CompanyProfile {
  sector: string | null;
  industry: string | null;
}

export interface CompanyProfileRepository {
  getProfile(ticker: string): Promise<CompanyProfile>;
}
