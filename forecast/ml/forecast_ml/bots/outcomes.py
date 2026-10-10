"""What happened after a signal: buy at the next week's open, hold a fixed number of
weeks, sell at that week's close. The same window is measured on SPY, so a bot only
looks good if its picks beat simply holding the market."""

import pandas as pd

HORIZONS = (26, 52)
COST_PER_SIDE = 0.001


def _market_by_week(market: pd.DataFrame) -> pd.DataFrame:
    adjustment = market["adjusted_close"] / market["close"]
    return pd.DataFrame(
        {
            "open": (market["open"] * adjustment).to_numpy(),
            "close": market["adjusted_close"].to_numpy(),
        },
        index=market["date"].dt.to_period("W-FRI"),
    )


def ticker_outcomes(readings: pd.DataFrame, market: pd.DataFrame, horizon: int) -> pd.DataFrame:
    """Forward results for every week of one ticker (NaN while the window is still open).

    ``market`` is SPY indexed by week (see _market_by_week). Entry is week i+1's open,
    exit week i+horizon's close; ``worst`` is the lowest low in between.
    """
    entry = readings["open"].shift(-1)
    exit_ = readings["close"].shift(-horizon)
    net = exit_ / entry * (1 - COST_PER_SIDE) ** 2 - 1
    week = readings["date"].dt.to_period("W-FRI")
    entry_week = week.shift(-1).map(market["open"])
    exit_week = week.shift(-horizon).map(market["close"])
    spy = exit_week.astype(float) / entry_week.astype(float) - 1
    worst = readings["low"].rolling(horizon, min_periods=horizon).min().shift(-horizon) / entry - 1
    return pd.DataFrame(
        {f"return_{horizon}": net, f"excess_{horizon}": net - spy, f"worst_{horizon}": worst}
    )


def add_outcomes(readings: pd.DataFrame, market: pd.DataFrame) -> pd.DataFrame:
    """``readings`` (grouped by ticker, sorted by date) plus forward results."""
    by_week = _market_by_week(market)
    parts = [
        pd.concat([ticker_outcomes(group, by_week, h) for h in HORIZONS], axis=1)
        for _, group in readings.groupby("ticker", sort=False)
    ]
    return pd.concat([readings, pd.concat(parts)], axis=1)
