import { ListSignals } from './list-signals.js';
import { SignalSnapshot, SignalTrade } from './signal-snapshot.js';

const trade = (score: number): SignalTrade => ({
  signal_date: '2026-09-01',
  exit_date: null,
  days: 5,
  return_pct: 1,
  exit_reason: null,
  score,
});
const position = {
  signal_date: '2026-09-01',
  days: 5,
  return_pct: 1,
  score: 50,
  stop_price: 90,
};

const snapshot: SignalSnapshot = {
  generated_at: '2026-10-03T00:00:00+00:00',
  session: '2026-10-02',
  model: {
    rules: 'regras',
    train_signals: 'treino',
    test_signals: 'teste',
    test_by_min_score: [],
  },
  tickers: {
    AAA: {
      name: 'Alpha Inc.',
      signal_today: false,
      position: null,
      history: [trade(90)],
    },
    BBB: { name: null, signal_today: false, position, history: [trade(40)] },
    CCC: { name: null, signal_today: false, position, history: [trade(80)] },
    DDD: {
      name: null,
      signal_today: true,
      position: null,
      history: [trade(10)],
    },
  },
};

describe('ListSignals', () => {
  const useCase = new ListSignals({ read: () => Promise.resolve(snapshot) });

  it('lista COMPRAs de hoje primeiro e depois posições por nota', async () => {
    const result = await useCase.execute();

    expect(result?.signals.map(({ ticker }) => ticker)).toEqual([
      'DDD',
      'CCC',
      'BBB',
    ]);
    expect(result).not.toHaveProperty('tickers');
  });

  it('encontra ticker sem diferenciar caixa', async () => {
    expect((await useCase.findTicker('aaa'))?.history).toHaveLength(1);
    expect(await useCase.findTicker('ZZZ')).toBeNull();
  });

  it('lista todos os tickers com nome para sugestões', async () => {
    const tickers = await useCase.listTickers();

    expect(tickers?.[0]).toEqual({ ticker: 'AAA', name: 'Alpha Inc.' });
    expect(tickers).toHaveLength(4);
  });

  it('retorna null quando o snapshot ainda não existe', async () => {
    const empty = new ListSignals({ read: () => Promise.resolve(null) });

    expect(await empty.execute()).toBeNull();
  });
});
