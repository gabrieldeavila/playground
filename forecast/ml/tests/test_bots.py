import numpy as np
import pandas as pd

from forecast_ml.bots.cooldown import first_signals
from forecast_ml.bots.outcomes import ticker_outcomes
from forecast_ml.bots.periods import period_of
from forecast_ml.bots.rules import Bot, Condition
from forecast_ml.bots.scorecard import scorecard, years_beating
from forecast_ml.bots.weekly_indicators import _streak


def test_cooldown_keeps_one_signal_per_ticker_per_window():
    dates = pd.to_datetime(["2020-01-03", "2020-01-10", "2020-08-07", "2020-01-10"])
    signals = pd.DataFrame({"ticker": ["A", "A", "A", "B"], "date": dates})
    kept = first_signals(signals, weeks=26)
    assert sorted(zip(kept["ticker"], kept["date"].dt.strftime("%m-%d"))) == [
        ("A", "01-03"),
        ("A", "08-07"),
        ("B", "01-10"),
    ]


def test_outcome_buys_next_open_and_compares_with_spy():
    dates = pd.date_range("2020-01-03", periods=4, freq="W-FRI")
    readings = pd.DataFrame(
        {
            "date": dates,
            "open": [10.0, 10.0, 11.0, 12.0],
            "close": [10.0, 11.0, 12.0, 13.0],
            "low": [9.0, 8.0, 10.0, 11.0],
        }
    )
    market = pd.DataFrame(
        {"open": [100.0, 100.0, 100.0, 100.0], "close": [100.0, 100.0, 110.0, 110.0]},
        index=dates.to_period("W-FRI"),
    )
    result = ticker_outcomes(readings, market, horizon=2)
    # Signal week 0: enter week 1 open (10), exit week 2 close (12); SPY 100 -> 110.
    assert np.isclose(result["return_2"].iloc[0], 12 / 10 * 0.999**2 - 1)
    assert np.isclose(result["excess_2"].iloc[0], result["return_2"].iloc[0] - 0.10)
    assert np.isclose(result["worst_2"].iloc[0], 8 / 10 - 1)
    assert result["return_2"].iloc[2:].isna().all()  # window not over yet


def test_conditions_on_missing_values_never_hold():
    table = pd.DataFrame({"fscore": [8.0, np.nan, 3.0]})
    bot = Bot("x", "x", "x", (Condition("fscore", ">=", 7),))
    assert bot.matches(table).tolist() == [True, False, False]


def test_streak_counts_consecutive_flags():
    assert _streak(np.array([True, True, False, True])).tolist() == [1, 2, 0, 1]


def test_periods_split_by_date():
    dates = pd.Series(pd.to_datetime(["2010-06-01", "2015-01-01", "2020-01-01", "2023-01-01"]))
    assert period_of(dates).tolist()[1:] == ["train", "validation", "test"]
    assert pd.isna(period_of(dates).iloc[0])


def _signals(year_excess: dict[int, list[float]]) -> pd.DataFrame:
    rows = [
        {
            "ticker": f"T{i}",
            "date": pd.Timestamp(f"{year}-06-0{1 + i % 5}"),
            "excess_52": e,
            "return_52": e,
            "worst_52": -0.1,
            "excess_26": e,
        }
        for year, values in year_excess.items()
        for i, e in enumerate(values)
    ]
    return pd.DataFrame(rows)


def test_years_beating_needs_enough_signals_in_a_year():
    signals = _signals({2015: [0.1] * 5, 2016: [-0.1] * 5, 2017: [0.2] * 2})
    assert years_beating(signals) == (1, 2)


def test_scorecard_reports_hit_rate_against_spy():
    card = scorecard(_signals({2015: [0.1, 0.2, -0.1, 0.6, -0.4]}))
    assert card["signals"] == 5
    assert card["beat_spy_pct"] == 60.0
    assert card["big_win_pct"] == 20.0 and card["big_loss_pct"] == 20.0


def test_not_equal_condition_excludes_a_sector_and_missing_values():
    table = pd.DataFrame({"sector": ["Financials", "Energy", None]})
    assert Condition("sector", "!=", "Financials").holds(table).tolist() == [False, True, False]
