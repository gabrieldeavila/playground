"""Python port of Kandle's EMA buy setup (kandle/ui/app/shared/historicalBuySignals.ts).

Kept rule-for-rule identical so the models learn to filter exactly the signals the
user sees in Kandle. The only intentional difference is that EMAs are computed on
adjusted closes, so splits and dividends do not create artificial setups.
"""

import numpy as np
import pandas as pd

from forecast_ml.features import _kandle_ema

KANDLE_EMA_PERIODS = (9, 20, 50, 100)
SLOPE_LOOKBACK = 5
ALIGNMENT_HOLD_CANDLES = 3
MIN_EMA_SPREAD_RATIO = 0.005

SIGNAL_COLUMNS = [
    "kandle_setup_active",
    "kandle_signal",
    "kandle_setup_age",
    "kandle_setup_exit",
]


def _setup_states(close: pd.Series, periods: tuple[int, ...]) -> np.ndarray:
    emas = np.column_stack([_kandle_ema(close, period).to_numpy() for period in periods])
    prior = np.roll(emas, SLOPE_LOOKBACK, axis=0)
    prior[:SLOPE_LOOKBACK] = np.nan
    with np.errstate(invalid="ignore"):
        ordered = np.all(emas[:, :-1] > emas[:, 1:], axis=1)
        slopes_up = np.all(emas > prior, axis=1)
        spread = np.abs(emas[:, 0] - emas[:, -1]) / close.to_numpy(dtype=float)
    held = (
        pd.Series(ordered)
        .rolling(ALIGNMENT_HOLD_CANDLES, min_periods=ALIGNMENT_HOLD_CANDLES)
        .sum()
        .eq(ALIGNMENT_HOLD_CANDLES)
        .to_numpy()
    )
    states = ordered & slopes_up & (spread >= MIN_EMA_SPREAD_RATIO) & held
    # Kandle evaluates only after the slowest EMA plus the slope lookback exist.
    states[: periods[-1] + SLOPE_LOOKBACK - 1] = False
    return states


def build_kandle_signals(
    candles: pd.DataFrame, periods: tuple[int, ...] = KANDLE_EMA_PERIODS
) -> pd.DataFrame:
    """Return per-candle setup state, first-candle buy signal, setup age and exits.

    ``kandle_signal`` marks the first confirmed candle of each setup, as Kandle draws
    it. ``kandle_setup_age`` counts candles since that signal (0 on the signal) and
    ``kandle_setup_exit`` marks the first candle after a setup is lost.
    """
    if len(periods) < 2 or tuple(sorted(set(periods))) != tuple(periods):
        raise ValueError("Kandle precisa de ao menos 2 EMAs únicas em ordem crescente")
    frames = []
    for _, group in candles.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        close = group["adjusted_close"].astype(float).reset_index(drop=True)
        active = _setup_states(close, tuple(periods))
        previous = np.concatenate([[False], active[:-1]])
        starts = active & ~previous
        setup_id = np.cumsum(starts)
        age = pd.Series(np.arange(len(active))).groupby(setup_id).cumcount().to_numpy()
        frames.append(
            pd.DataFrame(
                {
                    "ticker": group["ticker"].to_numpy(),
                    "date": group["date"].to_numpy(),
                    "kandle_setup_active": active.astype(float),
                    "kandle_signal": starts.astype(float),
                    "kandle_setup_age": np.where(active, age, np.nan),
                    "kandle_setup_exit": (previous & ~active).astype(float),
                }
            )
        )
    if not frames:
        return pd.DataFrame(columns=["ticker", "date", *SIGNAL_COLUMNS])
    return pd.concat(frames, ignore_index=True)
