import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MarketDataRepository } from './market-data.repository';
import { MarketDataUseCase } from './market-data.use-case';

describe('MarketDataUseCase', () => {
  let repository: jest.Mocked<MarketDataRepository>;
  let useCase: MarketDataUseCase;

  beforeEach(() => {
    repository = {
      getCandles: jest.fn(),
      searchTickers: jest.fn(),
    };
    repository.getCandles.mockResolvedValue({
      symbol: 'AAPL',
      exchange: 'NMS',
      currency: 'USD',
      timezone: 'America/New_York',
      range: null,
      interval: '5m',
      candles: [
        {
          time: 1710181800,
          open: 172,
          high: 173,
          low: 171,
          close: 172.5,
          volume: 100,
        },
      ],
    });
    useCase = new MarketDataUseCase(repository);
  });

  it('consulta o período solicitado com datas ISO e ticker normalizado', async () => {
    await useCase.execute('aapl', {
      from: '2024-03-11',
      to: '2024-03-12',
      interval: '5m',
    });

    expect(repository.getCandles.mock.calls).toEqual([
      [
        'AAPL',
        {
          from: new Date('2024-03-11T00:00:00.000Z'),
          to: new Date('2024-03-12T23:59:59.999Z'),
        },
        '5m',
      ],
    ]);
  });

  it('mantém compatibilidade com range e interval padrão', async () => {
    await useCase.execute('AAPL', {});
    expect(repository.getCandles.mock.calls).toEqual([
      ['AAPL', { range: '1d' }, '5m'],
    ]);
  });

  const invalidQueries: Array<[Record<string, string>, string]> = [
    [{ from: '11-03-2024', to: '2024-03-12', interval: '5m' }, 'data'],
    [{ from: '2024-02-30', to: '2024-03-12', interval: '5m' }, 'inválida'],
    [{ from: '2024-03-12', to: '2024-03-11', interval: '5m' }, 'anterior'],
    [{ from: '2024-03-11', interval: '5m' }, 'juntos'],
    [{ from: '2024-03-11', to: '2024-03-12', interval: 'invalid' }, 'interval'],
    [
      {
        from: '2024-03-11',
        to: '2024-03-12',
        range: '1d',
        interval: '5m',
      },
      'combinados',
    ],
  ];

  it.each(invalidQueries)(
    'rejeita parâmetros inválidos',
    async (query, message) => {
      await expect(useCase.execute('AAPL', query)).rejects.toThrow(message);
      expect(repository.getCandles.mock.calls).toHaveLength(0);
    },
  );

  it('impõe o limite máximo de candles antes de consultar o provedor', async () => {
    await expect(
      useCase.execute('AAPL', {
        from: '2024-01-01',
        to: '2024-02-15',
        interval: '1m',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.getCandles.mock.calls).toHaveLength(0);
  });

  it('informa quando o período excede a janela histórica do provedor', async () => {
    await expect(
      useCase.execute('AAPL', {
        from: '2024-01-01',
        to: '2024-03-05',
        interval: '30m',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.getCandles.mock.calls).toHaveLength(0);
  });

  it('repassa falhas do provedor sem ocultar o erro', async () => {
    const error = new Error('provedor indisponível');
    repository.getCandles.mockRejectedValue(error);

    await expect(useCase.execute('AAPL', {})).rejects.toBe(error);
  });

  it('retorna erro claro quando não há candles no período', async () => {
    repository.getCandles.mockResolvedValue({
      symbol: 'AAPL',
      exchange: null,
      currency: null,
      timezone: null,
      range: null,
      interval: '5m',
      candles: [],
    });

    await expect(useCase.execute('AAPL', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
