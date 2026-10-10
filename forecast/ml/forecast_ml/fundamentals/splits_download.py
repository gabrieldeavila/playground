"""Download every ticker's stock splits since 2009 from Yahoo, to data/external/splits.parquet.

Yahoo's ``close`` is already split-adjusted to today's share count, while a 10-K
reports the share count of its day; the splits since the filing bridge the two.
Tickers checked with no split are listed in splits_checked.txt, so a missing ticker
(never checked) is not mistaken for one that never split.
"""

import json
import time
from urllib.request import Request, urlopen

from loguru import logger
import pandas as pd
from tqdm import tqdm

from forecast_ml.config import EXTERNAL_DATA_DIR
from forecast_ml.universe import read_universe, yahoo_symbol

SPLITS_PATH = EXTERNAL_DATA_DIR / "splits.parquet"
CHECKED_PATH = EXTERNAL_DATA_DIR / "splits_checked.txt"
CHART_URL = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    "?period1=1230768000&period2={now}&interval=1mo&events=splits"
)


def fetch_splits(ticker: str) -> pd.DataFrame:
    url = CHART_URL.format(symbol=yahoo_symbol(ticker), now=int(time.time()))
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as response:
        payload = json.load(response)
    result = ((payload.get("chart") or {}).get("result") or [{}])[0] or {}
    events = (result.get("events") or {}).get("splits") or {}
    rows = [
        {
            "ticker": ticker,
            "date": pd.to_datetime(event["date"], unit="s").normalize(),
            "ratio": event["numerator"] / event["denominator"],
        }
        for event in events.values()
        if event.get("denominator")
    ]
    return pd.DataFrame(rows, columns=["ticker", "date", "ratio"])


def read_splits() -> pd.DataFrame:
    if not SPLITS_PATH.exists():
        return pd.DataFrame(columns=["ticker", "date", "ratio"])
    return pd.read_parquet(SPLITS_PATH)


def main() -> None:
    checked = set(CHECKED_PATH.read_text().split()) if CHECKED_PATH.exists() else set()
    tickers = [t for t in read_universe()["ticker"] if t not in checked]
    # Without the checked list the old file came from elsewhere: rebuild it from scratch.
    frames, failed = [read_splits()] if CHECKED_PATH.exists() else [], 0
    for ticker in tqdm(tickers):
        try:
            frames.append(fetch_splits(ticker))
            checked.add(ticker)
        except (OSError, ValueError, KeyError):  # network errors, odd payloads
            failed += 1
    splits = pd.concat(frames, ignore_index=True).drop_duplicates(["ticker", "date"])
    splits.sort_values(["ticker", "date"]).to_parquet(SPLITS_PATH, index=False)
    CHECKED_PATH.write_text("\n".join(sorted(checked)) + "\n")
    logger.info(f"{len(splits)} desdobramentos; {len(checked)} tickers checados; {failed} falhas")


if __name__ == "__main__":
    main()
