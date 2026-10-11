"""Insider activity known at each weekly candle: trades filed in the last WINDOW_DAYS.

A trade becomes usable the day after its Form 4 was filed, never on the trade date:
insiders have two business days to file and some file weeks late. The one column
dated by trade (``insider_buyers_traded_90d``) exists only to measure how much that
look-ahead would flatter a backtest; no bot may use it.

Missing vs zero: a ticker without an SEC CIK gets NaN (unknown, so bot conditions
never hold); a ticker with a CIK and no trades gets 0.
"""

import numpy as np
import pandas as pd

from forecast_ml.insiders.insider_trades import insider_purchases, insider_sales

WINDOW_DAYS = 90
KNOWN_AFTER = pd.Timedelta(days=1)
COLUMNS = [
    "insider_buyers_90d",
    "insider_buy_value_90d",
    "insider_ceo_cfo_90d",
    "insider_routine_buyers_90d",
    "insider_sellers_90d",
    "insider_buyers_traded_90d",
]


def _window_bounds(dates: np.ndarray, times: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Index range of the sorted ``times`` inside (date - window, date] for each date."""
    window = np.timedelta64(WINDOW_DAYS, "D")
    return (
        np.searchsorted(times, dates - window, side="right"),
        np.searchsorted(times, dates, side="right"),
    )


def distinct_in_window(dates: np.ndarray, times: pd.Series, owners: pd.Series) -> np.ndarray:
    """How many different owners have an event in each date's window."""
    order = np.argsort(times.to_numpy(), kind="stable")
    sorted_times, sorted_owners = times.to_numpy()[order], owners.to_numpy()[order]
    lo, hi = _window_bounds(dates, sorted_times)
    counts = np.zeros(len(dates))
    for i in np.flatnonzero(hi > lo):
        counts[i] = len(set(sorted_owners[lo[i] : hi[i]]))
    return counts


def sum_in_window(dates: np.ndarray, times: pd.Series, values: pd.Series) -> np.ndarray:
    order = np.argsort(times.to_numpy(), kind="stable")
    cumulative = np.concatenate([[0.0], np.cumsum(values.to_numpy()[order])])
    lo, hi = _window_bounds(dates, times.to_numpy()[order])
    return cumulative[hi] - cumulative[lo]


def ticker_insider_columns(
    dates: pd.Series, purchases: pd.DataFrame, sales: pd.DataFrame
) -> pd.DataFrame:
    """Insider columns for one ticker's weekly dates (its purchases/sales only)."""
    when = dates.to_numpy(dtype="datetime64[ns]")
    opportunistic = purchases[~purchases["routine"]]
    known = opportunistic["filed"] + KNOWN_AFTER
    ceo_cfo = opportunistic[opportunistic["ceo_cfo"]]
    routine = purchases[purchases["routine"]]
    return pd.DataFrame(
        {
            "insider_buyers_90d": distinct_in_window(when, known, opportunistic["owner_cik"]),
            "insider_buy_value_90d": sum_in_window(when, known, opportunistic["value"]),
            "insider_ceo_cfo_90d": distinct_in_window(
                when, ceo_cfo["filed"] + KNOWN_AFTER, ceo_cfo["owner_cik"]
            ),
            "insider_routine_buyers_90d": distinct_in_window(
                when, routine["filed"] + KNOWN_AFTER, routine["owner_cik"]
            ),
            "insider_sellers_90d": distinct_in_window(
                when, sales["filed"] + KNOWN_AFTER, sales["owner_cik"]
            ),
            "insider_buyers_traded_90d": distinct_in_window(
                when, opportunistic["traded"], opportunistic["owner_cik"]
            ),
        },
        index=dates.index,
    )


def insider_columns(
    weekly: pd.DataFrame, trades: pd.DataFrame, ciks: dict[str, int]
) -> pd.DataFrame:
    """Insider columns aligned with ``weekly`` (ticker, date), NaN for tickers without CIK."""
    purchases = dict(tuple(insider_purchases(trades).groupby("issuer_cik")))
    sales = dict(tuple(insider_sales(trades).groupby("issuer_cik")))
    empty_buys = insider_purchases(trades.iloc[:0])
    empty_sales = insider_sales(trades.iloc[:0])
    parts = []
    for ticker, group in weekly.groupby("ticker", sort=False):
        cik = ciks.get(ticker)
        if cik is None:
            parts.append(pd.DataFrame(np.nan, index=group.index, columns=COLUMNS))
            continue
        parts.append(
            ticker_insider_columns(
                group["date"], purchases.get(cik, empty_buys), sales.get(cik, empty_sales)
            )
        )
    return pd.concat(parts).reindex(weekly.index)
