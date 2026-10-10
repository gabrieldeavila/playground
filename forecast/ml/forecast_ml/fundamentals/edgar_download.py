"""Download SEC EDGAR company facts (every XBRL value a company reported, with the date
it was filed) for each ticker in the universe, to data/external/edgar/<TICKER>.json.gz.

The filing date is what makes the data point-in-time: a backtest may only use a value
from the week after it was filed. Banks, REITs and foreign filers report few of the
tags we read, so they simply get no fundamentals.
"""

import argparse
import gzip
from http.client import IncompleteRead
import json
from pathlib import Path
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from loguru import logger
from tqdm import tqdm

from forecast_ml.config import EXTERNAL_DATA_DIR
from forecast_ml.universe import read_universe

EDGAR_DIR = EXTERNAL_DATA_DIR / "edgar"
TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json"
# SEC asks for a descriptive User-Agent and at most 10 requests per second.
USER_AGENT = "forecast-ml research bot"
REQUEST_INTERVAL = 0.12


def _get(url: str, retries: int = 3) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"})
    for attempt in range(retries):
        try:
            with urlopen(request, timeout=60) as response:
                return response.read()
        except HTTPError:
            raise
        except (OSError, IncompleteRead):  # dropped connections, truncated bodies
            if attempt == retries - 1:
                raise
            time.sleep(2**attempt)
    raise AssertionError("unreachable")


def ticker_ciks() -> dict[str, int]:
    """SEC's ticker -> CIK map; class shares use '-' like the universe (BRK-B)."""
    table = json.loads(_get(TICKERS_URL))
    return {row["ticker"].upper().replace(".", "-"): row["cik_str"] for row in table.values()}


def edgar_path(ticker: str, directory: Path = EDGAR_DIR) -> Path:
    return directory / f"{ticker}.json.gz"


def download(tickers: list[str], directory: Path = EDGAR_DIR, refresh: bool = False) -> int:
    directory.mkdir(parents=True, exist_ok=True)
    ciks = ticker_ciks()
    saved = 0
    for ticker in tqdm(tickers):
        path = edgar_path(ticker, directory)
        if ticker not in ciks or (path.exists() and not refresh):
            continue
        try:
            body = _get(FACTS_URL.format(cik=ciks[ticker]))
        except HTTPError as error:
            logger.warning(f"{ticker}: HTTP {error.code}")
            continue
        except (OSError, IncompleteRead) as error:
            logger.warning(f"{ticker}: {error!r}")
            continue
        finally:
            time.sleep(REQUEST_INTERVAL)
        path.write_bytes(gzip.compress(body))
        saved += 1
    return saved


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--refresh", action="store_true", help="baixa de novo os já salvos")
    args = parser.parse_args()
    tickers = read_universe()["ticker"].tolist()
    logger.info(f"{download(tickers, refresh=args.refresh)} arquivos novos em {EDGAR_DIR}")


if __name__ == "__main__":
    main()
