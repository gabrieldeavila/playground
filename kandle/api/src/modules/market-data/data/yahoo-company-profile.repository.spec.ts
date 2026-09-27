import { YahooCompanyProfileRepository } from './yahoo-company-profile.repository';

describe('YahooCompanyProfileRepository', () => {
  let repository: YahooCompanyProfileRepository;
  let fetchSpy: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

  beforeEach(() => {
    repository = new YahooCompanyProfileRepository();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('retorna setor e ramo e reutiliza o cache', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          quoteSummary: {
            result: [
              { assetProfile: { sector: 'Technology', industry: 'Software' } },
            ],
          },
        }),
    } as Response);

    const first = await repository.getProfile('TEST');
    const second = await repository.getProfile('TEST');

    expect(first).toEqual({ sector: 'Technology', industry: 'Software' });
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('não interrompe a descoberta se o provedor não tiver perfil', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(repository.getProfile('UNKNOWN')).resolves.toEqual({
      sector: null,
      industry: null,
    });
  });
});
