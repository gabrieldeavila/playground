import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";
import { getHistoricalBuySignals } from "@/app/shared/historicalBuySignals";
import { getClosedCandles } from "../watchlist/watchlist";

export type OpportunityKind =
  "falling" | "stabilizing" | "possible-reversal" | "no-setup";

export type OpportunityCriterion = {
  label: string;
  met: boolean;
  detail: string;
};

export type Opportunity = {
  kind: OpportunityKind;
  close: number;
  time: string | number;
  drawdownPercent: number;
  enteredAt: string | number;
  latestChartBuySignal: { time: string | number; close: number } | null;
  hasEnoughChartBuySignalHistory: boolean;
  criteria: OpportunityCriterion[];
};

const EMA_PERIOD = 9;
const DEFAULT_CHART_BUY_EMA_PERIODS = [9, 20, 50, 100, 200] as const;
const CHART_BUY_SLOPE_LOOKBACK = 5;
const LOWS_LOOKBACK = 3;
const BREAKOUT_LOOKBACK = 4;
export const OPPORTUNITY_HISTORY_YEARS = 6;
export const MINIMUM_OPPORTUNITY_CANDLES = 55;

export type OpportunityCriteria = {
  minimumDrawdownPercent: number;
  recentHighLookback: number;
  emaSlopeLookback: number;
};

export const DEFAULT_OPPORTUNITY_CRITERIA: OpportunityCriteria = {
  minimumDrawdownPercent: 10,
  recentHighLookback: 26,
  emaSlopeLookback: 5,
};

export type HistoricalOpportunityEvent = {
  kind: OpportunityKind;
  time: string | number;
  close: number;
  drawdownPercent: number;
};

export type OpportunityBacktest = {
  events: HistoricalOpportunityEvent[];
  evaluatedCandles: number;
  counts: Record<OpportunityKind, number>;
};

const getEmaSeries = (candles: MarketDataCandle[], period: number) => {
  if (candles.length < period) return [];
  const smoothing = 2 / (period + 1);
  let ema =
    candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) /
    period;
  const values = Array<number>(period - 1).fill(Number.NaN);
  values.push(ema);
  for (let index = period; index < candles.length; index += 1) {
    ema = candles[index].close * smoothing + ema * (1 - smoothing);
    values.push(ema);
  }
  return values;
};

const minimumLow = (candles: MarketDataCandle[]) =>
  Math.min(...candles.map(({ low }) => low));
const maximumHigh = (candles: MarketDataCandle[]) =>
  Math.max(...candles.map(({ high }) => high));
const formatPercent = (value: number) =>
  `${value.toFixed(1).replace(".", ",")}%`;

const classifyAt = (
  candles: MarketDataCandle[],
  ema9: number[],
  index: number,
  criteria: OpportunityCriteria = DEFAULT_OPPORTUNITY_CRITERIA,
): { kind: OpportunityKind; drawdownPercent: number } => {
  const close = candles[index].close;
  const recentHigh = maximumHigh(
    candles.slice(index - criteria.recentHighLookback + 1, index + 1),
  );
  const drawdownPercent = ((recentHigh - close) / recentHigh) * 100;
  const significantDrawdown =
    drawdownPercent >= criteria.minimumDrawdownPercent;
  const recentLows = minimumLow(
    candles.slice(index - LOWS_LOOKBACK + 1, index + 1),
  );
  const previousLows = minimumLow(
    candles.slice(index - LOWS_LOOKBACK * 2 + 1, index - LOWS_LOOKBACK + 1),
  );
  const lowsStoppedFalling = recentLows >= previousLows;
  const lowerLowsContinue = recentLows < previousLows;
  const ema9Rising = ema9[index] > ema9[index - criteria.emaSlopeLookback];
  const ema9Falling = ema9[index] < ema9[index - criteria.emaSlopeLookback];
  const previousRecentHigh = maximumHigh(
    candles.slice(index - BREAKOUT_LOOKBACK, index),
  );
  const closedAboveRecentHigh = close > previousRecentHigh;

  let kind: OpportunityKind = "no-setup";
  if (significantDrawdown && closedAboveRecentHigh && ema9Rising) {
    kind = "possible-reversal";
  } else if (significantDrawdown && lowerLowsContinue && ema9Falling) {
    kind = "falling";
  } else if (significantDrawdown && lowsStoppedFalling) {
    kind = "stabilizing";
  }

  return { kind, drawdownPercent };
};

/** Classifica candles diários ou semanais encerrados e expõe os testes do estado. */
export const classifyOpportunity = (
  inputCandles: MarketDataCandle[],
  interval:
    | typeof MarketDataInterval.Daily
    | typeof MarketDataInterval.Weekly = MarketDataInterval.Weekly,
  now = new Date(),
  criteria: OpportunityCriteria = DEFAULT_OPPORTUNITY_CRITERIA,
  selectedEmaPeriods: readonly number[] = DEFAULT_CHART_BUY_EMA_PERIODS,
): Opportunity | null => {
  const candles = getClosedCandles(inputCandles, interval, now);
  const periodLabel =
    interval === MarketDataInterval.Daily ? "dias" : "semanas";
  if (candles.length < MINIMUM_OPPORTUNITY_CANDLES) return null;

  const ema9 = getEmaSeries(candles, EMA_PERIOD);
  const normalizedEmaPeriods = [...new Set(selectedEmaPeriods)]
    .filter((period) => DEFAULT_CHART_BUY_EMA_PERIODS.includes(period as (typeof DEFAULT_CHART_BUY_EMA_PERIODS)[number]))
    .sort((left, right) => left - right);
  const chartBuySignals = getHistoricalBuySignals(candles, normalizedEmaPeriods);
  const latestChartBuySignal = chartBuySignals.at(-1);
  const longestSelectedEma = normalizedEmaPeriods.at(-1);
  const latest = candles.length - 1;
  const close = candles[latest].close;
  const { kind, drawdownPercent } = classifyAt(candles, ema9, latest, criteria);
  const significantDrawdown =
    drawdownPercent >= criteria.minimumDrawdownPercent;
  const recentLows = minimumLow(
    candles.slice(latest - LOWS_LOOKBACK + 1, latest + 1),
  );
  const previousLows = minimumLow(
    candles.slice(latest - LOWS_LOOKBACK * 2 + 1, latest - LOWS_LOOKBACK + 1),
  );
  const lowsStoppedFalling = recentLows >= previousLows;
  const lowerLowsContinue = recentLows < previousLows;
  const ema9Rising = ema9[latest] > ema9[latest - criteria.emaSlopeLookback];
  const ema9Falling = ema9[latest] < ema9[latest - criteria.emaSlopeLookback];
  const previousRecentHigh = maximumHigh(
    candles.slice(latest - BREAKOUT_LOOKBACK, latest),
  );
  const closedAboveRecentHigh = close > previousRecentHigh;

  let enteredAtIndex = latest;
  while (enteredAtIndex > MINIMUM_OPPORTUNITY_CANDLES - 1) {
    if (classifyAt(candles, ema9, enteredAtIndex - 1, criteria).kind !== kind) break;
    enteredAtIndex -= 1;
  }

  const criteriaDetails: OpportunityCriterion[] = [
    {
      label: "Queda a partir da máxima recente",
      met: significantDrawdown,
      detail: `Fechamento ${formatPercent(drawdownPercent)} abaixo da máxima dos últimos ${criteria.recentHighLookback} ${periodLabel} (limiar: ${criteria.minimumDrawdownPercent}%).`,
    },
    {
      label: "Mínimas pararam de cair",
      met: lowsStoppedFalling,
      detail: `Mínima dos últimos ${LOWS_LOOKBACK} ${periodLabel}: ${recentLows}; período anterior: ${previousLows}.`,
    },
    {
      label: "Fechamento acima das máximas recentes",
      met: closedAboveRecentHigh,
      detail: `Fechamento atual ${close} vs. máxima dos ${BREAKOUT_LOOKBACK} ${periodLabel} anteriores ${previousRecentHigh}.`,
    },
    {
      label: "EMA 9 ascendente",
      met: ema9Rising,
      detail: `EMA 9 atual ${ema9[latest].toFixed(2)} vs. EMA 9 de ${criteria.emaSlopeLookback} ${periodLabel} atrás ${ema9[latest - criteria.emaSlopeLookback].toFixed(2)}.`,
    },
    {
      label: "Pressão de queda persistente",
      met: significantDrawdown && lowerLowsContinue && ema9Falling,
      detail: `Requer queda de pelo menos ${criteria.minimumDrawdownPercent}%, mínimas recentes inferiores às do período anterior e EMA 9 descendente em ${criteria.emaSlopeLookback} ${periodLabel}.`,
    },
  ];

  return {
    kind,
    close,
    time: candles[latest].time,
    drawdownPercent,
    enteredAt: candles[enteredAtIndex].time,
    latestChartBuySignal: latestChartBuySignal
      ? { time: latestChartBuySignal.time, close: latestChartBuySignal.close }
      : null,
    hasEnoughChartBuySignalHistory:
      normalizedEmaPeriods.length >= 2 &&
      longestSelectedEma !== undefined &&
      candles.length >= longestSelectedEma + CHART_BUY_SLOPE_LOOKBACK,
    criteria: criteriaDetails,
  };
};

const candleDate = (value: string | number) =>
  typeof value === "number"
    ? new Date(value > 10_000_000_000 ? value : value * 1000)
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00Z`)
      : new Date(value);

const toUtcDateString = (value: string | number) =>
  candleDate(value).toISOString().slice(0, 10);

/**
 * Replays the classifier chronologically. At each candle, all rolling values
 * are calculated from its prefix only; candles after `to` are never inspected.
 */
export const backtestOpportunities = (
  inputCandles: MarketDataCandle[],
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly,
  from: string,
  to: string,
  criteria: OpportunityCriteria = DEFAULT_OPPORTUNITY_CRITERIA,
  now = new Date(),
): OpportunityBacktest => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    throw new Error("Selecione um intervalo de datas válido.");
  }
  if (
    !Number.isFinite(criteria.minimumDrawdownPercent) ||
    criteria.minimumDrawdownPercent < 0 ||
    !Number.isInteger(criteria.recentHighLookback) ||
    criteria.recentHighLookback < 1 ||
    !Number.isInteger(criteria.emaSlopeLookback) ||
    criteria.emaSlopeLookback < 1
  ) {
    throw new Error("Os critérios informados são inválidos.");
  }

  const cutoffExclusive = new Date(`${to}T00:00:00Z`);
  cutoffExclusive.setUTCDate(cutoffExclusive.getUTCDate() + 1);
  const candles = getClosedCandles(inputCandles, interval, now).filter((candle) => {
    const candleTimestamp = candleDate(candle.time);
    if (interval === MarketDataInterval.Daily) {
      return candleTimestamp < cutoffExclusive;
    }

    // Weekly bars are timestamped at the start of the week. Exclude the
    // entire week unless its calendar period has ended by the selected date.
    const weekEndExclusive = new Date(candleTimestamp);
    weekEndExclusive.setUTCDate(weekEndExclusive.getUTCDate() + 7);
    return weekEndExclusive <= cutoffExclusive;
  });
  const ema9 = getEmaSeries(candles, EMA_PERIOD);
  const firstEvaluableIndex = Math.max(
    MINIMUM_OPPORTUNITY_CANDLES - 1,
    criteria.recentHighLookback - 1,
    EMA_PERIOD - 1 + criteria.emaSlopeLookback,
  );
  const counts: Record<OpportunityKind, number> = {
    falling: 0,
    stabilizing: 0,
    "possible-reversal": 0,
    "no-setup": 0,
  };
  const events: HistoricalOpportunityEvent[] = [];
  let evaluatedCandles = 0;
  let previousKind: OpportunityKind | null =
    firstEvaluableIndex > 0 && firstEvaluableIndex - 1 >= EMA_PERIOD - 1
      ? classifyAt(candles, ema9, firstEvaluableIndex - 1, criteria).kind
      : null;

  for (let index = firstEvaluableIndex; index < candles.length; index += 1) {
    const date = toUtcDateString(candles[index].time);
    if (date > to) break;
    const { kind, drawdownPercent } = classifyAt(candles, ema9, index, criteria);
    if (date >= from) {
      evaluatedCandles += 1;
      counts[kind] += 1;
      if (kind !== "no-setup" && kind !== previousKind) {
        events.push({
          kind,
          time: candles[index].time,
          close: candles[index].close,
          drawdownPercent,
        });
      }
    }
    previousKind = kind;
  }

  return { events, evaluatedCandles, counts };
};

export const getOpportunityHistoryRange = (now = new Date()) => {
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - OPPORTUNITY_HISTORY_YEARS);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};
