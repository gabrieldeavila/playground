"""Download SEC's quarterly Insider Transactions Data Sets (Forms 3/4/5 since 2006) and
keep directors' and officers' open-market trades, to data/external/form4/<quarter>.parquet.

Also saves SEC's current ticker -> CIK map (ciks.json): it links trades to the
universe, and a CIK missing from it is a company that no longer trades.
"""

import argparse
import io
import json
import re
import time
import zipfile

from loguru import logger
import pandas as pd
from tqdm import tqdm

from forecast_ml.config import EXTERNAL_DATA_DIR
from forecast_ml.fundamentals.edgar_download import REQUEST_INTERVAL, _get, ticker_ciks
from forecast_ml.insiders.form4_parse import (
    OWNER_COLUMNS,
    SUBMISSION_COLUMNS,
    TRADE_COLUMNS,
    parse_quarter,
)

FORM4_DIR = EXTERNAL_DATA_DIR / "form4"
CIKS_PATH = FORM4_DIR / "ciks.json"
INDEX_URL = "https://www.sec.gov/data-research/sec-markets-data/insider-transactions-data-sets"
ZIP_URL = "https://www.sec.gov/files/structureddata/data/insider-transactions-data-sets/{name}"
ZIP_NAME = re.compile(r"(\d{4}q[1-4])_form345\.zip")


def published_quarters() -> list[str]:
    page = _get(INDEX_URL).decode("utf-8", errors="replace")
    return sorted(set(ZIP_NAME.findall(page)))


def _read_tsv(archive: zipfile.ZipFile, name: str, columns: list[str]) -> pd.DataFrame:
    with archive.open(f"{name}.tsv") as handle:
        return pd.read_csv(handle, sep="\t", dtype=str, quoting=3, usecols=columns)


def quarter_trades(body: bytes) -> pd.DataFrame:
    archive = zipfile.ZipFile(io.BytesIO(body))
    return parse_quarter(
        _read_tsv(archive, "SUBMISSION", SUBMISSION_COLUMNS),
        _read_tsv(archive, "REPORTINGOWNER", OWNER_COLUMNS),
        _read_tsv(archive, "NONDERIV_TRANS", TRADE_COLUMNS),
    )


def download(refresh: bool = False) -> int:
    FORM4_DIR.mkdir(parents=True, exist_ok=True)
    CIKS_PATH.write_text(json.dumps(ticker_ciks()))
    saved = 0
    for quarter in tqdm(published_quarters()):
        path = FORM4_DIR / f"{quarter}.parquet"
        if path.exists() and not refresh:
            continue
        try:
            body = _get(ZIP_URL.format(name=f"{quarter}_form345.zip"))
            quarter_trades(body).to_parquet(path, index=False)
            saved += 1
        except (OSError, zipfile.BadZipFile, ValueError) as error:
            logger.warning(f"{quarter}: {error!r}")
        time.sleep(REQUEST_INTERVAL)
    return saved


def read_trades() -> pd.DataFrame:
    paths = sorted(FORM4_DIR.glob("*q*.parquet"))
    if not paths:
        raise FileNotFoundError(f"rode `make insiders` antes ({FORM4_DIR} vazio)")
    return pd.concat([pd.read_parquet(path) for path in paths], ignore_index=True)


def read_ciks() -> dict[str, int]:
    return json.loads(CIKS_PATH.read_text())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--refresh", action="store_true", help="baixa de novo os já salvos")
    args = parser.parse_args()
    logger.info(f"{download(refresh=args.refresh)} trimestres novos em {FORM4_DIR}")


if __name__ == "__main__":
    main()
