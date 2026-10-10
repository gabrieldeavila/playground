"""Summary of a group of signals over the next 52 weeks, always against SPY.

Medians and hit rates lead, because a few data errors and a few 30-baggers make the
plain mean useless. Signals cluster in time (a crash gives dozens in the same week),
so ``weeks`` and ``years_beating_spy`` show how many independent bets are behind the
numbers.
"""

import pandas as pd

HORIZON = 52
BIG_WIN, BIG_LOSS = 0.5, -0.3
EXCESS_CAP = (-1.0, 3.0)  # winsorizes the mean: a +3,000% data error counts as +300%
MIN_SIGNALS_PER_YEAR = 5


def _pct(value: float) -> float | None:
    return None if pd.isna(value) else round(float(value) * 100, 1)


def years_beating(signals: pd.DataFrame, column: str = f"excess_{HORIZON}") -> tuple[int, int]:
    """(years whose median signal beat SPY, years with enough signals to judge)."""
    by_year = signals.groupby(signals["date"].dt.year)[column]
    medians = by_year.median()[by_year.size() >= MIN_SIGNALS_PER_YEAR]
    return int((medians > 0).sum()), len(medians)


def scorecard(signals: pd.DataFrame) -> dict:
    """Signals whose 52-week window is over (rows without the outcome are ignored)."""
    done = signals.dropna(subset=[f"excess_{HORIZON}"])
    excess, returns = done[f"excess_{HORIZON}"], done[f"return_{HORIZON}"]
    if done.empty:
        return {"signals": 0}
    # Equal weight per signal week, so one crowded week counts once.
    weekly_excess = excess.clip(*EXCESS_CAP).groupby(done["date"]).mean()
    good_years, judged_years = years_beating(done)
    return {
        "signals": len(done),
        "tickers": int(done["ticker"].nunique()),
        "weeks": int(done["date"].nunique()),
        "quarters": int(done["date"].dt.to_period("Q").nunique()),
        "median_excess_pct": _pct(excess.median()),
        "beat_spy_pct": _pct((excess > 0).mean()),
        "mean_excess_capped_pct": _pct(excess.clip(*EXCESS_CAP).mean()),
        "mean_excess_per_week_pct": _pct(weekly_excess.mean()),
        "median_return_pct": _pct(returns.median()),
        "big_win_pct": _pct((returns >= BIG_WIN).mean()),
        "big_loss_pct": _pct((returns <= BIG_LOSS).mean()),
        "median_worst_drop_pct": _pct(done[f"worst_{HORIZON}"].median()),
        "years_beating_spy": good_years,
        "years_judged": judged_years,
        "median_excess_26_pct": _pct(done["excess_26"].median()),
    }


def lift(bot: dict, baseline: dict) -> dict:
    """Bot minus baseline for the headline numbers (percentage points)."""
    keys = ("median_excess_pct", "beat_spy_pct", "big_win_pct", "big_loss_pct")
    return {
        key: None
        if bot.get(key) is None or baseline.get(key) is None
        else round(bot[key] - baseline[key], 1)
        for key in keys
    }
