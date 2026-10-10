"""Attach to each weekly candle the fundamentals known by then: the last 10-K filed at
least a day before the week closed, and valuation ratios at that week's price.

Market cap = shares from the 10-K, times the splits since it was filed, x Yahoo's
split-adjusted close; without the splits, AAPL in 2012 would look 28x cheaper.
"""

import gzip
import json
from pathlib import Path

from loguru import logger
import numpy as np
import pandas as pd

from forecast_ml.fundamentals.annual_facts import annual_facts
from forecast_ml.fundamentals.edgar_download import EDGAR_DIR, edgar_path
from forecast_ml.fundamentals.piotroski import fscore

KNOWN_AFTER = pd.Timedelta(days=1)
STALE_AFTER = pd.Timedelta(days=550)  # a 10-K is due yearly; older than ~18 months = gone
COLUMNS = [
    "fscore",
    "fscore_checks",
    "book_to_market",
    "sales_to_price",
    "cash_flow_to_price",
    "earnings_to_price",
    "revenue_growth",
]


def company_years(facts: dict) -> pd.DataFrame:
    """Fiscal years with their F-score and revenue growth, ordered by filing date."""
    years = annual_facts(facts)
    if years.empty:
        return years
    years = years.join(fscore(years))
    years["revenue_growth"] = years["revenue"] / years["revenue"].shift(1) - 1
    return years.dropna(subset=["filed"]).sort_values("filed")


def split_factor(filed: pd.Series, splits: pd.DataFrame) -> pd.Series:
    """Product of the split ratios after each filing date: shares then -> shares today."""
    return filed.map(lambda day: splits.loc[splits["date"] > day, "ratio"].prod())


def ticker_fundamentals(
    weekly: pd.DataFrame, years: pd.DataFrame, splits: pd.DataFrame
) -> pd.DataFrame:
    """Fundamentals per weekly candle of one ticker; ``splits`` are that ticker's."""
    weeks = weekly[["date", "close"]].reset_index(drop=True)
    if years.empty:
        return pd.DataFrame(np.nan, index=weeks.index, columns=COLUMNS)
    known = (
        years.assign(
            known_from=years["filed"] + KNOWN_AFTER,
            shares_today=years["shares"] * split_factor(years["filed"], splits),
        )
        .drop_duplicates("known_from", keep="last")  # late filers file two years at once
        .reset_index(drop=True)
    )
    merged = pd.merge_asof(
        weeks, known, left_on="date", right_on="known_from", direction="backward"
    )
    # Yahoo's close is split-adjusted to today's share count, like shares_today.
    market_cap = (merged["shares_today"] * merged["close"]).where(lambda cap: cap > 0)
    stale = (merged["date"] - merged["known_from"]) > STALE_AFTER
    result = pd.DataFrame(
        {
            "fscore": merged["fscore"],
            "fscore_checks": merged["fscore_checks"],
            "book_to_market": merged["equity"] / market_cap,
            "sales_to_price": merged["revenue"] / market_cap,
            "cash_flow_to_price": merged["operating_cash_flow"] / market_cap,
            "earnings_to_price": merged["net_income"] / market_cap,
            "revenue_growth": merged["revenue_growth"],
        }
    )
    return result.mask(stale | merged["known_from"].isna())


def read_facts(ticker: str, directory: Path = EDGAR_DIR) -> dict | None:
    path = edgar_path(ticker, directory)
    return json.loads(gzip.decompress(path.read_bytes())) if path.exists() else None


def _years_or_empty(ticker: str, directory: Path) -> pd.DataFrame:
    """A malformed EDGAR file costs that ticker its fundamentals, not the whole run."""
    facts = read_facts(ticker, directory)
    if not facts:
        return pd.DataFrame()
    try:
        return company_years(facts)
    except (KeyError, TypeError, ValueError) as error:
        logger.warning(f"{ticker}: fundamentos ignorados ({error})")
        return pd.DataFrame()


def build_fundamentals(
    weekly: pd.DataFrame, splits: pd.DataFrame, directory: Path = EDGAR_DIR
) -> pd.DataFrame:
    """Fundamentals for every weekly candle, in ``weekly``'s ticker/date order."""
    splits_by_ticker = dict(tuple(splits.groupby("ticker")))
    no_splits = splits.iloc[:0]
    parts = []
    for ticker, group in weekly.sort_values(["ticker", "date"]).groupby("ticker", sort=True):
        years = _years_or_empty(ticker, directory)
        part = ticker_fundamentals(group, years, splits_by_ticker.get(ticker, no_splits))
        parts.append(part.assign(ticker=ticker, date=group["date"].to_numpy()))
    return pd.concat(parts, ignore_index=True)
