"""What the chart shows at the COMPRA candle: a handful of causal features."""

import numpy as np
import pandas as pd

from forecast_ml.features import _kandle_ema
from forecast_ml.labels import adjusted_ohlc, average_true_range_pct

FEATURES = [
    "ema_spread_9_20",
    "ema_spread_20_50",
    "ema_spread_50_100",
    "ema_9_slope_5",
    "ema_20_slope_5",
    "ema_50_slope_5",
    "stretch_from_ema_9_atr",
    "atr_pct",
    "volume_vs_20d",
    "return_20d",
    "previous_trade_return",
    # Sideways-market context: choppy, range-bound tickers make EMA signals fail.
    "ema_9_20_crosses_60d",
    "trend_efficiency_60d",
    "distance_to_60d_high_atr",
    "failed_signals_180d",
    # Market context: COMPRAs while most of the market is already stretched do worst.
    "market_breadth_100",
]
SIDEWAYS_WINDOW = 60
FAILED_SIGNALS_DAYS = 180
LIQUIDITY_WINDOW = 20


def dollar_volume(group: pd.DataFrame) -> pd.Series:
    """Average traded value over the last LIQUIDITY_WINDOW candles, up to this one.

    Yahoo's close and volume are both split-adjusted, so their product is the real
    traded value even before a split. A minimum *price* filter would not be: NVDA's
    split-adjusted 2010 price is cents, which is why liquidity is judged on value only.
    """
    traded = group["close"].astype(float) * group["volume"].astype(float)
    return traded.rolling(LIQUIDITY_WINDOW, min_periods=LIQUIDITY_WINDOW).mean()


def _per_candle(candles: pd.DataFrame, min_dollar_volume: float = 0.0) -> pd.DataFrame:
    frames = []
    for _, group in candles.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        prices = adjusted_ohlc(group)
        close = prices["close"]
        ema = {
            p: _kandle_ema(close.reset_index(drop=True), p).to_numpy() for p in (9, 20, 50, 100)
        }
        atr = average_true_range_pct(prices).replace(0, np.nan).to_numpy()
        volume = group["volume"].astype(float)
        above = pd.Series(np.sign(ema[9] - ema[20]))
        crosses = (above.diff().abs() == 2).astype(float).where(above.notna())
        path = close.diff().abs().rolling(SIDEWAYS_WINDOW, min_periods=SIDEWAYS_WINDOW).sum()
        high = close.rolling(SIDEWAYS_WINDOW, min_periods=SIDEWAYS_WINDOW).max()
        frames.append(
            pd.DataFrame(
                {
                    "ticker": group["ticker"].to_numpy(),
                    "date": group["date"].to_numpy(),
                    "ema_spread_9_20": ema[9] / ema[20] - 1,
                    "ema_spread_20_50": ema[20] / ema[50] - 1,
                    "ema_spread_50_100": ema[50] / ema[100] - 1,
                    "ema_9_slope_5": ema[9] / np.roll(ema[9], 5) - 1,
                    "ema_20_slope_5": ema[20] / np.roll(ema[20], 5) - 1,
                    "ema_50_slope_5": ema[50] / np.roll(ema[50], 5) - 1,
                    "stretch_from_ema_9_atr": (close.to_numpy() / ema[9] - 1) / atr,
                    "atr_pct": atr,
                    "volume_vs_20d": (
                        volume / volume.rolling(20, min_periods=20).mean()
                    ).to_numpy(),
                    "return_20d": (close / close.shift(20) - 1).to_numpy(),
                    "ema_9_20_crosses_60d": crosses.rolling(
                        SIDEWAYS_WINDOW, min_periods=SIDEWAYS_WINDOW
                    )
                    .sum()
                    .to_numpy(),
                    # 1 = price moved in a straight line, near 0 = went nowhere zig-zagging.
                    "trend_efficiency_60d": (
                        (close - close.shift(SIDEWAYS_WINDOW)).abs() / path
                    ).to_numpy(),
                    "distance_to_60d_high_atr": ((high / close - 1) / atr).to_numpy(),
                    "above_ema_100": np.where(
                        np.isfinite(ema[100]), close.to_numpy() > ema[100], np.nan
                    ),
                    # Not a model feature: used to filter out illiquid signals.
                    "dollar_volume_20d": dollar_volume(group).to_numpy(),
                }
            )
        )
    table = pd.concat(frames, ignore_index=True)
    # Share of the liquid universe closing above its own EMA 100 on the same candle;
    # thousands of illiquid small caps would otherwise drown out the real market.
    liquid_above = table["above_ema_100"].where(table["dollar_volume_20d"] >= min_dollar_volume)
    table["market_breadth_100"] = liquid_above.groupby(table["date"]).transform("mean")
    return table.drop(columns="above_ema_100")


def add_features(
    trades: pd.DataFrame, candles: pd.DataFrame, min_dollar_volume: float = 0.0
) -> pd.DataFrame:
    """Attach signal-candle features to each trade.

    ``market_breadth_100`` counts only candles trading at least ``min_dollar_volume``.

    ``previous_trade_return`` and ``failed_signals_180d`` only use the same ticker's
    trades that had already closed before this signal, never an unfinished one.
    """
    table = trades.merge(
        _per_candle(candles, min_dollar_volume).rename(columns={"date": "signal_date"}),
        on=["ticker", "signal_date"],
        how="left",
        validate="one_to_one",
    )
    closed = trades.dropna(subset=["exit_date"])[["ticker", "exit_date", "return_pct"]]
    # Same datetime resolution as the signals, or merge_asof refuses the keys.
    closed = closed.astype({"exit_date": table["signal_date"].dtype})
    previous = pd.merge_asof(
        table[["ticker", "signal_date"]].reset_index().sort_values("signal_date"),
        closed.sort_values("exit_date").rename(columns={"return_pct": "previous_trade_return"}),
        left_on="signal_date",
        right_on="exit_date",
        by="ticker",
        allow_exact_matches=False,
    ).set_index("index")
    table["previous_trade_return"] = previous["previous_trade_return"]
    table["failed_signals_180d"] = _failed_signals(table, closed)
    return table


def _failed_signals(table: pd.DataFrame, closed: pd.DataFrame) -> pd.Series:
    """Losing trades of the same ticker closed in the window before each signal."""
    counts = pd.Series(0.0, index=table.index)
    losses = closed.loc[closed["return_pct"] <= 0].groupby("ticker")["exit_date"]
    exits_by_ticker = {ticker: np.sort(dates.to_numpy()) for ticker, dates in losses}
    window = np.timedelta64(FAILED_SIGNALS_DAYS, "D")
    for ticker, rows in table.groupby("ticker"):
        exits = exits_by_ticker.get(ticker)
        if exits is None:
            continue
        signals = rows["signal_date"].to_numpy()
        counts.loc[rows.index] = np.searchsorted(exits, signals, side="left") - np.searchsorted(
            exits, signals - window, side="left"
        )
    return counts
