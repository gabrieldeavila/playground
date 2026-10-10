"""This week's signals from the approved bots, with what each signal is based on.

Only bots approved in reports/bots.json are scanned, with the exact variant picked
there; each one's test results go along, so a signal is never shown without them.
"""

import json

import pandas as pd

from forecast_ml.bots.catalog import grids
from forecast_ml.config import TICKER_NAMES_PATH
from forecast_ml.universe import read_universe

SIGNAL_COLUMNS = [
    "ticker",
    "close",
    "drawdown_156",
    "cash_flow_to_price",
    "earnings_to_price",
    "book_to_market",
    "fscore",
    "revenue_growth",
    "breakout_26",
]


def _company_info() -> pd.DataFrame:
    names = json.loads(TICKER_NAMES_PATH.read_text()) if TICKER_NAMES_PATH.exists() else {}
    universe = read_universe().set_index("ticker")[["index", "sector"]]
    return universe.assign(name=pd.Series(names)).reset_index()


def scan(table: pd.DataFrame, report: dict) -> dict:
    """Matches of each approved bot on the last week of ``table``."""
    last_week = table["date"].max()
    current = table[table["date"] == last_week]
    variants = {tuple(bot.describe()): bot for group in grids().values() for bot in group}
    info = _company_info()
    result = []
    for entry in report["bots"]:
        if not entry["approved"]:
            continue
        bot = variants[tuple(entry["rules"])]
        hits = current.loc[bot.matches(current), SIGNAL_COLUMNS].merge(
            info, on="ticker", how="left"
        )
        hits = hits.sort_values("cash_flow_to_price", ascending=False)
        result.append(
            {
                "bot": bot.name,
                "title": bot.title,
                "thesis": bot.thesis,
                "rules": entry["rules"],
                "validation": entry["validation"],
                "test": entry["test"],
                "signals": hits.round(4).replace({float("nan"): None}).to_dict(orient="records"),
            }
        )
    return {"generated_at": report["generated_at"], "week": str(last_week.date()), "bots": result}
