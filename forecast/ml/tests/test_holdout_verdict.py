from forecast_ml.insiders.holdout_verdict import gap_without_rebound, verdict

POOL = {"signals": 100, "median_excess_pct": -3.0, "beat_spy_pct": 45.0}
BOT = {"signals": 50, "median_excess_pct": 2.0, "beat_spy_pct": 52.0}


def _years(gaps):
    return [{"year": year, "delta": gap} for year, gap in gaps.items()]


def test_the_rebound_year_cannot_carry_the_holdout_alone():
    years = _years({2006: -1.0, 2007: -2.0, 2008: 1.0, 2009: 30.0, 2010: -0.5})
    assert gap_without_rebound(years) == -0.75
    result = verdict(BOT, POOL, years)
    assert result["checks"] == {
        "bot_beats_pool": True,
        "good_years": False,
        "gap_without_rebound": False,
    }
    assert not result["passed"]


def test_passes_when_the_bot_beats_the_pool_and_most_years_agree():
    years = _years({2006: 1.0, 2007: 3.0, 2008: -2.0, 2009: 10.0, 2010: 2.0})
    assert verdict(BOT, POOL, years)["passed"]


def test_a_bot_without_signals_fails():
    years = _years({2007: 1.0, 2008: 1.0, 2010: 1.0})
    assert not verdict({"signals": 0}, POOL, years)["passed"]
