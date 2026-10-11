"""Build the weekly table every bot reads: chart readings, SPY-relative outcomes,
market breadth, point-in-time fundamentals, insider trades and the weekly value rank."""

from pathlib import Path

from loguru import logger
import pandas as pd

from forecast_ml.bots.market_breadth import add_breadth
from forecast_ml.bots.outcomes import add_outcomes
from forecast_ml.bots.value_rank import add_value_rank
from forecast_ml.bots.weekly_indicators import build_indicators
from forecast_ml.config import EXTERNAL_DATA_DIR, INTERIM_DATA_DIR, RAW_DATA_DIR
from forecast_ml.dataset import load_market_data, resample_weekly
from forecast_ml.fundamentals.point_in_time import build_fundamentals
from forecast_ml.fundamentals.splits_download import read_splits
from forecast_ml.insiders.insider_table import add_insider_columns
from forecast_ml.universe import read_universe

TABLE_PATH = INTERIM_DATA_DIR / "bot_table.parquet"
MARKET_TICKER = "SPY"


def build_table(
    data_dir: Path = RAW_DATA_DIR, market_dir: Path = EXTERNAL_DATA_DIR
) -> pd.DataFrame:
    """``market_dir`` holds SPY's candles; both directories must cover the same years."""
    logger.info("Lendo candles e montando semanais")
    weekly = resample_weekly(load_market_data(data_dir))
    market = resample_weekly(load_market_data(market_dir, MARKET_TICKER))
    logger.info("Indicadores e resultados")
    table = add_breadth(add_outcomes(build_indicators(weekly, market), market))
    logger.info("Fundamentos ponto-no-tempo")
    fundamentals = build_fundamentals(weekly, read_splits())
    table = table.merge(fundamentals, on=["ticker", "date"], how="left", validate="1:1")
    logger.info("Compras de insiders (Form 4)")
    table = add_insider_columns(table)
    sectors = read_universe().set_index("ticker")["sector"]
    return add_value_rank(table).assign(sector=lambda t: t["ticker"].map(sectors))


def load_table(rebuild: bool = False) -> pd.DataFrame:
    if rebuild or not TABLE_PATH.exists():
        table = build_table()
        TABLE_PATH.parent.mkdir(parents=True, exist_ok=True)
        table.to_parquet(TABLE_PATH, index=False)
        return table
    return pd.read_parquet(TABLE_PATH)
