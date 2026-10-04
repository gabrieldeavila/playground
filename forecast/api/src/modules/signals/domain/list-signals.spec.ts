import { ListSignals } from './list-signals.js';
import { SignalSnapshot, SignalTrade } from './signal-snapshot.js';

const trade = (score: number, trend_start = false): SignalTrade => ({
  signal_date: '2026-09-01',
  exit_date: null,
  days: 5,
  return_pct: 1,
  exit_reason: null,
  score,
  win_rate_pct: 35,
  trend_start,
});
const position = {
  signal_date: '2026-09-01',
  days: 5,
  return_pct: 1,
  score: 50,
  win_rate_pct: 33,
  trend_start: false,
  stop_price: 90,
};

const snapshot: SignalSnapshot = {
  generated_at: '2026-10-03T00:00:00+00:00',
  session: '2026-10-02',
  model: {
    rules: 'regras',
    train_signals: 'treino',
    test_signals: 'teste',
    test_by_type: [],
    test_by_score_band: [],
  },
  tickers: {
    AAA: {
      name: 'Alpha Inc.',
      index: 'sp500',
      sector: 'Information Technology',
      liquid: true,
      signal_today: false,
      position: null,
      history: [trade(90)],
    },
    BBB: {
      name: null,
      signal_today: false,
      position,
      history: [trade(40, true)],
    },
    CCC: { name: null, signal_today: false, position, history: [trade(80)] },
    DDD: {
      name: null,
      signal_today: true,
      position: null,
      history: [trade(10)],
    },
    EEE: {
      name: 'Thin Corp.',
      index: 'sp600',
      liquid: false,
      signal_today: true,
      position: null,
      history: [trade(99, true)],
    },
  },
};

describe('ListSignals', () => {
  const useCase = new ListSignals({ read: () => Promise.resolve(snapshot) });

  it('lista COMPRAs de hoje, depois inícios de tendência, depois por nota', async () => {
    const result = await useCase.execute();

    expect(result?.signals.map(({ ticker }) => ticker)).toEqual([
      'DDD',
      'BBB',
      'CCC',
    ]);
    expect(result).not.toHaveProperty('tickers');
  });

  it('deixa tickers ilíquidos fora da lista, mas na busca', async () => {
    const result = await useCase.execute();

    expect(result?.signals.map(({ ticker }) => ticker)).not.toContain('EEE');
    expect((await useCase.findTicker('EEE'))?.liquid).toBe(false);
  });

  it('encontra ticker sem diferenciar caixa', async () => {
    expect((await useCase.findTicker('aaa'))?.history).toHaveLength(1);
    expect(await useCase.findTicker('ZZZ')).toBeNull();
  });

  it('lista todos os tickers com nome para sugestões', async () => {
    const tickers = await useCase.listTickers();

    expect(tickers?.[0]).toEqual({
      ticker: 'AAA',
      name: 'Alpha Inc.',
      index: 'sp500',
    });
    expect(tickers?.[1]).toEqual({ ticker: 'BBB', name: null, index: null });
    expect(tickers).toHaveLength(5);
  });

  it('lê o snapshot do timeframe pedido', async () => {
    const read = jest.fn(() => Promise.resolve(snapshot));
    const weekly = new ListSignals({ read });

    const result = await weekly.execute('weekly');

    expect(read).toHaveBeenCalledWith('weekly');
    expect(result?.timeframe).toBe('weekly');
  });

  it('retorna null quando o snapshot ainda não existe', async () => {
    const empty = new ListSignals({ read: () => Promise.resolve(null) });

    expect(await empty.execute()).toBeNull();
  });
});
