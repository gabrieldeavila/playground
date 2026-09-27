import type {
  CompanyProfile,
  CompanyProfileRepository,
} from './company-profile.repository';

export class CompanyProfileUseCase {
  constructor(private readonly repository: CompanyProfileRepository) {}

  execute(ticker: string): Promise<CompanyProfile> {
    return this.repository.getProfile(ticker);
  }
}
