import { ServiceUnavailableException } from '@nestjs/common';
import { IsharesRussell2000Repository } from './ishares-russell-2000.repository';

describe('IsharesRussell2000Repository', () => {
  let repository: IsharesRussell2000Repository;
  let fetchSpy: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

  beforeEach(() => {
    repository = new IsharesRussell2000Repository();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('carrega ações ordinárias do arquivo e mantém apenas uma chamada durante o cache', async () => {
    fetchSpy.mockResolvedValue(responseWithText(makeHoldingsCsv(1_001)));

    const first = await repository.getUniverse();
    const second = await repository.getUniverse();

    expect(first.source).toBe('iShares Russell 2000 ETF holdings');
    expect(first.assets).toHaveLength(1_001);
    expect(first.assets[0]).toEqual({ label: 'Company 0', value: 'T0000' });
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('interpreta o CSV atual do iShares com metadados antes do cabeçalho', async () => {
    const rows = [
      'iShares Russell 2000 ETF Fund Holdings as of,"Sep 25, 2026"',
      'Inception Date,"May 22, 2000"',
      'Ticker,Name,Sector,Asset Class,Market Value,Weight (%)',
      '"TWST","TWIST BIOSCIENCE","Health Care","Equity","312,780,993.25","0.40"',
    ];
    for (let index = 1; index < 1_001; index += 1) {
      rows.push(
        `"T${index.toString().padStart(4, '0')}","Company ${index}","Industrials","Equity","1,000.00","0.01"`,
      );
    }
    rows.push('"CASH","USD CASH","-","Cash","1,000.00","0.01"');
    fetchSpy.mockResolvedValue(responseWithText(rows.join('\n')));

    const universe = await repository.getUniverse();

    expect(universe.assets).toHaveLength(1_001);
    expect(universe.assets[0]).toEqual({
      label: 'TWIST BIOSCIENCE',
      value: 'TWST',
    });
  });

  it('recusa listas incompletas e traduz falhas do provedor em 503', async () => {
    fetchSpy.mockResolvedValue(responseWithText(makeHoldingsCsv(2)));

    await expect(repository.getUniverse()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

function makeHoldingsCsv(count: number): string {
  const rows = ['Fund Name,Example', 'Ticker,Name,Asset Class,Weight (%)'];
  for (let index = 0; index < count; index += 1) {
    rows.push(
      `T${index.toString().padStart(4, '0')},Company ${index},Equity,0.01`,
    );
  }
  rows.push('CASH,USD CASH,Cash,0.1');
  return rows.join('\n');
}

function responseWithText(body: string): Response {
  return {
    ok: true,
    text: () => Promise.resolve(body),
  } as Response;
}
