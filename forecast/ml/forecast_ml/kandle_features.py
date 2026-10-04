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
]


def _per_candle(candles: pd.DataFrame) -> pd.DataFrame:
    frames = []
    for _, group in candles.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        prices = adjusted_ohlc(group)
        close = prices["close"]
        ema = {
            p: _kandle_ema(close.reset_index(drop=True), p).to_numpy() for p in (9, 20, 50, 100)
        }
        atr = average_true_range_pct(prices).replace(0, np.nan).to_numpy()
        volume = group["volume"].astype(float)
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
                }
            )
        )
    return pd.concat(frames, ignore_index=True)


def add_features(trades: pd.DataFrame, candles: pd.DataFrame) -> pd.DataFrame:
    """Attach signal-candle features to each trade.

    ``previous_trade_return`` is the result of the same ticker's latest trade that had
    already closed before this signal, so it never peeks at an unfinished trade.
    """
    table = trades.merge(
        _per_candle(candles).rename(columns={"date": "signal_date"}),
        on=["ticker", "signal_date"],
        how="left",
        validate="one_to_one",
    )
    closed = trades.dropna(subset=["exit_date"])[["ticker", "exit_date", "return_pct"]]
    previous = pd.merge_asof(
        table[["ticker", "signal_date"]].reset_index().sort_values("signal_date"),
        closed.sort_values("exit_date").rename(columns={"return_pct": "previous_trade_return"}),
        left_on="signal_date",
        right_on="exit_date",
        by="ticker",
        allow_exact_matches=False,
    ).set_index("index")
    table["previous_trade_return"] = previous["previous_trade_return"]
    return table
