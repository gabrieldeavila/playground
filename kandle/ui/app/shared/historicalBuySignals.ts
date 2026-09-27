import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

const EMA_PERIODS = [9, 20, 50, 100, 200] as const;
const SLOPE_LOOKBACK = 5;
const ALIGNMENT_HOLD_CANDLES = 3;
const MIN_EMA_SPREAD_RATIO = 0.005;

const getEmaValues = (candles: MarketDataCandle[], period: number) => {
  if (candles.length < period) return [];

  const initialAverage =
    candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) /
    period;
  const smoothingFactor = 2 / (period + 1);
  const values = [initialAverage];
  let previousEma = initialAverage;

  for (let index = period; index < candles.length; index += 1) {
    previousEma =
      candles[index].close * smoothingFactor +
      previousEma * (1 - smoothingFactor);
    values.push(previousEma);
  }

  return values;
};

const getAlignedEmaValue = (
  emaValues: number[],
  period: number,
  candleIndex: number,
) => emaValues[candleIndex - (period - 1)];

/** Identifies the first confirmed candle of each chart-style buy setup. */
export const getHistoricalBuySignals = (
  candles: MarketDataCandle[],
  selectedEmaPeriods: readonly number[],
) => {
  const buyEmaPeriods = [...new Set(selectedEmaPeriods)]
    .filter((period) =>
      EMA_PERIODS.includes(period as (typeof EMA_PERIODS)[number]),
    )
    .sort((left, right) => left - right);
  if (buyEmaPeriods.length < 2) return [];

  const emaValues = buyEmaPeriods.map((period) =>
    getEmaValues(candles, period),
  );
  const signals: MarketDataCandle[] = [];
  const requiredCandles =
    buyEmaPeriods[buyEmaPeriods.length - 1] + SLOPE_LOOKBACK;
  let wasBuySignal = false;

  for (
    let candleIndex = requiredCandles - 1;
    candleIndex < candles.length;
    candleIndex += 1
  ) {
    const values = buyEmaPeriods.map((period, index) =>
      getAlignedEmaValue(emaValues[index], period, candleIndex),
    );
    const priorValues = buyEmaPeriods.map((period, index) =>
      getAlignedEmaValue(
        emaValues[index],
        period,
        candleIndex - SLOPE_LOOKBACK,
      ),
    );
    const isOrdered = values.every(
      (value, index) => index === 0 || values[index - 1] > value,
    );
    const allSlopesUp = values.every(
      (value, index) => value > priorValues[index],
    );
    const close = candles[candleIndex].close;
    const spreadRatio =
      close > 0 ? Math.abs(values[0] - values[values.length - 1]) / close : 0;
    const isBuySignal =
      isOrdered &&
      allSlopesUp &&
      spreadRatio >= MIN_EMA_SPREAD_RATIO &&
      Array.from({ length: ALIGNMENT_HOLD_CANDLES }, (_, offset) => {
        const heldValues = buyEmaPeriods.map((period, index) =>
          getAlignedEmaValue(emaValues[index], period, candleIndex - offset),
        );
        return heldValues.every(
          (value, index) => index === 0 || heldValues[index - 1] > value,
        );
      }).every(Boolean);

    if (isBuySignal && !wasBuySignal) signals.push(candles[candleIndex]);
    wasBuySignal = isBuySignal;
  }

  return signals;
};
