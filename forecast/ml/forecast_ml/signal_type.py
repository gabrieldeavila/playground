"""What kind of COMPRA a signal is, judged on the signal candle and before it only.

- trend_start: first COMPRA after a base (see forecast_ml.trades).
- pullback: a repeat COMPRA while the bigger trend held through the dip, i.e. EMA 20
  stayed above EMA 50 on each of the last UPTREND_WINDOW candles and EMA 50 is higher
  than UPTREND_WINDOW candles ago. Only EMA 9 lost EMA 20 and then came back.
- sideways: any other repeat COMPRA; EMAs 20 and 50 braid or EMA 50 is flat or falling.
"""

import numpy as np
import pandas as pd

UPTREND_WINDOW = 20
SIGNAL_TYPES = ("trend_start", "pullback", "sideways")


def uptrend_held(ema_20: np.ndarray, ema_50: np.ndarray) -> np.ndarray:
    """Per candle: EMA 20 above EMA 50 throughout the window and EMA 50 rising over it."""
    above = pd.Series(ema_20 > ema_50, dtype=float)
    held = above.rolling(UPTREND_WINDOW, min_periods=UPTREND_WINDOW).sum().eq(UPTREND_WINDOW)
    rising = ema_50 > pd.Series(ema_50).shift(UPTREND_WINDOW).to_numpy()
    return held.to_numpy() & rising


def classify_signal(trend_start: bool, uptrend: bool) -> str:
    if trend_start:
        return "trend_start"
    return "pullback" if uptrend else "sideways"
