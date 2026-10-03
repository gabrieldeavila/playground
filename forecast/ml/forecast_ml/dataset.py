"""Load and validate the raw market-data CSV files."""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from forecast_ml.config import RAW_DATA_DIR

REQUIRED_COLUMNS = {
    "ticker",
    "date",
    "open",
    "high",
    "low",
    "close",
    "adjusted_close",
    "volume",
}
PRICE_COLUMNS = ["open", "high", "low", "close", "adjusted_close", "volume"]
COLUMN_ORDER = ["ticker", "date", *PRICE_COLUMNS]


def load_market_data(data_dir: Path = RAW_DATA_DIR) -> pd.DataFrame:
    """Read all ticker CSVs and return unique, chronologically ordered candles.

    Identical rows for the same ticker/date are deduplicated. Conflicting rows are
    rejected rather than choosing an arbitrary value based on file ordering.
    """
    paths = sorted(Path(data_dir).glob("*.csv"))
    if not paths:
        raise FileNotFoundError(f"Nenhum CSV encontrado em {data_dir}")

    frames = []
    for path in paths:
        frame = pd.read_csv(path)
        frame.columns = [str(column).strip().lower() for column in frame.columns]
        missing = REQUIRED_COLUMNS - set(frame.columns)
        if missing:
            raise ValueError(f"{path}: colunas obrigatórias ausentes: {sorted(missing)}")
        frame = frame[COLUMN_ORDER].copy()
        frame["ticker"] = frame["ticker"].astype("string").str.strip().str.upper()
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
        for column in PRICE_COLUMNS:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
        if frame["ticker"].isna().any() or (frame["ticker"] == "").any():
            raise ValueError(f"{path}: ticker vazio ou inválido")
        if frame["date"].isna().any():
            raise ValueError(f"{path}: contém data inválida")
        if frame[PRICE_COLUMNS].isna().any().any() or not np.isfinite(
            frame[PRICE_COLUMNS].to_numpy(dtype=float)
        ).all():
            raise ValueError(f"{path}: contém preço ou volume inválido")
        if (frame[["open", "high", "low", "close", "adjusted_close"]] <= 0).any().any():
            raise ValueError(f"{path}: preços precisam ser positivos")
        if (frame["volume"] < 0).any():
            raise ValueError(f"{path}: volume não pode ser negativo")
        if (
            (frame["high"] < frame[["open", "close", "low"]].max(axis=1)).any()
            or (frame["low"] > frame[["open", "close", "high"]].min(axis=1)).any()
        ):
            raise ValueError(f"{path}: OHLC inconsistente")
        frames.append(frame)

    candles = pd.concat(frames, ignore_index=True)
    key = ["ticker", "date"]
    conflicting = candles.duplicated(key, keep=False)
    if conflicting.any():
        duplicate_rows = candles.loc[conflicting]
        value_columns = [column for column in candles.columns if column not in key]
        conflicts = duplicate_rows.groupby(key, dropna=False)[value_columns].nunique().gt(1).any(axis=1)
        if conflicts.any():
            examples = list(conflicts[conflicts].index[:5])
            raise ValueError(f"Valores conflitantes para ticker/data: {examples}")
        candles = candles.drop_duplicates(key, keep="first")

    return candles.sort_values(key).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Valida e resume os CSVs de mercado.")
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    args = parser.parse_args()
    candles = load_market_data(args.data_dir)
    print(f"{len(candles)} candles válidos; tickers: {', '.join(sorted(candles.ticker.unique()))}")
    print(f"Período: {candles.date.min().date()} a {candles.date.max().date()}")


if __name__ == "__main__":
    main()
