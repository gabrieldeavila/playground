"""Market breadth: the share of liquid stocks closing above their own 30-week average.

Below ~30% the market is in a broad sell-off. On 2011-2018, stocks already 40%+ off
their highs bought in those weeks beat SPY over the next year; the same stocks bought
in calm markets lagged it.
"""

import pandas as pd

MIN_DOLLAR_VOLUME_DAY = 5_000_000


def add_breadth(readings: pd.DataFrame) -> pd.DataFrame:
    liquid = readings["dollar_volume_day"] >= MIN_DOLLAR_VOLUME_DAY
    above = readings["above_sma_30"].astype(float).where(liquid)
    week = readings["date"].dt.to_period("W-FRI")
    return readings.assign(breadth_30=above.groupby(week).transform("mean"))
