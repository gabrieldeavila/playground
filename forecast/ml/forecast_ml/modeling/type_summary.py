"""Test-period outcomes per kind of Kandle COMPRA, next to every COMPRA together."""

import pandas as pd

from forecast_ml.signal_type import SIGNAL_TYPES


def _outcomes(kind: str, chosen: pd.DataFrame) -> dict:
    return {
        "type": kind,
        "trades": len(chosen),
        "win_rate_pct": round(float(chosen["label"].mean() * 100), 1),
        "mean_return_pct": round(float(chosen["return_pct"].mean()), 2),
        "median_days": float(chosen["days"].median()),
    }


def summary_by_type(trades: pd.DataFrame) -> list[dict]:
    """One row per signal type with trades, then one for all of them."""
    groups = [(kind, trades.loc[trades["signal_type"] == kind]) for kind in SIGNAL_TYPES]
    return [_outcomes(kind, chosen) for kind, chosen in [*groups, ("all", trades)] if len(chosen)]
