"""Per-week chart readings the bots' rules look at. Everything is causal: a value on a
week only uses that week and the ones before it."""

import numpy as np
import pandas as pd

from forecast_ml.labels import adjusted_ohlc

HISTORY_WEEKS = 156  # three years: "how far below its highs is it?"
MIN_HISTORY_WEEKS = 104
BASE_WEEKS = 26
LIQUIDITY_WEEKS = 10
SESSIONS_PER_WEEK = 5


def _streak(flags: np.ndarray) -> np.ndarray:
    """Consecutive True values ending at each position (0 where the flag is False)."""
    run = np.zeros(len(flags))
    for i, flag in enumerate(flags):
        run[i] = run[i - 1] + 1 if flag and i else float(flag)
    return run


def _prior_max(values: pd.Series, weeks: int) -> pd.Series:
    return values.shift(1).rolling(weeks, min_periods=weeks).max()


def _prior_min(values: pd.Series, weeks: int) -> pd.Series:
    return values.shift(1).rolling(weeks, min_periods=weeks).min()


def ticker_indicators(group: pd.DataFrame, market_close: pd.Series) -> pd.DataFrame:
    """Readings for one ticker's weekly candles; ``market_close`` is SPY aligned to them."""
    group = group.reset_index(drop=True)
    prices = adjusted_ohlc(group)
    close, volume = prices["close"], group["volume"].astype(float)
    sma = {weeks: close.rolling(weeks, min_periods=weeks).mean() for weeks in (10, 30, 40)}
    high = close.rolling(HISTORY_WEEKS, min_periods=MIN_HISTORY_WEEKS).max()
    drawdown = close / high - 1
    base_high, base_low = _prior_max(close, BASE_WEEKS), _prior_min(close, BASE_WEEKS)
    relative = close / market_close.reset_index(drop=True).astype(float)
    below = (sma[10] < sma[40]).to_numpy()
    weeks_below = pd.Series(_streak(below)).shift(1)
    traded = group["close"].astype(float) * volume  # real value even before splits
    return pd.DataFrame(
        {
            "ticker": group["ticker"].to_numpy(),
            "date": group["date"].to_numpy(),
            "open": prices["open"].to_numpy(),
            "low": prices["low"].to_numpy(),
            "close": close.to_numpy(),
            "drawdown_156": drawdown.to_numpy(),
            "deepest_drawdown_52": drawdown.rolling(52, min_periods=1).min().to_numpy(),
            "base_range_26": (base_high / base_low - 1).to_numpy(),
            "breakout_26": (close > base_high).to_numpy(),
            "volume_ratio_26": (
                volume / volume.shift(1).rolling(BASE_WEEKS).mean().replace(0, np.nan)
            ).to_numpy(),
            "sma_30_slope_4": (sma[30] / sma[30].shift(4) - 1).to_numpy(),
            "above_sma_30": (close > sma[30]).to_numpy(),
            "cross_10_40": ((sma[10] > sma[40]) & (weeks_below > 0)).to_numpy(),
            "weeks_10_below_40": weeks_below.to_numpy(),
            "rs_high_26": (relative >= _prior_max(relative, BASE_WEEKS)).to_numpy(),
            "rs_vs_sma_30": (
                relative / relative.rolling(30, min_periods=30).mean() - 1
            ).to_numpy(),
            "return_13": (close / close.shift(13) - 1).to_numpy(),
            "dollar_volume_day": (
                traded.rolling(LIQUIDITY_WEEKS, min_periods=LIQUIDITY_WEEKS).mean()
                / SESSIONS_PER_WEEK
            ).to_numpy(),
        }
    )


def build_indicators(weekly: pd.DataFrame, market: pd.DataFrame) -> pd.DataFrame:
    """Readings for every ticker; ``market`` holds SPY's weekly candles."""
    week = weekly["date"].dt.to_period("W-FRI")
    market_by_week = pd.Series(
        market["adjusted_close"].to_numpy(), index=market["date"].dt.to_period("W-FRI")
    )
    weekly = weekly.assign(market_close=week.map(market_by_week).to_numpy())
    frames = [
        ticker_indicators(group, group["market_close"])
        for _, group in weekly.sort_values(["ticker", "date"]).groupby("ticker", sort=True)
    ]
    return pd.concat(frames, ignore_index=True)
