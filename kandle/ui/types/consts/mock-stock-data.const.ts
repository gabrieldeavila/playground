import type { StockCandle } from "../interface/stock-candle.interface";

const closePrices = [
  182.4, 184.1, 183.6, 186.2, 188.7, 187.9, 190.4, 192.8, 191.5, 194.2, 193.1,
  196.6, 198.4, 197.2, 200.8, 202.1, 201.4, 204.7, 206.2, 205.1, 208.9, 210.4,
  209.6, 212.8, 215.3, 214.2, 216.7, 218.4, 217.1, 220.6, 222.8, 221.5, 224.9,
  226.2, 225.4, 228.7, 230.1, 229.2, 232.6, 234.8, 233.7, 236.4, 238.9, 237.5,
  240.8, 242.1, 241.6, 244.3, 246.8, 245.9,
];

const getMockTradingDate = (index: number): string => {
  const date = new Date(Date.UTC(2024, 1, 1));
  let tradingDays = 0;

  while (tradingDays < index) {
    date.setUTCDate(date.getUTCDate() + 1);
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      tradingDays += 1;
    }
  }

  return date.toISOString().slice(0, 10);
};

export const MOCK_STOCK_DATA: StockCandle[] = closePrices.map(
  (close, index) => {
    const previousClose = closePrices[index - 1] ?? close - 1.8;
    const open = Number((previousClose + ((index % 3) - 1) * 0.7).toFixed(2));

    return {
      time: getMockTradingDate(index),
      open,
      high: Number(
        (Math.max(open, close) + 1.8 + (index % 4) * 0.35).toFixed(2),
      ),
      low: Number(
        (Math.min(open, close) - 1.4 - (index % 3) * 0.25).toFixed(2),
      ),
      close,
    };
  },
);
