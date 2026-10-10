import numpy as np
import pandas as pd

from forecast_ml.fundamentals.annual_facts import annual_facts
from forecast_ml.fundamentals.piotroski import fscore
from forecast_ml.fundamentals.point_in_time import split_factor, ticker_fundamentals


def _fact(end, val, filed, start=None, form="10-K"):
    row = {"end": end, "val": val, "filed": filed, "form": form}
    return row | ({"start": start} if start else {})


def _facts(**tags):
    return {"facts": {"us-gaap": {tag: {"units": {"USD": rows}} for tag, rows in tags.items()}}}


def test_annual_facts_keeps_the_first_reported_value_and_its_filing_date():
    facts = _facts(
        Revenues=[
            _fact("2020-12-31", 100, "2021-02-20", "2020-01-01"),
            # The next 10-K restates 2020; the backtest must still see 100.
            _fact("2020-12-31", 90, "2022-02-20", "2020-01-01"),
            _fact("2021-12-31", 120, "2022-02-20", "2021-01-01"),
            # A quarter inside a 10-K is not a fiscal year.
            _fact("2021-12-31", 30, "2022-02-20", "2021-10-01"),
        ]
    )
    years = annual_facts(facts)
    assert years["revenue"].tolist() == [100, 120]
    assert years["filed"].dt.strftime("%Y-%m-%d").tolist() == ["2021-02-20", "2022-02-20"]


def test_annual_facts_ignores_quarterly_reports():
    facts = _facts(Revenues=[_fact("2021-03-31", 10, "2021-05-01", "2021-01-01", form="10-Q")])
    assert annual_facts(facts).empty


def _years(**overrides):
    base = {
        "assets": [100.0, 100.0, 100.0],
        "net_income": [5.0, 5.0, 8.0],
        "operating_cash_flow": [6.0, 6.0, 10.0],
        "long_term_debt": [40.0, 40.0, 30.0],
        "current_assets": [50.0, 50.0, 60.0],
        "current_liabilities": [40.0, 40.0, 40.0],
        "shares": [10.0, 10.0, 10.0],
        "gross_profit": [30.0, 30.0, 40.0],
        "revenue": [100.0, 100.0, 110.0],
    }
    return pd.DataFrame(base | overrides)


def test_fscore_gives_nine_to_a_company_improving_on_every_check():
    assert fscore(_years())["fscore"].iloc[-1] == 9


def test_fscore_penalizes_dilution_and_losses():
    worse = _years(shares=[10.0, 10.0, 15.0], net_income=[5.0, 5.0, -2.0])
    assert fscore(worse)["fscore"].iloc[-1] <= 6


def test_fscore_is_missing_for_the_first_year():
    assert np.isnan(fscore(_years())["fscore"].iloc[0])


def test_split_factor_counts_only_splits_after_the_filing():
    splits = pd.DataFrame(
        {"date": pd.to_datetime(["2014-06-09", "2020-08-31"]), "ratio": [7.0, 4.0]}
    )
    filed = pd.Series(pd.to_datetime(["2013-10-30", "2015-10-28", "2021-10-29"]))
    assert split_factor(filed, splits).tolist() == [28.0, 4.0, 1.0]


def test_valuation_uses_only_filings_known_before_the_week():
    weekly = pd.DataFrame(
        {"date": pd.to_datetime(["2021-02-19", "2021-02-26"]), "close": [10.0, 10.0]}
    )
    years = pd.DataFrame(
        {
            "filed": pd.to_datetime(["2021-02-22"]),
            "shares": [100.0],
            "equity": [500.0],
            "revenue": [1000.0],
            "operating_cash_flow": [100.0],
            "net_income": [50.0],
            "fscore": [7.0],
            "fscore_checks": [9.0],
            "revenue_growth": [0.1],
        }
    )
    result = ticker_fundamentals(weekly, years, pd.DataFrame(columns=["date", "ratio"]))
    assert result["book_to_market"].isna().iloc[0]
    assert result["book_to_market"].iloc[1] == 0.5
