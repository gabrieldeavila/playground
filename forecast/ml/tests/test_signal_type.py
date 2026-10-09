import numpy as np
import pandas as pd

from forecast_ml.features import _kandle_ema
from forecast_ml.modeling.type_summary import summary_by_type
from forecast_ml.signal_type import UPTREND_WINDOW, classify_signal, uptrend_held


def _uptrend(closes) -> np.ndarray:
    close = pd.Series(np.asarray(closes, dtype=float))
    return uptrend_held(_kandle_ema(close, 20).to_numpy(), _kandle_ema(close, 50).to_numpy())


def test_steady_rise_holds_the_uptrend_and_chop_does_not():
    assert _uptrend(100 * 1.01 ** np.arange(200))[-1]
    assert not _uptrend(100 + 5 * np.sin(np.arange(200) / 3)).any()


def test_a_shallow_dip_keeps_the_uptrend_but_a_deep_one_breaks_it():
    rise = 100 * 1.01 ** np.arange(150)
    shallow = np.concatenate([rise, rise[-1] * 0.995 ** np.arange(1, 8)])
    deep = np.concatenate([rise, rise[-1] * 0.98 ** np.arange(1, 41)])
    assert _uptrend(shallow)[-1]
    assert not _uptrend(deep)[-1]


def test_uptrend_needs_a_full_window_of_history():
    assert not _uptrend(100 * 1.01 ** np.arange(UPTREND_WINDOW)).any()


def test_trend_start_wins_over_the_trend_context():
    assert classify_signal(trend_start=True, uptrend=False) == "trend_start"
    assert classify_signal(trend_start=True, uptrend=True) == "trend_start"
    assert classify_signal(trend_start=False, uptrend=True) == "pullback"
    assert classify_signal(trend_start=False, uptrend=False) == "sideways"


def test_summary_has_a_row_per_type_with_trades_then_all():
    trades = pd.DataFrame(
        {
            "signal_type": ["pullback", "pullback", "sideways"],
            "label": [1.0, 0.0, 1.0],
            "return_pct": [4.0, -2.0, 3.0],
            "days": [10, 20, 5],
        }
    )
    rows = {row["type"]: row for row in summary_by_type(trades)}
    assert list(rows) == ["pullback", "sideways", "all"]
    assert rows["pullback"]["win_rate_pct"] == 50.0
    assert rows["all"]["trades"] == 3
