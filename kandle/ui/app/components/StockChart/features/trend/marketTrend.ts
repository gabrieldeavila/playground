import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

export type MarketTrendKind = "up" | "down" | "sideways" | "insufficient";

export type MarketTrend = {
  kind: MarketTrendKind;
  label: string;
  timeframe: string;
  description: string;
};

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


const getTimeframeLabel = (interval: MarketDataInterval) => {
  switch (interval) {
    case MarketDataInterval.Daily:
      return "diário";
    case MarketDataInterval.Monthly:
      return "mensal";
    case MarketDataInterval.Weekly:
    default:
      return "semanal";
  }
};

const getAlignedEmaValue = (
  emaValues: number[],
  period: number,
  candleIndex: number,
) => emaValues[candleIndex - (period - 1)];

export const getMarketTrend = (
  candles: MarketDataCandle[],
  interval: MarketDataInterval,
): MarketTrend => {
  const timeframe = getTimeframeLabel(interval);
  const emaValues = EMA_PERIODS.map((period) => getEmaValues(candles, period));
  const requiredCandles = EMA_PERIODS[EMA_PERIODS.length - 1] + SLOPE_LOOKBACK;

  if (candles.length < requiredCandles) {
    return {
      kind: "insufficient",
      label: "Dados insuficientes",
      timeframe,
      description: `São necessários pelo menos ${requiredCandles} candles para avaliar o alinhamento, a inclinação e a persistência das EMAs no período ${timeframe}.`,
    };
  }

  const latestIndex = candles.length - 1;
  const alignedFor = (direction: "up" | "down") => {
    for (
      let candleIndex = latestIndex - ALIGNMENT_HOLD_CANDLES + 1;
      candleIndex <= latestIndex;
      candleIndex += 1
    ) {
      const values = EMA_PERIODS.map((period, index) =>
        getAlignedEmaValue(emaValues[index], period, candleIndex),
      );
      if (values.some((value) => value === undefined)) return false;

      const isOrdered = values
        .slice(1)
        .every((value, index) =>
          direction === "up" ? values[index] > value : values[index] < value,
        );
      if (!isOrdered) return false;
    }

    return true;
  };

  const slopes = emaValues.map((values) =>
    values[values.length - 1] > values[values.length - 1 - SLOPE_LOOKBACK]
      ? "up"
      : values[values.length - 1] < values[values.length - 1 - SLOPE_LOOKBACK]
        ? "down"
        : "flat",
  );
  const lastClose = candles[latestIndex].close;
  const ema9 = emaValues[0][emaValues[0].length - 1];
  const ema200 =
    emaValues[emaValues.length - 1][emaValues[emaValues.length - 1].length - 1];
  const spreadRatio = lastClose > 0 ? Math.abs(ema9 - ema200) / lastClose : 0;
  const hasStructuralSpread = spreadRatio >= MIN_EMA_SPREAD_RATIO;
  const allSlopesUp = slopes.every((slope) => slope === "up");
  const allSlopesDown = slopes.every((slope) => slope === "down");

  if (alignedFor("up") && allSlopesUp && hasStructuralSpread) {
    return {
      kind: "up",
      label: "Viés de compra",
      timeframe,
      description: `EMAs 9, 20, 50, 100 e 200 alinhadas e ascendentes, mantidas nessa ordem por ${ALIGNMENT_HOLD_CANDLES} candles, com distanciamento estrutural confirmado (${timeframe}). É um sinal técnico, não uma ordem automática de compra.`,
    };
  }

  if (alignedFor("down") && allSlopesDown && hasStructuralSpread) {
    return {
      kind: "down",
      label: "Viés de venda",
      timeframe,
      description: `EMAs 9, 20, 50, 100 e 200 alinhadas e descendentes, mantidas nessa ordem por ${ALIGNMENT_HOLD_CANDLES} candles, com distanciamento estrutural confirmado (${timeframe}). É um sinal técnico, não uma ordem automática de venda.`,
    };
  }

  return {
    kind: "sideways",
    label: "Lateral — aguardar",
    timeframe,
    description: `As EMAs estão sem alinhamento direcional persistente, sem inclinação conjunta ou sem distanciamento estrutural suficiente. Sinal suspenso: aguardar confirmação e preservar capital (${timeframe}).`,
  };
};
