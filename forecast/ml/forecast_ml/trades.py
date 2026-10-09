"""Simulate the trade that follows each Kandle COMPRA signal.

Rules (decided a priori, all on daily adjusted candles):
- Entry: open of the candle after the signal.
- Stop: a close at or below entry - 3 x ATR(14) of the signal candle.
- Exit: EMA 9 closes below EMA 20 for 2 consecutive candles.
- Both exits execute at the next open. Costs: 10 bps per side.
A trade is a success (label 1) when its net return is positive. A signal on the last
candle is pending: no entry, exit or label yet, and its stop is estimated on the close.

Trend start: the signal is the first COMPRA after a base, i.e. the setup was off on
at least 50 of the 60 previous candles, and EMA 9 is already more than 1% above
EMA 20. Other COMPRAs are pullbacks in an uptrend or sideways (forecast_ml.signal_type).
"""

import numpy as np
import pandas as pd

from forecast_ml.features import _kandle_ema
from forecast_ml.kandle_signals import build_kandle_signals
from forecast_ml.labels import adjusted_ohlc, average_true_range_pct
from forecast_ml.signal_type import classify_signal, uptrend_held

STOP_ATR = 3.0
CROSS_CONFIRM_DAYS = 2
COST_PER_SIDE = 0.001
BASE_WINDOW = 60
BASE_MIN_OFF_DAYS = 50
TREND_START_MIN_SPREAD = 0.01


def simulate_trades(candles: pd.DataFrame) -> pd.DataFrame:
    """One row per Kandle signal; trades still open at the end have no exit/label."""
    signals = build_kandle_signals(candles)
    rows = []
    for (ticker, group), (_, flags) in zip(
        candles.sort_values(["ticker", "date"]).groupby("ticker", sort=True),
        signals.groupby("ticker", sort=True),
    ):
        group = group.reset_index(drop=True)
        prices = adjusted_ohlc(group)
        open_, close = prices["open"].to_numpy(), prices["close"].to_numpy()
        ema_9 = _kandle_ema(prices["close"], 9).to_numpy()
        ema_20 = _kandle_ema(prices["close"], 20).to_numpy()
        uptrend = uptrend_held(ema_20, _kandle_ema(prices["close"], 50).to_numpy())
        atr = average_true_range_pct(prices).to_numpy()
        dates = group["date"].to_numpy()
        n = len(group)
        active = flags["kandle_setup_active"].to_numpy() == 1
        # Candles without an active setup among the BASE_WINDOW before each candle.
        off_days = (
            pd.Series(~active, dtype=float)
            .rolling(BASE_WINDOW, min_periods=BASE_WINDOW)
            .sum()
            .shift(1)
            .to_numpy()
        )
        for signal in np.flatnonzero(flags["kandle_signal"].to_numpy() == 1):
            if not np.isfinite(atr[signal]):
                continue
            # A COMPRA on the last candle enters at an open that does not exist yet.
            pending = signal + 1 >= n
            entry = np.nan if pending else open_[signal + 1]
            # Pending stops are estimated from the signal close until the entry is known.
            stop = (close[signal] if pending else entry) * (1 - STOP_ATR * atr[signal])
            exit_index, reason, below = None, None, 0
            for day in range(signal + 1, n - 1):
                below = below + 1 if ema_9[day] < ema_20[day] else 0
                if close[day] <= stop:
                    exit_index, reason = day + 1, "stop"
                elif below >= CROSS_CONFIRM_DAYS:
                    exit_index, reason = day + 1, "cruzamento"
                if exit_index is not None:
                    break
            if pending:
                price, exit_date, days = np.nan, pd.NaT, np.nan
            elif exit_index is None:  # still open: mark to the last close
                price, exit_date, days = close[-1], pd.NaT, n - 1 - (signal + 1)
            else:
                price, exit_date, days = (
                    open_[exit_index],
                    dates[exit_index],
                    exit_index - (signal + 1),
                )
            net = price / entry * (1 - COST_PER_SIDE) ** 2 - 1
            trend_start = bool(
                off_days[signal] >= BASE_MIN_OFF_DAYS
                and ema_9[signal] / ema_20[signal] - 1 > TREND_START_MIN_SPREAD
            )
            rows.append(
                {
                    "ticker": ticker,
                    "signal_date": dates[signal],
                    "entry_date": pd.NaT if pending else dates[signal + 1],
                    "exit_date": exit_date,
                    "days": days,
                    # Adjusted prices, the same scale the chart draws its candles in.
                    "entry_price": entry,
                    "exit_price": price,
                    "return_pct": net * 100,
                    "exit_reason": reason,
                    "stop_price": stop / prices["close"].iloc[-1] * group["close"].iloc[-1],
                    "label": np.nan if exit_index is None else float(net > 0),
                    "pending": pending,
                    "setup_off_days_60": off_days[signal],
                    "trend_start": trend_start,
                    "signal_type": classify_signal(trend_start, uptrend[signal]),
                }
            )
    return pd.DataFrame(rows)
