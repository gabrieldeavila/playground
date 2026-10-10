"""Piotroski F-score: nine yes/no checks that a company's finances are getting better.

Piotroski (2000) showed that among cheap stocks (high book-to-market), those scoring
8-9 beat those scoring 0-1 by a wide margin: cheapness alone also buys the companies
that are cheap because they are dying. Each check compares a fiscal year with the
previous one. A check whose inputs are missing counts as failed; ``fscore_checks``
says how many could be computed.
"""

import numpy as np
import pandas as pd

MIN_CHECKS = 7


def _ratio(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return numerator / denominator.where(denominator > 0)


def fscore(years: pd.DataFrame) -> pd.DataFrame:
    """F-score per fiscal year of ``annual_facts`` (the first year has no score)."""
    previous = years.shift(1)
    average_assets = (years["assets"] + previous["assets"]) / 2
    roa = _ratio(years["net_income"], previous["assets"])
    previous_roa = roa.shift(1)
    leverage = _ratio(years["long_term_debt"].fillna(0), average_assets)
    current_ratio = _ratio(years["current_assets"], years["current_liabilities"])
    gross_margin = _ratio(years["gross_profit"], years["revenue"])
    turnover = _ratio(years["revenue"], previous["assets"])
    checks = pd.DataFrame(
        {
            "profitable": roa > 0,
            "cash_positive": years["operating_cash_flow"] > 0,
            "roa_up": roa > previous_roa,
            "cash_above_earnings": years["operating_cash_flow"] > years["net_income"],
            "leverage_down": leverage < leverage.shift(1),
            "liquidity_up": current_ratio > current_ratio.shift(1),
            "no_dilution": years["shares"] <= previous["shares"],
            "margin_up": gross_margin > gross_margin.shift(1),
            "turnover_up": turnover > turnover.shift(1),
        }
    )
    inputs = pd.DataFrame(
        {
            "profitable": roa,
            "cash_positive": years["operating_cash_flow"],
            "roa_up": roa - previous_roa,
            "cash_above_earnings": years["operating_cash_flow"] - years["net_income"],
            "leverage_down": leverage - leverage.shift(1),
            "liquidity_up": current_ratio - current_ratio.shift(1),
            "no_dilution": years["shares"] - previous["shares"],
            "margin_up": gross_margin - gross_margin.shift(1),
            "turnover_up": turnover - turnover.shift(1),
        }
    )
    available = inputs.notna()
    return pd.DataFrame(
        {
            "fscore": checks.where(available, False).sum(axis=1).astype(float),
            "fscore_checks": available.sum(axis=1).astype(float),
        },
        index=years.index,
    ).where(previous["assets"].notna(), np.nan)
