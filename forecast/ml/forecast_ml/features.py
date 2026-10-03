"""Causal market features inspired by Kandle's EMA strategy."""

import numpy as np
import pandas as pd

DEFAULT_EMA_PERIODS = (9, 20, 50, 100, 200)
DEFAULT_SLOPE_LOOKBACK = 5
ALIGNMENT_HOLD_CANDLES = 3


def _kandle_ema(values: pd.Series, period: int) -> pd.Series:
    """Match Kandle's SMA-seeded EMA calculation."""
    result = np.full(len(values), np.nan, dtype=float)
    if len(values) < period:
        return pd.Series(result, index=values.index)

    raw_values = values.to_numpy(dtype=float)
    previous = float(np.mean(raw_values[:period]))
    result[period - 1] = previous
    smoothing = 2 / (period + 1)
    for index in range(period, len(raw_values)):
        previous = raw_values[index] * smoothing + previous * (1 - smoothing)
        result[index] = previous
    return pd.Series(result, index=values.index)


def build_features(
    candles: pd.DataFrame,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
    slope_lookback: int = DEFAULT_SLOPE_LOOKBACK,
) -> pd.DataFrame:
    """Create one feature row per candle using current and past observations only.

    The output preserves ``ticker`` and ``date``. EMA setup conditions are features,
    not filters: every date with sufficient indicator history remains a candidate.
    """
    if not ema_periods or any(period <= 0 for period in ema_periods):
        raise ValueError("ema_periods precisa conter períodos positivos")
    if tuple(sorted(set(ema_periods))) != ema_periods:
        raise ValueError("ema_periods deve ser único e estar em ordem crescente")
    if slope_lookback <= 0:
        raise ValueError("slope_lookback precisa ser positivo")
    required = {"ticker", "date", "close", "volume"}
    missing = required - set(candles.columns)
    if missing:
        raise ValueError(f"Colunas ausentes para features: {sorted(missing)}")

    candles = candles.sort_values(["ticker", "date"]).reset_index(drop=True)
    result = candles[["ticker", "date"]].copy()
    feature_names = []
    grouped = candles.groupby("ticker", sort=False)
    for period in ema_periods:
        name = f"ema_{period}"
        result[name] = np.nan

    for ticker, group in grouped:
        indices = group.index
        close = group["close"].astype(float).reset_index(drop=True)
        emas = {period: _kandle_ema(close, period) for period in ema_periods}
        close_values = close.to_numpy(dtype=float)
        for period, ema in emas.items():
            ema_name = f"ema_{period}"
            result.loc[indices, ema_name] = ema.to_numpy()
            ratio_name = f"close_to_ema_{period}_pct"
            result.loc[indices, ratio_name] = (close / ema - 1).to_numpy()
            feature_names.append(ratio_name)
            slope_name = f"ema_{period}_slope_{slope_lookback}"
            result.loc[indices, slope_name] = (ema / ema.shift(slope_lookback) - 1).to_numpy()
            feature_names.append(slope_name)

        for faster, slower in zip(ema_periods, ema_periods[1:]):
            name = f"ema_spread_{faster}_{slower}_pct"
            result.loc[indices, name] = (emas[faster] / emas[slower] - 1).to_numpy()
            feature_names.append(name)

        ema_matrix = np.column_stack([emas[period].to_numpy() for period in ema_periods])
        ordered = np.all(ema_matrix[:, :-1] > ema_matrix[:, 1:], axis=1)
        slopes_up = np.ones(len(group), dtype=bool)
        for period in ema_periods:
            slope = (emas[period] / emas[period].shift(slope_lookback) - 1).to_numpy()
            slopes_up &= slope > 0
        result.loc[indices, "ema_bullish_order"] = ordered.astype(float)
        result.loc[indices, "ema_slopes_up"] = slopes_up.astype(float)
        held = pd.Series(ordered).rolling(
            ALIGNMENT_HOLD_CANDLES, min_periods=ALIGNMENT_HOLD_CANDLES
        ).sum()
        result.loc[indices, "ema_alignment_hold_3"] = (
            held == ALIGNMENT_HOLD_CANDLES
        ).to_numpy(dtype=float)
        result.loc[indices, "ema_spread_ratio"] = np.abs(
            ema_matrix[:, 0] - ema_matrix[:, -1]
        ) / close_values

        close_series = pd.Series(close_values)
        for lookback in (1, 5, 10):
            name = f"close_return_{lookback}"
            result.loc[indices, name] = (close_series / close_series.shift(lookback) - 1).to_numpy()
            feature_names.append(name)
        volume = group["volume"].astype(float).reset_index(drop=True)
        volume_mean = volume.rolling(20, min_periods=5).mean()
        result.loc[indices, "volume_to_mean_20"] = (volume / volume_mean).to_numpy()

    feature_names.extend(
        [
            "ema_bullish_order",
            "ema_slopes_up",
            "ema_alignment_hold_3",
            "ema_spread_ratio",
            "volume_to_mean_20",
        ]
    )
    # Retain original order and remove duplicates if callers use overlapping definitions.
    columns = list(dict.fromkeys(["ticker", "date", *feature_names]))
    return result[columns].sort_values(["ticker", "date"]).reset_index(drop=True)
