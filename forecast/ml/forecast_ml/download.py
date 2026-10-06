"""Download daily candles from Yahoo Finance into the CSV layout used by the pipeline.

Mirrors the API's YahooFinanceAdapter. Each ticker file is rewritten from a full
download, because Yahoo re-adjusts the whole adjusted_close history after every
dividend/split; merging old and new rows would mix two adjustment bases. Files are
Parquet, several times smaller than CSV; a ticker's older CSV is replaced, never kept
next to it, because its stale adjustment would conflict with the new download.

--missing-only skips tickers that already have a file, and --convert-csv rewrites the
existing CSVs as Parquet without downloading anything.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
from pathlib import Path
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

import pandas as pd

from forecast_ml.config import RAW_DATA_DIR, TICKER_NAMES_PATH
from forecast_ml.dataset import COLUMN_ORDER
from forecast_ml.universe import read_universe

CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"


def fetch_daily(
    ticker: str, start: str, end: str, retries: int = 3
) -> tuple[pd.DataFrame, str | None]:
    """Candles plus the company name Yahoo reports for the ticker."""
    period1 = int(datetime.fromisoformat(start).replace(tzinfo=timezone.utc).timestamp())
    period2 = int(datetime.fromisoformat(end).replace(tzinfo=timezone.utc).timestamp()) + 86_400
    url = (
        CHART_URL.format(ticker=quote(ticker))
        + f"?period1={period1}&period2={period2}&interval=1d&events=div,splits"
    )
    for attempt in range(retries):
        try:
            request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(request, timeout=20) as response:
                payload = json.load(response)
            break
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2**attempt)
    chart = payload.get("chart") or {}
    if chart.get("error"):
        raise ValueError(chart["error"].get("description", "Yahoo Finance error"))
    result = (chart.get("result") or [None])[0]
    if not result or not result.get("timestamp"):
        raise ValueError("sem candles no período")
    quote_data = result["indicators"]["quote"][0]
    adjusted = (result["indicators"].get("adjclose") or [{}])[0].get("adjclose")
    frame = pd.DataFrame(
        {
            "ticker": ticker,
            "date": pd.to_datetime(result["timestamp"], unit="s").strftime("%Y-%m-%d"),
            "open": quote_data["open"],
            "high": quote_data["high"],
            "low": quote_data["low"],
            "close": quote_data["close"],
            "adjusted_close": adjusted or quote_data["close"],
            "volume": quote_data["volume"],
        }
    )
    frame = frame.dropna()
    frame = frame.loc[(frame[["open", "high", "low", "close", "adjusted_close"]] > 0).all(axis=1)]
    # Yahoo occasionally reports OHLC slightly outside the high/low range; clamp it.
    frame["high"] = frame[["open", "high", "low", "close"]].max(axis=1)
    frame["low"] = frame[["open", "high", "low", "close"]].min(axis=1)
    meta = result.get("meta") or {}
    name = meta.get("longName") or meta.get("shortName")
    return frame.drop_duplicates("date", keep="last")[COLUMN_ORDER], name


def download(
    tickers: list[str], output_dir: Path, start: str, end: str, workers: int = 4
) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    errors = {}
    names = (
        json.loads(TICKER_NAMES_PATH.read_text(encoding="utf-8"))
        if TICKER_NAMES_PATH.exists()
        else {}
    )

    def save(ticker: str) -> int:
        frame, name = fetch_daily(ticker, start, end)
        write_candles(frame, output_dir, ticker)
        if name:
            names[ticker] = name
        return len(frame)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(save, ticker): ticker for ticker in tickers}
        for done, future in enumerate(as_completed(futures), 1):
            ticker = futures[future]
            try:
                rows = future.result()
                print(f"[{done}/{len(tickers)}] {ticker}: {rows} candles", flush=True)
            except Exception as error:  # noqa: BLE001 - report and keep downloading
                errors[ticker] = str(error)
                print(f"[{done}/{len(tickers)}] {ticker}: ERRO {error}", flush=True)
    TICKER_NAMES_PATH.write_text(json.dumps(names, indent=0, sort_keys=True), encoding="utf-8")
    return errors


def write_candles(frame: pd.DataFrame, output_dir: Path, ticker: str) -> None:
    frame = frame.assign(date=pd.to_datetime(frame["date"]))
    frame.to_parquet(output_dir / f"{ticker}.parquet", index=False, compression="zstd")
    (output_dir / f"{ticker}.csv").unlink(missing_ok=True)


def stored_tickers(data_dir: Path) -> set[str]:
    return {path.stem for pattern in ("*.parquet", "*.csv") for path in data_dir.glob(pattern)}


def convert_csvs(data_dir: Path) -> int:
    paths = sorted(data_dir.glob("*.csv"))
    for path in paths:
        write_candles(pd.read_csv(path)[COLUMN_ORDER], data_dir, path.stem)
    return len(paths)


def main() -> None:
    parser = argparse.ArgumentParser(description="Baixa candles diários do Yahoo Finance.")
    parser.add_argument("--tickers", nargs="*", help="Padrão: references/universe.csv")
    parser.add_argument("--start", default="2010-01-01")
    parser.add_argument("--end", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument(
        "--missing-only", action="store_true", help="Só tickers ainda sem arquivo em data-dir"
    )
    parser.add_argument(
        "--convert-csv", action="store_true", help="Converte os CSVs de data-dir para Parquet"
    )
    args = parser.parse_args()
    if args.convert_csv:
        print(f"{convert_csvs(args.data_dir)} CSVs convertidos para Parquet")
        return
    tickers = (
        [t.upper() for t in args.tickers] if args.tickers else read_universe()["ticker"].tolist()
    )
    if args.missing_only:
        stored = stored_tickers(args.data_dir)
        tickers = [ticker for ticker in tickers if ticker not in stored]
    errors = download(tickers, args.data_dir, args.start, args.end, args.workers)
    if errors:
        print(f"{len(errors)} falhas: {errors}")


if __name__ == "__main__":
    main()
