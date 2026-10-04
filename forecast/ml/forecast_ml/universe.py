"""Build references/universe.csv: the tickers to download, with their index and sector.

Sources: Wikipedia's current S&P 500, MidCap 400 and SmallCap 600 constituent tables,
an optional iShares IWM holdings CSV for the Russell 2000 (iShares blocks scripted
downloads, so save it from the fund page in a browser), the common shares listed on
NYSE and Nasdaq (Nasdaq Trader symbol directory plus Nasdaq's stock screener for
market cap and sector) and references/watchlist.txt.
Only current members are listed, so backtests carry survivorship bias, which is worse
for small caps: many of them are delisted or acquired and drop out of the data.
"""

import argparse
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

import pandas as pd

from forecast_ml.config import UNIVERSE_PATH, WATCHLIST_PATH

# Priority when a ticker belongs to several lists (S&P 600 names are often in the R2000).
INDEXES = ("sp500", "sp400", "sp600", "r2000", "nyse", "nasdaq", "watchlist")
# Tickers with candles in data/raw but no longer in the universe (e.g. removed members).
OTHER_INDEX = "other"
WIKIPEDIA_PAGES = {
    "sp500": ("List_of_S%26P_500_companies", 500),
    "sp400": ("List_of_S%26P_400_companies", 400),
    "sp600": ("List_of_S%26P_600_companies", 600),
}
COLUMNS = ["ticker", "index", "sector"]
VALID_TICKER = re.compile(r"^[A-Z0-9][A-Z0-9-]{0,9}$")

SYMBOL_DIRECTORY_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/{file}.txt"
SCREENER_URL = (
    "https://api.nasdaq.com/api/screener/stocks?tableonly=true&download=true&exchange={exchange}"
)
# Symbol directory file, its symbol column and, in otherlisted.txt, the exchange code.
EXCHANGES = {
    "nyse": ("otherlisted", "ACT Symbol", "N", 1000),
    "nasdaq": ("nasdaqlisted", "Symbol", None, 1000),
}
# Operating companies only: common or ordinary shares, minus ADRs, closed-end funds,
# SPACs and hybrid securities whose names also mention common or ordinary shares.
# ADRs not named as such (e.g. "Equinor ASA") fail the common-shares match instead.
COMMON_SHARES = re.compile(
    r"common stock|common shares?|ordinary shares?|class [a-z]\b", re.IGNORECASE
)
NOT_A_COMPANY = re.compile(
    r"depositary|depository|\bad[rs]\b|warrant|\bunits?\b|\brights?\b|preferred|\bnotes?\b"
    r"|debenture|%|\bfund\b|municipal|beneficial interest|\btrust\b(?! common)"
    r"|acquisition|merger corp",
    re.IGNORECASE,
)
# Below these the exchange lists are mostly SPACs (market cap 0), penny stocks and
# names whose signals the model's US$ 5M liquidity floor would discard anyway. The
# screener's volume is a single session, so this is a coarse cut, not that floor.
MIN_MARKET_CAP = 500_000_000
MIN_DOLLAR_VOLUME = 5_000_000
# Nasdaq's sector names, renamed to the GICS sectors of the S&P lists.
SCREENER_SECTORS = {
    "Basic Materials": "Materials",
    "Finance": "Financials",
    "Technology": "Information Technology",
    "Telecommunications": "Communication Services",
    "Miscellaneous": None,
    "": None,
}


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


def exchange_members(
    exchange: str,
    min_market_cap: float = MIN_MARKET_CAP,
    min_dollar_volume: float = MIN_DOLLAR_VOLUME,
) -> pd.DataFrame:
    file, _, _, expected = EXCHANGES[exchange]
    listing = pd.read_csv(
        io.StringIO(_fetch(SYMBOL_DIRECTORY_URL.format(file=file))),
        sep="|",
        dtype=str,
        keep_default_na=False,
    )
    screener = pd.DataFrame(
        json.loads(_fetch(SCREENER_URL.format(exchange=exchange)))["data"]["rows"]
    )
    members = select_exchange_members(
        listing, screener, exchange, min_market_cap, min_dollar_volume
    )
    if len(members) < expected:
        raise ValueError(f"{exchange}: {len(members)} ações, esperado ao menos {expected}")
    return members


def select_exchange_members(
    listing: pd.DataFrame,
    screener: pd.DataFrame,
    exchange: str,
    min_market_cap: float,
    min_dollar_volume: float = 0.0,
) -> pd.DataFrame:
    """Common shares in a symbol directory file worth at least ``min_market_cap`` that
    traded at least ``min_dollar_volume`` in the screener's last session."""
    _, symbol, code, _ = EXCHANGES[exchange]
    listing = listing.loc[~listing[symbol].str.startswith("File Creation Time")]
    if code:
        listing = listing.loc[listing["Exchange"] == code]
    if "Financial Status" in listing:
        # Nasdaq flags deficient, delinquent and bankrupt companies.
        listing = listing.loc[listing["Financial Status"] == "N"]
    name = listing["Security Name"]
    keep = (
        (listing["ETF"] == "N")
        & (listing["Test Issue"] == "N")
        & ~listing[symbol].str.contains("$", regex=False)  # preferred shares
        & name.str.contains(COMMON_SHARES)
        & ~name.str.contains(NOT_A_COMPANY)
    )
    tickers = listing.loc[keep, symbol].map(yahoo_symbol)
    details = pd.DataFrame(
        {
            "ticker": screener["symbol"].map(yahoo_symbol),
            "market_cap": pd.to_numeric(screener["marketCap"], errors="coerce"),
            "dollar_volume": pd.to_numeric(screener["volume"], errors="coerce")
            * pd.to_numeric(screener["lastsale"].str.lstrip("$"), errors="coerce"),
            "sector": screener["sector"].map(lambda sector: SCREENER_SECTORS.get(sector, sector)),
        }
    ).drop_duplicates("ticker")
    members = details.loc[details["ticker"].isin(tickers)]
    members = members.loc[
        (members["market_cap"] >= min_market_cap) & (members["dollar_volume"] >= min_dollar_volume)
    ]
    return members[["ticker", "sector"]].assign(index=exchange)


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


def _fetch(url: str) -> str:
    # Nasdaq's API drops requests without a browser User-Agent.
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as response:
        return response.read().decode("utf-8")


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
    parser.add_argument(
        "--exchanges",
        nargs="*",
        choices=list(EXCHANGES),
        default=list(EXCHANGES),
        help="Ações comuns listadas na bolsa (sem ADRs, fundos e SPACs); vazio desliga",
    )
    parser.add_argument("--min-market-cap", type=float, default=MIN_MARKET_CAP)
    parser.add_argument(
        "--min-dollar-volume",
        type=float,
        default=MIN_DOLLAR_VOLUME,
        help="Volume financeiro mínimo no último pregão do screener",
    )
    args = parser.parse_args()
    lists = [wikipedia_members(index) for index in args.indexes]
    sources = "Wikipedia (" + ", ".join(args.indexes) + ")"
    if args.russell_holdings:
        lists.append(russell_members(args.russell_holdings))
        sources += f", iShares IWM ({args.russell_holdings.name})"
    if args.exchanges:
        lists += [
            exchange_members(name, args.min_market_cap, args.min_dollar_volume)
            for name in args.exchanges
        ]
        sources += (
            f", Nasdaq Trader ({', '.join(args.exchanges)}, market cap >= "
            f"{args.min_market_cap:,.0f}, dollar volume >= {args.min_dollar_volume:,.0f})"
        )
    lists.append(watchlist_members())
    universe = build_universe(lists)
    write_universe(universe, sources + " and watchlist.txt")
    print(universe["index"].value_counts().to_string())
    print(f"{len(universe)} tickers em {UNIVERSE_PATH}")


if __name__ == "__main__":
    main()
