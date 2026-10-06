import numpy as np
import pandas as pd
import pytest

from forecast_ml.chart import chart
from forecast_ml.modeling.kandle_model import write_trades
from forecast_ml.trades import simulate_trades


def _candles(ticker, closes, start="2021-06-01"):
    closes = np.asarray(closes, dtype=float)
    return pd.DataFrame(
        {
            "ticker": ticker,
            "date": pd.bdate_range(start, periods=len(closes)),
            "open": closes,
            "high": closes * 1.01,
            "low": closes * 0.99,
            "close": closes,
            "adjusted_close": closes,
            "volume": 1000,
        }
    )


def _rise_and_fall():
    rise = 100 * 1.01 ** np.arange(1, 61)
    return np.concatenate([np.full(120, 100.0), rise, rise[-1] * 0.99 ** np.arange(1, 41)])


@pytest.fixture
def market(tmp_path):
    data_dir = tmp_path / "raw"
    data_dir.mkdir()
    candles = {ticker: _candles(ticker, _rise_and_fall()) for ticker in ("AAA", "BBB")}
    for ticker, frame in candles.items():
        frame.to_parquet(data_dir / f"{ticker}.parquet")
    trades = simulate_trades(pd.concat(candles.values(), ignore_index=True))
    trades = trades.assign(liquid=True, score=75.0)
    trades_file = tmp_path / "trades.parquet"
    write_trades(trades, trades_file, "2022-01-01")
    return data_dir, trades_file, candles["AAA"]


def test_chart_has_candles_emas_and_only_that_tickers_trades(market):
    data_dir, trades_file, candles = market
    result = chart("AAA", data_dir=data_dir, trades_file=trades_file)

    assert result["test_start"] == "2022-01-01"
    assert result["session"] == str(candles["date"].iloc[-1].date())
    assert len(result["candles"]["time"]) == len(candles)
    assert result["candles"]["ema_9"][:8] == [None] * 8  # warm-up has no EMA
    assert result["candles"]["ema_9"][8] == pytest.approx(100.0)
    trade = result["trades"][0]
    assert len(result["trades"]) == 1
    assert trade["exit_reason"] == "cruzamento" and trade["score"] == 75
    entry = result["candles"]["time"].index(trade["entry_date"])
    assert trade["entry_price"] == pytest.approx(result["candles"]["open"][entry])


def test_trades_from_test_start_on_are_marked_as_test(market):
    data_dir, trades_file, _ = market
    trades = pd.read_parquet(trades_file)
    signal = trades["signal_date"].iloc[0]
    for start, expected in ((signal, True), (signal + pd.Timedelta(days=1), False)):
        write_trades(trades, trades_file, str(start.date()))
        trade = chart("AAA", data_dir=data_dir, trades_file=trades_file)["trades"][0]
        assert trade["test"] is expected


def test_pending_compra_comes_apart_from_the_trades(tmp_path, market):
    data_dir, _, candles = market
    trades = simulate_trades(candles)
    signal = candles.index[candles["date"] == trades["signal_date"].iloc[0]][0]
    candles.iloc[: signal + 1].to_parquet(data_dir / "AAA.parquet")
    trades_file = tmp_path / "pending.parquet"
    pending_trades = simulate_trades(candles.iloc[: signal + 1])
    write_trades(pending_trades.assign(liquid=True, score=75.0), trades_file, "2022-01-01")

    result = chart("AAA", data_dir=data_dir, trades_file=trades_file)
    assert result["trades"] == []
    assert result["pending"]["signal_date"] == result["session"]
    assert result["pending"]["score"] == 75
    assert result["pending"]["stop_price"] < result["candles"]["close"][-1]


def test_unknown_ticker_has_no_chart(market):
    data_dir, trades_file, _ = market
    assert chart("ZZZ", data_dir=data_dir, trades_file=trades_file) is None
