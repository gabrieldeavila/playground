"""Build references/universe.csv: the tickers to download, with their index and sector.

Sources: Wikipedia's current S&P 500, MidCap 400 and SmallCap 600 constituent tables,
an optional iShares IWM holdings CSV for the Russell 2000 (iShares blocks scripted
downloads, so save it from the fund page in a browser) and references/watchlist.txt.
Only current members are listed, so backtests carry survivorship bias, which is worse
for small caps: many of them are delisted or acquired and drop out of the data.
"""

import argparse
from datetime import datetime, timezone
import io
from pathlib import Path
import re
from urllib.request import Request, urlopen

import pandas as pd

from forecast_ml.config import UNIVERSE_PATH, WATCHLIST_PATH

# Priority when a ticker belongs to several lists (S&P 600 names are often in the R2000).
INDEXES = ("sp500", "sp400", "sp600", "r2000", "watchlist")
# Tickers with candles in data/raw but no longer in the universe (e.g. removed members).
OTHER_INDEX = "other"
WIKIPEDIA_PAGES = {
    "sp500": ("List_of_S%26P_500_companies", 500),
    "sp400": ("List_of_S%26P_400_companies", 400),
    "sp600": ("List_of_S%26P_600_companies", 600),
}
COLUMNS = ["ticker", "index", "sector"]
VALID_TICKER = re.compile(r"^[A-Z0-9][A-Z0-9-]{0,9}$")


def yahoo_symbol(ticker: str) -> str:
    """Yahoo writes share classes with a dash: BRK.B -> BRK-B."""
    return ticker.strip().upper().replace(".", "-").replace("/", "-")


def wikipedia_members(index: str) -> pd.DataFrame:
    page, expected = WIKIPEDIA_PAGES[index]
    request = Request(
        f"https://en.wikipedia.org/wiki/{page}", headers={"User-Agent": "forecast-ml/0.1"}
    )
    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8")
    table = pd.read_html(io.StringIO(html), match="Symbol")[0]
    members = pd.DataFrame(
        {"ticker": table["Symbol"].map(yahoo_symbol), "sector": table["GICS Sector"]}
    )
    # A page redesign must fail loudly, never shrink the universe silently.
    if len(members) < expected * 0.95:
        raise ValueError(f"{page}: {len(members)} membros, esperado ~{expected}")
    return members.assign(index=index)


def russell_members(path: Path) -> pd.DataFrame:
    """Equities from an iShares holdings CSV (a few preamble lines, then the table)."""
    lines = Path(path).read_text(encoding="utf-8-sig").splitlines()
    header = next(i for i, line in enumerate(lines) if line.startswith("Ticker,"))
    table = pd.read_csv(io.StringIO("\n".join(lines[header:])))
    table = table.loc[table["Asset Class"] == "Equity"]
    members = pd.DataFrame(
        {"ticker": table["Ticker"].astype(str).map(yahoo_symbol), "sector": table["Sector"]}
    )
    return members.assign(index="r2000")


def watchlist_members(path: Path = WATCHLIST_PATH) -> pd.DataFrame:
    tickers = [] if not path.exists() else _ticker_lines(path)
    return pd.DataFrame({"ticker": tickers, "sector": None, "index": "watchlist"})


def build_universe(lists: list[pd.DataFrame]) -> pd.DataFrame:
    """One row per ticker, labeled with its highest-priority index."""
    universe = pd.concat(lists, ignore_index=True)[COLUMNS]
    universe = universe.loc[universe["ticker"].str.fullmatch(VALID_TICKER)]
    priority = universe["index"].map(INDEXES.index)
    return (
        universe.assign(priority=priority)
        .sort_values(["priority", "ticker"])
        .drop_duplicates("ticker", keep="first")
        .sort_values("ticker")[COLUMNS]
        .reset_index(drop=True)
    )


def write_universe(universe: pd.DataFrame, sources: str, path: Path = UNIVERSE_PATH) -> None:
    counts = ", ".join(f"{k}={v}" for k, v in universe["index"].value_counts().items())
    header = (
        f"# Download universe built by forecast_ml.universe on {datetime.now(timezone.utc).date()} from {sources}.\n"
        f"# {counts}. Current members only -> survivorship bias in backtests.\n"
    )
    path.write_text(header + universe.to_csv(index=False), encoding="utf-8")


def read_universe(path: Path = UNIVERSE_PATH) -> pd.DataFrame:
    return pd.read_csv(path, comment="#", dtype=str, keep_default_na=False)


def index_by_ticker(path: Path = UNIVERSE_PATH) -> dict[str, str]:
    return {} if not path.exists() else dict(read_universe(path)[["ticker", "index"]].values)


def _ticker_lines(path: Path) -> list[str]:
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    return [yahoo_symbol(line) for line in lines if line.strip() and not line.startswith("#")]


def main() -> None:
    parser = argparse.ArgumentParser(description="Monta references/universe.csv.")
    parser.add_argument(
        "--indexes", nargs="*", choices=list(WIKIPEDIA_PAGES), default=list(WIKIPEDIA_PAGES)
    )
    parser.add_argument(
        "--russell-holdings",
        type=Path,
        help="CSV de holdings do IWM baixado em ishares.com (Detailed Holdings → Download)",
    )
    args = parser.parse_args()
    lists = [wikipedia_members(index) for index in args.indexes]
    sources = "Wikipedia (" + ", ".join(args.indexes) + ")"
    if args.russell_holdings:
        lists.append(russell_members(args.russell_holdings))
        sources += f", iShares IWM ({args.russell_holdings.name})"
    lists.append(watchlist_members())
    universe = build_universe(lists)
    write_universe(universe, sources + " and watchlist.txt")
    print(universe["index"].value_counts().to_string())
    print(f"{len(universe)} tickers em {UNIVERSE_PATH}")


if __name__ == "__main__":
    main()
