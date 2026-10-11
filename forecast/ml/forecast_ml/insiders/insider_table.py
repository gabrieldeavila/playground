"""Attach the insider columns to the weekly bot table, reading the saved Form 4 files."""

from loguru import logger
import pandas as pd

from forecast_ml.insiders.form4_download import read_ciks, read_trades
from forecast_ml.insiders.insider_weekly import COLUMNS, insider_columns


def add_insider_columns(table: pd.DataFrame) -> pd.DataFrame:
    """``table`` plus insider columns; NaN columns when Form 4 data was never downloaded."""
    try:
        trades, ciks = read_trades(), read_ciks()
    except FileNotFoundError as error:
        logger.warning(f"sem dados de insiders: {error}")
        return table.assign(**{column: float("nan") for column in COLUMNS})
    columns = insider_columns(table[["ticker", "date"]], trades, ciks)
    return pd.concat([table.drop(columns=COLUMNS, errors="ignore"), columns], axis=1)
