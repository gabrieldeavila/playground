"""Causal market features inspired by Kandle's EMA strategy."""

from itertools import pairwise

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
    required = {"ticker", "date", "open", "high", "low", "close", "volume"}
    missing = required - set(candles.columns)
    if missing:
        raise ValueError(f"Colunas ausentes para features: {sorted(missing)}")

    candles = candles.sort_values(["ticker", "date"]).reset_index(drop=True)
    feature_names = []
    ticker_frames = []
    grouped = candles.groupby("ticker", sort=False)

    for _, group in grouped:
        # Assemble each ticker separately; row-wise .loc writes into one global frame
        # scale quadratically with the universe size.
        columns_for_ticker = {
            "ticker": group["ticker"].to_numpy(),
            "date": group["date"].to_numpy(),
        }
        raw_close = group["close"].astype(float).reset_index(drop=True)
        adjustment = (
            group["adjusted_close"].astype(float).reset_index(drop=True) / raw_close
            if "adjusted_close" in group
            else pd.Series(1.0, index=raw_close.index)
        )
        close = raw_close * adjustment
        emas = {period: _kandle_ema(close, period) for period in ema_periods}
        close_values = close.to_numpy(dtype=float)
        for period, ema in emas.items():
            ema_name = f"ema_{period}"
            columns_for_ticker[ema_name] = ema.to_numpy()
            ratio_name = f"close_to_ema_{period}_pct"
            columns_for_ticker[ratio_name] = (close / ema - 1).to_numpy()
            feature_names.append(ratio_name)
            slope_name = f"ema_{period}_slope_{slope_lookback}"
            columns_for_ticker[slope_name] = (ema / ema.shift(slope_lookback) - 1).to_numpy()
            feature_names.append(slope_name)

        for faster, slower in pairwise(ema_periods):
            name = f"ema_spread_{faster}_{slower}_pct"
            columns_for_ticker[name] = (emas[faster] / emas[slower] - 1).to_numpy()
            feature_names.append(name)

        ema_matrix = np.column_stack([emas[period].to_numpy() for period in ema_periods])
        ordered = np.all(ema_matrix[:, :-1] > ema_matrix[:, 1:], axis=1)
        slopes_up = np.ones(len(group), dtype=bool)
        for period in ema_periods:
            slope = (emas[period] / emas[period].shift(slope_lookback) - 1).to_numpy()
            slopes_up &= slope > 0
        columns_for_ticker["ema_bullish_order"] = ordered.astype(float)
        columns_for_ticker["ema_slopes_up"] = slopes_up.astype(float)
        held = (
            pd.Series(ordered)
            .rolling(ALIGNMENT_HOLD_CANDLES, min_periods=ALIGNMENT_HOLD_CANDLES)
            .sum()
        )
        columns_for_ticker["ema_alignment_hold_3"] = (held == ALIGNMENT_HOLD_CANDLES).to_numpy(
            dtype=float
        )
        columns_for_ticker["ema_spread_ratio"] = (
            np.abs(ema_matrix[:, 0] - ema_matrix[:, -1]) / close_values
        )

        close_series = pd.Series(close_values)
        for lookback in (1, 5, 10, 20, 60):
            name = f"close_return_{lookback}"
            columns_for_ticker[name] = (close_series / close_series.shift(lookback) - 1).to_numpy()
            feature_names.append(name)

        open_prices = group["open"].astype(float).reset_index(drop=True) * adjustment
        high_prices = group["high"].astype(float).reset_index(drop=True) * adjustment
        low_prices = group["low"].astype(float).reset_index(drop=True) * adjustment
        previous_close = close_series.shift(1)
        true_range = pd.concat(
            [
                high_prices - low_prices,
                (high_prices - previous_close).abs(),
                (low_prices - previous_close).abs(),
            ],
            axis=1,
        ).max(axis=1)
        atr = true_range.rolling(14, min_periods=14).mean()
        safe_atr = atr.replace(0, np.nan)
        columns_for_ticker["atr_14_pct"] = (atr / close_series).to_numpy()
        candle_range = high_prices - low_prices
        columns_for_ticker["candle_close_position"] = (
            ((close_series - low_prices) / candle_range.replace(0, np.nan)).fillna(0.5).to_numpy()
        )
        columns_for_ticker["candle_range_atr"] = (candle_range / safe_atr).to_numpy()
        for period, ema in emas.items():
            valid = ema.notna()
            previous_valid = valid & ema.shift(1).notna()
            touch = (low_prices <= ema) & (high_prices >= ema)
            above = close_series > ema
            cross_up = (previous_close <= ema.shift(1)) & above
            cross_down = (previous_close >= ema.shift(1)) & (close_series < ema)
            signals = {
                "distance_atr": (close_series - ema) / safe_atr,
                "cross_up": cross_up.astype(float).where(previous_valid),
                "cross_down": cross_down.astype(float).where(previous_valid),
                "reclaim": (cross_up & touch).astype(float).where(previous_valid),
                "pullback": ((previous_close > ema.shift(1)) & touch & above)
                .astype(float)
                .where(previous_valid),
            }
            for suffix, values in signals.items():
                name = f"ema_{period}_{suffix}"
                columns_for_ticker[name] = values.to_numpy()
                feature_names.append(name)

        log_returns = np.log(close_series / previous_close)
        for window in (10, 20):
            name = f"realized_volatility_{window}"
            columns_for_ticker[name] = (
                log_returns.rolling(window, min_periods=window).std().to_numpy()
            )
            feature_names.append(name)

        columns_for_ticker["drawdown_20"] = (
            close_series / close_series.rolling(20, min_periods=20).max() - 1
        ).to_numpy()
        columns_for_ticker["gap_open_pct"] = (open_prices / previous_close - 1).to_numpy()
        columns_for_ticker["candle_body_pct"] = (close_series / open_prices - 1).to_numpy()

        volume = group["volume"].astype(float).reset_index(drop=True)
        volume_mean = volume.rolling(20, min_periods=5).mean()
        columns_for_ticker["volume_to_mean_20"] = (volume / volume_mean).to_numpy()
        ticker_frames.append(pd.DataFrame(columns_for_ticker))

    feature_names.extend(
        [
            "ema_bullish_order",
            "ema_slopes_up",
            "ema_alignment_hold_3",
            "ema_spread_ratio",
            "atr_14_pct",
            "drawdown_20",
            "gap_open_pct",
            "candle_body_pct",
            "candle_close_position",
            "candle_range_atr",
            "volume_to_mean_20",
        ]
    )
    # Retain original order and remove duplicates if callers use overlapping definitions.
    columns = list(dict.fromkeys(["ticker", "date", *feature_names]))
    if not ticker_frames:
        return pd.DataFrame(columns=columns)
    result = pd.concat(ticker_frames, ignore_index=True)
    return result[columns].sort_values(["ticker", "date"]).reset_index(drop=True)
