import numpy as np
import pandas as pd

from forecast_ml.insiders.contrasts import shuffled
from forecast_ml.insiders.form4_parse import parse_quarter
from forecast_ml.insiders.insider_trades import (
    ceo_cfo_flags,
    insider_purchases,
    real_trades,
    routine_flags,
)
from forecast_ml.insiders.insider_weekly import insider_columns


def _quarter():
    submissions = pd.DataFrame(
        {
            "ACCESSION_NUMBER": ["a1", "a2", "a3"],
            "FILING_DATE": ["10-MAR-2015", "11-MAR-2015", "12-MAR-2015"],
            "DOCUMENT_TYPE": ["4", "4/A", "4"],
            "ISSUERCIK": ["0000000100", "0000000100", "0000000100"],
        }
    )
    owners = pd.DataFrame(
        {
            "ACCESSION_NUMBER": ["a1", "a1", "a2", "a3"],
            "RPTOWNERCIK": ["1", "2", "1", "3"],
            # a1 is a joint filing: the fund (10% owner) and its director.
            "RPTOWNER_RELATIONSHIP": [
                "TenPercentOwner",
                "Director",
                "Director",
                "TenPercentOwner",
            ],
            "RPTOWNER_TITLE": [None, None, None, None],
        }
    )
    trades = pd.DataFrame(
        {
            "ACCESSION_NUMBER": ["a1", "a1", "a2", "a3"],
            "NONDERIV_TRANS_SK": ["1", "2", "3", "4"],
            "TRANS_DATE": ["09-MAR-2015"] * 4,
            "TRANS_CODE": ["P", "M", "P", "P"],
            "TRANS_SHARES": ["1000"] * 4,
            "TRANS_PRICEPERSHARE": ["20"] * 4,
            "TRANS_ACQUIRED_DISP_CD": ["A"] * 4,
            "SHRS_OWND_FOLWNG_TRANS": ["5000"] * 4,
        }
    )
    return submissions, owners, trades


def test_parse_quarter_keeps_original_form4_purchases_by_directors_once():
    rows = parse_quarter(*_quarter())
    # a1: the purchase once, under the director; the option exercise (M) dropped.
    # a2: an amendment. a3: a 10% owner who is not an insider.
    assert rows["accession"].tolist() == ["a1"]
    assert rows["owner_cik"].tolist() == [2]
    assert rows["issuer_cik"].tolist() == [100]
    assert rows["filed"].iloc[0] == pd.Timestamp("2015-03-10")


def _trade(
    owner=1,
    issuer=100,
    traded="2015-03-09",
    filed=None,
    code="P",
    shares=1000,
    price=20.0,
    title="",
):
    traded = pd.Timestamp(traded)
    return {
        "owner_cik": owner,
        "issuer_cik": issuer,
        "traded": traded,
        "filed": pd.Timestamp(filed) if filed else traded + pd.Timedelta(days=2),
        "code": code,
        "shares": shares,
        "price": price,
        "title": title,
    }


def test_real_trades_drops_tiny_free_and_misdated_trades():
    trades = pd.DataFrame(
        [
            _trade(),
            _trade(shares=100),  # US$ 2,000
            _trade(price=0.0),  # plan or grant booked as a purchase
            _trade(filed="2015-03-01"),  # traded after it was filed: typo
            _trade(filed="2016-03-01"),  # filed a year late: stale
            _trade(code="S"),
        ]
    )
    assert len(real_trades(trades, "P")) == 1
    assert len(real_trades(trades, "S")) == 1


def test_routine_needs_the_same_month_in_each_of_the_three_previous_years():
    trades = pd.DataFrame(
        [_trade(traded=f"{year}-03-09") for year in (2012, 2013, 2014, 2015)]
        + [_trade(owner=2, traded=f"{year}-03-09") for year in (2012, 2014, 2015)]
    )
    assert routine_flags(trades).tolist() == [False, False, False, True, False, False, False]


def test_ceo_cfo_flags_read_the_title():
    titles = pd.Series(["President & CEO", "Chief Financial Officer", "SVP Sales", None])
    assert ceo_cfo_flags(titles).tolist() == [True, True, False, False]


def _weekly(dates, ticker="AAA"):
    return pd.DataFrame({"ticker": ticker, "date": pd.to_datetime(dates)})


def test_a_purchase_counts_from_the_day_after_its_filing_for_90_days():
    trades = pd.DataFrame(
        [
            _trade(owner=1, traded="2015-03-04", filed="2015-03-06"),  # filed on a Friday
            _trade(owner=2, traded="2015-03-09", filed="2015-03-10", shares=5000),
            _trade(owner=2, traded="2015-03-11", filed="2015-03-12"),
        ]
    )
    weekly = _weekly(["2015-03-06", "2015-03-13", "2015-06-05", "2015-06-12"])
    columns = insider_columns(weekly, trades, {"AAA": 100})
    # Not known on the Friday it was filed; owner 2's two buys are one buyer.
    assert columns["insider_buyers_90d"].tolist() == [0, 2, 1, 0]
    assert columns["insider_buy_value_90d"].tolist() == [0, 140_000, 120_000, 0]
    # The trade-date column (leak check only) already sees the first buy on 03-06.
    assert columns["insider_buyers_traded_90d"].iloc[0] == 1


def test_routine_buys_and_sales_go_to_their_own_columns():
    trades = pd.DataFrame(
        [_trade(traded=f"{year}-03-09") for year in (2012, 2013, 2014, 2015)]
        + [_trade(owner=7, traded="2015-03-09", code="S")]
    )
    columns = insider_columns(_weekly(["2015-03-13"]), trades, {"AAA": 100})
    assert columns["insider_buyers_90d"].iloc[0] == 0
    assert columns["insider_routine_buyers_90d"].iloc[0] == 1
    assert columns["insider_sellers_90d"].iloc[0] == 1


def test_unknown_company_is_nan_and_known_company_without_trades_is_zero():
    weekly = pd.concat([_weekly(["2015-03-13"], "AAA"), _weekly(["2015-03-13"], "BBB")])
    weekly = weekly.reset_index(drop=True)
    columns = insider_columns(weekly, pd.DataFrame([_trade(issuer=999)]), {"AAA": 100})
    assert columns.loc[0, "insider_buyers_90d"] == 0
    assert np.isnan(columns.loc[1, "insider_buyers_90d"])


def test_insider_purchases_flags_ceo_and_routine():
    purchases = insider_purchases(pd.DataFrame([_trade(title="CEO")]))
    assert purchases["ceo_cfo"].tolist() == [True]
    assert purchases["routine"].tolist() == [False]


def test_shuffled_keeps_each_tickers_values_but_moves_them():
    values = pd.Series([1.0] * 10 + [0.0] * 190 + [0.0] * 200)
    tickers = pd.Series(["A"] * 200 + ["B"] * 200)
    result = shuffled(values, tickers, seed=1)
    assert result[:200].sum() == 10 and result[200:].sum() == 0
    assert not result[:10].eq(1).all()
