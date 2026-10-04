import numpy as np
import pandas as pd
import pytest

from forecast_ml.kandle_features import add_features
from forecast_ml.kandle_signals import build_kandle_signals
from forecast_ml.trades import simulate_trades


def _candles(closes, ticker="AAA"):
    closes = np.asarray(closes, dtype=float)
    return pd.DataFrame(
        {
            "ticker": ticker,
            "date": pd.bdate_range("2020-01-01", periods=len(closes)),
            "open": closes,
            "high": closes * 1.01,
            "low": closes * 0.99,
            "close": closes,
            "adjusted_close": closes,
            "volume": 1000,
        }
    )


def _flat_rise(rise_days=60):
    return np.concatenate([np.full(120, 100.0), 100 * 1.01 ** np.arange(1, rise_days + 1)])


def test_signal_is_first_candle_of_the_setup_and_causal():
    candles = _candles(np.concatenate([_flat_rise(), np.full(20, 150.0)]))
    signals = build_kandle_signals(candles)
    starts = np.flatnonzero(signals["kandle_signal"] == 1)
    assert len(starts) == 1
    assert signals.loc[starts[0] - 1, "kandle_setup_active"] == 0
    prefix = build_kandle_signals(candles.iloc[: starts[0] + 1])
    assert prefix["kandle_signal"].iloc[-1] == 1


def test_trade_exits_after_two_closes_with_ema_9_below_ema_20():
    closes = np.concatenate([_flat_rise(), 100 * 1.01**60 * 0.99 ** np.arange(1, 41)])
    candles = _candles(closes)
    trade = simulate_trades(candles).iloc[0]
    signal = candles.index[candles["date"] == trade["signal_date"]][0]
    assert trade["entry_date"] == candles.loc[signal + 1, "date"]
    assert trade["exit_reason"] == "cruzamento"
    exit_row = candles.index[candles["date"] == trade["exit_date"]][0]
    expected = closes[exit_row] / closes[signal + 1] * 0.999**2 - 1
    assert trade["return_pct"] == pytest.approx(expected * 100)
    assert trade["label"] == float(expected > 0)


def test_stop_uses_the_close_not_the_intraday_low():
    closes = np.concatenate([_flat_rise(), np.full(30, 100 * 1.01**60)])
    candles = _candles(closes)
    signal = candles.index[candles["date"] == simulate_trades(candles)["signal_date"].iloc[0]][0]
    wick = signal + 3
    candles.loc[wick, "low"] = 1.0  # deep wick, close unchanged: no stop
    assert simulate_trades(candles).iloc[0]["exit_date"] != candles.loc[wick + 1, "date"]
    candles.loc[wick:, ["open", "high", "low", "close", "adjusted_close"]] = 50.0
    trade = simulate_trades(candles).iloc[0]
    assert trade["exit_reason"] == "stop"
    assert trade["exit_date"] == candles.loc[wick + 1, "date"]
    assert trade["label"] == 0


def test_open_trade_has_no_label():
    trade = simulate_trades(_candles(_flat_rise(80))).iloc[0]
    assert pd.isna(trade["exit_date"]) and pd.isna(trade["label"])


def test_previous_trade_return_only_uses_trades_closed_before_the_signal():
    dates = pd.bdate_range("2021-01-01", periods=10)
    trades = pd.DataFrame(
        {
            "ticker": "AAA",
            "signal_date": [dates[0], dates[3], dates[6]],
            "exit_date": [dates[5], dates[8], pd.NaT],
            "return_pct": [4.0, -2.0, 1.0],
        }
    )
    candles = _candles(np.full(10, 100.0)).assign(date=dates)
    features = add_features(trades, candles)
    # Signal on day 3: the first trade is still open (exits day 5), so nothing known yet.
    assert np.isnan(features.loc[1, "previous_trade_return"])
    assert features.loc[2, "previous_trade_return"] == 4.0
