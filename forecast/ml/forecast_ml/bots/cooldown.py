"""Keep one signal per ticker per cooldown: a setup that stays true for ten weeks is one
idea, not ten. Without this, a single stock can dominate a bot's statistics."""

import pandas as pd

COOLDOWN_WEEKS = 26


def first_signals(signals: pd.DataFrame, weeks: int = COOLDOWN_WEEKS) -> pd.DataFrame:
    """Signals (ticker, date) at least ``weeks`` after the previous kept one."""
    keep = []
    gap = pd.Timedelta(weeks=weeks)
    for _, group in signals.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        last = None
        for index, date in zip(group.index, group["date"]):
            if last is None or date - last >= gap:
                keep.append(index)
                last = date
    return signals.loc[keep].sort_values(["date", "ticker"])
