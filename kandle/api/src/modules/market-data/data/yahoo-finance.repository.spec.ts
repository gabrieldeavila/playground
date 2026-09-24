import { ServiceUnavailableException } from '@nestjs/common';
import { YahooFinanceRepository } from './yahoo-finance.repository';

describe('YahooFinanceRepository', () => {
  let repository: YahooFinanceRepository;
  let fetchSpy: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;

  beforeEach(() => {
    repository = new YahooFinanceRepository();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('consulta somente o período solicitado e ordena os candles por data', async () => {
    fetchSpy.mockResolvedValue(
      responseWithJson({
        chart: {
          result: [
            {
              meta: { symbol: 'AAPL' },
              timestamp: [1710182100, 1710181800, 1710182400],
              indicators: {
                quote: [
                  {
                    open: [3, 1, 4],
                    high: [3, 1, 4],
                    low: [3, 1, 4],
                    close: [3, 1, 4],
                    volume: [30, 10, 40],
                  },
                ],
              },
            },
          ],
        },
      }),
    );

    const from = new Date('2024-03-11T00:00:00.000Z');
    const to = new Date('2024-03-11T23:59:59.999Z');
    const result = await repository.getCandles('AAPL', { from, to }, '5m');

    const requestedUrl = toUrl(fetchSpy.mock.calls[0]?.[0]);
    expect(requestedUrl.searchParams.get('period1')).toBe(
      Math.floor(from.getTime() / 1000).toString(),
    );
    expect(requestedUrl.searchParams.get('period2')).toBe(
      (Math.floor(to.getTime() / 1000) + 1).toString(),
    );
    expect(requestedUrl.searchParams.get('range')).toBeNull();
    expect(result.range).toBeNull();
    expect(result.from).toBe(from.toISOString());
    expect(result.to).toBe(to.toISOString());
    expect(result.candles.map(({ time }) => time)).toEqual([
      1710181800, 1710182100, 1710182400,
    ]);
  });

  it('mantém a consulta legada via range', async () => {
    fetchSpy.mockResolvedValue(
      responseWithJson({
        chart: {
          result: [
            {
              meta: { symbol: 'AAPL' },
              timestamp: [1710181800],
              indicators: {
                quote: [
                  { open: [1], high: [1], low: [1], close: [1], volume: [0] },
                ],
              },
            },
          ],
        },
      }),
    );

    const result = await repository.getCandles('AAPL', { range: '1d' }, '5m');
    expect(toUrl(fetchSpy.mock.calls[0]?.[0]).searchParams.get('range')).toBe(
      '1d',
    );
    expect(result.range).toBe('1d');
  });

  it('converte falha HTTP do provedor em erro 503', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 502 } as Response);
    await expect(
      repository.getCandles('AAPL', { range: '1d' }, '5m'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('classifica período sem dados como indisponível no provedor', async () => {
    fetchSpy.mockResolvedValue(
      responseWithJson({
        chart: { result: null, error: { description: 'Sem dados' } },
      }),
    );

    await expect(
      repository.getCandles('AAPL', { range: '1d' }, '5m'),
    ).rejects.toThrow('não está disponível');
  });
});

function toUrl(input: RequestInfo | URL | undefined): URL {
  if (typeof input === 'string') return new URL(input);
  if (input instanceof URL) return input;
  if (input instanceof Request) return new URL(input.url);
  throw new Error('A URL da requisição não foi capturada.');
}

function responseWithJson(payload: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response;
}
