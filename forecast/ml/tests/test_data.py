from pathlib import Path

import pandas as pd
import pytest

from forecast_ml.dataset import load_market_data


def _write_csv(path: Path, rows: list[dict]) -> None:
    pd.DataFrame(rows).to_csv(path, index=False)


def _row(date: str, close: float = 100) -> dict:
    return {
        "ticker": "AAPL",
        "date": date,
        "open": close,
        "high": close + 1,
        "low": close - 1,
        "close": close,
        "adjusted_close": close,
        "volume": 1000,
    }


def test_load_market_data_sorts_and_deduplicates_identical_rows(tmp_path: Path) -> None:
    _write_csv(tmp_path / "a.csv", [_row("2024-01-02"), _row("2024-01-01")])
    _write_csv(tmp_path / "b.csv", [_row("2024-01-02")])

    result = load_market_data(tmp_path)

    assert result["date"].dt.strftime("%Y-%m-%d").tolist() == ["2024-01-01", "2024-01-02"]
    assert len(result) == 2


def test_load_market_data_rejects_conflicting_ticker_date(tmp_path: Path) -> None:
    _write_csv(tmp_path / "a.csv", [_row("2024-01-02", 100)])
    _write_csv(tmp_path / "b.csv", [_row("2024-01-02", 101)])

    with pytest.raises(ValueError, match="conflitantes"):
        load_market_data(tmp_path)


def test_load_market_data_rejects_missing_columns(tmp_path: Path) -> None:
    pd.DataFrame([{"ticker": "AAPL", "date": "2024-01-02"}]).to_csv(
        tmp_path / "invalid.csv", index=False
    )

    with pytest.raises(ValueError, match="colunas obrigatórias ausentes"):
        load_market_data(tmp_path)
