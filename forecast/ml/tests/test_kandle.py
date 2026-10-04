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


def test_failed_signals_count_only_closed_losses_inside_the_window():
    dates = pd.bdate_range("2021-01-01", periods=300)
    trades = pd.DataFrame(
        {
            "ticker": "AAA",
            "signal_date": [dates[0], dates[10], dates[20], dates[250]],
            "exit_date": [dates[5], dates[15], dates[260], pd.NaT],
            "return_pct": [-3.0, -1.0, -2.0, 0.0],
        }
    )
    candles = _candles(np.full(300, 100.0)).assign(date=dates)
    features = add_features(trades, candles)
    # Day 20: two losses already closed. Day 250 (~360 days later): both fell out of the
    # 180-day window and the third loss has not closed yet.
    assert features.loc[2, "failed_signals_180d"] == 2
    assert features.loc[3, "failed_signals_180d"] == 0


def test_sideways_features_separate_trend_from_chop():
    trend = _candles(100 * 1.01 ** np.arange(200))
    chop = _candles(100 + 5 * np.sin(np.arange(200) / 3), ticker="BBB")
    candles = pd.concat([trend, chop], ignore_index=True)
    trades = pd.DataFrame(
        {
            "ticker": ["AAA", "BBB"],
            "signal_date": [trend["date"].iloc[-1]] * 2,
            "exit_date": [pd.NaT] * 2,
            "return_pct": [0.0, 0.0],
        }
    )
    features = add_features(trades, candles).set_index("ticker")
    assert features.loc["AAA", "trend_efficiency_60d"] == pytest.approx(1.0)
    assert features.loc["AAA", "ema_9_20_crosses_60d"] == 0
    assert features.loc["BBB", "trend_efficiency_60d"] < 0.2
    assert features.loc["BBB", "ema_9_20_crosses_60d"] >= 4
    assert features.loc["AAA", "distance_to_60d_high_atr"] == pytest.approx(0.0)


def test_first_signal_after_a_base_is_a_trend_start_and_repeats_are_not():
    base = np.full(120, 100.0)
    rise = 100 * 1.025 ** np.arange(1, 41)  # strong break-out: EMAs fan out quickly
    dip = rise[-1] * 0.985 ** np.arange(1, 16)
    again = dip[-1] * 1.012 ** np.arange(1, 31)
    trades = simulate_trades(_candles(np.concatenate([base, rise, dip, again])))
    assert len(trades) >= 2
    first, repeat = trades.iloc[0], trades.iloc[1]
    assert first["setup_off_days_60"] >= 50 and first["trend_start"]
    # The second COMPRA comes right after the first setup: not a base, so sideways.
    assert repeat["setup_off_days_60"] < 50 and not repeat["trend_start"]


def test_weekly_candles_aggregate_the_week_and_survive_a_mid_week_split():
    from forecast_ml.dataset import resample_weekly

    dates = pd.bdate_range("2024-01-01", periods=10)  # two Mon–Fri weeks
    raw = np.array([200, 202, 204, 100, 101, 102, 103, 104, 105, 106], dtype=float)
    adjusted = np.where(np.arange(10) < 3, raw / 2, raw)  # 2:1 split on day 4
    candles = pd.DataFrame(
        {
            "ticker": "AAA",
            "date": dates,
            "open": raw,
            "high": raw * 1.01,
            "low": raw * 0.99,
            "close": raw,
            "adjusted_close": adjusted,
            "volume": 10,
        }
    )
    weekly = resample_weekly(candles)
    assert list(weekly["date"]) == [dates[4], dates[9]]
    first = weekly.iloc[0]
    assert first["open"] == pytest.approx(100.0)  # 200 before the split, in today's terms
    assert first["high"] == pytest.approx(102 * 1.01)
    assert first["close"] == 101 and first["volume"] == 50
    assert weekly.iloc[1]["low"] == pytest.approx(102 * 0.99)


def test_market_breadth_is_the_share_of_tickers_above_their_ema_100_that_day():
    up = _candles(100 * 1.01 ** np.arange(150))
    down = _candles(100 * 0.99 ** np.arange(150), ticker="BBB")
    flat_up = _candles(100 * 1.002 ** np.arange(150), ticker="CCC")
    candles = pd.concat([up, down, flat_up], ignore_index=True)
    last = up["date"].iloc[-1]
    trades = pd.DataFrame(
        {
            "ticker": ["AAA", "BBB"],
            "signal_date": [last, up["date"].iloc[50]],
            "exit_date": [pd.NaT] * 2,
            "return_pct": [0.0, 0.0],
        }
    )
    features = add_features(trades, candles).set_index("ticker")
    assert features.loc["AAA", "market_breadth_100"] == pytest.approx(2 / 3)
    # Before EMA 100 exists no ticker counts, so breadth is unknown, not zero.
    assert np.isnan(features.loc["BBB", "market_breadth_100"])
