"""Chart data for one ticker: adjusted candles, EMA 9/20/50 and every Kandle trade.

A COMPRA on the last candle has no trade yet; it comes apart as ``pending``.

The API runs ``python -m forecast_ml.chart TICKER --timeframe daily`` and serves its
stdout. Trades come from data/processed/kandle_trades*.parquet, written by
``kandle_model predict``, so the scores are the same ones the signals list shows.
Prices are adjusted, the scale the trades were simulated in.
"""

import argparse
import json
from pathlib import Path
import re
import sys

import numpy as np
import pandas as pd
import pyarrow.parquet as pq

from forecast_ml.config import RAW_DATA_DIR
from forecast_ml.dataset import load_market_data, resample_weekly
from forecast_ml.features import _kandle_ema
from forecast_ml.labels import adjusted_ohlc
from forecast_ml.modeling.kandle_model import TIMEFRAMES, trades_path

EMA_PERIODS = (9, 20, 50)
TICKER_PATTERN = re.compile(r"^[A-Z0-9.^_-]{1,20}$")
# Exit code the API reads as "no data for this ticker" (404) instead of a failure.
NOT_FOUND = 3


def _date(value) -> str | None:
    return None if pd.isna(value) else str(pd.Timestamp(value).date())


def _rounded(values, digits: int = 4) -> list[float | None]:
    return [None if not np.isfinite(value) else round(float(value), digits) for value in values]


def chart(
    ticker: str,
    timeframe: str = "daily",
    data_dir: Path = RAW_DATA_DIR,
    trades_file: Path | None = None,
) -> dict | None:
    """None when the ticker has no candles."""
    try:
        candles = load_market_data(data_dir, ticker)
    except FileNotFoundError:
        return None
    candles = candles.loc[candles["ticker"] == ticker]
    if candles.empty:
        return None
    if timeframe == "weekly":
        candles = resample_weekly(candles)
    candles = candles.sort_values("date").reset_index(drop=True)
    prices = adjusted_ohlc(candles)

    trades_file = trades_file or trades_path(timeframe)
    test_start = pq.read_schema(trades_file).metadata[b"test_start"].decode()
    trades = pd.read_parquet(trades_file, filters=[("ticker", "==", ticker)])
    trades = trades.sort_values("signal_date")
    if "pending" not in trades:  # written before pending COMPRAs existed
        trades["pending"] = False
    pending = trades.loc[trades["pending"]].tail(1)
    trades = trades.loc[~trades["pending"]]
    # stop_price is in today's unadjusted scale; the chart draws adjusted prices.
    to_adjusted = candles["adjusted_close"].iloc[-1] / candles["close"].iloc[-1]

    return {
        "ticker": ticker,
        "timeframe": timeframe,
        "session": _date(candles["date"].iloc[-1]),
        "test_start": test_start,
        "candles": {
            "time": [_date(value) for value in candles["date"]],
            **{column: _rounded(prices[column]) for column in ("open", "high", "low", "close")},
            **{
                f"ema_{period}": _rounded(_kandle_ema(prices["close"], period))
                for period in EMA_PERIODS
            },
        },
        "trades": [
            {
                "signal_date": _date(row.signal_date),
                "entry_date": _date(row.entry_date),
                "entry_price": round(float(row.entry_price), 4),
                "exit_date": _date(row.exit_date),
                "exit_price": round(float(row.exit_price), 4),
                "days": int(row.days),
                "return_pct": round(float(row.return_pct), 2),
                "exit_reason": None if pd.isna(row.exit_reason) else row.exit_reason,
                "stop_price": round(float(row.stop_price * to_adjusted), 4),
                "score": round(float(row.score)),
                "trend_start": bool(row.trend_start),
                "liquid": bool(row.liquid),
                "test": _date(row.signal_date) >= test_start,
            }
            for row in trades.itertuples()
        ],
        "pending": None
        if pending.empty
        else {
            "signal_date": _date(pending["signal_date"].iloc[0]),
            "score": round(float(pending["score"].iloc[0])),
            "trend_start": bool(pending["trend_start"].iloc[0]),
            "stop_price": round(float(pending["stop_price"].iloc[0] * to_adjusted), 4),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Candles, EMAs e trades de um ticker (JSON).")
    parser.add_argument("ticker")
    parser.add_argument("--timeframe", choices=TIMEFRAMES, default="daily")
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    args = parser.parse_args()
    ticker = args.ticker.strip().upper()
    if not TICKER_PATTERN.match(ticker):
        parser.error("ticker inválido")
    result = chart(ticker, args.timeframe, args.data_dir)
    if result is None:
        print(f"Sem candles para {ticker}", file=sys.stderr)
        sys.exit(NOT_FOUND)
    json.dump(result, sys.stdout, allow_nan=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
