import { ServiceUnavailableException } from '@nestjs/common';
import { IsharesSp500Repository } from './ishares-sp500.repository';

describe('IsharesSp500Repository', () => {
  let repository: IsharesSp500Repository;
  let fetchSpy: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

  beforeEach(() => {
    repository = new IsharesSp500Repository();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('carrega holdings de ações do IVV e reutiliza a lista em cache', async () => {
    fetchSpy.mockResolvedValue(responseWithText(makeHoldingsCsv(500)));

    const first = await repository.getUniverse();
    const second = await repository.getUniverse();

    expect(first.source).toBe('iShares Core S&P 500 ETF (IVV) holdings');
    expect(first.assets).toHaveLength(500);
    expect(first.assets[0]).toEqual({ label: 'Company 0', value: 'T0000' });
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('usa o CSV público atual e interpreta o formato com metadados do IVV', async () => {
    const csv = [
      'iShares Core S&P 500 ETF',
      'Fund Holdings as of,"Sep 25, 2026"',
      'Inception Date,"May 15, 2000"',
      'Ticker,Name,Sector,Asset Class,Market Value,Weight (%)',
      'MSFT,Microsoft Corporation,Information Technology,Equity,"1,000.00",7.0',
      'CASH,USD CASH,-,Cash,"100.00",0.1',
      ...Array.from(
        { length: 499 },
        (_, index) =>
          `T${index.toString().padStart(4, '0')},Company ${index},Industrials,Equity,"1,000.00",0.01`,
      ),
    ].join('\n');
    fetchSpy.mockResolvedValue(responseWithText(csv));

    const universe = await repository.getUniverse();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/latest-holdings.csv',
      expect.objectContaining({ headers: { Accept: 'text/csv' } }),
    );
    expect(universe.assets).toHaveLength(500);
    expect(universe.assets[0]).toEqual({
      label: 'Microsoft Corporation',
      value: 'MSFT',
    });
    expect(universe.assets.some((asset) => asset.value === 'CASH')).toBe(false);
  });

  it('ignora caixa e recusa uma lista incompleta', async () => {
    fetchSpy.mockResolvedValue(responseWithText(makeHoldingsCsv(3)));

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
